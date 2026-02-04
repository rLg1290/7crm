import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Flight } from '../types/flight'
import { Cliente } from '../types/cliente'
import { 
  CreditCard, 
  User, 
  Calendar, 
  Mail, 
  Phone, 
  FileText, 
  Plane, 
  ArrowRight, 
  Check, 
  AlertCircle,
  ShieldCheck,
  Pencil,
  QrCode,
  Barcode,
  Building,
  Layout,
  Search,
  X,
  Loader2,
  UserPlus,
  Clock,
  Info,
  Copy
} from 'lucide-react'
import { getAirlineLogoUrl } from '../utils/airlineLogos'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'
import { gerarPayloadPix } from '../utils/pix'
import ClientModal from '../components/ClientModal'
import TariffRulesModal from '../components/TariffRulesModal'

const gerarCodigoUnico = async () => {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let tentativas = 0;
  const maxTentativas = 10;
  
  while (tentativas < maxTentativas) {
    let codigo = '';
    for (let i = 0; i < 6; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    
    // Verificar se o código já existe no banco
    const { data } = await supabase
      .from('cotacoes')
      .select('id')
      .eq('codigo', codigo)
      .limit(1);
    
    if (data && data.length === 0) {
      // Código não existe, pode usar
      return codigo;
    }
    
    // Código existe (ou erro), tentar novamente
    tentativas++;
  }
  
  // Se chegou aqui, gerar código com timestamp para garantir unicidade
  const timestamp = Date.now().toString().slice(-3);
  const caracteresAleatorios = caracteres.charAt(Math.floor(Math.random() * caracteres.length)) + 
                              caracteres.charAt(Math.floor(Math.random() * caracteres.length)) + 
                              caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  return (caracteresAleatorios + timestamp).toUpperCase();
}

const EmissaoAereo = () => {
  const location = useLocation()
  const navigate = useNavigate()
  
  const normalize = (f: any) => {
     if (!f) return null
     console.log('Normalizing flight:', f)
     
     // Helper to ensure string
     const safeString = (val: any) => val ? String(val) : ''

     if (f.cia && !f.CompanhiaAparente) {
        return {
           ...f,
           CompanhiaAparente: f.cia,
           Embarque: f.partida,
           Desembarque: f.chegada,
           Origem: f.origem,
           Destino: f.destino,
           Duracao: f.duracao,
           NumeroConexoes: f.escala,
           Data: f.partida,
           id: safeString(f.numero || f.uniqueId)
        }
     }
     
     // Ensure ID is string even if already normalized
     if (f.id && typeof f.id !== 'string') {
        return { ...f, id: String(f.id) }
     }

     return f
  }

  const rawIda = location.state?.ida
  const rawVolta = location.state?.volta
  const searchParams = location.state?.searchParams
  
  console.log('Raw State:', location.state)

  const ida = normalize(rawIda)
  const volta = normalize(rawVolta)

  // Determine Total Passengers
  const totalPax = searchParams ? (searchParams.adultos + searchParams.criancas + searchParams.bebes) : 1

  const [passenger, setPassenger] = useState({
    nome: '',
    sobrenome: '',
    nascimento: '',
    cpf: '',
    sexo: '',
    email: '',
    telefone: ''
  })

  const [payment, setPayment] = useState({
    numero: '',
    nome: '',
    validade: '',
    cvv: '',
    parcelas: '1',
    email: '',
    telefone: ''
  })

  const [loading, setLoading] = useState(false)
  
  // Payment Configuration State
  const [paymentConfig, setPaymentConfig] = useState({
    pix: false,
    cartao: true,
    boleto: false,
    faturado: false
  })
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cartao' | 'pix' | 'boleto' | 'faturado'>('cartao')
  const [taxas7c, setTaxas7c] = useState<any[]>([])
  
  // Faturado details
  const [faturadoDetails, setFaturadoDetails] = useState({
    centroCusto: '',
    observacao: ''
  })

  // Kanban Integration State
  const [kanbanMode, setKanbanMode] = useState<'create' | 'select'>('create')
  const [existingCotacoes, setExistingCotacoes] = useState<any[]>([])
  const [isLoadingCotacoes, setIsLoadingCotacoes] = useState(false)
  const [selectedCotacaoId, setSelectedCotacaoId] = useState<number | null>(null)
  const [newQuoteTitle, setNewQuoteTitle] = useState('')
  
  // Client Search State
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [foundClients, setFoundClients] = useState<Cliente[]>([])
  const [showClientSuggestions, setShowClientSuggestions] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null)
  const [isSearchingClients, setIsSearchingClients] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Passenger Search State
  const [passengerSearchTerms, setPassengerSearchTerms] = useState<string[]>(Array(totalPax).fill(''))
  const [foundPassengers, setFoundPassengers] = useState<Cliente[]>([])
  const [showPassengerSuggestions, setShowPassengerSuggestions] = useState<number | null>(null) // Stores index of open dropdown
  const [selectedPassengers, setSelectedPassengers] = useState<(Cliente | null)[]>(Array(totalPax).fill(null))
  const [isSearchingPassengers, setIsSearchingPassengers] = useState(false)
  const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false)
  const [passengerToEdit, setPassengerToEdit] = useState<Cliente | null>(null)
  const [activePassengerIndex, setActivePassengerIndex] = useState<number>(0)

  // Tariff Rules State
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [selectedRuleCia, setSelectedRuleCia] = useState('')
  const [selectedRuleTariff, setSelectedRuleTariff] = useState('')

  const [showPixModal, setShowPixModal] = useState(false)
  const [pixCode, setPixCode] = useState('')
  const [showPixDecisionModal, setShowPixDecisionModal] = useState(false)
  const [pixValorDisplay, setPixValorDisplay] = useState(0)
  const currentCodigoRef = React.useRef('')
  const currentCotacaoIdRef = React.useRef<number | null>(null)

  // Sync state with totalPax if it changes
  useEffect(() => {
    setSelectedPassengers(prev => {
        if (prev.length === totalPax) return prev
        return Array(totalPax).fill(null)
    })
    setPassengerSearchTerms(prev => {
        if (prev.length === totalPax) return prev
        return Array(totalPax).fill('')
    })
  }, [totalPax])

  // Fetch User and existing quotations
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        if (user.user_metadata?.empresa_id) {
             const { data } = await supabase
            .from('cotacoes')
            .select('id, titulo, cliente, status, valor')
            .eq('empresa_id', user.user_metadata.empresa_id)
            .not('status', 'in', '("WON","LOST")')
            .order('created_at', { ascending: false })
            .limit(20)
            
            if (data) setExistingCotacoes(data)
        }
      }
    }
    init()
  }, [])

  // Search clients
  useEffect(() => {
    const searchClients = async () => {
      if (!clientSearchTerm || selectedClient?.nome === clientSearchTerm) {
        setFoundClients([])
        return
      }

      setIsSearchingClients(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.user_metadata?.empresa_id) return

        const { data } = await supabase
          .from('clientes')
          .select('*')
          .eq('empresa_id', user.user_metadata.empresa_id)
          .ilike('nome', `%${clientSearchTerm}%`)
          .limit(5)
        
        if (data) setFoundClients(data)
      } catch (error) {
        console.error('Erro ao buscar clientes:', error)
      } finally {
        setIsSearchingClients(false)
      }
    }

    const timeoutId = setTimeout(searchClients, 300)
    return () => clearTimeout(timeoutId)
  }, [clientSearchTerm, selectedClient])

  // Search passengers
  useEffect(() => {
    const term = passengerSearchTerms[activePassengerIndex]
    const selected = selectedPassengers[activePassengerIndex]

    const searchPassengers = async () => {
      if (!term || selected?.nome === term) {
        setFoundPassengers([])
        return
      }

      setIsSearchingPassengers(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.user_metadata?.empresa_id) return

        const { data } = await supabase
          .from('clientes')
          .select('*')
          .eq('empresa_id', user.user_metadata.empresa_id)
          .ilike('nome', `%${term}%`)
          .limit(5)
        
        if (data) setFoundPassengers(data)
      } catch (error) {
        console.error('Erro ao buscar passageiros:', error)
      } finally {
        setIsSearchingPassengers(false)
      }
    }

    const timeoutId = setTimeout(searchPassengers, 300)
    return () => clearTimeout(timeoutId)
  }, [passengerSearchTerms, selectedPassengers, activePassengerIndex])
  
  // Auto-fill title
  useEffect(() => {
    if (ida && kanbanMode === 'create' && !newQuoteTitle) {
        setNewQuoteTitle(`Aéreo: ${ida.Origem} -> ${ida.Destino}`)
    }
  }, [ida, kanbanMode])

  useEffect(() => {
    const fetchPaymentConfig = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // First get the user's company ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('empresa_id')
          .eq('id', user.id)
          .single()
        
        if (profile?.empresa_id) {
          // Then get the company's payment settings
          const { data: empresa } = await supabase
            .from('empresas')
            .select('pagamento_pix, pagamento_cartao, pagamento_boleto, pagamento_faturado')
            .eq('id', profile.empresa_id)
            .single()
            
          if (empresa) {
            setPaymentConfig({
              pix: empresa.pagamento_pix ?? false,
              cartao: empresa.pagamento_cartao ?? true,
              boleto: empresa.pagamento_boleto ?? false,
              faturado: empresa.pagamento_faturado ?? false
            })
            
            // Set default selected method based on availability
            if (empresa.pagamento_cartao) setSelectedPaymentMethod('cartao')
            else if (empresa.pagamento_pix) setSelectedPaymentMethod('pix')
            else if (empresa.pagamento_boleto) setSelectedPaymentMethod('boleto')
            else if (empresa.pagamento_faturado) setSelectedPaymentMethod('faturado')
          }
        }
      }

      // Fetch payment rates
      const { data: taxas } = await supabase
        .from('taxas_pagamento_7c')
        .select('*')
        .eq('ativo', true)
      
      if (taxas) {
        setTaxas7c(taxas)
      }
    }
    
    fetchPaymentConfig()
  }, [])

  const calcular7c = (valorTotal: number, parcelasStr: string) => {
    const n = parseInt(parcelasStr || '1') || 1
    const t = taxas7c.find(x => String(x.modo).toLowerCase() === 'credito' && Number(x.parcelas) === n) || taxas7c.find(x => String(x.modo).toLowerCase() === 'credito')
    
    const taxaPerc = Number(t?.taxa_percentual || 0) / 100
    const taxaFixa = Number(t?.taxa_fixa || 0)
    
    const totalComTaxa = Math.ceil(((valorTotal * (1 + taxaPerc)) + taxaFixa) * 100) / 100
    const porParcela = Math.ceil((totalComTaxa / (n || 1)) * 100) / 100
    
    return { totalComTaxa, porParcela }
  }

  if (!ida) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Nenhum voo selecionado</h2>
        <p className="text-gray-600 mb-6">Por favor, realize uma nova busca e selecione seus voos.</p>
        <button 
          onClick={() => navigate('/aereodomestico')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Voltar para Busca
        </button>
      </div>
    )
  }

  // Cálculos de preço (simplificado para 1 adulto baseando-se no objeto Flight)
  const getFlightPrice = (flight: any) => {
    if (flight.breakdown) {
      return {
        fare: flight.breakdown.totalTarifa,
        tax: flight.breakdown.totalTaxa,
        du: flight.breakdown.du || 0,
        total: flight.total
      }
    }
    // Tenta pegar o valor numérico, assumindo que AdultoR ou similar tenha o valor
    // Ajuste conforme sua lógica real de preços
    const fare = Number(flight.AdultoR) || 0
    const tax = Number(flight.TaxaEmbarque) || 0
    return { fare, tax, du: 0, total: fare + tax }
  }

  const priceIda = getFlightPrice(ida)
  const priceVolta = volta ? getFlightPrice(volta) : { fare: 0, tax: 0, du: 0, total: 0 }
  
  // State for DU (Service Fee) - Initialized with sum of DUs from flights
  const [duValue, setDuValue] = useState(priceIda.du + priceVolta.du)
  const [isEditingDu, setIsEditingDu] = useState(false)
  const [tempDuValue, setTempDuValue] = useState('')

  // Update total price to include the current DU state instead of fixed flight DU
  const totalPrice = priceIda.fare + priceVolta.fare + priceIda.tax + priceVolta.tax + duValue

  const handleDuEditClick = () => {
    setTempDuValue(duValue.toString())
    setIsEditingDu(true)
  }

  const handleDuSave = () => {
    const newVal = parseFloat(tempDuValue.replace(',', '.'))
    if (!isNaN(newVal) && newVal >= 0) {
      setDuValue(newVal)
    }
    setIsEditingDu(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, section?: 'passenger' | 'payment') => {
    let { name, value } = e.target

    if (name === 'telefone') {
      const numbers = value.replace(/\D/g, '')
      const truncated = numbers.substring(0, 11)
      
      if (truncated.length <= 10) {
        value = truncated.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3')
      } else {
        value = truncated.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3')
      }
    }

    if (section === 'passenger') {
      setPassenger(prev => ({ ...prev, [name]: value }))
    } else {
      setPayment(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
        let cotacaoId = selectedCotacaoId

        // Prepare payment details with requested info
        const { totalComTaxa } = calcular7c(totalPrice, payment.parcelas)
        const valorComJuros = selectedPaymentMethod === 'cartao' ? totalComTaxa : totalPrice
        
        const paymentDetails = {
            ...(selectedPaymentMethod === 'faturado' ? faturadoDetails : {}),
            ...(selectedPaymentMethod === 'cartao' ? payment : {}),
            taxa_du: duValue,
            valor_sem_juros: totalPrice,
            valor_com_juros: valorComJuros,
            tipo_pagamento: selectedPaymentMethod
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.user_metadata?.empresa_id) throw new Error('Empresa não identificada')

        // --- GERAÇÃO AUTOMÁTICA DE CONTAS (FINANCEIRO) ---
        // Movido para ANTES da criação/atualização da cotação para garantir execução
        // Mas precisamos do cotacaoId e codigo... 
        
        // Vamos refatorar para garantir que o usuário está autenticado e temos os dados necessários
        // O código anterior já obtinha o usuário dentro do bloco 'create', mas precisamos dele fora também
        // A chamada acima já garante isso.

        let currentCodigo = ''

        // Create new quotation if needed
        if (kanbanMode === 'create') {
            const clientName = selectedClient ? selectedClient.nome : clientSearchTerm
            
            if (!newQuoteTitle || !clientName) {
                alert('Para emitir, é necessário vincular ao Kanban. Preencha o Título e o Cliente.')
                setLoading(false)
                return
            }

            // const { data: { user } } = await supabase.auth.getUser() // REMOVIDO POIS JÁ OBTEMOS ACIMA
            // if (!user?.user_metadata?.empresa_id) throw new Error('Empresa não identificada') // JÁ VERIFICADO ACIMA

            const codigo = await gerarCodigoUnico()
            currentCodigo = codigo
            
            const { data: newCotacao, error: createError } = await supabase
              .from('cotacoes')
              .insert({
                titulo: newQuoteTitle,
                cliente: clientName,
                cliente_id: selectedClient?.id || null,
                status: 'OP_GERADA',
                codigo: codigo,
                empresa_id: user.user_metadata.empresa_id,
                usuario_id: user.id,
                destino: ida.Destino,
                data_viagem: ida.Data ? new Date(ida.Data) : null,
                valor: valorComJuros, // Saving the final value with interest if applicable
                forma_pagamento: selectedPaymentMethod,
                detalhes_pagamento: paymentDetails,
                parcelamento: selectedPaymentMethod === 'cartao' ? parseInt(payment.parcelas) : 1
              })
              .select()
              .single()

            if (createError) throw createError
            cotacaoId = newCotacao.id
            currentCotacaoIdRef.current = cotacaoId; // Save to ref
        } else if (kanbanMode === 'select' && selectedCotacaoId) {
            // Se for cotação existente, buscar o código dela
            const { data: cotacaoExistente } = await supabase
              .from('cotacoes')
              .select('codigo')
              .eq('id', selectedCotacaoId)
              .single()
            
            if (cotacaoExistente) {
              currentCodigo = cotacaoExistente.codigo
            }
            cotacaoId = selectedCotacaoId;
            currentCotacaoIdRef.current = cotacaoId; // Save to ref
        }

        if (!cotacaoId) {
             if (kanbanMode === 'select') {
                 alert('Selecione uma cotação existente para vincular.')
                 setLoading(false)
                 return
             }
        }

        // Save Flights with Full Data
        const flightsToSave = [ida, volta].filter(Boolean).map(flight => {
            // Helper to get time safely
            const getTimeSafe = (dateStr: any) => {
                if (!dateStr) return '00:00:00'
                if (dateStr.includes('T')) return dateStr.split('T')[1].substring(0, 8)
                if (dateStr.includes(' ')) return dateStr.split(' ')[1] + ':00'
                return '00:00:00'
            }

            // Helper to get date safely
            const getDateSafe = (dateStr: any) => {
                if (!dateStr) return new Date().toISOString().split('T')[0]
                if (dateStr.includes('T')) return dateStr.split('T')[0]
                if (dateStr.includes('/')) {
                    const [d, m, y] = dateStr.split(' ')[0].split('/')
                    return `${y}-${m}-${d}`
                }
                return new Date(dateStr).toISOString().split('T')[0]
            }

            return {
                cotacao_id: cotacaoId,
                direcao: flight === ida ? 'IDA' : 'VOLTA',
                origem: flight.Origem,
                destino: flight.Destino,
                data_ida: getDateSafe(flight.Data || flight.Embarque),
                horario_partida: getTimeSafe(flight.Embarque),
                horario_chegada: getTimeSafe(flight.Desembarque),
                companhia: flight.CompanhiaAparente,
                numero_voo: flight.id || 'N/A', // Using ID as flight number if unavailable
                duracao: flight.Duracao,
                classe: flight.Tarifa || 'Econômica',
                bagagem_despachada: flight.BagagemDespachada ? 1 : 0,
                preco_opcao: getFlightPrice(flight).total,
                dados_voo: flight.dados_voo || flight // Saving full JSON object from API (prioritizing original if available)
            }
        })

        // Check if all passengers are selected
        if (selectedPassengers.some(p => !p)) {
            alert(`Por favor, selecione os dados para todos os ${totalPax} passageiros.`)
            setLoading(false)
            return
        }

        const { error: flightsError } = await supabase
            .from('voos')
            .insert(flightsToSave)

        if (flightsError) throw flightsError

        // Save Passengers
        const passengersSnapshot = [];
        for (const passenger of selectedPassengers) {
            if (passenger) {
                // Add to snapshot array
                passengersSnapshot.push({
                    id: passenger.id,
                    nome: passenger.nome,
                    cpf: passenger.cpf,
                    data_nascimento: passenger.data_nascimento,
                    email: passenger.email,
                    telefone: passenger.telefone
                });

                const { error: passError } = await supabase
                    .from('cotacao_passageiros')
                    .insert({
                        cotacao_id: cotacaoId,
                        cliente_id: passenger.id,
                        tipo: 'adulto',
                        // Snapshot fields
                        nome: passenger.nome,
                        cpf: passenger.cpf,
                        data_nascimento: passenger.data_nascimento,
                        email: passenger.email
                    })

                if (passError) console.error('Erro ao vincular passageiro:', passError)
            }
        }

        // Update Quotation with Passenger Snapshot (for Admin viewing)
        // Also update status if selecting existing
        const updateData: any = {
            dados_passageiros: passengersSnapshot // Save the snapshot!
        };

        if (kanbanMode === 'select' && cotacaoId) {
            updateData.status = 'OP_GERADA';
            updateData.valor = valorComJuros;
            updateData.forma_pagamento = selectedPaymentMethod;
            updateData.detalhes_pagamento = paymentDetails;
            updateData.parcelamento = selectedPaymentMethod === 'cartao' ? parseInt(payment.parcelas) : 1;
        } else if (kanbanMode === 'create') {
             // If created new, we also want to update the snapshot
             // (Although we could have inserted it initially, updating is safer to not break the insert logic above)
        }

        // Apply update
        await supabase
            .from('cotacoes')
            .update(updateData)
            .eq('id', cotacaoId);

        // --- GERAÇÃO AUTOMÁTICA DE CONTAS (FINANCEIRO) ---
        // Só gera contas se cotacaoId existir
        // SE FOR PIX, NÃO GERA AGORA! ESPERA A DECISÃO DO USUÁRIO NO MODAL.
        // SE FOR CARTÃO OU OUTROS, GERA AGORA.
        console.log('🔍 [EMISSAO] Verificando condições para gerar financeiro...', { 
            cotacaoId, 
            method: selectedPaymentMethod 
        });

        if (cotacaoId && (selectedPaymentMethod as string) !== 'pix') {
          console.log('🔍 [EMISSAO] Condições aceitas. Iniciando bloco financeiro.');
          try {
            // 1. Buscar ou criar Categorias Financeiras
          // Venda de Passagem (Receita/Venda)
          let catVendaId = 1; // ID FIXO SOLICITADO
          /*
          const { data: catVenda } = await supabase
              .from('categorias')
              .select('id')
              .eq('empresa_id', user.user_metadata.empresa_id)
              .eq('nome', 'Venda de Passagem')
              .eq('tipo', 'VENDA')
              .maybeSingle();
          
          if (catVenda) {
              catVendaId = catVenda.id;
          } else {
              // ...
          }
          */

            // Tarifa NET (Despesa/Custo)
            let catCustoId = 5; // ID FIXO SOLICITADO

            // 1. Conta Pagar (Agência -> Consolidadora)
            // Valor = Tarifa + Taxas (Custo real da emissão)
            // Valor a pagar é o TOTAL da emissão MENOS o DU (Lucro), ou seja, o custo real.
            const valorPagarConsolidadora = priceIda.fare + priceIda.tax + priceVolta.fare + priceVolta.tax;

            // Fornecedor FIXO: 3 (7C)
            let fornecedorId = 3; 

            // Forma de Pagamento ID
            // 1 - Pix
            // 8 - Cartão de Crédito
            let formaPagamentoId = null;
            if ((selectedPaymentMethod as string) === 'pix') formaPagamentoId = 1;
            else if ((selectedPaymentMethod as string) === 'cartao') formaPagamentoId = 8;
            else if ((selectedPaymentMethod as string) === 'boleto') formaPagamentoId = 1; 

            const { error: contaPagarError } = await supabase
                 .from('contas_pagar')
                 .insert({
                     empresa_id: user.user_metadata.empresa_id,
                     user_id: user.id,
                     fornecedor_id: fornecedorId,
                     categoria_id: catCustoId,
                     descricao: `Emissão Aérea - ${newQuoteTitle || currentCodigo || 'Sem Título'}`,
                     valor: valorPagarConsolidadora,
                     vencimento: new Date().toISOString().split('T')[0], // Vence hoje (pré-pago/imediato)
                     status: 'pendente',
                     origem: 'COTACAO',
                     origem_id: String(cotacaoId), // Ensure string
                     forma_pagamento_id: formaPagamentoId, 
                     parcelas: selectedPaymentMethod === 'cartao' ? parseInt(payment.parcelas) : 1
                 });

             if (contaPagarError) console.error('Erro ao gerar conta a pagar:', contaPagarError);

             // 3. Contas a Receber
             // LANÇAMENTO 1: Reembolso/Custo da Passagem (Valor = Tarifa NET)
             const nomeCliente = selectedClient ? selectedClient.nome : clientSearchTerm;

             console.log('🔍 [EMISSAO] Iniciando criação de Contas a Receber', { 
                selectedClient, 
                nomeCliente, 
                catVendaId, 
                valorPagarConsolidadora 
             });

             if (selectedClient || nomeCliente) {
               
               // Valor Tarifa NET (Igual a conta a pagar)
               const valorReceberNet = valorPagarConsolidadora;

               const dadosReceberNet = {
                       empresa_id: user.user_metadata.empresa_id,
                       user_id: user.id,
                       cliente_id: selectedClient?.id ? selectedClient.id : null, // Fix type mismatch: ensure null if undefined/0
                       nome_cliente: nomeCliente,
                       categoria_id: catVendaId, // ID 1 - Venda de Passagem
                       descricao: `Venda Aérea (Tarifa) - ${newQuoteTitle || currentCodigo || 'Sem Título'}`,
                       valor: valorReceberNet,
                       vencimento: new Date().toISOString().split('T')[0], // Imediato
                       status: 'pendente',
                       origem: 'COTACAO',
                       origem_id: String(cotacaoId),
                       forma_recebimento_id: formaPagamentoId // Pix (1) ou Cartão (8)
                   };

               console.log('🔍 [EMISSAO] Dados Conta Receber (NET):', dadosReceberNet);

               const { data: dataReceberNet, error: contaReceberNetError } = await supabase
                   .from('contas_receber')
                   .insert(dadosReceberNet)
                   .select(); // Adicionado select para confirmar inserção

               if (contaReceberNetError) {
                   console.error('❌ [EMISSAO] Erro ao gerar conta receber (NET):', contaReceberNetError);
               } else {
                   console.log('✅ [EMISSAO] Conta Receber (NET) criada:', dataReceberNet);
               }

               // LANÇAMENTO 2: Comissão (Valor = DU)
               // Se houver DU (Lucro) > 0
               if (duValue > 0) {
                   // Calcular Vencimento
                   const dataAtual = new Date();
                   let dataVencimentoComissao = new Date();

                   if ((selectedPaymentMethod as string) === 'pix') {
                       // Próximo dia útil
                       dataVencimentoComissao.setDate(dataAtual.getDate() + 1);
                       // Se cair Sábado (6), soma +2 -> Segunda
                       // Se cair Domingo (0), soma +1 -> Segunda
                       if (dataVencimentoComissao.getDay() === 6) {
                           dataVencimentoComissao.setDate(dataVencimentoComissao.getDate() + 2);
                       } else if (dataVencimentoComissao.getDay() === 0) {
                           dataVencimentoComissao.setDate(dataVencimentoComissao.getDate() + 1);
                       }
                   } else if (selectedPaymentMethod === 'cartao') {
                       // 7 dias corridos
                       dataVencimentoComissao.setDate(dataAtual.getDate() + 7);
                   } else {
                       // Default (imediato ou mesma regra do pix)
                       dataVencimentoComissao.setDate(dataAtual.getDate() + 1);
                   }

                   const dadosComissao = {
                           empresa_id: user.user_metadata.empresa_id,
                           user_id: user.id,
                           cliente_id: null, // GARANTE NULL EXPLÍCITO
                           categoria_id: 9, // ID 9 - Comissão de Vendas
                           fornecedor_id: 3, // Fornecedor 7C (Pagador da comissão)
                           descricao: `Comissão Aérea (DU) - ${newQuoteTitle || currentCodigo || 'Sem Título'}`,
                           valor: duValue,
                           vencimento: dataVencimentoComissao.toISOString().split('T')[0],
                           status: 'pendente',
                           origem: 'COTACAO',
                           origem_id: String(cotacaoId),
                           forma_recebimento_id: 1 // Sempre Pix (1)
                       };

                   console.log('🔍 [EMISSAO] Dados Conta Comissão:', dadosComissao);

                   const { data: dataComissao, error: contaComissaoError } = await supabase
                       .from('contas_receber')
                       .insert(dadosComissao)
                       .select();

                   if (contaComissaoError) {
                       console.error('❌ [EMISSAO] Erro ao gerar conta comissão:', contaComissaoError);
                   } else {
                       console.log('✅ [EMISSAO] Conta Comissão criada:', dataComissao);
                   }
               }
             } else {
                 console.warn('⚠️ [EMISSAO] Cliente não identificado. Contas a receber NÃO foram geradas.');
             }
          } catch (finError) {
            console.error('Erro no processamento financeiro:', finError);
          }
        }
        // -----------------------------------------------------

        // Tratamento especial para PIX
        if ((selectedPaymentMethod as string) === 'pix') {
           currentCodigoRef.current = currentCodigo || 'EMISSAO';
           
           // Abre modal de decisão
           setShowPixDecisionModal(true);
           setLoading(false);
           return;
        }

        alert('OP Gerada! Confira no Kanban')
        navigate('/cotacoes')

    } catch (error: any) {
        console.error('Erro na emissão:', error)
        alert('Erro ao processar emissão: ' + error.message)
    } finally {
        setLoading(false)
    }
  }

  // --- Funções Auxiliares para o Fluxo PIX ---

  const processarPixTotal = async () => {
      // Gera QR Code do TOTAL
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.user_metadata?.empresa_id) return;

      const valorPix = totalPrice; 
      
      const pixPayload = gerarPayloadPix({
         chave: '54581543000179', 
         nome: '7C TURISMO E CONSULTORIA',
         cidade: 'BRASILIA',
         txid: currentCodigoRef.current || 'EMISSAO', 
         valor: valorPix
      });
       
      setPixCode(pixPayload);
      setPixValorDisplay(valorPix);
      setShowPixDecisionModal(false);
      setShowPixModal(true);

      // --- GERAR FINANCEIRO PARA PIX TOTAL ---
      // Lógica Solicitada:
      // 1. Conta Pagar (Total com DU) -> Para 7C
      // 2. Conta Receber 1 (Net) -> Do Cliente
      // 3. Conta Receber 2 (DU) -> Da 7C (Comissão)
      
      try {
            // Valor Total
            const valorTotal = totalPrice; 
            
            // Valores individuais
            const valorCustoNet = priceIda.fare + priceIda.tax + priceVolta.fare + priceVolta.tax;
            // Ou calcular Net = Total - DU (mais seguro para bater centavos)
            const valorNetCalculado = valorTotal - duValue;
            
            // IDs
            let catVendaId = 1;
            let catCustoId = 5;
            let fornecedorId = 3; // 7C
            let formaPagamentoId = 1; // Pix

            // 1. Conta Pagar (Custo Net) -> Para Fornecedor 7C
            console.log('🔍 [PIX TOTAL] Criando conta a pagar (Custo Net)...');

            const { error: errorPagar } = await supabase.from('contas_pagar').insert({
                 empresa_id: user.user_metadata.empresa_id,
                 user_id: user.id,
                 fornecedor_id: fornecedorId,
                 categoria_id: catCustoId,
                 descricao: `Emissão Aérea (Custo Net) - ${newQuoteTitle || currentCodigoRef.current}`,
                 valor: valorNetCalculado, // Paga apenas o NET
                 vencimento: new Date().toISOString().split('T')[0],
                 status: 'pendente',
                 origem: 'COTACAO',
                 origem_id: currentCotacaoIdRef.current ? String(currentCotacaoIdRef.current) : null,
                 forma_pagamento_id: formaPagamentoId, 
                 parcelas: 1
            });

            if (errorPagar) {
                console.error('❌ [PIX TOTAL] Erro ao criar conta pagar:', errorPagar);
                alert('Erro ao gerar conta a pagar: ' + errorPagar.message);
            }

            // 2. Conta Receber 1 (NET) -> Do Cliente
             const { error: errorReceberCliente } = await supabase.from('contas_receber').insert({
                   empresa_id: user.user_metadata.empresa_id,
                   user_id: user.id,
                   cliente_id: selectedClient?.id || null,
                   nome_cliente: selectedClient?.nome || clientSearchTerm,
                   categoria_id: catVendaId,
                   descricao: `Venda Aérea (Net) - ${newQuoteTitle || currentCodigoRef.current}`,
                   valor: valorNetCalculado, // Recebe o NET
                   vencimento: new Date().toISOString().split('T')[0],
                   status: 'pendente',
                   origem: 'COTACAO',
                   origem_id: currentCotacaoIdRef.current ? String(currentCotacaoIdRef.current) : null,
                   forma_recebimento_id: formaPagamentoId
             });

             if (errorReceberCliente) {
                 console.error('❌ [PIX TOTAL] Erro ao criar conta receber (Cliente):', errorReceberCliente);
                 alert('Erro ao gerar conta a receber (Cliente): ' + errorReceberCliente.message);
             }

             // 3. Conta Receber 2 (DU) -> Da 7C
             // Calcular vencimento (Pix = 1 dia útil)
             const dataAtual = new Date();
             let dataVencimentoComissao = new Date();
             dataVencimentoComissao.setDate(dataAtual.getDate() + 1);
             // Ajuste fim de semana
             if (dataVencimentoComissao.getDay() === 6) { // Sábado -> Segunda
                 dataVencimentoComissao.setDate(dataVencimentoComissao.getDate() + 2);
             } else if (dataVencimentoComissao.getDay() === 0) { // Domingo -> Segunda
                 dataVencimentoComissao.setDate(dataVencimentoComissao.getDate() + 1);
             }

             if (duValue > 0) {
                 const { error: errorReceberComissao } = await supabase.from('contas_receber').insert({
                       empresa_id: user.user_metadata.empresa_id,
                       user_id: user.id,
                       cliente_id: null, // Devedor não é o cliente
                       fornecedor_id: 3, // Devedor é a 7C
                       nome_cliente: '7C TURISMO (COMISSÃO)',
                       categoria_id: 9, // Comissão
                       descricao: `Comissão Aérea (DU) - ${newQuoteTitle || currentCodigoRef.current}`,
                       valor: duValue,
                       vencimento: dataVencimentoComissao.toISOString().split('T')[0],
                       status: 'pendente',
                       origem: 'COTACAO',
                       origem_id: currentCotacaoIdRef.current ? String(currentCotacaoIdRef.current) : null,
                       forma_recebimento_id: 1 // Pix
                 });

                 if (errorReceberComissao) {
                     console.error('❌ [PIX TOTAL] Erro ao criar conta receber (Comissão):', errorReceberComissao);
                 }
             }

      } catch (e) { console.error(e) }
  }

  const processarPixNet = async () => {
       // Gera QR Code apenas da Tarifa NET
       // Cliente paga DU por fora.
       
       const { data: { user } } = await supabase.auth.getUser();
       if (!user?.user_metadata?.empresa_id) return;

       const valorPix = totalPrice - duValue;
       
       const pixPayload = gerarPayloadPix({
          chave: '54581543000179', 
          nome: '7C TURISMO E CONSULTORIA',
          cidade: 'BRASILIA',
          txid: currentCodigoRef.current || 'EMISSAO',
          valor: valorPix
       });
        
       setPixCode(pixPayload);
       setPixValorDisplay(valorPix);
       setShowPixDecisionModal(false);
       setShowPixModal(true);
       
       // --- GERAR FINANCEIRO PARA PIX NET (Sem DU) ---
       // Lógica Solicitada:
       // 1. Conta Pagar (Valor Sem DU/Net) -> Para 7C
       // 2. Conta Receber (Total com DU) -> Do Cliente
       
       try {
            let catVendaId = 1;
            let catCustoId = 5;
            // Valor Net
            const valorNet = totalPrice - duValue;
            let fornecedorId = 3; 
            let formaPagamentoId = 1; // Pix

            // 1. Conta Pagar (Net) -> 7C
            await supabase.from('contas_pagar').insert({
                 empresa_id: user.user_metadata.empresa_id,
                 user_id: user.id,
                 fornecedor_id: fornecedorId,
                 categoria_id: catCustoId,
                 descricao: `Emissão Aérea (Pix NET) - ${newQuoteTitle || currentCodigoRef.current}`,
                 valor: valorNet,
                 vencimento: new Date().toISOString().split('T')[0],
                 status: 'pendente',
                 origem: 'COTACAO',
                 origem_id: currentCotacaoIdRef.current ? String(currentCotacaoIdRef.current) : null,
                 forma_pagamento_id: formaPagamentoId, 
                 parcelas: 1
            });

            // 2. Conta Receber (Total) -> Cliente
             await supabase.from('contas_receber').insert({
                   empresa_id: user.user_metadata.empresa_id,
                   user_id: user.id,
                   cliente_id: selectedClient?.id || null,
                   nome_cliente: selectedClient?.nome || clientSearchTerm,
                   categoria_id: catVendaId,
                   descricao: `Venda Aérea (Total) - ${newQuoteTitle || currentCodigoRef.current}`,
                   valor: totalPrice, // Recebe o TOTAL
                   vencimento: new Date().toISOString().split('T')[0],
                   status: 'pendente',
                   origem: 'COTACAO',
                   origem_id: currentCotacaoIdRef.current ? String(currentCotacaoIdRef.current) : null,
                   forma_recebimento_id: formaPagamentoId
             });

       } catch (e) { console.error(e) }
  }

  const FlightCard = ({ title, flight }: { title: string, flight: any }) => {
    if (!flight) return null

    // Helper to safely get time
    const getTime = (dateStr: any) => {
      if (!dateStr || typeof dateStr !== 'string') return '00:00'
      try {
        // Handle ISO format
        if (dateStr.includes('T')) {
           const parts = dateStr.split('T')
           return parts[1] ? parts[1].substring(0, 5) : '00:00'
        }
        // Handle DD/MM/YYYY HH:mm format
        if (dateStr.includes(' ') && dateStr.includes('/')) {
           const parts = dateStr.split(' ')
           // Check if second part looks like time HH:mm
           if (parts[1] && parts[1].includes(':')) {
              return parts[1].substring(0, 5)
           }
        }
        // Fallback for simple time string like "14:30"
        if (dateStr.length === 5 && dateStr.includes(':')) {
            return dateStr
        }
        return new Date(dateStr).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
      } catch (e) {
        return '00:00'
      }
    }

    // Helper to calculate duration between two ISO dates or date strings
    const calculateDuration = (start: any, end: any) => {
        try {
            // Se for undefined ou null
            if (!start || !end) return '--'

            // Helper to parse diverse date formats
            const parseDate = (d: any) => {
                if (d instanceof Date) return d
                
                const str = String(d)
                
                // Se for ISO completo (contém T)
                if (str.includes('T')) return new Date(str)
                
                // Se for apenas hora (HH:mm) - usamos uma data base dummy
                if (str.length === 5 && str.includes(':')) {
                    const today = new Date()
                    const [h, m] = str.split(':')
                    today.setHours(parseInt(h), parseInt(m), 0, 0)
                    return today
                }

                // Se for formato brasileiro DD/MM/YYYY HH:mm
                if (str.includes('/')) {
                    // Tenta separar data e hora
                    const parts = str.split(' ')
                    const datePart = parts[0]
                    const timePart = parts[1] || '00:00'
                    
                    const [day, month, year] = datePart.split('/')
                    return new Date(`${year}-${month}-${day}T${timePart}:00`)
                }
                
                return new Date(str)
            }

            let startDate = parseDate(start)
            let endDate = parseDate(end)
            
            // Se as datas forem inválidas
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '--'

            // Ajuste para virada de dia (se apenas hora for fornecida e end < start)
            if (endDate < startDate && String(start).length === 5) {
                endDate.setDate(endDate.getDate() + 1)
            }
            
            const diffMs = endDate.getTime() - startDate.getTime()
            const diffHrs = Math.floor(diffMs / 3600000)
            const diffMins = Math.round((diffMs % 3600000) / 60000)
            
            return `${diffHrs}h ${diffMins}m`
        } catch (e) {
            console.error('Erro calculo duracao:', e)
            return '--'
        }
    }

    // Helper to get full date formatted
    const getFullDate = (dateStr: any) => {
        if (!dateStr) return 'Data n/d'
        try {
            if (dateStr.includes('T')) {
                const dateObj = new Date(dateStr)
                return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            }
            if (dateStr.includes('/')) {
                return dateStr.split(' ')[0]
            }
            return new Date(dateStr).toLocaleDateString('pt-BR')
        } catch (e) {
            return dateStr
        }
    }

    // Helper to safely get ID
    const getFlightId = (id: any) => {
       if (!id) return 'N/A'
       const strId = String(id)
       return strId.includes('-') ? strId.split('-')[0] : strId
    }

    const [showDetails, setShowDetails] = useState(false)

    // Normalize connections
    const connections = flight.DetalhesConexoes || flight.conexoes || []

    return (
    <div 
        className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 relative group cursor-help transition-all hover:border-blue-300 hover:shadow-md"
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
    >
      {/* Tooltip with details */}
      {showDetails && (
        <div className="absolute right-full top-0 mr-4 w-80 bg-white shadow-xl border border-gray-200 rounded-xl z-[100] p-4 text-sm pointer-events-none">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Plane className="w-4 h-4 text-blue-600" />
                Detalhes do Voo
            </h4>
            
            <div className="space-y-4">
                {connections.length > 0 ? (
                    connections.map((segment: any, idx: number) => (
                        <div key={idx} className="relative pl-4 border-l-2 border-gray-200 last:border-0 pb-4 last:pb-0">
                            <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white"></div>
                            
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-gray-800">{segment.Origem}</span>
                                <span className="text-xs text-gray-500 font-mono">{getTime(segment.Embarque || segment.EmbarqueCompleto)}</span>
                            </div>
                            
                            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <img 
                                    src={getAirlineLogoUrl(segment.CompanhiaAparente || flight.CompanhiaAparente || '') || ''} 
                                    className="w-4 h-4 object-contain" 
                                    alt="" 
                                />
                                <span>Voo {segment.NumeroVoo}</span>
                                <span>•</span>
                                <span>{segment.Duracao}</span>
                            </div>

                            <div className="flex justify-between items-start">
                                <span className="font-bold text-gray-800">{segment.Destino}</span>
                                <span className="text-xs text-gray-500 font-mono">{getTime(segment.Desembarque || segment.DesembarqueCompleto)}</span>
                            </div>

                            {/* Connection Time if not last */}
                            {idx < connections.length - 1 && (
                                <div className="my-2 py-1 px-2 bg-yellow-50 text-yellow-700 text-[10px] rounded border border-yellow-100 inline-block">
                                    Conexão: {calculateDuration(
                                        segment.Desembarque || segment.DesembarqueCompleto,
                                        connections[idx + 1].Embarque || connections[idx + 1].EmbarqueCompleto
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="relative pl-4 border-l-2 border-gray-200 pb-0">
                        <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white"></div>
                        <div className="absolute -left-[5px] bottom-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white"></div>
                        
                        <div className="mb-4">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg text-gray-800">{flight.Origem}</span>
                                <span className="font-mono text-gray-600">{getTime(flight.Embarque)}</span>
                            </div>
                            <div className="text-xs text-gray-500">{getFullDate(flight.Data)}</div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 my-2 bg-gray-50 p-2 rounded">
                            <Clock className="w-3 h-3" />
                            <span>Duração: {flight.Duracao}</span>
                        </div>

                        <div>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg text-gray-800">{flight.Destino}</span>
                                <span className="font-mono text-gray-600">{getTime(flight.Desembarque)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">{title}</span>
        <div className="flex items-center space-x-2">
          <img 
            src={getAirlineLogoUrl(flight.CompanhiaAparente || '') || ''} 
            alt={flight.CompanhiaAparente || 'CIA'} 
            className="h-5 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <span className="text-sm font-semibold text-gray-700">{flight.CompanhiaAparente || 'N/A'}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">
            {getTime(flight.Embarque)}
          </div>
          <div className="text-xs text-gray-500 font-mono">{flight.Origem || '---'}</div>
        </div>
        
        <div className="flex-1 px-4 flex flex-col items-center">
          <div className="text-[10px] text-gray-400 mb-1">{flight.Duracao || '--:--'}</div>
          <div className="w-full h-[1px] bg-gray-300 relative">
            <Plane className="w-3 h-3 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90" />
          </div>
          <div className="text-[10px] text-green-600 mt-1 font-medium">
            {(flight.NumeroConexoes === 0 || !flight.NumeroConexoes) ? 'Direto' : `${flight.NumeroConexoes} Parada(s)`}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">
            {getTime(flight.Desembarque)}
          </div>
          <div className="text-xs text-gray-500 font-mono">{flight.Destino || '---'}</div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
        <span>{flight.Data ? new Date(flight.Data).toLocaleDateString('pt-BR') : 'Data não informada'}</span>
        <span>Voo {getFlightId(flight.id)}</span>
      </div>
    </div>
  )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Plane className="mr-3 text-blue-600" />
            Emissão de Aéreo
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna Esquerda - Formulários */}
          <div className="lg:col-span-2 space-y-6">

            {/* Vinculação ao Kanban */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center rounded-t-xl">
                <Layout className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="font-semibold text-gray-800">Vincular ao Kanban</h2>
              </div>
              
              <div className="p-6">
                <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                  <button 
                      onClick={() => setKanbanMode('create')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${kanbanMode === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      Novo Card
                  </button>
                  <button 
                      onClick={() => setKanbanMode('select')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${kanbanMode === 'select' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      Selecionar Existente
                  </button>
                </div>

                {kanbanMode === 'create' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative z-20">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                      {selectedClient ? (
                        <div className="flex items-center justify-between p-2 border border-blue-200 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                              {selectedClient.nome.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <div className="font-medium text-blue-900 truncate">{selectedClient.nome}</div>
                              <div className="text-xs text-blue-600 truncate">{selectedClient.email}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedClient(null)
                              setClientSearchTerm('')
                            }}
                            className="p-1 hover:bg-blue-100 rounded-full text-blue-400 hover:text-blue-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          {showClientSuggestions && (
                            <div 
                              className="fixed inset-0 cursor-default" 
                              onClick={() => setShowClientSuggestions(false)}
                            />
                          )}
                          <div className="relative z-20">
                            <div className="relative">
                              <input 
                                  type="text" 
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                  placeholder="Busque ou crie um cliente..."
                                  value={clientSearchTerm}
                                  onChange={(e) => {
                                    setClientSearchTerm(e.target.value)
                                    setShowClientSuggestions(true)
                                  }}
                                  onFocus={() => setShowClientSuggestions(true)}
                              />
                              {isSearchingClients && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            {showClientSuggestions && (clientSearchTerm || foundClients.length > 0) && (
                            <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-[9999]">
                              {foundClients.map(client => (
                                  <button
                                    key={client.id}
                                    onClick={() => {
                                      setSelectedClient(client)
                                      setClientSearchTerm(client.nome)
                                      setShowClientSuggestions(false)
                                      // Auto-fill removed
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex flex-col border-b border-gray-50 last:border-0"
                                  >
                                    <span className="font-medium text-gray-900">{client.nome}</span>
                                    <span className="text-xs text-gray-500">{client.email} • {client.cpf}</span>
                                  </button>
                                ))}
                                
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (!currentUser) {
                                        alert('Sessão expirada. Por favor, recarregue a página.')
                                        return
                                    }
                                    setIsClientModalOpen(true)
                                    setShowClientSuggestions(false)
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-blue-50 text-blue-600 font-medium flex items-center gap-2 bg-gray-50 sticky bottom-0 border-t border-gray-100"
                                >
                                  <UserPlus className="h-4 w-4" />
                                  Criar novo cliente "{clientSearchTerm}"
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título do Card</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ex: Férias Miami"
                            value={newQuoteTitle}
                            onChange={(e) => setNewQuoteTitle(e.target.value)}
                        />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input 
                              type="text" 
                              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              placeholder="Buscar cotação existente..."
                              // Filter logic could be added here
                          />
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                          {existingCotacoes.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 text-sm">Nenhuma cotação encontrada.</div>
                          ) : (
                              existingCotacoes.map(c => (
                                  <button 
                                      key={c.id}
                                      onClick={() => setSelectedCotacaoId(c.id)}
                                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedCotacaoId === c.id ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : ''}`}
                                  >
                                      <div>
                                          <div className="font-medium text-gray-900">{c.titulo}</div>
                                          <div className="text-xs text-gray-500">{c.cliente} • {c.status}</div>
                                      </div>
                                      {selectedCotacaoId === c.id && <Check className="h-4 w-4 text-blue-600" />}
                                  </button>
                              ))
                          )}
                      </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Dados do Passageiro */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center">
                    <User className="w-5 h-5 text-blue-600 mr-2" />
                    <h2 className="font-semibold text-gray-800">Dados do Passageiro</h2>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {Array.from({ length: totalPax }).map((_, idx) => (
                  <div key={idx} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700">Passageiro {idx + 1}</h3>
                        {idx === 0 && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Principal</span>}
                    </div>
                    
                    {selectedPassengers[idx] ? (
                        <div className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                              {selectedPassengers[idx]?.nome.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                              <div className="font-medium text-blue-900 truncate">{selectedPassengers[idx]?.nome}</div>
                              <div className="text-xs text-blue-600 flex items-center gap-2">
                                 <span>CPF: {selectedPassengers[idx]?.cpf}</span>
                                 <span>•</span>
                                 <span>Nasc: {selectedPassengers[idx]?.data_nascimento ? selectedPassengers[idx]!.data_nascimento.split('-').reverse().join('/') : 'N/D'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                                onClick={() => {
                                    setPassengerToEdit(selectedPassengers[idx])
                                    setActivePassengerIndex(idx)
                                    setIsPassengerModalOpen(true)
                                }}
                                className="p-2 hover:bg-blue-100 rounded-full text-blue-600 transition-colors"
                                title="Editar dados"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button 
                                onClick={() => {
                                    const newSelected = [...selectedPassengers]
                                    newSelected[idx] = null
                                    setSelectedPassengers(newSelected)
                                    
                                    const newTerms = [...passengerSearchTerms]
                                    newTerms[idx] = ''
                                    setPassengerSearchTerms(newTerms)
                                }}
                                className="p-2 hover:bg-red-100 rounded-full text-red-400 hover:text-red-600 transition-colors"
                                title="Remover passageiro"
                            >
                                <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                    ) : (
                        <div className="relative">
                          {showPassengerSuggestions === idx && (
                            <div 
                              className="fixed inset-0 cursor-default" 
                              onClick={() => setShowPassengerSuggestions(null)}
                            />
                          )}
                          <div className="relative z-20">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Busque um passageiro existente..."
                                    value={passengerSearchTerms[idx]}
                                    onChange={(e) => {
                                      const newTerms = [...passengerSearchTerms]
                                      newTerms[idx] = e.target.value
                                      setPassengerSearchTerms(newTerms)
                                      setActivePassengerIndex(idx)
                                      setShowPassengerSuggestions(idx)
                                    }}
                                    onFocus={() => {
                                        setActivePassengerIndex(idx)
                                        setShowPassengerSuggestions(idx)
                                    }}
                                />
                                {isSearchingPassengers && activePassengerIndex === idx && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                  </div>
                                )}
                              </div>

                              <button
                                  type="button"
                                  onClick={() => {
                                    if (!currentUser) {
                                        alert('Sessão expirada. Por favor, recarregue a página.')
                                        return
                                    }
                                    setPassengerToEdit(null)
                                    setActivePassengerIndex(idx)
                                    setIsPassengerModalOpen(true)
                                    setShowPassengerSuggestions(null)
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium whitespace-nowrap"
                                >
                                <UserPlus className="h-4 w-4" />
                                Novo
                              </button>
                            </div>
                            
                            {showPassengerSuggestions === idx && (passengerSearchTerms[idx] || foundPassengers.length > 0) && (
                            <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-[9999]">
                              {foundPassengers.map(client => (
                                  <button
                                    key={client.id}
                                    onClick={() => {
                                      const newSelected = [...selectedPassengers]
                                      newSelected[idx] = client
                                      setSelectedPassengers(newSelected)
                                      
                                      const newTerms = [...passengerSearchTerms]
                                      newTerms[idx] = client.nome
                                      setPassengerSearchTerms(newTerms)
                                      
                                      setShowPassengerSuggestions(null)
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex flex-col border-b border-gray-50 last:border-0"
                                  >
                                    <span className="font-medium text-gray-900">{client.nome}</span>
                                    <span className="text-xs text-gray-500">{client.cpf} • {client.email}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Formas de Pagamento */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center">
                <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="font-semibold text-gray-800">Formas de Pagamento</h2>
              </div>
              
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto scrollbar-hide">
                  {paymentConfig.cartao && (
                    <button
                      onClick={() => setSelectedPaymentMethod('cartao')}
                      className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                        ${selectedPaymentMethod === 'cartao' 
                          ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Cartão de Crédito
                    </button>
                  )}
                  {paymentConfig.pix && (
                    <button
                      onClick={() => setSelectedPaymentMethod('pix')}
                      className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                        ${selectedPaymentMethod === 'pix' 
                          ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Pix
                    </button>
                  )}
                  {paymentConfig.boleto && (
                    <button
                      onClick={() => setSelectedPaymentMethod('boleto')}
                      className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                        ${selectedPaymentMethod === 'boleto' 
                          ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Barcode className="w-4 h-4 mr-2" />
                      Boleto
                    </button>
                  )}
                  {paymentConfig.faturado && (
                    <button
                      onClick={() => setSelectedPaymentMethod('faturado')}
                      className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                        ${selectedPaymentMethod === 'faturado' 
                          ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Building className="w-4 h-4 mr-2" />
                      Faturado
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {selectedPaymentMethod === 'cartao' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start">
                      <CreditCard className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 text-sm">Pagamento via Link</h4>
                        <p className="text-blue-700 text-sm mt-1">
                          Processamos os pagamentos de cartão via link de pagamento gerado manualmente. Siga com o processo de emissão e nossa equipe irá enviar o link diretamente ao WhatsApp da agência.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <h4 className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-2">Informações do Titular para o Link</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo do Titular</label>
                        <input
                          type="text"
                          name="nome"
                          value={payment.nome}
                          onChange={(e) => handleInputChange(e, 'payment')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                          placeholder="Nome completo"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                          <input
                            type="email"
                            name="email"
                            value={payment.email}
                            onChange={(e) => handleInputChange(e, 'payment')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            placeholder="email@exemplo.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                          <input
                            type="tel"
                            name="telefone"
                            value={payment.telefone}
                            onChange={(e) => handleInputChange(e, 'payment')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parcelamento desejado</label>
                      <select
                        name="parcelas"
                        value={payment.parcelas}
                        onChange={(e) => handleInputChange(e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                          const { totalComTaxa, porParcela } = calcular7c(totalPrice, String(num))
                          const isSemJuros = totalComTaxa <= totalPrice + 0.05 // Tolerance for float/rounding
                          
                          return (
                            <option key={num} value={num}>
                              {num}x de R$ {porParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {isSemJuros ? 'sem juros' : `(Total: R$ ${totalComTaxa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'pix' && (
                  <div className="text-center py-8">
                    <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Pagamento via Pix</h3>
                    <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                      O código QR para pagamento será gerado na próxima etapa. A confirmação é instantânea.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg inline-block text-left">
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          Aprovação imediata
                        </li>
                        <li className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          Sem limite de horário
                        </li>
                        <li className="flex items-center">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          Mais seguro
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'boleto' && (
                  <div className="text-center py-8">
                    <Barcode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Boleto Bancário</h3>
                    <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                      O boleto será gerado na próxima etapa. O prazo de compensação é de até 3 dias úteis.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800 mb-4 inline-block text-left max-w-md">
                      <p className="font-semibold mb-1">Importante:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>A emissão do bilhete só ocorre após a compensação do pagamento.</li>
                        <li>Verifique a data de vencimento.</li>
                        <li>Sujeito à disponibilidade de tarifa no momento da emissão.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === 'faturado' && (
                  <div className="space-y-6">
                     <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start">
                        <Building className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                           <h4 className="font-semibold text-blue-900 text-sm">Faturamento Corporativo</h4>
                           <p className="text-blue-700 text-sm mt-1">
                              O valor será faturado para a empresa conforme as condições contratuais vigentes (ex: Boleto 15 dias, Transferência, etc).
                           </p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Custo (Opcional)</label>
                           <input
                              type="text"
                              value={faturadoDetails.centroCusto}
                              onChange={(e) => setFaturadoDetails({...faturadoDetails, centroCusto: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                              placeholder="Ex: Marketing, Vendas, 001.2024"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Observações para o Faturamento</label>
                           <textarea
                              value={faturadoDetails.observacao}
                              onChange={(e) => setFaturadoDetails({...faturadoDetails, observacao: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                              rows={3}
                              placeholder="Informações adicionais para a nota fiscal ou controle interno..."
                           />
                        </div>
                     </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Coluna Direita - Resumo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 sticky top-6">
              <div className="p-4 bg-gray-900 text-white rounded-t-xl">
                <h3 className="font-bold text-lg">Resumo do Pedido</h3>
              </div>
              
              <div className="p-4">
                <FlightCard title="Ida" flight={ida} />
                {volta && <FlightCard title="Volta" flight={volta} />}

                {/* Tariff Rules Links */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-semibold text-gray-700">Regras da Tarifa</span>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedRuleCia(ida.cia || ida.CompanhiaAparente)
                        setSelectedRuleTariff(ida.tarifa || ida.Tarifa)
                        setShowRulesModal(true)
                      }}
                      className="w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2.5 rounded-lg flex items-center justify-between transition-colors border border-blue-100 group"
                    >
                      <span className="truncate flex-1">Regras de cancelamento e bagagem (Ida)</span>
                      <Info className="h-4 w-4 flex-shrink-0 text-blue-400 group-hover:text-blue-600" />
                    </button>

                    {volta && (
                      <button
                        onClick={() => {
                          setSelectedRuleCia(volta.cia || volta.CompanhiaAparente)
                          setSelectedRuleTariff(volta.tarifa || volta.Tarifa)
                          setShowRulesModal(true)
                        }}
                        className="w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2.5 rounded-lg flex items-center justify-between transition-colors border border-blue-100 group"
                      >
                        <span className="truncate flex-1">Regras de cancelamento e bagagem (Volta)</span>
                        <Info className="h-4 w-4 flex-shrink-0 text-blue-400 group-hover:text-blue-600" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 px-1">
                    É importante ler as regras de cancelamento e alteração antes de confirmar a emissão.
                  </p>
                </div>

                <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Tarifa Aérea</span>
                    <span>R$ {(priceIda.fare + priceVolta.fare).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Taxas e Encargos</span>
                    <span>R$ {(priceIda.tax + priceVolta.tax).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600 text-sm items-center h-8">
                    <span>DU (Service Fee)</span>
                    <div className="flex items-center gap-2">
                      {isEditingDu ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs">R$</span>
                          <input 
                            type="text" 
                            value={tempDuValue}
                            onChange={(e) => setTempDuValue(e.target.value)}
                            className="w-20 px-2 py-1 text-right text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                            onBlur={handleDuSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleDuSave()}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={handleDuEditClick}>
                          <span>R$ {duValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                          <Pencil className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between text-gray-900 font-bold text-lg pt-3 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-blue-600">R$ {totalPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`w-full mt-6 py-3 rounded-lg font-bold text-white shadow-md transition-all
                    ${loading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 hover:shadow-lg active:scale-[0.98]'
                    }`}
                >
                  {loading ? 'Processando...' : 'Confirmar Emissão'}
                </button>
                
                <p className="text-xs text-center text-gray-400 mt-4">
                  Ao confirmar, você concorda com os termos de serviço e políticas de cancelamento.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Client Modal */}
      {isClientModalOpen && currentUser && (
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSuccess={(newClient) => {
            setSelectedClient(newClient)
            setClientSearchTerm(newClient.nome)
            // Auto-fill first passenger if none selected
            if (!selectedPassengers[0]) {
                const newSelected = [...selectedPassengers]
                newSelected[0] = newClient
                setSelectedPassengers(newSelected)
                
                const newTerms = [...passengerSearchTerms]
                newTerms[0] = newClient.nome
                setPassengerSearchTerms(newTerms)
            }
          }}
          user={currentUser}
        />
      )}

      {/* Client Modal for Passenger */}
      {isPassengerModalOpen && currentUser && (
        <ClientModal
          isOpen={isPassengerModalOpen}
          onClose={() => {
              setIsPassengerModalOpen(false)
              setPassengerToEdit(null)
          }}
          onSuccess={(newPassenger) => {
            const newSelected = [...selectedPassengers]
            newSelected[activePassengerIndex] = newPassenger
            setSelectedPassengers(newSelected)
            
            const newTerms = [...passengerSearchTerms]
            newTerms[activePassengerIndex] = newPassenger.nome
            setPassengerSearchTerms(newTerms)
            
            setPassengerToEdit(null)
          }}
          user={currentUser}
          clienteToEdit={passengerToEdit}
          requiredFields={['nome', 'cpf', 'dataNascimento']}
        />
      )}

      {/* Tariff Rules Modal */}
      <TariffRulesModal 
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        cia={selectedRuleCia}
        tipoTarifa={selectedRuleTariff}
      />

      {/* Pix Decision Modal */}
      {showPixDecisionModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300 relative">
             <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Como deseja gerar o Pix?</h3>
                <p className="text-gray-600 mb-6 text-center text-sm">
                   Escolha se o QR Code deve cobrar o valor TOTAL da venda ou apenas a Tarifa NET (descontando sua comissão).
                </p>

                <div className="space-y-3">
                   <button
                      onClick={processarPixTotal}
                      className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all group"
                   >
                      <div className="text-left">
                         <div className="font-bold text-gray-900 group-hover:text-blue-700">Valor TOTAL</div>
                         <div className="text-xs text-gray-500">Inclui Tarifa + Taxas + Sua Comissão (DU)</div>
                      </div>
                      <div className="font-bold text-blue-600">
                         R$ {totalPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </div>
                   </button>

                   <button
                      onClick={processarPixNet}
                      className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-green-50 hover:border-green-300 transition-all group"
                   >
                      <div className="text-left">
                         <div className="font-bold text-gray-900 group-hover:text-green-700">Apenas Tarifa NET</div>
                         <div className="text-xs text-gray-500">Apenas Custo (Cliente paga DU por fora)</div>
                      </div>
                      <div className="font-bold text-green-600">
                         R$ {(totalPrice - duValue).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </div>
                   </button>
                </div>
                
                <button
                   onClick={() => setShowPixDecisionModal(false)}
                   className="mt-6 w-full py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                   Cancelar
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Pix Payment Modal */}
      {showPixModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300 relative">
            
            {/* Botão Fechar */}
            <button 
                onClick={() => setShowPixModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
                title="Fechar e alterar forma de pagamento"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="bg-green-600 p-6 text-center relative">
              <QrCode className="w-12 h-12 text-white mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white">Pagamento via Pix</h2>
              <p className="text-green-100 text-sm mt-1">Escaneie o QR Code para pagar</p>
            </div>
            
            <div className="p-8 flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-inner mb-6">
                <QRCodeSVG value={pixCode} size={200} level="M" />
              </div>

              <div className="w-full space-y-4">
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Pix Copia e Cola</label>
                  <div className="flex gap-2">
                    <input 
                      readOnly 
                      value={pixCode} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 font-mono"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(pixCode)
                        alert('Código Pix copiado!')
                      }}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Copiar código"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500 my-2">
                    Valor a pagar: <span className="font-bold text-gray-900">R$ {pixValorDisplay.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>

                <button
                  onClick={() => {
                    alert('Pagamento registrado! Sua emissão será processada.')
                    navigate('/cotacoes')
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all active:scale-[0.98]"
                >
                  Já realizei o pagamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmissaoAereo