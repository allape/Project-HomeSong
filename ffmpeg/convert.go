package ffmpeg

import (
	"bytes"
	"io"
	"os/exec"
)

func ConvertToMp3(filename string, writer io.Writer) error {
	cmd := exec.Command(
		"ffmpeg",
		"-hide_banner",
		"-loglevel", "error",
		"-i", filename,
		"-c:a", "mp3",
		"-f", "mp3",
		"-",
	)

	stderr := bytes.NewBuffer(nil)

	cmd.Stdout = writer
	cmd.Stderr = stderr

	err := cmd.Run()
	if err != nil {
		return err
	}

	l.Debug().Println(stderr.String())

	return nil
}
