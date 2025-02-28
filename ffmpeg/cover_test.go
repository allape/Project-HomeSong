package ffmpeg

import (
	"bytes"
	"io"
	"os"
	"testing"
)

const MP3 = "../testdata/music.mp3"

func TestExtractCover(t *testing.T) {
	cover, codec, err := ExtractCover(MP3, nil)
	if err != nil {
		t.Fatal(err)
	} else if len(cover) == 0 {
		t.Fatal("cover is empty")
	} else if codec != "png" {
		t.Fatal("codec is not png")
	}

	file, err := os.Create(MP3 + GetExtByCodecName(codec))
	if err != nil {
		t.Fatal(err)
	}
	defer func() {
		_ = file.Close()
	}()

	n, err := io.Copy(file, bytes.NewReader(cover))
	if err != nil {
		t.Fatal(err)
	} else if n != int64(len(cover)) {
		t.Fatal("incomplete write")
	}
}
