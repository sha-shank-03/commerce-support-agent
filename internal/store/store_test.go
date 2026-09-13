package store

import (
	"context"
	"errors"
	"github.com/sha-shank-03/commerce-support-agent/internal/domain"
	"os"
	"sync"
	"sync/atomic"
	"testing"
)

func checkConcurrent(t *testing.T, s *Store) {
	ctx := context.Background()
	if e := s.Do(ctx, func(st *domain.State) error { *st = *domain.NewState(); return nil }); e != nil {
		t.Fatal(e)
	}
	var success atomic.Int32
	var wg sync.WaitGroup
	for i := 0; i < 40; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if s.Do(ctx, func(st *domain.State) error {
				r := &domain.Run{ID: domain.ID()}
				if e := domain.Reserve(st, r, 100000, 2500000); e != nil {
					return e
				}
				st.Runs[r.ID] = r
				return nil
			}) == nil {
				success.Add(1)
			}
		}()
	}
	wg.Wait()
	if success.Load() != 25 {
		t.Fatalf("wanted 25 admitted reservations, got %d", success.Load())
	}
	s.Do(ctx, func(st *domain.State) error {
		if len(st.Runs) != 25 {
			t.Fatal("rollback or quota invariant failed")
		}
		return nil
	})
}
func TestConcurrentBudgetMemory(t *testing.T) { checkConcurrent(t, Memory()) }
func TestConcurrentBudgetPostgres(t *testing.T) {
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("TEST_DATABASE_URL is required for PostgreSQL concurrency verification")
	}
	s, e := New(context.Background(), url)
	if e != nil {
		t.Fatal(e)
	}
	checkConcurrent(t, s)
}
func TestRollback(t *testing.T) {
	s := Memory()
	s.Do(context.Background(), func(st *domain.State) error {
		st.Invites["should-not-exist"] = domain.Invite{}
		return errors.New("rollback")
	})
	s.Do(context.Background(), func(st *domain.State) error {
		if len(st.Invites) != 0 {
			t.Fatal("failed transaction committed")
		}
		return nil
	})
}
