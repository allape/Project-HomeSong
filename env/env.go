package env

import (
	"github.com/allape/goenv"
)

const (
	bindAddr   = "HOME_SONG_BIND_ADDR"
	enableCors = "HOME_SONG_ENABLE_CORS"

	databaseDSN = "HOME_SONG_DATABASE_DSN"

	uiFolder     = "HOME_SONG_UI_FOLDER"
	staticFolder = "HOME_SONG_STATIC_FOLDER"
)

var (
	BindAddr   = goenv.Getenv(bindAddr, ":8080")
	EnableCors = goenv.Getenv(enableCors, true)

	DatabaseDSN = goenv.Getenv(databaseDSN, "root:Root_123456@tcp(127.0.0.1:3306)/homesong?charset=utf8mb4&parseTime=True&loc=Local")

	UIFolder     = goenv.Getenv(uiFolder, "./ui/dist/index.html")
	StaticFolder = goenv.Getenv(staticFolder, "./static")
)
