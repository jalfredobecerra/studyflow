import { expect, test } from "@playwright/test";

import { registerStudent, createTestStudySet } from "./helpers";

// TEST: Complete a review session and verify progress.

test("student completes a review session and sees progress", async ({
  page,
}) => {
  // STEP 1: Register a new student.
  await registerStudent(page);

  console.log("STEP 1 PASSED: Student registered.");

  // STEP 2: Create a study set with generated flashcards.
  await createTestStudySet(page);

  await expect(
    page.getByRole("heading", {
      name: "Programming Fundamentals",
      exact: true,
    })
  ).toBeVisible();

  console.log("STEP 2 PASSED: Study set created.");

  // STEP 3: Accept a generated flashcard.
  const firstAcceptButton = page
    .getByRole("button", {
      name: "Accept",
      exact: true,
    })
    .first();

  await expect(firstAcceptButton).toBeVisible();

  // Identify the selected flashcard.
  const firstFront = page.getByLabel("Front", { exact: true }).first();

  const frontId = await firstFront.getAttribute("id");

  expect(frontId).toBeTruthy();

  const selectedCard = page.locator(`form:has(textarea[id="${frontId}"])`);

  await selectedCard
    .getByRole("button", {
      name: "Accept",
      exact: true,
    })
    .click();

  // Wait until the acceptance is saved.
  await expect(
    selectedCard.getByText("accepted", {
      exact: true,
    })
  ).toBeVisible();

  console.log("STEP 3 PASSED: Flashcard accepted.");

  // STEP 4: Open the dashboard.
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/dashboard$/);

  // Verify that a review is available.
  const reviewLink = page.getByRole("link", {
    name: "Review due cards",
    exact: true,
  });

  await expect(reviewLink).toBeVisible();

  console.log("STEP 4 PASSED: Due review displayed.");

  // STEP 5: Open the review page.
  await reviewLink.click();

  await expect(page).toHaveURL(/\/review$/);

  await expect(
    page.getByRole("button", {
      name: "Start study session",
      exact: true,
    })
  ).toBeVisible();

  console.log("STEP 5 PASSED: Review page opened.");

  // STEP 6: Start the study session.
  await page
    .getByRole("button", {
      name: "Start study session",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("button", {
      name: "Show answer",
      exact: true,
    })
  ).toBeVisible();

  console.log("STEP 6 PASSED: Study session started.");

  // STEP 7: Reveal the flashcard answer.
  await page
    .getByRole("button", {
      name: "Show answer",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("button", {
      name: "Remembered",
      exact: true,
    })
  ).toBeVisible();

  console.log("STEP 7 PASSED: Answer revealed.");

  // STEP 8: Mark the flashcard as remembered.
  await page
    .getByRole("button", {
      name: "Remembered",
      exact: true,
    })
    .click();

  // Since only one card was accepted, the session
  // should now display its completion screen.
  await expect(
    page.getByRole("heading", {
      name: "Review complete",
      exact: true,
    })
  ).toBeVisible();

  console.log("STEP 8 PASSED: Flashcard reviewed.");

  // STEP 9: Finish the study session.
  const finishButton = page.getByRole("button", {
    name: "Finish session",
    exact: true,
  });

  // Wait for all review updates to finish.
  await expect(finishButton).toBeEnabled();

  await finishButton.click();

  // Confirm navigation back to the dashboard.
  await expect(page).toHaveURL(/\/dashboard$/, {
    timeout: 20000,
  });

  console.log("STEP 9 PASSED: Study session completed.");

  // STEP 10: Verify the completed sessions statistic.
  const completedSessionsStat = page.locator("article").filter({
    has: page.getByText("Completed sessions", {
      exact: true,
    }),
  });

  await expect(completedSessionsStat).toHaveCount(1);

  // The second paragraph contains the statistic.
  await expect(completedSessionsStat.locator("p").last()).toHaveText("1");

  console.log("STEP 10 PASSED: Completed sessions count is 1.");

  // STEP 11: Verify the reviewed cards statistic.
  const reviewedCardsStat = page.locator("article").filter({
    has: page.getByText("Cards reviewed", {
      exact: true,
    }),
  });

  await expect(reviewedCardsStat).toHaveCount(1);

  await expect(reviewedCardsStat.locator("p").last()).toHaveText("1");

  console.log("STEP 11 PASSED: Reviewed cards count is 1.");

  // STEP 12: Verify the completed session history.
  const sessionHistory = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Recent completed sessions",
      exact: true,
    }),
  });

  await expect(sessionHistory).toBeVisible();

  await expect(
    sessionHistory.getByText("1 cards reviewed", {
      exact: true,
    })
  ).toBeVisible();

  console.log("STEP 12 PASSED: Review session recorded in history.");

  // STEP 13: Verify progress persists after reload.
  await page.reload();

  const savedCompletedSessions = page.locator("article").filter({
    has: page.getByText("Completed sessions", {
      exact: true,
    }),
  });

  await expect(savedCompletedSessions.locator("p").last()).toHaveText("1");

  const savedReviewedCards = page.locator("article").filter({
    has: page.getByText("Cards reviewed", {
      exact: true,
    }),
  });

  await expect(savedReviewedCards.locator("p").last()).toHaveText("1");

  console.log("STEP 13 PASSED: Review progress persisted after reload.");

  console.log(
    "TEST PASSED: Review session, scheduling, progress, and persistence."
  );
});
