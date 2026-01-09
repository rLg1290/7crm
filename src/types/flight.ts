export interface Flight {
  CompanhiaAparente: string
  id: string
  Tarifa: string
  Sentido: 'ida' | 'volta'
  Origem: string
  Destino: string
  Embarque: string
  Desembarque: string
  Duracao: string
  NumeroConexoes: number
  DetalhesConexoes: any[]
  Data: string
  Adulto: number
  Crianca: number
  Bebe: number
  AdultoR: number
  CriancaR: number
  BebeR: number
  TaxaEmbarque: number
  BagagemDespachada: number
  source: string
  AdultoC: number
  CriancaC: number
  BebeC: number
  AdultoF: number
}
