import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Mail, Lock, User, Building, Hash, Shield, CheckCircle, ArrowLeft } from 'lucide-react'

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nome: '',
    empresa: '',
    codigoAgencia: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Permitir letras e números para código de agência (até 9 caracteres)
    if (name === 'codigoAgencia') {
      const alphanumericValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 9)
      setFormData(prev => ({ ...prev, [name]: alphanumericValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const validateCodigoAgencia = async (codigo: string) => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('codigo_agencia', codigo)
        .eq('ativo', true)
        .single()

      if (error || !data) {
        return { valid: false, empresa: null }
      }

      return { valid: true, empresa: data }
    } catch (error) {
      return { valid: false, empresa: null }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isRecovery) {
        // Recuperação de senha
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) {
          setMessage('Erro ao enviar email de recuperação: ' + error.message)
        } else {
          setMessage('Email de recuperação enviado! Verifique sua caixa de entrada.')
        }
      } else if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) {
          setMessage('Erro no login: ' + error.message)
        }
      } else {
        // Cadastro - Validar código de agência primeiro
        if (!formData.codigoAgencia) {
          setMessage('Código de Agência é obrigatório')
          setLoading(false)
          return
        }

        const { valid, empresa } = await validateCodigoAgencia(formData.codigoAgencia)
        
        if (!valid) {
          setMessage('Código de Agência inválido. Verifique com o administrador.')
          setLoading(false)
          return
        }

        // Cadastrar usuário
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              nome: formData.nome,
              empresa: empresa?.nome,
              empresa_id: empresa?.id,
              codigo_agencia: formData.codigoAgencia
            }
          }
        })

        if (error) {
          setMessage('Erro no cadastro: ' + error.message)
        } else {
          setMessage('Cadastro realizado com sucesso! Verifique seu email para confirmar a conta.')
        }
      }
    } catch (error) {
      setMessage('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      nome: '',
      empresa: '',
      codigoAgencia: ''
    })
    setMessage('')
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setIsRecovery(false)
    resetForm()
  }

  const toggleRecovery = () => {
    setIsRecovery(!isRecovery)
    setIsLogin(false)
    resetForm()
  }

  const backToLogin = () => {
    setIsRecovery(false)
    setIsLogin(true)
    resetForm()
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#1d1d1b' }}>
      {/* Lado Esquerdo - Background com Logo e Degradê */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #8fd34a 0%, #0caf99 100%)', opacity: 0.85 }}></div>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-12">
          <div className="text-center">
            <div className="mb-8">
              <img 
                src="https://ethmgnxyrgpkzgmkocwk.supabase.co/storage/v1/object/public/logos//logoAuth.png"
                alt="7C Logo"
                className="h-24 w-auto mx-auto mb-6"
              />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Sistema de Gestão
            </h1>
            <p className="text-xl text-white mb-8 max-w-md">
              Plataforma completa para agências de viagens gerenciarem clientes, cotações e operações
            </p>
            <div className="space-y-4 text-left max-w-sm">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5" style={{ color: '#0caf99' }} />
                <span className="text-white">Gestão completa de clientes</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5" style={{ color: '#0caf99' }} />
                <span className="text-white">Cotações e reservas aéreas</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5" style={{ color: '#0caf99' }} />
                <span className="text-white">Controle financeiro integrado</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5" style={{ color: '#0caf99' }} />
                <span className="text-white">Calendário e compromissos</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-20 left-20 w-32 h-32" style={{ background: 'linear-gradient(90deg, #8fd34a 0%, #0caf99 100%)', opacity: 0.25, borderRadius: '9999px', filter: 'blur(32px)' }}></div>
        <div className="absolute bottom-20 right-20 w-40 h-40" style={{ background: 'linear-gradient(90deg, #8fd34a 0%, #0caf99 100%)', opacity: 0.25, borderRadius: '9999px', filter: 'blur(40px)' }}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24" style={{ background: 'linear-gradient(90deg, #8fd34a 0%, #0caf99 100%)', opacity: 0.18, borderRadius: '9999px', filter: 'blur(24px)' }}></div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ background: '#1d1d1b' }}>
        <div className="w-full max-w-md">
          {/* Header Mobile */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src="https://ethmgnxyrgpkzgmkocwk.supabase.co/storage/v1/object/public/logos//logoAuth.png"
              alt="7C Logo"
              className="h-16 w-auto mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-white mb-2">
              Sistema de Gestão 7C
            </h2>
          </div>

          {/* Card do Formulário */}
          <div className="rounded-2xl p-8 border border-white/10 shadow-2xl" style={{ background: '#232321' }}>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 shadow-lg" style={{ background: 'linear-gradient(90deg, #8fd34a 0%, #0caf99 100%)', borderRadius: '1rem' }}>
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {isRecovery ? 'Recuperar Senha' : isLogin ? 'Bem-vindo de volta!' : 'Criar Conta'}
              </h2>
              <p className="text-white/80">
                {isRecovery 
                  ? 'Digite seu email para receber o link de recuperação'
                  : isLogin 
                    ? 'Acesse sua conta para continuar' 
                    : 'Cadastre-se com seu código de agência'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome (apenas no cadastro) */}
              {!isLogin && !isRecovery && (
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-white mb-2">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#0caf99' }} />
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-[#0caf99] focus:border-transparent transition-colors text-white placeholder-white/40 bg-[#232321]"
                      placeholder="Digite seu nome completo"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Código de Agência (apenas no cadastro) */}
              {!isLogin && !isRecovery && (
                <div>
                  <label htmlFor="codigoAgencia" className="block text-sm font-medium text-white mb-2">
                    Código de Agência <span style={{ color: '#0caf99' }}>*</span>
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#0caf99' }} />
                    <input
                      type="text"
                      id="codigoAgencia"
                      name="codigoAgencia"
                      value={formData.codigoAgencia}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-[#0caf99] focus:border-transparent transition-colors text-white placeholder-white/40 bg-[#232321]"
                      placeholder="Digite o código da agência"
                      maxLength={9}
                      required
                    />
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    Código alfanumérico fornecido pelo administrador (letras e números, até 9 caracteres)
                  </p>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#0caf99' }} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-[#0caf99] focus:border-transparent transition-colors text-white placeholder-white/40 bg-[#232321]"
                    placeholder="Digite seu email"
                    required
                  />
                </div>
              </div>

              {/* Password (não mostrar na recuperação) */}
              {!isRecovery && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#0caf99' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 pr-10 w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-[#0caf99] focus:border-transparent transition-colors text-white placeholder-white/40 bg-[#232321]"
                      placeholder="Digite sua senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      style={{ color: '#0caf99' }}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-lg backdrop-blur-sm ${
                  message.includes('sucesso') || message.includes('enviado')
                    ? 'bg-[#0caf99]/20 text-[#0caf99] border border-[#0caf99]/30' 
                    : 'bg-red-500/20 text-red-100 border border-red-400/30'
                }`}>
                  {message}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0caf99] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(90deg, #8fd34a 0%, #0caf99 100%)', border: 'none' }}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  isRecovery ? 'Enviar Email de Recuperação' : isLogin ? 'Entrar no Sistema' : 'Criar Conta'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center space-y-3">
              {isRecovery ? (
                <button
                  onClick={backToLogin}
                  className="font-medium transition-colors flex items-center justify-center space-x-2 mx-auto"
                  style={{ color: '#0caf99' }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar ao Login</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleMode}
                    className="font-medium transition-colors block"
                    style={{ color: '#0caf99' }}
                  >
                    {isLogin 
                      ? 'Não tem uma conta? Cadastre-se' 
                      : 'Já tem uma conta? Faça login'}
                  </button>
                  {isLogin && (
                    <button
                      onClick={toggleRecovery}
                      className="text-sm transition-colors block"
                      style={{ color: '#0caf99' }}
                    >
                      Esqueceu sua senha?
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer adicional */}
          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm">
              © 2024 7C Sistemas. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 