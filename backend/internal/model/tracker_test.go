package model

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestValidAppStatus(t *testing.T) {
	for _, ok := range []string{"saved", "applied", "interview", "offer", "rejected"} {
		require.True(t, ValidAppStatus(ok), ok)
	}
	for _, bad := range []string{"", "SAVED", "hacked", "applied "} {
		require.False(t, ValidAppStatus(bad), bad)
	}
}

func TestUserIsPremium(t *testing.T) {
	past := time.Now().Add(-time.Hour)
	future := time.Now().Add(time.Hour)

	require.False(t, (&User{}).IsPremium(), "no subscription")
	require.False(t, (&User{PremiumUntil: &past}).IsPremium(), "expired subscription")
	require.True(t, (&User{PremiumUntil: &future}).IsPremium(), "active subscription")
}
