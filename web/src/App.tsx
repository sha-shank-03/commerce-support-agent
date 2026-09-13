import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  FileCheck2,
  Layers3,
  LockKeyhole,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  changeRun,
  getRun,
  getRuns,
  loadReplays,
  request,
  startRun,
  tickets,
  type Replay,
  type Run,
  type Ticket,
} from "./api";

export default function App() {
  const [mode, setMode] = useState<"replay" | "live">("replay"),
    [replays, setReplays] = useState<Replay[]>([]),
    [selected, setSelected] = useState(0),
    [liveTickets, setTickets] = useState<Ticket[]>([]),
    [run, setRun] = useState<Run | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [token, setToken] = useState(""),
    [authenticated, setAuthenticated] = useState(false),
    [clarify, setClarify] = useState(""),
    [step, setStep] = useState(999);
  useEffect(() => {
    loadReplays()
      .then(setReplays)
      .catch(() =>
        setError("Recorded demos could not be loaded. Please refresh."),
      );
  }, []);
  const current = mode === "replay" ? replays[selected]?.run : run;
  const replay = mode === "replay" ? replays[selected] : null;
  useEffect(() => {
    if (mode !== "live") return;
    let active = true;
    Promise.all([tickets(), getRuns()]).then(([items, history]) => {
      if (!active) return;
      setTickets(items); setAuthenticated(true);
      setRun(history.sort((a,b)=>b.events[0]?.at.localeCompare(a.events[0]?.at||'')||0)[0]||null);
    }).catch(() => { if (active) setAuthenticated(false); });
    return () => { active = false; };
  }, [mode]);
  useEffect(() => {
    if (mode !== "live" || run?.state !== "running") return;
    let active = true, pending = false;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && !pending) {
        pending = true;
        getRun(run.id)
          .then(value => { if (active) setRun(value); })
          .catch((e) => { if (active) setError(e.message); })
          .finally(() => { pending = false; });
      }
    }, 1500);
    return () => { active = false; clearInterval(timer); };
  }, [mode, run?.id, run?.state]);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }
  async function login() {
    await request("/session", { token });
    setToken("");
    setTickets(await tickets());
    setAuthenticated(true);
  }
  const events = current?.events.slice(0, step) || [];
  return (
    <div className="shell">
      <header>
        <div className="brand">
          <span className="brandmark">
            <Layers3 size={20} />
          </span>
          Commerce<span className="quiet">/ support agent</span>
        </div>
        <nav className="headerlinks">
          <span className="quiet">A portfolio by Shashank</span>
          <a
            className="source"
            href="https://github.com/sha-shank-03/commerce-support-agent"
            target="_blank"
            rel="noreferrer"
          >
            Source <ArrowUpRight size={12} />
          </a>
        </nav>
      </header>
      <section className="hero">
        <div>
          <div className="eyebrow">Applied agent engineering · OpenAI</div>
          <h1>
            A thoughtful answer.
            <br />A controlled action.
          </h1>
          <p>
            An evidence-first support workspace. Watch an agent investigate a
            customer issue, explain its recommendation, and pause for a human
            decision.
          </p>
        </div>
        <div className="hero-meta">
          <span className="pill">
            <ShieldCheck size={12} />
            Human-approved actions
          </span>
          <p className="quiet" style={{ marginTop: 10 }}>
            Go · Python · React · PostgreSQL
          </p>
        </div>
      </section>
      <div className="modebar">
        <div className="tabs" role="tablist" aria-label="Execution mode">
          <button
            role="tab"
            aria-selected={mode === "replay"}
            onClick={() => {
              setMode("replay");
              setSelected(0);
              setStep(999);
              setError("");
            }}
          >
            <Play size={13} />
            Recorded runs
          </button>
          <button
            role="tab"
            aria-selected={mode === "live"}
            onClick={() => {
              setMode("live");
              setSelected(0);
              setStep(999);
            }}
          >
            <LockKeyhole size={13} />
            Invited live access
          </button>
        </div>
        <span className="quiet">
          {mode === "replay"
            ? "Recorded real runs · no model calls while browsing"
            : "Synthetic data only · limited, metered AI execution"}
        </span>
      </div>
      {error && (
        <div className="banner" role="alert">
          {error}
        </div>
      )}
      {mode === "live" && !authenticated ? (
        <form
          className="panel login"
          onSubmit={(e) => {
            e.preventDefault();
            void action(login);
          }}
        >
          <LockKeyhole size={25} />
          <h2 style={{ marginTop: 15 }}>Your invitation to investigate.</h2>
          <p>
            Live access is invite-only to keep this public demonstration safe
            and inexpensive. Your invitation includes up to five runs. No real
            payments or customer messages are connected.
          </p>
          <label htmlFor="invite">Invitation token</label>
          <input
            id="invite"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <button className="primary" disabled={busy} style={{ marginTop: 17 }}>
            Open live workspace <ChevronRight size={14} />
          </button>
        </form>
      ) : (
        <div className="workspace">
          <aside className="panel">
            <div className="panelhead">
              <h2>
                {mode === "replay" ? "The case files" : "Synthetic inbox"}
              </h2>
            </div>
            {(mode === "replay"
              ? replays.map((r) => r.run.ticket)
              : liveTickets
            ).map((ticket, i) => (
              <button
                key={ticket.id + i}
                className={"scenario " + (selected === i ? "active" : "")}
                onClick={() => {
                  setSelected(i);
                  setStep(999);
                  if (mode === "live") setRun(null);
                }}
              >
                <span className="number">
                  CASE {String(i + 1).padStart(2, "0")}
                </span>
                {ticket.subject}
                <small>
                  {ticket.scenario.replaceAll("_", " ")}{" "}
                  <ChevronRight size={10} />
                </small>
              </button>
            ))}
            {mode === "replay" && !replays.length && (
              <div className="empty">
                The first verified provider recordings are being prepared. No
                synthetic output is presented as a live run.
              </div>
            )}
            <div className="footnote">
              <ShieldCheck size={13} /> Every case uses invented customers and
              demonstration policies.
            </div>
          </aside>
          <main className="panel">
            <div className="panelhead row">
              <h2>Investigation workspace</h2>
              <span className="pill">
                {current?.state.replaceAll("_", " ") || "Ready to inspect"}
              </span>
            </div>
            <div className="panelbody">
              {mode === "live" && !run && liveTickets[selected] ? (
                <>
                  <h2>{liveTickets[selected].subject}</h2>
                  <p className="message">{liveTickets[selected].message}</p>
                  <button
                    className="primary"
                    disabled={busy}
                    style={{ marginTop: 22 }}
                    onClick={() =>
                      void action(async () =>
                        setRun(await startRun(liveTickets[selected].id)),
                      )
                    }
                  >
                    <Sparkles size={14} />
                    Start investigation
                  </button>
                </>
              ) : current ? (
                <>
                  {mode === "replay" && (
                    <div className="replay-controls">
                      <Play size={14} />
                      <input
                        aria-label="Recorded timeline position"
                        type="range"
                        min="0"
                        max={current.events.length}
                        value={Math.min(step, current.events.length)}
                        onChange={(e) => setStep(Number(e.target.value))}
                      />
                      <span className="mono">
                        {Math.min(step, current.events.length)}/
                        {current.events.length}
                      </span>
                    </div>
                  )}
                  <div className="row">
                    <h2>{current.ticket.subject}</h2>
                    <Clock3 size={16} />
                  </div>
                  <div className="card">
                    <span className="avatar">SC</span>
                    <strong style={{ fontSize: 12 }}>Synthetic customer</strong>
                    <p className="message">{current.ticket.message}</p>
                  </div>
                  <div className="metadata">
                    <div>
                      <span>Order</span>
                      <strong>{current.order.id || "Not provided"}</strong>
                    </div>
                    <div>
                      <span>Paid amount</span>
                      <strong>
                        {(current.order.totalMinor / 100).toFixed(2)}{" "}
                        {current.order.currency}
                      </strong>
                    </div>
                    <div>
                      <span>Order state</span>
                      <strong>{current.order.status}</strong>
                    </div>
                  </div>
                  <h3 style={{ marginTop: 24 }}>Evidence, not assumptions</h3>
                  {current.evidence.map((e) => (
                    <details className="evidence" key={e.id}>
                      <summary>
                        {e.title} <span className="quiet">· {e.version}</span>
                      </summary>
                      <p>{e.content}</p>
                      <code>{e.id}</code>
                    </details>
                  ))}
                  {current.summary && (
                    <div className="result">
                      <div className="row">
                        <h3>
                          <Sparkles size={13} /> Agent recommendation
                        </h3>
                        <FileCheck2 size={16} />
                      </div>
                      <p>{current.summary}</p>
                    </div>
                  )}
                  {current.proposal && (
                    <div className="approval">
                      <div className="row">
                        <h3>
                          <LockKeyhole size={13} /> Exact-action approval
                        </h3>
                        <span className="pill warning">
                          {current.proposal.kind.replaceAll("_", " ")}
                        </span>
                      </div>
                      <p>{current.proposal.reason}</p>
                      {current.proposal.amountMinor > 0 && (
                        <strong>
                          {(current.proposal.amountMinor / 100).toFixed(2)}{" "}
                          {current.order.currency}
                        </strong>
                      )}
                      {current.proposal.address && (
                        <p>{current.proposal.address}</p>
                      )}
                      <p className="mono">
                        Digest: {current.proposal.digest.slice(0, 24)}…
                      </p>
                      {mode === "live" &&
                      current.state === "awaiting_approval" ? (
                        <div className="actions">
                          <button
                            className="primary"
                            disabled={busy}
                            onClick={() =>
                              void action(async () =>
                                setRun(
                                  await changeRun(
                                    "approve",
                                    current.id,
                                    "",
                                    current.proposal!.digest,
                                  ),
                                ),
                              )
                            }
                          >
                            <Check size={14} />
                            Approve simulated action
                          </button>
                          <button
                            disabled={busy}
                            onClick={() =>
                              void action(async () =>
                                setRun(
                                  await changeRun(
                                    "reject",
                                    current.id,
                                    "",
                                    current.proposal!.digest,
                                  ),
                                ),
                              )
                            }
                          >
                            <X size={14} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <p className="quiet">
                          {mode === "replay"
                            ? "Recorded decision. This view cannot execute actions."
                            : "Approval already resolved."}
                        </p>
                      )}
                    </div>
                  )}
                  {current.receipt && (
                    <div className="result">
                      <h3>
                        <Check size={14} /> Action receipt
                      </h3>
                      <p>{current.receipt.detail}</p>
                      <div className="mono">{current.receipt.id}</div>
                    </div>
                  )}
                  {current.state === "running" && (
                    <div className="loading" role="status">
                      Investigating evidence…
                      <progress />
                    </div>
                  )}
                  {mode === "live" && current.state === "awaiting_input" && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void action(async () => {
                          setRun(
                            await changeRun("clarify", current.id, clarify),
                          );
                          setClarify("");
                        });
                      }}
                    >
                      <label htmlFor="clarify">Reviewer clarification</label>
                      <textarea
                        id="clarify"
                        value={clarify}
                        onChange={(e) => setClarify(e.target.value)}
                        required
                      />
                      <button className="primary" disabled={busy}>
                        Continue investigation
                      </button>
                    </form>
                  )}
                  {current.error && (
                    <p className="message" role="alert">
                      {current.error}
                    </p>
                  )}
                  {mode === "live" && (
                    <div className="actions">
                      {current.state === "failed" && (
                        <button
                          onClick={() =>
                            void action(async () =>
                              setRun(await changeRun("resume", current.id)),
                            )
                          }
                          disabled={busy}
                        >
                          <RefreshCw size={13} />
                          Retry explicitly
                        </button>
                      )}
                      {!["completed", "cancelled"].includes(current.state) && (
                        <button
                          className="danger"
                          onClick={() =>
                            void action(async () =>
                              setRun(await changeRun("cancel", current.id)),
                            )
                          }
                          disabled={busy}
                        >
                          Cancel run
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="empty">
                  <Layers3 size={30} />
                  <p>
                    Select a verified case to explore its evidence and
                    decisions.
                  </p>
                </div>
              )}
            </div>
          </main>
          <aside className="panel trace">
            <div className="panelhead row">
              <h2>Execution trail</h2>
              <Code2 size={15} />
            </div>
            <ol className="timeline">
              {events.map((e) => (
                <li key={e.seq}>
                  <small>
                    {String(e.seq).padStart(2, "0")} / {e.kind}
                  </small>
                  <strong>{e.title}</strong>
                  <p>{e.detail}</p>
                </li>
              ))}
            </ol>
            {!events.length && (
              <div className="empty">
                Tool calls and decisions will appear here.
              </div>
            )}
            {current && (
              <div
                className="panelbody"
                style={{ borderTop: "1px solid #e6e9df" }}
              >
                <div className="metadata">
                  <div>
                    <span>Model turns</span>
                    <strong>{current.turns}</strong>
                  </div>
                  <div>
                    <span>Model cost</span>
                    <strong>${(current.usedMicros / 1e6).toFixed(4)}</strong>
                  </div>
                </div>
                <p className="mono">
                  {current.model} / {current.promptVersion}
                </p>
              </div>
            )}
            {replay && (
              <div className="footnote">
                Recorded {new Date(replay.recordedAt).toLocaleDateString()}
                <br />
                Commit {replay.commit.slice(0, 12)}
                <br />
                {replay.providerVerified
                  ? "Real provider execution"
                  : "Not provider-verified"}
              </div>
            )}
          </aside>
        </div>
      )}
      <footer>
        <span>
          Independent portfolio demonstration. Not affiliated with Sticker Mule.
        </span>
        <span>Read-only evidence → human approval → simulated receipt</span>
      </footer>
    </div>
  );
}
