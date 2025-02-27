package model

import "github.com/allape/gocrud"

type Artist struct {
	gocrud.Base
	Name      string `json:"name"`
	NameRoman string `json:"nameRoman"`
	Portrait  string `json:"portrait"`
}
