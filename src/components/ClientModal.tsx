import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { User, FileText, MessageCircle, Mail, Phone, Globe, Calendar, CreditCard, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import logger from '../utils/logger'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Cliente, NovoClienteForm } from '../types/cliente'

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (cliente: Cliente) => void
  user: SupabaseUser
  clienteToEdit?: Cliente | null
  requiredFields?: string[]
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSuccess, user, clienteToEdit, requiredFields }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<NovoClienteForm>({
    nome: '',
    dataNascimento: '',
    cpf: '',
    rg: '',
    passaporte: '',
    dataExpedicao: '',
    dataExpiracao: '',
    nacionalidade: 'Brasileira',
    email: '',
    telefone: '',
    redeSocial: '',
    observacoes: ''
  })

  // Debug log
  useEffect(() => {
    if (isOpen) {
        console.log('ClientModal opened', { clienteToEdit, requiredFields })
    }
  }, [isOpen, clienteToEdit, requiredFields])

  const steps = [
    { number: 1, title: 'Documentos', icon: FileText, description: 'Dados pessoais e documentação' },
    { number: 2, title: 'Contato', icon: User, description: 'Informações de contato e endereço' },
    { number: 3, title: 'Observações', icon: MessageCircle, description: 'Notas e preferências' }
  ]

  useEffect(() => {
    if (isOpen) {
      if (clienteToEdit) {
        setFormData({
          nome: clienteToEdit.nome,
          dataNascimento: clienteToEdit.data_nascimento || '',
          cpf: clienteToEdit.cpf,
          rg: clienteToEdit.rg || '',
          passaporte: clienteToEdit.passaporte || '',
          dataExpedicao: clienteToEdit.data_expedicao || '',
          dataExpiracao: clienteToEdit.data_expiracao || '',
          nacionalidade: clienteToEdit.nacionalidade,
          email: clienteToEdit.email,
          telefone: clienteToEdit.telefone,
          redeSocial: clienteToEdit.rede_social || '',
          observacoes: clienteToEdit.observacoes || ''
        })
      } else {
        setFormData({
          nome: '',
          dataNascimento: '',
          cpf: '',
          rg: '',
          passaporte: '',
          dataExpedicao: '',
          dataExpiracao: '',
          nacionalidade: 'Brasileira',
          email: '',
          telefone: '',
          redeSocial: '',
          observacoes: ''
        })
      }
      setCurrentStep(1)
    }
  }, [isOpen, clienteToEdit])

  // Função para aplicar máscara no CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return value
  }

  // Função para aplicar máscara no telefone
  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    let formattedValue = value
    if (name === 'cpf') {
      formattedValue = formatCPF(value)
    } else if (name === 'telefone') {
      formattedValue = formatTelefone(value)
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }))
  }

  // Helper to check if field is required
  const isRequired = (field: string) => {
    if (Array.isArray(requiredFields)) {
        return requiredFields.includes(field)
    }
    // Default required fields if requiredFields is undefined/null
    return ['nome', 'dataNascimento', 'cpf', 'email', 'telefone'].includes(field)
  }

  const handleSubmit = async () => {
    // Validar campos obrigatórios
    let camposObrigatorios: Record<string, string> = {}

    if (Array.isArray(requiredFields)) {
      if (requiredFields.includes('nome')) camposObrigatorios.nome = 'Nome completo é obrigatório'
      if (requiredFields.includes('dataNascimento')) camposObrigatorios.dataNascimento = 'Data de nascimento é obrigatória'
      if (requiredFields.includes('cpf')) camposObrigatorios.cpf = 'CPF é obrigatório'
      if (requiredFields.includes('email')) camposObrigatorios.email = 'Email é obrigatório'
      if (requiredFields.includes('telefone')) camposObrigatorios.telefone = 'Telefone é obrigatório'
      if (requiredFields.includes('passaporte')) camposObrigatorios.passaporte = 'Passaporte é obrigatório'
      if (requiredFields.includes('nacionalidade')) camposObrigatorios.nacionalidade = 'Nacionalidade é obrigatória'
      if (requiredFields.includes('dataExpiracao')) camposObrigatorios.dataExpiracao = 'Data de expiração do passaporte é obrigatória'
      if (requiredFields.includes('rg')) camposObrigatorios.rg = 'RG é obrigatório'
      if (requiredFields.includes('dataExpedicao')) camposObrigatorios.dataExpedicao = 'Data de expedição é obrigatória'
    } else {
      camposObrigatorios = {
        nome: 'Nome completo é obrigatório',
        dataNascimento: 'Data de nascimento é obrigatória',
        cpf: 'CPF é obrigatório',
        email: 'Email é obrigatório',
        telefone: 'Telefone é obrigatório'
      }
    }

    const erros = []
    
    for (const [campo, mensagem] of Object.entries(camposObrigatorios)) {
      const val = formData[campo as keyof NovoClienteForm]
      if (!val || (typeof val === 'string' && val.trim() === '')) {
        erros.push(mensagem)
      }
    }

    // Validar formato do email se preenchido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      erros.push('Email deve ter um formato válido')
    }

    // Validar CPF (deve ter 14 caracteres com pontos e hífen) se preenchido
    if (formData.cpf && formData.cpf.length !== 14) {
      erros.push('CPF deve ser preenchido completamente')
    }

    if (erros.length > 0) {
      alert('Por favor, corrija os seguintes erros:\n\n' + erros.join('\n'))
      return
    }

    setLoading(true)
    
    try {
      const empresaId = user.user_metadata?.empresa_id
      
      if (!empresaId) {
        logger.error('❌ Empresa ID não encontrado nos metadados', user.user_metadata)
        alert('Erro: Empresa ID não encontrado. Faça login novamente.')
        return
      }
      
      const clienteData = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        data_nascimento: formData.dataNascimento,
        cpf: formData.cpf,
        rg: formData.rg || null,
        passaporte: formData.passaporte || null,
        data_expedicao: formData.dataExpedicao || null,
        data_expiracao: formData.dataExpiracao || null,
        nacionalidade: formData.nacionalidade,
        rede_social: formData.redeSocial || null,
        observacoes: formData.observacoes || null,
        empresa_id: empresaId
      }

      let resultData
      let resultError

      if (clienteToEdit) {
        const { data, error } = await supabase
          .from('clientes')
          .update(clienteData)
          .eq('id', clienteToEdit.id)
          .eq('empresa_id', empresaId)
          .select()
          .single()
        resultData = data
        resultError = error
      } else {
        const { data, error } = await supabase
          .from('clientes')
          .insert([clienteData])
          .select()
          .single()
        resultData = data
        resultError = error
      }

      if (resultError) {
        logger.error('❌ Erro ao salvar cliente', resultError)
        alert('Erro ao salvar cliente: ' + resultError.message)
        return
      }

      logger.info('✅ Cliente salvo com sucesso', { id: resultData.id })
      
      alert(`Cliente ${clienteToEdit ? 'editado' : 'salvo'} com sucesso! 🎉`)
      onSuccess(resultData)
      onClose()
    } catch (error) {
      logger.error('💥 Erro inesperado ao salvar cliente', error)
      alert('Erro inesperado ao salvar cliente.')
    } finally {
      setLoading(false)
    }
  }

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 mb-4">Documentos e Dados Pessoais</h4>
            
            {/* Nome completo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome completo {isRequired('nome') && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Digite o nome completo"
                    required={isRequired('nome')}
                  />
                </div>
              </div>
            </div>

            {/* Data de Nascimento e CPF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dataNascimento" className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Nascimento {isRequired('dataNascimento') && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    id="dataNascimento"
                    name="dataNascimento"
                    value={formData.dataNascimento}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    required={isRequired('dataNascimento')}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-2">
                  CPF {isRequired('cpf') && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required={isRequired('cpf')}
                  />
                </div>
              </div>
            </div>

            {/* RG e Passaporte */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rg" className="block text-sm font-medium text-gray-700 mb-2">
                  RG {isRequired('rg') && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="rg"
                    name="rg"
                    value={formData.rg}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Digite o RG"
                    required={isRequired('rg')}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="passaporte" className="block text-sm font-medium text-gray-700 mb-2">
                  Passaporte {isRequired('passaporte') && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="passaporte"
                    name="passaporte"
                    value={formData.passaporte}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Digite o número do passaporte"
                    required={isRequired('passaporte')}
                  />
                </div>
              </div>
            </div>

            {/* Datas de Expedição e Expiração */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dataExpedicao" className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Expedição {isRequired('dataExpedicao') && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    id="dataExpedicao"
                    name="dataExpedicao"
                    value={formData.dataExpedicao}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    required={isRequired('dataExpedicao')}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="dataExpiracao" className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Expiração {isRequired('dataExpiracao') && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    id="dataExpiracao"
                    name="dataExpiracao"
                    value={formData.dataExpiracao}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    required={isRequired('dataExpiracao')}
                  />
                </div>
              </div>
            </div>

            {/* Nacionalidade */}
            <div>
              <label htmlFor="nacionalidade" className="block text-sm font-medium text-gray-700 mb-2">
                Nacionalidade {isRequired('nacionalidade') && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="nacionalidade"
                  name="nacionalidade"
                  value={formData.nacionalidade}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Digite a nacionalidade"
                  required={isRequired('nacionalidade')}
                />
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 mb-4">Informações de Contato</h4>
            
            {/* E-mail */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mail {isRequired('email') && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Digite o e-mail"
                  required={isRequired('email')}
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefone {isRequired('telefone') && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  required={isRequired('telefone')}
                />
              </div>
            </div>

            {/* Rede Social */}
            <div>
              <label htmlFor="redeSocial" className="block text-sm font-medium text-gray-700 mb-2">
                Rede Social
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="redeSocial"
                  name="redeSocial"
                  value={formData.redeSocial}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="@usuario ou link da rede social"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ex: @joaosilva, instagram.com/joaosilva, linkedin.com/in/joao-silva
              </p>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 mb-4">Observações e Preferências</h4>
            
            {/* Observações */}
            <div>
              <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  rows={6}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-vertical"
                  placeholder="Digite aqui quaisquer observações sobre o cliente: preferências de viagem, restrições alimentares, necessidades especiais, histórico de viagens, contatos de emergência, ou qualquer informação relevante..."
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Use este espaço livremente para anotar informações importantes sobre o cliente que possam ajudar no atendimento personalizado.
              </p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">
            {clienteToEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Indicador de Etapas */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = step.number === currentStep
              const isCompleted = step.number < currentStep
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      isActive 
                        ? 'bg-purple-600 border-purple-600 text-white' 
                        : isCompleted 
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-2 text-center">
                      <div className={`text-sm font-medium ${
                        isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 max-w-24 hidden sm:block">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      step.number < currentStep ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Conteúdo da Etapa */}
        <div className="p-6 overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Footer com Botões */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            
            {currentStep === 3 ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {clienteToEdit ? 'Salvando...' : 'Salvando...'}
                  </>
                ) : (
                  clienteToEdit ? 'Salvar Alterações' : 'Salvar Cliente'
                )}
              </button>
            ) : (
              <button
                onClick={handleNextStep}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ClientModal