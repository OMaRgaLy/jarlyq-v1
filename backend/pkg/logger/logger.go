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
		// Fall back to a basic logger if config fails
		fallback, _ := zap.NewProduction()
		if fallback == nil {
			fallback = zap.NewExample()
		}
		return &ZapLogger{SugaredLogger: fallback.Sugar()}
	}
	return &ZapLogger{SugaredLogger: l.Sugar()}
}

// Sync flushes the logger.
func (l *ZapLogger) Sync() error { return l.SugaredLogger.Sync() }
