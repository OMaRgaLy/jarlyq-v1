package logger

import (
	"go.uber.org/zap"
)

// Logger is a thin wrapper around zap.SugaredLogger.
type Logger interface {
	Debugf(template string, args ...interface{})
	Infof(template string, args ...interface{})
	Warnf(template string, args ...interface{})
	Errorf(template string, args ...interface{})
	Sync() error
}

// ZapLogger implements Logger using zap.
type ZapLogger struct {
	*zap.SugaredLogger
}

// New creates a new logger based on environment.
func New(env string) Logger {
	var cfg zap.Config
	if env == "production" {
		cfg = zap.NewProductionConfig()
	} else {
		cfg = zap.NewDevelopmentConfig()
	}

	l, err := cfg.Build()
	if err != nil {
		panic(err)
	}
	return &ZapLogger{SugaredLogger: l.Sugar()}
}

// Sync flushes the logger.
func (l *ZapLogger) Sync() error { return l.SugaredLogger.Sync() }
