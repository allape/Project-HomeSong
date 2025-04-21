package ffmpeg

import (
	"bytes"
	"testing"
)

func TestCompress(t *testing.T) {
	output := bytes.NewBuffer(nil)
	err := Compress(MP3, 128*1000, output)
	if err != nil {
		t.Fatal(err)
	}

	ffprobe, _, err := FFProbeReader(output)
	if err != nil {
		t.Fatal(err)
	}

	if ffprobe.Format.FormatName != "mp3" {
		t.Fatalf("expected mp3, got %s", ffprobe.Format.FormatName)
	}
}
