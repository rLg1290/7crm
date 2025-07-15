import React, { useState, useEffect } from 'react'
import { User, Building, Mail, Save, ArrowLeft, Hash, FileText, Lock, Link, Copy, Check, Palette, Globe } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface EmpresaInfo {
  id: string
  nome: string
  cnpj: string
  codigo_agencia: string
  logotipo: string | null
  slug?: string
  cor_personalizada?: string
}

interface PerfilProps {
  user: SupabaseUser
}

const Perfil: React.FC<PerfilProps> = ({ user }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [empresaInfo, setEmpresaInfo] = useState<EmpresaInfo | null>(null)
  const [formData, setFormData] = useState({
    nome: user.user_metadata?.nome || '',
    empresa: user.user_metadata?.empresa || '',
    email: user.email || ''
  })
  
  // Estados para página pública
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [corPersonalizada, setCorPersonalizada] = useState('#3B82F6') // Azul padrão
  const [salvandoCor, setSalvandoCor] = useState(false)

  // Buscar informações da empresa
  useEffect(() => {
    const fetchEmpresaInfo = async () => {
      const empresaId = user.user_metadata?.empresa_id
      console.log('🏢 Carregando empresa para usuário:', { empresaId, user_metadata: user.user_metadata })
      
      if (empresaId) {
        try {
          const { data, error } = await supabase
            .from('empresas')
            .select('id, nome, cnpj, codigo_agencia, logotipo, slug, cor_personalizada')
            .eq('id', empresaId)
            .single()

          console.log('📥 Dados da empresa carregados:', { data, error })

          if (data && !error) {
            setEmpresaInfo(data)
            // Definir cor personalizada se existir
            if (data.cor_personalizada) {
              console.log('🎨 Cor personalizada encontrada:', data.cor_personalizada)
              setCorPersonalizada(data.cor_personalizada)
            } else {
              console.log('🎨 Nenhuma cor personalizada encontrada, usando padrão')
            }
          } else if (error) {
            console.error('❌ Erro ao carregar empresa:', error)
          }
        } catch (error) {
          console.error('💥 Erro inesperado ao carregar empresa:', error)
        }
      } else {
        console.log('❌ Empresa ID não encontrado nos metadados do usuário')
      }
    }

    fetchEmpresaInfo()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Atualizar apenas o nome do usuário (email e empresa não podem ser alterados)
      const { error } = await supabase.auth.updateUser({
        data: {
          nome: formData.nome,
          // Manter dados originais que não podem ser alterados
          empresa: user.user_metadata?.empresa,
          empresa_id: user.user_metadata?.empresa_id,
          codigo_agencia: user.user_metadata?.codigo_agencia
        }
      })

      if (error) {
        setMessage('Erro ao atualizar perfil: ' + error.message)
      } else {
        setMessage('Perfil atualizado com sucesso!')
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      }
    } catch (error) {
      setMessage('Erro inesperado ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Função para copiar link da página pública
  const copiarLink = async () => {
    if (!empresaInfo?.slug) return

    const baseUrl = window.location.origin
    const linkPublico = `${baseUrl}/orcamento/${empresaInfo.slug}`
    
    try {
      await navigator.clipboard.writeText(linkPublico)
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar link:', error)
    }
  }

  // Função para salvar cor personalizada
  const salvarCorPersonalizada = async () => {
    console.log('🎨 Iniciando salvamento da cor:', { 
      empresaInfo, 
      corPersonalizada,
      empresaId: empresaInfo?.id,
      userMetadata: user.user_metadata 
    })
    
    if (!empresaInfo?.id) {
      console.log('❌ Erro: empresaInfo.id não encontrado', empresaInfo)
      setMessage('Erro: Informações da empresa não encontradas')
      return
    }

    // Validar formato da cor
    const corRegex = /^#[0-9A-Fa-f]{6}$/
    if (!corRegex.test(corPersonalizada)) {
      console.log('❌ Formato de cor inválido:', corPersonalizada)
      setMessage('Erro: Formato de cor inválido. Use o formato #RRGGBB')
      return
    }

    setSalvandoCor(true)
    try {
      console.log('📤 Enviando para Supabase:', {
        cor_personalizada: corPersonalizada,
        empresa_id: empresaInfo.id,
        timestamp: new Date().toISOString()
      })

      // Primeiro, verificar se o registro existe
      const { data: empresaExistente, error: errorBusca } = await supabase
        .from('empresas')
        .select('id, nome, cor_personalizada')
        .eq('id', empresaInfo.id)
        .single()

      console.log('🔍 Empresa encontrada:', { empresaExistente, errorBusca })

      if (errorBusca && errorBusca.code === 'PGRST116') {
        // Empresa não encontrada - vamos criá-la
        console.log('⚠️ Empresa não encontrada, criando nova empresa...')
        
        const novaEmpresa = {
          id: empresaInfo.id,
          nome: empresaInfo.nome,
          cnpj: empresaInfo.cnpj,
          codigo_agencia: empresaInfo.codigo_agencia,
          cor_personalizada: corPersonalizada,
          created_at: new Date().toISOString()
        }

        const { data: empresaCriada, error: errorCriacao } = await supabase
          .from('empresas')
          .insert(novaEmpresa)
          .select()
          .single()

        console.log('📝 Resultado da criação:', { empresaCriada, errorCriacao })

        if (errorCriacao) {
          console.error('❌ Erro ao criar empresa:', errorCriacao)
          setMessage('Erro ao criar registro da empresa: ' + errorCriacao.message)
          return
        }

        console.log('✅ Empresa criada e cor salva com sucesso!')
        setMessage('Empresa criada e cor personalizada salva com sucesso!')
        setTimeout(() => setMessage(''), 3000)
        
        // Atualizar o estado local da empresa
        setEmpresaInfo(prev => prev ? { ...prev, cor_personalizada: corPersonalizada } : prev)
        return
      } else if (errorBusca) {
        console.error('❌ Erro ao buscar empresa:', errorBusca)
        setMessage('Erro ao buscar dados da empresa: ' + errorBusca.message)
        return
      }

      // Executar o update
      const { data, error, count } = await supabase
        .from('empresas')
        .update({ 
          cor_personalizada: corPersonalizada,
          updated_at: new Date().toISOString()
        })
        .eq('id', empresaInfo.id)
        .select('id, nome, cor_personalizada')

      console.log('📥 Resposta do update:', { 
        data, 
        error, 
        count,
        dataLength: data?.length,
        updatedData: data?.[0]
      })

      if (error) {
        console.error('❌ Erro do Supabase no update:', error)
        setMessage('Erro ao salvar cor personalizada: ' + error.message)
        return
      }

      if (!data || data.length === 0) {
        console.error('❌ Nenhum registro foi atualizado')
        setMessage('Erro: Nenhum registro foi atualizado. Verifique as permissões.')
        return
      }

      // Verificar se a cor foi realmente salva
      const corSalva = data[0]?.cor_personalizada
             console.log('🔍 Verificando cor salva:', { 
         corEnviada: corPersonalizada,
         corSalva: corSalva,
         iguais: corPersonalizada === corSalva
       })

      if (corSalva !== corPersonalizada) {
        console.error('❌ Cor não foi salva corretamente:', { corEnviada: corPersonalizada, corSalva })
        setMessage('Erro: A cor não foi salva corretamente no banco de dados')
        return
      }

      console.log('✅ Cor salva com sucesso!', data[0])
      setMessage('Cor personalizada salva com sucesso!')
      setTimeout(() => setMessage(''), 3000)
      
      // Atualizar o estado local da empresa
      setEmpresaInfo(prev => prev ? { ...prev, cor_personalizada: corPersonalizada } : prev)

      // Verificação adicional - buscar novamente para confirmar
      setTimeout(async () => {
        const { data: verificacao } = await supabase
          .from('empresas')
          .select('cor_personalizada')
          .eq('id', empresaInfo.id)
          .single()
        
        console.log('🔍 Verificação final:', { 
          corEsperada: corPersonalizada,
          corNoBanco: verificacao?.cor_personalizada,
          sucesso: verificacao?.cor_personalizada === corPersonalizada
        })
      }, 1000)

    } catch (error) {
      console.error('💥 Erro inesperado:', error)
      setMessage('Erro inesperado ao salvar cor: ' + (error as Error).message)
    } finally {
      setSalvandoCor(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </button>
          
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg border border-blue-200">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="text-gray-600 mt-1">Gerencie suas informações pessoais</p>
            </div>
          </div>
        </div>

        {/* Informações da Empresa */}
        {empresaInfo && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Informações da Agência
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex items-center mb-2">
                  <Building className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-800">Nome da Agência:</span>
                </div>
                <div className="flex items-center">
                  {empresaInfo.logotipo && (
                    <img 
                      src={empresaInfo.logotipo} 
                      alt={`Logo ${empresaInfo.nome}`}
                      className="w-10 h-10 rounded-lg object-cover mr-3 border border-gray-200"
                      onError={(e) => {
                        // Fallback se a imagem não carregar
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <p className="text-gray-900 font-semibold">{empresaInfo.nome}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex items-center mb-2">
                  <Hash className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-800">Código da Agência:</span>
                </div>
                <p className="text-gray-900 font-semibold">{empresaInfo.codigo_agencia}</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-blue-100 md:col-span-2">
                <div className="flex items-center mb-2">
                  <FileText className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-800">CNPJ:</span>
                </div>
                <p className="text-gray-900 font-semibold">{empresaInfo.cnpj}</p>
              </div>
            </div>
          </div>
        )}

        {/* Página Pública de Solicitação de Orçamento */}
        {empresaInfo && empresaInfo.slug && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-green-600" />
                Página Pública de Captação de Leads
              </h3>
              <p className="text-gray-600 mb-6">
                Sua agência possui uma página personalizada onde clientes podem solicitar orçamentos diretamente. 
                Compartilhe o link abaixo com seus clientes.
              </p>

              {/* Link da Página Pública */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Link className="h-4 w-4 inline mr-1" />
                  Link da Página Pública
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-700">
                    {window.location.origin}/orcamento/{empresaInfo.slug}
                  </div>
                  <button
                    onClick={copiarLink}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      linkCopiado 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {linkCopiado ? (
                      <>
                        <Check className="h-4 w-4 inline mr-1" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 inline mr-1" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Personalização de Cor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Palette className="h-4 w-4 inline mr-1" />
                    Cor Personalizada da Página
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={corPersonalizada}
                      onChange={(e) => setCorPersonalizada(e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={corPersonalizada}
                        onChange={(e) => setCorPersonalizada(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prévia da Cor
                  </label>
                  <div 
                    className="w-full h-10 rounded-lg border border-gray-300 flex items-center justify-center text-white font-medium text-sm"
                    style={{ backgroundColor: corPersonalizada }}
                  >
                    Sua Cor Personalizada
                  </div>
                </div>
              </div>

              {/* Botão Salvar Cor */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={salvarCorPersonalizada}
                  disabled={salvandoCor}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {salvandoCor ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Palette className="h-4 w-4 mr-2" />
                  )}
                  {salvandoCor ? 'Salvando...' : 'Salvar Cor'}
                </button>
              </div>

              {/* Informações Adicionais */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800 font-medium">Como funciona?</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Quando um cliente acessa seu link personalizado e preenche o formulário, 
                      um novo lead é automaticamente criado em seu sistema CRM na coluna "LEAD". 
                      A cor personalizada será aplicada ao design da página.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulário */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Dados Pessoais</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome - Editável */}
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>
              </div>

              {/* Email - Não Editável */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Lock className="h-3 w-3 mr-1" />
                    Não Editável
                  </span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    placeholder="seu@email.com"
                    disabled
                    readOnly
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  O email não pode ser alterado por questões de segurança.
                </p>
              </div>

              {/* Nome da Agência - Não Editável */}
              <div>
                <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Agência
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Lock className="h-3 w-3 mr-1" />
                    Não Editável
                  </span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="empresa"
                    name="empresa"
                    value={formData.empresa}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    placeholder="Nome da sua empresa"
                    disabled
                    readOnly
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  A agência está vinculada ao seu código de acesso e não pode ser alterada.
                </p>
              </div>

              {/* Mensagem */}
              {message && (
                <div className={`p-4 rounded-lg ${
                  message.includes('sucesso') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              {/* Botão Salvar */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-5 w-5 mr-2" />
                  )}
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Informações Adicionais da Conta */}
        <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📋 Informações da Conta
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Data de Cadastro:</span>
              <p className="text-gray-600">
                {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Último Login:</span>
              <p className="text-gray-600">
                {new Date(user.last_sign_in_at || user.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status da Conta:</span>
              <p className="text-green-600 font-medium">Ativa</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tipo de Usuário:</span>
              <p className="text-gray-600">Agência de Turismo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Perfil 