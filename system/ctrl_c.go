package system

import (
	"github.com/allape/gogger"
	"os"
	"os/signal"
	"syscall"
)

var l = gogger.New("ctrl-c")

func Wait4CtrlC() {
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	sig := <-sigs
	l.Info().Println("Exiting with", sig)
}
