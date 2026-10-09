import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

// ============================================================
// STUDY FLOW - COMPLETE END-TO-END REGRESSION TEST
// ============================================================

const testPassword = "StudyFlow123";

const testNotes = `
Encapsulation: A programming principle that restricts direct access to internal object data.

A function is a reusable block of code designed to perform a specific task.

Polymorphism allows different objects to respond to the same method in different ways.

Variables store information that a program can access and modify during execution.
`;

const updatedFront = "What is encapsulation in programming?";

// ============================================================
// HELPERS
// ============================================================

async function createAccount(page: Page, email: string) {
  await page.goto("/signup");

  await page.getByLabel("Email").fill(email);

  await page.getByLabel("Password", { exact: true }).fill(testPassword);

  await page.getByLabel("Confirm password").fill(testPassword);

  await page
    .getByRole("button", {
      name: "Create account",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/onboarding$/);
}

async function loginAccount(page: Page, email: string) {
  await page.goto("/login");

  await page.getByLabel("Email").fill(email);

  await page.getByLabel("Password", { exact: true }).fill(testPassword);

  await page
    .getByRole("button", {
      name: "Log in",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/dashboard$/);
}

function studySetHeading(page: Page) {
  return page.getByRole("heading", {
    name: "Programming Fundamentals",
    exact: true,
  });
}

// IMPORTANT:
// Select the complete <section>, not the heading's
// immediate parent <div>.
//
// This allows us to locate both the Create study set
// button AND the existing study sets within the section.

function dashboardStudySets(page: Page) {
  return page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Your study sets",
      exact: true,
    }),
  });
}

function dashboardPreferences(page: Page) {
  return page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Your study preferences",
      exact: true,
    }),
  });
}

function dashboardStudySetHeading(page: Page) {
  return dashboardStudySets(page).getByRole("heading", {
    name: "Programming Fundamentals",
    exact: true,
  });
}

function flashcardByFrontId(page: Page, frontId: string) {
  return page.locator(`form:has(textarea[id="${frontId}"])`);
}

// ============================================================
// MAIN END-TO-END TEST
// ============================================================

test("student study workflow and access control", async ({ page }) => {
  test.setTimeout(150_000);

  page.on("pageerror", (error) => {
    console.log("BROWSER ERROR:", error.message);
  });

  page.on("response", (response) => {
    if (response.status() >= 500) {
      console.log("SERVER ERROR:", {
        status: response.status(),
        url: response.url(),
      });
    }
  });

  const firstEmail = `student-${randomUUID()}@example.com`;

  // ==========================================================
  // STEP 1: CREATE AN ACCOUNT
  // ==========================================================

  await createAccount(page, firstEmail);

  console.log("STEP 1 PASSED: Account created.");

  // ==========================================================
  // STEP 2: COMPLETE ONBOARDING
  // ==========================================================

  console.log("STEP 2 STARTED: Completing onboarding.");

  const studyGoal = page.getByRole("combobox", {
    name: "What is your main study goal?",
  });

  await expect(studyGoal).toBeVisible();

  await studyGoal.selectOption({
    label: "Study programming",
  });

  await expect(studyGoal.locator("option:checked")).toHaveText(
    "Study programming"
  );

  console.log("Study programming selected successfully.");

  const courseArea = page.getByRole("textbox", {
    name: "Course or subject",
  });

  await courseArea.fill("Software Engineering");

  await expect(courseArea).toHaveValue("Software Engineering");

  console.log("Course area entered successfully.");

  await page
    .getByRole("button", {
      name: "Continue to dashboard",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/dashboard$/, {
    timeout: 20000,
  });

  await expect(
    dashboardPreferences(page).getByText("Software Engineering", {
      exact: true,
    })
  ).toBeVisible();

  console.log("STEP 2 PASSED: Onboarding completed.");

  // ==========================================================
  // STEP 3: OPEN STUDY SET CREATION
  // ==========================================================

  const studySetsSection = dashboardStudySets(page);

  await expect(studySetsSection).toHaveCount(1);

  const createStudySetLink = studySetsSection.getByRole("link", {
    name: "Create study set",
    exact: true,
  });

  await expect(createStudySetLink).toHaveCount(1);

  await createStudySetLink.click();

  await expect(page).toHaveURL(/\/studysets\/new$/);

  await expect(page.locator('form[data-hydrated="true"]')).toBeVisible({
    timeout: 30000,
  });

  await expect(
    page.getByRole("button", {
      name: "Create study set and flashcards",
      exact: true,
    })
  ).toBeEnabled();

  console.log("STEP 3 PASSED: Study set form is ready.");

  // ==========================================================
  // STEP 4: ENTER STUDY SET TITLE
  // ==========================================================

  const studySetTitle = page.getByLabel("Study set title");

  await studySetTitle.fill("Programming Fundamentals");

  await expect(studySetTitle).toHaveValue("Programming Fundamentals");

  console.log("STEP 4 PASSED: Study set title entered.");

  // ==========================================================
  // STEP 5: VALIDATE SHORT NOTES
  // ==========================================================

  const notesField = page.getByLabel("Study notes");

  await notesField.fill("Short notes.");

  await page
    .getByRole("button", {
      name: "Create study set and flashcards",
      exact: true,
    })
    .click();

  await expect(
    page.getByText("Add more complete notes before generating flashcards.", {
      exact: true,
    })
  ).toBeVisible();

  await expect(page).toHaveURL(/\/studysets\/new$/);

  console.log("STEP 5 PASSED: Short notes rejected.");

  // ==========================================================
  // STEP 6: VERIFY FORM VALUES ARE PRESERVED
  // ==========================================================

  await expect(studySetTitle).toHaveValue("Programming Fundamentals");

  await expect(notesField).toHaveValue("Short notes.");

  console.log("STEP 6 PASSED: Form values preserved.");

  // ==========================================================
  // STEP 7: CREATE A STUDY SET
  // ==========================================================

  await notesField.fill(testNotes);

  await expect(notesField).toHaveValue(testNotes);

  await expect(studySetTitle).toHaveValue("Programming Fundamentals");

  await page
    .getByRole("button", {
      name: "Create study set and flashcards",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/studysets\/[0-9a-f-]+$/, { timeout: 30000 });

  const studySetPath = new URL(page.url()).pathname;

  await expect(studySetHeading(page)).toBeVisible();

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

  // ==========================================================
  // STEP 8: IDENTIFY A SPECIFIC FLASHCARD
  // ==========================================================

  const firstFront = page.getByLabel("Front", { exact: true }).first();

  await expect(firstFront).toBeVisible();

  const editedFrontId = await firstFront.getAttribute("id");

  expect(editedFrontId).toBeTruthy();

  const editedCard = flashcardByFrontId(page, editedFrontId!);

  await expect(editedCard).toHaveCount(1);

  console.log("STEP 8 PASSED: Selected flashcard.", editedFrontId);

  // ==========================================================
  // STEP 9: ACCEPT THE SELECTED FLASHCARD
  // ==========================================================

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

  // ==========================================================
  // STEP 10: EDIT THE SAME FLASHCARD
  // ==========================================================

  const editedFrontField = editedCard.getByLabel("Front", { exact: true });

  await editedFrontField.fill(updatedFront);

  await expect(editedFrontField).toHaveValue(updatedFront);

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

  await expect(editedFrontField).toHaveValue(updatedFront);

  console.log("STEP 10 PASSED: Flashcard edited.");

  // ==========================================================
  // STEP 11: VERIFY EDIT PERSISTENCE
  // ==========================================================

  await page.reload();

  await expect(studySetHeading(page)).toBeVisible();

  await expect(editedCard).toHaveCount(1);

  await expect(
    editedCard.getByLabel("Front", {
      exact: true,
    })
  ).toHaveValue(updatedFront);

  await expect(
    editedCard.getByText("accepted", {
      exact: true,
    })
  ).toBeVisible();

  console.log("STEP 11 PASSED: Flashcard changes persisted.");

  // ==========================================================
  // STEP 12: REJECT A DIFFERENT FLASHCARD
  // ==========================================================

  const cardsBeforeRejection = await page
    .getByLabel("Front", { exact: true })
    .count();

  expect(cardsBeforeRejection).toBeGreaterThanOrEqual(2);

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

  const rejectedFrontId = await rejectCandidate
    .getByLabel("Front", { exact: true })
    .getAttribute("id");

  expect(rejectedFrontId).toBeTruthy();

  const rejectedCard = flashcardByFrontId(page, rejectedFrontId!);

  await expect(rejectedCard).toHaveCount(1);

  console.log("Rejecting flashcard:", rejectedFrontId);

  await rejectedCard.getByLabel("Front", { exact: true }).fill("");

  await rejectedCard.getByLabel("Back", { exact: true }).fill("");

  await rejectedCard
    .getByRole("button", {
      name: "Reject",
      exact: true,
    })
    .click();

  await expect(rejectedCard).toHaveCount(0);

  await expect(page.getByLabel("Front", { exact: true })).toHaveCount(
    cardsBeforeRejection - 1
  );

  await expect(editedCard).toHaveCount(1);

  await expect(
    editedCard.getByLabel("Front", {
      exact: true,
    })
  ).toHaveValue(updatedFront);

  await page.reload();

  await expect(rejectedCard).toHaveCount(0);

  await expect(page.getByLabel("Front", { exact: true })).toHaveCount(
    cardsBeforeRejection - 1
  );

  console.log("STEP 12 PASSED: Flashcard rejected.");

  // ==========================================================
  // STEP 13: RETURN TO DASHBOARD
  // ==========================================================

  await page
    .getByRole("link", {
      name: "Back to dashboard",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/dashboard$/);

  // FIX:
  // This now searches the entire Your study sets section.
  await expect(dashboardStudySetHeading(page)).toBeVisible();

  console.log("STEP 13 PASSED: Study set on dashboard.");

  // ==========================================================
  // STEP 14: LOG OUT
  // ==========================================================

  await page
    .getByRole("button", {
      name: "Log out",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/login$/);

  console.log("STEP 14 PASSED: User logged out.");

  // ==========================================================
  // STEP 15: VERIFY PROTECTED ROUTE
  // ==========================================================

  await page.goto("/studysets/new");

  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);

  console.log("STEP 15 PASSED: Protected route requires login.");

  // ==========================================================
  // STEP 16: LOG BACK IN
  // ==========================================================

  await loginAccount(page, firstEmail);

  // FIX:
  // Target the study set heading within the complete section.
  await expect(dashboardStudySetHeading(page)).toBeVisible();

  console.log("STEP 16 PASSED: Login successful.");

  // ==========================================================
  // STEP 17: VERIFY STUDY SET AFTER LOGIN
  // ==========================================================

  await page.goto(studySetPath);

  await expect(studySetHeading(page)).toBeVisible();

  await expect(
    flashcardByFrontId(page, editedFrontId!).getByLabel("Front", {
      exact: true,
    })
  ).toHaveValue(updatedFront);

  await expect(flashcardByFrontId(page, rejectedFrontId!)).toHaveCount(0);

  console.log("STEP 17 PASSED: Study set accessible after login.");

  // ==========================================================
  // STEP 18: LOG OUT BEFORE SWITCHING ACCOUNTS
  // ==========================================================

  await page.goto("/dashboard");

  await page
    .getByRole("button", {
      name: "Log out",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/login$/);

  console.log("STEP 18 PASSED: First account logged out.");

  // ==========================================================
  // STEP 19: CREATE SECOND ACCOUNT AND SKIP ONBOARDING
  // ==========================================================

  const secondEmail = `student-${randomUUID()}@example.com`;

  await createAccount(page, secondEmail);

  await page
    .getByRole("button", {
      name: "Skip for now",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/dashboard$/);

  const secondPreferences = dashboardPreferences(page);

  await expect(
    secondPreferences.getByText("General Study", {
      exact: true,
    })
  ).toBeVisible();

  await expect(
    secondPreferences.getByText("General", {
      exact: true,
    })
  ).toBeVisible();

  await expect(
    dashboardStudySets(page).getByText("You have no study sets yet.", {
      exact: true,
    })
  ).toBeVisible();

  console.log("STEP 19 PASSED: Second account created; onboarding skipped.");

  // ==========================================================
  // STEP 20: VERIFY ACCESS CONTROL
  // ==========================================================

  const unauthorizedResponse = await page.goto(studySetPath);

  expect(unauthorizedResponse).not.toBeNull();

  expect(unauthorizedResponse?.status()).toBe(404);

  await expect(studySetHeading(page)).toHaveCount(0);

  console.log("STEP 20 PASSED: Another user cannot access the study set.");

  console.log("ALL STUDY FLOW E2E CHECKS PASSED.");
});
