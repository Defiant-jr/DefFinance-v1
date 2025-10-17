import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
const recebimentosSheetId = Deno.env.get("GOOGLE_SHEET_RECEBIMENTOS_ID");
const recebimentosRange =
  Deno.env.get("GOOGLE_SHEET_RECEBIMENTOS_RANGE") ?? "A:V";

if (!supabaseUrl) {
  throw new Error("Environment variable SUPABASE_URL is not defined.");
}

if (!supabaseServiceRoleKey) {
  throw new Error("Environment variable SUPABASE_SERVICE_ROLE_KEY is not defined.");
}

if (!googleApiKey) {
  throw new Error("Environment variable GOOGLE_API_KEY is not defined.");
}

if (!recebimentosSheetId) {
  throw new Error("Environment variable GOOGLE_SHEET_RECEBIMENTOS_ID is not defined.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
  global: {
    headers: { "X-Client-Info": "import-google-sheets" },
  },
});

const parseCurrency = (value?: string): number => {
  if (!value) return 0;
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDate = (value?: string): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
};

const buildObservacao = (categoria?: string, parcela?: string): string | null => {
  const categoriaText = categoria?.trim();
  const parcelaText = parcela?.trim();

  if (categoriaText && parcelaText) {
    return `${categoriaText} / ${parcelaText}`;
  }

  return categoriaText || parcelaText || null;
};

const fetchSheetData = async () => {
  const encodedRange = encodeURIComponent(recebimentosRange);
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${recebimentosSheetId}/values/${encodedRange}`,
  );
  url.searchParams.set("key", googleApiKey);

  const response = await fetch(url);

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Google Sheets request failed: ${response.status} ${response.statusText} - ${details}`,
    );
  }

  const payload = await response.json();
  if (!payload?.values || !Array.isArray(payload.values)) {
    throw new Error("Google Sheets response is missing the 'values' array.");
  }

  return payload.values as string[][];
};

type RecebimentoRow = string[] | undefined;

const buildLancamentosEntrada = (values: RecebimentoRow[]): Record<string, unknown>[] => {
  if (!values || values.length <= 1) {
    return [];
  }

  const rows = values.slice(1);
  const registros: Record<string, unknown>[] = [];

  for (const row of rows) {
    if (!row || row.length < 22) continue;

    const valorOriginal = parseCurrency(row[14]);
    const dataVencimento = parseDate(row[4]);

    if (!dataVencimento || valorOriginal === 0) {
      continue;
    }

    const dataBaixa = parseDate(row[5]);
    const status = dataBaixa ? "Pago" : "A Vencer";

    const registro: Record<string, unknown> = {
      data: dataVencimento,
      tipo: "Entrada",
      cliente_fornecedor: row[0]?.trim() || "Sem identificacao",
      descricao: row[12]?.trim() || "",
      valor: valorOriginal,
      status,
      unidade: row[21]?.trim() || null,
      obs: buildObservacao(row[11], row[13]),
      datapag: dataBaixa,
      aluno: row[3]?.trim() || null,
      parcel: row[13]?.trim() || null,
    };

    const descPontual = parseCurrency(row[16]);
    if (descPontual !== 0) {
      registro.desc_pontual = descPontual;
    }

    registros.push(registro);
  }

  return registros;
};

const chunkArray = <T>(items: T[], size: number): T[][] => {
  if (items.length <= size) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const jsonResponse = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });

serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ success: false, message: "Method not allowed" }, 405);
  }

  try {
    const values = await fetchSheetData();
    const registros = buildLancamentosEntrada(values);

    const { error: deleteError } = await supabase.from("lancamentos").delete()
      .eq("tipo", "Entrada");

    if (deleteError) {
      throw new Error(`Falha ao apagar lançamentos de entrada: ${deleteError.message}`);
    }

    if (registros.length > 0) {
      const batches = chunkArray(registros, 500);

      for (const lote of batches) {
        const { error: insertError } = await supabase.from("lancamentos").insert(lote);
        if (insertError) {
          throw new Error(`Falha ao inserir lançamentos: ${insertError.message}`);
        }
      }
    }

    return jsonResponse({
      success: true,
      message: `Importação concluída com ${registros.length} lançamentos de entrada.`,
      total_importado: registros.length,
    });
  } catch (error) {
    console.error("[import-google-sheets] ERRO:", error);
    return jsonResponse(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erro inesperado na importação.",
      },
      500,
    );
  }
});
