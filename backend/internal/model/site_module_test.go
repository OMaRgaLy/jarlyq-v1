package model

import (
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func newModuleTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&SiteModule{}))
	return db
}

func moduleStates(t *testing.T, db *gorm.DB) map[string]string {
	t.Helper()
	var rows []SiteModule
	require.NoError(t, db.Find(&rows).Error)
	out := make(map[string]string, len(rows))
	for _, r := range rows {
		out[r.Key] = r.State
	}
	return out
}

func TestEnsureSiteModulesCreatesAllAsOn(t *testing.T) {
	db := newModuleTestDB(t)
	require.NoError(t, EnsureSiteModules(db))

	states := moduleStates(t, db)
	require.Len(t, states, len(DefaultSiteModules()))
	for key, state := range states {
		require.Equal(t, ModuleOn, state, "module %q should start as on", key)
	}
}

func TestEnsureSiteModulesKeepsAdminEdits(t *testing.T) {
	db := newModuleTestDB(t)
	require.NoError(t, EnsureSiteModules(db))

	require.NoError(t, db.Model(&SiteModule{}).Where("key = ?", "schools").
		Updates(map[string]any{"state": ModuleSoon, "label": "Мои школы"}).Error)

	// Simulates a restart / upgrade.
	require.NoError(t, EnsureSiteModules(db))

	var m SiteModule
	require.NoError(t, db.Where("key = ?", "schools").First(&m).Error)
	require.Equal(t, ModuleSoon, m.State)
	require.Equal(t, "Мои школы", m.Label)
	require.Len(t, moduleStates(t, db), len(DefaultSiteModules()), "no duplicates")
}

func TestEnsureSiteModulesAddsOnlyMissing(t *testing.T) {
	db := newModuleTestDB(t)
	require.NoError(t, EnsureSiteModules(db))
	require.NoError(t, db.Where("key = ?", "hackathons").Delete(&SiteModule{}).Error)

	require.NoError(t, EnsureSiteModules(db))
	require.Contains(t, moduleStates(t, db), "hackathons")
}

func TestPresetsReferenceOnlyKnownModulesAndStates(t *testing.T) {
	known := map[string]bool{}
	for _, m := range DefaultSiteModules() {
		known[m.Key] = true
	}
	for name, preset := range ModulePresets {
		for key, state := range preset {
			require.True(t, known[key], "preset %q mentions unknown module %q", name, key)
			require.True(t, IsValidModuleState(state), "preset %q: bad state %q for %q", name, state, key)
		}
	}
}

func TestMVPPresetKeepsCoreOnAndAuthWorking(t *testing.T) {
	db := newModuleTestDB(t)
	require.NoError(t, EnsureSiteModules(db))
	require.NoError(t, ApplyModulePreset(db, "mvp"))

	s := moduleStates(t, db)
	for _, key := range []string{"companies", "internships", "jobs", "auth"} {
		require.Equal(t, ModuleOn, s[key], key)
	}
	require.Equal(t, ModuleSoon, s["schools"])
	require.Equal(t, ModuleOff, s["project-ideas"])
}

func TestAllPresetRestoresEverything(t *testing.T) {
	db := newModuleTestDB(t)
	require.NoError(t, EnsureSiteModules(db))
	require.NoError(t, ApplyModulePreset(db, "mvp"))
	require.NoError(t, ApplyModulePreset(db, "all"))

	for key, state := range moduleStates(t, db) {
		require.Equal(t, ModuleOn, state, key)
	}
}

func TestUnknownPresetIsRejectedWithoutChanges(t *testing.T) {
	db := newModuleTestDB(t)
	require.NoError(t, EnsureSiteModules(db))

	require.Error(t, ApplyModulePreset(db, "nope"))
	for key, state := range moduleStates(t, db) {
		require.Equal(t, ModuleOn, state, key)
	}
}
