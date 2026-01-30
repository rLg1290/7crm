import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Printer } from 'lucide-react';
import logger from '../utils/logger'

const CotacaoHtml: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [cotacao, setCotacao] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [passageiros, setPassageiros] = useState<any[]>([]);
  const [voos, setVoos] = useState<any[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const buscarDadosCotacao = async () => {
    if (!id) return;
    
    try {
      logger.debug('🔍 Buscando dados da cotação', { id });
      
      // Buscar cotação
      const { data: cotacaoData, error: cotacaoError } = await supabase
        .from('cotacoes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (cotacaoError) {
        logger.error('Erro ao buscar cotação', cotacaoError);
        return;
      }
      
      setCotacao(cotacaoData);
      logger.debug('✅ Cotação carregada', { id: cotacaoData?.id });
      
      // Buscar cliente
      if (cotacaoData.cliente_id) {
        const { data: clienteData, error: clienteError } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', cotacaoData.cliente_id)
          .single();
        
        if (!clienteError && clienteData) {
          setCliente(clienteData);
          console.log('✅ Cliente carregado:', clienteData);
        }
      }
      
      // Buscar empresa do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('👤 Usuário autenticado:', user.id);
        console.log('📋 Metadados do usuário:', user.user_metadata);
        
        // Tentar buscar empresa através do empresa_id nos metadados
        const empresaId = user.user_metadata?.empresa_id;
        if (empresaId) {
          console.log('🏢 Buscando empresa por ID:', empresaId);
          const { data: empresaData, error: empresaError } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', empresaId)
            .single();
          
          if (!empresaError && empresaData) {
            setEmpresa(empresaData);
            console.log('✅ Dados da empresa carregados:', empresaData);
          }
        }
      }
      
      // Buscar passageiros
      const { data: passageirosData, error: passageirosError } = await supabase
        .from('cotacao_passageiros')
        .select('*')
        .eq('cotacao_id', id);
      
      if (!passageirosError && passageirosData) {
        setPassageiros(passageirosData);
        console.log('✅ Passageiros carregados:', passageirosData);
      }
      
      // Buscar voos
      const { data: voosData, error: voosError } = await supabase
        .from('voos')
        .select('*')
        .eq('cotacao_id', id)
        .order('data_partida', { ascending: true });
      
      if (!voosError && voosData) {
        setVoos(voosData);
        console.log('✅ Voos carregados:', voosData);
      }
      
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarDadosCotacao();
  }, [id]);

  // Função para imprimir usando window.print() nativo
  const imprimirPagina = () => {
    window.print();
  };

  // Função para formatar horários (HH:MM)
  const formatarHorario = (horario: string) => {
    if (!horario) return '00:00';
    // Se tem 8 caracteres (HH:MM:SS), remove os últimos 3
    if (horario.length === 8) {
      return horario.substring(0, 5);
    }
    return horario;
  };

  // Função para formatar CNPJ
  const formatarCNPJ = (cnpj: string) => {
    if (!cnpj) return 'Não informado';
    // Remove todos os caracteres não numéricos
    const numeros = cnpj.replace(/\D/g, '');
    
    // Se tem 14 dígitos, formata como CNPJ
    if (numeros.length === 14) {
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    // Se tem 11 dígitos, formata como CPF
    if (numeros.length === 11) {
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    // Retorna o CNPJ original se não conseguir formatar
    return cnpj;
  };

  // Função para formatar data
  const formatarData = (data: string) => {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!cotacao) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Cotação não encontrada</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        /* Forçar cores na impressão */
        body, .container, .main-card, .header, .voo-header, .voo-card, 
        .cabecalho-principal, .section-header, .section-icon, .status-box, 
        .bagagem-box, .info-card, .info-box, .passageiro-linha {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        html, body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          color: #333;
          background: white;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        
        .main-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .cabecalho-principal {
          background: ${empresa?.cor_personalizada || '#3b82f6'};
          padding: 20px;
          color: white;
          text-align: center;
        }
        
        .empresa-nome {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .empresa-info {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .conteudo-principal {
          padding: 20px;
        }
        
        .info-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .info-titulo {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .info-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .info-valor {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0 16px 0;
          padding: 12px 16px;
          background: #f3f4f6;
          border-radius: 6px;
          border-left: 4px solid ${empresa?.cor_personalizada || '#3b82f6'};
        }
        
        .section-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${empresa?.cor_personalizada || '#3b82f6'};
          color: white;
          font-size: 12px;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }
        
        .voo-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 16px;
          overflow: hidden;
        }
        
        .voo-header {
          padding: 12px 16px;
          color: white;
          font-weight: 600;
          font-size: 14px;
        }
        
        .voo-header.ida {
          background: ${empresa?.cor_personalizada || '#059669'};
        }
        
        .voo-header.volta {
          background: ${empresa?.cor_personalizada ? '#dc2626' : '#dc2626'};
        }
        
        .voo-header.interno {
          background: ${empresa?.cor_personalizada || '#7c3aed'};
        }
        
        .voo-content {
          padding: 16px;
        }
        
        .voo-route {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          position: relative;
        }
        
        .route-line {
          flex: 1;
          height: 2px;
          background: ${empresa?.cor_personalizada || '#d1d5db'};
          position: relative;
          margin: 0 16px;
        }
        
        .route-line.ida {
          background: ${empresa?.cor_personalizada || '#059669'};
        }
        
        .route-line.volta {
          background: ${empresa?.cor_personalizada ? '#dc2626' : '#dc2626'};
        }
        
        .route-line.interno {
          background: ${empresa?.cor_personalizada || '#7c3aed'};
        }
        
        .plane-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          border: 2px solid ${empresa?.cor_personalizada || '#059669'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          color: ${empresa?.cor_personalizada || '#059669'};
          font-size: 10px;
        }
        
        .plane-icon.volta {
          transform: translate(-50%, -50%) scaleX(-1);
          border-color: ${empresa?.cor_personalizada ? '#dc2626' : '#dc2626'};
          color: ${empresa?.cor_personalizada ? '#dc2626' : '#dc2626'};
        }
        
        .city-time {
          text-align: center;
          flex: 1;
        }
        
        .city-name {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }
        
        .time {
          font-size: 14px;
          font-weight: 500;
        }
        
        .time.departure {
          color: ${empresa?.cor_personalizada || '#2563eb'};
        }
        
        .time.arrival {
          color: ${empresa?.cor_personalizada || '#059669'};
        }
        
        .time.return {
          color: ${empresa?.cor_personalizada ? '#dc2626' : '#dc2626'};
        }
        
        .voo-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
        }
        
        .detail-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .detail-value {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
        }
        
        .status-box {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 12px;
          margin: 16px 0;
        }
        
        .status-title {
          font-size: 14px;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 8px;
        }
        
        .status-text {
          font-size: 14px;
          color: #92400e;
        }
        
        .bagagem-box {
          background: #ecfdf5;
          border: 1px solid #10b981;
          border-radius: 6px;
          padding: 12px;
          margin: 16px 0;
        }
        
        .bagagem-title {
          font-size: 14px;
          font-weight: 600;
          color: #065f46;
          margin-bottom: 8px;
        }
        
        .bagagem-text {
          font-size: 14px;
          color: #065f46;
        }
        
        .passageiro-linha {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .passageiro-linha:last-child {
          border-bottom: none;
        }
        
        .passageiro-tipo {
          background: ${empresa?.cor_personalizada || '#6b7280'};
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          min-width: 60px;
          text-align: center;
        }
        
        .passageiro-nome {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: #111827;
        }
        
        .passageiro-doc {
          font-size: 12px;
          color: #6b7280;
        }
        
        /* Botão de impressão */
        .print-btn {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 1000;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .print-btn:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        /* Ocultar botão na impressão */
        @media print {
          .print-btn {
            display: none !important;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          .container {
            max-width: none;
            margin: 0;
            padding: 0;
          }
          
          .main-card {
            box-shadow: none;
            border: none;
          }
        }
      `}</style>

      {/* Botão de Imprimir */}
      <button className="print-btn" onClick={imprimirPagina}>
        <Printer size={20} /> Imprimir
      </button>

      {/* Conteúdo da cotação */}
      <div ref={printRef} className="container">
        <div className="main-card">
          {/* Cabeçalho da empresa */}
          <div className="cabecalho-principal">
            <div className="empresa-nome">
              {empresa?.nome || 'Empresa'}
            </div>
            <div className="empresa-info">
              CNPJ: {formatarCNPJ(empresa?.cnpj || '')} | 
              Email: {empresa?.email || 'contato@empresa.com'} | 
              Tel: {empresa?.telefone || '(11) 99999-9999'}
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="conteudo-principal">
            {/* Informações da cotação */}
            <div className="info-card">
              <div className="info-titulo">
                📋 Informações da Cotação
              </div>
              <div className="info-box">
                <div className="info-item">
                  <div className="info-label">Código</div>
                  <div className="info-valor">{cotacao.codigo || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Cliente</div>
                  <div className="info-valor">
                    {cliente?.nome}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">Data de Criação</div>
                  <div className="info-valor">{formatarData(cotacao.created_at)}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Status</div>
                  <div className="info-valor">{cotacao.status || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Passageiros */}
            {passageiros.length > 0 && (
              <>
                <div className="section-header">
                  <div className="section-icon">👥</div>
                  <div className="section-title">Passageiros</div>
                </div>
                
                <div className="info-card">
                  {passageiros.map((passageiro, index) => (
                    <div key={index} className="passageiro-linha">
                      <div className="passageiro-tipo">
                        {passageiro.tipo === 'adulto' ? 'ADT' : 
                         passageiro.tipo === 'crianca' ? 'CHD' : 'INF'}
                      </div>
                      <div className="passageiro-nome">
                        {passageiro.nome || ''}
                      </div>
                      {passageiro.documento && (
                        <div className="passageiro-doc">
                          {passageiro.tipo_documento === 'passaporte' ? 'Passaporte' : 'CPF'}: {passageiro.documento}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Voos */}
            {voos.length > 0 && (
              <>
                <div className="section-header">
                  <div className="section-icon">✈️</div>
                  <div className="section-title">Voos</div>
                </div>
                
                {voos.map((voo, index) => (
                  <div key={index} className="voo-card">
                    <div className={`voo-header ${voo.direcao?.toLowerCase()}`}>
                      {voo.direcao === 'IDA' ? 'Voo de Ida' : 
                       voo.direcao === 'VOLTA' ? 'Voo de Volta' : 'Voo Interno'}
                    </div>
                    
                    <div className="voo-content">
                      <div className="voo-route">
                        <div className="city-time">
                          <div className="city-name">{voo.origem}</div>
                          <div className={`time ${voo.direcao === 'VOLTA' ? 'return' : 'departure'}`}>
                            {formatarHorario(voo.horario_partida)}
                          </div>
                        </div>
                        
                        <div className="route-line">
                          <div className={`plane-icon ${voo.direcao?.toLowerCase()}`}>✈</div>
                        </div>
                        
                        <div className="city-time">
                          <div className="city-name">{voo.destino}</div>
                          <div className="time arrival">
                            {formatarHorario(voo.horario_chegada)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="voo-details">
                        <div className="detail-item">
                          <div className="detail-label">Data</div>
                          <div className="detail-value">{formatarData(voo.data_partida)}</div>
                        </div>
                        <div className="detail-item">
                          <div className="detail-label">Companhia</div>
                          <div className="detail-value">{voo.companhia || 'N/A'}</div>
                        </div>
                        <div className="detail-item">
                          <div className="detail-label">Número do Voo</div>
                          <div className="detail-value">{voo.numero_voo || 'N/A'}</div>
                        </div>
                        <div className="detail-item">
                          <div className="detail-label">Classe</div>
                          <div className="detail-value">{voo.classe || 'N/A'}</div>
                        </div>
                      </div>
                      
                      {voo.observacoes && (
                        <div className="detail-item" style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                          <div className="detail-label">Observações</div>
                          <div className="detail-value">{voo.observacoes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Status e bagagem */}
            {cotacao.status && (
              <div className="status-box">
                <div className="status-title">Status da Cotação</div>
                <div className="status-text">{cotacao.status}</div>
              </div>
            )}
            
            {cotacao.bagagem_despachada || cotacao.bagagem_mao ? (
              <div className="bagagem-box">
                <div className="bagagem-title">Informações de Bagagem</div>
                <div className="bagagem-text">
                  {cotacao.bagagem_despachada && `Despachada: ${cotacao.bagagem_despachada}`}
                  {cotacao.bagagem_despachada && cotacao.bagagem_mao && ' | '}
                  {cotacao.bagagem_mao && `Mão: ${cotacao.bagagem_mao}`}
                </div>
              </div>
            ) : null}

            {/* Observações */}
            {cotacao.observacoes && (
              <div className="info-card">
                <div className="info-titulo">📝 Observações</div>
                <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                  {cotacao.observacoes}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CotacaoHtml;
