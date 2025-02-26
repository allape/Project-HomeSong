package asset

import _ "embed"

const FaviconMIME = "image/png"

//go:embed favicon.png
var Favicon []byte
