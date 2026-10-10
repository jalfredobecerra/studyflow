import "server-only";

import { auth } from "@/auth";
import sql from "@/lib/db";

/** API handlers must return 401 rather than redirecting to an HTML login page. */
export async function authenticatedApiUserId(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) return null;

  const rows = await sql<{ id: string }[]>`
    SELECT id FROM users
    WHERE LOWER(email) = LOWER(${email})
    LIMIT 1
  `;

  return rows[0]?.id ?? null;
}

export const privateJsonHeaders = {
  "Cache-Control": "private, no-store",
};
