import { NextResponse } from "next/server";
import { ensureTable, getSql } from "@/lib/db";

export const runtime = "edge";

export async function GET() {
  try {
    await ensureTable();
    const sql = getSql();
    const instruments = await sql`
      SELECT id, person_name AS "personName", instrument_name AS "instrumentName",
             part_number AS "partNumber", serial_number AS "serialNumber",
             photo_url AS "photoUrl", created_at AS "createdAt"
      FROM instruments ORDER BY created_at DESC
    `;
    return NextResponse.json(instruments);
  } catch (error) {
    console.error("GET /api/instruments", error);
    return NextResponse.json({ error: "No se pudo consultar el inventario." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const personName = String(body.personName ?? "").trim();
    const instrumentName = String(body.instrumentName ?? "").trim();
    const partNumber = String(body.partNumber ?? "").trim();
    const serialNumber = String(body.serialNumber ?? "").trim();
    const photoUrl = String(body.photoUrl ?? "").trim();

    if (!personName || !instrumentName || !partNumber || !serialNumber || !photoUrl) {
      return NextResponse.json({ error: "Completa todos los campos y carga una foto." }, { status: 400 });
    }
    if ([personName, instrumentName, partNumber, serialNumber].some((value) => value.length > 200)) {
      return NextResponse.json({ error: "Los campos de texto no pueden superar 200 caracteres." }, { status: 400 });
    }

    await ensureTable();
    const sql = getSql();
    const [instrument] = await sql`
      INSERT INTO instruments (person_name, instrument_name, part_number, serial_number, photo_url)
      VALUES (${personName}, ${instrumentName}, ${partNumber}, ${serialNumber}, ${photoUrl})
      RETURNING id, person_name AS "personName", instrument_name AS "instrumentName",
                part_number AS "partNumber", serial_number AS "serialNumber",
                photo_url AS "photoUrl", created_at AS "createdAt"
    `;
    return NextResponse.json(instrument, { status: 201 });
  } catch (error) {
    console.error("POST /api/instruments", error);
    return NextResponse.json({ error: "No se pudo guardar el registro." }, { status: 500 });
  }
}
