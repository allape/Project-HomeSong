package model

import (
	"github.com/allape/gocrud"
)

type Lyrics struct {
	gocrud.Base
	Name        string `json:"name"`
	Index       int32  `json:"index" gorm:"default:0"`
	Offset      int64  `json:"offset" gorm:"default:0"` // in milliseconds
	Content     string `json:"content"`
	Description string `json:"description"`
}
