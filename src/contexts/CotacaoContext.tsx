import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export interface VooCotacao {
  id: string;
  cia: string;
  numero: string;
  partida: string;
  chegada: string;
  origem: string;
  destino: string;
  duracao: string;
  tarifa: string;
  hasBag: boolean;
  total: number;
  sentido: 'ida' | 'volta' | 'interno';
  conexoes?: any[];
  breakdown?: any;
  dados_voo?: any;
}

interface CotacaoContextType {
  voosSelecionados: VooCotacao[];
  adicionarVoo: (voo: VooCotacao) => void;
  removerVoo: (id: string) => void;
  atualizarVoo: (id: string, updates: Partial<VooCotacao>) => void;
  limparCotacao: () => void;
}

const CotacaoContext = createContext<CotacaoContextType | undefined>(undefined);

export const CotacaoProvider = ({ children }: { children: ReactNode }) => {
  const [voosSelecionados, setVoosSelecionados] = useState<VooCotacao[]>(() => {
    const saved = localStorage.getItem('cotacao_voos');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cotacao_voos', JSON.stringify(voosSelecionados));
  }, [voosSelecionados]);

  const adicionarVoo = (voo: VooCotacao) => {
    setVoosSelecionados(prev => [...prev, voo]);
  };

  const removerVoo = (id: string) => {
    setVoosSelecionados(prev => prev.filter(v => v.id !== id));
  };

  const atualizarVoo = (id: string, updates: Partial<VooCotacao>) => {
    setVoosSelecionados(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const limparCotacao = () => {
    setVoosSelecionados([]);
  };

  return (
    <CotacaoContext.Provider value={{ voosSelecionados, adicionarVoo, removerVoo, atualizarVoo, limparCotacao }}>
      {children}
    </CotacaoContext.Provider>
  );
};

export const useCotacao = () => {
  const context = useContext(CotacaoContext);
  if (!context) {
    throw new Error('useCotacao deve ser usado dentro de um CotacaoProvider');
  }
  return context;
};
