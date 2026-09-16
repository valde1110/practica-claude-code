export interface Asignatura {
  id: string;
  codigo: string | null;
  nombre: string;
  drive_folder_id: string | null;
  fecha_examen: string | null;
  orden: number;
  created_at: string;
}

export interface Tema {
  id: string;
  asignatura_id: string;
  nombre: string;
  orden: number;
  drive_folder_id: string | null;
  created_at: string;
}

export type CategoriaArchivo = "apunte" | "audio" | "examen" | "ejercicio";

export interface ArchivoDrive {
  id: string;
  asignatura_id: string;
  tema_id: string | null;
  categoria: CategoriaArchivo;
  drive_file_id: string;
  nombre: string;
  mime_type: string | null;
  web_view_link: string | null;
  modified_time: string | null;
  created_at: string;
}

export type TipoPregunta = "test" | "vf" | "corta";
export type EstadoPregunta = "aprobada" | "pendiente_revision" | "descartada";

export interface Pregunta {
  id: string;
  asignatura_id: string;
  tema_id: string | null;
  tipo: TipoPregunta;
  enunciado: string;
  opciones: string[] | null;
  respuesta_correcta: string;
  explicacion: string | null;
  origen: "banco" | "ia_generada";
  estado: EstadoPregunta;
  archivo_origen_id: string | null;
  created_at: string;
}

export interface Ejercicio {
  id: string;
  asignatura_id: string;
  tema_id: string | null;
  titulo: string | null;
  enunciado: string;
  datos: { nombre: string; valor: number | string; unidad?: string }[];
  origen: "examen_resuelto" | "examen_sin_resolver" | "libro_pec" | "ia_generado";
  verificado: boolean;
  archivo_origen_id: string | null;
  created_at: string;
}

export interface PasoEjercicio {
  id: string;
  ejercicio_id: string;
  clave: string;
  descripcion: string;
  dependencias: string[];
  expresion_mathjs: string | null;
  resultado_esperado: string | null;
  unidad: string | null;
  pistas: string[];
  orden_sugerido: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      asignaturas: { Row: Asignatura; Insert: Partial<Asignatura>; Update: Partial<Asignatura> };
      temas: { Row: Tema; Insert: Partial<Tema>; Update: Partial<Tema> };
      archivos_drive: { Row: ArchivoDrive; Insert: Partial<ArchivoDrive>; Update: Partial<ArchivoDrive> };
      preguntas: { Row: Pregunta; Insert: Partial<Pregunta>; Update: Partial<Pregunta> };
      ejercicios: { Row: Ejercicio; Insert: Partial<Ejercicio>; Update: Partial<Ejercicio> };
      pasos_ejercicio: { Row: PasoEjercicio; Insert: Partial<PasoEjercicio>; Update: Partial<PasoEjercicio> };
    };
  };
}
