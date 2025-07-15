import CryptoJS from 'crypto-js'

// Configuração da API Hotelbeds conforme documentação oficial
const HOTELBEDS_CONFIG = {
  // Credenciais - usando diretamente para teste
  apiKey: 'aee1137aba908f2c4e5fced6f4d7307e',
  secret: '35c87bb016',
  
  // URLs da API - usando proxy local para contornar CORS
  baseUrl: '/api/hotelbeds',
  endpoints: {
    // Endpoints corretos conforme documentação
    status: '/hotel-api/1.0/status',
    availability: '/hotel-api/1.0/hotels',
    destinations: '/hotel-content-api/1.0/locations/destinations',
    content: '/hotel-content-api/1.0/hotels'
  }
}

// Debug das credenciais
console.log('🔑 Credenciais carregadas:')
console.log('API Key:', HOTELBEDS_CONFIG.apiKey?.substring(0, 8) + '...')
console.log('Secret:', HOTELBEDS_CONFIG.secret?.substring(0, 5) + '...')
console.log('🌐 Base URL:', HOTELBEDS_CONFIG.baseUrl)

// Cache para destinos (evitar múltiplas requisições)
let destinosCache: any[] = []
let cacheCarregado = false

// Interfaces TypeScript
export interface HotelSearchRequest {
  stay: {
    checkIn: string
    checkOut: string
  }
  occupancies: Array<{
    rooms: number
    adults: number
    children: number
    paxes?: Array<{
      type: string
      age: number
    }>
  }>
  destination?: {
    code?: string
    countryCode?: string
  }
  geolocation?: {
    latitude: number
    longitude: number
    radius: number
    unit: string
  }
  filter?: {
    minCategory?: number
    maxCategory?: number
    hotelPackage?: string
  }
  dailyRate?: boolean
  language?: string
  currency?: string
}

export interface Hotel {
  id: string
  nome: string
  categoria: number
  endereco: {
    rua: string
    cidade: string
    estado: string
    pais: string
    cep: string
    coordenadas: {
      latitude: number
      longitude: number
    }
  }
  contato: {
    telefone: string
    email: string
    website: string
  }
  facilidades: string[]
  imagens: Array<{
    url: string
    tipo: string
    descricao: string
  }>
  descricao: string
  politicas: {
    checkin: string
    checkout: string
    cancelamento: string
  }
  avaliacoes: {
    nota: number
    comentarios: number
  }
  rates?: Array<{
    rateKey: string
    rateClass: string
    rateType: string
    net: number
    discount: number
    discountPCT: number
    sellingRate: number
    hotelSellingRate: number
    amount: number
    hotelCurrency: string
    hotelMandatory: boolean
    rooms: number
    adults: number
    children: number
    childrenAges: string
    rateup: number
    taxes: {
      allIncluded: boolean
      tax: Array<{
        included: boolean
        amount: number
        currency: string
        type: string
        clientAmount: number
        clientCurrency: string
      }>
    }
    boardCode: string
    boardName: string
    cancellationPolicies: Array<{
      amount: number
      from: string
    }>
  }>
}

export interface DestinationResponse {
  destinations: Array<{
    code: string
    name: {
      content: string
    }
    countryCode: string
    isoCode: string
    groupCode: string
    type: string
  }>
}

// Função para gerar assinatura conforme documentação oficial
const generateSignature = (): { signature: string; timestamp: number } => {
  const timestamp = Math.floor(Date.now() / 1000)
  const message = HOTELBEDS_CONFIG.apiKey + HOTELBEDS_CONFIG.secret + timestamp
  const signature = CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex)
  
  return { signature, timestamp }
}

// Headers padrão conforme documentação oficial
const getHeaders = () => {
  const { signature } = generateSignature()
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Api-key': HOTELBEDS_CONFIG.apiKey,
    'X-Signature': signature
  }
}

// Classe principal do serviço
class HotelbedsService {
  
  /**
   * Carrega destinos uma única vez e cacheia localmente
   */
  private async carregarDestinosCache(): Promise<void> {
    if (cacheCarregado) return

    console.log('📥 Carregando cache de destinos (uma única vez)...')
    
    try {
      // Endpoint correto conforme documentação
      const url = `${HOTELBEDS_CONFIG.baseUrl}${HOTELBEDS_CONFIG.endpoints.destinations}?language=ENG&fields=all&from=1&to=100`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erro na resposta da API:', response.status, errorText)
        throw new Error(`Erro ao carregar destinos: ${response.status}`)
      }

      const data = await response.json()
      destinosCache = data.destinations || []
      cacheCarregado = true
      
      console.log('✅ Cache de destinos carregado:', destinosCache.length, 'destinos')
      
    } catch (error) {
      console.error('❌ Erro ao carregar cache de destinos:', error)
      destinosCache = []
      cacheCarregado = false
    }
  }

  /**
   * Busca destinos com cache local (SEM requisições repetidas)
   */
  async buscarDestinos(termo: string): Promise<DestinationResponse> {
    console.log('🔍 Buscando destinos localmente para:', termo)
    
    try {
      // Carregar cache se necessário (apenas na primeira vez)
      await this.carregarDestinosCache()
      
      // Filtrar localmente - SEM fazer requisição à API
      const destinosFiltrados = destinosCache.filter((dest: any) => 
        dest.name?.content?.toLowerCase().includes(termo.toLowerCase())
      )
      
      console.log('✅ Destinos filtrados localmente:', destinosFiltrados.length)
      
      return {
        destinations: destinosFiltrados
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar destinos:', error)
      return { destinations: [] }
    }
  }

  /**
   * Busca disponibilidade de hotéis conforme Booking API
   */
  async buscarDisponibilidade(parametros: any): Promise<Hotel[]> {
    console.log('🏨 Buscando disponibilidade com parâmetros:', parametros)
    
    try {
      // Preparar payload conforme documentação oficial
      const payload: HotelSearchRequest = {
        stay: {
          checkIn: parametros.checkin,
          checkOut: parametros.checkout
        },
        occupancies: parametros.quartos.map((quarto: any) => ({
          rooms: 1,
          adults: quarto.adultos,
          children: quarto.criancas,
          ...(quarto.idadesCriancas && quarto.idadesCriancas.length > 0 && {
            paxes: quarto.idadesCriancas.map((idade: number) => ({
              type: 'CH',
              age: idade
            }))
          })
        })),
        dailyRate: false,
        language: 'ENG',
        currency: 'EUR'
      }

      // Se temos um destino específico, adicionar à busca
      if (parametros.destino && parametros.destino.length > 0) {
        // Para simplificar, vamos buscar por país primeiro
        payload.destination = {
          countryCode: 'ES' // Por enquanto fixo, depois melhoraremos
        }
      }

      console.log('📤 Payload enviado:', JSON.stringify(payload, null, 2))

      const response = await fetch(
        `${HOTELBEDS_CONFIG.baseUrl}${HOTELBEDS_CONFIG.endpoints.availability}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        }
      )

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ Erro na resposta da API:', errorData)
        throw new Error(`Erro na busca: ${response.status}`)
      }

      const data = await response.json()
      
      console.log('✅ Resposta recebida:', data.hotels?.length || 0, 'hotéis')
      
      return this.formatarHoteis(data.hotels || [])
      
    } catch (error) {
      console.error('❌ Erro na busca de disponibilidade:', error)
      throw new Error('Falha na busca de hotéis. Verifique os parâmetros e tente novamente.')
    }
  }

  /**
   * Busca detalhes de um hotel específico
   */
  async buscarDetalhesHotel(hotelId: string, idioma: string = 'ENG'): Promise<Hotel | null> {
    console.log('🏨 Buscando detalhes do hotel:', hotelId)
    
    try {
      const response = await fetch(
        `${HOTELBEDS_CONFIG.baseUrl}${HOTELBEDS_CONFIG.endpoints.content}/${hotelId}?language=${idioma}&useSecondaryLanguage=false`,
        {
          method: 'GET',
          headers: getHeaders()
        }
      )

      if (!response.ok) {
        throw new Error(`Erro ao buscar detalhes: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.hotel) {
        console.log('✅ Detalhes do hotel carregados')
        return this.formatarHotel(data.hotel)
      }
      
      return null
      
    } catch (error) {
      console.error('❌ Erro ao buscar detalhes do hotel:', error)
      throw new Error('Falha ao carregar detalhes do hotel.')
    }
  }

  /**
   * Formatar resposta de hotéis da API
   */
  private formatarHoteis(hoteis: any[]): Hotel[] {
    return hoteis.map(hotel => this.formatarHotel(hotel))
  }

  /**
   * Formatar um hotel individual
   */
  private formatarHotel(hotel: any): Hotel {
    return {
      id: hotel.code?.toString() || hotel.hotelCode?.toString() || '',
      nome: hotel.name?.content || hotel.name || 'Hotel sem nome',
      categoria: hotel.categoryCode || hotel.category || 0,
      endereco: {
        rua: hotel.address?.content || hotel.address || '',
        cidade: hotel.city?.content || hotel.city || '',
        estado: hotel.state?.content || hotel.state || '',
        pais: hotel.country?.content || hotel.country || '',
        cep: hotel.postalCode || '',
        coordenadas: {
          latitude: hotel.coordinates?.latitude || 0,
          longitude: hotel.coordinates?.longitude || 0
        }
      },
      contato: {
        telefone: hotel.phone || '',
        email: hotel.email || '',
        website: hotel.web || ''
      },
      facilidades: hotel.facilities?.map((f: any) => f.description?.content || f.description) || [],
      imagens: hotel.images?.map((img: any) => ({
        url: img.path || '',
        tipo: img.typeCode || '',
        descricao: img.typeDescription?.content || img.typeDescription || ''
      })) || [],
      descricao: hotel.description?.content || hotel.description || '',
      politicas: {
        checkin: hotel.checkIn || '15:00',
        checkout: hotel.checkOut || '11:00',
        cancelamento: hotel.cancellationPolicies?.[0]?.description?.content || 'Consulte políticas específicas'
      },
      avaliacoes: {
        nota: hotel.ranking || 0,
        comentarios: 0
      },
      rates: hotel.rates || []
    }
  }

  /**
   * Verificar se as credenciais estão configuradas
   */
  verificarCredenciais(): boolean {
    const temCredenciais = Boolean(HOTELBEDS_CONFIG.apiKey) && 
                          Boolean(HOTELBEDS_CONFIG.secret) &&
                          HOTELBEDS_CONFIG.apiKey.length > 0 &&
                          HOTELBEDS_CONFIG.secret.length > 0
    
    if (!temCredenciais) {
      console.warn('⚠️ Credenciais da API Hotelbeds não configuradas')
      console.warn('📖 Obtenha suas credenciais em: https://developer.hotelbeds.com/')
      console.warn('🔑 Configure as variáveis de ambiente:')
      console.warn('   VITE_HOTELBEDS_API_KEY=sua_api_key')
      console.warn('   VITE_HOTELBEDS_SECRET=seu_secret')
    } else {
      console.log('✅ Credenciais configuradas')
      console.log('🔑 API Key:', HOTELBEDS_CONFIG.apiKey.substring(0, 8) + '...')
    }
    
    return temCredenciais
  }

  /**
   * Função para testar conexão com a API
   */
  async testarConexao(): Promise<boolean> {
    console.log('🔄 Testando conexão com API Hotelbeds...')
    
    try {
      const response = await fetch(
        `${HOTELBEDS_CONFIG.baseUrl}${HOTELBEDS_CONFIG.endpoints.status}`,
        {
          method: 'GET',
          headers: getHeaders()
        }
      )

      const sucesso = response.ok
      
      if (sucesso) {
        const data = await response.json()
        console.log('✅ Conexão OK - Status:', data)
      } else {
        const errorText = await response.text()
        console.log('❌ Falha na conexão - Status:', response.status, errorText)
      }
      
      return sucesso
      
    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error)
      return false
    }
  }
}

// Exportar instância singleton
export const hotelbedsService = new HotelbedsService()
export default hotelbedsService 