package server

import (
	"context"
	"github.com/sha-shank-03/commerce-support-agent/internal/domain"
	"github.com/sha-shank-03/commerce-support-agent/internal/store"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestReviewerIsolation(t *testing.T) {
	db := store.Memory()
	db.Do(context.Background(), func(st *domain.State) error { st.Runs["run-a"] = &domain.Run{ID: "run-a", Owner: "alice"}; return nil })
	s := New(db)
	if _, e := s.Get(context.WithValue(context.Background(), ownerKey{}, "bob"), "run-a"); e == nil {
		t.Fatal("cross-reviewer read")
	}
	if _, e := s.Change(context.WithValue(context.Background(), ownerKey{}, "bob"), "run-a", "cancel", "", ""); e == nil {
		t.Fatal("cross-reviewer write")
	}
}
func TestExpiredAndRevokedSessions(t *testing.T) {
	for _, revoked := range []bool{false, true} {
		db := store.Memory()
		db.Do(context.Background(), func(st *domain.State) error {
			expires := time.Now().Unix() - 1
			if revoked {
				expires += 1000
			}
			st.Invites["i"] = domain.Invite{ID: "owner", Expires: expires, Revoked: revoked}
			st.Sessions[domain.Hash("token")] = domain.Session{Owner: "owner", Expires: time.Now().Unix() + 500}
			return nil
		})
		r := httptest.NewRequest("POST", "/graphql", nil)
		r.AddCookie(&http.Cookie{Name: "portfolio_session", Value: "token"})
		if _, e := New(db).owner(r); e == nil {
			t.Fatal("invalid session accepted")
		}
	}
}
func TestOriginAndAuthentication(t *testing.T) {
	s := New(store.Memory())
	for _, origin := range []string{"", "https://evil.invalid", s.Origin} {
		r := httptest.NewRequest("POST", "/graphql", strings.NewReader(`{"query":"{tickets{id}}"}`))
		r.Header.Set("Content-Type", "application/json")
		r.Header.Set("Origin", origin)
		w := httptest.NewRecorder()
		s.Handler().ServeHTTP(w, r)
		expected := 403
		if origin == s.Origin {
			expected = 401
		}
		if w.Code != expected {
			t.Fatalf("got %d want %d", w.Code, expected)
		}
	}
}
func TestToolAllowlist(t *testing.T) {
	s := New(store.Memory())
	r := &domain.Run{Events: []domain.Event{}}
	for _, name := range []string{"shell", "http_get", "delete_database", "send_email"} {
		if _, e := s.tool(r, name, []byte(`{}`)); e == nil {
			t.Fatal("unknown tool allowed")
		}
	}
}
