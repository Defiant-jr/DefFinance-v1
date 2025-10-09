import React, { useState, useEffect, useMemo } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion, AnimatePresence } from 'framer-motion';
    import { useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { ChevronLeft, ChevronRight, ArrowLeft, Filter, Printer, PlusSquare, MinusSquare } from 'lucide-react';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns';
    import jsPDF from 'jspdf';
    import 'jspdf-autotable';
    import { cn } from '@/lib/utils';

    const FluxoCaixaDetalhado = () => {
      const navigate = useNavigate();
      const { toast } = useToast();
      const [allData, setAllData] = useState([]);
      const [currentDate, setCurrentDate] = useState(new Date());
      const [loading, setLoading] = useState(false);
      const [unidadeFiltro, setUnidadeFiltro] = useState('todas');
      const [viewType, setViewType] = useState('sintetico');
      const [expandedRows, setExpandedRows] = useState({});

      useEffect(() => {
        loadData();
      }, [toast]);

      const loadData = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('lancamentos').select('*');
        if (error) {
          toast({ title: "Erro ao buscar dados", description: error.message, variant: "destructive"});
        } else {
          setAllData(data || []);
        }
        setLoading(false);
      };

      const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setExpandedRows({});
      };

      const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setExpandedRows({});
      };

      const toggleRow = (dia) => {
        setExpandedRows(prev => ({ ...prev, [dia]: !prev[dia] }));
      };

      const formatCurrency = (value) => {
        return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      };

      const monthData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = startOfMonth(currentDate);
        const lastDayOfMonth = endOfMonth(currentDate);
        const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

        let fluxo = daysInMonth.map(day => ({
          dia: format(day, 'dd'),
          receber: 0,
          pagar: 0,
          details: { receber: [], pagar: [] }
        }));

        const filteredByUnit = unidadeFiltro === 'todas' 
          ? allData 
          : allData.filter(item => item.unidade === unidadeFiltro);

        const atrasadosLancamentos = filteredByUnit.filter(item => {
          if (item.status === 'Pago') return false;
          const vencimento = new Date(item.data + 'T00:00:00');
          return vencimento < firstDayOfMonth;
        });

        const dia00 = {
          dia: '00',
          receber: atrasadosLancamentos.filter(i => i.tipo === 'Entrada').reduce((acc, i) => acc + i.valor, 0),
          pagar: atrasadosLancamentos.filter(i => i.tipo === 'Saida').reduce((acc, i) => acc + i.valor, 0),
          details: {
            receber: atrasadosLancamentos.filter(i => i.tipo === 'Entrada'),
            pagar: atrasadosLancamentos.filter(i => i.tipo === 'Saida')
          }
        };

        const monthDataFiltered = filteredByUnit.filter(item => {
          if (item.status === 'Pago') return false;
          const vencimento = new Date(item.data + 'T00:00:00');
          return vencimento.getUTCFullYear() === year && vencimento.getUTCMonth() === month;
        });

        monthDataFiltered.forEach(item => {
          const vencimento = new Date(item.data + 'T00:00:00');
          const dayIndex = vencimento.getUTCDate() - 1;
          if (fluxo[dayIndex]) {
            if (item.tipo === 'Entrada') {
              fluxo[dayIndex].receber += item.valor;
              fluxo[dayIndex].details.receber.push(item);
            } else {
              fluxo[dayIndex].pagar += item.valor;
              fluxo[dayIndex].details.pagar.push(item);
            }
          }
        });

        const fullFluxo = [dia00, ...fluxo];

        let saldoAcumulado = 0;
        return fullFluxo.map(dia => {
          const saldoDia = dia.receber - dia.pagar;
          saldoAcumulado += saldoDia;
          return { ...dia, saldoDia, saldoAcumulado };
        });
      }, [allData, currentDate, unidadeFiltro]);

      const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' });
      const year = currentDate.getFullYear();

      const generatePDF = () => {
        const doc = new jsPDF();
        const tableColumn = ["Dia", "A Receber", "A Pagar", "Saldo do Dia", "Saldo Acumulado"];
        const tableRows = [];

        monthData.forEach(item => {
          const rowData = [
            item.dia === '00' ? 'Atrasados' : item.dia,
            formatCurrency(item.receber),
            formatCurrency(item.pagar),
            formatCurrency(item.saldoDia),
            formatCurrency(item.saldoAcumulado)
          ];
          tableRows.push(rowData);

          if (viewType === 'analitico' && (item.details.receber.length > 0 || item.details.pagar.length > 0)) {
            item.details.receber.forEach(det => {
              tableRows.push([{ content: `  ${det.cliente_fornecedor}`, colSpan: 1 }, { content: formatCurrency(det.valor), styles: { halign: 'right' } }, '', '', '']);
            });
            item.details.pagar.forEach(det => {
              tableRows.push([{ content: `  ${det.cliente_fornecedor}`, colSpan: 1 }, '', { content: formatCurrency(det.valor), styles: { halign: 'right' } }, '', '']);
            });
          }
        });

        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 20,
          headStyles: { fillColor: [22, 163, 74] },
          didDrawPage: function (data) {
            doc.setFontSize(20);
            doc.setTextColor(40);
            doc.text(`Relatório de Fluxo de Caixa - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`, data.settings.margin.left, 15);
          }
        });
        doc.save(`fluxo_caixa_${monthName}_${year}.pdf`);
      };

      return (
        <>
          <Helmet>
            <title>Relatório de Fluxo de Caixa - SysFina</title>
            <meta name="description" content="Gere e visualize o relatório de fluxo de caixa detalhado." />
          </Helmet>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => navigate('/relatorios')} className="text-white hover:bg-white/10">
                    <ArrowLeft className="w-6 h-6" />
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Relatório de Fluxo de Caixa</h1>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-800/50 p-2 rounded-lg">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-6 w-6 text-white" />
                    </Button>
                    <div className="text-xl font-semibold text-white w-48 text-center capitalize">{`${monthName} ${year}`}</div>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="h-6 w-6 text-white" />
                    </Button>
                </div>
            </div>

            <Card className="glass-card">
              <CardHeader className="flex-row justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-white"><Filter className="w-5 h-5" />Filtros</CardTitle>
                <Button onClick={generatePDF}><Printer className="w-4 h-4 mr-2" /> Gerar PDF</Button>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row gap-4">
                <Select value={unidadeFiltro} onValueChange={setUnidadeFiltro}>
                  <SelectTrigger className="w-full md:w-72 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Filtrar por Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Unidades</SelectItem>
                    <SelectItem value="CNA Angra dos Reis">CNA Angra dos Reis</SelectItem>
                    <SelectItem value="CNA Mangaratiba">CNA Mangaratiba</SelectItem>
                    <SelectItem value="Casa">Casa</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={viewType} onValueChange={setViewType}>
                  <SelectTrigger className="w-full md:w-72 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Tipo de Visualização" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sintetico">Sintético</SelectItem>
                    <SelectItem value="analitico">Analítico</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/60 border-slate-700 text-white backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Detalhes do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="p-3 w-12"></th>
                        <th className="p-3">Dia</th>
                        <th className="p-3 text-right text-green-400">A Receber</th>
                        <th className="p-3 text-right text-red-400">A Pagar</th>
                        <th className="p-3 text-right">Saldo do Dia</th>
                        <th className="p-3 text-right">Saldo Acumulado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="6" className="text-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div></td></tr>
                      ) : monthData.length > 0 ? monthData.map((dia) => (
                        <React.Fragment key={dia.dia}>
                          <tr className={cn('border-b border-slate-800 hover:bg-slate-700/50', dia.dia === '00' && 'bg-yellow-500/10')}>
                            <td className="p-3">
                              {viewType === 'analitico' && (dia.details.receber.length > 0 || dia.details.pagar.length > 0) && (
                                <Button variant="ghost" size="icon" onClick={() => toggleRow(dia.dia)} className="h-8 w-8">
                                  {expandedRows[dia.dia] ? <MinusSquare className="h-4 w-4" /> : <PlusSquare className="h-4 w-4" />}
                                </Button>
                              )}
                            </td>
                            <td className={cn('p-3 font-medium', dia.dia === '00' && 'text-yellow-400')}>{dia.dia === '00' ? 'Atrasados' : dia.dia}</td>
                            <td className="p-3 text-right font-mono text-green-400">{formatCurrency(dia.receber)}</td>
                            <td className="p-3 text-right font-mono text-red-400">{formatCurrency(dia.pagar)}</td>
                            <td className={cn('p-3 text-right font-mono', dia.saldoDia >= 0 ? 'text-blue-300' : 'text-orange-400')}>{formatCurrency(dia.saldoDia)}</td>
                            <td className={cn('p-3 text-right font-mono', dia.saldoAcumulado >= 0 ? 'text-white' : 'text-red-500')}>{formatCurrency(dia.saldoAcumulado)}</td>
                          </tr>
                          <AnimatePresence>
                          {viewType === 'analitico' && expandedRows[dia.dia] && (
                            <motion.tr
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="bg-slate-900/50"
                            >
                              <td colSpan="6" className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 p-4">
                                  <div>
                                    <h4 className="font-semibold text-green-400 mb-2 border-b border-slate-700 pb-1">Entradas</h4>
                                    {dia.details.receber.length > 0 ? dia.details.receber.map(item => (
                                      <div key={item.id} className="flex justify-between text-sm py-1">
                                        <span>{item.cliente_fornecedor}</span>
                                        <span className="font-mono">{formatCurrency(item.valor)}</span>
                                      </div>
                                    )) : <p className="text-xs text-slate-400">Nenhuma entrada.</p>}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-red-400 mb-2 border-b border-slate-700 pb-1">Saídas</h4>
                                    {dia.details.pagar.length > 0 ? dia.details.pagar.map(item => (
                                      <div key={item.id} className="flex justify-between text-sm py-1">
                                        <span>{item.cliente_fornecedor}</span>
                                        <span className="font-mono">{formatCurrency(item.valor)}</span>
                                      </div>
                                    )) : <p className="text-xs text-slate-400">Nenhuma saída.</p>}
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          )}
                          </AnimatePresence>
                        </React.Fragment>
                      )) : (
                        <tr>
                          <td colSpan="6" className="text-center p-8 text-slate-400">
                            Nenhum dado para exibir neste mês.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      );
    };

    export default FluxoCaixaDetalhado;