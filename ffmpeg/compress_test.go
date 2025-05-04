package ffmpeg

import (
	"path"
	"testing"
)

func TestCompress(t *testing.T) {
	dst := path.Join(path.Dir(MP3), "compressed.128k.mp3")

	err := Compress(dst, MP3, 128*1000)
	if err != nil {
		t.Fatal(err)
	}

	ffprobe, _, err := FFProbe(dst)
	if err != nil {
		t.Fatal(err)
	}

	if ffprobe.Format.FormatName != "mp3" {
		t.Fatalf("expected mp3, got %s", ffprobe.Format.FormatName)
	}
}
