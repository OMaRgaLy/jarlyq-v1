package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/config"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/server"
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

	// Run server in a goroutine so we can listen for shutdown signals
	errCh := make(chan error, 1)
	go func() {
		errCh <- srv.Run()
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-quit:
		log.Printf("received signal %v, shutting down...", sig)
	case err := <-errCh:
		log.Fatalf("server stopped unexpectedly: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("shutdown error: %v", err)
	}

	log.Println("server stopped gracefully")
}
