package model

import (
	"github.com/allape/gocrud"
	"time"
)

type CollectionType string

const (
	CollectionTypeArtist CollectionType = "artist"
	CollectionTypeAlbum  CollectionType = "album"
	CollectionTypeSong   CollectionType = "playlist"
)

type Collection struct {
	gocrud.Base
	Type        CollectionType `json:"type"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Keywords    string         `json:"keywords"`
	Cover       string         `json:"cover"`
	Index       int32          `json:"index" gorm:"default:0"`
}

type CollectionSong struct {
	SongID       gocrud.ID `json:"songId"`
	CollectionID gocrud.ID `json:"collectionId"`
	CreatedAt    time.Time `json:"createdAt" gorm:"autoCreateTime;<-:create"`
}
