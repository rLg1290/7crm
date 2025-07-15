import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Wrench, Database, Calendar, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const TesteLogin = () => {
  const [resultado, setResultado] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const testarTabelasCalendario = async () => {
    setLoading(true)
    setResultado('Testando tabelas do calendário...')
    
    try {
      console.log('📅 Verificando se tabelas tarefas e compromissos existem...')
      
      // Teste 1: Verificar se tabela tarefas existe
      const { data: tarefasTest, error: tarefasError } = await supabase
        .from('tarefas')
        .select('*')
        .limit(1)
      
      if (tarefasError) {
        console.error('❌ Erro ao consultar tabela tarefas:', tarefasError)
        setResultado(`❌ Tabela tarefas não existe ou tem erro: ${tarefasError.message}
        
SOLUÇÃO: Execute o script supabase_calendario_tables.sql no SQL Editor do Supabase`)
        return
      }
      
      console.log('✅ Tabela tarefas existe e é acessível')
      
      // Teste 2: Verificar se tabela compromissos existe  
      const { data: compromissosTest, error: compromissosError } = await supabase
        .from('compromissos')
        .select('*')
        .limit(1)
      
      if (compromissosError) {
        console.error('❌ Erro ao consultar tabela compromissos:', compromissosError)
        setResultado(`❌ Tabela compromissos não existe ou tem erro: ${compromissosError.message}
        
SOLUÇÃO: Execute o script supabase_calendario_tables.sql no SQL Editor do Supabase`)
        return
      }
      
      console.log('✅ Tabela compromissos existe e é acessível')
      
      setResultado(`✅ Todas as tabelas do calendário existem!
      
Tabela tarefas: ✅ Acessível
Tabela compromissos: ✅ Acessível
Registros encontrados:
- Tarefas: ${tarefasTest?.length || 0}
- Compromissos: ${compromissosTest?.length || 0}`)
      
    } catch (error) {
      console.error('💥 Erro inesperado:', error)
      setResultado(`💥 Erro inesperado: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testarCriarTarefaDireta = async () => {
    setLoading(true)
    setResultado('Testando criação de tarefa diretamente...')
    
    try {
      console.log('📝 Testando criação de tarefa...')
      
      // Verificar se usuário está logado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setResultado(`❌ Usuário não está logado!
        
Para testar criação de tarefas, você precisa:
1. Fazer login no sistema principal primeiro
2. Voltar aqui para testar`)
        return
      }
      
      console.log('✅ Usuário logado:', user.email)
      console.log('📋 Metadados do usuário:', user.user_metadata)
      
      // Verificar se tem empresa_id
      if (!user.user_metadata?.empresa_id) {
        setResultado(`❌ Usuário não tem empresa_id nos metadados!
        
Dados do usuário:
- Email: ${user.email}
- Metadados: ${JSON.stringify(user.user_metadata, null, 2)}
        
PROBLEMA: O usuário foi criado sem empresa_id vinculada.`)
        return
      }
      
      // Tentar criar tarefa diretamente via Supabase
      const novaTarefa = {
        titulo: `Tarefa Teste ${Date.now()}`,
        descricao: 'Tarefa de teste criada automaticamente',
        prioridade: 'media',
        status: 'pendente',
        data_vencimento: new Date().toISOString().split('T')[0],
        hora_vencimento: '14:00',
        responsavel: 'Sistema de Teste',
        categoria: 'administrativo',
        notificacoes: true,
        empresa_id: user.user_metadata.empresa_id,
        usuario_id: user.id
      }
      
      console.log('📝 Criando tarefa:', novaTarefa)
      
      const { data: tarefaCriada, error: erroTarefa } = await supabase
        .from('tarefas')
        .insert([novaTarefa])
        .select()
        .single()
      
      if (erroTarefa) {
        console.error('❌ Erro ao criar tarefa:', erroTarefa)
        setResultado(`❌ Erro ao criar tarefa: ${erroTarefa.message}
        
Código: ${erroTarefa.code}
Detalhes: ${erroTarefa.details}
Dica: ${erroTarefa.hint}`)
        return
      }
      
      console.log('✅ Tarefa criada com sucesso:', tarefaCriada)
      
      setResultado(`✅ Tarefa criada com sucesso!
      
Usuário: ${user.email}
Empresa ID: ${user.user_metadata.empresa_id}
Tarefa ID: ${tarefaCriada.id}
Título: ${tarefaCriada.titulo}`)
      
    } catch (error) {
      console.error('❌ Erro ao criar tarefa:', error)
      setResultado(`❌ Erro ao criar tarefa: ${error}
      
Detalhes completos no Console (F12)`)
    } finally {
      setLoading(false)
    }
  }

  const testarCriarCompromissoDireto = async () => {
    setLoading(true)
    setResultado('Testando criação de compromisso diretamente...')
    
    try {
      console.log('📅 Testando criação de compromisso...')
      
      // Verificar se usuário está logado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setResultado(`❌ Usuário não está logado!
        
Para testar criação de compromissos, você precisa:
1. Fazer login no sistema principal primeiro
2. Voltar aqui para testar`)
        return
      }
      
      if (!user.user_metadata?.empresa_id) {
        setResultado(`❌ Usuário não tem empresa_id nos metadados!`)
        return
      }
      
      // Tentar criar compromisso diretamente via Supabase
      const novoCompromisso = {
        titulo: `Reunião Teste ${Date.now()}`,
        tipo: 'reuniao',
        data: new Date().toISOString().split('T')[0],
        hora_inicio: '14:00',
        hora_fim: '15:00',
        local: 'Sala de Reuniões',
        participantes: ['João Silva', 'Maria Santos'],
        descricao: 'Compromisso de teste criado automaticamente',
        status: 'agendado',
        empresa_id: user.user_metadata.empresa_id,
        usuario_id: user.id
      }
      
      console.log('📅 Criando compromisso:', novoCompromisso)
      
      const { data: compromissoCriado, error: erroCompromisso } = await supabase
        .from('compromissos')
        .insert([novoCompromisso])
        .select()
        .single()
      
      if (erroCompromisso) {
        console.error('❌ Erro ao criar compromisso:', erroCompromisso)
        setResultado(`❌ Erro ao criar compromisso: ${erroCompromisso.message}
        
Código: ${erroCompromisso.code}
Detalhes: ${erroCompromisso.details}
Dica: ${erroCompromisso.hint}`)
        return
      }
      
      console.log('✅ Compromisso criado com sucesso:', compromissoCriado)
      
      setResultado(`✅ Compromisso criado com sucesso!
      
Usuário: ${user.email}
Compromisso ID: ${compromissoCriado.id}
Título: ${compromissoCriado.titulo}
Data: ${compromissoCriado.data}`)
      
    } catch (error) {
      console.error('❌ Erro ao criar compromisso:', error)
      setResultado(`❌ Erro ao criar compromisso: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-blue-200 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Voltar ao Sistema</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <img 
                src="https://ethmgnxyrgpkzgmkocwk.supabase.co/storage/v1/object/public/logos//logoAuth.png"
                alt="7C Logo"
                className="h-8 w-auto"
              />
              <span className="text-white font-medium">Sistema de Diagnóstico</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex items-center justify-center p-4 py-12">
        <div className="max-w-4xl w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
            
            {/* Header da Página */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                <Wrench className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                🔧 Diagnóstico do Sistema
              </h1>
              <p className="text-blue-100">
                Ferramentas de teste para verificar a integridade do sistema
              </p>
            </div>
            
            {/* Botões de Teste */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={testarTabelasCalendario}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg"
              >
                <Database className="h-5 w-5" />
                <span>{loading ? 'Testando...' : 'Verificar Tabelas'}</span>
              </button>

              <button
                onClick={testarCriarTarefaDireta}
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg"
              >
                <CheckCircle className="h-5 w-5" />
                <span>{loading ? 'Testando...' : 'Criar Tarefa'}</span>
              </button>

              <button
                onClick={testarCriarCompromissoDireto}
                disabled={loading}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg"
              >
                <Calendar className="h-5 w-5" />
                <span>{loading ? 'Testando...' : 'Criar Compromisso'}</span>
              </button>
            </div>

            {/* Resultado */}
            {resultado && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-6">
                <h3 className="font-medium text-white mb-3 flex items-center space-x-2">
                  <Wrench className="h-5 w-5" />
                  <span>Resultado do Teste:</span>
                </h3>
                <pre className="text-sm text-blue-100 whitespace-pre-wrap bg-black/20 rounded-lg p-4 border border-white/10">{resultado}</pre>
              </div>
            )}

            {/* Instruções */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6">
                <h3 className="font-medium text-white mb-3 flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Ordem Recomendada dos Testes:</span>
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-blue-100">
                  <li>Verificar se as tabelas do calendário existem</li>
                  <li>Fazer login no sistema principal</li>
                  <li>Voltar aqui e testar criação de tarefa</li>
                  <li>Testar criação de compromisso</li>
                  <li>Abrir Console (F12) para logs detalhados</li>
                </ol>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-6">
                <h3 className="font-medium text-white mb-3 flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <span>Importante:</span>
                </h3>
                <p className="text-yellow-100">
                  Para testar criação de tarefas/compromissos, faça login primeiro no sistema principal!
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-blue-200 text-sm">
                © 2024 7C Sistemas - Ferramentas de Diagnóstico
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TesteLogin