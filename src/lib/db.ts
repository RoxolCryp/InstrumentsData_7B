import { neon } from "@neondatabase/serverless";

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Falta configurar DATABASE_URL en las variables de entorno.");
  }
  return neon(databaseUrl);
}

export async function ensureTable() {
  await getSql()`
    CREATE TABLE IF NOT EXISTS instruments (
      id BIGSERIAL PRIMARY KEY,
      person_name TEXT NOT NULL,
      instrument_name TEXT NOT NULL,
      part_number TEXT NOT NULL,
      serial_number TEXT NOT NULL,
      photo_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}
