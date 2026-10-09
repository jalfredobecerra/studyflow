import { expect, test } from "@playwright/test";

import { registerStudent, testPassword } from "./helpers";

test("guest users cannot access the dashboard", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
});

test("student can sign up, log out, and log back in", async ({ page }) => {
  const email = await registerStudent(page);

  await page
    .getByRole("button", {
      name: "Log out",
    })
    .click();

  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Email").fill(email);

  await page.getByLabel("Password", { exact: true }).fill(testPassword);

  await page
    .getByRole("button", {
      name: "Log in",
    })
    .click();

  await expect(page).toHaveURL(/\/dashboard$/);
});
