package server

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/graphql-go/graphql"
	"github.com/sha-shank-03/commerce-support-agent/internal/domain"
	"github.com/sha-shank-03/commerce-support-agent/internal/store"
)

type Server struct {
	Store                 *store.Store
	Origin, Python, Model string
	Live                  bool
	Budget                int64
	schema                graphql.Schema
	mu                    sync.Mutex
	authAttempts          map[string][]int64
}
type ownerKey struct{}

func New(s *store.Store) *Server {
	v := &Server{Store: s, Origin: env("ALLOWED_ORIGIN", "http://localhost:5173"), Python: env("PYTHON_BIN", ".venv/bin/python"), Model: env("OPENAI_MODEL", "gpt-4.1-mini"), Live: os.Getenv("LIVE_ENABLED") == "true", Budget: 2500000, authAttempts: map[string][]int64{}}
	if n, e := strconv.ParseInt(os.Getenv("MONTHLY_BUDGET_MICRO_USD"), 10, 64); e == nil && n > 0 {
		v.Budget = n
	}
	v.schema = v.Schema()
	return v
}
func env(k, d string) string {
	if s := os.Getenv(k); s != "" {
		return s
	}
	return d
}
func failure(w http.ResponseWriter, e error, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": e.Error()})
}
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) { json.NewEncoder(w).Encode(map[string]bool{"ok": true}) })
	mux.HandleFunc("GET /ready", func(w http.ResponseWriter, r *http.Request) {
		if e := s.Store.Ping(r.Context()); e != nil {
			failure(w, errors.New("database unavailable"), 503)
			return
		}
		json.NewEncoder(w).Encode(map[string]bool{"ready": true, "liveEnabled": s.Live})
	})
	mux.HandleFunc("POST /session", s.exchange)
	mux.HandleFunc("POST /graphql", s.graphql)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Referrer-Policy", "no-referrer")
		if r.Method == "POST" {
			if r.Header.Get("Origin") != s.Origin {
				failure(w, errors.New("origin not allowed"), 403)
				return
			}
			if !strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") {
				failure(w, errors.New("JSON required"), 415)
				return
			}
		}
		mux.ServeHTTP(w, r)
	})
}
func (s *Server) exchange(w http.ResponseWriter, r *http.Request) {
	// Bound failed token attempts per service; the strong random token is the primary defence.
	s.mu.Lock()
	now := time.Now().Unix()
	key, _, splitErr := net.SplitHostPort(r.RemoteAddr)
	if splitErr != nil {
		key = r.RemoteAddr
	}
	var recent []int64
	for _, t := range s.authAttempts[key] {
		if t > now-60 {
			recent = append(recent, t)
		}
	}
	if len(recent) >= 10 {
		s.mu.Unlock()
		failure(w, errors.New("try again later"), 429)
		return
	}
	if len(s.authAttempts) > 1000 {
		s.authAttempts = map[string][]int64{}
	}
	s.authAttempts[key] = append(recent, now)
	s.mu.Unlock()
	var req struct {
		Token string `json:"token"`
	}
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&req) != nil {
		failure(w, errors.New("invalid request"), 400)
		return
	}
	token := domain.ID()
	err := s.Store.Do(r.Context(), func(st *domain.State) error {
		inv, ok := st.Invites[domain.Hash(req.Token)]
		if !ok || inv.Revoked || inv.Expires <= now {
			return errors.New("invalid or expired invitation")
		}
		st.Sessions[domain.Hash(token)] = domain.Session{Owner: inv.ID, Expires: min(inv.Expires, now+86400)}
		return nil
	})
	if err != nil {
		failure(w, err, 401)
		return
	}
	http.SetCookie(w, &http.Cookie{Name: "portfolio_session", Value: token, HttpOnly: true, Secure: strings.HasPrefix(s.Origin, "https:"), SameSite: http.SameSiteLaxMode, Path: "/", MaxAge: 86400})
	json.NewEncoder(w).Encode(map[string]bool{"ok": true})
}
func (s *Server) owner(r *http.Request) (string, error) {
	c, e := r.Cookie("portfolio_session")
	if e != nil {
		return "", errors.New("invitation required")
	}
	owner := ""
	e = s.Store.Do(r.Context(), func(st *domain.State) error {
		sess, ok := st.Sessions[domain.Hash(c.Value)]
		if !ok || sess.Expires <= time.Now().Unix() {
			return errors.New("session expired")
		}
		for _, v := range st.Invites {
			if v.ID == sess.Owner && !v.Revoked && v.Expires > time.Now().Unix() {
				owner = v.ID
				return nil
			}
		}
		return errors.New("invitation expired")
	})
	return owner, e
}
func (s *Server) graphql(w http.ResponseWriter, r *http.Request) {
	o, e := s.owner(r)
	if e != nil {
		failure(w, e, 401)
		return
	}
	var q struct {
		Query         string                 `json:"query"`
		Variables     map[string]interface{} `json:"variables"`
		OperationName string                 `json:"operationName"`
	}
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 16384)).Decode(&q) != nil {
		failure(w, errors.New("invalid query"), 400)
		return
	}
	if strings.Count(q.Query, "{") > 20 || len(q.Query) > 10000 {
		failure(w, errors.New("query too complex"), 400)
		return
	}
	res := graphql.Do(graphql.Params{Schema: s.schema, RequestString: q.Query, VariableValues: q.Variables, OperationName: q.OperationName, Context: context.WithValue(r.Context(), ownerKey{}, o)})
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}
func (s *Server) Get(ctx context.Context, id string) (*domain.Run, error) {
	var out *domain.Run
	o, _ := ctx.Value(ownerKey{}).(string)
	err := s.Store.Do(ctx, func(st *domain.State) error {
		r := st.Runs[id]
		if r == nil || r.Owner != o || r.Created+7*86400 <= time.Now().Unix() {
			return errors.New("run not found")
		}
		if r.State == "running" && r.LeaseUntil <= time.Now().Unix() {
			r.State = "failed"
			r.Error = "Worker interrupted. Resume explicitly from the saved checkpoint."
		}
		out = r
		return nil
	})
	return out, err
}
func (s *Server) Start(ctx context.Context, ticketID string) (*domain.Run, error) {
	if !s.Live {
		return nil, errors.New("live execution disabled")
	}
	var ticket *domain.Ticket
	for _, t := range domain.Fixtures() {
		if t.ID == ticketID {
			v := t
			ticket = &v
		}
	}
	if ticket == nil {
		return nil, errors.New("unknown ticket")
	}
	o, _ := ctx.Value(ownerKey{}).(string)
	now := time.Now().Unix()
	r := &domain.Run{ID: domain.ID(), Owner: o, Ticket: *ticket, Order: domain.SeedOrder(*ticket), State: "queued", Evidence: []domain.Evidence{}, Events: []domain.Event{}, Messages: []string{}, Created: now, Model: s.Model, PromptVersion: domain.PromptVersion}
	err := s.Store.Do(ctx, func(st *domain.State) error {
		active := 0
		for _, v := range st.Runs {
			if v.State == "running" && v.LeaseUntil > now {
				active++
			}
		}
		if active >= 2 {
			return errors.New("two runs are already active; try later")
		}
		valid := false
		for hash, inv := range st.Invites {
			if inv.ID == o && !inv.Revoked && inv.Expires > now && inv.Remaining > 0 {
				inv.Remaining--
				st.Invites[hash] = inv
				valid = true
				break
			}
		}
		if !valid {
			return errors.New("invitation run allowance exhausted")
		}
		st.Runs[r.ID] = r
		return s.claim(st, r, now)
	})
	if err == nil {
		go s.execute(r.ID, r.LeaseToken)
	}
	return r, err
}
func (s *Server) claim(st *domain.State, r *domain.Run, now int64) error {
	active := 0
	for _, v := range st.Runs {
		if v.ID != r.ID && v.State == "running" && v.LeaseUntil > now {
			active++
		}
	}
	if active >= 2 {
		return errors.New("concurrency limit reached")
	}
	r.LeaseToken = domain.ID()
	r.LeaseUntil = now + 180
	r.State = "running"
	r.Error = ""
	r.Event("status", "Agent started", "Bounded investigation of synthetic data.")
	return nil
}
func (s *Server) Change(ctx context.Context, id, kind, text, digest string) (*domain.Run, error) {
	o, _ := ctx.Value(ownerKey{}).(string)
	var out *domain.Run
	launch := false
	err := s.Store.Do(ctx, func(st *domain.State) error {
		r := st.Runs[id]
		if r == nil || r.Owner != o || r.Created+7*86400 <= time.Now().Unix() {
			return errors.New("run not found")
		}
		out = r
		now := time.Now().Unix()
		if kind == "cancel" {
			if r.State == "completed" || r.State == "cancelled" {
				return nil
			}
			r.State = "cancelled"
			r.LeaseToken = ""
			r.LeaseUntil = 0
			if r.ReservedMicros > 0 {
				domain.Settle(st, r, r.ReservedMicros)
			}
			r.Event("status", "Run cancelled", "No new tools will execute.")
			return nil
		}
		if !s.Live {
			return errors.New("live execution disabled")
		}
		switch kind {
		case "approve", "reject":
			if r.Receipt != nil && r.Proposal != nil && digest == r.Proposal.Digest {
				return nil
			}
			if r.State != "awaiting_approval" || r.Proposal == nil || r.Proposal.Digest != digest {
				return errors.New("approval does not match the pending action")
			}
			if err := domain.ValidateAction(r, r.Proposal, now); err != nil {
				return err
			}
			r.Decision = kind
			r.DecisionDigest = digest
			r.Event("approval", "Human decision recorded", kind)
		case "clarify":
			if r.State != "awaiting_input" || len(strings.TrimSpace(text)) == 0 || len(text) > 2000 {
				return errors.New("clarification not accepted")
			}
			r.Messages = append(r.Messages, text)
			r.Event("input", "Reviewer clarification", text)
		case "resume":
			if r.State != "failed" && !(r.State == "running" && r.LeaseUntil <= now) {
				return errors.New("run is not recoverable")
			}
			if r.ReservedMicros > 0 {
				domain.Settle(st, r, r.ReservedMicros)
			}
			r.Event("status", "Explicit recovery", "Uncertain model usage charged conservatively; action receipts are retained.")
		default:
			return errors.New("unknown transition")
		}
		if err := s.claim(st, r, now); err != nil {
			return err
		}
		launch = true
		return nil
	})
	if err == nil && launch {
		go s.execute(out.ID, out.LeaseToken)
	}
	return out, err
}

type wire struct {
	Version     int             `json:"v"`
	Type        string          `json:"type"`
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	Args        json.RawMessage `json:"args"`
	Checkpoint  string          `json:"checkpoint"`
	State       string          `json:"state"`
	Summary     string          `json:"summary"`
	Input       int             `json:"inputTokens"`
	Output      int             `json:"outputTokens"`
	Micros      int64           `json:"micros"`
	Error       string          `json:"error"`
	EvidenceIDs []string        `json:"evidenceIds"`
}

func (s *Server) execute(id, lease string) {
	ctx, cancel := context.WithTimeout(context.Background(), 170*time.Second)
	defer cancel()
	var snapshot *domain.Run
	_ = s.Store.Do(ctx, func(st *domain.State) error { snapshot = st.Runs[id]; return nil })
	if snapshot == nil {
		return
	}
	cmd := exec.CommandContext(ctx, s.Python, "agent/worker.py")
	cmd.Env = []string{"PATH=" + os.Getenv("PATH"), "HOME=" + os.Getenv("HOME"), "OPENAI_API_KEY=" + os.Getenv("OPENAI_API_KEY"), "OPENAI_MODEL=" + s.Model, "PYTHONUNBUFFERED=1", "OPENAI_AGENTS_DISABLE_TRACING=1"}
	if browserPath := os.Getenv("PLAYWRIGHT_BROWSERS_PATH"); browserPath != "" {
		cmd.Env = append(cmd.Env, "PLAYWRIGHT_BROWSERS_PATH="+browserPath)
	}
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return
	}
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	finish := func(msg string) {
		_ = s.Store.Do(context.Background(), func(st *domain.State) error {
			r := st.Runs[id]
			if r == nil || r.LeaseToken != lease {
				return nil
			}
			if r.ReservedMicros > 0 {
				domain.Settle(st, r, r.ReservedMicros)
			}
			r.State = "failed"
			r.Error = msg
			r.LeaseUntil = 0
			r.Event("error", "Run stopped", msg)
			return nil
		})
	}
	if err = cmd.Start(); err != nil {
		finish("Agent process could not start")
		return
	}
	enc := json.NewEncoder(stdin)
	enc.Encode(map[string]interface{}{"v": 1, "run": snapshot})
	scan := bufio.NewScanner(stdout)
	scan.Buffer(make([]byte, 4096), 2*1024*1024)
	done := false
	errorCode := "interrupted"
	for scan.Scan() {
		var m wire
		if json.Unmarshal(scan.Bytes(), &m) != nil || m.Version != 1 {
			err = errors.New("invalid worker protocol")
			break
		}
		var result interface{}
		opErr := s.Store.Do(ctx, func(st *domain.State) error {
			r := st.Runs[id]
			if r == nil || r.LeaseToken != lease || r.State != "running" || r.LeaseUntil < time.Now().Unix() {
				return errors.New("run lease is no longer valid")
			}
			switch m.Type {
			case "reserve":
				if r.Turns >= 8 {
					return errors.New("model turn limit reached")
				}
				if e := domain.Reserve(st, r, m.Micros, s.Budget); e != nil {
					return e
				}
				r.Turns++
				result = true
			case "usage":
				if m.Micros < 0 || m.Micros > r.ReservedMicros {
					return errors.New("usage exceeded reservation")
				}
				domain.Settle(st, r, m.Micros)
				r.InputTokens += m.Input
				r.OutputTokens += m.Output
				result = true
			case "tool":
				var e error
				result, e = s.tool(r, m.Name, m.Args)
				if e != nil {
					return e
				}
			case "checkpoint":
				r.Checkpoint = m.Checkpoint
				result = true
			case "done":
				for _, citation := range m.EvidenceIDs {
					found := false
					for _, evidence := range r.Evidence {
						if evidence.ID == citation {
							found = true
						}
					}
					if !found {
						return errors.New("citation was not retrieved")
					}
				}
				if m.State != "completed" && m.State != "awaiting_approval" && m.State != "awaiting_input" {
					return errors.New("invalid final state")
				}
				if m.State == "awaiting_approval" && (r.Proposal == nil || m.Checkpoint == "") {
					return errors.New("approval has no verifiable checkpoint")
				}
				r.Checkpoint = m.Checkpoint
				r.Summary = m.Summary
				r.State = m.State
				r.LeaseUntil = 0
				r.Event("status", strings.ReplaceAll(m.State, "_", " "), m.Summary)
				done = true
				result = true
			case "error":
				return errors.New("Agent failed; explicit retry is available")
			default:
				return errors.New("unknown worker message")
			}
			return nil
		})
		reply := map[string]interface{}{"v": 1, "id": m.ID, "result": result}
		if opErr != nil {
			reply["error"] = opErr.Error()
		}
		if e := enc.Encode(reply); e != nil {
			err = e
			break
		}
		if m.Type == "error" || done {
			if m.Type == "error" && len(m.Error) < 160 {
				errorCode = m.Error
			}
			break
		}
	}
	stdin.Close()
	if !done {
		cancel()
	}
	waitErr := cmd.Wait()
	if !done {
		_ = waitErr
		_ = err
		finish("Agent stopped (" + errorCode + "). Recover explicitly; no action is replayed automatically.")
	}
}
func (s *Server) tool(r *domain.Run, name string, args json.RawMessage) (interface{}, error) {
	var a map[string]interface{}
	if json.Unmarshal(args, &a) != nil {
		return nil, errors.New("invalid tool arguments")
	}
	str := func(k string) string { v, _ := a[k].(string); return v }
	r.Event("tool", name, "Validated application tool call")
	switch name {
	case "audit_mcp":
		if str("name") != "get_order" && str("name") != "get_policies" {
			return nil, errors.New("unknown MCP tool")
		}
		r.Event("mcp", str("name"), "Read-only MCP tool invoked by the agent")
		return true, nil
	case "lookup_order":
		if r.Order.ID == "" {
			return map[string]string{"status": "missing", "instruction": "Ask for an order ID; do not guess."}, nil
		}
		b, _ := json.Marshal(r.Order)
		e := domain.Evidence{ID: "order:" + r.Order.ID, Title: "Order record", Content: string(b), Version: strconv.Itoa(r.Order.Version)}
		domain.AddEvidence(r, e)
		return e, nil
	case "lookup_policies":
		p := domain.Policies()
		for _, e := range p {
			domain.AddEvidence(r, e)
		}
		return p, nil
	case "lookup_shipment":
		if r.Ticket.Scenario == "browser" {
			return map[string]string{"status": "unavailable", "instruction": "Use browser_shipment tool."}, nil
		}
		e := domain.Evidence{ID: "shipment:" + r.Order.ID, Title: "Carrier status", Content: "In transit; last scan: regional sorting centre. No confirmed delivery date.", Version: "fixture-v1"}
		domain.AddEvidence(r, e)
		return e, nil
	case "browser_fixture":
		if r.Ticket.Scenario != "browser" {
			return nil, errors.New("browser fallback is not authorized for this scenario")
		}
		return map[string]string{"orderId": r.Order.ID, "status": "In transit at Sample City sorting centre", "source": "application-owned carrier fixture"}, nil
	case "browser_result":
		if r.Ticket.Scenario != "browser" {
			return nil, errors.New("browser evidence is not authorized for this scenario")
		}
		if str("status") != "In transit at Sample City sorting centre" {
			return nil, errors.New("browser result not supported by fixture")
		}
		e := domain.Evidence{ID: "browser:" + r.Order.ID, Title: "Browser carrier lookup", Content: str("status"), Version: "fixture-v1"}
		domain.AddEvidence(r, e)
		return e, nil
	case "propose_action":
		if len(r.Evidence) < 2 {
			return nil, errors.New("retrieve order and policy evidence first")
		}
		return domain.Propose(r, str("kind"), str("address"), str("reason"), time.Now().Unix())
	case "execute_action":
		return domain.Execute(r, str("digest"), time.Now().Unix())
	default:
		return nil, errors.New("tool not allowed")
	}
}
func object(name string, fields map[string]graphql.Output) *graphql.Object {
	f := graphql.Fields{}
	for k, v := range fields {
		f[k] = &graphql.Field{Type: v}
	}
	return graphql.NewObject(graphql.ObjectConfig{Name: name, Fields: f})
}
func asMap(v interface{}) interface{} {
	b, _ := json.Marshal(v)
	var out interface{}
	json.Unmarshal(b, &out)
	return out
}
func (s *Server) Schema() graphql.Schema {
	str := graphql.String
	integer := graphql.Int
	ticket := object("Ticket", map[string]graphql.Output{"id": str, "subject": str, "message": str, "orderId": str, "scenario": str})
	order := object("Order", map[string]graphql.Output{"id": str, "status": str, "version": integer, "totalMinor": integer, "currency": str, "address": str, "damaged": graphql.Boolean})
	evidence := object("Evidence", map[string]graphql.Output{"id": str, "title": str, "content": str, "version": str})
	event := object("RunEvent", map[string]graphql.Output{"seq": integer, "kind": str, "title": str, "detail": str, "at": str})
	proposal := object("ProposedAction", map[string]graphql.Output{"id": str, "kind": str, "orderId": str, "orderVersion": integer, "amountMinor": integer, "address": str, "reason": str, "digest": str, "expires": graphql.Float})
	receipt := object("ActionReceipt", map[string]graphql.Output{"id": str, "kind": str, "detail": str, "at": str, "simulated": graphql.Boolean})
	run := object("Run", map[string]graphql.Output{"id": str, "ticket": ticket, "order": order, "state": str, "summary": str, "evidence": graphql.NewList(evidence), "events": graphql.NewList(event), "proposal": proposal, "receipt": receipt, "model": str, "promptVersion": str, "created": graphql.Float, "turns": integer, "inputTokens": integer, "outputTokens": integer, "usedMicros": integer, "error": str})
	idArg := graphql.FieldConfigArgument{"id": &graphql.ArgumentConfig{Type: graphql.NewNonNull(str)}}
	q := object("Query", map[string]graphql.Output{})
	q.AddFieldConfig("tickets", &graphql.Field{Type: graphql.NewList(ticket), Resolve: func(p graphql.ResolveParams) (interface{}, error) { return asMap(domain.Fixtures()), nil }})
	q.AddFieldConfig("run", &graphql.Field{Type: run, Args: idArg, Resolve: func(p graphql.ResolveParams) (interface{}, error) {
		r, e := s.Get(p.Context, p.Args["id"].(string))
		return asMap(r), e
	}})
	q.AddFieldConfig("runs", &graphql.Field{Type: graphql.NewList(run), Resolve: func(p graphql.ResolveParams) (interface{}, error) {
		o, _ := p.Context.Value(ownerKey{}).(string)
		var out []*domain.Run
		e := s.Store.Do(p.Context, func(st *domain.State) error {
			for _, r := range st.Runs {
				if r.Owner == o {
					out = append(out, r)
				}
			}
			return nil
		})
		sort.Slice(out, func(i, j int) bool { return out[i].Created > out[j].Created })
		return asMap(out), e
	}})
	q.AddFieldConfig("runEvents", &graphql.Field{Type: graphql.NewList(event), Args: graphql.FieldConfigArgument{"id": &graphql.ArgumentConfig{Type: graphql.NewNonNull(str)}, "after": &graphql.ArgumentConfig{Type: integer, DefaultValue: 0}}, Resolve: func(p graphql.ResolveParams) (interface{}, error) {
		r, e := s.Get(p.Context, p.Args["id"].(string))
		if e != nil {
			return nil, e
		}
		after, _ := p.Args["after"].(int)
		var events []domain.Event
		for _, v := range r.Events {
			if v.Seq > after {
				events = append(events, v)
			}
		}
		return asMap(events), nil
	}})
	m := object("Mutation", map[string]graphql.Output{})
	m.AddFieldConfig("startRun", &graphql.Field{Type: run, Args: graphql.FieldConfigArgument{"ticketId": &graphql.ArgumentConfig{Type: graphql.NewNonNull(str)}}, Resolve: func(p graphql.ResolveParams) (interface{}, error) {
		r, e := s.Start(p.Context, p.Args["ticketId"].(string))
		return asMap(r), e
	}})
	for _, name := range []string{"approve", "reject", "clarify", "cancel", "resume"} {
		kind := name
		m.AddFieldConfig(name+"Run", &graphql.Field{Type: run, Args: graphql.FieldConfigArgument{"id": &graphql.ArgumentConfig{Type: graphql.NewNonNull(str)}, "text": &graphql.ArgumentConfig{Type: str, DefaultValue: ""}, "digest": &graphql.ArgumentConfig{Type: str, DefaultValue: ""}}, Resolve: func(p graphql.ResolveParams) (interface{}, error) {
			r, e := s.Change(p.Context, p.Args["id"].(string), kind, p.Args["text"].(string), p.Args["digest"].(string))
			return asMap(r), e
		}})
	}
	schema, e := graphql.NewSchema(graphql.SchemaConfig{Query: q, Mutation: m})
	if e != nil {
		panic(e)
	}
	return schema
}
func (s *Server) ExportSchema(w io.Writer) {
	res := graphql.Do(graphql.Params{Schema: s.schema, RequestString: `{__schema{queryType{name} mutationType{name} types{kind name fields(includeDeprecated:true){name args{name type{kind name ofType{kind name ofType{kind name}}}} type{kind name ofType{kind name ofType{kind name}}}} inputFields{name type{kind name ofType{kind name}}} enumValues{name} interfaces{name} possibleTypes{name}} directives{name locations args{name type{kind name ofType{kind name}}}}}}`})
	json.NewEncoder(w).Encode(res)
}

var _ = fmt.Sprintf
