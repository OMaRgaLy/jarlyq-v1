package model

import "time"

// Application statuses, in funnel order.
const (
	AppStatusSaved     = "saved"
	AppStatusApplied   = "applied"
	AppStatusInterview = "interview"
	AppStatusOffer     = "offer"
	AppStatusRejected  = "rejected"
)

// ValidAppStatus reports whether s is a known tracker status.
func ValidAppStatus(s string) bool {
	switch s {
	case AppStatusSaved, AppStatusApplied, AppStatusInterview, AppStatusOffer, AppStatusRejected:
		return true
	}
	return false
}

// IsPremium reports whether the user's Premium subscription is currently active.
func (u *User) IsPremium() bool {
	return u.PremiumUntil != nil && u.PremiumUntil.After(time.Now())
}

// UserApplication is one row in a student's personal tracker:
// "I saved / applied to this opportunity, and here is where it stands".
type UserApplication struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
	UserID        uint       `gorm:"not null;uniqueIndex:udx_user_opp" json:"-"`
	OpportunityID uint       `gorm:"not null;uniqueIndex:udx_user_opp;index" json:"opportunityId"`
	Status        string     `gorm:"size:20;not null;default:'saved';index" json:"status"`
	Note          string     `gorm:"size:1000" json:"note"`
	AppliedAt     *time.Time `json:"appliedAt,omitempty"`
}

// DeadlineReminder remembers which "N days before deadline" reminders were
// already sent, so the background worker never notifies twice.
type DeadlineReminder struct {
	ID            uint      `gorm:"primaryKey"`
	CreatedAt     time.Time
	UserID        uint      `gorm:"not null;uniqueIndex:udx_reminder"`
	OpportunityID uint      `gorm:"not null;uniqueIndex:udx_reminder"`
	DaysBefore    int       `gorm:"not null;uniqueIndex:udx_reminder"`
}
