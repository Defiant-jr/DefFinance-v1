import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Users, UserCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const Integracao = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [importLoading, setImportLoading] = useState(false);

  const handleImportData = async () => {
    setImportLoading(true);
    try {
      toast({
        title: 'Iniciando integração...',
        description: 'Buscando dados das planilhas.',
      });

      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'import-google-sheets',
        { body: {} },
      );

      if (functionError) throw functionError;

      toast({
        title: 'Sucesso!',
        description: functionData?.message || 'Dados importados e sincronizados!',
      });
    } catch (error) {
      let description = 'Ocorreu um erro durante a integração.';
      if (error?.message?.includes('non-2xx')) {
        description = 'A função de integração falhou no servidor. Verifique os logs da função no Supabase.';
      } else if (error?.message) {
        description = error.message;
      }

      toast({
        title: 'Erro na integração',
        description,
        variant: 'destructive',
      });
    } finally {
      setImportLoading(false);
    }
  };

  const integrationCards = [
    {
      title: 'A Receber',
      description: 'Sincroniza lançamentos a receber com as planilhas externas.',
      icon: Download,
      action: handleImportData,
      loading: importLoading,
      loadingLabel: 'Integrando...',
    },
    {
      title: 'Alunos',
      description: 'Integração futura para cadastro de alunos.',
      icon: Users,
      disabled: true,
    },
    {
      title: 'Responsáveis',
      description: 'Integração futura para cadastro de responsáveis.',
      icon: UserCheck,
      disabled: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <Helmet>
        <title>Integração - SysFina</title>
        <meta name="description" content="Central de integrações com serviços externos." />
      </Helmet>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Button>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold gradient-text">Integração</h1>
            <span className="text-sm text-gray-300">Escolha a integração que deseja executar.</span>
          </div>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-white">Opções de integração</CardTitle>
          <span className="text-xs text-gray-400">Inclui o fluxo de importação de A Receber.</span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {integrationCards.map((option) => {
              const Icon = option.icon;
              const isLoading = option.loading;
              return (
                <Card key={option.title} className="bg-white/5 border-white/10">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/10">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <CardTitle className="text-base text-white">{option.title}</CardTitle>
                    </div>
                    {option.disabled && (
                      <span className="text-xs text-gray-300 bg-white/10 px-2 py-1 rounded-full">Em breve</span>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-400">{option.description}</p>
                    <Button
                      onClick={option.action}
                      disabled={option.disabled || isLoading}
                      className="w-full"
                      variant="secondary"
                    >
                      {isLoading && <Download className="w-4 h-4 mr-2 animate-spin" />}
                      {isLoading ? option.loadingLabel : 'Executar'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Integracao;
