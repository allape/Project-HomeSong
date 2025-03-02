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
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"strings"
)

func SetupSongController(group *gin.RouterGroup, db *gorm.DB) error {
	err := gocrud.New(group, db, gocrud.Crud[model.Song]{
		DisableSave:     true,
		DefaultPageSize: DefaultPageSize,
		SearchHandlers: map[string]gocrud.SearchHandler{
			"like_name":         gocrud.KeywordLike("name", nil),
			"in_id":             gocrud.KeywordIDIn("id", gocrud.OverflowedArrayTrimmerFilter[gocrud.ID](DefaultPageSize)),
			"deleted":           gocrud.NewSoftDeleteSearchHandler("songs"),
			"orderBy_index":     gocrud.SortBy("index"),
			"orderBy_createdAt": gocrud.SortBy("created_at"),
			"orderBy_updatedAt": gocrud.SortBy("updated_at"),
			"collectionId": func(db *gorm.DB, values []string, with url.Values) *gorm.DB {
				if ok, value := gocrud.ValuableArray(values); ok {
					id := gocrud.Pick(gocrud.IDsFromCommaSeparatedString(value), 0, 0)
					if id == 0 {
						return db
					}
					return db.Where("id IN (SELECT collection_songs.song_id FROM collection_songs WHERE collection_songs.collection_id = ?)", id)
				}
				return db
			},
		},
		OnDelete: gocrud.NewSoftDeleteHandler[model.Song](gocrud.RestCoder),
		WillSave: func(record *model.Song, context *gin.Context, db *gorm.DB) {
			record.Name = strings.TrimSpace(record.Name)
		},
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
						"cover"+ffmpeg.GetExtByCodecName(coverExt),
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

	group.POST("/ffprobe", func(context *gin.Context) {
		_, str, err := ffmpeg.FFProbeReader(context.Request.Body)
		if err != nil {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
			return
		}
		context.JSON(http.StatusOK, str)
	})

	group.POST("/extract-cover", func(context *gin.Context) {
		tmp, err := os.CreateTemp(os.TempDir(), "song-*")
		if err != nil {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
			return
		}

		n, err := io.Copy(tmp, context.Request.Body)
		if err != nil {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
			return
		} else if context.Request.ContentLength > 0 && n != context.Request.ContentLength {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), "incomplete file")
			return
		}

		cover, codec, err := ffmpeg.ExtractCover(tmp.Name(), nil)
		if err != nil {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
			return
		}

		ext := ffmpeg.GetExtByCodecName(codec)

		context.Data(http.StatusOK, "image/"+ext, cover)
	})

	group.GET("/hotwire/:id", func(context *gin.Context) {
		id := gocrud.Pick(gocrud.IDsFromCommaSeparatedString(context.Param("id")), 0, 0)
		if id == 0 {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), "id not found")
			return
		}

		var song model.Song
		if err := db.Model(&song).First(&song, id).Error; err != nil {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
			return
		} else if song.Filename == "" {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), "file not found")
			return
		}

		filename := path.Join(env.StaticFolder, song.Filename)

		context.Header("Content-Type", "audio/mpeg")
		context.Writer.WriteHeaderNow()
		context.Writer.Flush()

		err := ffmpeg.ConvertToMp3(filename, context.Writer)
		if err != nil {
			l.Error().Println(err)
		}
	})

	return nil
}
