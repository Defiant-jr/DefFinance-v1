#

## Prompt de desmonte

atue como um analista/programador senior. Verifique todo o codigo do sistema e retire as partes desnecessarias do codigo

O prcesso de integração passara somente a importar os dados da planilha de "Rrecebimentos" e alimentara a tabela de "lançamentos", Antes de fazer a importação, todos os dados da tabela "Lançamentos" que contenha no campo "Tipo" igual a "Entrada" devera ser apagadas e subistituidas pelos registros da planilha de "Recebimentos".


## Importação das Planilhas

### Original

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './cors.ts';
const SPREADSHEET_IDS = {
  pagamentos: '1VxtIv4kMab66yHC0iVp7uCIJxOg42ZacvY9ehlKrWYA',
  recebimentos: '1vDw0K8w3qHxYgPo-t9bapMOZ4Q2zlOsWUGaz12cDQRY'
};
const parseDate = (dateString)=>{
  if (!dateString || typeof dateString !== 'string' || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return null;
  }
  const [day, month, year] = dateString.split('/');
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.toISOString().split('T')[0];
};
const parseCurrency = (currencyString)=>{
  if (typeof currencyString !== 'string' || !currencyString) {
    return 0;
  }
  const number = parseFloat(currencyString.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
  return isNaN(number) ? 0 : number;
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Credenciais de ambiente ausentes.');
    }
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const pagamentosUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_IDS.pagamentos}/values/'Pagamentos'!A:F?key=${GOOGLE_API_KEY}`;
    const pagamentosResponse = await fetch(pagamentosUrl);
    if (!pagamentosResponse.ok) throw new Error(`Erro ao buscar pagamentos: ${await pagamentosResponse.text()}`);
    const pagamentosData = await pagamentosResponse.json();
    const recebimentosUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_IDS.recebimentos}/values/'Recebimentos'!A:V?key=${GOOGLE_API_KEY}`;
    const recebimentosResponse = await fetch(recebimentosUrl);
    if (!recebimentosResponse.ok) throw new Error(`Erro ao buscar recebimentos: ${await recebimentosResponse.text()}`);
    const recebimentosData = await recebimentosResponse.json();
    const lancamentos = [];
    if (pagamentosData.values && pagamentosData.values.length > 1) {
      const headers = pagamentosData.values[0].map((h)=>h.trim());
      const rows = pagamentosData.values.slice(1);
      const colMap = {
        fornecedor: headers.indexOf('Fornecedor'),
        parcela: headers.indexOf('Parcela'),
        vencimento: headers.indexOf('Vencimento'),
        valor: headers.indexOf('Valor'),
        unidade: headers.indexOf('Unidade'),
        dataBaixa: headers.indexOf('Data da Baixa')
      };
      for (const row of rows){
        const valor = parseCurrency(row[colMap.valor]);
        if (valor === 0) continue;
        const dataVencimento = parseDate(row[colMap.vencimento]);
        if (!dataVencimento) continue;
        const dataBaixa = parseDate(row[colMap.dataBaixa]);
        lancamentos.push({
          data: dataVencimento,
          tipo: 'Saida',
          cliente_fornecedor: row[colMap.fornecedor] || 'N/A',
          descricao: row[colMap.fornecedor] || 'N/A',
          valor: valor,
          status: dataBaixa ? 'Pago' : 'A Vencer',
          unidade: row[colMap.unidade] || 'N/A',
          obs: row[colMap.parcela] || '',
          datapag: dataBaixa,
          contato: null,
          aluno: null,
          valor_aberto: null,
          parcela: row[colMap.parcela] || null,
          desc_pontual: null
        });
      }
    }
    if (recebimentosData.values && recebimentosData.values.length > 1) {
      const headers = recebimentosData.values[0].map((h)=>h.trim());
      const rows = recebimentosData.values.slice(1);
      const colMap = {
        sacado: headers.indexOf('Sacado'),
        contato: headers.indexOf('Contato'),
        aluno: headers.indexOf('Aluno'),
        dataVencimento: headers.indexOf('Data de Vencimento'),
        dataBaixa: headers.indexOf('Data da Baixa'),
        categoria: headers.indexOf('Categoria'),
        descricao: headers.indexOf('Descrição'),
        parcela: headers.indexOf('Parcela'),
        valorOriginal: headers.indexOf('Valor Original'),
        valorComDescPont: headers.indexOf('Valor com Desc. Pont.'),
        emAbertoVencido: headers.indexOf('Em aberto (Vencido)'),
        unidade: headers.indexOf('Unidade')
      };
      for (const row of rows){
        const valorOriginal = parseCurrency(row[colMap.valorOriginal]);
        if (valorOriginal === 0) continue;
        const dataVencimento = parseDate(row[colMap.dataVencimento]);
        if (!dataVencimento) continue;
        const dataBaixa = parseDate(row[colMap.dataBaixa]);
        const categoria = row[colMap.categoria] || '';
        const parcela = row[colMap.parcela] || '';
        lancamentos.push({
          data: dataVencimento,
          tipo: 'Entrada',
          cliente_fornecedor: row[colMap.sacado] || 'N/A',
          descricao: row[colMap.descricao] || 'N/A',
          valor: valorOriginal,
          status: dataBaixa ? 'Pago' : 'A Vencer',
          unidade: row[colMap.unidade] || 'N/A',
          obs: `${categoria} / ${parcela}`,
          datapag: dataBaixa,
          contato: row[colMap.contato] || null,
          aluno: row[colMap.aluno] || null,
          valor_aberto: parseCurrency(row[colMap.emAbertoVencido]),
          parcela: parcela,
          desc_pontual: parseCurrency(row[colMap.valorComDescPont])
        });
      }
    }
    const { error: deleteError } = await supabaseAdmin.from('lancamentos').delete().neq('id', 0);
    if (deleteError) throw deleteError;
    if (lancamentos.length > 0) {
      const { error: insertError } = await supabaseAdmin.from('lancamentos').insert(lancamentos);
      if (insertError) throw insertError;
    }
    return new Response(JSON.stringify({
      message: `Importação concluída. ${lancamentos.length} registros processados.`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});

### Alterado

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './cors.ts';
const SPREADSHEET_IDS = {
  recebimentos: '1vDw0K8w3qHxYgPo-t9bapMOZ4Q2zlOsWUGaz12cDQRY'
};
const parseDate = (dateString)=>{
  if (!dateString || typeof dateString !== 'string' || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return null;
  }
  const [day, month, year] = dateString.split('/');
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.toISOString().split('T')[0];
};
const parseCurrency = (currencyString)=>{
  if (typeof currencyString !== 'string' || !currencyString) return 0;
  const number = parseFloat(currencyString.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
  return isNaN(number) ? 0 : number;
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Credenciais de ambiente ausentes.');
    }
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    // === Somente RECEBIMENTOS ===
    const recebimentosUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_IDS.recebimentos}/values/'Recebimentos'!A:V?key=${GOOGLE_API_KEY}`;
    const recebimentosResponse = await fetch(recebimentosUrl);
    if (!recebimentosResponse.ok) {
      throw new Error(`Erro ao buscar recebimentos: ${await recebimentosResponse.text()}`);
    }
    const recebimentosData = await recebimentosResponse.json();
    const lancamentos = [];
    if (recebimentosData.values && recebimentosData.values.length > 1) {
      const headers = recebimentosData.values[0].map((h)=>h.trim());
      const rows = recebimentosData.values.slice(1);
      const colMap = {
        sacado: headers.indexOf('Sacado'),
        contato: headers.indexOf('Contato'),
        aluno: headers.indexOf('Aluno'),
        dataVencimento: headers.indexOf('Data de Vencimento'),
        dataBaixa: headers.indexOf('Data da Baixa'),
        categoria: headers.indexOf('Categoria'),
        descricao: headers.indexOf('Descrição'),
        parcela: headers.indexOf('Parcela'),
        valorOriginal: headers.indexOf('Valor Original'),
        valorComDescPont: headers.indexOf('Valor com Desc. Pont.'),
        emAbertoVencido: headers.indexOf('Em aberto (Vencido)'),
        unidade: headers.indexOf('Unidade')
      };
      for (const row of rows){
        const valorOriginal = parseCurrency(row[colMap.valorOriginal]);
        if (valorOriginal === 0) continue;
        const dataVencimento = parseDate(row[colMap.dataVencimento]);
        if (!dataVencimento) continue;
        const dataBaixa = parseDate(row[colMap.dataBaixa]);
        const categoria = row[colMap.categoria] || '';
        const parcela = row[colMap.parcela] || '';
        lancamentos.push({
          data: dataVencimento,
          tipo: 'Entrada',
          cliente_fornecedor: row[colMap.sacado] || 'N/A',
          descricao: row[colMap.descricao] || 'N/A',
          valor: valorOriginal,
          status: dataBaixa ? 'Pago' : 'A Vencer',
          unidade: row[colMap.unidade] || 'N/A',
          obs: `${categoria} / ${parcela}`,
          datapag: dataBaixa,
          contato: row[colMap.contato] || null,
          aluno: row[colMap.aluno] || null,
          valor_aberto: parseCurrency(row[colMap.emAbertoVencido]),
          parcela: parcela || null,
          desc_pontual: parseCurrency(row[colMap.valorComDescPont])
        });
      }
    }
    // 🧹 Apaga apenas os registros onde tipo = 'Entrada'
    const { error: deleteError } = await supabaseAdmin.from('lancamentos').delete().eq('tipo', 'Entrada');
    if (deleteError) throw deleteError;
    // 📥 Insere os novos lançamentos (apenas tipo Entrada)
    if (lancamentos.length > 0) {
      const { error: insertError } = await supabaseAdmin.from('lancamentos').insert(lancamentos);
      if (insertError) throw insertError;
    }
    return new Response(JSON.stringify({
      message: `Importação concluída. ${lancamentos.length} registros de tipo 'Entrada' atualizados.`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});