import { NextResponse } from "next/server";

import sql from "@/lib/db";
import {
  authenticatedApiUserId,
  privateJsonHeaders,
} from "@/lib/study-set-api-auth";
import type { StudySetListResponse } from "@/lib/study-set-api-types";

type StudySetRow = {
  id: string;
  title: string;
  card_count: number;
  accepted_count: number;
  updated_at: Date;
};

/** GET /api/v1/study-sets — current user's real PostgreSQL study sets. */
export async function GET() {
  const userId = await authenticatedApiUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401, headers: privateJsonHeaders }
    );
  }

  try {
    const rows = await sql<StudySetRow[]>`
      SELECT
        s.id,
        s.title,
        s.updated_at,
        COUNT(f.id) FILTER (WHERE f.status <> 'rejected')::int AS card_count,
        COUNT(f.id) FILTER (WHERE f.status = 'accepted')::int AS accepted_count
      FROM study_sets AS s
      LEFT JOIN flashcards AS f ON f.study_set_id = s.id
      WHERE s.user_id = ${userId}
      GROUP BY s.id, s.title, s.updated_at
      ORDER BY s.updated_at DESC, s.id ASC
    `;

    const result: StudySetListResponse = {
      studySets: rows.map((row) => ({
        id: row.id,
        title: row.title,
        cardCount: Number(row.card_count),
        acceptedCount: Number(row.accepted_count),
        updatedAt: new Date(row.updated_at).toISOString(),
      })),
    };

    return NextResponse.json(result, { headers: privateJsonHeaders });
  } catch (error) {
    console.error("Study set API listing failed:", error);
    return NextResponse.json(
      { error: "Unable to load study sets." },
      { status: 500, headers: privateJsonHeaders }
    );
  }
}
