package controller

import (
	"fmt"
	"github.com/allape/gocrud"
	"github.com/allape/homesong/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"net/url"
	"strings"
)

func SetupCollectionController(group *gin.RouterGroup, db *gorm.DB) error {
	err := gocrud.New(group, db, gocrud.Crud[model.Collection]{
		SearchHandlers: map[string]gocrud.SearchHandler{
			"keywords": func(db *gorm.DB, values []string, with url.Values) *gorm.DB {
				if ok, value := gocrud.ValuableArray(values); ok {
					likeValue := fmt.Sprintf("%%%s%%", strings.TrimSpace(value))
					return db.Where("keywords LIKE ? OR name LIKE ? OR id = ?", likeValue, likeValue, value)
				}
				return db
			},
			"in_id":             gocrud.KeywordIDIn("id", gocrud.OverflowedArrayTrimmerFilter[gocrud.ID](DefaultPageSize)),
			"in_type":           gocrud.KeywordIn("type", nil),
			"deleted":           gocrud.NewSoftDeleteSearchHandler(""),
			"orderBy_index":     gocrud.SortBy("index"),
			"orderBy_createdAt": gocrud.SortBy("created_at"),
			"orderBy_updatedAt": gocrud.SortBy("updated_at"),
		},
		OnDelete: gocrud.NewSoftDeleteHandler[model.Collection](gocrud.RestCoder),
		WillSave: func(record *model.Collection, context *gin.Context, db *gorm.DB) {
			record.Name = strings.TrimSpace(record.Name)
			record.Keywords = strings.TrimSpace(record.Keywords)
			record.Type = model.CollectionType(strings.TrimSpace(string(record.Type)))

			if record.Type == "" {
				gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), "type is required")
				return
			}

			var exist model.Collection
			if err := db.Model(&exist).Where("`name` = ? AND `type` = ?", record.Name, record.Type).First(&exist).Error; err == nil && exist.ID != record.ID {
				gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), "name already exists")
				return
			}
		},
	})
	if err != nil {
		return err
	}

	// may require a lock
	group.PUT("/create-or-get/by-artist-names/:names", func(context *gin.Context) {
		names := gocrud.StringArrayFromCommaSeparatedString(context.Param("names"))
		if len(names) == 0 {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), "names not found")
			return
		}

		var exists []model.Collection
		if err := db.Model(&exists).Where("type = 'artist' AND name IN ?", names).Find(&exists).Error; err != nil {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
			return
		}

	out:
		for _, name := range names {
			for _, exist := range exists {
				if exist.Name == name {
					continue out
				}
			}

			var artist = model.Collection{Type: model.CollectionTypeArtist, Name: name}

			if err := db.Model(&artist).Create(&artist).Error; err != nil {
				gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
				return
			}

			exists = append(exists, artist)
		}

		context.JSON(http.StatusOK, gocrud.R[[]model.Collection]{Code: gocrud.RestCoder.OK(), Data: exists})
	})

	// inefficient
	group.GET("/random/:collectionId", func(context *gin.Context) {
		collectionId := gocrud.Pick(gocrud.IDsFromCommaSeparatedString(context.Param("collectionId")), 0, 0)

		var song model.Song

		if collectionId == 0 {
			if err := db.Model(&song).Where("songs.deleted_at IS NULL").Order("rand() DESC").First(&song).Error; err != nil {
				gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
				return
			}
		} else {
			if err := db.Model(&song).Where(
				"id IN (SELECT collection_songs.song_id FROM collection_songs WHERE collection_songs.collection_id = ?) AND songs.deleted_at IS NULL",
				collectionId,
			).Order("rand() DESC").First(&song).Error; err != nil {
				// just return error when this collection is empty
				gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
				return
			}
		}

		context.JSON(http.StatusOK, gocrud.R[model.Song]{Code: gocrud.RestCoder.OK(), Data: song})
	})

	collectionSongGroup := group.Group("/song")
	err = gocrud.New(collectionSongGroup, db, gocrud.Crud[model.CollectionSong]{
		EnableGetAll:  true,
		DisablePage:   true,
		DisableCount:  true,
		DisableSave:   true,
		DisableGetOne: true,
		DisableDelete: true,
		SearchHandlers: map[string]gocrud.SearchHandler{
			"in_songId":       gocrud.KeywordIDIn("song_id", gocrud.OverflowedArrayTrimmerFilter[gocrud.ID](DefaultPageSize)),
			"in_collectionId": gocrud.KeywordIDIn("collection_id", gocrud.OverflowedArrayTrimmerFilter[gocrud.ID](DefaultPageSize)),
		},
	})
	if err != nil {
		return err
	}

	// ?collectionIds=
	collectionSongGroup.PUT("/save-by-song/:songId", func(context *gin.Context) {
		songId := gocrud.Pick[gocrud.ID](gocrud.IDsFromCommaSeparatedString(context.Param("songId")), 0, 0)
		if songId == 0 {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), "songId not found")
			return
		}

		collectionIds := gocrud.IDsFromCommaSeparatedString(context.Query("collectionIds"))

		var song model.Song
		if err := db.Model(&song).First(&song, songId).Error; err != nil {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
			return
		}

		var collections []model.Collection

		if len(collectionIds) > 0 {
			if err := db.Model(&collections).Where("id IN ?", collectionIds).Find(&collections).Error; err != nil {
				gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
				return
			}
		}

		if err := db.Model(&model.CollectionSong{}).Where("song_id = ?", song.ID).Delete(&model.CollectionSong{}).Error; err != nil {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
			return
		}

		collectionSongs := make([]model.CollectionSong, len(collections))
		if len(collections) > 0 {
			for i, collection := range collections {
				collectionSongs[i] = model.CollectionSong{
					SongID:       song.ID,
					CollectionID: collection.ID,
				}
			}

			if err := db.Model(&model.CollectionSong{}).Save(&collectionSongs).Error; err != nil {
				gocrud.MakeErrorResponse(context, gocrud.RestCoder.InternalServerError(), err)
				return
			}
		}

		context.JSON(http.StatusOK, gocrud.R[[]model.CollectionSong]{Code: gocrud.RestCoder.OK(), Data: collectionSongs})
	})

	return nil
}
