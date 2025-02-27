package model

import (
	"github.com/allape/gocrud"
)

type Song struct {
	gocrud.Base
	Name        string `json:"name"`
	Filename    string `json:"filename"`
	Cover       string `json:"cover"`
	Digest      string `json:"digest"`
	MIME        string `json:"mime"`
	FFProbeInfo string `json:"ffprobeInfo"`
}
