package ffmpeg

import (
	"bytes"
	"io"
	"os"
	"testing"
)

func TestExtractCover(t *testing.T) {
	const MP3 = "../testdata/music.mp3"
	cover, ext, err := ExtractCover(MP3, nil)
	if err != nil {
		t.Error(err)
	} else if len(cover) == 0 {
		t.Error("cover is empty")
	}

	file, err := os.Create(string(MP3 + "." + ext))
	if err != nil {
		t.Error(err)
	}
	defer func() {
		_ = file.Close()
	}()

	n, err := io.Copy(file, bytes.NewReader(cover))
	if err != nil {
		t.Error(err)
	} else if n != int64(len(cover)) {
		t.Error("incomplete write")
	}
}
