import React, { useState, useEffect, useRef } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { ArrowLeft, FileDown } from 'lucide-react';
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
        const [reportGenerated, setReportGenerated] = useState(false);
        const [generatedAt, setGeneratedAt] = useState(null);

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
            setReportGenerated(false);

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
            setReportGenerated(true);
            setGeneratedAt(new Date());
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
                    <CardHeader><CardTitle className="text-white">Configuração do Relatório</CardTitle></CardHeader>
                    <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="w-full md:w-1/2">
                            <Select onValueChange={setSelectedCompetencia} value={selectedCompetencia}>
                                <SelectTrigger><SelectValue placeholder="Selecione a competência" /></SelectTrigger>
                                <SelectContent>{competencias.map(comp => <SelectItem key={comp} value={comp}>{format(new Date(comp + '-02'), 'MMMM/yyyy', { locale: ptBR })}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 md:justify-end">
                            <Button onClick={handleGenerateReport} disabled={loading || !selectedCompetencia} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">{loading ? 'Gerando...' : 'Gerar Relatório'}</Button>
                            <Button variant="outline" onClick={handleDownloadPdf} disabled={!reportGenerated || loading} className="w-full sm:w-auto border-blue-600 text-blue-300 hover:bg-blue-500/10">
                                <FileDown className="mr-2 h-4 w-4" /> Gerar PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                {!reportGenerated && !loading && (
                    <Card className="glass-card border-dashed border-white/20">
                        <CardContent className="text-center text-gray-300 py-10">
                            Escolha a competência desejada e clique em <span className="text-white font-semibold">"Gerar Relatório"</span> para visualizar o DRE.
                        </CardContent>
                    </Card>
                )}
                {loading && (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                )}
                {reportGenerated && reportData && !loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="text-sm text-gray-400 text-right mb-2">
                            {generatedAt && (<span><span className="text-white font-medium">Gerado em:</span> {format(generatedAt, 'dd/MM/yyyy HH:mm')}</span>)}
                        </div>
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

