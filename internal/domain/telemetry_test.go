package domain

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestPublicModelCallEvents(t *testing.T) {
	r := &Run{Model: "gpt-4.1-mini", Turns: 1}
	r.ModelStarted()
	if r.Events[0].Call.Phase != "started" || r.Events[0].Call.DurationMs != nil {
		t.Fatal("start must not invent usage or timing")
	}
	r.ModelCompleted(120, 25, 88)
	c := r.Events[1].Call
	if c.ID != r.Events[0].Call.ID || *c.InputTokens != 120 || *c.OutputTokens != 25 || *c.CostMicros != 88 || c.DurationMs == nil || *c.DurationMs < 0 {
		t.Fatal("invalid measured metadata")
	}
	raw, _ := json.Marshal(r.Events)
	for _, secret := range []string{"messages", "checkpoint", "apiKey", "authorization", "leaseToken"} {
		if strings.Contains(string(raw), secret) {
			t.Fatalf("private field %s", secret)
		}
	}
}

func TestLegacyCompletionDoesNotInventDuration(t *testing.T) {
	r := &Run{Model: "gpt-4.1-mini", Turns: 2}
	r.ModelCompleted(120, 25, 88)
	if r.Events[0].Call.DurationMs != nil {
		t.Fatal("missing start has unknown duration")
	}
}
