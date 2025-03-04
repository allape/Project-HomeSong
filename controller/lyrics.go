package controller

import (
	"github.com/allape/gocrud"
	"github.com/allape/homesong/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"strings"
)

func SetupLyricsController(group *gin.RouterGroup, db *gorm.DB) error {
	err := gocrud.New(group, db, gocrud.Crud[model.Lyrics]{
		DefaultPageSize: DefaultPageSize,
		SearchHandlers: map[string]gocrud.SearchHandler{
			"like_name":         gocrud.KeywordLike("name", nil),
			"in_id":             gocrud.KeywordIDIn("id", gocrud.OverflowedArrayTrimmerFilter[gocrud.ID](DefaultPageSize)),
			"deleted":           gocrud.NewSoftDeleteSearchHandler("lyrics"),
			"orderBy_index":     gocrud.SortBy("index"),
			"orderBy_createdAt": gocrud.SortBy("created_at"),
			"orderBy_updatedAt": gocrud.SortBy("updated_at"),
		},
		OnDelete: gocrud.NewSoftDeleteHandler[model.Lyrics](gocrud.RestCoder),
		WillSave: func(record *model.Lyrics, context *gin.Context, db *gorm.DB) {
			record.Name = strings.TrimSpace(record.Name)
		},
	})
	if err != nil {
		return err
	}

	return nil
}
