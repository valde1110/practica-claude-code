import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Asignatura } from "../types/database";

export function AsignaturasScreen() {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [saving, setSaving] = useState(false);

  async function cargar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("asignaturas")
      .select("*")
      .order("orden", { ascending: true });
    if (error) setLoadError(error.message);
    else {
      setLoadError(null);
      setAsignaturas((data ?? []) as Asignatura[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("asignaturas")
      .insert({ nombre: nombre.trim(), codigo: codigo.trim() || null });
    setSaving(false);
    if (error) {
      setLoadError(error.message);
      return;
    }
    setNombre("");
    setCodigo("");
    cargar();
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>UNED Química</h1>
        <button className="btn-secondary" onClick={() => supabase.auth.signOut()}>
          Salir
        </button>
      </header>

      <span className="status-pill">
        <span className={`status-dot ${loadError ? "error" : ""}`} />
        {loadError ? "Sin conexión con Supabase" : "Conectado a Supabase"}
      </span>

      <form className="card" onSubmit={handleSubmit}>
        <h1 style={{ fontSize: "1rem" }}>Añadir asignatura (prueba)</h1>
        <p className="muted">
          En la Fase 2 esto se detectará solo desde Google Drive. Por ahora sirve para comprobar
          que la base de datos funciona.
        </p>
        <label>
          Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </label>
        <label>
          Código (opcional)
          <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="034088" />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Añadir"}
        </button>
        {loadError && <p className="error">{loadError}</p>}
      </form>

      <section style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {loading && <p className="muted">Cargando asignaturas...</p>}
        {!loading && asignaturas.length === 0 && (
          <p className="muted">Todavía no hay ninguna asignatura.</p>
        )}
        {asignaturas.map((a) => (
          <div className="asignatura-item" key={a.id}>
            <span className="nombre">{a.nombre}</span>
            {a.codigo && <span className="codigo">{a.codigo}</span>}
          </div>
        ))}
      </section>
    </div>
  );
}
