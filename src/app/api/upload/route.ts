import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Selecciona una imagen." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen debe pesar menos de 5 MB." }, { status: 400 });
    }
    const blob = await put(`instrumentos/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("POST /api/upload", error);
    return NextResponse.json({ error: "No se pudo subir la foto. Verifica la configuración de Vercel Blob." }, { status: 500 });
  }
}
