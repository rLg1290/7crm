import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function formatarDataBR(dateString: string): string {
  if (!dateString) return '-';
  // Sempre pega só os 10 primeiros caracteres (YYYY-MM-DD)
  const onlyDate = dateString.slice(0, 10);
  const [ano, mes, dia] = onlyDate.split('-');
  if (ano && mes && dia) {
    return `${dia}/${mes}/${ano}`;
  }
  return dateString;
}

function formatarNomeCompleto(nome: string, sobrenome?: string): string {
  if (!sobrenome) return nome;
  const sobrenomes = sobrenome.trim().split(' ').filter(Boolean);
  if (sobrenomes.length > 0) {
    const ultimoSobrenome = sobrenomes[sobrenomes.length - 1];
    return `${nome} ${ultimoSobrenome}`;
  }
  return nome;
}

function formatarHorario(horario: string): string {
  if (!horario) return '-';
  if (horario.length === 8 && horario.includes(':')) {
    return horario.substring(0, 5);
  }
  return horario;
}

// Função utilitária para escurecer a cor
function escurecerCor(hex: string, fator = 0.8) {
  if (!hex) return '#000';
  hex = hex.replace('#', '');
  const r = Math.round(parseInt(hex.substring(0,2),16) * fator);
  const g = Math.round(parseInt(hex.substring(2,4),16) * fator);
  const b = Math.round(parseInt(hex.substring(4,6),16) * fator);
  return `rgb(${r},${g},${b})`;
}

// SVG de avião igual ao original (paper plane)
const AviaoPaperSVG = ({ color = '#2563eb', size = 20, flip = false, rotate = 0 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ transform: `scaleX(${flip ? -1 : 1}) rotate(${rotate}deg)` }}
  >
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" fill={color}/>
  </svg>
);

// Adicione o ícone de mala (SVG) no topo do arquivo
const IconBag = ({size = 16, color = '#2563eb'}) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="7" width="12" height="9" rx="2" fill={color}/>
    <rect x="7" y="4" width="6" height="3" rx="1.5" fill={color} fillOpacity="0.7"/>
  </svg>
);

const CotacaoView: React.FC = () => {
  const { codigo } = useParams();
  const [loading, setLoading] = useState(true);
  const [cotacao, setCotacao] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [voos, setVoos] = useState<any[]>([]);
  const [passageiros, setPassageiros] = useState<any[]>([]);
  const [ciasAereas, setCiasAereas] = useState<any[]>([]);
  const [formaPagamentoNome, setFormaPagamentoNome] = useState<string>('');

  useEffect(() => {
    const buscarDados = async () => {
      setLoading(true);
      // Buscar cotação
      const { data: cot } = await supabase.from('cotacoes').select('*').eq('codigo', codigo).single();
      setCotacao(cot);
      // Empresa
      if (cot?.empresa_id) {
        const { data: emp } = await supabase.from('empresas').select('*').eq('id', cot.empresa_id).single();
        setEmpresa(emp);
      }
      // Cliente
      if (cot?.cliente_id) {
        const { data: cli } = await supabase.from('clientes').select('*').eq('id', cot.cliente_id).single();
        setCliente(cli);
      }
      // Voos
      const { data: voosData } = await supabase.from('voos').select('*').eq('cotacao_id', cot?.id);
      setVoos(voosData || []);
      // Passageiros (cotacao_passageiros)
      const { data: passData } = await supabase.from('cotacao_passageiros').select('*').eq('cotacao_id', cot?.id);
      // Buscar clientes detalhados
      const clienteIds = (passData || []).map(p => p.cliente_id).filter(Boolean);
      let clientesDetalhados = [];
      if (clienteIds.length > 0) {
        const { data: clientesData } = await supabase
          .from('clientes')
          .select('*')
          .in('id', clienteIds);
        clientesDetalhados = clientesData || [];
      }
      // Unir dados
      const passageirosCompletos = (passData || []).map(p => {
        const cliente = clientesDetalhados.find(c => c.id === p.cliente_id);
        return {
          ...p,
          ...cliente // sobrescreve/une os dados do cliente
        };
      });
      setPassageiros(passageirosCompletos);
      // Companhias aéreas
      const { data: ciasData } = await supabase.from('CiasAereas').select('*');
      setCiasAereas(ciasData || []);
      // Forma de pagamento
      if (cot?.formapagid) {
        const { data: formaPagamento } = await supabase.from('formas_pagamento').select('nome').eq('id', cot.formapagid).single();
        setFormaPagamentoNome(formaPagamento?.nome || '-');
      }
      setLoading(false);
    };
    buscarDados();
  }, [codigo]);

  if (loading) {
    return <div style={{padding: 40, textAlign: 'center'}}>Carregando...</div>;
  }
  if (!cotacao) {
    return <div style={{padding: 40, textAlign: 'center'}}>Cotação não encontrada</div>;
  }

  // Cores
  const corEmpresa = empresa?.cor_personalizada || '#2563eb';
  const corEmpresaEscura = escurecerCor(corEmpresa, 0.8);
  const corEmpresaEscuraVolta = escurecerCor(corEmpresa, 0.6);

  // Função para buscar logo da companhia aérea
  function getLogoCompanhia(nomeCompanhia: string) {
    if (!nomeCompanhia) return null;
    const cia = ciasAereas.find(c =>
      c.nome?.toLowerCase() === nomeCompanhia?.toLowerCase() ||
      c.nome?.toLowerCase().includes(nomeCompanhia?.toLowerCase())
    );
    return cia?.logo_url || null;
  }

  return (
    <div className="container">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important; background: #f9fafb; color: #1f2937; line-height: 1.3; font-size: 11px; }
        .container { max-width: 1000px; margin: 0 auto; padding: 8px; background: white; }
        .header { background: linear-gradient(135deg, ${corEmpresa} 0%, ${corEmpresaEscura} 100%); color: white; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
        .header-content { display: flex; justify-content: space-between; align-items: center; }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .logo { width: 40px; height: 40px; background: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: ${corEmpresa}; font-size: 14px; }
        .header-info h1 { font-size: 16px; font-weight: bold !important; margin-bottom: 2px; color: #fff !important; font-family: 'Montserrat', Arial, sans-serif !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .header-info p { font-size: 11px; opacity: 0.9; color: #fff !important; font-family: 'Montserrat', Arial, sans-serif !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .contact-info { display: flex; flex-direction: column; gap: 4px; text-align: right; font-size: 11px; }
        .contact-item { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
        .bg-white { box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-radius: 14px; background: #fff; margin-bottom: 40px; }
        .px-6 { padding-left: 18px !important; padding-right: 18px !important; }
        .py-3 { padding-top: 10px !important; padding-bottom: 10px !important; }
        .p-6 { padding: 18px !important; }
        .mb-6 { margin-bottom: 20px !important; }
        .mb-4 { margin-bottom: 14px !important; }
        .gap-6 { gap: 8px !important; }
        .gap-4 { gap: 6px !important; }
        .text-xl { font-size: 17px !important; }
        .text-lg { font-size: 15px !important; }
        .text-2xl { font-size: 20px !important; }
        .text-sm { font-size: 12px !important; }
        .text-xs { font-size: 10px !important; }
        .cia-nome-print { color: #fff !important; }
        .info-bagagem-print { font-size: 11px !important; padding: 2px 10px !important; border-radius: 10px !important; }
        @media print { .btn-print { display: none !important; } }
        .btn-print { position: fixed; top: 24px; right: 32px; z-index: 9999; background: #2563eb; color: #fff; border: none; border-radius: 8px; padding: 10px 22px; font-size: 15px; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.08); cursor: pointer; transition: background 0.2s; }
        .btn-print:hover { background: #1d4ed8; }
      `}</style>
      <div className="header">
        <div className="header-content">
          <div className="header-left">
            {empresa?.logotipo ? (
              <img src={empresa.logotipo} alt="Logo" className="logo" />
            ) : (
              <div className="logo">LOGO</div>
            )}
            <div className="header-info">
              <h1>{empresa?.nome || 'Agência'}</h1>
              <p>Agência de Viagens</p>
              {empresa?.cnpj && empresa.cnpj !== '-' && <p>CNPJ: {empresa.cnpj}</p>}
            </div>
          </div>
          <div className="contact-info">
            {empresa?.telefone && <div className="contact-item"><span>{empresa.telefone}</span></div>}
            {empresa?.email && <div className="contact-item"><span>{empresa.email}</span></div>}
          </div>
        </div>
      </div>

      {/* Título do orçamento */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 28,
        marginTop: 8
      }}>
        <h2
          style={{
            background: `linear-gradient(90deg, ${corEmpresa} 0%, ${corEmpresaEscura} 100%)`,
            color: '#fff',
            padding: '12px 36px',
            borderRadius: 12,
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: 2,
            boxShadow: `0 4px 16px 0 ${corEmpresa}22`,
            fontFamily: 'Montserrat, Arial, sans-serif',
            textTransform: 'uppercase',
            border: 'none',
            outline: 'none',
            textShadow: `0 2px 8px ${corEmpresa}22`
          }}
        >
          ORÇAMENTO DE VIAGEM
        </h2>
      </div>

      {/* Cards de Voos - IGUAL IMPRESSÃO */}
      {voos.length > 0 && (
        <div style={{marginTop: 8, marginBottom: 8}}>
          {/* Voos de Ida */}
          {voos.filter(v => v.direcao === 'IDA').length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-4" style={{gap: 10}}>
                <div style={{background: corEmpresa}} className="p-2 rounded-lg">
                  <AviaoPaperSVG color="#fff" />
                </div>
                <h3 className="text-xl font-bold" style={{marginLeft: 4}}>
                  <span style={{color: corEmpresa}}>Voos de Ida</span>
                </h3>
              </div>
              {voos.filter(v => v.direcao === 'IDA').map((voo, i) => (
                <div key={`ida-${i}`} className="bg-white border border-gray-200 rounded-xl shadow-sm mb-4 overflow-hidden" style={{marginBottom: 8, paddingBottom: 8}}>
                  {/* Cabeçalho do Card */}
                  <div style={{background: `linear-gradient(to right, ${corEmpresa}, ${corEmpresaEscura})`, color: 'white'}} className="px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center" style={{gap: 18}}>
                        {getLogoCompanhia(voo.companhia) ? (
                          <img src={getLogoCompanhia(voo.companhia)} alt="Logo Companhia" style={{width: 32, height: 32, objectFit: 'contain', background: '#fff', borderRadius: 6}} />
                        ) : (
                          <div style={{width: 32, height: 32, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a3a3a3', fontWeight: 700, fontSize: 16}}>
                            LOGO
                          </div>
                        )}
                        <h4 className="font-bold text-lg cia-nome-print" style={{color: '#fff', marginRight: 0}}>{voo.companhia || 'Companhia Aérea'}</h4>
                      </div>
                    </div>
                  </div>
                  {/* Conteúdo Principal */}
                  <div className="p-6">
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 16}}>
                      {/* Seção de Rota e Informações */}
                      <div style={{flex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
                          <div style={{textAlign: 'center'}}>
                            <div className="text-2xl font-bold text-gray-900">{voo.origem}</div>
                            <div className="text-sm text-gray-500">Partida</div>
                            <div className="text-lg font-semibold" style={{color: corEmpresa}}>{formatarHorario(voo.horario_partida) || 'N/A'}</div>
                            <div className="text-xs text-gray-500" style={{marginTop: 2}}>
                              {formatarDataBR(voo.data_ida)}
                            </div>
                          </div>
                          <div style={{flex: 1, margin: '0 12px', position: 'relative'}}>
                            <div className="h-0.5 bg-gray-300 relative">
                              <div style={{background: corEmpresa}} className="absolute inset-0"></div>
                            </div>
                            <div className="text-center mt-2">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Voo {voo.numero_voo || 'N/A'}</span>
                            </div>
                          </div>
                          <div style={{textAlign: 'center'}}>
                            <div className="text-2xl font-bold text-gray-900">{voo.destino}</div>
                            <div className="text-sm text-gray-500">Chegada</div>
                            <div className="text-lg font-semibold" style={{color: corEmpresa}}>{formatarHorario(voo.horario_chegada) || 'N/A'}</div>
                            <div className="text-xs text-gray-500" style={{marginTop: 2}}>
                              {voo.data_volta ? formatarDataBR(voo.data_volta) : '-'}
                            </div>
                          </div>
                        </div>
                        <div style={{display: 'flex', gap: 8, marginTop: 8}}>
                          <div className="bg-gray-50 rounded-lg p-3" style={{flex: 1}}>
                            <div className="text-sm text-gray-500">Classe</div>
                            <div className="font-semibold text-gray-900">{voo.classe || 'Econômica'}</div>
                          </div>
                        </div>
                      </div>
                      {/* Seção de Status e Bagagem lateralizada */}
                      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8}}>
                        <div style={{ border: `1px solid ${corEmpresa}`, borderRadius: 8, padding: '12px', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4}}>
                            <div style={{ width: 8, height: 8, background: corEmpresa, borderRadius: '50%' }}></div>
                            <span style={{ color: corEmpresa, fontSize: 11, fontWeight: 600 }}>Status</span>
                          </div>
                          <div style={{ color: corEmpresa, fontSize: 12, fontWeight: 700 }}>Cotação</div>
                          <div style={{borderTop: '1px solid #e0e7ef', margin: '8px 0'}}></div>
                          <div style={{ color: corEmpresa, fontSize: 12, fontWeight: 700 }}>Bagagens</div>
                          <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 4, background: '#eaf1fb', borderRadius: 6, padding: '4px 10px'}}>
                              <IconBag color={corEmpresa} />
                              <span style={{ color: corEmpresa, fontSize: 11, fontWeight: 600 }}>Despachada:</span>
                              <span style={{ color: corEmpresa, fontSize: 11, fontWeight: 700 }}>{voo.bagagem_despachada || voo.bagagemDespachada || '-'}</span>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: 4, background: '#eaf1fb', borderRadius: 6, padding: '4px 10px'}}>
                              <IconBag color={corEmpresa} />
                              <span style={{ color: corEmpresa, fontSize: 11, fontWeight: 600 }}>Mão:</span>
                              <span style={{ color: corEmpresa, fontSize: 11, fontWeight: 700 }}>{voo.bagagem_mao || voo.bagagemMao || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Voos Internos */}
          {voos.filter(v => v.direcao === 'INTERNO').length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-4" style={{gap: 10}}>
                <div style={{background: corEmpresa}} className="p-2 rounded-lg">
                  <AviaoPaperSVG color="#fff" />
                </div>
                <h3 className="text-xl font-bold" style={{marginLeft: 4}}>
                  <span style={{color: corEmpresa}}>Voos Internos</span>
                </h3>
              </div>
              {voos.filter(v => v.direcao === 'INTERNO').map((voo, i) => (
                <div key={`interno-${i}`} className="bg-white border border-gray-200 rounded-xl shadow-sm mb-4 overflow-hidden" style={{marginBottom: 8, paddingBottom: 8}}>
                  {/* Cabeçalho do Card */}
                  <div style={{background: `linear-gradient(to right, ${corEmpresa}, ${corEmpresaEscura})`, color: 'white'}} className="px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center" style={{gap: 18}}>
                        {getLogoCompanhia(voo.companhia) ? (
                          <img src={getLogoCompanhia(voo.companhia)} alt="Logo Companhia" style={{width: 32, height: 32, objectFit: 'contain', background: '#fff', borderRadius: 6}} />
                        ) : (
                          <div style={{width: 32, height: 32, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a3a3a3', fontWeight: 700, fontSize: 16}}>
                            LOGO
                          </div>
                        )}
                        <h4 className="font-bold text-lg cia-nome-print" style={{color: '#fff', marginRight: 0}}>{voo.companhia || 'Companhia Aérea'}</h4>
                      </div>
                    </div>
                  </div>
                  {/* Conteúdo Principal */}
                  <div className="p-6">
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 16}}>
                      {/* Seção de Rota e Informações */}
                      <div style={{flex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
                          <div style={{textAlign: 'center'}}>
                            <div className="text-2xl font-bold text-gray-900">{voo.origem}</div>
                            <div className="text-sm text-gray-500">Partida</div>
                            <div className="text-lg font-semibold" style={{color: corEmpresa}}>{formatarHorario(voo.horario_partida) || 'N/A'}</div>
                            <div className="text-xs text-gray-500" style={{marginTop: 2}}>
                              {formatarDataBR(voo.data_ida)}
                            </div>
                          </div>
                          <div style={{flex: 1, margin: '0 12px', position: 'relative'}}>
                            <div className="h-0.5 bg-gray-300 relative">
                              <div style={{background: corEmpresa}} className="absolute inset-0"></div>
                            </div>
                            <div className="text-center mt-2">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Voo {voo.numero_voo || 'N/A'}</span>
                            </div>
                          </div>
                          <div style={{textAlign: 'center'}}>
                            <div className="text-2xl font-bold text-gray-900">{voo.destino}</div>
                            <div className="text-sm text-gray-500">Chegada</div>
                            <div className="text-lg font-semibold" style={{color: corEmpresa}}>{formatarHorario(voo.horario_chegada) || 'N/A'}</div>
                            <div className="text-xs text-gray-500" style={{marginTop: 2}}>
                              {voo.data_volta ? formatarDataBR(voo.data_volta) : '-'}
                            </div>
                          </div>
                        </div>
                        <div style={{display: 'flex', gap: 8, marginTop: 8}}>
                          <div className="bg-gray-50 rounded-lg p-3" style={{flex: 1}}>
                            <div className="text-sm text-gray-500">Classe</div>
                            <div className="font-semibold text-gray-900">{voo.classe || 'Econômica'}</div>
                          </div>
                        </div>
                      </div>
                      {/* Seção de Status e Bagagem lateralizada */}
                      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8}}>
                        <div style={{ border: `1px solid ${corEmpresa}`, borderRadius: 8, padding: '12px', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4}}>
                            <div style={{ width: 8, height: 8, background: corEmpresa, borderRadius: '50%' }}></div>
                            <span style={{ color: corEmpresa, fontSize: 11, fontWeight: 600 }}>Status</span>
                          </div>
                          <div style={{ color: corEmpresa, fontSize: 12, fontWeight: 700 }}>Cotação</div>
                          <div style={{borderTop: '1px solid #e0e7ef', margin: '8px 0'}}></div>
                          <div style={{ color: corEmpresa, fontSize: 12, fontWeight: 700 }}>Bagagens</div>
                          <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 4, background: '#eaf1fb', borderRadius: 6, padding: '4px 10px'}}>
                              <IconBag color={corEmpresa} />
                              <span style={{ color: corEmpresa, fontSize: 11, fontWeight: 600 }}>Despachada:</span>
                              <span style={{ color: corEmpresa, fontSize: 11, fontWeight: 700 }}>{voo.bagagem_despachada || voo.bagagemDespachada || '-'}</span>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: 4, background: '#eaf1fb', borderRadius: 6, padding: '4px 10px'}}>
                              <IconBag color={corEmpresa} />
                              <span style={{ color: corEmpresa, fontSize: 11, fontWeight: 600 }}>Mão:</span>
                              <span style={{ color: corEmpresa, fontSize: 11, fontWeight: 700 }}>{voo.bagagem_mao || voo.bagagemMao || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Voos de Volta */}
          {voos.filter(v => v.direcao === 'VOLTA').length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-4" style={{gap: 10}}>
                <div style={{background: corEmpresaEscuraVolta}} className="p-2 rounded-lg">
                  <AviaoPaperSVG color="#fff" flip={true} rotate={180} />
                </div>
                <h3 className="text-xl font-bold" style={{marginLeft: 4}}>
                  <span style={{color: corEmpresaEscuraVolta}}>Voos de Volta</span>
                </h3>
              </div>
              {voos.filter(v => v.direcao === 'VOLTA').map((voo, i) => (
                <div key={`volta-${i}`} className="bg-white border border-gray-200 rounded-xl shadow-sm mb-4 overflow-hidden" style={{marginBottom: 8, paddingBottom: 8}}>
                  {/* Cabeçalho do Card */}
                  <div style={{background: `linear-gradient(to right, ${corEmpresaEscura}, ${corEmpresaEscuraVolta})`, color: 'white'}} className="px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center" style={{gap: 18}}>
                        {getLogoCompanhia(voo.companhia) ? (
                          <img src={getLogoCompanhia(voo.companhia)} alt="Logo Companhia" style={{width: 32, height: 32, objectFit: 'contain', background: '#fff', borderRadius: 6}} />
                        ) : (
                          <div style={{width: 32, height: 32, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a3a3a3', fontWeight: 700, fontSize: 16}}>
                            LOGO
                          </div>
                        )}
                        <h4 className="font-bold text-lg cia-nome-print" style={{color: '#fff', marginRight: 0}}>{voo.companhia || 'Companhia Aérea'}</h4>
                      </div>
                    </div>
                  </div>
                  {/* Conteúdo Principal */}
                  <div className="p-6">
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 16}}>
                      {/* Seção de Rota e Informações */}
                      <div style={{flex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
                          <div style={{textAlign: 'center'}}>
                            <div className="text-2xl font-bold text-gray-900">{voo.origem}</div>
                            <div className="text-sm text-gray-500">Partida</div>
                            <div className="text-lg font-semibold" style={{color: corEmpresa}}>{formatarHorario(voo.horario_partida) || 'N/A'}</div>
                            <div className="text-xs text-gray-500" style={{marginTop: 2}}>
                              {formatarDataBR(voo.data_ida)}
                            </div>
                          </div>
                          <div style={{flex: 1, margin: '0 12px', position: 'relative'}}>
                            <div className="h-0.5 bg-gray-300 relative">
                              <div style={{background: corEmpresa}} className="absolute inset-0"></div>
                            </div>
                            <div className="text-center mt-2">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Voo {voo.numero_voo || 'N/A'}</span>
                            </div>
                          </div>
                          <div style={{textAlign: 'center'}}>
                            <div className="text-2xl font-bold text-gray-900">{voo.destino}</div>
                            <div className="text-sm text-gray-500">Chegada</div>
                            <div className="text-lg font-semibold" style={{color: corEmpresa}}>{formatarHorario(voo.horario_chegada) || 'N/A'}</div>
                            <div className="text-xs text-gray-500" style={{marginTop: 2}}>
                              {voo.data_volta ? formatarDataBR(voo.data_volta) : '-'}
                            </div>
                          </div>
                        </div>
                        <div style={{display: 'flex', gap: 8, marginTop: 8}}>
                          <div className="bg-gray-50 rounded-lg p-3" style={{flex: 1}}>
                            <div className="text-sm text-gray-500">Classe</div>
                            <div className="font-semibold text-gray-900">{voo.classe || 'Econômica'}</div>
                          </div>
                        </div>
                      </div>
                      {/* Seção de Status e Bagagem lateralizada */}
                      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8}}>
                        <div style={{ border: `1px solid ${corEmpresa}`, borderRadius: 8, padding: '12px', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4}}>
                            <div style={{ width: 8, height: 8, background: corEmpresa, borderRadius: '50%' }}></div>
                            <span style={{ color: corEmpresa, fontSize: 11, fontWeight: 600 }}>Status</span>
                          </div>
                          <div style={{ color: corEmpresa, fontSize: 12, fontWeight: 700 }}>Cotação</div>
                          <div style={{borderTop: '1px solid #e0e7ef', margin: '8px 0'}}></div>
                          <div style={{ color: corEmpresa, fontSize: 12, fontWeight: 700 }}>Bagagens</div>
                          <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 4, background: '#eaf1fb', borderRadius: 6, padding: '4px 10px'}}>
                              <IconBag color={corEmpresa} />
                              <span style={{ color: corEmpresa, fontSize: 11, fontWeight: 600 }}>Despachada:</span>
                              <span style={{ color: corEmpresa, fontSize: 11, fontWeight: 700 }}>{voo.bagagem_despachada || voo.bagagemDespachada || '-'}</span>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: 4, background: '#eaf1fb', borderRadius: 6, padding: '4px 10px'}}>
                              <IconBag color={corEmpresa} />
                              <span style={{ color: corEmpresa, fontSize: 11, fontWeight: 600 }}>Mão:</span>
                              <span style={{ color: corEmpresa, fontSize: 11, fontWeight: 700 }}>{voo.bagagem_mao || voo.bagagemMao || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <footer style={{
        width: '100%',
        maxWidth: 1000,
        margin: '24px auto 0 auto',
        background: `linear-gradient(90deg, ${corEmpresa} 0%, ${corEmpresaEscura} 100%)`,
        color: '#fff',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        boxShadow: '0 -2px 16px 0 #0001',
        padding: '18px 16px 14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: 2}}>
          R$ {cotacao.valor?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '-'}
        </div>
        <div style={{fontSize: 13, fontWeight: 600, marginBottom: 8}}>
          Forma de pagamento: <span style={{fontWeight: 800}}>{formaPagamentoNome || '-'}</span>
        </div>
        <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
          {(cotacao.custos || []).map((item: any, idx: number) => (
            <li key={idx} style={{fontSize: 12, marginBottom: 4, display: 'flex', justifyContent: 'space-between'}}>
              <span>{item.descricao}</span>
              <span style={{fontWeight: 700}}>R$ {item.valor?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            </li>
          ))}
        </ul>
      </footer>
      <button className="btn-print" onClick={() => window.print()}>Imprimir</button>
    </div>
  );
};

export default CotacaoView; 