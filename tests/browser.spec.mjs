import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
test("family journal works privately on desktop and mobile", async ({
  page,
  request,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  expect((await request.get("/api/timeline")).status()).toBe(401);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /A story for/ }),
  ).toBeVisible();
  await page
    .getByLabel("Choose a family password")
    .fill("e2e-test-only-family-password");
  await page.getByRole("button", { name: "Create private journal" }).click();
  await expect(page.getByRole("heading", { name: /Two lives/ })).toBeVisible();
  await expect(page.locator(".event-card").first()).toContainText(
    "Our first date",
  );
  await page.getByLabel("Search memories").fill("we got married");
  await expect(page.locator(".event-card")).toHaveCount(1);
  await page.locator(".event-card").click();
  await expect(page.getByRole("dialog")).toContainText("20 Jun 2020");
  await page.keyboard.press("Escape");
  await page.getByLabel("Search memories").fill("unrecorded-test-search");
  await expect(page.getByText("No moments found, yet.")).toBeVisible();
  await page.getByRole("button", { name: "Show all memories" }).click();
  await expect(page.locator(".event-card").first()).toContainText(
    "Family beginnings",
  );
  await page.getByLabel("Filter by chapter").selectOption("together");
  mkdirSync(".local/screenshots", { recursive: true });
  await page.screenshot({
    path: ".local/screenshots/story-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Where were we?" })
    .click();
  await page.getByLabel("Comparison date").fill("2024-04-07");
  await expect(page.locator(".location-card.maksim")).toContainText("Portugal");
  await expect(page.locator(".location-card.nadya")).toContainText(
    "No location recorded",
  );
  await page.getByLabel("Comparison date").fill("2023-02-10");
  await expect(page.locator(".location-card.maksim")).toContainText(
    "More than one place",
  );
  await page.getByLabel("Comparison date").fill("2024-01-01");
  await page.getByRole("button", { name: "Add Nadya’s location" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("What happened?").fill("Nadya’s Haarlem chapter");
  await dialog
    .getByRole("combobox", { name: "Chapter", exact: true })
    .selectOption("Home");
  await dialog.getByLabel("Start date").fill("2024-01-01");
  await dialog.getByLabel("City").fill("Haarlem");
  await dialog.getByLabel("Country", { exact: true }).fill("Netherlands");
  await dialog
    .getByLabel("How precise is the date?")
    .selectOption("Month only");
  await dialog.getByRole("button", { name: "Save memory" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".location-card.nadya")).toContainText("Haarlem");
  await expect(
    page.getByText("In the same city", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Where were we?" })
    .click();
  await expect(page.locator(".location-card.nadya")).toContainText("Haarlem");
  await expect(page.locator(".context-section")).toContainText("Career");
  await page.screenshot({
    path: ".local/screenshots/compare-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Our places" })
    .click();
  await page
    .locator(".country-card")
    .filter({
      has: page.getByRole("heading", { name: "Netherlands", exact: true }),
    })
    .click();
  await expect(page.locator(".places-heading")).toContainText("Netherlands");
  await expect(page.locator(".place-event")).not.toHaveCount(0);
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Our story" })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `.local/screenshots/story-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Where were we?" })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(".location-card.nadya")).toContainText("Haarlem");
    await page.screenshot({
      path: `.local/screenshots/compare-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Lock journal" }).click();
  await expect(
    page.getByLabel("Family password", { exact: true }),
  ).toBeVisible();
  expect((await page.request.get("/api/timeline")).status()).toBe(401);
  await page
    .getByLabel("Family password", { exact: true })
    .fill("incorrect-password");
  await page.getByRole("button", { name: "Open our story" }).click();
  await expect(page.getByRole("alert")).toContainText("doesn’t match");
  await page
    .getByLabel("Family password", { exact: true })
    .fill("e2e-test-only-family-password");
  await page.getByRole("button", { name: "Open our story" }).click();
  await expect(page.getByRole("heading", { name: /Two lives/ })).toBeVisible();
  expect(errors).toEqual([]);
});
