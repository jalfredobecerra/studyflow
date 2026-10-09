import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

// Test data

const testPassword = "StudyFlow123";

const testNotes = `
Encapsulation: A programming principle that restricts direct access to internal object data.

A function is a reusable block of code designed to perform a specific task.

Polymorphism allows different objects to respond to the same method in different ways.

Variables store information that a program can access and modify during execution.
`;

const updatedFront = "What is encapsulation in programming?";

// Helper: Create a new account

async function createAccount(page: Page, email: string) {
  await page.goto("/signup");

  await page.getByLabel("Email").fill(email);

  await page.getByLabel("Password", { exact: true }).fill(testPassword);

  await page.getByLabel("Confirm password").fill(testPassword);

  await page
    .getByRole("button", {
      name: "Create account",
    })
    .click();

  await expect(page).toHaveURL(/\/onboarding$/);
}

// Helper: Log in to an existing account

async function loginAccount(page: Page, email: string) {
  await page.goto("/login");

  await page.getByLabel("Email").fill(email);

  await page.getByLabel("Password", { exact: true }).fill(testPassword);

  await page
    .getByRole("button", {
      name: "Log in",
    })
    .click();

  await expect(page).toHaveURL(/\/dashboard$/);
}

// Main end-to-end test

test("student study workflow and access control", async ({ page }) => {
  // Allow enough time for the complete workflow.
  test.setTimeout(150_000);

  // Print unexpected browser errors.
  page.on("pageerror", (error) => {
    console.log("BROWSER ERROR:", error.message);
  });

  // Print HTTP server errors.
  page.on("response", (response) => {
    if (response.status() >= 500) {
      console.log("SERVER ERROR:", {
        status: response.status(),
        url: response.url(),
      });
    }
  });

  const firstEmail = `student-${randomUUID()}@example.com`;

  // STEP 1: Create an account

  await createAccount(page, firstEmail);

  console.log("STEP 1 PASSED: Account created.");

  // STEP 2: Complete onboarding

  console.log("STEP 2 STARTED: Completing onboarding.");

  await expect(page).toHaveURL(/\/onboarding$/);

  // Select the correct option from the study goal dropdown.
  const studyGoal = page.getByRole("combobox", {
    name: "What is your main study goal?",
  });

  await expect(studyGoal).toBeVisible();

  await studyGoal.selectOption({
    label: "Study programming",
  });

  // Verify the correct option was selected.
  await expect(studyGoal.locator("option:checked")).toHaveText(
    "Study programming"
  );

  console.log("Study programming selected successfully.");

  // Enter the course or subject.
  const courseArea = page.getByRole("textbox", {
    name: "Course or subject",
  });

  await courseArea.fill("Software Engineering");

  await expect(courseArea).toHaveValue("Software Engineering");

  console.log("Course area entered successfully.");

  // Submit onboarding.
  await page
    .getByRole("button", {
      name: "Continue to dashboard",
    })
    .click();

  await expect(page).toHaveURL(/\/dashboard$/, {
    timeout: 20000,
  });

  // Verify the saved course appears on the dashboard.
  await expect(
    page.getByText("Software Engineering", {
      exact: true,
    })
  ).toBeVisible();

  console.log("STEP 2 PASSED: Onboarding completed.");

  // STEP 3: Open study set creation

  await page
    .getByRole("link", {
      name: "Create study set",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/studysets\/new$/);

  // Wait until React has initialized the form.
  await expect(page.locator('form[data-hydrated="true"]')).toBeVisible({
    timeout: 30000,
  });

  await expect(
    page.getByRole("button", {
      name: "Create study set and flashcards",
    })
  ).toBeEnabled();

  console.log("STEP 3 PASSED: Study set form is ready.");

  // STEP 4: Enter the study set title

  await page.getByLabel("Study set title").fill("Programming Fundamentals");

  await expect(page.getByLabel("Study set title")).toHaveValue(
    "Programming Fundamentals"
  );

  // STEP 5: Verify validation rejects insufficient notes

  await page.getByLabel("Study notes").fill("Short notes.");

  await page
    .getByRole("button", {
      name: "Create study set and flashcards",
      exact: true,
    })
    .click();

  await expect(
    page.getByText("Add more complete notes before generating flashcards.")
  ).toBeVisible();

  await expect(page).toHaveURL(/\/studysets\/new$/);

  console.log("STEP 5 PASSED: Short notes rejected.");

  // STEP 6: Verify form values are preserved

  await expect(page.getByLabel("Study set title")).toHaveValue(
    "Programming Fundamentals"
  );

  await expect(page.getByLabel("Study notes")).toHaveValue("Short notes.");

  console.log("STEP 6 PASSED: Form values preserved.");

  // STEP 7: Create a study set using valid notes

  await page.getByLabel("Study notes").fill(testNotes);

  await expect(page.getByLabel("Study notes")).toHaveValue(testNotes);

  await expect(page.getByLabel("Study set title")).toHaveValue(
    "Programming Fundamentals"
  );

  // Submit the valid notes.
  await page
    .getByRole("button", {
      name: "Create study set and flashcards",
      exact: true,
    })
    .click();

  // Confirm the application navigates to the study set.
  await expect(page).toHaveURL(/\/studysets\/[0-9a-f-]+$/, { timeout: 30000 });

  // Save the URL for later access control tests.
  const studySetPath = new URL(page.url()).pathname;

  await expect(
    page.getByRole("heading", {
      name: "Programming Fundamentals",
    })
  ).toBeVisible();

  // Confirm that flashcards were generated.
  const acceptButtons = page.getByRole("button", {
    name: "Accept",
    exact: true,
  });

  await expect(acceptButtons.first()).toBeVisible();

  const generatedCardCount = await acceptButtons.count();

  expect(generatedCardCount).toBeGreaterThanOrEqual(2);

  console.log("STEP 7 PASSED: Study set and flashcards created.");

  console.log("Study set URL:", studySetPath);
  console.log("Generated flashcards:", generatedCardCount);

  // STEP 8: Identify a specific flashcard

  const firstFront = page.getByLabel("Front", { exact: true }).first();

  await expect(firstFront).toBeVisible();

  // Capture the field ID to locate the same card later.
  const editedFrontId = await firstFront.getAttribute("id");

  expect(editedFrontId).toBeTruthy();

  const editedCard = page.locator(`form:has(textarea[id="${editedFrontId}"])`);

  await expect(editedCard).toHaveCount(1);

  console.log("STEP 8 PASSED: Selected flashcard.", editedFrontId);

  // STEP 9: Accept the selected flashcard

  await editedCard
    .getByRole("button", {
      name: "Accept",
      exact: true,
    })
    .click();

  await expect(
    editedCard.getByText("accepted", {
      exact: true,
    })
  ).toBeVisible();

  console.log("STEP 9 PASSED: Flashcard accepted.");

  // STEP 10: Edit the same flashcard

  await editedCard.getByLabel("Front", { exact: true }).fill(updatedFront);

  await editedCard
    .getByRole("button", {
      name: "Save changes",
      exact: true,
    })
    .click();

  await expect(
    editedCard.getByText("Changes saved.", {
      exact: true,
    })
  ).toBeVisible();

  console.log("STEP 10 PASSED: Flashcard edited.");

  // STEP 11: Verify the edit persists after reloading

  await page.reload();

  await expect(
    page.getByRole("heading", {
      name: "Programming Fundamentals",
    })
  ).toBeVisible();

  // Find the same card, regardless of display order.
  await expect(editedCard).toHaveCount(1);

  await expect(
    editedCard.getByLabel("Front", {
      exact: true,
    })
  ).toHaveValue(updatedFront);

  console.log("STEP 11 PASSED: Flashcard changes persisted.");

  // STEP 12: Reject a different flashcard

  const cardsBeforeRejection = await page
    .getByLabel("Front", { exact: true })
    .count();

  expect(cardsBeforeRejection).toBeGreaterThanOrEqual(2);

  // Find a rejectable flashcard other than the edited one.
  const rejectCandidate = page
    .locator("form")
    .filter({
      has: page.getByRole("button", {
        name: "Reject",
        exact: true,
      }),
    })
    .filter({
      hasNot: page.locator(`textarea[id="${editedFrontId}"]`),
    })
    .first();

  await expect(rejectCandidate).toBeVisible();

  // Capture its unique field ID BEFORE rejecting it.
  const rejectedFrontId = await rejectCandidate
    .getByLabel("Front", { exact: true })
    .getAttribute("id");

  expect(rejectedFrontId).toBeTruthy();

  // Create a stable locator for this specific flashcard.
  const rejectedCard = page.locator(
    `form:has(textarea[id="${rejectedFrontId}"])`
  );

  await expect(rejectedCard).toHaveCount(1);

  console.log("Rejecting flashcard:", rejectedFrontId);

  // Clear both fields to verify rejection works
  // even when the flashcard content is empty.
  await rejectedCard.getByLabel("Front", { exact: true }).fill("");

  await rejectedCard.getByLabel("Back", { exact: true }).fill("");

  // Reject the selected flashcard.
  await rejectedCard
    .getByRole("button", {
      name: "Reject",
      exact: true,
    })
    .click();

  // Verify this SPECIFIC flashcard disappears.
  await expect(rejectedCard).toHaveCount(0);

  // Verify the total number of visible cards decreases.
  await expect(page.getByLabel("Front", { exact: true })).toHaveCount(
    cardsBeforeRejection - 1
  );

  // Verify the edited flashcard still exists.
  await expect(editedCard).toHaveCount(1);

  await expect(editedCard.getByLabel("Front", { exact: true })).toHaveValue(
    updatedFront
  );

  // Reload to verify the rejection persists.
  await page.reload();

  await expect(rejectedCard).toHaveCount(0);

  await expect(page.getByLabel("Front", { exact: true })).toHaveCount(
    cardsBeforeRejection - 1
  );

  console.log("STEP 12 PASSED: Flashcard rejected.");

  // STEP 13: Return to dashboard

  await page
    .getByRole("link", {
      name: "Back to dashboard",
    })
    .click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await expect(page.getByText("Programming Fundamentals")).toBeVisible();

  console.log("STEP 13 PASSED: Study set on dashboard.");

  // STEP 14: Log out

  await page
    .getByRole("button", {
      name: "Log out",
    })
    .click();

  await expect(page).toHaveURL(/\/login$/);

  console.log("STEP 14 PASSED: User logged out.");

  // STEP 15: Verify protected route redirects guests

  await page.goto("/studysets/new");

  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);

  console.log("STEP 15 PASSED: Protected route requires login.");

  // STEP 16: Log back in

  await loginAccount(page, firstEmail);

  await expect(page.getByText("Programming Fundamentals")).toBeVisible();

  console.log("STEP 16 PASSED: Login successful.");

  // STEP 17: Verify the original study set is accessible

  await page.goto(studySetPath);

  await expect(
    page.getByRole("heading", {
      name: "Programming Fundamentals",
    })
  ).toBeVisible();

  // Verify the edited flashcard still exists.
  await expect(
    page
      .locator(`form:has(textarea[id="${editedFrontId}"])`)
      .getByLabel("Front", { exact: true })
  ).toHaveValue(updatedFront);

  console.log("STEP 17 PASSED: Study set accessible after login.");

  // STEP 18: Log out before creating a second account

  await page.goto("/dashboard");

  await page
    .getByRole("button", {
      name: "Log out",
    })
    .click();

  await expect(page).toHaveURL(/\/login$/);

  // STEP 19: Create a second account

  const secondEmail = `student-${randomUUID()}@example.com`;

  await createAccount(page, secondEmail);

  // Verify onboarding can be skipped.
  await page
    .getByRole("button", {
      name: "Skip for now",
    })
    .click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await expect(page.getByText("General Study", { exact: true })).toBeVisible();

  await expect(page.getByText("General", { exact: true })).toBeVisible();

  console.log("STEP 19 PASSED: Second account created; onboarding skipped.");

  // STEP 20: Verify users cannot access others' study sets

  const unauthorizedResponse = await page.goto(studySetPath);

  expect(unauthorizedResponse).not.toBeNull();

  expect(unauthorizedResponse?.status()).toBe(404);

  await expect(
    page.getByRole("heading", {
      name: "Programming Fundamentals",
    })
  ).toHaveCount(0);

  console.log("STEP 20 PASSED: Another user cannot access the study set.");

  console.log("ALL STUDY FLOW E2E CHECKS PASSED.");
});
