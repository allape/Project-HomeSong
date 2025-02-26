package controller

import (
	"github.com/allape/gocrud"
	"github.com/allape/homesong/helper"
	"github.com/allape/homesong/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupSongController(group *gin.RouterGroup, db *gorm.DB) error {
	err := gocrud.New(group, db, gocrud.Crud[model.Song]{
		DisallowAnyPageSize: true,
		DefaultPageSize:     DefaultPageSize,
		PageSizes:           PageSizes,
		SearchHandlers: map[string]gocrud.SearchHandler{
			"like_name": gocrud.KeywordLike("name", nil),
			"in_id":     gocrud.KeywordIn("id", helper.OverflowedArrayFilter(DefaultPageSize)),
			"artistId":  gocrud.KeywordEqual("artist_id", nil),
			"deleted":   gocrud.NewSoftDeleteSearchHandler(""),
		},
		OnDelete: gocrud.NewSoftDeleteHandler[model.Song](gocrud.RestCoder),
	})
	if err != nil {
		return err
	}

	err = gocrud.New(group.Group("/artist"), db, gocrud.Crud[model.SongArtist]{
		DisableDelete: true,
		DisableSave:   true,
		DisableGetOne: true,
		SearchHandlers: map[string]gocrud.SearchHandler{
			"in_songId":   gocrud.KeywordIn("song_id", helper.OverflowedArrayFilter(DefaultPageSize)),
			"in_artistId": gocrud.KeywordIn("artist_id", helper.OverflowedArrayFilter(DefaultPageSize)),
		},
	})
	if err != nil {
		return err
	}

	return nil
}
