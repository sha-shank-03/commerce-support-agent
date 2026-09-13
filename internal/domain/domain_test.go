package domain

import (
	"testing"
	"time"
)

func damageRun() *Run {
	t := Fixtures()[1]
	return &Run{ID: ID(), Owner: "reviewer", State: "running", Ticket: t, Order: SeedOrder(t), Evidence: []Evidence{}, Events: []Event{}}
}
func TestApprovalAndReceipt(t *testing.T) {
	r := damageRun()
	p, e := Propose(r, "refund", "", "Verified damage", 100)
	if e != nil {
		t.Fatal(e)
	}
	if _, e = Execute(r, p.Digest, 101); e == nil {
		t.Fatal("executed without human approval")
	}
	r.Decision = "approve"
	r.DecisionDigest = p.Digest
	a, e := Execute(r, p.Digest, 101)
	if e != nil {
		t.Fatal(e)
	}
	b, e := Execute(r, p.Digest, 101)
	if e != nil || a.ID != b.ID || r.Order.RefundMinor != 4800 || r.Order.Version != 2 {
		t.Fatal("receipt is not idempotent")
	}
}
func TestForbiddenActions(t *testing.T) {
	tests := []struct {
		name   string
		change func(*Run, *Proposal)
	}{
		{"wrong order", func(r *Run, p *Proposal) { p.OrderID = "other" }},
		{"stale version", func(r *Run, p *Proposal) { r.Order.Version++ }},
		{"expired", func(r *Run, p *Proposal) { p.Expires = 99 }},
		{"digest tampered", func(r *Run, p *Proposal) { p.Digest = "tampered" }},
		{"negative refund", func(r *Run, p *Proposal) { p.AmountMinor = -1; p.Digest = Digest(*p) }},
		{"excess refund", func(r *Run, p *Proposal) { p.AmountMinor = 4801; p.Digest = Digest(*p) }},
		{"no damage", func(r *Run, p *Proposal) { r.Order.Damaged = false }},
		{"already replaced", func(r *Run, p *Proposal) { r.Order.Replaced = true }},
		{"policy conflict", func(r *Run, p *Proposal) { r.Ticket.Scenario = "conflict" }},
		{"unknown action", func(r *Run, p *Proposal) { p.Kind = "send_email"; p.Digest = Digest(*p) }},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			r := damageRun()
			p, _ := Propose(r, "refund", "", "test", 100)
			test.change(r, p)
			if ValidateAction(r, p, 100) == nil {
				t.Fatal("unsafe action accepted")
			}
		})
	}
}
func TestAddressAndReplacement(t *testing.T) {
	r := damageRun()
	if _, e := Propose(r, "address_change", "42 Cedar Lane, Sample City", "test", 100); e == nil {
		t.Fatal("changed shipped order")
	}
	r.Order.Status = "processing"
	if _, e := Propose(r, "address_change", "short", "test", 100); e == nil {
		t.Fatal("invalid address")
	}
	p, e := Propose(r, "address_change", "42 Cedar Lane, Sample City", "test", 100)
	if e != nil {
		t.Fatal(e)
	}
	r.Decision = "approve"
	r.DecisionDigest = p.Digest
	if _, e = Execute(r, p.Digest, 100); e != nil {
		t.Fatal(e)
	}
	if r.Order.Address != p.Address {
		t.Fatal("wrong address")
	}
	r = damageRun()
	r.Order.RefundMinor = 100
	if _, e := Propose(r, "replacement", "", "test", 100); e == nil {
		t.Fatal("replacement after refund")
	}
}
func TestApprovalRejectedCancelledAndSubstituted(t *testing.T) {
	for _, state := range []string{"cancelled", "failed", "awaiting_approval"} {
		t.Run(state, func(t *testing.T) {
			r := damageRun()
			p, _ := Propose(r, "refund", "", "test", 100)
			r.State = state
			r.Decision = "approve"
			r.DecisionDigest = p.Digest
			if _, e := Execute(r, p.Digest, 100); e == nil {
				t.Fatal("invalid state executed")
			}
		})
	}
	r := damageRun()
	p, _ := Propose(r, "refund", "", "test", 100)
	r.Decision = "reject"
	r.DecisionDigest = p.Digest
	if _, e := Execute(r, p.Digest, 100); e == nil {
		t.Fatal("rejected action executed")
	}
}
func TestBudgetLimits(t *testing.T) {
	s := NewState()
	r := damageRun()
	if Reserve(s, r, 250001, 2500000) == nil {
		t.Fatal("run cap bypass")
	}
	if e := Reserve(s, r, 200000, 2500000); e != nil {
		t.Fatal(e)
	}
	if Reserve(s, r, 50001, 2500000) == nil {
		t.Fatal("reservation cap bypass")
	}
	Settle(s, r, 100)
	b := s.Budgets[time.Now().UTC().Format("2006-01")]
	if b.Used != 100 || b.Reserved != 0 || r.ReservedMicros != 0 {
		t.Fatal("incorrect settlement")
	}
	b.Used = 2499999
	if Reserve(s, r, 2, 2500000) == nil {
		t.Fatal("monthly cap bypass")
	}
}
