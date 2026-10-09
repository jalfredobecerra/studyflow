import { expect, test } from "@playwright/test";

import { registerStudent, createTestStudySet } from "./helpers";

test("student can change study preferences", async ({ page }) => {
  await registerStudent(page);

  await page.goto("/preferences");

  await page.getByLabel("Review cadence in days").fill("3");

  await page.getByLabel("Study session length in minutes").fill("15");

  await page
    .getByRole("button", {
      name: "Save preferences",
    })
    .click();

  await expect(page.getByText("Study preferences saved.")).toBeVisible();

  await page.reload();

  await expect(page.getByLabel("Review cadence in days")).toHaveValue("3");

  await expect(page.getByLabel("Study session length in minutes")).toHaveValue(
    "15"
  );
});

test("student can change card settings and delete a card", async ({ page }) => {
  await registerStudent(page);

  const studySetPath = await createTestStudySet(page);

  const studySetId = studySetPath.split("/").at(-1);

  await page.goto(`/studysets/manage/${studySetId}`);

  const settingsForm = page
    .locator("form")
    .filter({
      has: page.getByRole("button", {
        name: "Save card settings",
      }),
    })
    .first();

  await settingsForm.getByLabel("Difficulty").selectOption("hard");

  await settingsForm.getByLabel("Mastery").selectOption("learning");

  await settingsForm
    .getByRole("button", {
      name: "Save card settings",
    })
    .click();

  await expect(
    settingsForm.getByText("Flashcard settings saved.")
  ).toBeVisible();

  const deleteButtons = page.getByRole("button", {
    name: "Delete flashcard",
  });

  const countBefore = await deleteButtons.count();

  const deleteForm = page
    .locator("form")
    .filter({
      has: deleteButtons.first(),
    })
    .first();

  await deleteForm
    .getByRole("checkbox", {
      name: "Confirm deletion of this flashcard",
    })
    .check();

  await deleteForm
    .getByRole("button", {
      name: "Delete flashcard",
    })
    .click();

  await expect(deleteButtons).toHaveCount(countBefore - 1);
});

test("student can delete a study set", async ({ page }) => {
  await registerStudent(page);

  const studySetPath = await createTestStudySet(page);

  const studySetId = studySetPath.split("/").at(-1);

  await page.goto(`/studysets/manage/${studySetId}`);

  await page
    .getByRole("checkbox", {
      name: "Confirm deletion of this study set",
    })
    .check();

  await page
    .getByRole("button", {
      name: "Delete study set",
    })
    .click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await expect(page.getByText("Programming Fundamentals")).toHaveCount(0);
});

test("student can permanently delete the account", async ({ page }) => {
  await registerStudent(page);

  await page.goto("/preferences");

  await page.getByLabel("Type DELETE to confirm").fill("DELETE");

  await page
    .getByRole("button", {
      name: "Permanently delete my account",
    })
    .click();

  await expect(page).toHaveURL(/\/account\/deleted$/);

  await expect(
    page.getByRole("heading", {
      name: "Your account has been deleted",
    })
  ).toBeVisible();
});
