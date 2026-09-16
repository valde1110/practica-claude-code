import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Revisa el archivo .env.",
  );
}

// Los tipos de fila de cada tabla viven en src/types/database.ts y se usan
// donde hace falta con un cast manual; generar el Database completo que
// espera supabase-js requeriría enlazar el proyecto con su CLI.
export const supabase = createClient(url, publishableKey);
