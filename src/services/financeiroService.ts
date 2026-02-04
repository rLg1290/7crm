import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

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
  categoria_id: number
  fornecedor_id?: number
  forma_pagamento_id?: number | null;
  valor: number
  parcelas: string
  vencimento: string
  status: string
  observacoes?: string
  origem: string
  origem_id?: string
  user_id: string
  empresa_id?: string
  created_at: string
}

export interface ContasReceber {
  id: string
  empresa_id?: string
  cliente_id?: string
  fornecedor_id?: number
  cliente_nome: string
  categoria_id?: number
  descricao: string
  servico: string
  valor: number
  vencimento: string
  status: 'recebida' | 'pendente' | 'vencida'
  data_recebimento?: string
  forma_recebimento?: string
  observacoes?: string
  comprovante_url?: string
  origem?: string
  origem_id?: string
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
  categoria_id: number
  fornecedor_id?: number
  forma_pagamento_id: number
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
  fornecedor_id?: number
  cliente_nome: string
  categoria_id?: number
  descricao: string
  servico: string
  valor: number
  vencimento: string
  status?: 'recebida' | 'pendente' | 'vencida'
  data_recebimento?: string
  forma_recebimento?: string
  observacoes?: string
  comprovante_url?: string
  origem?: string
  origem_id?: string
}

class FinanceiroService {
  // ===== Helpers =====
  private async resolveEmpresaId(userId: string): Promise<string | null> {
    try {
      const { data: auth } = await supabase.auth.getUser()
      const metaEmpresaId = auth?.user?.user_metadata?.empresa_id as string | undefined
      if (metaEmpresaId) return metaEmpresaId
    } catch (e) {
      logger.warn('resolveEmpresaId: falha ao obter user_metadata', { error: String(e) })
    }

    const { data, error } = await supabase
      .from('usuarios_empresas')
      .select('empresa_id')
      .eq('usuario_id', userId)
      .limit(1)

    if (error) {
      logger.warn('resolveEmpresaId: erro ao consultar usuarios_empresas', { message: (error as any)?.message })
      return null
    }

    const empresaId = Array.isArray(data) && data.length ? (data[0] as any)?.empresa_id : null
    return empresaId ?? null
  }

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
      logger.error('Erro ao buscar transações:', error)
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
      logger.error('Erro ao criar transação:', error)
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
      logger.error('Erro ao atualizar transação:', error)
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
      logger.error('Erro ao deletar transação:', error)
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
      // Resolve empresa do usuário para buscar contas da empresa (não apenas do usuário)
      // Buscar contas vinculadas à empresa (via empresa_id) OU ao usuário (via user_id)
      const empresaId = await this.resolveEmpresaId(userId)
      logger.debug('🔍 Buscando contas a pagar', { userId, empresaId, filtrosSet: Boolean(filtros) })
      
      let query = supabase
        .from('contas_pagar')
        .select('*')
        .order('vencimento', { ascending: true })

      // Modificado para usar filtro OR se empresaId existir
      if (empresaId) {
        query = query.or(`empresa_id.eq.${empresaId},user_id.eq.${userId}`)
      } else {
        query = query.eq('user_id', userId)
      }

      console.log('🔍 [SERVICE] getContasPagar query construída', { filtros })

      if (filtros?.status) {
        // Status check case-insensitive workaround for PostgreSQL
        if (filtros.status.toUpperCase() === 'PENDENTE') {
             query = query.ilike('status', 'pendente')
        } else if (filtros.status.toUpperCase() === 'PAGA') {
             query = query.ilike('status', 'paga')
        } else if (filtros.status.toUpperCase() === 'VENCIDA') {
             query = query.ilike('status', 'vencida')
        } else {
             query = query.eq('status', filtros.status)
        }
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

      console.log('✅ [SERVICE] getContasPagar resultado:', { count: data?.length, error, data })

      if (error) {
        logger.error('Erro do Supabase ao buscar contas a pagar:', error)
        throw error
      }
      
      logger.debug('✅ Contas a pagar encontradas', { count: (data as any)?.length || 0 })
      return data || []
    } catch (error) {
      logger.error('Erro ao buscar contas a pagar:', error)
      throw error
    }
  }

  async criarContaPagar(userId: string, conta: NovaContaPagar): Promise<ContasPagar> {
    try {
      logger.debug('Criando conta a pagar', { userId, conta })
      logger.debug('Status recebido', { status: conta.status })
        logger.debug('Status após fallback', { status: conta.status || 'PENDENTE' })
      
      // Buscar empresa_id do usuário através do helper (obrigatório)
      const empresaId = await this.resolveEmpresaId(userId)
      logger.debug('empresa_id obtido para criar conta a pagar', { empresaId })

      if (!empresaId) {
        throw new Error('Não foi possível identificar a empresa do usuário. Contas a pagar devem ser sempre vinculadas por empresa_id. Vincule o usuário em usuarios_empresas ou defina empresa_id no user_metadata.')
      }
      
      const dadosParaInserir: any = {
        user_id: userId,
        empresa_id: empresaId,
        ...conta,
        status: conta.status || 'PENDENTE',
        origem: conta.origem || 'MANUAL'
      }
      
      logger.debug('Dados que serão inseridos no banco', { dados: dadosParaInserir })
      
      const { data, error } = await supabase
        .from('contas_pagar')
        .insert(dadosParaInserir)
        .select()
        .single()

      if (error) {
        logger.error('Erro do Supabase ao criar conta a pagar:', error)
        logger.error('Detalhes do erro', { message: (error as any).message, details: (error as any).details, hint: (error as any).hint })
        throw error
      }
      
      logger.debug('Conta a pagar criada com sucesso', { id: (data as any)?.id, status: (data as any)?.status })
      return data as any
    } catch (error) {
      logger.error('Erro ao criar conta a pagar:', error)
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
      logger.error('Erro ao atualizar conta a pagar:', error)
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
      logger.error('Erro ao marcar conta como paga:', error)
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
      logger.error('Erro ao deletar conta a pagar:', error)
      throw error
    }
  }

  // ===== CONTAS A RECEBER =====

  async getContasReceber(empresaId: string, filtros?: {
    status?: string
    vencimentoInicio?: string
    vencimentoFim?: string
    servico?: string
  }, userId?: string): Promise<ContasReceber[]> {
    try {
      logger.debug('🔍 Buscando contas a receber', { empresaId, userId, filtrosSet: Boolean(filtros) })
      
      let query = supabase
        .from('contas_receber')
        .select('*')
        .order('vencimento', { ascending: true })

      // Modificado para usar filtro OR se userId for fornecido
      if (userId && empresaId) {
         query = query.or(`empresa_id.eq.${empresaId},user_id.eq.${userId}`)
      } else if (empresaId) {
         query = query.eq('empresa_id', empresaId)
      } else if (userId) {
         query = query.eq('user_id', userId)
      }

      console.log('🔍 [SERVICE] getContasReceber query construída', { filtros })

      if (filtros?.status) {
        // Status check case-insensitive workaround for PostgreSQL
        if (filtros.status.toUpperCase() === 'PENDENTE') {
             query = query.ilike('status', 'pendente')
        } else if (filtros.status.toUpperCase() === 'RECEBIDA') {
             query = query.ilike('status', 'recebida')
        } else if (filtros.status.toUpperCase() === 'VENCIDA') {
             query = query.ilike('status', 'vencida')
        } else {
             query = query.eq('status', filtros.status)
        }
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

      console.log('✅ [SERVICE] getContasReceber resultado:', { count: data?.length, error, data })

      if (error) {
        logger.error('Erro do Supabase ao buscar contas a receber:', error)
        throw error
      }
      
      logger.debug('✅ Contas a receber encontradas', { count: (data as any)?.length || 0 })
      return data || []
    } catch (error) {
      logger.error('Erro ao buscar contas a receber:', error)
      throw error
    }
  }

  async criarContaReceber(empresaId: string, conta: NovaContaReceber): Promise<ContasReceber> {
    try {
      logger.debug('Criando conta a receber', { empresaId, conta })
      
      const { data, error } = await supabase
        .from('contas_receber')
        .insert({
          empresa_id: empresaId,
          ...conta,
          status: conta.status || 'pendente',
          origem: conta.origem || 'MANUAL'
        })
        .select()
        .single()

      if (error) {
        logger.error('Erro do Supabase ao criar conta a receber:', error)
        throw error
      }
      
      logger.debug('Conta a receber criada com sucesso', { id: (data as any)?.id, status: (data as any)?.status })
      return data
    } catch (error) {
      logger.error('Erro ao criar conta a receber:', error)
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
      logger.error('Erro ao atualizar conta a receber:', error)
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
      logger.error('Erro ao marcar conta como recebida:', error)
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
      logger.error('Erro ao deletar conta a receber:', error)
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
      logger.error('Erro ao buscar categorias:', error)
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
      logger.error('Erro ao buscar categorias de custo:', error)
      throw error
    }
  }

  async getCategoriasVenda(userId: string): Promise<{ id: number; nome: string; tipo: string; descricao?: string }[]> {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome, tipo, descricao')
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .eq('tipo', 'VENDA')
        .order('nome')

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Erro ao buscar categorias de venda:', error)
      throw error
    }
  }

  async getCategoriasComissaoVenda(userId: string): Promise<{ id: number; nome: string; tipo: string; descricao?: string }[]> {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome, tipo, descricao')
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .eq('tipo', 'COMISSAOVENDA')
        .order('nome')

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Erro ao buscar categorias de comissão de venda:', error)
      throw error
    }
  }

  async getCategoriasComissaoCusto(userId: string): Promise<{ id: number; nome: string; tipo: string; descricao?: string }[]> {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome, tipo, descricao')
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .eq('tipo', 'COMISSAOCUSTO')
        .order('nome')

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error('Erro ao buscar categorias de comissão de custo:', error)
      throw error
    }
  }

  async getFormasPagamento(userId: string): Promise<{ id: number; nome: string; user_id?: string }[]> {
    try {
      logger.debug('Buscando formas de pagamento para usuário:', { userId })
      
      // Busca formas globais (user_id IS NULL) e do usuário
      const { data: globais, error: errorGlobais } = await supabase
        .from('formas_pagamento')
        .select('id, nome, user_id')
        .is('user_id', null)
        .order('nome')
      
      if (errorGlobais) {
        logger.error('Erro ao buscar formas globais:', errorGlobais)
        throw errorGlobais
      }

      const { data: proprias, error: errorProprias } = await supabase
        .from('formas_pagamento')
        .select('id, nome, user_id')
        .eq('user_id', userId)
        .order('nome')
      
      if (errorProprias) {
        logger.error('Erro ao buscar formas próprias:', errorProprias)
        throw errorProprias
      }

      const resultado = [...(globais || []), ...(proprias || [])]
      logger.debug('Formas de pagamento encontradas:', { total: resultado.length })
      return resultado
    } catch (error) {
      logger.error('Erro ao buscar formas de pagamento:', error)
      throw error
    }
  }

  async adicionarFormaPagamento(nome: string, userId: string): Promise<{ id: number; nome: string; user_id: string }> {
    try {
      logger.debug('Adicionando forma de pagamento:', { nome, userId })
      
      const { data, error } = await supabase
        .from('formas_pagamento')
        .insert({ 
          nome: nome.trim(),
          user_id: userId 
        })
        .select()
        .single()
      
      if (error) {
        logger.error('Erro do Supabase ao adicionar forma de pagamento:', error)
        throw error
      }
      
      logger.debug('Forma de pagamento adicionada com sucesso:', { id: data?.id, nome: data?.nome })
      return data
    } catch (error) {
      logger.error('Erro ao adicionar forma de pagamento:', error)
      throw error
    }
  }

  async getFornecedores(userId: string): Promise<{ id: number; nome: string; cnpj?: string; email?: string; telefone?: string; empresa_id?: string }[]> {
    try {
      logger.debug('Iniciando busca de fornecedores para usuário:', { userId })
      // Resolver a empresa do usuário sem usar .single()
      logger.debug('Resolvendo empresa do usuário...')
      const empresaId = await this.resolveEmpresaId(userId)
      if (!empresaId) {
        logger.warn('Empresa do usuário não encontrada. Carregando apenas fornecedores globais.', { userId })
      }

      // Busca fornecedores globais (empresa_id IS NULL)
      logger.debug('Buscando fornecedores globais...')
      const { data: globais, error: errorGlobais } = await supabase
        .from('fornecedores')
        .select('id, nome, cnpj, email, telefone, empresa_id')
        .is('empresa_id', null)
        .order('nome')

      if (errorGlobais) {
        logger.error('Erro ao buscar fornecedores globais:', errorGlobais)
        throw errorGlobais
      }

      // Busca fornecedores da empresa do usuário, somente se empresaId existir
      logger.debug('Buscando fornecedores da empresa...', { empresaId })
      let daEmpresa: { id: number; nome: string; cnpj?: string; email?: string; telefone?: string; empresa_id?: string }[] = []
      if (empresaId) {
        const { data: daEmp, error: errorFornecedoresEmpresa } = await supabase
          .from('fornecedores')
          .select('id, nome, cnpj, email, telefone, empresa_id')
          .eq('empresa_id', empresaId)
          .order('nome')

        if (errorFornecedoresEmpresa) {
          logger.error('Erro ao buscar fornecedores da empresa:', errorFornecedoresEmpresa)
          throw errorFornecedoresEmpresa
        }

        daEmpresa = daEmp || []
      } else {
        logger.debug('Sem empresaId, pulando busca de fornecedores da empresa.')
      }

      // Combina os resultados
      const resultado = [...(globais || []), ...(daEmpresa || [])]
      logger.debug('Total de fornecedores combinados:', { total: resultado.length })
      return resultado
    } catch (error) {
      logger.error('Erro ao buscar fornecedores:', error)
      throw error
    }
  }

      async adicionarFornecedor(fornecedor: {
        nome: string
        cnpj?: string
        email?: string
        telefone?: string
      }, userId: string): Promise<{ id: number; nome: string; cnpj?: string; email?: string; telefone?: string; empresa_id: string }> {
        try {
          logger.debug('Adicionando fornecedor:', { fornecedor, userId })
          
          // Validar dados obrigatórios
          if (!fornecedor.nome || fornecedor.nome.trim() === '') {
            throw new Error('Nome do fornecedor é obrigatório')
          }
          
          // Resolver a empresa do usuário de forma robusta
          logger.debug('Resolvendo empresa do usuário...')
          const empresaId = await this.resolveEmpresaId(userId)
          if (!empresaId) {
            throw new Error('Não foi possível identificar a empresa do usuário. Vincule o usuário a uma empresa (usuarios_empresas) ou defina empresa_id no user_metadata.')
          }
          
          console.log('✅ [SERVICE] Empresa do usuário:', empresaId)
          
          const dadosFornecedor = {
            nome: fornecedor.nome.trim(),
            cnpj: fornecedor.cnpj?.trim() || null,
            email: fornecedor.email?.trim() || null,
            telefone: fornecedor.telefone?.trim() || null,
            empresa_id: empresaId
          }
          
          console.log('🔧 [SERVICE] Dados a serem inseridos:', dadosFornecedor)
          
          const { data, error } = await supabase
            .from('fornecedores')
            .insert(dadosFornecedor)
            .select('id, nome, cnpj, email, telefone, empresa_id')
            .single()
          
          if (error) {
            console.error('❌ [SERVICE] Erro do Supabase ao adicionar fornecedor:', error)
            console.error('❌ [SERVICE] Detalhes do erro:', {
              message: (error as any).message,
              details: (error as any).details,
              hint: (error as any).hint,
              code: (error as any).code
            })
            throw error
          }
          
          console.log('✅ [SERVICE] Fornecedor adicionado com sucesso:', data)
          return data
        } catch (error) {
          console.error('❌ [SERVICE] Erro ao adicionar fornecedor:', error)
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
          // Obter userId atual para reutilizar o helper de resolução de empresa em getContasPagar
          const { data: auth } = await supabase.auth.getUser()
          const userId = auth?.user?.id || ''

          const [contasPagarResult, contasReceberResult] = await Promise.all([
            // Para contas a pagar usamos status em MAIÚSCULAS (conforme UI/DB)
            this.getContasPagar(userId || empresaId, { status: 'VENCIDA' }),
            // Para contas a receber mantemos o status em minúsculas (conforme modelo)
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