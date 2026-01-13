import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  User,
  X,
  Clock,
  Trash2,
  History,
  FileText,
  CheckSquare,
  Upload,
  Folder,
  AlertCircle,
  Eye,
  Building
} from 'lucide-react'

// Definição dos status do funil
const PIPELINE_STEPS = [
  { id: 'LEAD', label: 'Lead', color: 'bg-blue-50 border-blue-200' },
  { id: 'APRESENTACAO', label: 'Contato Inicial', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'REUNIAO', label: 'Reunião Agendada', color: 'bg-orange-50 border-orange-200' },
  { id: 'ENVIAR_CONTRATO', label: 'Enviar Contrato', color: 'bg-purple-50 border-purple-200' },
  { id: 'ASSINADO', label: 'Contrato Assinado', color: 'bg-green-50 border-green-200' },
  { id: 'CADASTROS', label: 'Cadastros', color: 'bg-teal-50 border-teal-200' },
  { id: 'CONCLUIDO', label: 'Concluído', color: 'bg-emerald-50 border-teal-200' },
  { id: 'PERDIDO', label: 'Perdido', color: 'bg-red-50 border-red-200' }
]

interface Lead {
  id: string
  nome_empresa: string
  contato_nome: string
  contato_email: string
  contato_telefone: string
  origem: string
  status: string
  valor_mensalidade: number
  data_criacao: string
  proxima_acao_data: string
  proxima_acao_descricao: string
  motivo_perda: string
  cidade_uf?: string
  tipo_agencia?: string
  nivel_demanda?: string
  produtos_interesse?: string[]
  nivel_interesse?: string
  link_reuniao?: string
  razao_social?: string
  cnpj?: string
  endereco?: string
  tipo_empresa?: string
  nome_socio_administrador?: string
  cpf_administrador?: string
  relatorio_reuniao?: string
  email_agencia?: string
}

interface Log {
  id: string
  action: string
  details: any
  created_at: string
  user_email?: string // Join with users if possible, or just store email in details
}

interface LeadFormData {
  data_criacao: string
  responsavel_nome: string
  nome_empresa: string
  contato_info: string
  origem: string
  valor_mensalidade: string
  status: string
  proxima_acao_data: string
  proxima_acao_descricao: string
  motivo_perda: string
  cidade_uf: string
  tipo_agencia: string
  nivel_demanda: string
  produtos_interesse: string[]
  nivel_interesse: string
  link_reuniao?: string
  razao_social: string
  cnpj: string
  endereco: string
  tipo_empresa: string
  nome_socio_administrador: string
  cpf_administrador: string
  relatorio_reuniao: string
  email_agencia: string
}

const PRODUCTS_OPTIONS = [
  'Aéreo', 'Hotelaria', 'Pacotes', 'Aluguel de Carro', 
  'Ingressos', 'Passeios', 'Cruzeiro'
]

const DOCUMENT_TYPES = [
  { id: 'cnpj_contrato_social', label: 'Cartão CNPJ/Contrato Social', multiple: true },
  { id: 'docs_admin', label: 'Documentos Administrador', multiple: true },
  { id: 'comprovante_endereco', label: 'Comprovante de Endereço da Agência', multiple: false }
]

export default function KanbanComercial() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [meetingForm, setMeetingForm] = useState({
    data: '',
    hora: '',
    email: ''
  })
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [draggedLead, setDraggedLead] = useState<string | null>(null)
  
  // Logs state
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [logs, setLogs] = useState<Log[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [isScheduling, setIsScheduling] = useState(false)
  const [activeTab, setActiveTab] = useState('geral')
  const [documents, setDocuments] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  // Form state
  const [formData, setFormData] = useState<LeadFormData>({
    data_criacao: new Date().toISOString().slice(0, 16),
    responsavel_nome: '', // Nome do Responsável
    nome_empresa: '', // Nome da Agência
    contato_info: '', // Contato (Email ou Telefone)
    origem: '', // Origem
    
    // Campos legados/opcionais mantidos para compatibilidade com o banco
    valor_mensalidade: '',
    status: 'LEAD',
    proxima_acao_data: '',
    proxima_acao_descricao: '',
    motivo_perda: '',
    
    cidade_uf: '',
    tipo_agencia: '',
    nivel_demanda: '',
    nivel_interesse: '',
    produtos_interesse: [],
    link_reuniao: '',
    razao_social: '',
    cnpj: '',
    endereco: '',
    tipo_empresa: '',
    nome_socio_administrador: '',
    cpf_administrador: '',
    relatorio_reuniao: '',
    email_agencia: ''
  })

  useEffect(() => {
    fetchLeads()
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUser(user)
      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role === 'admin') {
        setIsAdmin(true)
      }
    }
  }

  const fetchLogs = async () => {
    if (!isAdmin) return
    try {
      const { data, error } = await supabase
        .from('kanban_logs')
        .select(`
          *,
          profiles:user_id (email)
        `) // Assuming profiles has email or we join with auth.users (which is harder directly, so maybe store email in details or rely on profiles)
        // For simplicity, let's just fetch logs. If profiles doesn't have email readable, we might need to store it.
        // Let's assume we store user_email in details for now to be safe or fetch from profiles if it has name/email.
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
    }
  }

  const logAction = async (action: string, details: any, leadId?: string) => {
    if (!currentUser) return
    try {
      await supabase.from('kanban_logs').insert({
        user_id: currentUser.id,
        lead_id: leadId,
        action,
        details: {
          ...details,
          user_email: currentUser.email // Snapshot of who did it
        }
      })
    } catch (error) {
      console.error('Erro ao salvar log:', error)
    }
  }

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('funil_vendas')
        .select('*')
        .order('data_criacao', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Erro ao carregar leads:', error)
    }
  }

  const toggleProduct = (product: string) => {
    setFormData(prev => {
      const current = prev.produtos_interesse || []
      const exists = current.includes(product)
      return {
        ...prev,
        produtos_interesse: exists 
          ? current.filter(p => p !== product)
          : [...current, product]
      }
    })
  }

  const handleOpenMeeting = (e: React.MouseEvent) => {
    e.preventDefault()
    // Pre-fill email if available and looks like email
    const currentEmail = formData.contato_info.includes('@') ? formData.contato_info : ''
    setMeetingForm({
      data: new Date().toISOString().slice(0, 10),
      hora: '',
      email: currentEmail
    })
    setShowMeetingModal(true)
  }

  const handleConfirmMeeting = async () => {
    if (!meetingForm.data || !meetingForm.hora || !meetingForm.email) {
      alert('Preencha todos os campos da reunião')
      return
    }

    setIsScheduling(true)
    let meetingLink = ''

    try {
      // Create dates for webhook
      const start = new Date(`${meetingForm.data}T${meetingForm.hora}:00`)
      const end = new Date(start.getTime() + 40 * 60000) // + 40 minutes

      // Determine webhook URL based on environment
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const webhookUrl = isLocalhost 
        ? 'https://n8n.srv999039.hstgr.cloud/webhook-test/ae685aca-2256-42f0-839c-587616f27591'
        : 'https://n8n.srv999039.hstgr.cloud/webhook/ae685aca-2256-42f0-839c-587616f27591'

      // Send to n8n webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Titulo: `${formData.nome_empresa} - Reunião de Apresentação 7C Turismo & Consultoria`,
          Inicio: start.toISOString(),
          Fim: end.toISOString(),
          emailagencia: meetingForm.email,
          emailcomercial: currentUser?.email
        })
      })

      if (response.ok) {
        // Tenta ler como JSON primeiro
        try {
          // Primeiro lemos como texto para não consumir o body caso o JSON falhe
          const text = await response.text()
          
          try {
             // Tenta parsear o texto como JSON
             const data = JSON.parse(text)
             
             if (Array.isArray(data) && data.length > 0) {
                 meetingLink = data[0].hangoutLink || data[0].htmlLink || ''
             } else if (typeof data === 'object') {
                 meetingLink = data.hangoutLink || data.htmlLink || data.link || data.url || data.meeting_link || data.join_url || (typeof data === 'string' ? data : '')
                 if (!meetingLink && data.message) meetingLink = data.message 
             } else if (typeof data === 'string') {
                 meetingLink = data
             }
          } catch {
             // Se não for JSON, usa o texto puro se parecer uma URL
             if (text && text.startsWith('http')) {
                 meetingLink = text
             }
          }
        } catch (e) {
            console.error('Erro ao processar resposta do webhook:', e)
        }
      }
    } catch (err) {
      console.error('Erro webhook:', err)
    }

    const meetingDateTime = `${meetingForm.data}T${meetingForm.hora}:00`
    
    // Call handleSave with overrides
    await handleSave(undefined, {
      status: 'REUNIAO',
      proxima_acao_data: meetingDateTime,
      proxima_acao_descricao: 'Reunião de Apresentação',
      contato_info: meetingForm.email, // Update email if changed
      link_reuniao: meetingLink,
      // Ensure qualification data is saved, using form state which should be updated
      // We need to make sure we're using the latest form data.
      // Since setFormData updates state asynchronously, using formData directly here is correct 
      // as long as the inputs updated the state.
      
      cidade_uf: formData.cidade_uf,
      tipo_agencia: formData.tipo_agencia,
      nivel_demanda: formData.nivel_demanda,
      nivel_interesse: formData.nivel_interesse,
      produtos_interesse: formData.produtos_interesse,

      // Preserve company details
      razao_social: formData.razao_social,
      cnpj: formData.cnpj,
      endereco: formData.endereco,
      tipo_empresa: formData.tipo_empresa,
      nome_socio_administrador: formData.nome_socio_administrador,
      cpf_administrador: formData.cpf_administrador,
      relatorio_reuniao: formData.relatorio_reuniao
    })
    
    setIsScheduling(false)
    setShowMeetingModal(false)
  }

  // Format CNPJ
  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
  }

  // Format CPF
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const handleSave = async (e?: React.FormEvent, overrideData?: any) => {
    if (e) e.preventDefault()
    try {
      const dataToUse = { ...formData, ...overrideData }
      const payload = {
        data_criacao: new Date(dataToUse.data_criacao).toISOString(),
        nome_empresa: dataToUse.nome_empresa,
        contato_nome: dataToUse.responsavel_nome, // Mapeando responsável para contato_nome
        contato_email: dataToUse.contato_info.includes('@') ? dataToUse.contato_info : null, // Tenta extrair email se tiver @
        contato_telefone: !dataToUse.contato_info.includes('@') ? dataToUse.contato_info : null, // Senão, assume telefone
        origem: dataToUse.origem,
        
        cidade_uf: dataToUse.cidade_uf,
        tipo_agencia: dataToUse.tipo_agencia,
        nivel_demanda: dataToUse.nivel_demanda,
        produtos_interesse: dataToUse.produtos_interesse,
        nivel_interesse: dataToUse.nivel_interesse,

        status: dataToUse.status,
        valor_mensalidade: dataToUse.valor_mensalidade ? Number(dataToUse.valor_mensalidade) : null,
        proxima_acao_data: dataToUse.proxima_acao_data || null,
        proxima_acao_descricao: dataToUse.proxima_acao_descricao,
        motivo_perda: dataToUse.motivo_perda,
        link_reuniao: dataToUse.link_reuniao,

        razao_social: dataToUse.razao_social,
        cnpj: dataToUse.cnpj,
        endereco: dataToUse.endereco,
        tipo_empresa: dataToUse.tipo_empresa,
        nome_socio_administrador: dataToUse.nome_socio_administrador,
        cpf_administrador: dataToUse.cpf_administrador,
        relatorio_reuniao: dataToUse.relatorio_reuniao
      }

      if (editingLead) {
        const { error } = await supabase
          .from('funil_vendas')
          .update(payload)
          .eq('id', editingLead.id)
        if (error) throw error
        
        await logAction('UPDATE', { 
          old: editingLead, 
          new: payload,
          changed_fields: Object.keys(payload).filter(k => payload[k as keyof typeof payload] !== editingLead[k as keyof typeof editingLead])
        }, editingLead.id)
      } else {
        const { data, error } = await supabase
          .from('funil_vendas')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        
        await logAction('CREATE', { payload }, data.id)
      }

      setShowModal(false)
      setEditingLead(null)
      resetForm()
      fetchLeads()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar lead')
    }
  }

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLead(leadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (!draggedLead) return

    // Optimistic update
    setLeads(prev => prev.map(l => 
      l.id === draggedLead ? { ...l, status: newStatus } : l
    ))

    try {
      const { error } = await supabase
        .from('funil_vendas')
        .update({ status: newStatus })
        .eq('id', draggedLead)

      if (error) throw error
      
      const movedLead = leads.find(l => l.id === draggedLead)
      if (movedLead) {
        await logAction('MOVE', { 
          from: movedLead.status, 
          to: newStatus,
          lead_name: movedLead.nome_empresa
        }, draggedLead)
      }
    } catch (error) {
      console.error('Erro ao mover card:', error)
      fetchLeads() // Revert on error
    } finally {
      setDraggedLead(null)
    }
  }

  const handleDelete = async () => {
    if (!editingLead) return
    if (!window.confirm('Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.')) return

    try {
      const { error } = await supabase
        .from('funil_vendas')
        .delete()
        .eq('id', editingLead.id)

      if (error) throw error

      await logAction('DELETE', { 
        lead_name: editingLead.nome_empresa,
        lead_data: editingLead
      }, editingLead.id)

      setShowModal(false)
      setEditingLead(null)
      fetchLeads()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir lead')
    }
  }

  const resetForm = () => {
    setActiveTab('geral')
    setFormData({
      data_criacao: new Date().toISOString().slice(0, 16),
      nome_empresa: '',
      responsavel_nome: '',
      contato_info: '',
      origem: '',
      valor_mensalidade: '',
      status: 'LEAD',
      proxima_acao_data: '',
      proxima_acao_descricao: '',
      motivo_perda: '',
      cidade_uf: '',
      tipo_agencia: '',
      nivel_demanda: '',
      nivel_interesse: '',
      produtos_interesse: [],
      link_reuniao: '',
      razao_social: '',
      cnpj: '',
      endereco: '',
      tipo_empresa: '',
      nome_socio_administrador: '',
      cpf_administrador: '',
      relatorio_reuniao: '',
      email_agencia: ''
    })
  }

  const openEdit = (lead: Lead) => {
    setActiveTab('geral')
    setEditingLead(lead)
    fetchDocuments(lead.id)
    setFormData({
      data_criacao: lead.data_criacao ? new Date(lead.data_criacao).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      responsavel_nome: lead.contato_nome || '',
      nome_empresa: lead.nome_empresa,
      contato_info: lead.contato_email || lead.contato_telefone || '',
      origem: lead.origem || '',
      valor_mensalidade: lead.valor_mensalidade?.toString() || '',
      status: lead.status,
      proxima_acao_data: lead.proxima_acao_data ? lead.proxima_acao_data.slice(0, 16) : '',
      proxima_acao_descricao: lead.proxima_acao_descricao || '',
      motivo_perda: lead.motivo_perda || '',
      cidade_uf: lead.cidade_uf || '',
      tipo_agencia: lead.tipo_agencia || '',
      nivel_demanda: lead.nivel_demanda || '',
      nivel_interesse: lead.nivel_interesse || '',
      produtos_interesse: lead.produtos_interesse || [],
      link_reuniao: lead.link_reuniao || '',
      razao_social: lead.razao_social || '',
      cnpj: lead.cnpj || '',
      endereco: lead.endereco || '',
      tipo_empresa: lead.tipo_empresa || '',
      nome_socio_administrador: lead.nome_socio_administrador || '',
      cpf_administrador: lead.cpf_administrador || '',
      relatorio_reuniao: lead.relatorio_reuniao || '',
      email_agencia: lead.email_agencia || ''
    })
    setShowModal(true)
  }

  const handleGenerateContract = async () => {
    if (!formData.razao_social || !formData.cnpj) {
      alert('Por favor, preencha e salve os dados da empresa (Razão Social e CNPJ) antes de gerar o contrato.')
      return
    }

    try {
      const webhookUrl = 'https://n8n.srv999039.hstgr.cloud/webhook/zapsign/contrato-agencia'
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            CIDADE_ASSINATURA: "Florianópolis - SC",
            DATA_ASSINATURA: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
            AGENCIARAZAOSOCIAL: formData.razao_social,
            AGENCIANOMEFANTASIA: formData.nome_empresa,
            AGENCIARESPONSAVEL: formData.nome_socio_administrador,
            AGENCIATIPOREPRESENTANTE: formData.tipo_empresa,
            AGENCIACNPJ: formData.cnpj,
            AGENCIACPF: formData.cpf_administrador,
            AGENCIAENDERECOCOMPLETO: formData.endereco,
            AGENCIAEMAIL: formData.email_agencia
          }
        })
      })

      if (response.ok) {
        alert('Solicitação de contrato enviada com sucesso!')
      } else {
        alert('Erro ao enviar solicitação de contrato. Verifique os dados e tente novamente.')
        console.error('Erro webhook contrato:', await response.text())
      }
    } catch (error) {
      console.error('Erro ao gerar contrato:', error)
      alert('Erro ao conectar com o serviço de geração de contrato.')
    }
  }

  // Agrupamento por colunas
  const columns = useMemo(() => {
    const cols: Record<string, Lead[]> = {}
    PIPELINE_STEPS.forEach(step => cols[step.id] = [])
    leads.forEach(lead => {
      if (cols[lead.status]) {
        cols[lead.status].push(lead)
      } else {
        // Fallback para status desconhecidos
        if (!cols['LEAD']) cols['LEAD'] = []
        cols['LEAD'].push(lead)
      }
    })
    return cols
  }, [leads])

  // Helper para gerar o caminho da pasta no storage
  const getStoragePath = (lead: Lead) => {
    // Sanitiza o nome da empresa para usar como nome da pasta
    // Remove acentos e caracteres especiais, mantendo apenas letras, números, espaços, hífens e underscores
    const sanitizedName = lead.nome_empresa
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9 -_]/g, '')
      .trim()
      .replace(/\s+/g, '_')
    
    // Usa Nome_da_Agencia como nome da pasta
    // NOTA: Se o nome da agência for alterado, os arquivos antigos não serão migrados automaticamente
    return `leads/${sanitizedName || 'sem_nome'}`
  }

  const fetchDocuments = async (leadId: string) => {
    if (!leadId) return
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return

    try {
      const path = getStoragePath(lead)
      const { data, error } = await supabase.storage
        .from('documents')
        .list(path)
      
      if (error) {
         console.error('Erro ao listar documentos:', error)
         return
      }
      
      setDocuments(data || [])
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (!e.target.files || e.target.files.length === 0 || !editingLead) return
    
    // Check constraints
    const docType = DOCUMENT_TYPES.find(d => d.id === type)
    if (docType && !docType.multiple) {
        const existing = documents.filter(doc => doc.name.startsWith(type))
        if (existing.length > 0) {
            alert('Este documento permite apenas 1 arquivo. Exclua o atual antes de enviar um novo.')
            return
        }
    }

    setUploading(true)
    const file = e.target.files[0]
    // Sanitize file name
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${type}_${Date.now()}_${sanitizedFileName}`
    const folderPath = getStoragePath(editingLead)
    const filePath = `${folderPath}/${fileName}`

    try {
      const { error } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (error) throw error
      
      await fetchDocuments(editingLead.id)
      alert('Documento enviado com sucesso!')
    } catch (error) {
      console.error('Erro ao enviar documento:', error)
      alert('Erro ao enviar documento. Verifique se o bucket "documents" existe no Supabase.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (fileName: string) => {
    if (!editingLead || !window.confirm('Tem certeza que deseja excluir este documento?')) return
    
    try {
      const folderPath = getStoragePath(editingLead)
      const { error } = await supabase.storage
        .from('documents')
        .remove([`${folderPath}/${fileName}`])

      if (error) throw error
      
      await fetchDocuments(editingLead.id)
    } catch (error) {
      console.error('Erro ao excluir documento:', error)
      alert('Erro ao excluir documento')
    }
  }

  const handleOpenDocument = async (fileName: string) => {
    if (!editingLead) return
    try {
      const folderPath = getStoragePath(editingLead)
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(`${folderPath}/${fileName}`, 3600)
        
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (error) {
      console.error('Erro ao abrir documento:', error)
      alert('Erro ao abrir documento')
    }
  }

  const currentStepIndex = PIPELINE_STEPS.findIndex(step => step.id === formData.status)

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funil de Vendas</h1>
          <p className="text-gray-500 mt-1">Gestão de prospecção de novas agências</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => {
                fetchLogs()
                setShowLogsModal(true)
              }}
              className="inline-flex items-center space-x-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <History className="h-5 w-5" />
              <span>Logs</span>
            </button>
          )}
          <button
            onClick={() => {
              setEditingLead(null)
              resetForm()
              setShowModal(true)
            }}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Lead</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex space-x-4 h-full min-w-max">
          {PIPELINE_STEPS.map((step) => (
            <div 
              key={step.id} 
              className={`w-80 flex-shrink-0 flex flex-col rounded-xl bg-gray-50/50 border border-gray-200/60 max-h-full`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, step.id)}
            >
              {/* Column Header */}
              <div className={`p-3 border-b border-gray-100 flex items-center justify-between ${step.color.split(' ')[0]} rounded-t-xl`}>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-700 text-sm">{step.label}</span>
                  <span className="bg-white/60 px-2 py-0.5 rounded-full text-xs font-medium text-gray-600">
                    {columns[step.id]?.length || 0}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {columns[step.id]?.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onClick={() => openEdit(lead)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-semibold text-gray-900 truncate" title={lead.nome_empresa}>{lead.nome_empresa}</h3>

                      </div>
                      {lead.valor_mensalidade && (
                        <span className="text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded flex-shrink-0">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor_mensalidade)}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {(lead.contato_nome || lead.contato_telefone) && (
                        <div className="flex items-center text-xs text-gray-600">
                          <User className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          <span className="truncate">
                            {lead.contato_nome} {lead.contato_telefone && `• ${lead.contato_telefone}`}
                          </span>
                        </div>
                      )}

                      {lead.proxima_acao_data && (
                        <div className={`flex items-start text-xs rounded-md p-1.5 ${
                          new Date(lead.proxima_acao_data) < new Date() ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          <Clock className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0" />
                          <span>
                            {new Date(lead.proxima_acao_data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            {lead.proxima_acao_descricao && <span className="block opacity-80 mt-0.5">{lead.proxima_acao_descricao}</span>}
                          </span>
                        </div>
                      )}

                      {lead.status === 'LEAD' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {Math.floor((new Date().getTime() - new Date(lead.data_criacao || new Date()).getTime()) / (1000 * 3600 * 24))} dias
                        </span>
                      )}
                    </div>
                    
                    {/* Hover Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">
                {editingLead ? 'Editar Oportunidade' : 'Novo Lead'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar do Modal */}
              <div className="w-64 bg-gray-50 border-r border-gray-100 p-4 space-y-2 flex-shrink-0 overflow-y-auto">
                <button
                  onClick={() => setActiveTab('geral')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'geral' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <User className="h-4 w-4" />
                  Dados do Lead
                </button>

                <button
                  onClick={() => setActiveTab('qualificacao')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'qualificacao' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <CheckSquare className="h-4 w-4" />
                  Primeiro Contato
                </button>

                {currentStepIndex >= 1 && (
                  <button
                    onClick={() => setActiveTab('reuniao')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'reuniao' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Reunião / Apresentação
                  </button>
                )}

                {currentStepIndex >= 3 && (
                  <>
                    <button
                      onClick={() => setActiveTab('contrato')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'contrato' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Building className="h-4 w-4" />
                      Dados Contrato
                    </button>

                    <button
                      onClick={() => setActiveTab('documentos')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'documentos' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Folder className="h-4 w-4" />
                      Documentos
                    </button>
                  </>
                )}
              </div>

              {/* Conteúdo do Modal */}
              <form onSubmit={handleSave} className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 overflow-y-auto p-6">
                  {/* TAB GERAL */}
                  {activeTab === 'geral' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Informações Básicas</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Data de Entrada</label>
                          <input
                            required
                            type="date"
                            value={formData.data_criacao}
                            disabled={!!editingLead}
                            onChange={(e) => setFormData({ ...formData, data_criacao: e.target.value })}
                            className={`w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${editingLead ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
                            style={{ colorScheme: 'light' }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Responsável Agência</label>
                          <input
                            type="text"
                            value={formData.responsavel_nome}
                            onChange={(e) => setFormData({ ...formData, responsavel_nome: e.target.value })}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Quem está atendendo?"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Agência *</label>
                          <input
                            required
                            type="text"
                            value={formData.nome_empresa}
                            onChange={(e) => setFormData({ ...formData, nome_empresa: e.target.value })}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ex: 7C Turismo"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Contato</label>
                          <input
                            type="text"
                            value={formData.contato_info}
                            onChange={(e) => setFormData({ ...formData, contato_info: e.target.value })}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Origem do Lead</label>
                        <select
                          value={formData.origem}
                          disabled={!!editingLead}
                          onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                          className={`w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${editingLead ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
                        >
                          <option value="">Selecione...</option>
                          <option value="Indicação">Indicação</option>
                          <option value="Instagram">Instagram</option>
                          <option value="Tráfego Pago">Tráfego Pago</option>
                          <option value="Site">Site</option>
                          <option value="Prospecção Ativa">Prospecção Ativa</option>
                        </select>
                      </div>


                    </div>
                  )}

                  {/* TAB QUALIFICACAO */}
                  {activeTab === 'qualificacao' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Primeiro Contato</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cidade - UF</label>
                          <input
                            type="text"
                            value={formData.cidade_uf}
                            onChange={(e) => setFormData({ ...formData, cidade_uf: e.target.value })}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: São Paulo - SP"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Agência</label>
                          <select
                            value={formData.tipo_agencia}
                            onChange={(e) => setFormData({ ...formData, tipo_agencia: e.target.value })}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecione...</option>
                            <option value="Lazer">Lazer</option>
                            <option value="Corporativo">Corporativo</option>
                            <option value="Misto">Misto</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Demanda</label>
                          <div className="flex gap-2">
                            {['$', '$$', '$$$'].map(level => (
                              <label key={level} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="nivel_demanda"
                                  value={level}
                                  checked={formData.nivel_demanda === level}
                                  onChange={(e) => setFormData({ ...formData, nivel_demanda: e.target.value })}
                                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500 focus:ring-2"
                                  style={{ colorScheme: 'light' }}
                                />
                                <span className="text-sm text-gray-700">{level}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Interesse</label>
                          <select
                            value={formData.nivel_interesse}
                            onChange={(e) => setFormData({ ...formData, nivel_interesse: e.target.value })}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecione...</option>
                            <option value="Baixo">Baixo</option>
                            <option value="Médio">Médio</option>
                            <option value="Alto">Alto</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Produtos de Interesse</label>
                        <div className="grid grid-cols-2 gap-2">
                          {PRODUCTS_OPTIONS.map(product => (
                            <label key={product} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(formData.produtos_interesse || []).includes(product)}
                                onChange={() => toggleProduct(product)}
                                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                style={{ colorScheme: 'light' }}
                              />
                              <span className="text-sm text-gray-700 truncate" title={product}>{product}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB DOCUMENTOS */}
                  {activeTab === 'documentos' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Documentação da Agência</h4>
                      
                      {/* Upload Areas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {DOCUMENT_TYPES.map(docType => (
                          <div key={docType.id} className="border border-dashed border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-700 text-sm">{docType.label}</span>
                              <label className={`cursor-pointer bg-blue-50 border border-blue-200 text-blue-700 rounded px-2 py-1 text-xs font-medium hover:bg-blue-100 transition-colors flex items-center gap-1 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload className="h-3 w-3" />
                                {uploading ? 'Enviando...' : 'Enviar'}
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  onChange={(e) => handleFileUpload(e, docType.id)}
                                  disabled={uploading}
                                />
                              </label>
                            </div>
                            
                            {/* List files for this type */}
                            <div className="space-y-2 mt-3">
                              {documents
                                .filter(doc => doc.name.startsWith(docType.id))
                                .map(doc => (
                                  <div key={doc.name} className="flex items-center justify-between bg-white border border-gray-200 p-2 rounded text-xs">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <FileText className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                      <span className="truncate max-w-[120px] text-gray-700" title={doc.name}>
                                        {(() => {
                                          const prefix = docType.id + '_'
                                          if (!doc.name.startsWith(prefix)) return doc.name
                                          const afterType = doc.name.substring(prefix.length)
                                          const firstUnderscore = afterType.indexOf('_')
                                          return firstUnderscore !== -1 ? afterType.substring(firstUnderscore + 1) : afterType
                                        })()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenDocument(doc.name)}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                                        title="Visualizar"
                                      >
                                        <Eye className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteDocument(doc.name)}
                                        className="p-1 hover:bg-red-50 rounded text-red-500"
                                        title="Excluir"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {documents.filter(doc => doc.name.startsWith(docType.id)).length === 0 && (
                                  <div className="text-center py-2 text-gray-400 text-xs italic">
                                    Nenhum arquivo enviado
                                  </div>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-800 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">Informação de Armazenamento</p>
                          <p>Os documentos são armazenados de forma segura e organizados por agência. Apenas usuários autorizados têm acesso.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB REUNIAO */}
                  {activeTab === 'reuniao' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Detalhes da Reunião</h4>
                      
                      {formData.link_reuniao ? (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-purple-800 font-medium">
                            <Calendar className="h-5 w-5" />
                            <span>Link da Reunião Gerado</span>
                          </div>
                          <a 
                            href={formData.link_reuniao} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-purple-700 hover:text-purple-900 underline break-all"
                          >
                            {formData.link_reuniao}
                          </a>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center text-gray-500 text-sm">
                          Nenhuma reunião agendada ou link gerado ainda.
                        </div>
                      )}

                      <div className="pt-4">
                         <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">Relatório / Anotações</label>
                            <span className="text-xs text-gray-500">Privado</span>
                         </div>
                         <textarea
                            value={formData.relatorio_reuniao}
                            onChange={(e) => setFormData({ ...formData, relatorio_reuniao: e.target.value })}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                            placeholder="Descreva aqui o que foi conversado na reunião, objeções, pontos de atenção..."
                          />
                      </div>
                      
                      <div className="pt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={handleOpenMeeting}
                          className="px-4 py-2 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
                        >
                          <Calendar className="h-4 w-4" />
                          {formData.link_reuniao ? 'Reagendar Reunião' : 'Agendar Nova Reunião'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB CONTRATO */}
                  {activeTab === 'contrato' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Dados Contrato</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                          <input
                            type="text"
                            value={formData.razao_social}
                            onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Razão Social Ltda"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                          <input
                            type="text"
                            value={formData.cnpj}
                            onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                            maxLength={18}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="00.000.000/0000-00"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                        <input
                          type="text"
                          value={formData.endereco}
                          onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                          className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Agência (Contrato)</label>
                        <input
                          type="email"
                          value={formData.email_agencia}
                          onChange={(e) => setFormData({ ...formData, email_agencia: e.target.value })}
                          className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="email@agencia.com.br"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Empresa</label>
                          <select
                            value={formData.tipo_empresa}
                            onChange={(e) => setFormData({ ...formData, tipo_empresa: e.target.value })}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecione...</option>
                            <option value="MEI">MEI</option>
                            <option value="LTDA">LTDA</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CPF Administrador</label>
                          <input
                            type="text"
                            value={formData.cpf_administrador}
                            onChange={(e) => setFormData({ ...formData, cpf_administrador: formatCPF(e.target.value) })}
                            maxLength={14}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="000.000.000-00"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo Sócio Administrador</label>
                        <input
                          type="text"
                          value={formData.nome_socio_administrador}
                          onChange={(e) => setFormData({ ...formData, nome_socio_administrador: e.target.value })}
                          className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nome Completo"
                        />
                      </div>

                      <div className="pt-4 flex justify-end">
                         <button
                            type="button"
                            onClick={handleGenerateContract}
                            className="px-4 py-2 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Gerar Contrato
                          </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Fixo */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
                  {editingLead ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                      title="Excluir Lead"
                    >
                      <Trash2 className="h-5 w-5" />
                      <span className="text-sm font-medium">Excluir</span>
                    </button>
                  ) : <div></div>}
                  
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                    >
                      Cancelar
                    </button>
                    
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Modal Reunião */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-purple-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Agendar Apresentação
              </h3>
              <button 
                type="button" 
                onClick={() => setShowMeetingModal(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  value={meetingForm.data}
                  onChange={(e) => setMeetingForm({ ...meetingForm, data: e.target.value })}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ colorScheme: 'light' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <input
                  type="time"
                  value={meetingForm.hora}
                  onChange={(e) => setMeetingForm({ ...meetingForm, hora: e.target.value })}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ colorScheme: 'light' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email para Convite</label>
                <input
                  type="email"
                  value={meetingForm.email}
                  onChange={(e) => setMeetingForm({ ...meetingForm, email: e.target.value })}
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="email@agencia.com"
                />
              </div>

              <div className="flex justify-end pt-4 gap-2">
                <button
                  onClick={() => setShowMeetingModal(false)}
                  disabled={isScheduling}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmMeeting}
                  disabled={isScheduling}
                  className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isScheduling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    'Confirmar Agendamento'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Logs */}
      {showLogsModal && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="h-5 w-5 text-gray-600" />
                Histórico de Alterações (Admin)
              </h3>
              <button 
                type="button" 
                onClick={() => setShowLogsModal(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhum registro encontrado.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 font-medium text-gray-500">Data</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Usuário</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Ação</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-600 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-3 text-gray-900 font-medium">
                          {log.details?.user_email || log.user_email || 'Sistema'}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                            log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                            log.action === 'MOVE' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                          {log.action === 'MOVE' ? (
                            <span>
                              {log.details.lead_name}: {PIPELINE_STEPS.find(s => s.id === log.details.from)?.label || log.details.from} 
                              {' -> '} 
                              {PIPELINE_STEPS.find(s => s.id === log.details.to)?.label || log.details.to}
                            </span>
                          ) : log.action === 'DELETE' ? (
                            <span>Excluído: {log.details.lead_name}</span>
                          ) : (
                            <details>
                              <summary className="cursor-pointer hover:text-blue-600">Ver JSON</summary>
                              <pre className="mt-2 p-2 bg-gray-50 rounded border overflow-x-auto max-w-xs">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
