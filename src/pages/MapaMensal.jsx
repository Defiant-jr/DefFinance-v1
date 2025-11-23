import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useEmCashValue } from '@/hooks/useEmCashValue';

const weekdayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const MapaMensal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [allData, setAllData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [emCashValue] = useEmCashValue();

  useEffect(() => {
    handleGenerateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateReport = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('lancamentos').select('*');
    setLoading(false);

    if (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setAllData(data || []);
    setReportGenerated(true);
    setGeneratedAt(new Date());
    toast({ title: 'Relatório gerado', description: 'Dados carregados com sucesso.' });
  };

  const handleMonthStep = (step) => {
    const base = new Date(`${selectedMonth}-01T00:00:00`);
    const moved = new Date(base.getFullYear(), base.getMonth() + step, 1);
    setSelectedMonth(format(moved, 'yyyy-MM'));
  };

  const formatCurrency = (value) =>
    (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const calendarCells = useMemo(() => {
  const current = new Date(`${selectedMonth}-01T00:00:00`);
  const start = startOfMonth(current);
  const end = endOfMonth(current);
  const days = eachDayOfInterval({ start, end });

    return days.map((day) => {
      const dayIso = format(day, 'yyyy-MM-dd');
      const dayItems = allData.filter((item) => item.data === dayIso);
      const entradasTotal = dayItems
        .filter((d) => d.tipo === 'Entrada')
        .reduce((acc, d) => acc + (d.valor || 0), 0);
      const saidasTotal = dayItems
        .filter((d) => d.tipo === 'Saida')
        .reduce((acc, d) => acc + (d.valor || 0), 0);

      return {
        date: day,
        entradasTotal,
        saidasTotal,
        despesas: dayItems.filter((d) => d.tipo === 'Saida'),
      };
    });
  }, [allData, selectedMonth]);

  const monthTotals = useMemo(() => {
    return calendarCells.reduce(
      (acc, cell) => {
        acc.entradas += cell.entradasTotal;
        acc.saidas += cell.saidasTotal;
        return acc;
      },
      { entradas: 0, saidas: 0 },
    );
  }, [calendarCells]);

  const overdueTotals = useMemo(() => {
    const current = new Date(`${selectedMonth}-01T00:00:00`);
    const start = startOfMonth(current);
    const isPaid = (status) => (status || '').toLowerCase() === 'pago';

    return allData.reduce(
      (acc, item) => {
        const dateObj = new Date(`${item.data}T00:00:00`);
        if (dateObj >= start || isPaid(item.status)) return acc;
        if (item.tipo === 'Entrada') acc.entradas += item.valor || 0;
        if (item.tipo === 'Saida') acc.saidas += item.valor || 0;
        return acc;
      },
      { entradas: 0, saidas: 0 },
    );
  }, [allData, selectedMonth]);

  const totalsWithAdjustments = useMemo(() => {
    const entradas = monthTotals.entradas + overdueTotals.entradas + emCashValue;
    const saidas = monthTotals.saidas + overdueTotals.saidas;
    return { entradas, saidas, saldo: entradas - saidas };
  }, [monthTotals, overdueTotals, emCashValue]);

  const leadingEmptyCells = useMemo(() => {
    if (!calendarCells.length) return 0;
    // Ajuste para iniciar a semana na segunda-feira
    const dayIndex = getDay(calendarCells[0].date) || 7; // domingo vira 7
    return dayIndex - 1;
  }, [calendarCells]);

  const handleDownloadPdf = () => {
    if (!reportGenerated) {
      toast({
        title: 'Gere o relatório primeiro',
        description: 'Clique em "Gerar relatório" para carregar os dados.',
        variant: 'destructive',
      });
      return;
    }

    const current = new Date(`${selectedMonth}-01T00:00:00`);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const margin = 24;
    const headerY = margin;
    const summaryStartY = headerY + 22;
    const summaryGap = 14;
    const gridStartY = summaryStartY + summaryGap * 3 + 16;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const cellsPerRow = 7;
    const cellsWithPlaceholders = [
      ...Array.from({ length: leadingEmptyCells }, () => null),
      ...calendarCells,
    ];
    const rows = Math.max(1, Math.ceil(cellsWithPlaceholders.length / cellsPerRow));
    const cellWidth = (pageWidth - margin * 2) / cellsPerRow;
    const cellHeight = (pageHeight - gridStartY - margin) / rows;
    const padding = 10;
    const headerColor = { r: 31, g: 41, b: 55 }; // texto principal em branco se fosse dark, mas agora escuro para fundo branco
    const mutedColor = { r: 120, g: 130, b: 145 };
    const borderColor = { r: 200, g: 210, b: 220 };
    const backgroundColor = { r: 255, g: 255, b: 255 };
    const entryColor = { r: 46, g: 204, b: 113 };
    const expenseColor = { r: 0, g: 0, b: 0 };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`Mapa Mensal - ${format(current, 'MMMM yyyy')}`, margin, headerY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(
      `Total de Entradas (inclui atrasados e cash): ${formatCurrency(totalsWithAdjustments.entradas)}`,
      margin,
      summaryStartY,
    );
    doc.text(
      `Total de Despesas (inclui atrasados): ${formatCurrency(totalsWithAdjustments.saidas)}`,
      margin,
      summaryStartY + summaryGap,
    );
    doc.text(
      `Saldo do Mês: ${formatCurrency(totalsWithAdjustments.saldo)}`,
      margin,
      summaryStartY + summaryGap * 2,
    );

    cellsWithPlaceholders.forEach((cell, index) => {
      const row = Math.floor(index / cellsPerRow);
      const col = index % cellsPerRow;
      const x = margin + col * cellWidth;
      const y = gridStartY + row * cellHeight;

      if (!cell) {
        // células vazias do início do mês
        doc.setLineDash([2, 2], 0);
        doc.setDrawColor(mutedColor.r, mutedColor.g, mutedColor.b);
        doc.rect(x, y, cellWidth, cellHeight);
        doc.setLineDash([]);
        doc.setDrawColor(0);
        return;
      }

      // container com fundo e borda para espelhar a UI
      doc.setFillColor(backgroundColor.r, backgroundColor.g, backgroundColor.b);
      doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
      doc.roundedRect(x, y, cellWidth, cellHeight, 8, 8, 'FD');
      doc.setDrawColor(0);

      const netValue = cell.entradasTotal - cell.saidasTotal;
      const netText = formatCurrency(netValue);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(headerColor.r, headerColor.g, headerColor.b);
      doc.text(format(cell.date, 'd'), x + padding, y + padding + 2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
      doc.text(netText, x + cellWidth - padding, y + padding + 2, { align: 'right' });

      const listStartY = y + padding + 12;
      const listMaxY = y + cellHeight - 20;
      let cursorY = listStartY;

      if (cell.despesas.length === 0) {
        doc.setFontSize(8);
        doc.text('Sem despesas', x + padding, cursorY);
      } else {
        const itemFontSize = 7;
        const itemLineHeight = 8;
        const maxItems = 7;
        doc.setFontSize(itemFontSize);
        const nameWidth = cellWidth - padding * 2 - 58; // deixa espaço para o valor à direita
        cell.despesas.slice(0, maxItems).forEach((despesa) => {
          if (cursorY > listMaxY) return;
          const name = despesa.cliente_fornecedor || despesa.descricao || 'Despesa';
          const nameLine = doc.splitTextToSize(name, nameWidth)[0] || name;
          const valueText = formatCurrency(despesa.valor || 0);

          doc.setTextColor(headerColor.r, headerColor.g, headerColor.b);
          doc.text(nameLine, x + padding, cursorY);
          doc.setTextColor(expenseColor.r, expenseColor.g, expenseColor.b);
          doc.text(valueText, x + cellWidth - padding, cursorY, { align: 'right' });

          cursorY += itemLineHeight;
        });
        if (cell.despesas.length > maxItems && cursorY <= listMaxY) {
          doc.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
          doc.setFontSize(7);
          doc.text(`+${cell.despesas.length - maxItems} itens`, x + padding, cursorY);
        }
      }

      // linha inferior e valor de entradas
      doc.setDrawColor(200, 210, 230);
      doc.line(x + padding, y + cellHeight - 12, x + cellWidth - padding, y + cellHeight - 12);
      doc.setDrawColor(0);
      doc.setFontSize(8);
      doc.setTextColor(entryColor.r, entryColor.g, entryColor.b);
      doc.text(`Entradas: ${formatCurrency(cell.entradasTotal)}`, x + padding, y + cellHeight - 2);
      doc.setTextColor(0);
    });

    doc.save(`mapa_mensal_${format(current, 'yyyy_MM')}.pdf`);
  };

  const monthLabel = format(new Date(`${selectedMonth}-01T00:00:00`), 'MMMM yyyy');

  return (
    <>
      <Helmet>
        <title>Mapa Mensal - SysFina</title>
        <meta
          name="description"
          content="Visualize o calendário mensal com despesas por dia e somatório de entradas."
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate('/relatorios')}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Mapa Mensal</h1>
              <p className="text-sm text-gray-300">Calendário das despesas diárias e entradas por dia.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => handleMonthStep(-1)}>
              <ChevronLeft className="h-5 w-5 text-white" />
            </Button>
            <div className="text-lg font-semibold text-white capitalize w-36 text-center">{monthLabel}</div>
            <Button variant="ghost" size="icon" onClick={() => handleMonthStep(1)}>
              <ChevronRight className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CalendarRange className="w-5 h-5" />
              Configuração do relatório
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-end md:justify-between">
              <div className="flex flex-col gap-2 w-full md:w-72">
                <label className="text-sm text-gray-300">Competência</label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleGenerateReport} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {loading ? 'Gerando...' : 'Gerar relatório'}
                </Button>
                <Button
                  onClick={handleDownloadPdf}
                  disabled={!reportGenerated || loading}
                  variant="outline"
                  className="border-blue-500 text-blue-300 hover:bg-blue-500/10"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Gerar PDF (paisagem)
                </Button>
              </div>
            </div>
            {generatedAt && (
              <p className="text-xs text-gray-400">
                Gerado em: {format(generatedAt, 'dd/MM/yyyy HH:mm')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white">Resumo do mês</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
            <div className="rounded-lg bg-white/5 border border-white/10 p-4">
              <p className="text-sm text-gray-300">Total de Entradas</p>
              <p className="text-2xl font-semibold text-green-300">{formatCurrency(totalsWithAdjustments.entradas)}</p>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-4">
              <p className="text-sm text-gray-300">Total de Despesas</p>
              <p className="text-2xl font-semibold text-red-300">{formatCurrency(totalsWithAdjustments.saidas)}</p>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-4">
              <p className="text-sm text-gray-300">Saldo do Mês</p>
              <p
                className={`text-2xl font-semibold ${
                  totalsWithAdjustments.saldo >= 0 ? 'text-green-300' : 'text-orange-300'
                }`}
              >
                {formatCurrency(totalsWithAdjustments.saldo)}
              </p>
            </div>
            <div className="text-xs text-gray-400 md:col-span-3">
              Totais incluem valores em atraso e saldo em cash.
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white">Calendário do mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-7 gap-2 text-center text-gray-300 text-sm">
              {weekdayLabels.map((day) => (
                <div key={day} className="font-semibold tracking-wide">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: leadingEmptyCells }).map((_, idx) => (
                <div key={`empty-${idx}`} className="rounded-xl border border-dashed border-white/10 h-28" />
              ))}
              {calendarCells.map((cell) => (
                <div
                  key={cell.date.toISOString()}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col gap-2 text-white"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{format(cell.date, 'd')}</span>
                    <span className="text-xs text-gray-300">
                      {formatCurrency(cell.saidasTotal - cell.entradasTotal)}
                    </span>
                  </div>
                  <div className="flex-1 overflow-auto space-y-1">
                    {cell.despesas.length === 0 ? (
                      <p className="text-xs text-gray-400">Sem despesas</p>
                    ) : (
                      cell.despesas.slice(0, 4).map((despesa) => (
                        <div key={despesa.id} className="text-xs flex justify-between gap-1">
                          <span className="truncate max-w-[70%]">{despesa.cliente_fornecedor || despesa.descricao || 'Despesa'}</span>
                          <span className="text-red-300 font-mono">
                            {formatCurrency(despesa.valor || 0)}
                          </span>
                        </div>
                      ))
                    )}
                    {cell.despesas.length > 4 && (
                      <p className="text-[10px] text-gray-400">+{cell.despesas.length - 4} itens</p>
                    )}
                  </div>
                  <div className="text-xs text-green-300 border-t border-white/10 pt-2">
                    Entradas: <span className="font-semibold">{formatCurrency(cell.entradasTotal)}</span>
                  </div>
                </div>
              ))}
            </div>
            {!calendarCells.length && (
              <p className="text-center text-gray-400">Nenhum dado para este mês.</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default MapaMensal;
