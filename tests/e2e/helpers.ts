import { expect, type Page } from "@playwright/test";

import { randomUUID } from "node:crypto";

export const testPassword = "StudyFlow123";

export const testNotes = `
Encapsulation: A programming principle that restricts direct access to internal object data.

A function is a reusable block of code designed to perform a specific task.

Polymorphism allows different objects to respond to the same method in different ways.

Variables store information that a program can access and modify during execution.
`;

export async function registerStudent(page: Page): Promise<string> {
  const email = `student-${randomUUID()}@example.com`;

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

  await page
    .getByRole("combobox", {
      name: "What is your main study goal?",
    })
    .selectOption({
      label: "Study programming",
    });

  await page
    .getByRole("textbox", {
      name: "Course or subject",
    })
    .fill("Software Engineering");

  await page
    .getByRole("button", {
      name: "Continue to dashboard",
    })
    .click();

  await expect(page).toHaveURL(/\/dashboard$/);

  return email;
}

export async function createTestStudySet(page: Page): Promise<string> {
  await page.goto("/dashboard");

  await page
    .getByRole("heading", {
      name: "Your study sets",
      exact: true,
    })
    .locator("..")
    .getByRole("link", {
      name: "Create study set",
      exact: true,
    })
    .click();

  await expect(page.locator('form[data-hydrated="true"]')).toBeVisible();

  await page.getByLabel("Study set title").fill("Programming Fundamentals");

  await page.getByLabel("Study notes").fill(testNotes);

  await page
    .getByRole("button", {
      name: "Create study set and flashcards",
    })
    .click();

  await expect(page).toHaveURL(/\/studysets\/[0-9a-f-]+$/, { timeout: 30000 });

  return new URL(page.url()).pathname;
}
