package controller

import (
	"github.com/allape/gocrud"
	"github.com/allape/homesong/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"strings"
)

func SetupCollectionController(group *gin.RouterGroup, db *gorm.DB) error {
	err := gocrud.New(group, db, gocrud.Crud[model.Collection]{
		DisallowAnyPageSize: true,
		DefaultPageSize:     DefaultPageSize,
		PageSizes:           PageSizes,
		SearchHandlers: map[string]gocrud.SearchHandler{
			"keywords": gocrud.KeywordLike("keywords", nil),
			"in_id":    gocrud.KeywordIDIn("id", gocrud.OverflowedArrayTrimmerFilter[gocrud.ID](DefaultPageSize)),
			"in_type":  gocrud.KeywordIn("typs", nil),
			"deleted":  gocrud.NewSoftDeleteSearchHandler(""),
		},
		OnDelete: gocrud.NewSoftDeleteHandler[model.Collection](gocrud.RestCoder),
		WillSave: func(record *model.Collection, context *gin.Context, db *gorm.DB) {
			record.Name = strings.TrimSpace(record.Name)
			record.Keywords = strings.TrimSpace(record.Keywords)
		},
	})
	if err != nil {
		return err
	}

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
		songId := gocrud.Pick[gocrud.ID](gocrud.IDsFromCommaSplitString(context.Param("songId")), 0, 0)
		if songId == 0 {
			gocrud.MakeErrorResponse(context, gocrud.RestCoder.BadRequest(), "songId not found")
			return
		}

		collectionIds := gocrud.IDsFromCommaSplitString(context.Query("collectionIds"))

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
