import { test, expect } from "@playwright/test";

test("late unauthenticated history cannot replace a successful login", async ({
  page,
}) => {
  test.skip(
    process.env.EXPECT_LIVE_DISABLED === "true",
    "Live access is disabled",
  );
  let release!: () => void, requested!: () => void;
  const delayed = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route("**/api/graphql", async (route) => {
    const query = route.request().postDataJSON().query;
    if (query.includes("runs")) {
      requested();
      await delayed;
      await route.fulfill({
        status: 401,
        json: { error: "Invitation required" },
      });
    } else {
      await route.fulfill({ status: 200, json: { data: { tickets: [] } } });
    }
  });
  await page.route("**/api/session", (route) =>
    route.fulfill({ status: 200, json: { ok: true } }),
  );
  await page.goto("/#run");
  await page.getByRole("tab", { name: "Invited live access" }).click();
  await started;
  await page
    .getByLabel("Invitation token")
    .fill("test-only-invitation-not-a-live-secret");
  await page.getByRole("button", { name: "Open live workspace" }).click();
  await expect(page.getByLabel("Invitation token")).toHaveCount(0);
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/graphql") && r.status() === 401,
  );
  release();
  await response;
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel("Invitation token")).toHaveCount(0);
});
