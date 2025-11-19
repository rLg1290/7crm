// Integração Hotelbeds desativada
// Mantemos apenas os tipos mínimos para componentes que dependem de tipagem.

export interface Hotel {
  id: string
  nome: string
  categoria: number
  imagens: string[]
  facilidades: string[]
  avaliacoes: { nota: number }
  endereco?: string
  cidade?: string
  pais?: string
  telefone?: string
  email?: string
  website?: string
}

class HotelbedsServiceDisabled {
  verificarCredenciais(): boolean {
    return false
  }

  async testarConexao(): Promise<boolean> {
    return false
  }

  async buscarDestinos(_query: string): Promise<{ destinations: any[] }> {
    throw new Error('Integração Hotelbeds desativada')
  }

  async buscarDisponibilidade(_params: any): Promise<any> {
    throw new Error('Integração Hotelbeds desativada')
  }

  async buscarDetalhesHotel(_hotelId: string): Promise<any> {
    throw new Error('Integração Hotelbeds desativada')
  }
}

export const hotelbedsService = new HotelbedsServiceDisabled()
export default hotelbedsService