import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getAirlineLogoUrl } from '../utils/airlineLogos';

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

function formatarDataSemana(dateString?: string): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  const semanaRaw = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  const semana = semanaRaw.charAt(0).toUpperCase() + semanaRaw.slice(1);
  const [ano, mes, dia] = dateString.slice(0,10).split('-');
  return `${semana}, ${dia}/${mes}/${ano}`;
}

function dataPorDirecao(voos: any[], direcao: 'IDA'|'VOLTA'|'INTERNO'): string {
    const lista = voos.filter(v => v.direcao === direcao || (v.dados_voo && v.dados_voo.sentido === direcao.toLowerCase()));
    if (!lista.length) return '';
    const datas: string[] = [];
    lista.forEach(v => {
      const d = direcao === 'VOLTA'
        ? String(v.data_volta || v.dataVolta || '').slice(0,10)
        : String(v.data_ida || v.dataIda || '').slice(0,10)
      if (d) datas.push(d);
    });
    if (!datas.length) return '';
    return datas.sort()[0];
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
  const [conexoes, setConexoes] = useState<Record<string, any[]>>({})
  const [segmentosPorTrecho, setSegmentosPorTrecho] = useState<Record<string, any[]>>({})
  const [segmentosPorNumero, setSegmentosPorNumero] = useState<Record<string, any[]>>({})
  const [segmentosPorOpcaoMap, setSegmentosPorOpcaoMap] = useState<Record<number, any[]>>({})
  const [segmentosPorVooId, setSegmentosPorVooId] = useState<Record<number, any[]>>({})
  const [opcoesList, setOpcoesList] = useState<any[]>([])
  const [pagamentos, setPagamentos] = useState<Array<{id:string, formapagid:string, parcelas:string, valor:number, descricao?:string, links?: Array<{n:number, valor:number}>}>>([])
  const [formasPagamentoMap, setFormasPagamentoMap] = useState<Record<string, string>>({})
  const [mostrarPagamentosInvestimento, setMostrarPagamentosInvestimento] = useState(true)

  useEffect(() => {
    const buscarDados = async () => {
      setLoading(true);
      // Buscar cotação
      const { data: cot } = await supabase.from('cotacoes').select('*').eq('codigo', codigo).single();
      setCotacao(cot);
      const obs = String(cot?.observacoes || '')
      const linha = obs.split('\n').find(l => l.startsWith('__PAGAMENTOS__='))
      const linhaMostrar = obs.split('\n').find(l => l.startsWith('__MOSTRAR_PAGAMENTOS__='))
      if (linhaMostrar) {
        const v = linhaMostrar.substring('__MOSTRAR_PAGAMENTOS__='.length)
        setMostrarPagamentosInvestimento(String(v) === 'true')
      } else {
        setMostrarPagamentosInvestimento(true)
      }
      let arr: any[] = []
      if (linha) {
        const j = linha.substring('__PAGAMENTOS__='.length)
        try { const val = JSON.parse(j); if (Array.isArray(val)) arr = val } catch {}
      }
      const pagos = arr.map(e => ({ id: String(e.id || Date.now()), formapagid: String(e.formapagid || ''), parcelas: String(e.parcelas || '1'), valor: Number(e.valor || 0), descricao: e.descricao ? String(e.descricao) : undefined, links: Array.isArray(e.links) ? e.links.map((l:any) => ({ n: Number(l.n||0), valor: Number(l.valor||0) })) : undefined }))
      setPagamentos(pagos)
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
      // Opções e segmentos (conexões) — consulta sem depender de coluna opcional
      const { data: opData } = await supabase
        .from('cotacao_opcoes_voo')
        .select('id, trecho, preco_total, voo_id')
        .eq('cotacao_id', cot?.id)
      const opcoes: any[] = Array.isArray(opData) ? opData : []
      setOpcoesList(opcoes)
      let segmentosPorOpcao: Record<number, any[]> = {}
      if (opcoes && opcoes.length) {
        const ids = opcoes.map(o => o.id)
        let segs: any[] = []
        if (ids.length > 0) {
          const { data: segData } = await supabase
            .from('cotacao_opcao_segmentos')
            .select('*')
            .in('opcao_id', ids)
            .order('ordem')
          segs = Array.isArray(segData) ? segData : []
        }
        (segs || []).forEach(s => {
          const k = s.opcao_id as number
          if (!segmentosPorOpcao[k]) segmentosPorOpcao[k] = []
          segmentosPorOpcao[k].push(s)
        })
      }
      // Mapear por voo_id para uso no render
      const conexoesMap: Record<string, any[]> = {}
      const opList = Array.isArray(opcoes) ? opcoes : []
      const porTrecho: Record<string, any[]> = {}
      const porNumero: Record<string, any[]> = {}
      const porVooId: Record<number, any[]> = {}
      opList.forEach(o => {
        const lista = segmentosPorOpcao[o.id] || []
        if (o.trecho) porTrecho[o.trecho] = lista
        if (o.voo_id) {
          porVooId[Number(o.voo_id)] = lista
        }
        const primeiroNum = (lista[0]?.numero_voo || lista[0]?.numeroVoo || '') as string
        if (primeiroNum) porNumero[String(primeiroNum)] = lista
      })
      setSegmentosPorTrecho(porTrecho)
      setSegmentosPorNumero(porNumero)
      setSegmentosPorOpcaoMap(segmentosPorOpcao)
      setSegmentosPorVooId(porVooId)
      setConexoes(conexoesMap)
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
      const ids = pagos.map(p => p.formapagid).filter(Boolean)
      if (ids.length) {
        const { data: formas } = await supabase.from('formas_pagamento').select('id,nome').in('id', ids.map(x => isNaN(Number(x)) ? x : Number(x)))
        const map: Record<string,string> = {}
        ;(formas || []).forEach((f:any) => { map[String(f.id)] = String(f.nome || '') })
        setFormasPagamentoMap(map)
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

  const BagagemEmoji = ({ emoji, count, active, color }:{ emoji: string, count: number, active: boolean, color: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 16 }}>
      <div style={{ fontSize: 7, fontWeight: 800, color: active ? color : '#9ca3af', marginBottom: 0, lineHeight: 1 }}>{Number(count || 0)}</div>
      <span style={{ fontSize: 11, filter: active ? 'none' : 'grayscale(100%) opacity(0.4)', lineHeight: 1 }}>{emoji}</span>
    </div>
  )

  function renderLinksGrid(links: Array<{n:number, valor:number}>) {
    const arr = Array.isArray(links) ? links.slice().sort((a,b) => Number(a.n) - Number(b.n)) : []
    const odd = arr.filter(l => Number(l.n) % 2 === 1)
    const even = arr.filter(l => Number(l.n) % 2 === 0)
    const cols = Math.max(1, Math.ceil(arr.length / 2))
    return (
      <div style={{marginTop:6, display:'flex', flexDirection:'column', gap:4}}>
        <div style={{display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:6}}>
          {odd.map((l, i) => (
            <div key={`odd-${i}`} style={{fontWeight:800}}>{l.n}x R$ {Number(l.valor || 0).toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})}</div>
          ))}
        </div>
        <div style={{display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:6}}>
          {even.map((l, i) => (
            <div key={`even-${i}`} style={{fontWeight:800}}>{l.n}x R$ {Number(l.valor || 0).toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2})}</div>
          ))}
        </div>
      </div>
    )
  }

  function origemDestinoDeConexoes(voo: any) {
    const segs = obterSegmentosDoVoo(voo)
    if (!segs.length) return null
    const primeiro = segs[0]
    const ultimo = segs[segs.length - 1]
    return {
      origem: primeiro?.origem || voo.origem,
      destino: ultimo?.destino || voo.destino,
      partida: primeiro?.partida?.substring?.(11,16) || voo.horario_partida,
      chegada: ultimo?.chegada?.substring?.(11,16) || voo.horario_chegada,
      dataPartida: primeiro?.partida?.substring?.(0,10) || voo.data_ida,
      dataChegada: ultimo?.chegada?.substring?.(0,10) || voo.data_volta,
      segs
    }
  }

  function chipConexoes(voo: any) {
    const segs = obterSegmentosDoVoo(voo)
    const n = Math.max(0, (segs.length || 0) - 1)
    if (n <= 0) return 'Voo direto'
    if (n === 1) return '1 Conexão'
    return `${n} Conexões`
  }

  

  function iataFrom(s?: string): string | null {
    if (!s) return null
    const idx = s.indexOf(' - ')
    return idx > 0 ? s.substring(0, idx) : s
  }

  // Override com lógica mais robusta para escolher segmentos do card
  function obterSegmentosDoVoo(voo: any): any[] {
    // Se existir dados_voo (JSON vindo do buscador), usa ele preferencialmente
    if (voo.dados_voo) {
        const dados = voo.dados_voo
        if (dados.conexoes && dados.conexoes.length > 0) {
            return dados.conexoes.map((c: any) => {
                 const [datePart, timePart] = c.EmbarqueCompleto ? c.EmbarqueCompleto.split(' ') : ['','']
                 const [dateCheg, timeCheg] = c.DesembarqueCompleto ? c.DesembarqueCompleto.split(' ') : ['','']
                 const [day, month, year] = datePart.split('/')
                 const isoDate = `${year}-${month}-${day}T${timePart}`
                 const isoCheg = c.DesembarqueCompleto ? c.DesembarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1') : ''

                 return {
                     cia: dados.cia,
                     numero_voo: c.NumeroVoo,
                     partida: isoDate,
                     chegada: isoCheg,
                     origem: c.Origem,
                     destino: c.Destino
                 }
            })
        }
        // Se for direto no JSON
        return []
    }

    const idNum = Number(voo.id)
    if (Number.isFinite(idNum) && segmentosPorVooId[idNum] && segmentosPorVooId[idNum].length) {
      return segmentosPorVooId[idNum]
    }
    return []
  }

  // Função para buscar logo da companhia aérea
  function getLogoCompanhia(nomeCompanhia: string) {
    if (!nomeCompanhia) return null;
    
    // Tenta primeiro pela utilitária (logo corrigida)
    const logoUrl = getAirlineLogoUrl(nomeCompanhia);
    if (logoUrl) return logoUrl;

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
        .titulo-orcamento {
          color: #fff !important;
        }
        @media print { 
          .btn-print { display: none !important; }
          .titulo-orcamento { color: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .footer-investimento {
             position: fixed !important;
             bottom: 0 !important;
             left: 0 !important;
             right: 0 !important;
             margin: 0 !important;
             max-width: none !important;
             width: 100% !important;
             z-index: 1000 !important;
           }
          h2 { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
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
          className="titulo-orcamento"
          style={{
            background: corEmpresa,
            color: '#fff',
            padding: '8px 24px',
            borderRadius: 10,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 1,
            boxShadow: `0 3px 12px 0 ${corEmpresa}22`,
            fontFamily: 'Montserrat, Arial, sans-serif',
            textTransform: 'uppercase',
            border: 'none',
            outline: 'none',
            textShadow: `0 2px 6px ${corEmpresa}22`,
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact'
          }}
        >
          ORÇAMENTO DE VIAGEM
        </h2>
      </div>

      {/* Cards de Voos - IGUAL IMPRESSÃO */}
      {voos.length > 0 && (
        <div style={{marginTop: 8, marginBottom: 8}}>
          {/* Voos de Ida */}
          {voos.filter(v => v.direcao === 'IDA' || (v.dados_voo && v.dados_voo.sentido === 'ida')).length > 0 && (
            <div className="mb-6">
              <div style={{background: corEmpresa, color:'#fff', borderRadius:10, padding:'6px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10}}>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <AviaoPaperSVG color="#fff" />
                  <span style={{fontSize:12, fontWeight:700}}>Opções de Ida</span>
                </div>
                <div style={{fontSize:12, fontWeight:700}}>{voos.filter(v=>v.direcao==='IDA' || (v.dados_voo && v.dados_voo.sentido === 'ida')).length} {voos.filter(v=>v.direcao==='IDA' || (v.dados_voo && v.dados_voo.sentido === 'ida')).length === 1 ? 'Opção' : 'Opções'}</div>
              </div>
          {voos.filter(v => v.direcao === 'IDA' || (v.dados_voo && v.dados_voo.sentido === 'ida')).map((voo, i) => (
            <div key={`ida-${i}`} className="bg-white border border-gray-200 rounded-xl shadow-sm mb-2" style={{padding: 6, marginBottom: 10}}>
              {(() => {
                // Tenta usar dados_voo primeiro
                if (voo.dados_voo) {
                    const d = voo.dados_voo
                    const segs = d.conexoes && d.conexoes.length > 0 
                        ? d.conexoes.map((c: any) => ({
                            cia: d.cia,
                            numero_voo: c.NumeroVoo,
                            partida: c.EmbarqueCompleto ? new Date(c.EmbarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')).toISOString() : '',
                            chegada: c.DesembarqueCompleto ? new Date(c.DesembarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')).toISOString() : '',
                            origem: c.Origem,
                            destino: c.Destino
                        }))
                        : [{
                            cia: d.cia,
                            numero_voo: d.numero,
                            partida: d.partida,
                            chegada: d.chegada,
                            origem: d.origem,
                            destino: d.destino
                        }]
                    
                    return (
                        <div style={{display:'flex', flexDirection:'column', gap:6}}>
                            <div style={{display:'grid', gridTemplateColumns:'minmax(90px, 140px) 70px 130px 130px 2fr 2fr 100px 100px', alignItems:'center', gap:2, fontSize:11, fontWeight:700, color:'#6b7280', padding:'1px 0'}}>
                                <div>Cia Aérea</div>
                                <div>Nº Voo</div>
                                <div>Saída</div>
                                <div style={{borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>Chegada</div>
                                <div style={{borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>Origem</div>
                                <div>Destino</div>
                                <div>Bagagem</div>
                                <div>Total</div>
                            </div>
                            {segs.map((s:any, idx:number) => (
                                <div key={idx} style={{display:'grid', gridTemplateColumns:'minmax(90px, 140px) 70px 130px 130px 2fr 2fr 100px 100px', alignItems:'center', gap:2}}>
                                    <div style={{display:'flex', alignItems:'center', gap:4}}>
                                        {getLogoCompanhia(s.cia) ? (
                                            <img src={getLogoCompanhia(s.cia)} alt={s.cia} style={{width: 20, height: 20, objectFit: 'contain'}} />
                                        ) : (
                                            <div style={{width: 20, height: 20, background: '#f3f4f6', borderRadius: 4, display:'flex', alignItems:'center', justifyContent:'center', color:'#a3a3a3', fontWeight:700, fontSize:10}}>LOGO</div>
                                        )}
                                        <span style={{fontSize:12, fontWeight:700, color:'#111'}}>{s.cia}</span>
                                    </div>
                                    <div style={{fontSize:12, color:'#111'}}>{s.numero_voo}</div>
                                    <div style={{display:'flex', alignItems:'center', gap:6}}>
                                        <span style={{fontSize:12, color:'#6b7280'}}>{formatarDataBR(s.partida)}</span>
                                        <span style={{fontSize:12, color: corEmpresa, border:`1px solid ${corEmpresa}`, borderRadius:8, padding:'2px 6px'}}>{new Date(s.partida).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false})}</span>
                                    </div>
                                    <div style={{display:'flex', alignItems:'center', gap:6}}>
                                        <span style={{fontSize:12, color:'#6b7280'}}>{formatarDataBR(s.chegada)}</span>
                                        <span style={{fontSize:12, color: corEmpresa, border:`1px solid ${corEmpresa}`, borderRadius:8, padding:'2px 6px'}}>{new Date(s.chegada).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false})}</span>
                                    </div>
                                    <div style={{fontSize:12, fontWeight:800, color: corEmpresa, whiteSpace:'nowrap', borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>{s.origem}</div>
                                    <div style={{fontSize:12, fontWeight:800, color: corEmpresa, whiteSpace:'nowrap'}}>{s.destino}</div>
                                    <div style={{fontSize:12, color:'#111'}}>
                                        {d.hasBag ? <IconBag size={14} color={corEmpresa} /> : <span style={{color:'#ef4444'}}>Sem bagagem</span>}
                                    </div>
                                    <div style={{fontSize:18, fontWeight:800, color:'#111', textAlign:'center', transform:'translateY(-50%)'}}>
                                        {idx === Math.floor(segs.length/2) ? Number(d.total || 0).toLocaleString('pt-BR',{style:'currency', currency:'BRL'}) : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                }

                const segs = obterSegmentosDoVoo(voo) || []
                const partidaStr = (() => {
                  const hp = String(voo.horario_partida || voo.horarioPartida || '')
                  if (hp.includes('T')) return hp
                  const di = String(voo.data_ida || voo.dataIda || '')
                  return di ? `${di}T${hp || '00:00'}` : ''
                })()
                const chegadaStr = (() => {
                  const hc = String(voo.horario_chegada || voo.horarioChegada || '')
                  if (hc.includes('T')) return hc
                  const dv = String(voo.data_volta || voo.dataVolta || '')
                  return dv ? `${dv}T${hc || '00:00'}` : ''
                })()
                const linhas = (segs.length ? segs : [{ origem: voo.origem, destino: voo.destino, partida: partidaStr, chegada: chegadaStr, cia: voo.companhia, numero_voo: voo.numero_voo }])
                return (
                  <div style={{display:'flex', flexDirection:'column', gap:6}}>
                    <div style={{display:'grid', gridTemplateColumns:'minmax(90px, 140px) 70px 130px 130px 2fr 2fr 100px 100px', alignItems:'center', gap:2, fontSize:11, fontWeight:700, color:'#6b7280', padding:'1px 0'}}>
                      <div>Cia Aérea</div>
                      <div>Nº Voo</div>
                      <div>Saída</div>
                      <div style={{borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>Chegada</div>
                      <div style={{borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>Origem</div>
                      <div>Destino</div>
                      <div>Bagagem</div>
                      <div>Total</div>
                    </div>
                    {linhas.map((s:any, idx:number) => (
                      <div key={idx} style={{display:'grid', gridTemplateColumns:'minmax(90px, 140px) 70px 130px 130px 2fr 2fr 100px 100px', alignItems:'center', gap:2}}>
                        <div style={{display:'flex', alignItems:'center', gap:4}}>
                          {getLogoCompanhia(s.cia || voo.companhia) ? (
                            <img src={getLogoCompanhia(s.cia || voo.companhia)} alt="Logo Companhia" style={{width: 20, height: 20, objectFit: 'contain'}} />
                          ) : (
                            <div style={{width: 20, height: 20, background: '#f3f4f6', borderRadius: 4, display:'flex', alignItems:'center', justifyContent:'center', color:'#a3a3a3', fontWeight:700, fontSize:10}}>LOGO</div>
                          )}
                          <span style={{fontSize:12, fontWeight:700, color:'#111'}}>{s.cia || voo.companhia || 'Companhia'}</span>
                        </div>
                        <div style={{fontSize:12, color:'#111'}}>{s.numero_voo || voo.numero_voo || 'N/A'}</div>
                        <div style={{display:'flex', alignItems:'center', gap:6}}>
                          <span style={{fontSize:12, color:'#6b7280'}}>{formatarDataBR(String(s.partida || '').substring(0,10))}</span>
                          <span style={{fontSize:12, color: corEmpresa, border:`1px solid ${corEmpresa}`, borderRadius:8, padding:'2px 6px'}}>{new Date(s.partida).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false})}</span>
                        </div>
                        <div style={{display:'flex', alignItems:'center', gap:6}}>
                          <span style={{fontSize:12, color:'#6b7280'}}>{formatarDataBR(String(s.chegada || '').substring(0,10))}</span>
                          <span style={{fontSize:12, color: corEmpresa, border:`1px solid ${corEmpresa}`, borderRadius:8, padding:'2px 6px'}}>{new Date(s.chegada).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false})}</span>
                        </div>
                        <div style={{fontSize:12, fontWeight:800, color: corEmpresa, whiteSpace:'nowrap', borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>{s.origem || voo.origem}</div>
                        <div style={{fontSize:12, fontWeight:800, color: corEmpresa, whiteSpace:'nowrap'}}>{s.destino || voo.destino}</div>
                        <div style={{fontSize:12, color:'#111'}}>{(() => { const bm = Number(voo.bagagem_mao || voo.bagagemMao || 0); const bd = Number(voo.bagagem_despachada || voo.bagagemDespachada || 0); return `🎒 ${bm} / 🧳 ${bd}` })()}</div>
                        <div style={{fontSize:18, fontWeight:800, color:'#111', textAlign:'center', transform:'translateY(-50%)'}}>{(() => { const mid = Math.floor(linhas.length/2); return idx === mid ? Number(voo.preco_opcao || 0).toLocaleString('pt-BR',{style:'currency', currency:'BRL'}) : '' })()}</div>
                      </div>
                    ))}
                    
                    
                  </div>
                )
              })()}
            </div>
          ))}
            </div>
          )}
          {/* Voos Internos */}
          {voos.filter(v => v.direcao === 'INTERNO' || (v.dados_voo && v.dados_voo.sentido === 'interno')).length > 0 && (
            <div className="mb-6">
              <div style={{background: corEmpresa, color:'#fff', borderRadius:10, padding:'6px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10}}>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <AviaoPaperSVG color="#fff" />
                  <span style={{fontSize:12, fontWeight:700}}>Opções Internas</span>
                </div>
                <div style={{fontSize:12, fontWeight:700}}>{voos.filter(v=>v.direcao==='INTERNO' || (v.dados_voo && v.dados_voo.sentido === 'interno')).length} {voos.filter(v=>v.direcao==='INTERNO' || (v.dados_voo && v.dados_voo.sentido === 'interno')).length === 1 ? 'Opção' : 'Opções'}</div>
              </div>
              {voos.filter(v => v.direcao === 'INTERNO' || (v.dados_voo && v.dados_voo.sentido === 'interno')).map((voo, i) => (
                <div key={`interno-${i}`} className="bg-white border border-gray-200 rounded-xl shadow-sm mb-2" style={{padding: 6, marginBottom: 10}}>
                  {(() => {
                    // Tenta usar dados_voo primeiro
                    if (voo.dados_voo) {
                        const d = voo.dados_voo
                        const segs = d.conexoes && d.conexoes.length > 0 
                            ? d.conexoes.map((c: any) => ({
                                cia: d.cia,
                                numero_voo: c.NumeroVoo,
                                partida: c.EmbarqueCompleto ? new Date(c.EmbarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')).toISOString() : '',
                                chegada: c.DesembarqueCompleto ? new Date(c.DesembarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')).toISOString() : '',
                                origem: c.Origem,
                                destino: c.Destino
                            }))
                            : [{
                                cia: d.cia,
                                numero_voo: d.numero,
                                partida: d.partida,
                                chegada: d.chegada,
                                origem: d.origem,
                                destino: d.destino
                            }]
                        
                        return (
                            <div style={{display:'flex', flexDirection:'column', gap:6}}>
                                <div style={{display:'grid', gridTemplateColumns:'minmax(90px, 140px) 70px 130px 130px 2fr 2fr 100px 100px', alignItems:'center', gap:2, fontSize:11, fontWeight:700, color:'#6b7280', padding:'1px 0'}}>
                                    <div>Cia Aérea</div>
                                    <div>Nº Voo</div>
                                    <div>Saída</div>
                                    <div style={{borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>Chegada</div>
                                    <div style={{borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>Origem</div>
                                    <div>Destino</div>
                                    <div>Bagagem</div>
                                    <div>Total</div>
                                </div>
                                {segs.map((s:any, idx:number) => (
                                    <div key={idx} style={{display:'grid', gridTemplateColumns:'minmax(90px, 140px) 70px 130px 130px 2fr 2fr 100px 100px', alignItems:'center', gap:2}}>
                                        <div style={{display:'flex', alignItems:'center', gap:4}}>
                                            {getLogoCompanhia(s.cia) ? (
                                                <img src={getLogoCompanhia(s.cia)} alt={s.cia} style={{width: 20, height: 20, objectFit: 'contain'}} />
                                            ) : (
                                                <div style={{width: 20, height: 20, background: '#f3f4f6', borderRadius: 4, display:'flex', alignItems:'center', justifyContent:'center', color:'#a3a3a3', fontWeight:700, fontSize:10}}>LOGO</div>
                                            )}
                                            <span style={{fontSize:12, fontWeight:700, color:'#111'}}>{s.cia}</span>
                                        </div>
                                        <div style={{fontSize:12, color:'#111'}}>{s.numero_voo}</div>
                                        <div style={{display:'flex', alignItems:'center', gap:6}}>
                                            <span style={{fontSize:12, color:'#6b7280'}}>{formatarDataBR(s.partida)}</span>
                                            <span style={{fontSize:12, color: corEmpresa, border:`1px solid ${corEmpresa}`, borderRadius:8, padding:'2px 6px'}}>{new Date(s.partida).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false})}</span>
                                        </div>
                                        <div style={{display:'flex', alignItems:'center', gap:6}}>
                                            <span style={{fontSize:12, color:'#6b7280'}}>{formatarDataBR(s.chegada)}</span>
                                            <span style={{fontSize:12, color: corEmpresa, border:`1px solid ${corEmpresa}`, borderRadius:8, padding:'2px 6px'}}>{new Date(s.chegada).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false})}</span>
                                        </div>
                                        <div style={{fontSize:12, fontWeight:800, color: corEmpresa, whiteSpace:'nowrap', borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>{s.origem}</div>
                                        <div style={{fontSize:12, fontWeight:800, color: corEmpresa, whiteSpace:'nowrap'}}>{s.destino}</div>
                                        <div style={{fontSize:12, color:'#111'}}>
                                            {d.hasBag ? <IconBag size={14} color={corEmpresa} /> : <span style={{color:'#ef4444'}}>Sem bagagem</span>}
                                        </div>
                                        <div style={{fontSize:18, fontWeight:800, color:'#111', textAlign:'center', transform:'translateY(-50%)'}}>
                                            {idx === Math.floor(segs.length/2) ? Number(d.total || 0).toLocaleString('pt-BR',{style:'currency', currency:'BRL'}) : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    }

                    const segs = obterSegmentosDoVoo(voo) || []
                    const partidaStr = (() => {
                      const hp = String(voo.horario_partida || voo.horarioPartida || '')
                      if (hp.includes('T')) return hp
                      const di = String(voo.data_ida || voo.dataIda || '')
                      return di ? `${di}T${hp || '00:00'}` : ''
                    })()
                    const chegadaStr = (() => {
                      const hc = String(voo.horario_chegada || voo.horarioChegada || '')
                      if (hc.includes('T')) return hc
                      const dv = String(voo.data_volta || voo.dataVolta || '')
                      return dv ? `${dv}T${hc || '00:00'}` : ''
                    })()
                    const linhas = (segs.length ? segs : [{ origem: voo.origem, destino: voo.destino, partida: partidaStr, chegada: chegadaStr, cia: voo.companhia, numero_voo: voo.numero_voo }])
                    return (
                      <div style={{display:'flex', flexDirection:'column', gap:6}}>
                        <div style={{display:'grid', gridTemplateColumns:'minmax(90px, 140px) 70px 130px 130px 2fr 2fr 100px 100px', alignItems:'center', gap:2, fontSize:11, fontWeight:700, color:'#6b7280', padding:'1px 0'}}>
                          <div>Cia Aérea</div>
                          <div>Nº Voo</div>
                          <div>Saída</div>
                          <div style={{borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>Chegada</div>
                          <div style={{borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>Origem</div>
                          <div>Destino</div>
                          <div>Bagagem</div>
                          <div>Total</div>
                        </div>
                        {linhas.map((s:any, idx:number) => (
                          <div key={idx} style={{display:'grid', gridTemplateColumns:'minmax(90px, 140px) 70px 130px 130px 2fr 2fr 100px 100px', alignItems:'center', gap:2}}>
                            <div style={{display:'flex', alignItems:'center', gap:4}}>
                              {getLogoCompanhia(s.cia || voo.companhia) ? (
                                <img src={getLogoCompanhia(s.cia || voo.companhia)} alt="Logo Companhia" style={{width: 20, height: 20, objectFit: 'contain'}} />
                              ) : (
                                <div style={{width: 20, height: 20, background: '#f3f4f6', borderRadius: 4, display:'flex', alignItems:'center', justifyContent:'center', color:'#a3a3a3', fontWeight:700, fontSize:10}}>LOGO</div>
                              )}
                              <span style={{fontSize:12, fontWeight:700, color:'#111'}}>{s.cia || voo.companhia || 'Companhia'}</span>
                            </div>
                            <div style={{fontSize:12, color:'#111'}}>{s.numero_voo || voo.numero_voo || 'N/A'}</div>
                            <div style={{display:'flex', alignItems:'center', gap:6}}>
                              <span style={{fontSize:12, color:'#6b7280'}}>{formatarDataBR(String(s.partida || '').substring(0,10))}</span>
                              <span style={{fontSize:12, color: corEmpresa, border:`1px solid ${corEmpresa}`, borderRadius:8, padding:'2px 6px'}}>{new Date(s.partida).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false})}</span>
                            </div>
                            <div style={{display:'flex', alignItems:'center', gap:6}}>
                              <span style={{fontSize:12, color:'#6b7280'}}>{formatarDataBR(String(s.chegada || '').substring(0,10))}</span>
                              <span style={{fontSize:12, color: corEmpresa, border:`1px solid ${corEmpresa}`, borderRadius:8, padding:'2px 6px'}}>{new Date(s.chegada).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false})}</span>
                            </div>
                            <div style={{fontSize:12, fontWeight:800, color: corEmpresa, whiteSpace:'nowrap', borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>{s.origem || voo.origem}</div>
                            <div style={{fontSize:12, fontWeight:800, color: corEmpresa, whiteSpace:'nowrap'}}>{s.destino || voo.destino}</div>
                            <div style={{fontSize:12, color:'#111'}}>{(() => { const bm = Number(voo.bagagem_mao || voo.bagagemMao || 0); const bd = Number(voo.bagagem_despachada || voo.bagagemDespachada || 0); return `🎒 ${bm} / 🧳 ${bd}` })()}</div>
                            <div style={{fontSize:18, fontWeight:800, color:'#111', textAlign:'center', transform:'translateY(-50%)'}}>{(() => { const mid = Math.floor(linhas.length/2); return idx === mid ? Number(voo.preco_opcao || 0).toLocaleString('pt-BR',{style:'currency', currency:'BRL'}) : '' })()}</div>
                          </div>
                        ))}
                        
                        
                      </div>
                    )
                  })()}
                </div>
              ))}
            </div>
          )}
          {/* Voos de Volta */}
          {voos.filter(v => v.direcao === 'VOLTA' || (v.dados_voo && v.dados_voo.sentido === 'volta')).length > 0 && (
            <div className="mb-6">
              <div style={{background: corEmpresaEscuraVolta, color:'#fff', borderRadius:10, padding:'6px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10}}>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <AviaoPaperSVG color="#fff" flip={true} rotate={180} />
                  <span style={{fontSize:12, fontWeight:700}}>Opções de Volta</span>
                </div>
                <div style={{fontSize:12, fontWeight:700}}>{voos.filter(v=>v.direcao==='VOLTA' || (v.dados_voo && v.dados_voo.sentido === 'volta')).length} {voos.filter(v=>v.direcao==='VOLTA' || (v.dados_voo && v.dados_voo.sentido === 'volta')).length === 1 ? 'Opção' : 'Opções'}</div>
              </div>
              {voos.filter(v => v.direcao === 'VOLTA' || (v.dados_voo && v.dados_voo.sentido === 'volta')).map((voo, i) => (
                <div key={`volta-${i}`} className="bg-white border border-gray-200 rounded-xl shadow-sm mb-2" style={{padding: 6, marginBottom: 10}}>
                  {(() => {
                    // Tenta usar dados_voo primeiro
                    if (voo.dados_voo) {
                        const d = voo.dados_voo
                        const segs = d.conexoes && d.conexoes.length > 0 
                            ? d.conexoes.map((c: any) => ({
                                cia: d.cia,
                                numero_voo: c.NumeroVoo,
                                partida: c.EmbarqueCompleto ? new Date(c.EmbarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')).toISOString() : '',
                                chegada: c.DesembarqueCompleto ? new Date(c.DesembarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')).toISOString() : '',
                                origem: c.Origem,
                                destino: c.Destino
                            }))
                            : [{
                                cia: d.cia,
                                numero_voo: d.numero,
                                partida: d.partida,
                                chegada: d.chegada,
                                origem: d.origem,
                                destino: d.destino
                            }]
                        
                        return (
                            <div style={{display:'flex', flexDirection:'column', gap:6}}>
                                <div style={{display:'grid', gridTemplateColumns:'minmax(90px, 140px) 70px 130px 130px 2fr 2fr 100px 100px', alignItems:'center', gap:2, fontSize:11, fontWeight:700, color:'#6b7280', padding:'1px 0'}}>
                                    <div>Cia Aérea</div>
                                    <div>Nº Voo</div>
                                    <div>Saída</div>
                                    <div style={{borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>Chegada</div>
                                    <div style={{borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>Origem</div>
                                    <div>Destino</div>
                                    <div>Bagagem</div>
                                    <div>Total</div>
                                </div>
                                {segs.map((s:any, idx:number) => (
                                    <div key={idx} style={{display:'grid', gridTemplateColumns:'minmax(90px, 140px) 70px 130px 130px 2fr 2fr 100px 100px', alignItems:'center', gap:2}}>
                                        <div style={{display:'flex', alignItems:'center', gap:4}}>
                                            {getLogoCompanhia(s.cia) ? (
                                                <img src={getLogoCompanhia(s.cia)} alt={s.cia} style={{width: 20, height: 20, objectFit: 'contain'}} />
                                            ) : (
                                                <div style={{width: 20, height: 20, background: '#f3f4f6', borderRadius: 4, display:'flex', alignItems:'center', justifyContent:'center', color:'#a3a3a3', fontWeight:700, fontSize:10}}>LOGO</div>
                                            )}
                                            <span style={{fontSize:12, fontWeight:700, color:'#111'}}>{s.cia}</span>
                                        </div>
                                        <div style={{fontSize:12, color:'#111'}}>{s.numero_voo}</div>
                                        <div style={{display:'flex', alignItems:'center', gap:6}}>
                                            <span style={{fontSize:12, color:'#6b7280'}}>{formatarDataBR(s.partida)}</span>
                                            <span style={{fontSize:12, color: corEmpresa, border:`1px solid ${corEmpresa}`, borderRadius:8, padding:'2px 6px'}}>{new Date(s.partida).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false})}</span>
                                        </div>
                                        <div style={{display:'flex', alignItems:'center', gap:6}}>
                                            <span style={{fontSize:12, color:'#6b7280'}}>{formatarDataBR(s.chegada)}</span>
                                            <span style={{fontSize:12, color: corEmpresa, border:`1px solid ${corEmpresa}`, borderRadius:8, padding:'2px 6px'}}>{new Date(s.chegada).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false})}</span>
                                        </div>
                                        <div style={{fontSize:12, fontWeight:800, color: corEmpresa, whiteSpace:'nowrap', borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>{s.origem}</div>
                                        <div style={{fontSize:12, fontWeight:800, color: corEmpresa, whiteSpace:'nowrap'}}>{s.destino}</div>
                                        <div style={{fontSize:12, color:'#111'}}>
                                            {d.hasBag ? <IconBag size={14} color={corEmpresa} /> : <span style={{color:'#ef4444'}}>Sem bagagem</span>}
                                        </div>
                                        <div style={{fontSize:18, fontWeight:800, color:'#111', textAlign:'center', transform:'translateY(-50%)'}}>
                                            {idx === Math.floor(segs.length/2) ? Number(d.total || 0).toLocaleString('pt-BR',{style:'currency', currency:'BRL'}) : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    }

                    const segs = obterSegmentosDoVoo(voo) || []
                    const partidaStr = (() => {
                      const hp = String(voo.horario_partida || voo.horarioPartida || '')
                      if (hp.includes('T')) return hp
                      const di = String(voo.data_ida || voo.dataIda || '')
                      return di ? `${di}T${hp || '00:00'}` : ''
                    })()
                    const chegadaStr = (() => {
                      const hc = String(voo.horario_chegada || voo.horarioChegada || '')
                      if (hc.includes('T')) return hc
                      const dv = String(voo.data_volta || voo.dataVolta || '')
                      return dv ? `${dv}T${hc || '00:00'}` : ''
                    })()
                    const linhas = (segs.length ? segs : [{ origem: voo.origem, destino: voo.destino, partida: partidaStr, chegada: chegadaStr, cia: voo.companhia, numero_voo: voo.numero_voo }])
                    return (
                      <div style={{display:'flex', flexDirection:'column', gap:6}}>
                        <div style={{display:'grid', gridTemplateColumns:'minmax(90px, 140px) 70px 130px 130px 2fr 2fr 100px 100px', alignItems:'center', gap:2, fontSize:11, fontWeight:700, color:'#6b7280', padding:'1px 0'}}>
                          <div>Cia Aérea</div>
                          <div>Nº Voo</div>
                          <div>Saída</div>
                          <div style={{borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>Chegada</div>
                          <div style={{borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>Origem</div>
                          <div>Destino</div>
                          <div>Bagagem</div>
                          <div>Total</div>
                        </div>
                        {linhas.map((s:any, idx:number) => (
                          <div key={idx} style={{display:'grid', gridTemplateColumns:'minmax(90px, 140px) 70px 130px 130px 2fr 2fr 100px 100px', alignItems:'center', gap:2}}>
                            <div style={{display:'flex', alignItems:'center', gap:4}}>
                              {getLogoCompanhia(s.cia || voo.companhia) ? (
                                <img src={getLogoCompanhia(s.cia || voo.companhia)} alt="Logo Companhia" style={{width: 20, height: 20, objectFit: 'contain'}} />
                              ) : (
                                <div style={{width: 20, height: 20, background: '#f3f4f6', borderRadius: 4, display:'flex', alignItems:'center', justifyContent:'center', color:'#a3a3a3', fontWeight:700, fontSize:10}}>LOGO</div>
                              )}
                              <span style={{fontSize:12, fontWeight:700, color:'#111'}}>{s.cia || voo.companhia || 'Companhia'}</span>
                            </div>
                            <div style={{fontSize:12, color:'#111'}}>{s.numero_voo || voo.numero_voo || 'N/A'}</div>
                            <div style={{display:'flex', alignItems:'center', gap:6}}>
                              <span style={{fontSize:12, color:'#6b7280'}}>{formatarDataBR(String(s.partida || '').substring(0,10))}</span>
                              <span style={{fontSize:12, color: corEmpresa, border:`1px solid ${corEmpresa}`, borderRadius:8, padding:'2px 6px'}}>{new Date(s.partida).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false})}</span>
                            </div>
                            <div style={{display:'flex', alignItems:'center', gap:6}}>
                              <span style={{fontSize:12, color:'#6b7280'}}>{formatarDataBR(String(s.chegada || '').substring(0,10))}</span>
                              <span style={{fontSize:12, color: corEmpresa, border:`1px solid ${corEmpresa}`, borderRadius:8, padding:'2px 6px'}}>{new Date(s.chegada).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false})}</span>
                            </div>
                            <div style={{fontSize:12, fontWeight:800, color: corEmpresa, whiteSpace:'nowrap', borderLeft:'1px solid #e5e7eb', paddingLeft:6}}>{s.origem || voo.origem}</div>
                            <div style={{fontSize:12, fontWeight:800, color: corEmpresa, whiteSpace:'nowrap'}}>{s.destino || voo.destino}</div>
                            <div style={{fontSize:12, color:'#111'}}>{(() => { const bm = Number(voo.bagagem_mao || voo.bagagemMao || 0); const bd = Number(voo.bagagem_despachada || voo.bagagemDespachada || 0); return `🎒 ${bm} / 🧳 ${bd}` })()}</div>
                            <div style={{fontSize:18, fontWeight:800, color:'#111', textAlign:'center', transform:'translateY(-50%)'}}>{(() => { const mid = Math.floor(linhas.length/2); return idx === mid ? Number(voo.preco_opcao || 0).toLocaleString('pt-BR',{style:'currency', currency:'BRL'}) : '' })()}</div>
                          </div>
                        ))}
                        
                        
                      </div>
                    )
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {mostrarPagamentosInvestimento && (
      <footer className="footer-investimento" style={{
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
        {pagamentos.length > 1 ? null : (
          <div style={{fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: 2}}>
            Investimento Total: R$ {cotacao.valor?.toLocaleString('pt-BR', {minimumFractionDigits: 2}) || '-'}
          </div>
        )}
        {pagamentos.length > 0 ? (
          pagamentos.length > 1 ? (
            <div style={{marginBottom: 8}}>
              <div style={{fontSize: 16, fontWeight: 800, letterSpacing: 1}}>OPÇÕES DE PAGAMENTO</div>
              <div style={{background: '#ffffff22', borderRadius: 12, padding: '10px 12px', marginTop: 6}}>
                <ul style={{listStyle:'none', padding:0, margin:0}}>
                  {pagamentos.map((p, idx) => (
                    <li key={idx} style={{marginBottom:8}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <span style={{fontSize: 14, fontWeight: 700}}>{(p as any).descricao?.toLowerCase?.().includes('link de pagamento') ? 'Link de pagamento' : (formasPagamentoMap[String(p.formapagid)] || p.formapagid || '-')}</span>
                        {Array.isArray((p as any).links) && (p as any).links.length ? (
                          <span style={{fontSize: 15, fontWeight: 800}}></span>
                        ) : (
                          (() => {
                            const n = parseInt(p.parcelas || '1') || 1
                            const total = Number(p.valor || 0)
                            const valorBase = n > 1 ? (total / n) : total
                            const valorArredCima = Math.ceil(valorBase * 100) / 100
                            return <span style={{fontSize: 15, fontWeight: 800}}>R$ {valorArredCima.toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits:2})}</span>
                          })()
                        )}
                      </div>
                      {Array.isArray((p as any).links) && (p as any).links.length ? (
                        renderLinksGrid((p as any).links)
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div style={{fontSize: 13, fontWeight: 600, marginBottom: 8}}>
              Opções de pagamento:
              <ul style={{listStyle:'none', padding:0, marginTop:6}}>
                {pagamentos.map((p, idx) => (
                  <li key={idx} style={{marginBottom:8}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{fontWeight:800}}>{(p as any).descricao?.toLowerCase?.().includes('link de pagamento') ? 'Link de pagamento' : (formasPagamentoMap[String(p.formapagid)] || p.formapagid || '-')}</span>
                      {Array.isArray((p as any).links) && (p as any).links.length ? (
                        <span style={{fontWeight:800}}></span>
                      ) : (
                        (() => {
                          const n = parseInt(p.parcelas || '1') || 1
                          const total = Number(p.valor || 0)
                          const valorBase = n > 1 ? (total / n) : total
                          const valorArredCima = Math.ceil(valorBase * 100) / 100
                          return <span style={{fontWeight:800}}>R$ {valorArredCima.toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits:2})}</span>
                        })()
                      )}
                    </div>
                    {Array.isArray((p as any).links) && (p as any).links.length ? (
                      renderLinksGrid((p as any).links)
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )
        ) : (
          <div style={{fontSize: 13, fontWeight: 600, marginBottom: 8}}>
            Forma de pagamento: <span style={{fontWeight: 800}}>{formaPagamentoNome || '-'}</span>
            {cotacao.parcelamento && cotacao.parcelamento !== '1' && (
              <span style={{fontWeight: 800}}> em {cotacao.parcelamento}x de R$ {((cotacao.valor || 0) / parseInt(cotacao.parcelamento || '1')).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            )}
          </div>
        )}
        <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
          {(cotacao.custos || []).map((item: any, idx: number) => (
            <li key={idx} style={{fontSize: 12, marginBottom: 4, display: 'flex', justifyContent: 'space-between'}}>
              <span>{item.descricao}</span>
              <span style={{fontWeight: 700}}>R$ {item.valor?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            </li>
          ))}
        </ul>
      </footer>
      )}
      <button className="btn-print" onClick={() => window.print()}>Imprimir</button>
    </div>
  );
};

export default CotacaoView;
