package ffmpeg

import (
	"os/exec"
	"slices"
)

var ImageCodecs = []CodecName{"png", "jpeg", "jpg", "bmp", "gif", "tiff", "webp"}

func ExtractCover(filename string, ffprobe *FFProbeJson) ([]byte, CodecName, error) {
	var err error

	if ffprobe == nil {
		ffprobe, _, err = FFProbe(filename)
		if err != nil {
			return nil, "", err
		}
	}

	for _, stream := range ffprobe.Streams {
		if stream.CodecType == Video && slices.Contains(ImageCodecs, stream.CodecName) {
			output, err := exec.Command(
				"ffmpeg",
				"-v", "quiet",
				"-i", filename,
				"-vframes", "1",
				"-f", "image2",
				"-",
			).CombinedOutput()
			return output, stream.CodecName, err
		}
	}

	return nil, "", nil
}
