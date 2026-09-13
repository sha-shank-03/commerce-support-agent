import { test, expect } from "@playwright/test";

test("replay playback hides future evidence, approvals and receipts", async ({
  page,
}) => {
  const calls: string[] = [];
  await page.route("**/api/**", (route) => {
    calls.push(route.request().url());
    return route.abort();
  });
  await page.goto("/#run");
  await page.getByRole("button", { name: /A damaged delivery/ }).click();
  await expect(
    page.getByRole("heading", { name: "Action receipt", exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Rewind recording", exact: true })
    .click();
  await expect(page.locator(".timeline li")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Action receipt", exact: false }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Proposed resolution", exact: false }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Order values are a final snapshot.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next event", exact: true }).click();
  await expect(page.locator(".timeline li")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Play recording", exact: true })
    .click();
  await expect
    .poll(() => page.locator(".timeline li").count())
    .toBeGreaterThan(1);
  await page
    .getByRole("button", { name: "Pause recording", exact: true })
    .click();
  const paused = await page.locator(".timeline li").count();
  await page.waitForTimeout(1100);
  await expect(page.locator(".timeline li")).toHaveCount(paused);
  await page
    .getByRole("button", { name: "Show final result", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Action receipt", exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Approve simulated action" }),
  ).toHaveCount(0);
  expect(calls).toEqual([]);
});

test("genuine model metadata renders without guessing missing values", async ({
  page,
}) => {
  await page.goto("/#run");
  const replay = await (await page.request.get("/replays/damage.json")).json();
  await page.getByRole("button", { name: /A damaged delivery/ }).click();
  const spans = replay.run.events.filter(
    (e: any) => e.call?.phase === "completed",
  );
  if (!spans.length) {
    await expect(
      page.getByText("Historical recording:", { exact: false }),
    ).toBeVisible();
  } else {
    const event = page
      .locator(".model-event")
      .filter({ hasText: "Model response received" })
      .first();
    await event.locator("summary").click();
    await expect(event).toContainText(spans[0].call.model);
    await expect(event).toContainText(
      (spans[0].call.durationMs / 1000).toFixed(2) + " s",
    );
    await expect(event).toContainText(
      spans[0].call.inputTokens + " / " + spans[0].call.outputTokens,
    );
    await expect(
      page.getByText("Historical recording:", { exact: false }),
    ).toHaveCount(0);
  }
});
