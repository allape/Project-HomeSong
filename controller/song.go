package controller

import (
	"bytes"
	"encoding/json"
	"github.com/allape/gocrud"
	"github.com/allape/homesong/env"
	"github.com/allape/homesong/ffmpeg"
	"github.com/allape/homesong/model"
	"github.com/gin-gonic/gin"
	"github.com/h2non/filetype"
	"gorm.io/gorm"
	"net/http"
	"path"
	"strings"
)

func SetupSongController(group *gin.RouterGroup, db *gorm.DB) error {
	err := gocrud.New(group, db, gocrud.Crud[model.Song]{
		DisallowAnyPageSize: true,
		DisableSave:         true,
		DefaultPageSize:     DefaultPageSize,
		PageSizes:           PageSizes,
		SearchHandlers: map[string]gocrud.SearchHandler{
			"like_name": gocrud.KeywordLike("name", nil),
			"in_id":     gocrud.KeywordIDIn("id", gocrud.OverflowedArrayTrimmerFilter[gocrud.ID](DefaultPageSize)),
			"artistId":  gocrud.KeywordEqual("artist_id", nil),
			"deleted":   gocrud.NewSoftDeleteSearchHandler(""),
		},
		OnDelete: gocrud.NewSoftDeleteHandler[model.Song](gocrud.RestCoder),
	})
	if err != nil {
		return err
	}

	group.PUT("/upload", func(context *gin.Context) {
		form, err := context.MultipartForm()
		if err != nil {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), err)
			return
		}

		songFormValue := form.Value["song"]
		if len(songFormValue) == 0 {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), "song field not found")
			return
		}

		var song model.Song
		err = json.Unmarshal([]byte(songFormValue[0]), &song)
		if err != nil {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), err)
			return
		}

		song.Name = strings.TrimSpace(song.Name)
		if song.Name == "" {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), "name cannot be empty")
			return
		}

		songFormFile := form.File["file"]
		if len(songFormFile) > 0 {
			songFile, err := songFormFile[0].Open()
			if err != nil {
				gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), err)
				return
			}
			defer func() {
				_ = songFile.Close()
			}()

			filename, digest, err := gocrud.SaveAsDigestedFile(env.StaticFolder, songFormFile[0].Filename, songFile, songFormFile[0].Size, "")
			if err != nil {
				gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
				return
			}
			song.Filename = string(filename)
			song.Digest = string(digest)

			fullpath := path.Join(env.StaticFolder, string(filename))

			if song.MIME == "" {
				mime, err := filetype.MatchFile(fullpath)
				if err != nil {
					gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), err)
					return
				}
				song.MIME = mime.MIME.Value
			}

			ffprobe, ffprobeJson, err := ffmpeg.FFProbe(fullpath)
			if err != nil {
				gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
				return
			}
			song.FFProbeInfo = ffprobeJson

			if song.Cover == "" {
				coverBytes, coverExt, err := ffmpeg.ExtractCover(fullpath, ffprobe)
				if err != nil {
					gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
					return
				}

				if len(coverBytes) > 0 {
					cover, _, err := gocrud.SaveAsDigestedFile(
						env.StaticFolder,
						"cover."+string(coverExt),
						bytes.NewReader(coverBytes),
						int64(len(coverBytes)),
						"",
					)
					if err != nil {
						gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
						return
					}
					song.Cover = string(cover)
				}
			}
		}
		// empty file is allowed
		//else if song.ID == 0 {
		//	gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), "file not found")
		//	return
		//}

		if err := db.Save(&song).Error; err != nil {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
			return
		}

		context.JSON(http.StatusOK, gocrud.R[model.Song]{Code: gocrud.RestCoder.OK(), Data: song})
	})

	songArtistGroup := group.Group("/artist")
	err = gocrud.New(songArtistGroup, db, gocrud.Crud[model.SongArtist]{
		DisableDelete: true,
		DisableSave:   true,
		DisableGetOne: true,
		SearchHandlers: map[string]gocrud.SearchHandler{
			"in_songId":   gocrud.KeywordIDIn("song_id", gocrud.OverflowedArrayTrimmerFilter[gocrud.ID](DefaultPageSize)),
			"in_artistId": gocrud.KeywordIDIn("artist_id", gocrud.OverflowedArrayTrimmerFilter[gocrud.ID](DefaultPageSize)),
		},
	})
	if err != nil {
		return err
	}

	// ?artistIds=
	songArtistGroup.PUT("/save/:songId", func(context *gin.Context) {
		songId := gocrud.Pick[gocrud.ID](gocrud.IDsFromCommaSplitString(context.Param("songId")), 0, 0)
		if songId == 0 {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), "songId not found")
			return
		}

		artistIds := gocrud.IDsFromCommaSplitString(context.Query("artistIds"))

		var song model.Song
		if err := db.Model(&song).First(&song, songId).Error; err != nil {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
			return
		}

		var artists []model.Artist

		if len(artistIds) > 0 {
			if err := db.Model(&artists).Where("id IN ?", artistIds).Find(&artists).Error; err != nil {
				gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
				return
			}
		}

		if err := db.Model(&model.SongArtist{}).Where("song_id = ?", song.ID).Delete(&model.SongArtist{}).Error; err != nil {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
			return
		}

		songArtists := make([]model.SongArtist, len(artists))
		if len(artists) > 0 {
			for i, artist := range artists {
				songArtists[i] = model.SongArtist{
					SongID:   song.ID,
					ArtistID: artist.ID,
				}
			}

			if err := db.Model(&model.SongArtist{}).Save(&songArtists).Error; err != nil {
				gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
				return
			}
		}

		context.JSON(http.StatusOK, gocrud.R[[]model.SongArtist]{Code: gocrud.RestCoder.OK(), Data: songArtists})
	})

	return nil
}
