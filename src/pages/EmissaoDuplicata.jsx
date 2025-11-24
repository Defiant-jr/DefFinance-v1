import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, FileDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

const columns = ['Data', 'Unidade', 'Cliente/Fornecedor', 'Descrição', 'Valor', 'Status', 'Parcela', 'Observações', 'Data Pag.'];

const EmissaoDuplicata = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [filters, setFilters] = useState({
    status: 'todos',
    unidade: 'todas',
    dataInicio: '',
    dataFim: ''
  });

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportGenerated(false);
    const { data, error } = await supabase.from('lancamentos').select('*').eq('tipo', 'Entrada');
    setLoading(false);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível carregar as duplicatas.', variant: 'destructive' });
      return;
    }
    setLancamentos(data || []);
    setReportGenerated(true);
    setGeneratedAt(new Date());
  };

  const getStatus = (conta) => {
    if (conta.status === 'Pago') return 'pago';
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(conta.data + 'T00:00:00');
    return vencimento < hoje ? 'atrasado' : 'aberto';
  };

  const filteredLancamentos = useMemo(() => {
    let filtered = [...lancamentos];
    if (filters.status !== 'todos') {
      filtered = filtered.filter((item) => getStatus(item) === filters.status);
    }
    if (filters.unidade !== 'todas') {
      filtered = filtered.filter((item) => item.unidade === filters.unidade);
    }
    if (filters.dataInicio) {
      const start = new Date(filters.dataInicio + 'T00:00:00');
      filtered = filtered.filter((item) => new Date(item.data + 'T00:00:00') >= start);
    }
    if (filters.dataFim) {
      const end = new Date(filters.dataFim + 'T00:00:00');
      filtered = filtered.filter((item) => new Date(item.data + 'T00:00:00') <= end);
    }
    return filtered;
  }, [lancamentos, filters]);

  useEffect(() => {
    if (selectedId && !filteredLancamentos.some((item) => item.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredLancamentos, selectedId]);

  const formatCurrency = (value) =>
    (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (value) => (value ? format(new Date(value + 'T00:00:00'), 'dd/MM/yyyy') : '-');

  const drawDuplicata = (doc, item, startY, copyLabel) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 26;
    const width = pageWidth - marginX * 2;
    const accent = { r: 20, g: 92, b: 163 };

    const valor = formatCurrency(item.valor);
    const vencimento = formatDate(item.data);
    const emissao = formatDate(item.data);
    const numeroDuplicata = item.documento || item.id || '-';
    const numeroOrigem = item.parcela || item.id || '-';
    const cliente = item.cliente_fornecedor || 'Cliente não informado';
    const obs = item.obs || 'Observações não informadas';
    const descricao = item.descricao || '-';
    const unidade = item.unidade || 'Unidade não informada';

    doc.setLineWidth(0.8);
    doc.setDrawColor(accent.r, accent.g, accent.b);
    doc.roundedRect(marginX, startY, width, 32, 6, 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('DUPLICATA MERCANTIL', marginX + 12, startY + 20);
    doc.setFontSize(9);
    doc.setTextColor(accent.r, accent.g, accent.b);
    doc.text(copyLabel, marginX + width - 12, startY + 18, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    const infoTop = startY + 46;
    const leftWidth = width * 0.52;
    const rightWidth = width - leftWidth - 8;

    doc.setFont('helvetica', 'bold');
    doc.text(unidade, marginX + 8, infoTop);
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.text('Endereço: _______________________________', marginX + 8, infoTop + 14);
    doc.text('Município: ______________________________', marginX + 8, infoTop + 28);
    doc.text('Contato: ________________________________', marginX + 8, infoTop + 42);

    doc.setLineWidth(0.5);
    doc.setDrawColor(180);
    doc.rect(marginX, infoTop - 10, leftWidth, 64);
    doc.rect(marginX + leftWidth + 8, infoTop - 10, rightWidth, 64);

    doc.setFont('helvetica', 'bold');
    doc.text('Dados da Duplicata', marginX + leftWidth + 18, infoTop + 4);
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.text(`Nº: ${numeroDuplicata}`, marginX + leftWidth + 18, infoTop + 18);
    doc.text(`Valor: ${valor}`, marginX + leftWidth + 18, infoTop + 32);
    doc.text(`Vencimento: ${vencimento}`, marginX + leftWidth + 18, infoTop + 46);

    const tableTop = infoTop + 74;
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhes', marginX + 4, tableTop - 6);
    doc.setLineWidth(0.4);
    doc.setDrawColor(150);

    const rowHeight = 22;
    const tableWidth = width;
    const colWidths = [0.22, 0.18, 0.18, 0.22, 0.20];
    const headers = ['Fatura', 'Valor R$', 'Nº Origem', 'Vencimento', 'Principal'];
    const values = [numeroDuplicata, valor, numeroOrigem, vencimento, valor];

    let cursorX = marginX;
    headers.forEach((header, idx) => {
      const colWidth = tableWidth * colWidths[idx];
      doc.rect(cursorX, tableTop, colWidth, rowHeight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(header, cursorX + 6, tableTop + 10);
      doc.setFont('courier', 'normal');
      doc.text(String(values[idx] || '-'), cursorX + 6, tableTop + 18);
      cursorX += colWidth;
    });

    const extraTop = tableTop + rowHeight + 18;
    doc.setFont('helvetica', 'bold');
    doc.text('Sacado', marginX + 4, extraTop - 8);
    doc.setDrawColor(180);
    doc.rect(marginX, extraTop - 4, width, 80);
    doc.setFont('courier', 'normal');
    doc.text(`Nome: ${cliente}`, marginX + 8, extraTop + 12);
    doc.text('Endereço: ______________________________', marginX + 8, extraTop + 28);
    doc.text('Município: ____________ UF: __ CEP: ________', marginX + 8, extraTop + 44);
    doc.text('Documento: ______________________________', marginX + 8, extraTop + 60);

    const obsTop = extraTop + 88;
    doc.setFont('helvetica', 'bold');
    doc.text('Valor por extenso', marginX + 4, obsTop);
    doc.setFont('courier', 'normal');
    doc.text(`${valor} (${descricao})`, marginX + 8, obsTop + 14);

    const controlTop = obsTop + 32;
    doc.setFont('helvetica', 'bold');
    doc.text('Controle', marginX + 4, controlTop);
    doc.setFont('courier', 'normal');
    doc.text(`Observações: ${obs}`, marginX + 8, controlTop + 14);
    doc.text('Data de Aceite: ____/____/______', marginX + 8, controlTop + 32);
    doc.text('Assinatura: _____________________________', marginX + 8, controlTop + 48);
  };

  const handleGeneratePDF = () => {
    if (!reportGenerated) {
      toast({
        title: 'Gere o relatório primeiro',
        description: 'Clique em "Gerar Relatório" antes de gerar o PDF.',
        variant: 'destructive'
      });
      return;
    }
    if (!selectedId) {
      toast({
        title: 'Selecione uma duplicata',
        description: 'Escolha um registro para habilitar o PDF.',
        variant: 'destructive'
      });
      return;
    }

    const item = filteredLancamentos.find((lanc) => lanc.id === selectedId);
    if (!item) {
      toast({ title: 'Duplicata inválida', description: 'O registro selecionado não está disponível.' });
      return;
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginTop = 32;
    const copyHeight = 372;

    drawDuplicata(doc, item, marginTop, 'Via do Credor');
    doc.setDrawColor(180);
    doc.setLineDash([4, 4], 0);
    doc.line(26, marginTop + copyHeight + 8, doc.internal.pageSize.getWidth() - 26, marginTop + copyHeight + 8);
    doc.setLineDash([], 0);
    drawDuplicata(doc, item, marginTop + copyHeight + 24, 'Via do Sacado');

    doc.save(`duplicata-${item.id || 'registro'}.pdf`);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <Helmet>
        <title>Emissão de Duplicata - SysFina</title>
        <meta name="description" content="Emita duplicatas a partir das contas a receber." />
      </Helmet>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate('/relatorios')}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Emissão de Duplicata</h1>
            <p className="text-gray-400">Baseada nos lançamentos de Contas a Receber</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleGenerateReport} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
          <Button
            onClick={handleGeneratePDF}
            disabled={!reportGenerated || loading || !selectedId}
            variant="outline"
            className="border-blue-500 text-blue-300 hover:bg-blue-500/10 disabled:opacity-60"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white">Filtros (Contas a Receber)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aberto">Em Aberto</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Unidade</label>
              <Select value={filters.unidade} onValueChange={(value) => handleFilterChange('unidade', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="CNA Angra dos Reis">CNA Angra dos Reis</SelectItem>
                  <SelectItem value="CNA Mangaratiba">CNA Mangaratiba</SelectItem>
                  <SelectItem value="Casa">Casa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Data Início</label>
              <Input
                type="date"
                value={filters.dataInicio}
                onChange={(event) => handleFilterChange('dataInicio', event.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Data Fim</label>
              <Input
                type="date"
                value={filters.dataFim}
                onChange={(event) => handleFilterChange('dataFim', event.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!reportGenerated && !loading && (
        <Card className="glass-card border-dashed border-white/20">
          <CardContent className="text-center text-gray-300 py-12">
            Utilize os filtros acima e clique em <span className="font-semibold text-white">"Gerar Relatório"</span> para listar as duplicatas disponíveis.
          </CardContent>
        </Card>
      )}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
        </div>
      )}
      {reportGenerated && !loading && (
        <>
          {generatedAt && (
            <div className="text-sm text-gray-400 text-right">
              <span className="text-white font-medium">Gerado em:</span> {format(generatedAt, 'dd/MM/yyyy HH:mm')}
            </div>
          )}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Lançamentos (Contas a Receber)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-200">
                      <th className="px-3 py-2 border-b border-white/10">Selecionar</th>
                      {columns.map((column) => (
                        <th key={column} className="px-3 py-2 border-b border-white/10 whitespace-nowrap">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLancamentos.length ? (
                      filteredLancamentos.map((item) => (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedId === item.id}
                              onChange={() => setSelectedId((prev) => (prev === item.id ? null : item.id))}
                              className="h-4 w-4 accent-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">{formatDate(item.data)}</td>
                          <td className="px-3 py-2">{item.unidade || '-'}</td>
                          <td className="px-3 py-2">{item.cliente_fornecedor || '-'}</td>
                          <td className="px-3 py-2">{item.descricao || '-'}</td>
                          <td className="px-3 py-2 font-mono text-green-300">{formatCurrency(item.valor)}</td>
                          <td className="px-3 py-2">{item.status || '-'}</td>
                          <td className="px-3 py-2">{item.parcela || '-'}</td>
                          <td className="px-3 py-2">{item.obs || '-'}</td>
                          <td className="px-3 py-2">{item.datapag ? formatDate(item.datapag) : '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length + 1} className="text-center py-10 text-gray-400">
                          Nenhuma duplicata encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  );
};

export default EmissaoDuplicata;
