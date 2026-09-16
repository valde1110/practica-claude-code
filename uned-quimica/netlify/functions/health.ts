import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

export const handler: Handler = async () => {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Netlify." }),
    };
  }

  const supabase = createClient(url, serviceKey);
  const { count, error } = await supabase
    .from("asignaturas")
    .select("*", { count: "exact", head: true });

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: error.message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, asignaturas: count ?? 0 }),
  };
};
