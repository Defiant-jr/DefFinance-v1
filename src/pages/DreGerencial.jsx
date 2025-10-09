import React, { useState, useEffect, useRef } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { ArrowLeft, FileDown, Printer } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
    import { ptBR } from 'date-fns/locale';
    import jsPDF from 'jspdf';
    import html2canvas from 'html2canvas';

    const DreGerencial = () => {
        const navigate = useNavigate();
        const { toast } = useToast();
        const [competencias, setCompetencias] = useState([]);
        const [selectedCompetencia, setSelectedCompetencia] = useState('');
        const [reportData, setReportData] = useState(null);
        const [loading, setLoading] = useState(false);
        const reportRef = useRef();

        useEffect(() => {
            const fetchCompetencias = async () => {
                const { data, error } = await supabase.from('lancamentos').select('data').order('data', { ascending: false });
                if (error || !data || data.length === 0) {
                    const now = new Date();
                    const currentCompetencia = format(now, 'yyyy-MM');
                    setCompetencias([currentCompetencia]);
                    setSelectedCompetencia(currentCompetencia);
                    return;
                }
                const firstDate = new Date(data[data.length - 1].data + 'T00:00:00');
                const lastDate = new Date(data[0].data + 'T00:00:00');
                const interval = eachMonthOfInterval({ start: firstDate, end: lastDate });
                const comps = interval.map(date => format(date, 'yyyy-MM')).reverse();
                setCompetencias(comps);
                if (comps.length > 0) setSelectedCompetencia(comps[0]);
            };
            fetchCompetencias();
        }, []);

        const formatCurrency = (value, isParenthesis = false) => {
            const formatted = (Math.abs(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return value < 0 && isParenthesis ? `(${formatted})` : formatted;
        };

        const handleGenerateReport = async () => {
            if (!selectedCompetencia) {
                toast({ title: "Selecione uma competência", variant: "destructive" });
                return;
            }
            setLoading(true);
            setReportData(null);

            const [year, month] = selectedCompetencia.split('-');
            const firstDay = startOfMonth(new Date(year, month - 1));
            const lastDay = endOfMonth(new Date(year, month - 1));

            const { data, error } = await supabase
                .from('lancamentos')
                .select('tipo, valor, obs')
                .eq('status', 'Pago')
                .gte('datapag', format(firstDay, 'yyyy-MM-dd'))
                .lte('datapag', format(lastDay, 'yyyy-MM-dd'));

            setLoading(false);
            if (error) {
                toast({ title: "Erro ao buscar dados", description: error.message, variant: "destructive" });
                return;
            }

            const receitaBruta = data.filter(d => d.tipo === 'Entrada').reduce((acc, item) => acc + item.valor, 0);
            const custos = data.filter(d => d.tipo === 'Saida' && d.obs?.toLowerCase().includes('custo')).reduce((acc, item) => acc + item.valor, 0);
            const despesas = data.filter(d => d.tipo === 'Saida' && !d.obs?.toLowerCase().includes('custo')).reduce((acc, item) => acc + item.valor, 0);
            
            const lucroBruto = receitaBruta - custos;
            const resultado = lucroBruto - despesas;

            setReportData({
                receitaBruta,
                custos,
                lucroBruto,
                despesas,
                resultado,
                competencia: format(new Date(year, month - 1), 'MMMM/yyyy', { locale: ptBR })
            });
        };

        const handleDownloadPdf = () => {
            const input = reportRef.current;
            if (!input) return;
            html2canvas(input, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = imgWidth / imgHeight;
                const pdfHeight = pdfWidth / ratio;
                pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 10);
                pdf.save(`dre_${selectedCompetencia}.pdf`);
            });
        };

        const handlePrint = () => {
            const printContent = reportRef.current.innerHTML;
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html><head><title>Imprimir DRE</title><style>
                body { background-color: #ffffff; color: #0f172a; font-family: sans-serif; margin: 20px; }
                .dre-table { width: 100%; max-width: 800px; margin: 0 auto; border-collapse: collapse; font-size: 14px; }
                .dre-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
                .dre-table .header-row td { font-weight: bold; border-bottom: 2px solid #94a3b8; }
                .dre-table .total-row td { font-weight: bold; border-top: 2px solid #94a3b8; border-bottom: none; }
                .text-right { text-align: right; } .font-mono { font-family: monospace; }
                .text-2xl { font-size: 1.5rem; } .font-bold { font-weight: bold; }
                .text-center { text-align: center; } .mb-6 { margin-bottom: 1.5rem; }
                .capitalize { text-transform: capitalize; }
                </style></head><body>${printContent}</body></html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
        };

        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <Helmet><title>DRE Gerencial - SysFina</title></Helmet>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate('/relatorios')}><ArrowLeft className="h-5 w-5" /><span className="sr-only">Voltar</span></Button>
                        <h1 className="text-3xl font-bold gradient-text">DRE Gerencial</h1>
                    </div>
                </div>
                <Card className="glass-card">
                    <CardHeader><CardTitle className="text-white">Gerar Relatório</CardTitle></CardHeader>
                    <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-full sm:w-auto sm:flex-grow">
                            <Select onValueChange={setSelectedCompetencia} value={selectedCompetencia}>
                                <SelectTrigger><SelectValue placeholder="Selecione a competência" /></SelectTrigger>
                                <SelectContent>{competencias.map(comp => <SelectItem key={comp} value={comp}>{format(new Date(comp + '-02'), 'MMMM/yyyy', { locale: ptBR })}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleGenerateReport} disabled={loading || !selectedCompetencia} className="w-full sm:w-auto">{loading ? 'Gerando...' : 'Gerar Relatório'}</Button>
                        {reportData && (<>
                            <Button variant="outline" onClick={handleDownloadPdf} className="w-full sm:w-auto"><FileDown className="mr-2 h-4 w-4" /> PDF</Button>
                            <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto"><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
                        </>)}
                    </CardContent>
                </Card>
                {reportData && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div ref={reportRef} className="bg-white text-slate-800 p-6 rounded-lg">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold">Demonstrativo de Resultado do Exercício</h2>
                                <p className="text-lg capitalize">{reportData.competencia}</p>
                            </div>
                            <table className="dre-table">
                                <tbody>
                                    <tr className="header-row"><td>Descrição</td><td className="text-right">Valor</td></tr>
                                    <tr><td>(+) Receita Operacional Bruta</td><td className="text-right font-mono">{formatCurrency(reportData.receitaBruta)}</td></tr>
                                    <tr className="total-row"><td>(=) Lucro Bruto</td><td className="text-right font-mono">{formatCurrency(reportData.lucroBruto)}</td></tr>
                                    <tr><td>(-) Custos</td><td className="text-right font-mono">{formatCurrency(reportData.custos, true)}</td></tr>
                                    <tr><td>(-) Despesas Operacionais</td><td className="text-right font-mono">{formatCurrency(reportData.despesas, true)}</td></tr>
                                    <tr className={`total-row ${reportData.resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        <td>(=) Resultado Líquido do Período</td>
                                        <td className="text-right font-mono">{formatCurrency(reportData.resultado, true)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        );
    };

    export default DreGerencial;