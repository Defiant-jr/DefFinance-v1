import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, Receipt } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const Financeiro = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const cards = [
    {
      title: 'Baixa',
      description: 'Registrar baixas financeiras rapidamente.',
      icon: Wallet,
      implemented: false,
    },
    {
      title: 'Bordero de Baixa',
      description: 'Organize e consolide baixas em borderos.',
      icon: Receipt,
      implemented: false,
    },
  ];

  const handleCardClick = (implemented) => {
    if (!implemented) {
      toast({
        title: 'Em breve!',
        description: 'Estamos trabalhando para liberar este recurso.',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <Helmet>
        <title>Financeiro - SysFina</title>
        <meta name="description" content="Central de ações financeiras." />
      </Helmet>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Button>
          <h1 className="text-3xl font-bold gradient-text">Financeiro</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={`glass-card cursor-pointer transition-colors ${card.implemented ? 'hover:border-blue-500' : 'hover:border-white/10'}`}
              onClick={() => handleCardClick(card.implemented)}
            >
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-white/10 text-gray-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{card.title}</h2>
                    <p className="text-sm text-gray-400">{card.description}</p>
                  </div>
                </div>
                {!card.implemented && (
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Em desenvolvimento
                  </span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Financeiro;
