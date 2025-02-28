package ffmpeg

import "testing"

func TestFFProbe(t *testing.T) {
	_, ffprobe, err := FFProbe(MP3)
	if err != nil {
		t.Fatal(err)
	}

	t.Log(ffprobe)
}
