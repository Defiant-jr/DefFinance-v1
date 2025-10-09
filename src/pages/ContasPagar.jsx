import React, { useState, useEffect, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { useNavigate } from 'react-router-dom';
    import { Calendar, Filter, Building, DollarSign, AlertTriangle, ArrowLeft, CheckCircle } from 'lucide-react';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { format as formatDateFns } from 'date-fns';
    
    const ContasPagar = () => {
      const navigate = useNavigate();
      const { toast } = useToast();
      const [contas, setContas] = useState([]);
      const [loading, setLoading] = useState(false);
      const [filters, setFilters] = useState({
        fornecedor: '',
        status: 'todos',
        unidade: 'todas',
        dataInicio: '',
        dataFim: ''
      });
    
      useEffect(() => {
        loadData();
      }, []);
    
      const loadData = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('lancamentos').select('*').eq('tipo', 'Saida');
        if (error) {
          toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' });
        } else {
          setContas(data || []);
        }
        setLoading(false);
      };
    
      const getStatus = (conta) => {
        if (conta.status === 'Pago') return 'pago';
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const vencimento = new Date(conta.data + 'T00:00:00');
        return vencimento < hoje ? 'vencido' : 'aberto';
      };
    
      const filteredContas = useMemo(() => {
        let filtered = [...contas];
        if (filters.fornecedor) {
          filtered = filtered.filter(c => c.cliente_fornecedor?.toLowerCase().includes(filters.fornecedor.toLowerCase()));
        }
        if (filters.status !== 'todos') {
          filtered = filtered.filter(c => getStatus(c) === filters.status);
        }
        if (filters.unidade !== 'todas') {
          filtered = filtered.filter(c => c.unidade === filters.unidade);
        }
        if (filters.dataInicio) {
          const startDate = new Date(filters.dataInicio + 'T00:00:00');
          filtered = filtered.filter(c => new Date(c.data + 'T00:00:00') >= startDate);
        }
        if (filters.dataFim) {
          const endDate = new Date(filters.dataFim + 'T00:00:00');
          filtered = filtered.filter(c => new Date(c.data + 'T00:00:00') <= endDate);
        }
        return filtered.sort((a, b) => new Date(a.data) - new Date(b.data));
      }, [contas, filters]);
    
      const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const formatDate = (dateString) => new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    
      const getStatusColor = (status) => ({
        'vencido': 'bg-red-500/20 text-red-400 border-red-500/30',
        'aberto': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'pago': 'bg-green-500/20 text-green-400 border-green-500/30',
      }[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30');
    
      const getStatusLabel = (status) => ({
        'vencido': 'Vencido', 'aberto': 'Em Aberto', 'pago': 'Pago'
      }[status] || status);
    
      const groupedContas = useMemo(() => {
        return filteredContas.reduce((acc, conta) => {
          (acc[conta.data] = acc[conta.data] || []).push(conta);
          return acc;
        }, {});
      }, [filteredContas]);
    
      const calculateTotalsByUnit = (contas) => {
        return contas.reduce((acc, conta) => {
          const unit = conta.unidade || 'N/A';
          acc[unit] = (acc[unit] || 0) + conta.valor;
          return acc;
        }, {});
      };
    
      const totalGeral = filteredContas.reduce((sum, c) => sum + c.valor, 0);
      const totalAberto = filteredContas.filter(c => getStatus(c) === 'aberto');
      const totalVencido = filteredContas.filter(c => getStatus(c) === 'vencido');
    
      const totalAbertoPorUnidade = calculateTotalsByUnit(totalAberto);
      const totalVencidoPorUnidade = calculateTotalsByUnit(totalVencido);
    
      const handleMarkAsPaid = async (id) => {
        const today = formatDateFns(new Date(), 'yyyy-MM-dd');
        const { error } = await supabase.from('lancamentos').update({ status: 'Pago', datapag: today }).eq('id', id);
        if (error) {
          toast({ title: 'Erro', description: 'Não foi possível atualizar o status.', variant: 'destructive' });
        } else {
          toast({ title: 'Sucesso!', description: 'Lançamento marcado como pago.' });
          loadData();
        }
      };
    
      return (
        <div className="space-y-8">
          <Helmet>
            <title>Contas a Pagar - SysFina</title>
            <meta name="description" content="Gerencie suas contas a pagar com filtros e totalizadores" />
          </Helmet>
    
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-white hover:bg-white/10"><ArrowLeft className="w-6 h-6" /></Button>
              <div>
                <h1 className="text-3xl font-bold gradient-text">Contas a Pagar</h1>
                <p className="text-gray-400 mt-2">Controle seus pagamentos</p>
              </div>
            </div>
          </motion.div>
    
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-300">Total Filtrado</CardTitle><DollarSign className="w-4 h-4 text-blue-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-400">{formatCurrency(totalGeral)}</div></CardContent></Card>
            <Card className="glass-card"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-300">Em Aberto</CardTitle><Calendar className="w-4 h-4 text-yellow-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-400">{formatCurrency(totalAberto.reduce((s, c) => s + c.valor, 0))}</div><div className="mt-2 space-y-1 text-xs text-gray-400">{Object.entries(totalAbertoPorUnidade).map(([unit, val]) => <div key={unit} className="flex justify-between"><span>{unit}:</span><span className="font-semibold">{formatCurrency(val)}</span></div>)}</div></CardContent></Card>
            <Card className="glass-card"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-gray-300">Vencido</CardTitle><AlertTriangle className="w-4 h-4 text-red-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-400">{formatCurrency(totalVencido.reduce((s, c) => s + c.valor, 0))}</div><div className="mt-2 space-y-1 text-xs text-gray-400">{Object.entries(totalVencidoPorUnidade).map(([unit, val]) => <div key={unit} className="flex justify-between"><span>{unit}:</span><span className="font-semibold">{formatCurrency(val)}</span></div>)}</div></CardContent></Card>
          </div>
    
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Filter className="w-5 h-5" />Filtros</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div><label className="text-sm text-gray-300 mb-2 block">Fornecedor</label><Input placeholder="Buscar fornecedor..." value={filters.fornecedor} onChange={(e) => setFilters({ ...filters, fornecedor: e.target.value })} className="bg-white/10 border-white/20 text-white" /></div>
                  <div><label className="text-sm text-gray-300 mb-2 block">Status</label><Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}><SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="aberto">Em Aberto</SelectItem><SelectItem value="vencido">Vencido</SelectItem><SelectItem value="pago">Pago</SelectItem></SelectContent></Select></div>
                  <div><label className="text-sm text-gray-300 mb-2 block">Unidade</label><Select value={filters.unidade} onValueChange={(value) => setFilters({ ...filters, unidade: value })}><SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas</SelectItem><SelectItem value="CNA Angra dos Reis">CNA Angra dos Reis</SelectItem><SelectItem value="CNA Mangaratiba">CNA Mangaratiba</SelectItem><SelectItem value="Casa">Casa</SelectItem></SelectContent></Select></div>
                  <div><label className="text-sm text-gray-300 mb-2 block">Data Início</label><Input type="date" value={filters.dataInicio} onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })} className="bg-white/10 border-white/20 text-white" /></div>
                  <div><label className="text-sm text-gray-300 mb-2 block">Data Fim</label><Input type="date" value={filters.dataFim} onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })} className="bg-white/10 border-white/20 text-white" /></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
    
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-6">
            {loading ? <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>
              : Object.entries(groupedContas).map(([date, contasData], index) => (
                <Card key={date} className="glass-card">
                  <CardHeader><div className="flex justify-between items-center"><CardTitle className="text-white flex items-center gap-2"><Calendar className="w-5 h-5" />{formatDate(date)}</CardTitle><div className="text-lg font-bold text-red-400">{formatCurrency(contasData.reduce((s, c) => s + c.valor, 0))}</div></div></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {contasData.map((conta) => {
                        const status = getStatus(conta);
                        return (
                          <motion.div key={conta.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex items-center gap-3 mb-2 md:mb-0"><div className="p-2 rounded-lg bg-red-500/20"><Building className="w-4 h-4 text-red-400" /></div><div><h3 className="font-medium text-white">{conta.cliente_fornecedor}</h3><p className="text-sm text-gray-400">{conta.descricao}</p></div></div>
                            <div className="flex items-center gap-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>{getStatusLabel(status)}</span>
                              <div className="text-lg font-bold text-red-400">{formatCurrency(conta.valor)}</div>
                              {status !== 'pago' && <Button size="sm" variant="outline" className="text-green-400 border-green-400 hover:bg-green-400 hover:text-black" onClick={() => handleMarkAsPaid(conta.id)}><CheckCircle className="w-4 h-4 mr-2" />Pagar</Button>}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </motion.div>
    
          {!loading && filteredContas.length === 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12"><div className="text-gray-400 text-lg">Nenhuma conta encontrada</div><p className="text-gray-500 mt-2">Ajuste os filtros ou importe novos dados.</p></motion.div>}
        </div>
      );
    };
    
    export default ContasPagar;