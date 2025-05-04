package ffmpeg

import (
	"fmt"
	"os/exec"
)

// failed in some cases when converting mp3 to mp3 directly into stdout
//func Compress(filename string, bitrate uint64, writer io.Writer) error {
//	cmd := exec.Command(
//		"ffmpeg",
//		"-i", filename,
//		"-b:a", fmt.Sprintf("%dk", bitrate/1000),
//		"-f", "mp3",
//		"pipe:1",
//		"-",
//	)
//
//	stderr := bytes.NewBuffer(nil)
//
//	cmd.Stdout = writer
//	cmd.Stderr = stderr
//
//	err := cmd.Run()
//	l.Debug().Println(stderr.String())
//	if err != nil {
//		return err
//	}
//
//	return nil
//}

func Compress(dst, src string, bitrate uint64) error {
	cmd := exec.Command(
		"ffmpeg",
		"-y",
		"-v", "error",
		"-i", src,
		"-map", "a",
		"-map_metadata", "-1",
		"-b:a", fmt.Sprintf("%d", bitrate),
		dst,
	)

	output, err := cmd.CombinedOutput()

	l.Debug().Printf("%s", output)

	if err != nil {
		return fmt.Errorf("ffmpeg error: %v, output: %s", err, output)
	}

	return nil
}
