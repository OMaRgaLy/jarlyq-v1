package main

import (
	"log"

	"github.com/example/jarlyq/internal/config"
	"github.com/example/jarlyq/internal/server"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	srv, err := server.New(cfg)
	if err != nil {
		log.Fatalf("failed to init server: %v", err)
	}

	if err := srv.Run(); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}
