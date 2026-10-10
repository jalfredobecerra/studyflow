import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import sql from "@/lib/db";
import {
  authenticatedApiUserId,
  privateJsonHeaders,
} from "@/lib/study-set-api-auth";
import type { StudySetDetailResponse } from "@/lib/study-set-api-types";

type RouteContext = { params: Promise<{ id: string }> };

type Row = {
  id: string;
  title: string;
  updated_at: Date;
  card_count: number;
  accepted_count: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UpdateSchema = z.object({
  title: z.string().trim().min(2).max(120),
});

async function getSummary(id: string, userId: string) {
  const rows = await sql<Row[]>`
    SELECT s.id, s.title, s.updated_at,
      COUNT(f.id) FILTER (WHERE f.status <> 'rejected')::int AS card_count,
      COUNT(f.id) FILTER (WHERE f.status = 'accepted')::int AS accepted_count
    FROM study_sets AS s
    LEFT JOIN flashcards AS f ON f.study_set_id = s.id
    WHERE s.id = ${id} AND s.user_id = ${userId}
    GROUP BY s.id, s.title, s.updated_at
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    cardCount: Number(row.card_count),
    acceptedCount: Number(row.accepted_count),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const userId = await authenticatedApiUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required." },
      {
        status: 401,
        headers: privateJsonHeaders,
      }
    );
  }

  const { id } = await context.params;
  if (!UUID.test(id)) {
    return NextResponse.json(
      { error: "Invalid study set ID." },
      {
        status: 400,
        headers: privateJsonHeaders,
      }
    );
  }

  try {
    const studySet = await getSummary(id, userId);
    if (!studySet) {
      return NextResponse.json(
        { error: "Study set not found." },
        {
          status: 404,
          headers: privateJsonHeaders,
        }
      );
    }

    const body: StudySetDetailResponse = { studySet };
    return NextResponse.json(body, { headers: privateJsonHeaders });
  } catch (error) {
    console.error("Study set API detail failed:", error);
    return NextResponse.json(
      { error: "Unable to load study set." },
      {
        status: 500,
        headers: privateJsonHeaders,
      }
    );
  }
}

/** PATCH updates only the authenticated user's study-set title. */
export async function PATCH(request: Request, context: RouteContext) {
  const userId = await authenticatedApiUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required." },
      {
        status: 401,
        headers: privateJsonHeaders,
      }
    );
  }

  const { id } = await context.params;
  if (!UUID.test(id)) {
    return NextResponse.json(
      { error: "Invalid study set ID." },
      {
        status: 400,
        headers: privateJsonHeaders,
      }
    );
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Expected a JSON body." },
      {
        status: 400,
        headers: privateJsonHeaders,
      }
    );
  }

  const parsed = UpdateSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Title must contain 2–120 characters." },
      {
        status: 400,
        headers: privateJsonHeaders,
      }
    );
  }

  try {
    const updated = await sql<{ id: string }[]>`
      UPDATE study_sets
      SET title = ${parsed.data.title}, updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Study set not found." },
        {
          status: 404,
          headers: privateJsonHeaders,
        }
      );
    }

    const studySet = await getSummary(id, userId);
    if (!studySet) {
      return NextResponse.json(
        { error: "Study set not found." },
        {
          status: 404,
          headers: privateJsonHeaders,
        }
      );
    }

    revalidatePath("/dashboard");
    revalidatePath(`/studysets/${id}`);
    revalidatePath(`/studysets/manage/${id}`);

    const body: StudySetDetailResponse = { studySet };
    return NextResponse.json(body, { headers: privateJsonHeaders });
  } catch (error) {
    console.error("Study set API update failed:", error);
    return NextResponse.json(
      { error: "Unable to update study set." },
      {
        status: 500,
        headers: privateJsonHeaders,
      }
    );
  }
}
