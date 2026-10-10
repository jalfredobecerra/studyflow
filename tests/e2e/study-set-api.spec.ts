import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

import { createTestStudySet, registerStudent, testPassword } from "./helpers";

const endpoint = "/api/v1/study-sets";

test("unauthenticated users cannot fetch study sets", async ({ request }) => {
  const response = await request.get(endpoint);
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ error: "Authentication required." });
});

test("client library fetches PostgreSQL data and saves a renamed study set", async ({
  page,
}) => {
  await registerStudent(page);
  const studySetPath = await createTestStudySet(page);
  const id = studySetPath.split("/").at(-1);
  expect(id).toBeTruthy();

  await page.goto("/studysets/library");
  await expect(
    page.getByRole("heading", { name: "Study set library" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Programming Fundamentals" })
  ).toBeVisible();

  const library = page.getByTestId("study-set-api-library");
  await library.getByRole("button", { name: "Rename" }).click();
  await library
    .getByRole("textbox", { name: "Rename study set" })
    .fill("Software Architecture Review");
  await library.getByRole("button", { name: "Save title" }).click();
  await expect(library.getByRole("status")).toHaveText(
    "Study set title saved."
  );
  await expect(
    library.getByRole("heading", { name: "Software Architecture Review" })
  ).toBeVisible();

  // Verify the database result through the authenticated API.
  const listResponse = await page.request.get(endpoint);
  expect(listResponse.status()).toBe(200);
  const list = await listResponse.json();
  expect(list.studySets).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id, title: "Software Architecture Review" }),
    ])
  );

  await page.reload();
  await expect(
    library.getByRole("heading", { name: "Software Architecture Review" })
  ).toBeVisible();
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Software Architecture Review" })
  ).toBeVisible();
});

test("API validates titles and prevents cross-account updates", async ({
  page,
}) => {
  await registerStudent(page);
  const ownerPath = await createTestStudySet(page);
  const id = ownerPath.split("/").at(-1);
  expect(id).toBeTruthy();

  const invalid = await page.request.patch(`${endpoint}/${id}`, {
    data: { title: "x" },
  });
  expect(invalid.status()).toBe(400);

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  const otherEmail = `api-student-${randomUUID()}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Email").fill(otherEmail);
  await page.getByLabel("Password", { exact: true }).fill(testPassword);
  await page.getByLabel("Confirm password").fill(testPassword);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const forbidden = await page.request.patch(`${endpoint}/${id}`, {
    data: { title: "Unauthorized edit" },
  });
  expect(forbidden.status()).toBe(404);

  const privateDetail = await page.request.get(`${endpoint}/${id}`);
  expect(privateDetail.status()).toBe(404);
});
