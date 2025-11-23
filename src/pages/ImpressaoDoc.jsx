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
import 'jspdf-autotable';
import { format } from 'date-fns';

const columns = [
  'Data',
  'Tipo',
  'Unidade',
  'Cliente/Fornecedor',
  'Descrição',
  'Valor',
  'Status',
  'Aluno',
  'Parcela',
  'Desc. Pontual',
  'Observações',
  'Data Pag.'
];

const ImpressaoDoc = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({
    tipo: 'todos',
    status: 'todos',
    unidade: 'todas',
    dataInicio: '',
    dataFim: ''
  });
  const [reportGenerated, setReportGenerated] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportGenerated(false);
    const { data, error } = await supabase
      .from('lancamentos')
      .select('*')
      .order('data', { ascending: true });
    setLoading(false);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível carregar os lançamentos.', variant: 'destructive' });
    } else {
      setLancamentos(data || []);
      setReportGenerated(true);
      setGeneratedAt(new Date());
    }
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
    if (filters.tipo !== 'todos') {
      filtered = filtered.filter((item) => item.tipo === filters.tipo);
    }
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

  const handleGeneratePDF = () => {
    if (!reportGenerated) {
      toast({ title: 'Gere o relatório primeiro', description: 'Clique em "Gerar Relatório" para carregar os lançamentos.', variant: 'destructive' });
      return;
    }
    if (!selectedId) {
      toast({ title: 'Selecione um lançamento', description: 'Escolha um registro para gerar o PDF.', variant: 'destructive' });
      return;
    }

    const item = filteredLancamentos.find((lanc) => lanc.id === selectedId);
    if (!item) {
      toast({ title: 'Lançamento inválido', description: 'O lançamento selecionado não está disponível.' });
      return;
    }

    // Configuração: página inteira A4
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 18;
    const marginY = 60;
    const contentWidth = pageWidth - marginX * 2;
    const accent = { r: 18, g: 64, b: 114 };

    const now = new Date();
    const docNumber = item.documento || item.id || '-';
    const valorFormatado = formatCurrency(item.valor);
    const dataEmissao = formatDate(item.data);
    const dataEntrada = formatDate(item.data);
    const vencOrig = formatDate(item.data);
    const vencAtual = item.datapag ? formatDate(item.datapag) : '-';
    const fornecedor = item.cliente_fornecedor || '-';
    const empresa = item.unidade || '-';
    const contaCred = item.categoria || 'Conta não informada';
    const contaDeb = item.forma_pagamento || 'Conta não informada';
    const numeroDocumento = item.documento || '-';
    const formaPagamento = item.forma_pagamento || '-';
    const notaFiscal = item.nota_fiscal || '-';
    const descricao = item.descricao || '-';
    const grupo = item.categoria || '-';
    const conta = item.obs || '-';
    const horaAgora = format(now, 'HH:mm');

    const drawRow = (y, fields) => {
      let x = marginX;
      doc.setFont('courier', 'normal');
      doc.setFontSize(8.8);
      fields.forEach(({ label, value, width }) => {
        const cellWidth = width || 110;
        doc.text(`${label} ${value || '-'}`, x, y);
        x += cellWidth;
      });
      doc.setDrawColor(170);
      doc.line(marginX, y + 6, marginX + contentWidth, y + 6);
      return y + 18;
    };

    // Badge no canto superior direito com destaque e unidade
    const badgeWidth = 170;
    const badgeHeight = 70;
    doc.setDrawColor(accent.r, accent.g, accent.b);
    doc.setLineWidth(1.2);
    doc.roundedRect(pageWidth - marginX - badgeWidth, marginY - 18, badgeWidth, badgeHeight, 6, 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(accent.r, accent.g, accent.b);
    doc.text('Impressão de DOC', pageWidth - marginX - 12, marginY + 6, { align: 'right' });
    doc.setFont('helvetica', 'medium');
    doc.setFontSize(11);
    doc.text(empresa || 'Unidade não informada', pageWidth - marginX - 12, marginY + 26, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    doc.setLineWidth(0.5);

    // Empurrar todo o conteúdo para baixo, garantindo que nada sobreponha o badge
    let currentY = marginY + badgeHeight + 24;

    currentY = drawRow(currentY, [
      { label: 'Nº DOC......:', value: docNumber, width: contentWidth * 0.20 },
      { label: 'Vlr.:', value: valorFormatado, width: contentWidth * 0.16 },
      { label: 'Tipo:', value: item.tipo || '-', width: contentWidth * 0.15 },
      { label: 'Usuário:', value: `${item.status || 'Usuário'} - ${horaAgora}`, width: contentWidth * 0.26 },
      { label: 'Ref.:', value: empresa || '-', width: contentWidth * 0.23 }
    ]);

    currentY = drawRow(currentY, [
      { label: 'Emissão.....:', value: dataEmissao, width: contentWidth * 0.24 },
      { label: 'Entrada:', value: dataEntrada, width: contentWidth * 0.24 },
      { label: 'Venc. Orig.:', value: vencOrig, width: contentWidth * 0.26 },
      { label: 'Venc. Atual:', value: vencAtual, width: contentWidth * 0.26 }
    ]);

    currentY = drawRow(currentY, [
      { label: 'Fornecedor..:', value: fornecedor, width: contentWidth * 0.64 },
      { label: 'Depto....:', value: empresa || '-', width: contentWidth * 0.36 }
    ]);

    currentY = drawRow(currentY, [
      { label: 'Valor.......:', value: valorFormatado, width: contentWidth * 0.32 },
      { label: 'Empresa:', value: empresa || '-', width: contentWidth * 0.32 },
      { label: 'Unidade..:', value: empresa || '-', width: contentWidth * 0.36 }
    ]);

    currentY = drawRow(currentY, [
      { label: 'Conta Créd..:', value: contaCred, width: contentWidth * 0.64 },
      { label: 'Protocolo:', value: '-', width: contentWidth * 0.36 }
    ]);

    currentY = drawRow(currentY, [
      { label: 'Conta Déb...:', value: contaDeb, width: contentWidth * 0.64 },
      { label: 'Depto....:', value: empresa || '-', width: contentWidth * 0.36 }
    ]);

    currentY = drawRow(currentY, [
      { label: 'Nº Documento:', value: numeroDocumento, width: contentWidth * 0.64 },
      { label: 'Forma Pag:', value: formaPagamento, width: contentWidth * 0.36 }
    ]);

    currentY = drawRow(currentY, [{ label: 'N. Fiscal...:', value: notaFiscal, width: contentWidth * 0.64 }]);

    doc.setFont('courier', 'italic');
    doc.setFontSize(8.8);
    doc.text(`Descrição...: ${descricao}`, marginX, currentY + 12);
    doc.text(`Grupo.......: ${grupo}`, marginX, currentY + 26);
    doc.text(`Conta.......: ${conta}`, marginX, currentY + 40);
    currentY += 52;

    // Seção de aprovação com caixas de assinatura
    doc.setFont('helvetica', 'bold');
    doc.text('V I S T O S   D E   A P R O V A Ç Ã O', marginX + contentWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    const approvalsTop = currentY + 6;
    const approvalsHeight = 126;
    const approvalColWidth = contentWidth / 4;
    doc.setDrawColor(130);
    doc.rect(marginX, approvalsTop, contentWidth, approvalsHeight);
    for (let i = 1; i < 4; i += 1) {
      doc.line(marginX + approvalColWidth * i, approvalsTop, marginX + approvalColWidth * i, approvalsTop + approvalsHeight);
    }

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.6);
    doc.text('Emitente', marginX + 6, approvalsTop + 12);
    doc.text('Supervisão', marginX + approvalColWidth + 6, approvalsTop + 12);
    doc.text('Gerência', marginX + approvalColWidth * 2 + 6, approvalsTop + 12);
    doc.text('Recebido', marginX + approvalColWidth * 3 + 6, approvalsTop + 12);

    // Linha separando cabeçalho das linhas de assinatura
    doc.setDrawColor(170);
    doc.line(marginX, approvalsTop + 18, marginX + contentWidth, approvalsTop + 18);

    const approvalDataY = approvalsTop + 38;
    const approvalAssY = approvalsTop + 56;
    const approvalFooterY = approvalsTop + approvalsHeight - 18;

    const dataLabels = ['Data:____/____/____', 'Nome:__________________'];
    dataLabels.forEach((textLine, idx) => {
      const baseY = idx === 0 ? approvalDataY : approvalAssY;
      doc.text(textLine, marginX + 6, baseY);
      doc.text(textLine, marginX + approvalColWidth + 6, baseY);
      doc.text(textLine, marginX + approvalColWidth * 2 + 6, baseY);
      doc.text(textLine, marginX + approvalColWidth * 3 + 6, baseY);
    });

    doc.text('Ass.: __________________', marginX + 6, approvalFooterY);
    doc.text('Ass.: __________________', marginX + approvalColWidth + 6, approvalFooterY);
    doc.text('Ass.: __________________', marginX + approvalColWidth * 2 + 6, approvalFooterY);
    doc.text('Ass: __________________', marginX + approvalColWidth * 3 + 6, approvalFooterY);

    currentY = approvalsTop + approvalsHeight + 20;

    // Linha de observação de autenticação
    doc.setDrawColor(accent.r, accent.g, accent.b);
    doc.setLineWidth(0.8);
    doc.line(marginX, currentY, marginX + contentWidth, currentY);
    doc.setFont('courier', 'normal');
    doc.text('Autenticação mecânica dispensa reconhecimento de firma', marginX + contentWidth / 2, currentY + 12, {
      align: 'center'
    });
    doc.setLineWidth(0.5);
    doc.setDrawColor(130);

    currentY += 32;

    // Centro de custo
    doc.setFont('helvetica', 'bold');
    doc.text('C E N T R O   D E   C U S T O', marginX + contentWidth / 2, currentY, { align: 'center' });
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);

    const centroTop = currentY + 12;
    const groupWidth = contentWidth * 0.45;
    const subGroupWidth = contentWidth * 0.35;
    const valueWidth = contentWidth - groupWidth - subGroupWidth;

    const headerHeight = 18;
    const bodyHeight = 26;
    const totalHeight = 22;
    const tableHeight = headerHeight + bodyHeight + totalHeight;

    doc.rect(marginX, centroTop, contentWidth, tableHeight);
    doc.line(marginX, centroTop + headerHeight, marginX + contentWidth, centroTop + headerHeight);
    doc.line(marginX + groupWidth, centroTop, marginX + groupWidth, centroTop + tableHeight);
    doc.line(marginX + groupWidth + subGroupWidth, centroTop, marginX + groupWidth + subGroupWidth, centroTop + tableHeight);

    doc.text('Grupo', marginX + 6, centroTop + 12);
    doc.text('Sub Grupo', marginX + groupWidth + 6, centroTop + 12);
    doc.text('Valor', marginX + groupWidth + subGroupWidth + 6, centroTop + 12);

    const bodyY = centroTop + headerHeight + 16;
    doc.text(grupo, marginX + 6, bodyY);
    doc.text(formaPagamento || '-', marginX + groupWidth + 6, bodyY);
    doc.text(valorFormatado, marginX + groupWidth + subGroupWidth + 6, bodyY);

    const totalY = centroTop + headerHeight + bodyHeight + 16;
    doc.line(marginX, centroTop + headerHeight + bodyHeight, marginX + contentWidth, centroTop + headerHeight + bodyHeight);
    doc.text('Total', marginX + groupWidth + subGroupWidth + 6, totalY);
    doc.text(valorFormatado, pageWidth - marginX - 70, totalY);

    doc.save(`impressao-doc-${item.id}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`);
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
        <title>Impressão de DOC - SysFina</title>
        <meta name="description" content="Relatório completo dos lançamentos para impressão em DOC." />
      </Helmet>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate('/relatorios')}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Impressão de DOC</h1>
            <p className="text-gray-400">Visualize e imprima todos os lançamentos</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleGenerateReport} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
          <Button onClick={handleGeneratePDF} disabled={!reportGenerated || loading} variant="outline" className="border-blue-500 text-blue-300 hover:bg-blue-500/10">
            <FileDown className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Tipo</label>
              <Select value={filters.tipo} onValueChange={(value) => handleFilterChange('tipo', value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Entrada">Entrada</SelectItem>
                  <SelectItem value="Saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            Utilize os filtros acima e clique em <span className="font-semibold text-white">"Gerar Relatório"</span> para listar os lançamentos disponíveis.
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
              <CardTitle className="text-white">Lançamentos registrados</CardTitle>
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
                          <td className="px-3 py-2">{item.tipo || '-'}</td>
                          <td className="px-3 py-2">{item.unidade || '-'}</td>
                          <td className="px-3 py-2">{item.cliente_fornecedor || '-'}</td>
                          <td className="px-3 py-2">{item.descricao || '-'}</td>
                          <td className="px-3 py-2 font-mono text-green-300">{formatCurrency(item.valor)}</td>
                          <td className="px-3 py-2">{item.status || '-'}</td>
                          <td className="px-3 py-2">{item.aluno || '-'}</td>
                          <td className="px-3 py-2">{item.parcela || '-'}</td>
                          <td className="px-3 py-2">{item.desc_pontual != null ? formatCurrency(item.desc_pontual) : '-'}</td>
                          <td className="px-3 py-2">{item.obs || '-'}</td>
                          <td className="px-3 py-2">{item.datapag ? formatDate(item.datapag) : '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length + 1} className="text-center py-10 text-gray-400">
                          Nenhum lançamento encontrado.
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

export default ImpressaoDoc;
