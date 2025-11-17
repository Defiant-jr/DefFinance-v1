import React, { useState, useMemo, useRef } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
import { ArrowLeft, FileDown, Filter, ArrowUp, ArrowDown, CheckCircle } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Input } from '@/components/ui/input';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useEmCashValue } from '@/hooks/useEmCashValue';

    const RelatorioContas = () => {
        const navigate = useNavigate();
        const { toast } = useToast();
        const [contas, setContas] = useState([]);
        const [loading, setLoading] = useState(false);
        const [filters, setFilters] = useState({
            tipo: 'todos',
            status: 'todos',
            unidade: 'todas',
            dataInicio: '',
            dataFim: ''
        });
        const [sortConfig, setSortConfig] = useState({ key: 'data', direction: 'ascending' });
        const reportRef = useRef();
        const [emCashValue] = useEmCashValue();
        const [reportGenerated, setReportGenerated] = useState(false);
        const [generatedAt, setGeneratedAt] = useState(null);

        const handleGenerateReport = async () => {
            setLoading(true);
            setReportGenerated(false);
            const { data, error } = await supabase.from('lancamentos').select('*');
            setLoading(false);
            if (error) {
                toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
            } else {
                setContas(data || []);
                setReportGenerated(true);
                setGeneratedAt(new Date());
            }
        };

        const getStatus = (conta) => {
            if (conta?.__isCash) return 'Saldo em Cash';
            if (conta.status === 'Pago') return 'pago';
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const vencimento = new Date(conta.data + 'T00:00:00');
            return vencimento < hoje ? 'atrasado' : 'aberto';
        };

        const emCashApplies = useMemo(() => {
            if (emCashValue <= 0) return false;
            const tipoOk = filters.tipo === 'todos' || filters.tipo === 'Entrada';
            const statusOk = filters.status === 'todos' || filters.status === 'atrasado';
            return tipoOk && statusOk;
        }, [emCashValue, filters.tipo, filters.status]);

        const filteredAndSortedContas = useMemo(() => {
            let filtered = [...contas];
            if (filters.tipo !== 'todos') filtered = filtered.filter(c => c.tipo === filters.tipo);
            if (filters.status !== 'todos') filtered = filtered.filter(c => getStatus(c) === filters.status);
            if (filters.unidade !== 'todas') filtered = filtered.filter(c => c.unidade === filters.unidade);
            if (filters.dataInicio) filtered = filtered.filter(c => new Date(c.data + 'T00:00:00') >= new Date(filters.dataInicio + 'T00:00:00'));
            if (filters.dataFim) filtered = filtered.filter(c => new Date(c.data + 'T00:00:00') <= new Date(filters.dataFim + 'T00:00:00'));

            if (emCashApplies) {
                filtered.push({
                    id: 'em-cash',
                    data: '',
                    tipo: 'Entrada',
                    cliente_fornecedor: 'Saldo em Cash',
                    descricao: 'Ajuste manual confirmado no Dashboard',
                    unidade: 'Todas',
                    status: 'cash',
                    valor: emCashValue,
                    __isCash: true
                });
            }

            filtered.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                if (sortConfig.key === 'valor') {
                    aValue = parseFloat(aValue);
                    bValue = parseFloat(bValue);
                }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
            return filtered;
        }, [contas, filters, sortConfig, emCashApplies, emCashValue]);

        const requestSort = (key) => {
            let direction = 'ascending';
            if (sortConfig.key === key && sortConfig.direction === 'ascending') {
                direction = 'descending';
            }
            setSortConfig({ key, direction });
        };

        const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const formatDate = (dateString) => dateString ? format(new Date(dateString + 'T00:00:00'), 'dd/MM/yyyy') : '-';

        const handleDownloadPdf = () => {
            if (!reportGenerated) {
                toast({ title: "Gere o relatório primeiro", description: "Clique em \"Gerar Relatório\" para carregar os dados.", variant: "destructive" });
                return;
            }
            const doc = new jsPDF();
            doc.text("Relatório de Contas", 14, 16);
            doc.autoTable({
                head: [['Data', 'Tipo', 'Cliente/Fornecedor', 'Descrição', 'Unidade', 'Status', 'Valor']],
                body: filteredAndSortedContas.map(c => [
                    formatDate(c.data), c.tipo, c.cliente_fornecedor, c.descricao, c.unidade, getStatus(c), formatCurrency(c.valor)
                ]),
                startY: 20,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [22, 163, 74] },
            });
            doc.save('relatorio_contas.pdf');
        };


        const SortIcon = ({ columnKey }) => {
            if (sortConfig.key !== columnKey) return null;
            return sortConfig.direction === 'ascending' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />;
        };

        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <Helmet><title>Relatório de Contas - SysFina</title></Helmet>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate('/relatorios')}><ArrowLeft className="h-5 w-5" /><span className="sr-only">Voltar</span></Button>
                        <h1 className="text-3xl font-bold gradient-text">Relatório de Contas</h1>
                    </div>
                </div>
                <Card className="glass-card">
                    <CardHeader><CardTitle className="text-white flex items-center gap-2"><Filter className="w-5 h-5" />Configuração do Relatório</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <Select value={filters.tipo} onValueChange={(v) => setFilters(f => ({ ...f, tipo: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os Tipos</SelectItem><SelectItem value="Entrada">Entrada</SelectItem><SelectItem value="Saida">Saída</SelectItem></SelectContent></Select>
                            <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos Status</SelectItem><SelectItem value="aberto">Em Aberto</SelectItem><SelectItem value="atrasado">Atrasado</SelectItem><SelectItem value="pago">Pago</SelectItem></SelectContent></Select>
                            <Select value={filters.unidade} onValueChange={(v) => setFilters(f => ({ ...f, unidade: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas Unidades</SelectItem><SelectItem value="CNA Angra dos Reis">CNA Angra dos Reis</SelectItem><SelectItem value="CNA Mangaratiba">CNA Mangaratiba</SelectItem><SelectItem value="Casa">Casa</SelectItem></SelectContent></Select>
                            <Input type="date" value={filters.dataInicio} onChange={(e) => setFilters(f => ({ ...f, dataInicio: e.target.value }))} />
                            <Input type="date" value={filters.dataFim} onChange={(e) => setFilters(f => ({ ...f, dataFim: e.target.value }))} />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                            <Button onClick={handleGenerateReport} disabled={loading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">{loading ? 'Gerando...' : 'Gerar Relatório'}</Button>
                            <Button onClick={handleDownloadPdf} disabled={!reportGenerated || loading} variant="outline" className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50">
                                <FileDown className="mr-2 h-4 w-4" /> Gerar PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                {!reportGenerated && !loading && (
                    <Card className="glass-card border-dashed border-white/20">
                        <CardContent className="text-center text-gray-300 py-12">
                            Escolha os filtros desejados e clique em <span className="font-semibold text-white">"Gerar Relatório"</span> para visualizar os dados.
                        </CardContent>
                    </Card>
                )}
                {loading && (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                )}
                {reportGenerated && !loading && (
                    <div className="space-y-6">
                        {(generatedAt || emCashApplies) && (
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm text-gray-300 gap-2">
                                {generatedAt && (
                                    <div><span className="text-white font-medium">Gerado em:</span> {format(generatedAt, 'dd/MM/yyyy HH:mm')}</div>
                                )}
                                {emCashApplies && (
                                    <div className="text-green-300 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Saldo em cash considerado.</div>
                                )}
                            </div>
                        )}
                        {emCashApplies && (
                            <Card className="glass-card border-green-500/40 bg-green-500/5">
                                <CardHeader className="flex flex-row items-center gap-3">
                                    <div className="p-2 rounded-full bg-green-500/20 text-green-300">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-medium text-green-200">Saldo em Cash aplicado</CardTitle>
                                        <p className="text-lg font-semibold text-white">{formatCurrency(emCashValue)}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="text-sm text-gray-300">
                                    O valor confirmado no Dashboard está incluído nos totais e listagens de entradas atrasadas deste relatório.
                                </CardContent>
                            </Card>
                        )}
                        <Card className="glass-card">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table ref={reportRef} className="w-full text-sm text-left text-gray-300">
                                        <thead className="text-xs text-gray-400 uppercase bg-white/5">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('data')}><div className="flex items-center">Data <SortIcon columnKey="data" /></div></th>
                                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('tipo')}><div className="flex items-center">Tipo <SortIcon columnKey="tipo" /></div></th>
                                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('cliente_fornecedor')}><div className="flex items-center">Cliente/Fornecedor <SortIcon columnKey="cliente_fornecedor" /></div></th>
                                                <th scope="col" className="px-6 py-3">Descrição</th>
                                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('unidade')}><div className="flex items-center">Unidade <SortIcon columnKey="unidade" /></div></th>
                                                <th scope="col" className="px-6 py-3">Status</th>
                                                <th scope="col" className="px-6 py-3 text-right cursor-pointer" onClick={() => requestSort('valor')}><div className="flex items-center justify-end">Valor <SortIcon columnKey="valor" /></div></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAndSortedContas.map(conta => (
                                                <tr key={conta.id} className="border-b border-gray-700 hover:bg-white/10">
                                                    <td className="px-6 py-4">{formatDate(conta.data)}</td>
                                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${conta.tipo === 'Entrada' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{conta.tipo}</span></td>
                                                    <td className="px-6 py-4 font-medium text-white">{conta.cliente_fornecedor}</td>
                                                    <td className="px-6 py-4">{conta.descricao}</td>
                                                    <td className="px-6 py-4">{conta.unidade}</td>
                                                    <td className="px-6 py-4">{getStatus(conta)}</td>
                                                    <td className={`px-6 py-4 text-right font-mono ${conta.tipo === 'Entrada' ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(conta.valor)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="font-semibold text-white bg-white/5">
                                                <td colSpan="6" className="px-6 py-3 text-right">Total</td>
                                                <td className="px-6 py-3 text-right font-mono">{formatCurrency(filteredAndSortedContas.reduce((acc, c) => acc + (c.tipo === 'Entrada' ? c.valor : -c.valor), 0))}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </motion.div>
        );
    };

    export default RelatorioContas;

