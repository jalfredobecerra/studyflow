import "server-only";

import postgres from "postgres";

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not defined.");
}

const sql = postgres(process.env.POSTGRES_URL);

export default sql;
