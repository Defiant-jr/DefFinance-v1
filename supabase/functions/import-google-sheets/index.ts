import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './cors.ts';

const RECEBIMENTOS_SHEET_ID =
  Deno.env.get('GOOGLE_SHEET_RECEBIMENTOS_ID') ??
  '1vDw0K8w3qHxYgPo-t9bapMOZ4Q2zlOsWUGaz12cDQRY';

const parseDate = (dateString: string | null | undefined): string | null => {
  if (!dateString || typeof dateString !== 'string' || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return null;
  }
  const [day, month, year] = dateString.split('/');
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.toISOString().split('T')[0];
};

const parseCurrency = (value: string | null | undefined): number => {
  if (typeof value !== 'string' || !value) return 0;
  const normalized = value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : 0;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Credenciais de ambiente ausentes.');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const recebimentosUrl = `https://sheets.googleapis.com/v4/spreadsheets/${RECEBIMENTOS_SHEET_ID}/values/'Recebimentos'!A:V?key=${GOOGLE_API_KEY}`;

    const recebimentosResponse = await fetch(recebimentosUrl);
    if (!recebimentosResponse.ok) {
      throw new Error(`Erro ao buscar recebimentos: ${await recebimentosResponse.text()}`);
    }

    const recebimentosData = await recebimentosResponse.json();
    const lancamentos: Record<string, unknown>[] = [];
    const clientesData = new Map<string, { sacado: string }>();

    if (recebimentosData.values && recebimentosData.values.length > 1) {
      const headers: string[] = recebimentosData.values[0].map((h: string) => h.trim());
      const normalize = (value: string) =>
        value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9]/g, '')
          .toLowerCase();
      const normalizedHeaders = headers.map((h) => normalize(h));
      const findHeader = (candidates: string[]) =>
        candidates
          .map((candidate) => normalizedHeaders.indexOf(normalize(candidate)))
          .find((idx) => idx !== -1) ?? -1;

      const rows: string[][] = recebimentosData.values.slice(1);
      const colMap = {
        sacado: headers.indexOf('Sacado'),
        contato: headers.indexOf('Contato'),
        aluno: headers.indexOf('Aluno'),
        cpfCnpj: findHeader(['CPF/CNPJ', 'CPF CNPJ', 'CPF', 'CNPJ']),
        dataVencimento: findHeader(['Data de Vencimento']),
        dataBaixa: findHeader(['Data da Baixa']),
        categoria: findHeader(['Categoria']),
        descricao: findHeader(['Descrição', 'Descricao']),
        parcela: findHeader(['Parcela']),
        valorOriginal: findHeader(['Valor Original']),
        valorComDescPont: findHeader(['Valor com Desc. Pont.']),
        emAbertoVencido: findHeader(['Em aberto (Vencido)']),
        unidade: findHeader(['Unidade']),
      };

      for (const row of rows) {
        const valorOriginal = parseCurrency(row[colMap.valorOriginal]);
        if (valorOriginal === 0) continue;

        const dataVencimento = parseDate(row[colMap.dataVencimento]);
        if (!dataVencimento) continue;

        const dataBaixa = parseDate(row[colMap.dataBaixa]);
        const categoria = row[colMap.categoria] || '';
        const parcela = row[colMap.parcela] || '';
        const cpfCnpj = colMap.cpfCnpj >= 0 ? (row[colMap.cpfCnpj] || '').trim() : '';

        if (cpfCnpj) {
          clientesData.set(cpfCnpj, {
            sacado: row[colMap.sacado] || 'N/A',
          });
        }

        lancamentos.push({
          data: dataVencimento,
          tipo: 'Entrada',
          cliente_fornecedor: row[colMap.sacado] || 'N/A',
          descricao: row[colMap.descricao] || 'N/A',
          valor: valorOriginal,
          status: dataBaixa ? 'Pago' : 'A Vencer',
          unidade: row[colMap.unidade] || 'N/A',
          obs: `${categoria}${categoria && parcela ? ' / ' : ''}${parcela}`,
          datapag: dataBaixa,
          contato: row[colMap.contato] || null,
          aluno: row[colMap.aluno] || null,
          cpf_cnpj: cpfCnpj || null,
          valor_aberto: parseCurrency(row[colMap.emAbertoVencido]),
          parcela: parcela || null,
          desc_pontual: parseCurrency(row[colMap.valorComDescPont]),
        });
      }
    }

    const { error: deleteError } = await supabase.from('lancamentos').delete().eq('tipo', 'Entrada');
    if (deleteError) throw deleteError;

    let lancamentosInseridos = 0;
    if (lancamentos.length > 0) {
      const { error: insertError } = await supabase.from('lancamentos').insert(lancamentos);
      if (insertError) throw insertError;
      lancamentosInseridos = lancamentos.length;
    }

    // Para cada CPF/CNPJ encontrado, chama a função de upsert após inserir os lançamentos.
    let clientesProcessados = 0;
    for (const [cpf, dadosCliente] of clientesData.entries()) {
      const { error: upsertError } = await supabase.rpc('upsert_cliente_fornecedor', {
        p_cpf_cnpj: cpf,
        p_sacado: dadosCliente.sacado || 'N/A',
      });
      if (upsertError) throw upsertError;
      clientesProcessados += 1;
    }

    return new Response(
      JSON.stringify({
        message: `Importação concluída. ${lancamentosInseridos} lançamentos e ${clientesProcessados} clientes processados.`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});
