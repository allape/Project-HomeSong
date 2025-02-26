package controller

import (
	"github.com/allape/gocrud"
	"github.com/allape/homesong/helper"
	"github.com/allape/homesong/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupArtistController(group *gin.RouterGroup, db *gorm.DB) error {
	err := gocrud.New(group, db, gocrud.Crud[model.Artist]{
		DisallowAnyPageSize: true,
		DefaultPageSize:     DefaultPageSize,
		PageSizes:           PageSizes,
		SearchHandlers: map[string]gocrud.SearchHandler{
			"like_name": gocrud.KeywordLike("name", nil),
			"in_id":     gocrud.KeywordIn("id", helper.OverflowedArrayFilter(DefaultPageSize)),
			"deleted":   gocrud.NewSoftDeleteSearchHandler(""),
		},
		OnDelete: gocrud.NewSoftDeleteHandler[model.Artist](gocrud.RestCoder),
	})
	if err != nil {
		return err
	}

	return nil
}
