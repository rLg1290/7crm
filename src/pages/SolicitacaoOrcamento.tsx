import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plane, MapPin, Calendar, Users, Luggage, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import logger from '../utils/logger'

// Helper para formatar datas YYYY-MM-DD como DD/MM/YYYY sem converter fuso
function formatarDataBR(dateString: string): string {
  if (!dateString) return '-'
  const onlyDate = dateString.slice(0, 10)
  const [ano, mes, dia] = onlyDate.split('-')
  if (ano && mes && dia) {
    return `${dia}/${mes}/${ano}`
  }
  return dateString
}

interface SolicitacaoData {
  nome: string
  celular: string
  email: string
  origem: string
  destino: string
  dataIda: string
  dataVolta: string
  adultos: number
  criancas: number
  bebes: number
  bagagensQtd: number
  flexibilidade: boolean
  hospedagem: boolean
  transporte: boolean
  passeios: boolean
  seguros: boolean
  observacoes: string
}

interface Empresa {
  id: string
  nome: string
  codigo_agencia: string
  logotipo?: string
  slug?: string
  cor_personalizada?: string
}

const SolicitacaoOrcamento = () => {
  const { nomeEmpresa } = useParams<{ nomeEmpresa: string }>()
  const [formData, setFormData] = useState<SolicitacaoData>({
    nome: '',
    celular: '',
    email: '',
    origem: '',
    destino: '',
    dataIda: '',
    dataVolta: '',
    adultos: 1,
    criancas: 0,
    bebes: 0,
    bagagensQtd: 0,
    flexibilidade: false,
    hospedagem: false,
    transporte: false,
    passeios: false,
    seguros: false,
    observacoes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)

  // Função para gerar cores baseadas na cor personalizada
  const gerarCoresPersonalizadas = (corPrincipal: string) => {
    // Se não há cor personalizada, usar padrão cyan/blue
    if (!corPrincipal) {
      return {
        gradiente: 'from-cyan-50 to-blue-100',
        primaria: 'cyan-600',
        hover: 'cyan-700',
        foco: 'cyan-500',
        texto: 'cyan-900'
      }
    }

    // Extrair valores RGB da cor hex
    const hex = corPrincipal.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)

    return {
      corPrincipal,
      gradienteClaro: `rgba(${r}, ${g}, ${b}, 0.1)`,
      gradienteMedio: `rgba(${r}, ${g}, ${b}, 0.2)`,
      corTexto: `rgba(${r}, ${g}, ${b}, 0.9)`
    }
  }

  // Carregar dados da empresa baseado no parâmetro da URL
  useEffect(() => {
    const carregarEmpresa = async () => {
      if (!nomeEmpresa) {
        setError('Nome da empresa não fornecido na URL')
        setLoading(false)
        return
      }

      try {
        logger.debug('🔍 Buscando empresa:', nomeEmpresa)
        
        // Buscar empresa por slug primeiro, depois por código como fallback
        const { data, error } = await supabase
          .from('empresas')
          .select('id, nome, codigo_agencia, logotipo, slug, cor_personalizada')
          .or(`slug.eq.${nomeEmpresa},codigo_agencia.eq.${nomeEmpresa}`)
          .eq('ativo', true)
          .single()

        if (error) {
          console.error('❌ Erro na consulta Supabase:', error)
          setError(`Erro ao buscar empresa: ${error.message}`)
          setLoading(false)
          return
        }

        if (!data) {
          logger.warn('❌ Empresa não encontrada:', nomeEmpresa)
          setError('Empresa não encontrada ou inativa')
          setLoading(false)
          return
        }

        logger.info('✅ Empresa encontrada:', data.nome)
        setEmpresa(data)
        setLoading(false)
      } catch (err) {
        console.error('❌ Erro ao carregar empresa:', err)
        setError('Erro ao carregar dados da empresa. Tente novamente.')
        setLoading(false)
      }
    }

    carregarEmpresa()
  }, [nomeEmpresa])

  // Obter cores personalizadas da empresa
  const coresPersonalizadas = React.useMemo(
    () => gerarCoresPersonalizadas(empresa?.cor_personalizada || ''),
    [empresa?.cor_personalizada]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    // Log específico para inputs de data, para capturar exatamente o valor vindo do componente
    if (type === 'date') {
      logger.debug('🧪 onChange date', { name, value })
    }
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const ajustarPassageiros = (tipo: 'adultos' | 'criancas' | 'bebes', operacao: 'incrementar' | 'decrementar') => {
    setFormData(prev => {
      const novoValor = operacao === 'incrementar' ? prev[tipo] + 1 : Math.max(0, prev[tipo] - 1)
      
      // Validar limite mínimo de adultos
      if (tipo === 'adultos' && novoValor < 1) {
        return prev
      }
      
      return {
        ...prev,
        [tipo]: novoValor
      }
    })
  }

  const formatarObservacao = (overrides?: { idaRaw?: string; voltaRaw?: string }) => {
    const servicosAdicionais: string[] = []
    if (formData.hospedagem) servicosAdicionais.push('Hospedagem')
    if (formData.transporte) servicosAdicionais.push('Transporte')
    if (formData.passeios) servicosAdicionais.push('Passeios')
    if (formData.seguros) servicosAdicionais.push('Seguros')

    // 1) Se recebemos overrides (via FormData do submit), usar esses valores primeiro
    // 2) Caso contrário, capturar do DOM
    // 3) Por fim, fallback para o estado React
    const idaDom = (document.querySelector('input[name="dataIda"]') as HTMLInputElement)?.value || ''
    const voltaDom = (document.querySelector('input[name="dataVolta"]') as HTMLInputElement)?.value || ''

    const idaRaw = overrides?.idaRaw ?? idaDom ?? formData.dataIda
    const voltaRaw = overrides?.voltaRaw ?? voltaDom ?? formData.dataVolta

    logger.debug('🧪 Debug datas seleção', { idaDom, voltaDom, idaRaw, voltaRaw })

    const idaFormatada = idaRaw ? formatarDataBR(idaRaw) : 'Não informado'
    const voltaFormatada = voltaRaw ? formatarDataBR(voltaRaw) : 'Não informado'

    return `ORIGEM: ${formData.origem}
DESTINO: ${formData.destino}
IDA: ${idaFormatada}
VOLTA: ${voltaFormatada}

ADT: ${formData.adultos}
CHD: ${formData.criancas}
INF: ${formData.bebes}

BAGAGENS DESPACHADAS: ${formData.bagagensQtd}

FLEXIBILIDADE: ${formData.flexibilidade ? 'SIM' : 'NÃO'}

SERVIÇOS ADICIONAIS: ${servicosAdicionais.length > 0 ? servicosAdicionais.join(', ') : 'Nenhum'}

OBSERVAÇÕES DO CLIENTE:
${formData.observacoes || 'Nenhuma observação adicional'}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      logger.debug('📝 Iniciando envio do formulário...')
      
      // Validação básica
      if (!formData.nome || !formData.email || !formData.celular || !formData.origem || !formData.destino) {
        throw new Error('Por favor, preencha todos os campos obrigatórios')
      }

      // Verificar se temos dados da empresa
      if (!empresa) {
        throw new Error('Dados da empresa não carregados. Recarregue a página e tente novamente.')
      }

      // Capturar diretamente os valores submetidos pelo formulário (fonte de verdade)
      const formEl = e.target as HTMLFormElement
      const fd = new FormData(formEl)
      const idaRawForm = (fd.get('dataIda') || '') as string
      const voltaRawForm = (fd.get('dataVolta') || '') as string
      logger.debug('🧪 FormData submit values', { idaRawForm, voltaRawForm })

      // Fluxo para usuário ANÔNIMO: usa RPC SECURITY DEFINER
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      if (!user) {
        logger.debug('👤 Usuário anônimo: enviando via RPC create_cliente_lead_public', { nomeEmpresa })
        const observacaoFormatada = formatarObservacao({ idaRaw: idaRawForm, voltaRaw: voltaRawForm })
        logger.debug('🧪 Observação formatada que será gravada (RPC):', observacaoFormatada)
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_cliente_lead_public', {
          p_empresa_slug: nomeEmpresa,
          p_nome: formData.nome,
          p_email: formData.email,
          p_telefone: formData.celular,
          p_observacao: observacaoFormatada
        })

        if (rpcError) {
          logger.error('❌ Erro ao criar lead via RPC pública', { rpcError })
          throw new Error('Erro ao enviar solicitação: ' + rpcError.message)
        }

        logger.info('✅ Lead criado via RPC com sucesso', { cliente_id: rpcData?.cliente_id, lead_id: rpcData?.lead_id })
        setSubmitted(true)
        return
      }

      logger.debug('🔍 Verificando cliente existente...')
      
      // 1. Primeiro, verificar se o cliente já existe
      let { data: clienteExistente, error: errorClienteExistente } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', formData.email)
        .single()

      if (errorClienteExistente && errorClienteExistente.code !== 'PGRST116') {
        logger.error('❌ Erro ao verificar cliente existente', errorClienteExistente)
        throw new Error('Erro ao verificar dados do cliente')
      }

      let clienteId

      if (clienteExistente) {
        logger.debug('✅ Cliente existente encontrado:', clienteExistente.id)
        clienteId = clienteExistente.id
      } else {
        logger.debug('🆕 Criando novo cliente...')
        
        // Criar novo cliente
        const { data: novoCliente, error: errorCliente } = await supabase
          .from('clientes')
          .insert([{
            nome: formData.nome,
            email: formData.email,
            telefone: formData.celular,
            empresa_id: empresa.id,
            data_nascimento: null,
            cpf: null
          }])
          .select('*')
          .single()

        if (errorCliente) {
          logger.error('❌ Erro ao criar cliente', errorCliente)
          throw new Error('Erro ao cadastrar cliente: ' + errorCliente.message)
        }

        logger.debug('✅ Novo cliente criado:', novoCliente.id)
        clienteId = novoCliente.id
      }

      // 2. Criar o lead com as informações formatadas
      logger.debug('📋 Criando lead...')
      const observacaoFormatada = formatarObservacao({ idaRaw: idaRawForm, voltaRaw: voltaRawForm })
      logger.debug('🧪 Observação formatada que será gravada:', observacaoFormatada)

      const { error: errorLead } = await supabase
        .from('leads')
        .insert([{
          cliente_id: clienteId,
          observacao: observacaoFormatada,
          empresa_id: empresa.id
        }])

      if (errorLead) {
        logger.error('❌ Erro ao criar lead', errorLead)
        throw new Error('Erro ao enviar solicitação: ' + errorLead.message)
      }

      logger.info('✅ Lead criado com sucesso!')
      setSubmitted(true)
    } catch (err: any) {
      logger.error('❌ Erro ao enviar solicitação', err)
      setError(err.message || 'Erro inesperado ao enviar solicitação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Estado de loading enquanto carrega dados da empresa
  if (loading) {
    const estiloFundo = empresa?.cor_personalizada 
      ? { background: `linear-gradient(to bottom right, ${coresPersonalizadas.gradienteClaro}, ${coresPersonalizadas.gradienteMedio})` }
      : {}

    return (
      <div 
        className={`min-h-screen flex items-center justify-center p-4 ${
          !empresa?.cor_personalizada ? 'bg-gradient-to-br from-cyan-50 to-blue-100' : ''
        }`}
        style={estiloFundo}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ 
              borderBottomColor: empresa?.cor_personalizada || '#0891b2' 
            }}
          ></div>
          <p className="text-gray-600">Carregando página de solicitação...</p>
          <p className="text-sm text-gray-500 mt-2">Empresa: {nomeEmpresa}</p>
        </div>
      </div>
    )
  }

  // Estado de erro
  if (error && !empresa) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-pink-100">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao Carregar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>URL: {window.location.href}</p>
            <p>Empresa: {nomeEmpresa}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  // Estado de erro se empresa não foi encontrada
  if (!empresa) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Empresa não encontrada</h2>
          <p className="text-gray-600 mb-6">
            {error || 'A empresa solicitada não foi encontrada ou está inativa.'}
          </p>
          <p className="text-sm text-gray-500">
            Verifique se a URL está correta ou entre em contato com a empresa.
          </p>
        </div>
      </div>
    )
  }

  if (submitted) {
    const estiloFundo = empresa?.cor_personalizada 
      ? { background: `linear-gradient(to bottom right, ${coresPersonalizadas.gradienteClaro}, ${coresPersonalizadas.gradienteMedio})` }
      : {}

    return (
      <div 
        className={`min-h-screen flex items-center justify-center p-4 ${
          !empresa?.cor_personalizada ? 'bg-gradient-to-br from-cyan-50 to-blue-100' : ''
        }`}
        style={estiloFundo}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Solicitação Enviada!</h2>
          <p className="text-gray-600 mb-6">
            Recebemos sua solicitação de orçamento. A equipe da <strong>{empresa?.nome}</strong> entrará em contato em breve!
          </p>
          <button
            onClick={() => {
              setSubmitted(false)
              setFormData({
                nome: '',
                celular: '',
                email: '',
                origem: '',
                destino: '',
                dataIda: '',
                dataVolta: '',
                adultos: 1,
                criancas: 0,
                bebes: 0,
                bagagensQtd: 0,
                flexibilidade: false,
                hospedagem: false,
                transporte: false,
                passeios: false,
                seguros: false,
                observacoes: ''
              })
            }}
            className="text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            style={{
              backgroundColor: empresa?.cor_personalizada || '#0891b2'
            }}
            onMouseEnter={(e) => {
              if (empresa?.cor_personalizada) {
                e.currentTarget.style.backgroundColor = `${empresa.cor_personalizada}dd`
              }
            }}
            onMouseLeave={(e) => {
              if (empresa?.cor_personalizada) {
                e.currentTarget.style.backgroundColor = empresa.cor_personalizada
              }
            }}
          >
            Nova Solicitação
          </button>
        </div>
      </div>
    )
  }

  const estiloFundoPrincipal = empresa?.cor_personalizada 
    ? { background: `linear-gradient(to bottom right, ${coresPersonalizadas.gradienteClaro}, ${coresPersonalizadas.gradienteMedio})` }
    : {}

  return (
    <div 
      className={`min-h-screen ${!empresa?.cor_personalizada ? 'bg-gradient-to-br from-cyan-50 to-blue-100' : ''}`}
      style={estiloFundoPrincipal}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {empresa.logotipo ? (
              <img 
                src={empresa.logotipo} 
                alt={`Logo ${empresa.nome}`}
                className="w-20 h-20 object-contain rounded-full shadow-lg"
              />
            ) : (
              <div 
                className="p-3 rounded-full text-white"
                style={{ backgroundColor: empresa?.cor_personalizada || '#0891b2' }}
              >
                <Plane className="w-8 h-8" />
              </div>
            )}
          </div>
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: empresa?.cor_personalizada || '#0891b2' }}
          >{empresa.nome}</h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Solicitação de Orçamento</h2>
        </div>

        {/* Formulário */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {/* Dados Pessoais */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Seus Dados</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Nome Completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Celular *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <span className="text-gray-500 text-sm">🇧🇷</span>
                      </div>
                      <input
                        type="tel"
                        name="celular"
                        value={formData.celular}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="(11) 96123-4567"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Destinos */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin 
                    className="w-5 h-5 mr-2" 
                    style={{ color: empresa?.cor_personalizada || '#0891b2' }}
                  />
                  Destinos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Origem *</label>
                    <input
                      type="text"
                      name="origem"
                      value={formData.origem}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Rio de Janeiro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destino *</label>
                    <input
                      type="text"
                      name="destino"
                      value={formData.destino}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Informe a cidade de destino"
                    />
                  </div>
                </div>
              </div>

              {/* Datas */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar 
                    className="w-5 h-5 mr-2" 
                    style={{ color: empresa?.cor_personalizada || '#0891b2' }}
                  />
                  Datas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ida *</label>
                    <input
                      type="date"
                      name="dataIda"
                      value={formData.dataIda}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Volta</label>
                    <input
                      type="date"
                      name="dataVolta"
                      value={formData.dataVolta}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="flexibilidade"
                      checked={formData.flexibilidade}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Possuo flexibilidade de datas próximas
                    </span>
                  </label>
                </div>
              </div>

              {/* Passageiros */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users 
                    className="w-5 h-5 mr-2" 
                    style={{ color: empresa?.cor_personalizada || '#0891b2' }}
                  />
                  Passageiros
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adultos</label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => ajustarPassageiros('adultos', 'decrementar')}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-semibold">{formData.adultos}</span>
                      <button
                        type="button"
                        onClick={() => ajustarPassageiros('adultos', 'incrementar')}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Crianças <span className="text-xs text-gray-500">(2-11 anos)</span>
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => ajustarPassageiros('criancas', 'decrementar')}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-semibold">{formData.criancas}</span>
                      <button
                        type="button"
                        onClick={() => ajustarPassageiros('criancas', 'incrementar')}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bebês <span className="text-xs text-gray-500">(0-2 anos)</span>
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => ajustarPassageiros('bebes', 'decrementar')}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-semibold">{formData.bebes}</span>
                      <button
                        type="button"
                        onClick={() => ajustarPassageiros('bebes', 'incrementar')}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Luggage className="w-4 h-4 mr-1" />
                      Bagagem despachada
                    </label>
                    <input
                      type="number"
                      name="bagagensQtd"
                      value={formData.bagagensQtd}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Serviços Adicionais */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Serviços adicionais</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="hospedagem"
                      checked={formData.hospedagem}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Hospedagem</span>
                  </label>
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="transporte"
                      checked={formData.transporte}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Transporte</span>
                  </label>
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="passeios"
                      checked={formData.passeios}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Passeios</span>
                  </label>
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="seguros"
                      checked={formData.seguros}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Seguros</span>
                  </label>
                </div>
              </div>

              {/* Observações */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Observação</h3>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Informe aqui qualquer observação que possa auxiliar a cotação da sua passagem"
                />
              </div>

              <div className="text-center text-sm text-gray-500 mb-6">
                * Informações de preenchimento obrigatório.
              </div>

              {/* Botão Submit */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="disabled:bg-gray-400 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors min-w-48"
                  style={{
                    backgroundColor: isSubmitting ? '#9ca3af' : (empresa?.cor_personalizada || '#2563eb')
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting && empresa?.cor_personalizada) {
                      e.currentTarget.style.backgroundColor = `${empresa.cor_personalizada}dd`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting && empresa?.cor_personalizada) {
                      e.currentTarget.style.backgroundColor = empresa.cor_personalizada
                    }
                  }}
                >
                  {isSubmitting ? 'Enviando...' : 'Solicitar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SolicitacaoOrcamento