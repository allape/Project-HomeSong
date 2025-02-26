package model

import (
	"github.com/allape/gocrud"
	"time"
)

type Song struct {
	gocrud.Base
	Name        string `json:"name"`
	Cover       string `json:"cover"`
	Digest      string `json:"digest"`
	MIME        string `json:"mime"`
	FFProbeInfo string `json:"ffprobeInfo"`
}

type SongArtist struct {
	SongID    gocrud.ID `json:"songId"`
	ArtistID  gocrud.ID `json:"artistId"`
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime;<-:create"`
}
