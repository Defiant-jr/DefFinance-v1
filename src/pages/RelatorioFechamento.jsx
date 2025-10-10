import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart2, FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { endOfMonth, format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const unitOptions = [
  { value: 'todas', label: 'Todas' },
  { value: 'angra', label: 'Angra dos Reis' },
  { value: 'mangaratiba', label: 'Mangaratiba' },
  { value: 'casa', label: 'Casa' },
];

const unitFilterMap = {
  angra: 'Angra dos Reis',
  mangaratiba: 'Mangaratiba',
  casa: 'Casa',
};

const RelatorioFechamento = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedUnit, setSelectedUnit] = useState('todas');
  const [entries, setEntries] = useState([]);
  const [exits, setExits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);

  const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? '-' : format(parsed, 'dd/MM/yyyy');
  };

  const unitLabel = unitOptions.find((option) => option.value === selectedUnit)?.label ?? 'Todas';

  const totalEntries = useMemo(
    () => entries.reduce((sum, item) => sum + Number(item.valor || 0), 0),
    [entries]
  );

  const totalExits = useMemo(
    () => exits.reduce((sum, item) => sum + Number(item.valor || 0), 0),
    [exits]
  );

  const saldoFechamento = useMemo(() => totalEntries - totalExits, [totalEntries, totalExits]);

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportGenerated(false);

    try {
      const endOfCurrentMonth = endOfMonth(new Date());
      const endOfCurrentMonthIso = format(endOfCurrentMonth, 'yyyy-MM-dd');

      let entriesQuery = supabase
        .from('lancamentos')
        .select('id, cliente_fornecedor, data, unidade, valor, tipo, status')
        .eq('tipo', 'Entrada')
        .lte('data', endOfCurrentMonthIso)
        .or('status.is.null,status.neq.Pago');

      let exitsQuery = supabase
        .from('lancamentos')
        .select('id, cliente_fornecedor, data, unidade, valor, tipo, status')
        .eq('tipo', 'Saida')
        .lte('data', endOfCurrentMonthIso)
        .or('status.is.null,status.neq.Pago');

      if (selectedUnit !== 'todas') {
        const searchTerm = unitFilterMap[selectedUnit];
        const pattern = `%${searchTerm}%`;
        entriesQuery = entriesQuery.ilike('unidade', pattern);
        exitsQuery = exitsQuery.ilike('unidade', pattern);
      }

      const [{ data: rawEntries, error: entriesError }, { data: rawExits, error: exitsError }] = await Promise.all([
        entriesQuery,
        exitsQuery,
      ]);

      if (entriesError) throw entriesError;
      if (exitsError) throw exitsError;

      const sanitize = (list) =>
        (list || [])
          .filter((item) => item.status !== 'Pago')
          .map((item) => ({
            ...item,
            valor: Number(item.valor || 0),
          }))
          .sort((a, b) => new Date(`${a.data}T00:00:00`) - new Date(`${b.data}T00:00:00`));

      setEntries(sanitize(rawEntries));
      setExits(sanitize(rawExits));
      setGeneratedAt(new Date());
      setReportGenerated(true);
    } catch (error) {
      console.error('Erro ao gerar relatorio de fechamento', error);
      toast({
        title: 'Erro ao gerar relatorio',
        description: error.message ?? 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = () => {
    if (!reportGenerated) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const marginLeft = 40;
    let cursorY = 50;

    doc.setFontSize(18);
    doc.text('Relatorio de Fechamento', marginLeft, cursorY);

    doc.setFontSize(11);
    cursorY += 18;
    doc.text(`Gerado em: ${generatedAt ? format(generatedAt, 'dd/MM/yyyy HH:mm') : '-'}`, marginLeft, cursorY);
    cursorY += 14;
    doc.text(`Unidade: ${unitLabel}`, marginLeft, cursorY);

    const buildTable = (title, items) => {
      cursorY += 24;
      doc.setFontSize(13);
      doc.text(title, marginLeft, cursorY);
      doc.setFontSize(11);

      const tableStartY = cursorY + 8;
      doc.autoTable({
        startY: tableStartY,
        head: [['Nome', 'Vencimento', 'Unidade', 'Valor']],
        body: items.map((item) => [
          item.cliente_fornecedor || '-',
          formatDate(item.data),
          item.unidade || '-',
          formatCurrency(item.valor),
        ]),
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [37, 99, 235] },
        columnStyles: {
          3: { halign: 'right' },
        },
      });

      cursorY = doc.lastAutoTable.finalY;
    };

    if (entries.length) {
      buildTable('Entradas em aberto e a vencer', entries);
      cursorY += 18;
      doc.text(`Total de entradas: ${formatCurrency(totalEntries)}`, marginLeft, cursorY);
    } else {
      cursorY += 24;
      doc.text('Entradas em aberto e a vencer: sem registros', marginLeft, cursorY);
    }

    if (exits.length) {
      cursorY += 32;
      buildTable('Saidas em atraso e em aberto', exits);
      cursorY += 18;
      doc.text(`Total de saidas: ${formatCurrency(totalExits)}`, marginLeft, cursorY);
    } else {
      cursorY += 32;
      doc.text('Saidas em atraso e em aberto: sem registros', marginLeft, cursorY);
    }

    cursorY += 32;
    doc.setFontSize(14);
    doc.text(
      `Saldo do Fechamento: ${formatCurrency(saldoFechamento)}`,
      marginLeft,
      cursorY
    );

    doc.save('relatorio_fechamento.pdf');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <Helmet>
        <title>Relatorio de Fechamento - SysFina</title>
        <meta
          name="description"
          content="Relatorio mensal de fechamento com totais de entradas, saidas e saldo final."
        />
      </Helmet>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate('/relatorios')}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Button>
          <h1 className="text-3xl font-bold text-white">Relatorio de Fechamento</h1>
        </div>
      </div>

      <Card className="bg-white text-slate-900 shadow-xl border border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <BarChart2 className="h-5 w-5" />
            Configuracao do Relatorio
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-slate-700 mb-2">Unidade</label>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent className="bg-white text-slate-900">
                {unitOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value} className="text-slate-900 focus:bg-blue-50">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:justify-end">
            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Gerando...' : 'Gerar Relatorio'}
            </Button>
            <Button
              onClick={handleGeneratePdf}
              disabled={!reportGenerated || loading}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white text-slate-900 rounded-xl shadow-xl border border-gray-200 p-6 space-y-8">
        {!reportGenerated && !loading && (
          <div className="text-center text-slate-500">
            Escolha uma unidade e clique em "Gerar Relatorio" para visualizar os dados do mes corrente.
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {reportGenerated && !loading && (
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Resumo do Fechamento</h2>
                <p className="text-sm text-slate-500">Periodo considerado ate o ultimo dia do mes corrente.</p>
              </div>
              <div className="text-sm text-slate-500">
                <span className="font-medium text-slate-700">Unidade: </span>
                {unitLabel}
                {generatedAt && (
                  <span className="ml-4">
                    <span className="font-medium text-slate-700">Gerado em:</span> {format(generatedAt, 'dd/MM/yyyy HH:mm')}
                  </span>
                )}
              </div>
            </div>

            <section className="space-y-4">
              <header>
                <h3 className="text-xl font-semibold text-slate-800">Entradas em aberto e a vencer</h3>
                <p className="text-sm text-slate-500">Lancamentos ate o ultimo dia do mes corrente, desconsiderando valores ja pagos.</p>
              </header>
              {entries.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">
                  Nenhuma entrada encontrada para os filtros selecionados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                        <th className="px-4 py-3">Nome</th>
                        <th className="px-4 py-3">Vencimento</th>
                        <th className="px-4 py-3">Unidade</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3">{item.cliente_fornecedor || '-'}</td>
                          <td className="px-4 py-3">{formatDate(item.data)}</td>
                          <td className="px-4 py-3">{item.unidade || '-'}</td>
                          <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(item.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total de entradas</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(totalEntries)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>

            <section className="space-y-4">
              <header>
                <h3 className="text-xl font-semibold text-slate-800">Saidas em atraso e em aberto</h3>
                <p className="text-sm text-slate-500">Compras e despesas ate o ultimo dia do mes corrente ainda nao quitadas.</p>
              </header>
              {exits.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">
                  Nenhuma saida encontrada para os filtros selecionados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                        <th className="px-4 py-3">Nome</th>
                        <th className="px-4 py-3">Vencimento</th>
                        <th className="px-4 py-3">Unidade</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exits.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3">{item.cliente_fornecedor || '-'}</td>
                          <td className="px-4 py-3">{formatDate(item.data)}</td>
                          <td className="px-4 py-3">{item.unidade || '-'}</td>
                          <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(item.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total de saidas</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-700">{formatCurrency(totalExits)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-lg font-semibold">
              <div className="flex items-center justify-between text-slate-800">
                <span>Total de entradas</span>
                <span>{formatCurrency(totalEntries)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-800">
                <span>Total de saidas</span>
                <span>{formatCurrency(totalExits)}</span>
              </div>
              <div className="flex items-center justify-between text-2xl">
                <span>Saldo do Fechamento</span>
                <span className={saldoFechamento >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(saldoFechamento)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RelatorioFechamento;
