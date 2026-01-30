export interface Cliente {
  id: number
  nome: string
  email: string
  telefone: string
  data_nascimento: string | null
  cpf: string
  rg?: string
  passaporte?: string
  data_expedicao?: string
  data_expiracao?: string
  nacionalidade: string
  rede_social?: string
  observacoes?: string
  empresa_id: string
  created_at: string
}

export interface NovoClienteForm {
  nome: string
  dataNascimento: string
  cpf: string
  rg: string
  passaporte: string
  dataExpedicao: string
  dataExpiracao: string
  nacionalidade: string
  email: string
  telefone: string
  redeSocial: string
  observacoes: string
}
