package store

import (
	"context"
	_ "embed"
	"encoding/json"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sha-shank-03/commerce-support-agent/internal/domain"
	"sync"
	"time"
)

// A single locked aggregate is intentional for the low-volume portfolio demo.
// Every auth, quota and action change is serialized across all service replicas.
type Store struct {
	pool   *pgxpool.Pool
	mu     sync.Mutex
	memory *domain.State
}

//go:embed migrations/001_init.sql
var migrationOne string

func New(ctx context.Context, url string) (*Store, error) {
	p, e := pgxpool.New(ctx, url)
	if e != nil {
		return nil, e
	}
	s := &Store{pool: p}
	_, e = p.Exec(ctx, migrationOne)
	return s, e
}
func Memory() *Store { return &Store{memory: domain.NewState()} }
func prune(st *domain.State) {
	now := time.Now().Unix()
	for k, v := range st.Sessions {
		if v.Expires <= now {
			delete(st.Sessions, k)
		}
	}
	for k, v := range st.Runs {
		if v.Created > 0 && v.Created+7*86400 <= now {
			if v.ReservedMicros > 0 {
				domain.Settle(st, v, v.ReservedMicros)
			}
			delete(st.Runs, k)
		}
	}
}
func (s *Store) Do(ctx context.Context, f func(*domain.State) error) error {
	if s.pool == nil {
		s.mu.Lock()
		defer s.mu.Unlock()
		raw, _ := json.Marshal(s.memory)
		next := domain.NewState()
		json.Unmarshal(raw, next)
		prune(next)
		if err := f(next); err != nil {
			return err
		}
		s.memory = next
		return nil
	}
	tx, e := s.pool.Begin(ctx)
	if e != nil {
		return e
	}
	defer tx.Rollback(ctx)
	var raw []byte
	if e = tx.QueryRow(ctx, "SELECT data FROM portfolio_state WHERE id=1 FOR UPDATE").Scan(&raw); e != nil {
		return e
	}
	next := domain.NewState()
	if e = json.Unmarshal(raw, next); e != nil {
		return e
	}
	prune(next)
	if e = f(next); e != nil {
		return e
	}
	raw, e = json.Marshal(next)
	if e != nil {
		return e
	}
	if _, e = tx.Exec(ctx, "UPDATE portfolio_state SET data=$1,version=version+1 WHERE id=1", raw); e != nil {
		return e
	}
	return tx.Commit(ctx)
}
func (s *Store) Ping(ctx context.Context) error {
	if s.pool == nil {
		return nil
	}
	return s.pool.Ping(ctx)
}
