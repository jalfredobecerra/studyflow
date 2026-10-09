import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

import { registerStudent, createTestStudySet, testPassword } from "./helpers";

// TEST 1: Study set creation and flashcard editing

test("student can create a study set and edit a flashcard", async ({
  page,
}) => {
  // STEP 1: Register a new student.
  await registerStudent(page);

  // STEP 2: Create a study set with generated flashcards.
  const studySetPath = await createTestStudySet(page);

  await expect(page).toHaveURL(/\/studysets\/[0-9a-f-]+$/);

  await expect(
    page.getByRole("heading", {
      name: "Programming Fundamentals",
      exact: true,
    })
  ).toBeVisible();

  // STEP 3: Verify that flashcards were generated.
  const frontFields = page.getByLabel("Front", {
    exact: true,
  });

  const cardCount = await frontFields.count();

  expect(cardCount).toBeGreaterThanOrEqual(2);

  // STEP 4: Identify the first flashcard by its unique ID.
  const firstFront = frontFields.first();

  await expect(firstFront).toBeVisible();

  const frontFieldId = await firstFront.getAttribute("id");

  expect(frontFieldId).toBeTruthy();

  // Use a stable locator instead of relying on card order.
  const card = page.locator(`form:has(textarea[id="${frontFieldId}"])`);

  await expect(card).toHaveCount(1);

  // STEP 5: Accept the flashcard.
  await card
    .getByRole("button", {
      name: "Accept",
      exact: true,
    })
    .click();

  // Wait for the acceptance Server Action to finish.
  await expect(
    card.getByText("accepted", {
      exact: true,
    })
  ).toBeVisible();

  console.log("Flashcard accepted successfully.");

  // STEP 6: Edit the accepted flashcard.
  const updatedFront = "What is encapsulation?";

  const frontField = card.getByLabel("Front", {
    exact: true,
  });

  await frontField.fill(updatedFront);

  // Verify that the input contains the new text.
  await expect(frontField).toHaveValue(updatedFront);

  // STEP 7: Save the edited flashcard.
  await card
    .getByRole("button", {
      name: "Save changes",
      exact: true,
    })
    .click();

  // Wait for the save Server Action to finish.
  await expect(
    card.getByText("Changes saved.", {
      exact: true,
    })
  ).toBeVisible();

  // Verify that the text remains after saving.
  await expect(frontField).toHaveValue(updatedFront);

  console.log("Flashcard changes saved successfully.");

  // STEP 8: Reload the page to verify persistence.
  await page.reload();

  await expect(page).toHaveURL(/\/studysets\/[0-9a-f-]+$/);

  // Locate the same flashcard by its unique field ID.
  const savedCard = page.locator(`form:has(textarea[id="${frontFieldId}"])`);

  await expect(savedCard).toHaveCount(1);

  await expect(
    savedCard.getByLabel("Front", {
      exact: true,
    })
  ).toHaveValue(updatedFront);

  // Verify that the card remains accepted.
  await expect(
    savedCard.getByText("accepted", {
      exact: true,
    })
  ).toBeVisible();

  console.log("Flashcard persistence after reload passed.");

  // STEP 9: Verify the study set remains accessible.
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/dashboard$/);

  // Target the heading specifically to avoid
  // matching the Upcoming Reviews section.
  await expect(
    page.getByRole("heading", {
      name: "Programming Fundamentals",
      exact: true,
    })
  ).toBeVisible();

  // Reopen the same study set.
  await page.goto(studySetPath);

  await expect(
    page.getByRole("heading", {
      name: "Programming Fundamentals",
      exact: true,
    })
  ).toBeVisible();

  // Verify that the edited card is still saved.
  await expect(
    page
      .locator(`form:has(textarea[id="${frontFieldId}"])`)
      .getByLabel("Front", {
        exact: true,
      })
  ).toHaveValue(updatedFront);

  console.log(
    "TEST 1 PASSED: Study set creation, flashcard editing, and persistence."
  );
});

// TEST 2: Study set ownership and access control

test("student cannot access another user study set", async ({ page }) => {
  // STEP 1: Register the first student.
  await registerStudent(page);

  // STEP 2: Create a study set belonging to the first student.
  const studySetPath = await createTestStudySet(page);

  await expect(
    page.getByRole("heading", {
      name: "Programming Fundamentals",
      exact: true,
    })
  ).toBeVisible();

  console.log("First student created a study set.");

  // STEP 3: Log out the first student.
  await page.goto("/dashboard");

  await page
    .getByRole("button", {
      name: "Log out",
    })
    .click();

  await expect(page).toHaveURL(/\/login$/);

  console.log("First student logged out.");

  // STEP 4: Register a different student.
  const secondEmail = `student-${randomUUID()}@example.com`;

  await page.goto("/signup");

  await page.getByLabel("Email").fill(secondEmail);

  await page
    .getByLabel("Password", {
      exact: true,
    })
    .fill(testPassword);

  await page.getByLabel("Confirm password").fill(testPassword);

  await page
    .getByRole("button", {
      name: "Create account",
    })
    .click();

  await expect(page).toHaveURL(/\/onboarding$/);

  // STEP 5: Skip onboarding for the second student.
  await page
    .getByRole("button", {
      name: "Skip for now",
    })
    .click();

  await expect(page).toHaveURL(/\/dashboard$/);

  console.log("Second student registered successfully.");

  // STEP 6: Attempt to access the first student's study set.
  const unauthorizedResponse = await page.goto(studySetPath);

  expect(unauthorizedResponse).not.toBeNull();

  // Return 404 instead of exposing another user's data.
  expect(unauthorizedResponse?.status()).toBe(404);

  await expect(
    page.getByRole("heading", {
      name: "Programming Fundamentals",
      exact: true,
    })
  ).toHaveCount(0);

  console.log(
    "TEST 2 PASSED: Unauthorized access to another student study set was prevented."
  );
});
