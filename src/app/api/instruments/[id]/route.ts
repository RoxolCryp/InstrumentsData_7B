import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { ensureTable, getSql } from "@/lib/db";

type RouteContext = { params: { id: string } };

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const id = Number(params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
    }
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
      UPDATE instruments SET person_name = ${personName}, instrument_name = ${instrumentName},
        part_number = ${partNumber}, serial_number = ${serialNumber}, photo_url = ${photoUrl}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, person_name AS "personName", instrument_name AS "instrumentName",
        part_number AS "partNumber", serial_number AS "serialNumber", photo_url AS "photoUrl",
        created_at AS "createdAt"
    `;
    if (!instrument) return NextResponse.json({ error: "Registro no encontrado." }, { status: 404 });
    return NextResponse.json(instrument);
  } catch (error) {
    console.error("PUT /api/instruments/[id]", error);
    return NextResponse.json({ error: "No se pudo actualizar el registro." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const id = Number(params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
    }
    await ensureTable();
    const sql = getSql();
    const [instrument] = await sql`DELETE FROM instruments WHERE id = ${id} RETURNING photo_url AS "photoUrl"`;
    if (!instrument) return NextResponse.json({ error: "Registro no encontrado." }, { status: 404 });
    try {
      await del(instrument.photoUrl);
    } catch (blobError) {
      console.warn("No se pudo borrar la foto en Blob", blobError);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/instruments/[id]", error);
    return NextResponse.json({ error: "No se pudo eliminar el registro." }, { status: 500 });
  }
}
