import { supabase } from '../lib/supabase'

export interface Transacao {
  id: string
  empresa_id?: string
  tipo: 'receita' | 'despesa'
  descricao: string
  categoria: string
  valor: number
  data: string
  status: 'pago' | 'pendente' | 'vencido'
  cliente_id?: string
  cliente_nome?: string
  vencimento?: string
  observacoes?: string
  comprovante_url?: string
  created_at?: string
  updated_at?: string
}

export interface ContasPagar {
  id: string
  categoria: string
  fornecedor_id?: number
  forma_pagamento?: string | number | null;
  valor: number
  parcelas: string
  vencimento: string
  status: string
  observacoes?: string
  origem: string
  origem_id?: string
  user_id: string
  created_at: string
}

export interface ContasReceber {
  id: string
  empresa_id?: string
  cliente_id?: string
  cliente_nome: string
  descricao: string
  servico: string
  valor: number
  vencimento: string
  status: 'recebida' | 'pendente' | 'vencida'
  data_recebimento?: string
  forma_recebimento?: string
  observacoes?: string
  comprovante_url?: string
  created_at: string
  updated_at?: string
}

export interface CategoriaFinanceira {
  id: string
  empresa_id?: string
  nome: string
  tipo: 'receita' | 'despesa'
  cor: string
  ativo: boolean
  created_at?: string
  updated_at?: string
}

export interface ResumoFinanceiro {
  saldo_atual: number
  receitas_mes: number
  despesas_mes: number
  lucro_mes: number
  contas_pagar_total: number
  contas_receber_total: number
  fluxo_caixa_projetado: number
}

export interface NovaTransacao {
  tipo: 'receita' | 'despesa'
  descricao: string
  categoria: string
  valor: number
  data: string
  status?: 'pago' | 'pendente' | 'vencido'
  cliente_id?: string
  cliente_nome?: string
  vencimento?: string
  observacoes?: string
}

export interface NovaContaPagar {
  categoria: string
  fornecedor_id?: number
  forma_pagamento: string
  valor: number
  parcelas: string
  vencimento: string
  status?: string
  observacoes?: string
  origem?: string
  origem_id?: string
}

export interface NovaContaReceber {
  cliente_id?: string
  cliente_nome: string
  descricao: string
  servico: string
  valor: number
  vencimento: string
  status?: 'recebida' | 'pendente' | 'vencida'
  data_recebimento?: string
  forma_recebimento?: string
  observacoes?: string
  comprovante_url?: string
}

class FinanceiroService {
  // ===== TRANSAÇÕES =====
  
  async getTransacoes(empresaId: string, filtros?: {
    tipo?: 'receita' | 'despesa'
    status?: string
    dataInicio?: string
    dataFim?: string
    categoria?: string
  }): Promise<Transacao[]> {
    try {
      let query = supabase
        .from('transacoes_financeiras')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data', { ascending: false })

      if (filtros?.tipo) {
        query = query.eq('tipo', filtros.tipo)
      }
      if (filtros?.status) {
        query = query.eq('status', filtros.status)
      }
      if (filtros?.dataInicio) {
        query = query.gte('data', filtros.dataInicio)
      }
      if (filtros?.dataFim) {
        query = query.lte('data', filtros.dataFim)
      }
      if (filtros?.categoria) {
        query = query.eq('categoria', filtros.categoria)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar transações:', error)
      throw error
    }
  }

  async criarTransacao(empresaId: string, transacao: NovaTransacao): Promise<Transacao> {
    try {
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .insert({
          empresa_id: empresaId,
          ...transacao,
          status: transacao.status || 'pendente'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar transação:', error)
      throw error
    }
  }

  async atualizarTransacao(id: string, transacao: Partial<Transacao>): Promise<Transacao> {
    try {
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .update(transacao)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar transação:', error)
      throw error
    }
  }

  async deletarTransacao(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('transacoes_financeiras')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao deletar transação:', error)
      throw error
    }
  }

  // ===== CONTAS A PAGAR =====

  async getContasPagar(userId: string, filtros?: {
    status?: string
    vencimentoInicio?: string
    vencimentoFim?: string
    categoria?: string
  }): Promise<ContasPagar[]> {
    try {
      console.log('Buscando contas a pagar para usuário:', userId, 'com filtros:', filtros)
      
      let query = supabase
        .from('contas_pagar')
        .select('*')
        .eq('user_id', userId)
        .order('vencimento', { ascending: true })

      if (filtros?.status) {
        query = query.eq('status', filtros.status)
      }
      if (filtros?.vencimentoInicio) {
        query = query.gte('vencimento', filtros.vencimentoInicio)
      }
      if (filtros?.vencimentoFim) {
        query = query.lte('vencimento', filtros.vencimentoFim)
      }
      if (filtros?.categoria) {
        query = query.eq('categoria', filtros.categoria)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro do Supabase ao buscar contas a pagar:', error)
        throw error
      }
      
      console.log('Contas a pagar encontradas:', data)
      return data || []
    } catch (error) {
      console.error('Erro ao buscar contas a pagar:', error)
      throw error
    }
  }

  async criarContaPagar(userId: string, conta: NovaContaPagar): Promise<ContasPagar> {
    try {
      console.log('Criando conta a pagar:', { userId, conta })
      
      const { data, error } = await supabase
        .from('contas_pagar')
        .insert({
          user_id: userId,
          ...conta,
          status: conta.status || 'PENDENTE',
          origem: conta.origem || 'MANUAL'
        })
        .select()
        .single()

      if (error) {
        console.error('Erro do Supabase ao criar conta a pagar:', error)
        throw error
      }
      
      console.log('Conta a pagar criada com sucesso:', data)
      return data
    } catch (error) {
      console.error('Erro ao criar conta a pagar:', error)
      throw error
    }
  }

  async atualizarContaPagar(id: string, conta: Partial<ContasPagar>): Promise<ContasPagar> {
    try {
      const { data, error } = await supabase
        .from('contas_pagar')
        .update(conta)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar conta a pagar:', error)
      throw error
    }
  }

  async marcarContaPagarComoPaga(id: string): Promise<ContasPagar> {
    try {
      const { data, error } = await supabase
        .from('contas_pagar')
        .update({
          status: 'PAGA'
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao marcar conta como paga:', error)
      throw error
    }
  }

  async deletarContaPagar(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contas_pagar')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao deletar conta a pagar:', error)
      throw error
    }
  }

  // ===== CONTAS A RECEBER =====

  async getContasReceber(empresaId: string, filtros?: {
    status?: string
    vencimentoInicio?: string
    vencimentoFim?: string
    servico?: string
  }): Promise<ContasReceber[]> {
    try {
      console.log('Buscando contas a receber para empresa:', empresaId, 'com filtros:', filtros)
      
      let query = supabase
        .from('contas_receber')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('vencimento', { ascending: true })

      if (filtros?.status) {
        query = query.eq('status', filtros.status)
      }
      if (filtros?.vencimentoInicio) {
        query = query.gte('vencimento', filtros.vencimentoInicio)
      }
      if (filtros?.vencimentoFim) {
        query = query.lte('vencimento', filtros.vencimentoFim)
      }
      if (filtros?.servico) {
        query = query.eq('servico', filtros.servico)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro do Supabase ao buscar contas a receber:', error)
        throw error
      }
      
      console.log('Contas a receber encontradas:', data)
      return data || []
    } catch (error) {
      console.error('Erro ao buscar contas a receber:', error)
      throw error
    }
  }

  async criarContaReceber(empresaId: string, conta: NovaContaReceber): Promise<ContasReceber> {
    try {
      console.log('Criando conta a receber:', { empresaId, conta })
      
      const { data, error } = await supabase
        .from('contas_receber')
        .insert({
          empresa_id: empresaId,
          ...conta,
          status: conta.status || 'pendente'
        })
        .select()
        .single()

      if (error) {
        console.error('Erro do Supabase ao criar conta a receber:', error)
        throw error
      }
      
      console.log('Conta a receber criada com sucesso:', data)
      return data
    } catch (error) {
      console.error('Erro ao criar conta a receber:', error)
      throw error
    }
  }

  async atualizarContaReceber(id: string, conta: Partial<ContasReceber>): Promise<ContasReceber> {
    try {
      const { data, error } = await supabase
        .from('contas_receber')
        .update(conta)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar conta a receber:', error)
      throw error
    }
  }

  async marcarContaReceberComoRecebida(id: string, dataRecebimento: string, formaRecebimento?: string): Promise<ContasReceber> {
    try {
      const { data, error } = await supabase
        .from('contas_receber')
        .update({
          status: 'recebida',
          data_recebimento: dataRecebimento,
          forma_recebimento: formaRecebimento
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao marcar conta como recebida:', error)
      throw error
    }
  }

  async deletarContaReceber(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contas_receber')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao deletar conta a receber:', error)
      throw error
    }
  }

  // ===== CATEGORIAS =====

  async getCategorias(empresaId: string, tipo?: 'receita' | 'despesa'): Promise<CategoriaFinanceira[]> {
    try {
      let query = supabase
        .from('categorias_financeiras')
        .select('*')
        .or(`empresa_id.is.null,empresa_id.eq.${empresaId}`)
        .eq('ativo', true)
        .order('nome')

      if (tipo) {
        query = query.eq('tipo', tipo)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      throw error
    }
  }

  async getCategoriasCusto(userId: string): Promise<{ id: number; nome: string; tipo: string; descricao?: string }[]> {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome, tipo, descricao')
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .eq('tipo', 'CUSTO')
        .order('nome')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar categorias de custo:', error)
      throw error
    }
  }

  async getFormasPagamento(userId: string): Promise<{ id: number; nome: string; user_id?: string }[]> {
    try {
      console.log('Buscando formas de pagamento para usuário:', userId)
      
      // Busca formas globais (user_id IS NULL) e do usuário
      const { data: globais, error: errorGlobais } = await supabase
        .from('formas_pagamento')
        .select('id, nome, user_id')
        .is('user_id', null)
        .order('nome')
      
      if (errorGlobais) {
        console.error('Erro ao buscar formas globais:', errorGlobais)
        throw errorGlobais
      }

      const { data: proprias, error: errorProprias } = await supabase
        .from('formas_pagamento')
        .select('id, nome, user_id')
        .eq('user_id', userId)
        .order('nome')
      
      if (errorProprias) {
        console.error('Erro ao buscar formas próprias:', errorProprias)
        throw errorProprias
      }

      const resultado = [...(globais || []), ...(proprias || [])]
      console.log('Formas de pagamento encontradas:', resultado)
      return resultado
    } catch (error) {
      console.error('Erro ao buscar formas de pagamento:', error)
      throw error
    }
  }

  async adicionarFormaPagamento(nome: string, userId: string): Promise<{ id: number; nome: string; user_id: string }> {
    try {
      console.log('Adicionando forma de pagamento:', { nome, userId })
      
      const { data, error } = await supabase
        .from('formas_pagamento')
        .insert({ 
          nome: nome.trim(),
          user_id: userId 
        })
        .select()
        .single()
      
      if (error) {
        console.error('Erro do Supabase ao adicionar forma de pagamento:', error)
        throw error
      }
      
      console.log('Forma de pagamento adicionada com sucesso:', data)
      return data
    } catch (error) {
      console.error('Erro ao adicionar forma de pagamento:', error)
      throw error
    }
  }

  async getFornecedores(userId: string): Promise<{ id: number; nome: string; cnpj?: string; email?: string; telefone?: string; cidade?: string; estado?: string; user_id?: string }[]> {
    try {
      console.log('Buscando fornecedores para usuário:', userId)
      
      // Busca fornecedores globais (user_id IS NULL) e do usuário
      const { data: globais, error: errorGlobais } = await supabase
        .from('fornecedores')
        .select('id, nome, cnpj, email, telefone, cidade, estado, user_id')
        .is('user_id', null)
        .order('nome')
      
      if (errorGlobais) {
        console.error('Erro ao buscar fornecedores globais:', errorGlobais)
        throw errorGlobais
      }

      const { data: proprios, error: errorProprios } = await supabase
        .from('fornecedores')
        .select('id, nome, cnpj, email, telefone, cidade, estado, user_id')
        .eq('user_id', userId)
        .order('nome')
      
      if (errorProprios) {
        console.error('Erro ao buscar fornecedores próprios:', errorProprios)
        throw errorProprios
      }

      const resultado = [...(globais || []), ...(proprios || [])]
      console.log('Fornecedores encontrados:', resultado)
      return resultado
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error)
      throw error
    }
  }

  async adicionarFornecedor(fornecedor: {
    nome: string
    cnpj?: string
    email?: string
    telefone?: string
    endereco?: string
    cidade?: string
    estado?: string
    cep?: string
    observacoes?: string
  }, userId: string): Promise<{ id: number; nome: string; cnpj?: string; email?: string; telefone?: string; cidade?: string; estado?: string; user_id: string }> {
    try {
      console.log('Adicionando fornecedor:', { fornecedor, userId })
      
      const { data, error } = await supabase
        .from('fornecedores')
        .insert({ 
          ...fornecedor,
          user_id: userId 
        })
        .select()
        .single()
      
      if (error) {
        console.error('Erro do Supabase ao adicionar fornecedor:', error)
        throw error
      }
      
      console.log('Fornecedor adicionado com sucesso:', data)
      return data
    } catch (error) {
      console.error('Erro ao adicionar fornecedor:', error)
      throw error
    }
  }

  async criarCategoria(empresaId: string, categoria: Omit<CategoriaFinanceira, 'id' | 'empresa_id' | 'created_at' | 'updated_at'>): Promise<CategoriaFinanceira> {
    try {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .insert({
          empresa_id: empresaId,
          ...categoria
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      throw error
    }
  }

  // ===== RESUMO FINANCEIRO =====

  async getResumoFinanceiro(empresaId: string, mes: number, ano: number): Promise<ResumoFinanceiro> {
    try {
      const { data, error } = await supabase
        .rpc('calcular_resumo_financeiro', {
          p_empresa_id: empresaId,
          p_mes: mes,
          p_ano: ano
        })

      if (error) throw error
      
      return data?.[0] || {
        saldo_atual: 0,
        receitas_mes: 0,
        despesas_mes: 0,
        lucro_mes: 0,
        contas_pagar_total: 0,
        contas_receber_total: 0,
        fluxo_caixa_projetado: 0
      }
    } catch (error) {
      console.error('Erro ao buscar resumo financeiro:', error)
      throw error
    }
  }

  // ===== RELATÓRIOS =====

  async getRelatorioReceitasDespesas(empresaId: string, dataInicio: string, dataFim: string) {
    try {
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .select('tipo, categoria, valor, data')
        .eq('empresa_id', empresaId)
        .gte('data', dataInicio)
        .lte('data', dataFim)
        .eq('status', 'pago')

      if (error) throw error

      const receitas = data?.filter(t => t.tipo === 'receita') || []
      const despesas = data?.filter(t => t.tipo === 'despesa') || []

      return {
        receitas,
        despesas,
        totalReceitas: receitas.reduce((sum, r) => sum + r.valor, 0),
        totalDespesas: despesas.reduce((sum, d) => sum + d.valor, 0)
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      throw error
    }
  }

  async getContasVencidas(empresaId: string): Promise<{
    contasPagar: ContasPagar[]
    contasReceber: ContasReceber[]
  }> {
    try {
      const [contasPagarResult, contasReceberResult] = await Promise.all([
        this.getContasPagar(empresaId, { status: 'vencida' }),
        this.getContasReceber(empresaId, { status: 'vencida' })
      ])

      return {
        contasPagar: contasPagarResult,
        contasReceber: contasReceberResult
      }
    } catch (error) {
      console.error('Erro ao buscar contas vencidas:', error)
      throw error
    }
  }
}

export const financeiroService = new FinanceiroService() 