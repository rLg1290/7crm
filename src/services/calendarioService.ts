import { supabase } from '../lib/supabase'
import { logger } from '../utils/logger'

export interface Tarefa {
  id?: string
  empresa_id?: string
  usuario_id?: string
  titulo: string
  descricao?: string
  prioridade: 'alta' | 'media' | 'baixa'
  status: 'pendente' | 'em-andamento' | 'concluida' | 'cancelada'
  data_vencimento: string
  hora_vencimento?: string
  responsavel: string
  categoria: 'vendas' | 'atendimento' | 'administrativo' | 'reuniao' | 'viagem'
  cliente?: string
  notificacoes: boolean
  data_conclusao?: string
  created_at?: string
  updated_at?: string
}

export interface Compromisso {
  id?: string
  empresa_id?: string
  usuario_id?: string
  titulo: string
  tipo: 'reuniao' | 'ligacao' | 'atendimento' | 'viagem' | 'evento'
  data: string
  hora_inicio: string
  hora_fim: string
  local?: string
  participantes: string[]
  descricao?: string
  status: 'agendado' | 'confirmado' | 'cancelado' | 'realizado'
  cliente?: string
  data_conclusao?: string
  created_at?: string
  updated_at?: string
}

export class CalendarioService {
  // TAREFAS
  static async criarTarefa(tarefa: Omit<Tarefa, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const empresa_id = user.user_metadata?.empresa_id
      
      if (!empresa_id) {
        throw new Error('Empresa não encontrada no perfil do usuário')
      }

      const novaTarefa = {
        ...tarefa,
        empresa_id,
        usuario_id: user.id
      }

      const { data, error } = await supabase
        .from('tarefas')
        .insert([novaTarefa])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar tarefa:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro no serviço de criação de tarefa:', error)
      throw error
    }
  }

  static async listarTarefas(filtros?: {
    status?: string
    prioridade?: string
    data_inicio?: string
    data_fim?: string
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const empresa_id = user.user_metadata?.empresa_id
      
      if (!empresa_id) {
        logger.error('❌ Empresa ID não encontrado para listar tarefas')
        throw new Error('Empresa não encontrada no perfil do usuário')
      }

      logger.debug('🔍 Buscando tarefas para empresa', { empresa_id })

      let query = supabase
        .from('tarefas')
        .select('*')
        .eq('empresa_id', empresa_id)
        .order('data_vencimento', { ascending: true })
        .order('hora_vencimento', { ascending: true })

      // Aplicar filtros se fornecidos
      if (filtros?.status && filtros.status !== 'todos') {
        query = query.eq('status', filtros.status)
      }

      if (filtros?.prioridade && filtros.prioridade !== 'todas') {
        query = query.eq('prioridade', filtros.prioridade)
      }

      if (filtros?.data_inicio) {
        query = query.gte('data_vencimento', filtros.data_inicio)
      }

      if (filtros?.data_fim) {
        query = query.lte('data_vencimento', filtros.data_fim)
      }

      const { data, error } = await query

      if (error) {
        logger.error('Erro ao listar tarefas:', error)
        throw error
      }

      logger.debug('✅ Tarefas encontradas', { count: data?.length || 0 })
      return data || []
    } catch (error) {
      console.error('Erro no serviço de listagem de tarefas:', error)
      throw error
    }
  }

  static async atualizarTarefa(id: string, updates: Partial<Tarefa>) {
    try {
      if (updates.status === 'concluida' && !updates.data_conclusao) {
        updates.data_conclusao = new Date().toISOString()
      }
      
      if (updates.status !== 'concluida' && updates.data_conclusao) {
        updates.data_conclusao = undefined
      }

      const { data, error } = await supabase
        .from('tarefas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar tarefa:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro no serviço de atualização de tarefa:', error)
      throw error
    }
  }

  static async excluirTarefa(id: string) {
    try {
      const { error } = await supabase
        .from('tarefas')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao excluir tarefa:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Erro no serviço de exclusão de tarefa:', error)
      throw error
    }
  }

  // COMPROMISSOS
  static async criarCompromisso(compromisso: Omit<Compromisso, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const empresa_id = user.user_metadata?.empresa_id
      
      if (!empresa_id) {
        throw new Error('Empresa não encontrada no perfil do usuário')
      }

      const novoCompromisso = {
        ...compromisso,
        empresa_id,
        usuario_id: user.id
      }

      const { data, error } = await supabase
        .from('compromissos')
        .insert([novoCompromisso])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar compromisso:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro no serviço de criação de compromisso:', error)
      throw error
    }
  }

  static async listarCompromissos(filtros?: {
    status?: string
    tipo?: string
    data_inicio?: string
    data_fim?: string
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const empresa_id = user.user_metadata?.empresa_id
      
      if (!empresa_id) {
        logger.error('❌ Empresa ID não encontrado para listar compromissos')
        throw new Error('Empresa não encontrada no perfil do usuário')
      }

      // Substituir log verboso por logger.debug condicionado ao ambiente
      logger.debug('🔍 Buscando compromissos para empresa', { empresa_id })

      let query = supabase
        .from('compromissos')
        .select('*')
        .eq('empresa_id', empresa_id)
        .order('data', { ascending: true })
        .order('hora_inicio', { ascending: true })

      // Aplicar filtros se fornecidos
      if (filtros?.status && filtros.status !== 'todos') {
        query = query.eq('status', filtros.status)
      }

      if (filtros?.tipo && filtros.tipo !== 'todos') {
        query = query.eq('tipo', filtros.tipo)
      }

      if (filtros?.data_inicio) {
        query = query.gte('data', filtros.data_inicio)
      }

      if (filtros?.data_fim) {
        query = query.lte('data', filtros.data_fim)
      }

      const { data, error } = await query

      if (error) {
        logger.error('Erro ao listar compromissos:', error)
        throw error
      }

      logger.debug('✅ Compromissos encontrados', { count: data?.length || 0 })
      return data || []
    } catch (error) {
      console.error('Erro no serviço de listagem de compromissos:', error)
      throw error
    }
  }

  static async atualizarCompromisso(id: string, updates: Partial<Compromisso>) {
    try {
      if (updates.status === 'realizado' && !updates.data_conclusao) {
        updates.data_conclusao = new Date().toISOString()
      }
      
      if (updates.status !== 'realizado' && updates.data_conclusao) {
        updates.data_conclusao = undefined
      }

      const { data, error } = await supabase
        .from('compromissos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar compromisso:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro no serviço de atualização de compromisso:', error)
      throw error
    }
  }

  static async excluirCompromisso(id: string) {
    try {
      const { error } = await supabase
        .from('compromissos')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao excluir compromisso:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Erro no serviço de exclusão de compromisso:', error)
      throw error
    }
  }

  // LIMPEZA AUTOMÁTICA
  static async limparConcluidos() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { tarefasRemovidas: 0, compromissosRemovidos: 0 }
      }

      const empresa_id = user.user_metadata?.empresa_id
      
      if (!empresa_id) {
        console.error('❌ Empresa ID não encontrado para limpeza automática')
        return { tarefasRemovidas: 0, compromissosRemovidos: 0 }
      }

      const dataLimite = new Date()
      dataLimite.setHours(dataLimite.getHours() - 5)
      const dataLimiteISO = dataLimite.toISOString()

      const { data: tarefasRemovidas, error: errorTarefas } = await supabase
        .from('tarefas')
        .delete()
        .eq('empresa_id', empresa_id)
        .eq('status', 'concluida')
        .lt('data_conclusao', dataLimiteISO)
        .select('id')

      const { data: compromissosRemovidos, error: errorCompromissos } = await supabase
        .from('compromissos')
        .delete()
        .eq('empresa_id', empresa_id)
        .eq('status', 'realizado')
        .lt('data_conclusao', dataLimiteISO)
        .select('id')

      if (errorTarefas) console.error('Erro ao limpar tarefas:', errorTarefas)
      if (errorCompromissos) console.error('Erro ao limpar compromissos:', errorCompromissos)

      return {
        tarefasRemovidas: tarefasRemovidas?.length || 0,
        compromissosRemovidos: compromissosRemovidos?.length || 0
      }
    } catch (error) {
      console.error('Erro na limpeza automática:', error)
      return { tarefasRemovidas: 0, compromissosRemovidos: 0 }
    }
  }

  // ESTATÍSTICAS
  static async obterEstatisticas() {
    try {
      const [tarefas, compromissos] = await Promise.all([
        this.listarTarefas(),
        this.listarCompromissos()
      ])

      const hoje = new Date().toISOString().split('T')[0]

      return {
        tarefas: {
          pendentes: tarefas.filter(t => t.status === 'pendente').length,
          emAndamento: tarefas.filter(t => t.status === 'em-andamento').length,
          concluidas: tarefas.filter(t => t.status === 'concluida').length,
          urgentes: tarefas.filter(t => t.prioridade === 'alta' && t.status !== 'concluida').length
        },
        compromissos: {
          hoje: compromissos.filter(c => c.data === hoje).length,
          total: compromissos.filter(c => c.status !== 'realizado').length
        }
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      return {
        tarefas: { pendentes: 0, emAndamento: 0, concluidas: 0, urgentes: 0 },
        compromissos: { hoje: 0, total: 0 }
      }
    }
  }

  static async obterEventosDoMes(ano: number, mes: number) {
    try {
      const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`
      const dataFim = `${ano}-${String(mes).padStart(2, '0')}-31`

      const [tarefas, compromissos] = await Promise.all([
        this.listarTarefas({ data_inicio: dataInicio, data_fim: dataFim }),
        this.listarCompromissos({ data_inicio: dataInicio, data_fim: dataFim })
      ])

      return { tarefas, compromissos }
    } catch (error) {
      console.error('Erro ao obter eventos do mês:', error)
      throw error
    }
  }
}