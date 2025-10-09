import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import { useNavigate } from 'react-router-dom';
    import { Helmet } from 'react-helmet';
    import { TrendingUp, TrendingDown, DollarSign, Download, LayoutDashboard, PlusCircle, UserPlus, FileText, LogOut, ArrowRight, ArrowLeft, Wallet, CheckCircle } from 'lucide-react';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    
    const Dashboard = () => {
      const navigate = useNavigate();
      const { toast } = useToast();
      const { user, signOut } = useAuth();
      const [data, setData] = useState({ lancamentos: [] });
      const [loading, setLoading] = useState(false);
      const [importLoading, setImportLoading] = useState(false);
      const [chartData, setChartData] = useState([]);
    
      useEffect(() => {
        loadDataFromSupabase();
      }, []);
    
      const loadDataFromSupabase = async () => {
        setLoading(true);
        const { data: lancamentos, error } = await supabase.from('lancamentos').select('*');
        if (error) {
          toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
        } else {
          setData({ lancamentos: lancamentos || [] });
          generateChartData({ lancamentos: lancamentos || [] });
        }
        setLoading(false);
      };
    
      const generateChartData = (financialData) => {
        const months = [];
        const currentDate = new Date();
        
        for (let i = -1; i <= 4; i++) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
          const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
          
          const monthPagar = financialData.lancamentos
            .filter(conta => {
              if (conta.tipo !== 'Saida' || conta.status !== 'A Vencer') return false;
              const vencimento = new Date(conta.data + 'T00:00:00');
              return vencimento.getUTCMonth() === date.getMonth() && 
                     vencimento.getUTCFullYear() === date.getFullYear();
            })
            .reduce((sum, conta) => sum + conta.valor, 0);
          
          const monthReceber = financialData.lancamentos
            .filter(conta => {
              if (conta.tipo !== 'Entrada' || conta.status !== 'A Vencer') return false;
              const vencimento = new Date(conta.data + 'T00:00:00');
              return vencimento.getUTCMonth() === date.getMonth() && 
                     vencimento.getUTCFullYear() === date.getFullYear();
            })
            .reduce((sum, conta) => sum + conta.valor, 0);
          
          months.push({
            month: monthName,
            pagar: monthPagar,
            receber: monthReceber
          });
        }
        
        setChartData(months);
      };
    
      const handleImportData = async () => {
        setImportLoading(true);
        try {
          toast({ title: "Iniciando importação...", description: "Buscando dados das planilhas.", variant: "default" });
          
          const { data: functionData, error: functionError } = await supabase.functions.invoke('import-google-sheets', {
            body: {},
          });

          if (functionError) throw functionError;
    
          toast({
            title: "Sucesso!",
            description: functionData.message || "Dados importados e sincronizados!",
          });
    
          await loadDataFromSupabase();
    
        } catch (error) {
          console.error("Erro na importação: ", error);
          let description = "Ocorreu um erro durante a importação.";
          if (error.message.includes("non-2xx")) {
            description = "A função de importação falhou no servidor. Verifique os logs da função no Supabase.";
          } else if (error.message) {
            description = error.message;
          }
          
          toast({
            title: "Erro na importação",
            description: description,
            variant: "destructive",
          });
        } finally {
          setImportLoading(false);
        }
      };
    
      const formatCurrency = (value) => {
        return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      };
    
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeStr = hoje.toISOString().split('T')[0];
    
      const receberAberto = data.lancamentos.filter(c => c.tipo === 'Entrada' && c.status !== 'Pago' && c.data >= hojeStr).reduce((sum, c) => sum + c.valor, 0);
      const receberAtrasado = data.lancamentos.filter(c => c.tipo === 'Entrada' && c.status !== 'Pago' && c.data < hojeStr).reduce((sum, c) => sum + c.valor, 0);
      const recebido = data.lancamentos.filter(c => c.tipo === 'Entrada' && c.status === 'Pago').reduce((sum, c) => sum + c.valor, 0);
      const totalReceberPendente = receberAberto + receberAtrasado;
    
      const pagarAberto = data.lancamentos.filter(c => c.tipo === 'Saida' && c.status !== 'Pago' && c.data >= hojeStr).reduce((sum, c) => sum + c.valor, 0);
      const pagarAtrasado = data.lancamentos.filter(c => c.tipo === 'Saida' && c.status !== 'Pago' && c.data < hojeStr).reduce((sum, c) => sum + c.valor, 0);
      const pago = data.lancamentos.filter(c => c.tipo === 'Saida' && c.status === 'Pago').reduce((sum, c) => sum + c.valor, 0);
      const totalPagarPendente = pagarAberto + pagarAtrasado;
      
      const entradasAVencer = data.lancamentos.filter(c => c.tipo === 'Entrada' && c.status === 'A Vencer').reduce((sum, c) => sum + c.valor, 0);
      const saidasAVencer = data.lancamentos.filter(c => c.tipo === 'Saida' && c.status === 'A Vencer').reduce((sum, c) => sum + c.valor, 0);
      const resultadoOperacional = entradasAVencer - saidasAVencer;
    
      const summaryCards = [
        {
          title: 'Total a Receber',
          value: formatCurrency(totalReceberPendente),
          icon: TrendingUp,
          color: 'from-green-500 to-green-600',
          bgColor: 'bg-green-500/10',
          details: [
            { label: 'Em Aberto', value: formatCurrency(receberAberto) },
            { label: 'Em Atraso', value: formatCurrency(receberAtrasado), color: 'text-red-400' },
            { label: 'Recebido', value: formatCurrency(recebido), color: 'text-green-400' }
          ]
        },
        {
          title: 'Total a Pagar',
          value: formatCurrency(totalPagarPendente),
          icon: TrendingDown,
          color: 'from-red-500 to-red-600',
          bgColor: 'bg-red-500/10',
          details: [
            { label: 'Em Aberto', value: formatCurrency(pagarAberto) },
            { label: 'Vencido', value: formatCurrency(pagarAtrasado), color: 'text-red-400' },
            { label: 'Pago', value: formatCurrency(pago), color: 'text-green-400' }
          ]
        },
        {
          title: 'Resultado Operacional (Previsto)',
          value: formatCurrency(resultadoOperacional),
          icon: DollarSign,
          color: resultadoOperacional >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600',
          bgColor: resultadoOperacional >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10'
        }
      ];
      
      const navButtons = [
        { label: "Dashboard", path: "/", icon: LayoutDashboard },
        { label: "A Receber", path: "/contas-receber", icon: ArrowRight },
        { label: "A Pagar", path: "/contas-pagar", icon: ArrowLeft },
        { label: "Fluxo de Caixa", path: "/fluxo-caixa", icon: Wallet },
        { label: "Lançamentos", path: "/lancamentos", icon: PlusCircle },
        { label: "Cadastro", path: "/cadastros", icon: UserPlus },
        { label: "Relatórios", path: "/relatorios", icon: FileText },
        { label: "Importar", action: handleImportData, icon: Download, loadingLabel: "Importando..." },
      ];
    
      return (
        <div className="space-y-8">
          <Helmet>
            <title>Dashboard - SysFina</title>
            <meta name="description" content="Dashboard principal com visão geral das finanças" />
          </Helmet>
    
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center"
          >
            <div className="text-left">
                <h1 className="text-3xl font-bold gradient-text">Dashboard Financeiro</h1>
                <p className="text-gray-400 mt-1">Bem-vindo, {user?.email}!</p>
            </div>
            <Button onClick={signOut} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
            </Button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card p-2">
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {navButtons.map((item, index) => {
                        const Icon = item.icon;
                        const action = item.path ? () => navigate(item.path) : item.action;
                        const isDisabled = item.label === "Importar" && importLoading;
                        return (
                            <Button 
                                key={index} 
                                onClick={action}
                                variant="ghost"
                                className="flex-grow sm:flex-grow-0 text-gray-300 hover:bg-white/10 hover:text-white"
                                disabled={isDisabled}
                            >
                                <Icon className={`w-4 h-4 mr-2 ${isDisabled ? 'animate-spin' : ''}`} />
                                <span>{isDisabled ? item.loadingLabel : item.label}</span>
                            </Button>
                        );
                    })}
                </div>
            </Card>
          </motion.div>
    
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summaryCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="glass-card hover:scale-105 transition-transform duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">
                        {card.title}
                      </CardTitle>
                      <div className={`p-2 rounded-lg ${card.bgColor}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                        {card.value}
                      </div>
                      {card.details && (
                        <div className="mt-4 space-y-2">
                          {card.details.map((detail, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-400">{detail.label}:</span>
                              <span className={`font-semibold ${detail.color ? detail.color : 'text-white'}`}>{detail.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
    
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white">Fluxo Financeiro Mensal (Previsto)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => formatCurrency(value)}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="receber" fill="#10B981" name="A Receber" />
                      <Bar dataKey="pagar" fill="#EF4444" name="A Pagar" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    };
    
    export default Dashboard;