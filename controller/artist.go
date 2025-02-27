package controller

import (
	"github.com/allape/gocrud"
	"github.com/allape/homesong/model"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/url"
)

func SetupArtistController(group *gin.RouterGroup, db *gorm.DB) error {
	err := gocrud.New(group, db, gocrud.Crud[model.Artist]{
		DisallowAnyPageSize: true,
		DefaultPageSize:     DefaultPageSize,
		PageSizes:           PageSizes,
		SearchHandlers: map[string]gocrud.SearchHandler{
			"keyword": func(db *gorm.DB, values []string, with url.Values) *gorm.DB {
				if ok, value := gocrud.ValuableArray(values); ok {
					value = "%" + value + "%"
					return db.Where("name LIKE ? OR name_roman LIKE ?", value, value)
				} else {
					return db
				}
			},
			"in_id":   gocrud.KeywordIDIn("id", gocrud.OverflowedArrayTrimmerFilter[gocrud.ID](DefaultPageSize)),
			"deleted": gocrud.NewSoftDeleteSearchHandler(""),
		},
		OnDelete: gocrud.NewSoftDeleteHandler[model.Artist](gocrud.RestCoder),
	})
	if err != nil {
		return err
	}

	return nil
}
