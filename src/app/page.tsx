"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Instrument = {
  id: number;
  personName: string;
  instrumentName: string;
  partNumber: string;
  serialNumber: string;
  photoUrl: string;
  createdAt: string;
};

type FormValues = Omit<Instrument, "id" | "createdAt">;
const emptyForm: FormValues = { personName: "", instrumentName: "", partNumber: "", serialNumber: "", photoUrl: "" };

export default function Home() {
  const [items, setItems] = useState<Instrument[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Instrument | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/instruments", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo cargar el inventario.");
      setItems(data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar los datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadItems(); }, [loadItems]);

  const filteredItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    if (!term) return items;
    return items.filter((item) => [item.personName, item.instrumentName, item.partNumber, item.serialNumber]
      .some((value) => value.toLocaleLowerCase("es").includes(term)));
  }, [items, query]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setPhoto(null);
    setPreview("");
    setError("");
    setModalOpen(true);
  }

  function openEdit(item: Instrument) {
    setEditing(item);
    setForm({ personName: item.personName, instrumentName: item.instrumentName, partNumber: item.partNumber, serialNumber: item.serialNumber, photoUrl: item.photoUrl });
    setPhoto(null);
    setPreview(item.photoUrl);
    setError("");
    setModalOpen(true);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("El archivo debe ser una imagen."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("La foto debe pesar menos de 5 MB."); return; }
    setError("");
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      let photoUrl = form.photoUrl;
      if (photo) {
        const uploadData = new FormData();
        uploadData.append("file", photo);
        const upload = await fetch("/api/upload", { method: "POST", body: uploadData });
        const uploadResult = await upload.json();
        if (!upload.ok) throw new Error(uploadResult.error || "No se pudo subir la foto.");
        photoUrl = uploadResult.url;
      }
      if (!photoUrl) throw new Error("Selecciona una foto para el instrumento.");
      const response = await fetch(editing ? `/api/instruments/${editing.id}` : "/api/instruments", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photoUrl }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo guardar el registro.");
      setModalOpen(false);
      setNotice(editing ? "Registro actualizado correctamente." : "Instrumento agregado al inventario.");
      window.setTimeout(() => setNotice(""), 3500);
      await loadItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error inesperado.");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(item: Instrument) {
    if (!window.confirm(`¿Eliminar “${item.instrumentName}” del inventario?`)) return;
    try {
      const response = await fetch(`/api/instruments/${item.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo eliminar.");
      setNotice("Registro eliminado.");
      window.setTimeout(() => setNotice(""), 3500);
      await loadItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar el registro.");
    }
  }

  return (
    <main className="min-h-screen pb-16">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#inicio" aria-label="Instrumentario, inicio">
            <span className="brand-mark"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 28 9.5v13L16 29 4 22.5v-13L16 3Z"/><path d="m10 16 4 4 8-9"/></svg></span>
            <span>instrumentario<span className="brand-dot">.</span></span>
          </a>
          <div className="topbar-right"><span className="live-dot"/> Inventario de instrumentos <span className="topbar-divider"/> <span className="topbar-label">Panel de gestión</span></div>
        </div>
      </header>

      <section id="inicio" className="page-shell">
        <div className="hero-row">
          <div>
            <div className="eyebrow"><span className="eyebrow-line"/> CONTROL DE ACTIVOS</div>
            <h1>Inventario de <span>instrumentos.</span></h1>
            <p className="hero-copy">Un registro claro y confiable de cada instrumento, su identificación y responsable.</p>
          </div>
          <button className="primary-button" onClick={openCreate}><span className="plus">＋</span> Registrar instrumento</button>
        </div>

        <div className="summary-row">
          <div className="summary-card"><div className="summary-icon blue-icon"><svg viewBox="0 0 24 24"><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m4.5 7.8 7.5 4.4 7.5-4.4M12 12.2V21"/></svg></div><div><div className="summary-label">INSTRUMENTOS REGISTRADOS</div><div className="summary-value">{loading ? "—" : items.length}<span className="summary-unit"> equipos</span></div></div></div>
          <div className="summary-card summary-note"><div className="status-icon">✓</div><div><div className="summary-label">REGISTRO CENTRALIZADO</div><div className="summary-sub">Datos y fotos en un solo lugar</div></div></div>
        </div>

        <section className="inventory-panel" aria-label="Inventario">
          <div className="panel-heading">
            <div><h2>Todos los instrumentos</h2><p>Consulta, edita o elimina los registros.</p></div>
            <label className="search-box"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar instrumento..." aria-label="Buscar instrumentos"/><kbd>⌘ K</kbd></label>
          </div>

          {error && !modalOpen && <div className="inline-alert">{error}<button onClick={() => setError("")} aria-label="Cerrar">×</button></div>}
          {notice && <div className="success-alert"><span>✓</span> {notice}</div>}

          <div className="table-wrap">
            <table>
              <thead><tr><th>INSTRUMENTO</th><th>NRO. DE PARTE</th><th>NRO. DE SERIE</th><th>REGISTRADO POR</th><th>FECHA DE ALTA</th><th><span className="sr-only">Acciones</span></th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6}><div className="empty-state"><span className="spinner"/>Cargando inventario...</div></td></tr> : filteredItems.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><div className="empty-illustration"><svg viewBox="0 0 48 48"><path d="M9 15.5 24 7l15 8.5v17L24 41l-15-8.5v-17Z"/><path d="m9.5 16 14.5 8.5L38.5 16M24 24.5V41"/></svg></div><strong>{query ? "No encontramos coincidencias" : "Todavía no hay instrumentos"}</strong><span>{query ? "Prueba con otro nombre, número de parte o serie." : "Agrega el primer registro para comenzar tu inventario."}</span>{!query && <button className="text-button" onClick={openCreate}>＋ Registrar el primer instrumento</button>}</div></td></tr>
                ) : filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td><div className="instrument-cell"><img className="instrument-photo" src={item.photoUrl} alt={`Foto de ${item.instrumentName}`} /><div><strong>{item.instrumentName}</strong><span>Instrumento</span></div></div></td>
                    <td><span className="code-text">{item.partNumber}</span></td>
                    <td><span className="serial-pill">{item.serialNumber}</span></td>
                    <td><div className="person-cell"><span className="avatar">{item.personName.trim().charAt(0).toUpperCase()}</span>{item.personName}</div></td>
                    <td className="date-text">{new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(item.createdAt))}</td>
                    <td><div className="row-actions"><button onClick={() => openEdit(item)} aria-label={`Editar ${item.instrumentName}`} title="Editar"><svg viewBox="0 0 24 24"><path d="m14 5 5 5M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11L4 20Z"/></svg></button><button className="delete-action" onClick={() => void removeItem(item)} aria-label={`Eliminar ${item.instrumentName}`} title="Eliminar"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel-footer"><span>Mostrando <strong>{filteredItems.length}</strong> de <strong>{items.length}</strong> registros</span><span className="footer-secure"><span>●</span> Inventario actualizado</span></div>
        </section>
        <footer className="page-footer"><span>INSTRUMENTARIO <span className="brand-dot">•</span> GESTIÓN DE ACTIVOS</span><span>Hecho para mantener todo en orden.</span></footer>
      </section>

      {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> NUEVO REGISTRO</div><h2 id="modal-title">{editing ? "Editar instrumento" : "Registrar instrumento"}</h2><p>Completa la información para identificar el equipo.</p></div><button className="close-button" onClick={() => setModalOpen(false)} aria-label="Cerrar">×</button></div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field field-wide">Nombre de la persona que carga el dato<input required maxLength={200} value={form.personName} onChange={(e) => setForm({ ...form, personName: e.target.value })} placeholder="Ej. María González" /></label>
              <label className="field field-wide">Nombre del instrumento<input required maxLength={200} value={form.instrumentName} onChange={(e) => setForm({ ...form, instrumentName: e.target.value })} placeholder="Ej. Multímetro digital" /></label>
              <label className="field">Número de parte<input required maxLength={200} value={form.partNumber} onChange={(e) => setForm({ ...form, partNumber: e.target.value })} placeholder="Ej. FLUKE-117" /></label>
              <label className="field">Número de serie<input required maxLength={200} value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} placeholder="Ej. SN-009184" /></label>
              <div className="field field-wide"><span className="field-label">Foto del instrumento</span><label className={`upload-box ${preview ? "has-preview" : ""}`}>
                {preview ? <><img src={preview} alt="Vista previa de la foto"/><span className="upload-overlay">Cambiar foto</span></> : <><span className="upload-icon"><svg viewBox="0 0 24 24"><path d="M12 16V4m-4 4 4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg></span><strong>Haz clic para subir una imagen</strong><span>JPG, PNG o WebP · Máximo 5 MB</span></>}
                <input type="file" accept="image/*" onChange={handlePhotoChange} aria-label="Subir foto del instrumento"/>
              </label></div>
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={saving}>{saving ? <><span className="button-spinner"/> Guardando...</> : editing ? "Guardar cambios" : "Guardar instrumento"}</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
