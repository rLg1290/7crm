import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Building2, Filter, LayoutDashboard, AlertCircle, FileText, CalendarClock, X, Plane, Users, DollarSign, Plus } from 'lucide-react'

interface Empresa {
  id: string
  nome: string
  codigo_agencia?: string
  logotipo?: string | null
}

// Removido: componente KanbanGlobal (tarefas) substituído pelo componente Kanban (cotações)


interface Cotacao {
  id: string
  titulo: string
  cliente: string
  codigo: string
  status: string
  valor?: number
  data_criacao?: string
  destino?: string
  observacoes?: string
  empresa_id?: string
}

const Kanban = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('') // vazio = todas
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  // Modal de detalhes
  const [showModal, setShowModal] = useState<boolean>(false)
  const [selectedCotacao, setSelectedCotacao] = useState<Cotacao | null>(null)
  const [voos, setVoos] = useState<any[]>([])
  const [passageiros, setPassageiros] = useState<any[]>([])
  const [contasReceber, setContasReceber] = useState<any[]>([])
  const [contasPagar, setContasPagar] = useState<any[]>([])
  const [loadingDetalhes, setLoadingDetalhes] = useState<boolean>(false)

  // Estados: criação de nova cotação
  const [showNovoModal, setShowNovoModal] = useState<boolean>(false)
  const [novoStep, setNovoStep] = useState<number>(0)
  const [novaEmpresaId, setNovaEmpresaId] = useState<string>('')
  const [novoClientes, setNovoClientes] = useState<any[]>([])
  const [novaCotacao, setNovaCotacao] = useState<{ titulo: string; cliente: string; codigo: string; destino?: string; valor?: number; observacoes?: string; status: string }>({ titulo: '', cliente: '', codigo: '', destino: '', valor: undefined, observacoes: '', status: 'LEAD' })
  const [novoVoos, setNovoVoos] = useState<any[]>([])
  const [novoPassageiros, setNovoPassageiros] = useState<{ cliente_id: string; tipo: string }[]>([])
  const [novoReceber, setNovoReceber] = useState<{ descricao: string; valor: number; vencimento: string; status?: 'recebida' | 'pendente' | 'vencida'; observacoes?: string }[]>([])
  const [novoPagar, setNovoPagar] = useState<{ valor: number; vencimento: string; status?: string; observacoes?: string; parcelas?: string; categoria_id?: number; fornecedor_id?: number; forma_pagamento_id?: number }[]>([])
  const [salvandoNova, setSalvandoNova] = useState<boolean>(false)
  const [erroNova, setErroNova] = useState<string>('')

  // Carregar clientes por empresa
  const carregarClientesPorEmpresa = async (empresaId: string) => {
    if (!empresaId) { setNovoClientes([]); return }
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome, sobrenome')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true })
    if (error) {
      console.error('Erro ao carregar clientes:', error)
    }
    setNovoClientes(data || [])
  }

  const abrirNovoModal = () => {
    setShowNovoModal(true)
    setNovoStep(0)
    setNovaEmpresaId('')
    setNovaCotacao({ titulo: '', cliente: '', codigo: '', destino: '', valor: undefined, observacoes: '', status: 'LEAD' })
    setNovoVoos([])
    setNovoPassageiros([])
    setNovoReceber([])
    setNovoPagar([])
    setErroNova('')
  }

  const salvarNovaCotacaoCompleta = async () => {
    try {
      setSalvandoNova(true)
      setErroNova('')
      if (!novaEmpresaId) { setErroNova('Selecione a empresa.'); setSalvandoNova(false); return }
      if (!novaCotacao.titulo || !novaCotacao.cliente) { setErroNova('Informe título e cliente.'); setSalvandoNova(false); return }

      const { data: cot, error: errCot } = await supabase
        .from('cotacoes')
        .insert({
          titulo: novaCotacao.titulo,
          cliente: novaCotacao.cliente,
          codigo: novaCotacao.codigo,
          destino: novaCotacao.destino,
          valor: novaCotacao.valor,
          observacoes: novaCotacao.observacoes,
          empresa_id: novaEmpresaId,
          status: novaCotacao.status,
          data_criacao: new Date().toISOString()
        })
        .select()
        .single()
      if (errCot || !cot) throw errCot || new Error('Falha ao criar cotação')

      if (novoVoos.length > 0) {
        const voosToInsert = novoVoos.map(v => ({ ...v, cotacao_id: cot.id }))
        const { error: errVoos } = await supabase.from('voos').insert(voosToInsert)
        if (errVoos) throw errVoos
      }

      if (novoPassageiros.length > 0) {
        const passageirosToInsert = novoPassageiros.map(p => ({ ...p, cotacao_id: cot.id }))
        const { error: errPass } = await supabase.from('cotacao_passageiros').insert(passageirosToInsert)
        if (errPass) throw errPass
      }

      if (novoReceber.length > 0) {
        const receberToInsert = novoReceber.map(r => ({
          ...r,
          empresa_id: novaEmpresaId,
          cliente_nome: novaCotacao.cliente,
          origem_id: cot.id,
          status: r.status || 'pendente'
        }))
        const { error: errRec } = await supabase.from('contas_receber').insert(receberToInsert)
        if (errRec) throw errRec
      }

      if (novoPagar.length > 0) {
        const pagarToInsert = novoPagar.map(p => ({
          ...p,
          empresa_id: novaEmpresaId,
          origem: 'cotacao',
          origem_id: cot.id,
          status: p.status || 'pendente'
        }))
        const { error: errPag } = await supabase.from('contas_pagar').insert(pagarToInsert)
        if (errPag) throw errPag
      }

      setShowNovoModal(false)
      setSalvandoNova(false)
      setSelectedEmpresaId(novaEmpresaId)
      await carregarCotacoes()
    } catch (e: any) {
      console.error('Erro ao salvar nova cotação completa:', e)
      setErroNova(e?.message || 'Erro ao salvar nova cotação')
      setSalvandoNova(false)
    }
  }

  // Carregar empresas para filtro
  const carregarEmpresas = async () => {
    const { data, error } = await supabase
      .from('empresas')
      .select('id, nome, codigo_agencia, logotipo')
      .order('nome', { ascending: true })
  
    if (error) {
      console.error('Erro ao carregar empresas:', error)
      setError('Erro ao carregar lista de empresas.')
      return
    }
  
    setEmpresas(data || [])
  }

  // Carregar tarefas globais (filtradas por empresa quando selecionada)
  const carregarCotacoes = async () => {
    setLoading(true)
    setError('')

    let query = supabase
      .from('cotacoes')
      .select('id, titulo, cliente, codigo, status, valor, data_criacao, destino, observacoes, empresa_id')
      .order('data_criacao', { ascending: false })

    if (selectedEmpresaId) {
      query = query.eq('empresa_id', selectedEmpresaId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao carregar cotações:', error)
      setError('Erro ao carregar cotações. Verifique suas políticas de acesso (RLS) para admin.')
      setLoading(false)
      return
    }

    setCotacoes(data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarEmpresas()
  }, [])

  useEffect(() => {
    carregarCotacoes()
  }, [selectedEmpresaId])

  // Status fixos e normalização
  const STATUS_ORDER = ['LEAD', 'COTAR', 'AGUARDANDO CLIENTE', 'APROVADO', 'REPROVADO'] as const
  type StatusFixos = typeof STATUS_ORDER[number]

  const normalizarStatus = (s?: string): StatusFixos => {
    if (!s) return 'LEAD'
    const str = s.trim().toUpperCase().replaceAll('_', ' ').replaceAll('-', ' ')
    if (str === 'AGUARDANDO CLIENTE') return 'AGUARDANDO CLIENTE'
    if (str === 'LEAD') return 'LEAD'
    if (str === 'COTAR') return 'COTAR'
    if (
      str === 'APROVADO' ||
      str === 'APROVADA' ||
      str === 'LANÇADO' ||
      str === 'LANCADO' ||
      str === 'EMITIDO' ||
      str === 'EMITIDA'
    ) return 'APROVADO'
    if (str === 'REPROVADO' || str === 'REPROVADA') return 'REPROVADO'
    // fallback: coloca em LEAD
    return 'LEAD'
  }

  // Agrupar cotações em colunas fixas na ordem desejada
  const colunasCotacoes: { [status in StatusFixos]: Cotacao[] } = useMemo(() => {
    const cols: { [status in StatusFixos]: Cotacao[] } = {
      'LEAD': [],
      'COTAR': [],
      'AGUARDANDO CLIENTE': [],
      'APROVADO': [],
      'REPROVADO': []
    }
    for (const c of cotacoes) {
      const s = normalizarStatus(c.status)
      cols[s].push(c)
    }
    return cols
  }, [cotacoes])

  const formatarMoeda = (valor?: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
  }

  // Carregar detalhes da cotação para o modal
  const carregarDetalhesCotacao = async (c: Cotacao) => {
    setLoadingDetalhes(true)
    setVoos([])
    setPassageiros([])
    setContasReceber([])
    setContasPagar([])

    // Voos da cotação
    const { data: voosData } = await supabase
      .from('voos')
      .select('id, direcao, origem, destino, data_ida, data_volta, classe, companhia, numero_voo, horario_partida, horario_chegada, observacoes')
      .eq('cotacao_id', c.id)
      .order('data_ida', { ascending: true })

    setVoos(voosData || [])

    // Passageiros vinculados (buscar nomes na tabela clientes)
    const { data: passVinculos } = await supabase
      .from('cotacao_passageiros')
      .select('cliente_id, tipo')
      .eq('cotacao_id', c.id)

    const clienteIds = (passVinculos || []).map(p => p.cliente_id).filter(Boolean)
    let clientesDetalhes: any[] = []
    if (clienteIds.length > 0) {
      const { data: clientesData } = await supabase
        .from('clientes')
        .select('id, nome, sobrenome, cpf, passaporte, nacionalidade')
        .in('id', clienteIds)
      clientesDetalhes = clientesData || []
    }

    const passageirosComDetalhes = (passVinculos || []).map(p => ({
      ...p,
      cliente: clientesDetalhes.find(cd => cd.id === p.cliente_id) || null
    }))
    setPassageiros(passageirosComDetalhes)

    // Financeiro relacionado via origem_id
    // Contas a Receber (filtradas por empresa quando selecionada)
    let receberQuery = supabase
      .from('contas_receber')
      .select('id, descricao, valor, vencimento, status, observacoes, origem_id')
      .eq('origem_id', c.id)
      .order('vencimento', { ascending: true })

    if (selectedEmpresaId) {
      receberQuery = receberQuery.eq('empresa_id', selectedEmpresaId)
    }
    const { data: receberData } = await receberQuery
    setContasReceber(receberData || [])

    // Contas a Pagar (vinculadas pela origem_id)
    const { data: pagarData } = await supabase
      .from('contas_pagar')
      .select('id, valor, vencimento, status, observacoes, origem_id, fornecedor_id, categoria_id, parcelas, forma_pagamento_id')
      .eq('origem_id', c.id)
      .order('vencimento', { ascending: true })

    setContasPagar(pagarData || [])

    setLoadingDetalhes(false)
  }

  const abrirModal = (c: Cotacao) => {
    setSelectedCotacao(c)
    setShowModal(true)
    carregarDetalhesCotacao(c)
  }

  const fecharModal = () => {
    setShowModal(false)
    setSelectedCotacao(null)
    setVoos([])
    setPassageiros([])
    setContasReceber([])
    setContasPagar([])
  }

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kanban</h1>
          <p className="text-gray-500 mt-1">Visão consolidada de cotações de todas as empresas</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={carregarCotacoes}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Atualizar dados"
          >
            <LayoutDashboard className="h-4 w-4" />
          </button>
          <button
            onClick={abrirNovoModal}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Nova Cotação"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-3 lg:space-y-0">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-700">Filtros</span>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <div className="relative">
                <select
                  value={selectedEmpresaId}
                  onChange={(e) => setSelectedEmpresaId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas</option>
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome} {e.codigo_agencia ? `(${e.codigo_agencia})` : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-2.5 text-gray-400">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Erros */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Kanban de Cotações */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Cotações
          </h3>
          <p className="text-sm text-gray-500">Total: {cotacoes.length}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando cotações...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {STATUS_ORDER.map((status) => (
              <div key={status} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-800">{status}</span>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-700 rounded px-2 py-1">
                    {colunasCotacoes[status].length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colunasCotacoes[status].map((c) => (
                    <div key={c.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md"
                      onClick={() => abrirModal(c)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{c.titulo}</p>
                          {c.cliente && (
                            <p className="text-xs text-gray-600">Cliente: {c.cliente}</p>
                          )}
                          {c.codigo && (
                            <p className="text-xs text-gray-600">Código: {c.codigo}</p>
                          )}
                          {c.destino && (
                            <p className="text-xs text-gray-600">Destino: {c.destino}</p>
                          )}
                        </div>
                        {/* Empresa responsável - topo direita, pequeno */}
                        {(() => {
                          const empresa = empresas.find(e => e.id === c.empresa_id)
                          return (
                            <div className="ml-2 flex-shrink-0 flex items-center space-x-1">
                              {empresa?.logotipo ? (
                                <img
                                  src={empresa.logotipo}
                                  alt={empresa.nome}
                                  className="h-4 w-4 rounded bg-white border border-gray-200 object-contain"
                                />
                              ) : (
                                <Building2 className="h-4 w-4 text-gray-400" />
                              )}
                              <span className="text-[10px] text-gray-500 max-w-[120px] truncate">
                                {empresa?.nome || ''}
                              </span>
                            </div>
                          )
                        })()}
                      </div>
                      <div className="mt-2 flex items-center space-x-2 text-xs text-gray-600">
                        {c.data_criacao && (
                          <div className="flex items-center space-x-1">
                            <CalendarClock className="h-4 w-4 text-gray-500" />
                            <span>
                              {new Date(c.data_criacao).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        )}
                        {typeof c.valor === 'number' && (
                          <span className="ml-auto text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                            {formatarMoeda(c.valor)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalhes da cotação */}
      {showModal && selectedCotacao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{selectedCotacao.titulo} — {selectedCotacao.codigo}</h4>
                <p className="text-sm text-gray-600">Cliente: {selectedCotacao.cliente}</p>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg" onClick={fecharModal}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {loadingDetalhes ? (
                <div className="flex items-center justify-center py-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando detalhes...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Seção Voos */}
                  <div>
                    <div className="flex items-center mb-2">
                      <Plane className="h-5 w-5 text-blue-600 mr-2" />
                      <h5 className="text-sm font-semibold text-gray-900">Voos</h5>
                    </div>
                    {voos.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum voo cadastrado para esta cotação.</p>
                    ) : (
                      <div className="space-y-2">
                        {voos.map(v => (
                          <div key={v.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">{v.companhia} — {v.numero_voo}</p>
                              <span className="text-xs text-gray-500">{v.direcao}</span>
                            </div>
                            <p className="text-xs text-gray-600">{v.origem} → {v.destino}</p>
                            <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-600">
                              <div>Partida: {v.data_ida || ''} {v.horario_partida || ''}</div>
                              <div>Chegada: {v.data_volta || ''} {v.horario_chegada || ''}</div>
                              <div>Classe: {v.classe}</div>
                              {v.observacoes && <div className="col-span-2">Obs: {v.observacoes}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Seção Passageiros */}
                  <div>
                    <div className="flex items-center mb-2">
                      <Users className="h-5 w-5 text-green-600 mr-2" />
                      <h5 className="text-sm font-semibold text-gray-900">Passageiros</h5>
                    </div>
                    {passageiros.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum passageiro vinculado.</p>
                    ) : (
                      <div className="space-y-2">
                        {passageiros.map((p, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            Cliente #{p.cliente_id} — {p.tipo}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Seção Observações */}
                  {selectedCotacao.observacoes && (
                    <div>
                      <div className="flex items-center mb-2">
                        <FileText className="h-5 w-5 text-gray-700 mr-2" />
                        <h5 className="text-sm font-semibold text-gray-900">Observações</h5>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-line">
                        {selectedCotacao.observacoes}
                      </div>
                    </div>
                  )}

                  {/* Seção Financeiro (ligado à emissão) */}
                  <div>
                    <div className="flex items-center mb-2">
                      <DollarSign className="h-5 w-5 text-indigo-600 mr-2" />
                      <h5 className="text-sm font-semibold text-gray-900">Financeiro relacionado</h5>
                    </div>
                    {/* Contas a Receber */}
                    <div className="mb-4">
                      <h6 className="text-xs font-semibold text-gray-700 mb-2">Contas a Receber</h6>
                      {contasReceber.length === 0 ? (
                        <p className="text-sm text-gray-500">Nenhuma conta a receber vinculada por origem_id.</p>
                      ) : (
                        <div className="space-y-2">
                          {contasReceber.map((f: any) => (
                            <div key={f.id} className="border border-gray-200 rounded-lg p-3">
                              <p className="text-sm font-medium text-gray-900">{f.descricao}</p>
                              <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                <div>Valor: {formatarMoeda(Number(f.valor))}</div>
                                <div>Vencimento: {f.vencimento}</div>
                                <div>Status: {f.status}</div>
                                {f.observacoes && <div className="col-span-2">Obs: {f.observacoes}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Contas a Pagar */}
                    <div>
                      <h6 className="text-xs font-semibold text-gray-700 mb-2">Contas a Pagar</h6>
                      {contasPagar.length === 0 ? (
                        <p className="text-sm text-gray-500">Nenhuma conta a pagar vinculada por origem_id.</p>
                      ) : (
                        <div className="space-y-2">
                          {contasPagar.map((f: any) => (
                            <div key={f.id} className="border border-gray-200 rounded-lg p-3">
                              <p className="text-sm font-medium text-gray-900">{f.observacoes || 'Conta a pagar'}</p>
                              <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                <div>Valor: {formatarMoeda(Number(f.valor))}</div>
                                <div>Vencimento: {f.vencimento}</div>
                                <div>Status: {f.status}</div>
                                {f.parcelas && <div>Parcelas: {f.parcelas}</div>}
                                {f.forma_pagamento_id && <div>Forma Pagamento: {f.forma_pagamento_id}</div>}
                                {f.categoria_id && <div>Categoria: {f.categoria_id}</div>}
                                {f.fornecedor_id && <div>Fornecedor: {f.fornecedor_id}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nova Cotação */}
      {showNovoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h4 className="text-lg font-semibold text-gray-900">Nova Cotação</h4>
              <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg" onClick={() => setShowNovoModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Indicador de etapas */}
            <div className="px-5 pt-4">
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-1 rounded ${novoStep === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>1. Empresa & Dados</span>
                <span className={`px-2 py-1 rounded ${novoStep === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>2. Voos</span>
                <span className={`px-2 py-1 rounded ${novoStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>3. Passageiros</span>
                <span className={`px-2 py-1 rounded ${novoStep === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>4. Financeiro</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {erroNova && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">{erroNova}</div>
              )}

              {/* Etapa 0: Empresa & Dados */}
              {novoStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                    <select
                      value={novaEmpresaId}
                      onChange={(e) => { setNovaEmpresaId(e.target.value); carregarClientesPorEmpresa(e.target.value) }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione...</option>
                      {empresas.map((e) => (
                        <option key={e.id} value={e.id}>{e.nome} {e.codigo_agencia ? `(${e.codigo_agencia})` : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                      <input type="text" value={novaCotacao.titulo} onChange={(e) => setNovaCotacao({ ...novaCotacao, titulo: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                      <input type="text" value={novaCotacao.cliente} onChange={(e) => setNovaCotacao({ ...novaCotacao, cliente: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                      <input type="text" value={novaCotacao.codigo} onChange={(e) => setNovaCotacao({ ...novaCotacao, codigo: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                      <input type="text" value={novaCotacao.destino || ''} onChange={(e) => setNovaCotacao({ ...novaCotacao, destino: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                      <input type="number" value={novaCotacao.valor ?? ''} onChange={(e) => setNovaCotacao({ ...novaCotacao, valor: Number(e.target.value) })} className="w-full border border-gray-300 rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={novaCotacao.status}
                        onChange={(e) => setNovaCotacao({ ...novaCotacao, status: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="LEAD">LEAD</option>
                        <option value="COTAR">COTAR</option>
                        <option value="AGUARDANDO_CLIENTE">AGUARDANDO_CLIENTE</option>
                        <option value="APROVADO">APROVADO</option>
                        <option value="REPROVADO">REPROVADO</option>
                        <option value="EMITIDO">EMITIDO</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                    <textarea value={novaCotacao.observacoes || ''} onChange={(e) => setNovaCotacao({ ...novaCotacao, observacoes: e.target.value })} className="w-full border border-gray-300 rounded-md px-3 py-2" rows={3} />
                  </div>
                </div>
              )}

              {/* Etapa 1: Voos (simplificado) */}
              {novoStep === 1 && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">Adicione voos (opcional). Clique em "Adicionar voo" para inserir um registro simples.</div>
                  <button
                    className="px-3 py-2 bg-gray-100 rounded border border-gray-300 text-sm"
                    onClick={() => setNovoVoos([...novoVoos, { direcao: 'IDA', origem: '', destino: '', data_ida: '', data_volta: '', classe: '', companhia: '', numero_voo: '', horario_partida: '', horario_chegada: '' }])}
                  >
                    Adicionar voo
                  </button>
                  {novoVoos.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum voo adicionado.</p>
                  ) : (
                    <div className="space-y-2">
                      {novoVoos.map((v, idx) => (
                        <div key={idx} className="border border-gray-200 rounded p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input className="border rounded px-2 py-1" placeholder="Companhia" value={v.companhia} onChange={(e) => setNovoVoos(novoVoos.map((x, i) => i === idx ? { ...x, companhia: e.target.value } : x))} />
                          <input className="border rounded px-2 py-1" placeholder="Nº voo" value={v.numero_voo} onChange={(e) => setNovoVoos(novoVoos.map((x, i) => i === idx ? { ...x, numero_voo: e.target.value } : x))} />
                          <input className="border rounded px-2 py-1" placeholder="Origem" value={v.origem} onChange={(e) => setNovoVoos(novoVoos.map((x, i) => i === idx ? { ...x, origem: e.target.value } : x))} />
                          <input className="border rounded px-2 py-1" placeholder="Destino" value={v.destino} onChange={(e) => setNovoVoos(novoVoos.map((x, i) => i === idx ? { ...x, destino: e.target.value } : x))} />
                          <input className="border rounded px-2 py-1" placeholder="Data ida" value={v.data_ida} onChange={(e) => setNovoVoos(novoVoos.map((x, i) => i === idx ? { ...x, data_ida: e.target.value } : x))} />
                          <input className="border rounded px-2 py-1" placeholder="Horário partida" value={v.horario_partida} onChange={(e) => setNovoVoos(novoVoos.map((x, i) => i === idx ? { ...x, horario_partida: e.target.value } : x))} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Etapa 2: Passageiros (simplificado) */}
              {novoStep === 2 && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">Adicione passageiros vinculando clientes da empresa selecionada (opcional).</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {novoClientes.length === 0 ? (
                      <p className="text-sm text-gray-500 md:col-span-3">Nenhum cliente carregado para esta empresa.</p>
                    ) : (
                      novoClientes.map((c: any) => (
                        <button key={c.id} className="px-2 py-1 border rounded text-sm hover:bg-gray-50" onClick={() => setNovoPassageiros([...novoPassageiros, { cliente_id: c.id, tipo: 'ADT' }])}>
                          {c.nome} {c.sobrenome}
                        </button>
                      ))
                    )}
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">Passageiros selecionados</h5>
                    {novoPassageiros.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum passageiro adicionado.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {novoPassageiros.map((p, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            Cliente #{p.cliente_id} — {p.tipo}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Etapa 3: Financeiro (simplificado) */}
              {novoStep === 3 && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">Adicione lançamentos financeiros (opcional).</div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-2 bg-gray-100 rounded border border-gray-300 text-sm"
                      onClick={() => setNovoReceber([...novoReceber, { descricao: 'Receita', valor: 0, vencimento: new Date().toISOString().slice(0,10) }])}
                    >
                      + Receber
                    </button>
                    <button
                      className="px-3 py-2 bg-gray-100 rounded border border-gray-300 text-sm"
                      onClick={() => setNovoPagar([...novoPagar, { valor: 0, vencimento: new Date().toISOString().slice(0,10) }])}
                    >
                      + Pagar
                    </button>
                  </div>

                  {novoReceber.length > 0 && (
                    <div>
                      <h6 className="text-xs font-semibold text-gray-700 mb-2">Contas a Receber</h6>
                      <div className="space-y-2">
                        {novoReceber.map((r, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 border rounded p-3">
                            <input className="border rounded px-2 py-1" placeholder="Descrição" value={r.descricao} onChange={(e) => setNovoReceber(novoReceber.map((x, i) => i === idx ? { ...x, descricao: e.target.value } : x))} />
                            <input className="border rounded px-2 py-1" type="number" placeholder="Valor" value={r.valor} onChange={(e) => setNovoReceber(novoReceber.map((x, i) => i === idx ? { ...x, valor: Number(e.target.value) } : x))} />
                            <input className="border rounded px-2 py-1" type="date" placeholder="Vencimento" value={r.vencimento} onChange={(e) => setNovoReceber(novoReceber.map((x, i) => i === idx ? { ...x, vencimento: e.target.value } : x))} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {novoPagar.length > 0 && (
                    <div>
                      <h6 className="text-xs font-semibold text-gray-700 mb-2">Contas a Pagar</h6>
                      <div className="space-y-2">
                        {novoPagar.map((p, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 border rounded p-3">
                            <input className="border rounded px-2 py-1" type="number" placeholder="Valor" value={p.valor} onChange={(e) => setNovoPagar(novoPagar.map((x, i) => i === idx ? { ...x, valor: Number(e.target.value) } : x))} />
                            <input className="border rounded px-2 py-1" type="date" placeholder="Vencimento" value={p.vencimento} onChange={(e) => setNovoPagar(novoPagar.map((x, i) => i === idx ? { ...x, vencimento: e.target.value } : x))} />
                            <input className="border rounded px-2 py-1" placeholder="Observações" value={p.observacoes || ''} onChange={(e) => setNovoPagar(novoPagar.map((x, i) => i === idx ? { ...x, observacoes: e.target.value } : x))} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t flex items-center justify-between">
              <button
                className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                onClick={() => setNovoStep(Math.max(0, novoStep - 1))}
                disabled={novoStep === 0}
              >
                Voltar
              </button>
              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  onClick={() => setNovoStep(Math.min(3, novoStep + 1))}
                  disabled={novoStep === 3}
                >
                  Avançar
                </button>
                <button
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  onClick={salvarNovaCotacaoCompleta}
                  disabled={salvandoNova}
                >
                  {salvandoNova ? 'Salvando...' : 'Salvar Tudo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Kanban