import React from 'react';
    import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
    import { Helmet } from 'react-helmet';
    import { Toaster } from '@/components/ui/toaster';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import Dashboard from '@/pages/Dashboard';
    import ContasReceber from '@/pages/ContasReceber';
    import ContasPagar from '@/pages/ContasPagar';
    import FluxoCaixa from '@/pages/FluxoCaixa';
    import Lancamentos from '@/pages/Lancamentos';
    import Relatorios from '@/pages/Relatorios';
    import Cadastros from '@/pages/Cadastros';
    import Login from '@/pages/Login';
    import SignUp from '@/pages/SignUp';
    import FluxoCaixaDetalhado from '@/pages/FluxoCaixaDetalhado';
    import DreGerencial from '@/pages/DreGerencial';
    import RelatorioContas from '@/pages/RelatorioContas';
    
    const PrivateRoute = ({ children }) => {
      const { user, loading } = useAuth();
    
      if (loading) {
        return (
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        );
      }
    
      return user ? children : <Navigate to="/login" />;
    };
    
    function App() {
      return (
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
            <Helmet>
              <title>SysFina v1.0.0 - Dashboard Financeiro</title>
              <meta name="description" content="Dashboard moderno para controle de contas a pagar e receber com integração ao Google Sheets" />
            </Helmet>
            
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/contas-receber" element={<PrivateRoute><ContasReceber /></PrivateRoute>} />
                <Route path="/contas-pagar" element={<PrivateRoute><ContasPagar /></PrivateRoute>} />
                <Route path="/fluxo-caixa" element={<PrivateRoute><FluxoCaixa /></PrivateRoute>} />
                <Route path="/lancamentos" element={<PrivateRoute><Lancamentos /></PrivateRoute>} />
                <Route path="/relatorios" element={<PrivateRoute><Relatorios /></PrivateRoute>} />
                <Route path="/cadastros" element={<PrivateRoute><Cadastros /></PrivateRoute>} />
                <Route path="/relatorios/fluxo-caixa-detalhado" element={<PrivateRoute><FluxoCaixaDetalhado /></PrivateRoute>} />
                <Route path="/relatorios/dre-gerencial" element={<PrivateRoute><DreGerencial /></PrivateRoute>} />
                <Route path="/relatorios/contas" element={<PrivateRoute><RelatorioContas /></PrivateRoute>} />
              </Routes>
            </main>
            
            <Toaster />
          </div>
        </Router>
      );
    }
    
    export default App;