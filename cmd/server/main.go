package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"github.com/sha-shank-03/commerce-support-agent/internal/domain"
	"github.com/sha-shank-03/commerce-support-agent/internal/server"
	"github.com/sha-shank-03/commerce-support-agent/internal/store"
	"log"
	"net/http"
	"os"
	"time"
)

func main() {
	invite := flag.Bool("invite", false, "Create a seven-day, five-run invitation in .local/invite.txt")
	revoke := flag.String("revoke", "", "Revoke an invitation by ID")
	schema := flag.Bool("schema", false, "Print GraphQL introspection")
	export := flag.String("export", "", "Export a sanitized completed/paused run by ID")
	flag.Parse()
	ctx := context.Background()
	if *schema {
		server.New(store.Memory()).ExportSchema(os.Stdout)
		return
	}
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		log.Fatal("DATABASE_URL is required")
	}
	s, e := store.New(ctx, url)
	if e != nil {
		log.Fatal("database initialization failed")
	}
	if *invite {
		token := domain.ID()
		id := domain.ID()
		e = s.Do(ctx, func(st *domain.State) error {
			st.Invites[domain.Hash(token)] = domain.Invite{ID: id, Expires: time.Now().Add(7 * 24 * time.Hour).Unix(), Remaining: 5}
			return nil
		})
		if e != nil {
			log.Fatal("invite creation failed")
		}
		os.MkdirAll(".local", 0700)
		if e = os.WriteFile(".local/invite.txt", []byte(token), 0600); e != nil {
			log.Fatal(e)
		}
		fmt.Println("Invitation", id, "saved to ignored .local/invite.txt")
		return
	}
	if *revoke != "" {
		e = s.Do(ctx, func(st *domain.State) error {
			for k, v := range st.Invites {
				if v.ID == *revoke {
					v.Revoked = true
					st.Invites[k] = v
				}
			}
			return nil
		})
		if e != nil {
			log.Fatal("revocation failed")
		}
		fmt.Println("Revocation processed")
		return
	}
	if *export != "" {
		e = s.Do(ctx, func(st *domain.State) error {
			r := st.Runs[*export]
			if r == nil {
				return fmt.Errorf("run not found")
			}
			public := *r
			public.Checkpoint = ""
			public.Owner = ""
			public.LeaseToken = ""
			return json.NewEncoder(os.Stdout).Encode(public)
		})
		if e != nil {
			log.Fatal("export failed")
		}
		return
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	srv := &http.Server{Addr: ":" + port, Handler: server.New(s).Handler(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 15 * time.Second, IdleTimeout: 30 * time.Second}
	log.Println("Commerce API listening on", port)
	log.Fatal(srv.ListenAndServe())
}
