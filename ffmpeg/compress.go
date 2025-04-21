package ffmpeg

import (
	"fmt"
	"io"
	"os"
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

func Compress(filename string, bitrate uint64, writer io.Writer) error {
	tmp, err := os.CreateTemp(os.TempDir(), "ffmpeg-*.mp3")
	if err != nil {
		return err
	}
	defer func() {
		_ = tmp.Close()
		_ = os.Remove(tmp.Name())
	}()

	cmd := exec.Command(
		"ffmpeg",
		"-y",
		"-v", "error",
		"-i", filename,
		"-map", "a",
		"-map_metadata", "-1",
		"-b:a", fmt.Sprintf("%d", bitrate),
		tmp.Name(),
	)

	output, err := cmd.CombinedOutput()
	l.Debug().Printf("%s", output)
	if err != nil {
		return fmt.Errorf("ffmpeg error: %v, output: %s", err, output)
	}

	_, err = tmp.Seek(0, io.SeekStart)
	if err != nil {
		return err
	}

	n, err := io.Copy(writer, tmp)
	if err != nil {
		return err
	}

	stat, err := tmp.Stat()
	if err != nil {
		return err
	} else if stat.Size() != n {
		return fmt.Errorf("expected %d bytes, got %d", stat.Size(), n)
	}

	return nil
}
