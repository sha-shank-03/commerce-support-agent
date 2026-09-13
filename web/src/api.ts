import { z } from "zod";
import { GraphQLClient } from "graphql-request";
import { getSdk } from "./generated";
export const eventSchema = z.object({
  seq: z.number(),
  kind: z.string(),
  title: z.string(),
  detail: z.string(),
  at: z.string(),
});
export const ticketSchema = z.object({
  id: z.string(),
  subject: z.string(),
  message: z.string(),
  orderId: z.string(),
  scenario: z.string(),
});
export const runSchema = z.object({
  id: z.string(),
  state: z.string(),
  summary: z.string().default(""),
  error: z.string().default(""),
  model: z.string(),
  promptVersion: z.string(),
  turns: z.number(),
  usedMicros: z.number(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  ticket: ticketSchema,
  order: z.object({
    id: z.string(),
    status: z.string(),
    totalMinor: z.number(),
    currency: z.string(),
    address: z.string(),
    version: z.number(),
  }),
  events: z.array(eventSchema),
  evidence: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      version: z.string(),
    }),
  ),
  proposal: z
    .object({
      id: z.string(),
      kind: z.string(),
      digest: z.string(),
      amountMinor: z.number(),
      address: z.string(),
      reason: z.string(),
      expires: z.number(),
    })
    .nullable(),
  receipt: z
    .object({ id: z.string(), detail: z.string(), simulated: z.boolean() })
    .nullable(),
});
export type Run = z.infer<typeof runSchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type Replay = {
  label: string;
  run: Run;
  recordedAt: string;
  commit: string;
  providerVerified: boolean;
};
export async function request(path: string, body?: unknown) {
  const response = await fetch("/api" + path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || data.detail || "Request failed");
  return data;
}
const sdk = getSdk(
  new GraphQLClient(new URL("/api/graphql", window.location.origin).href, {
    credentials: "same-origin",
  }),
);
export async function tickets() {
  return z.array(ticketSchema).parse((await sdk.Tickets()).tickets);
}
export async function getRun(id: string) {
  return runSchema.parse((await sdk.GetRun({ id })).run);
}
export async function getRuns() {
  return z.array(runSchema).parse((await sdk.GetRuns()).runs || []);
}
export async function startRun(ticketId: string) {
  return runSchema.parse((await sdk.StartRun({ id: ticketId })).startRun);
}
export async function changeRun(
  action: "approve" | "reject" | "clarify" | "cancel" | "resume",
  id: string,
  text = "",
  digest = "",
) {
  const variables = { id, text, digest };
  const result =
    action === "approve"
      ? (await sdk.Approve(variables)).approveRun
      : action === "reject"
        ? (await sdk.Reject(variables)).rejectRun
        : action === "clarify"
          ? (await sdk.Clarify(variables)).clarifyRun
          : action === "cancel"
            ? (await sdk.Cancel(variables)).cancelRun
            : (await sdk.Resume(variables)).resumeRun;
  return runSchema.parse(result);
}
export async function loadReplays(): Promise<Replay[]> {
  const response = await fetch("/replays/index.json");
  const index = await response.json();
  return Promise.all(
    index.runs.map(async (item: { file: string; label: string }) => {
      if (!/^\/replays\/[a-z0-9-]+\.json$/.test(item.file))
        throw new Error("Invalid replay path");
      const data = await (await fetch(item.file)).json();
      return { ...data, label: item.label, run: runSchema.parse(data.run) };
    }),
  );
}
