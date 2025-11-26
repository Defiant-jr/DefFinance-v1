import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Cadastros from '@/pages/Cadastros';
import ContasPagar from '@/pages/ContasPagar';
import ContasReceber from '@/pages/ContasReceber';
import Dashboard from '@/pages/Dashboard';
import DreGerencial from '@/pages/DreGerencial';
import Financeiro from '@/pages/Financeiro';
import FluxoCaixa from '@/pages/FluxoCaixa';
import FluxoCaixaDetalhado from '@/pages/FluxoCaixaDetalhado';
import ImpressaoDoc from '@/pages/ImpressaoDoc';
import Lancamentos from '@/pages/Lancamentos';
import Login from '@/pages/Login';
import MapaMensal from '@/pages/MapaMensal';
import EmissaoDuplicata from '@/pages/EmissaoDuplicata';
import Integracao from '@/pages/Integracao';
import RelatorioContas from '@/pages/RelatorioContas';
import RelatorioFechamento from '@/pages/RelatorioFechamento';
import Relatorios from '@/pages/Relatorios';
import SignUp from '@/pages/SignUp';
import { Helmet } from 'react-helmet';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500" />
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
					<meta
						name="description"
						content="Dashboard moderno para controle de contas a pagar e receber com integração ao Google Sheets"
					/>
				</Helmet>

				<main className="container mx-auto px-4 py-8">
					<Routes>
						<Route path="/login" element={<Login />} />
						<Route path="/signup" element={<SignUp />} />
						<Route
							path="/"
							element={
								<PrivateRoute>
									<Dashboard />
								</PrivateRoute>
							}
						/>
						<Route
							path="/contas-receber"
							element={
								<PrivateRoute>
									<ContasReceber />
								</PrivateRoute>
							}
						/>
						<Route
							path="/contas-pagar"
							element={
								<PrivateRoute>
									<ContasPagar />
								</PrivateRoute>
							}
						/>
						<Route
							path="/fluxo-caixa"
							element={
								<PrivateRoute>
									<FluxoCaixa />
								</PrivateRoute>
							}
						/>
						<Route
							path="/financeiro"
							element={
								<PrivateRoute>
									<Financeiro />
								</PrivateRoute>
							}
						/>
						<Route
							path="/lancamentos"
							element={
								<PrivateRoute>
									<Lancamentos />
								</PrivateRoute>
							}
						/>
						<Route
							path="/relatorios"
							element={
								<PrivateRoute>
									<Relatorios />
								</PrivateRoute>
							}
						/>
						<Route
							path="/cadastros"
							element={
								<PrivateRoute>
									<Cadastros />
								</PrivateRoute>
							}
						/>
						<Route
							path="/relatorios/fluxo-caixa-detalhado"
							element={
								<PrivateRoute>
									<FluxoCaixaDetalhado />
								</PrivateRoute>
							}
						/>
						<Route
							path="/relatorios/dre-gerencial"
							element={
								<PrivateRoute>
									<DreGerencial />
								</PrivateRoute>
							}
						/>
						<Route
							path="/relatorios/fechamento"
							element={
								<PrivateRoute>
									<RelatorioFechamento />
								</PrivateRoute>
							}
						/>
						<Route
							path="/relatorios/contas"
							element={
								<PrivateRoute>
									<RelatorioContas />
								</PrivateRoute>
							}
						/>
						<Route
							path="/relatorios/impressao-doc"
							element={
								<PrivateRoute>
									<ImpressaoDoc />
								</PrivateRoute>
							}
						/>
						<Route
							path="/relatorios/emissao-duplicata"
							element={
								<PrivateRoute>
									<EmissaoDuplicata />
								</PrivateRoute>
							}
						/>
						<Route
							path="/relatorios/mapa-mensal"
							element={
								<PrivateRoute>
									<MapaMensal />
								</PrivateRoute>
							}
						/>
						<Route
							path="/integracao"
							element={
								<PrivateRoute>
									<Integracao />
								</PrivateRoute>
							}
						/>
					</Routes>
				</main>

				<Toaster />
			</div>
		</Router>
	);
}

export default App;
