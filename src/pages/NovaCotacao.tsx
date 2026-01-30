import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useCotacao } from '../contexts/CotacaoContext'
import { Plane, Luggage, Ban, Trash2, Printer, Phone, Mail, Layout, Plus, Search, Check, X, Loader2, UserPlus, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ClientModal from '../components/ClientModal'
import { Cliente } from '../types/cliente'
import { getAirlineLogoUrl } from '../utils/airlineLogos'

const gerarCodigoUnico = async () => {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let tentativas = 0;
  const maxTentativas = 10;
  
  while (tentativas < maxTentativas) {
    let codigo = '';
    for (let i = 0; i < 6; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    
    // Verificar se o código já existe no banco
    const { error } = await supabase
      .from('cotacoes')
      .select('id')
      .eq('codigo', codigo)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // Código não existe, pode usar
      return codigo;
    } else if (error) {
      console.error('Erro ao verificar código', error);
      return codigo; // Em caso de erro, retorna o código gerado
    }
    
    // Código existe, tentar novamente
    tentativas++;
  }
  
  // Se chegou aqui, gerar código com timestamp para garantir unicidade
  const timestamp = Date.now().toString().slice(-3);
  const caracteresAleatorios = caracteres.charAt(Math.floor(Math.random() * caracteres.length)) + 
                              caracteres.charAt(Math.floor(Math.random() * caracteres.length)) + 
                              caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  return (caracteresAleatorios + timestamp).toUpperCase();
}

interface EmpresaData {
  nome: string
  logotipo: string | null
  email: string | null
  cor_personalizada: string | null
}

interface OperadorData {
  nome: string
}

interface CotacaoKanban {
  id: number
  titulo: string
  cliente: string
  status: string
  valor: number
}

const PriceTooltip = ({ breakdown, total, children }: { breakdown: any, total: number, children: React.ReactNode }) => {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLDivElement>(null)
  
  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const newStyle: React.CSSProperties = {}
      
      const spaceAbove = rect.top
      const spaceBelow = window.innerHeight - rect.bottom
      
      if (spaceAbove > 320 || spaceAbove > spaceBelow) {
        newStyle.bottom = window.innerHeight - rect.top + 10
        newStyle.top = 'auto'
      } else {
        newStyle.top = rect.bottom + 10
        newStyle.bottom = 'auto'
      }

      const spaceLeft = rect.right
      if (spaceLeft > 300) {
         newStyle.right = window.innerWidth - rect.right
         newStyle.left = 'auto'
      } else {
         newStyle.left = rect.left
         newStyle.right = 'auto'
      }

      setStyle(newStyle)
    }
    setOpen(true)
  }

  if (!breakdown) return <>{children}</>

  // Calculate totals for display if not present
  const totalTarifa = ((breakdown.adultoUnit || 0) * (breakdown.numAdultos || 0)) + 
                      ((breakdown.criancaUnit || 0) * (breakdown.numCriancas || 0)) + 
                      ((breakdown.bebeUnit || 0) * (breakdown.numBebes || 0))
  
  const totalTaxa = ((breakdown.taxaUnit || 0) * ((breakdown.numAdultos||0) + (breakdown.numCriancas||0) + (breakdown.numBebes||0)))

  return (
    <>
      <div className="relative inline-block cursor-help" onMouseEnter={handleMouseEnter} onMouseLeave={() => setOpen(false)}>
        <div ref={triggerRef}>{children}</div>
      </div>
      
      {open && createPortal(
        <div 
          className="fixed w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] text-sm pointer-events-none font-sans"
          style={style}
        >
          <div className="p-4 space-y-2 text-gray-700">
            <div className="font-bold text-gray-900 border-b pb-2 mb-2">Detalhamento do Preço</div>
            
            <div className="flex justify-between">
              <span>Adultos ({breakdown.numAdultos || 0}):</span>
              <span>R$ {((breakdown.adultoUnit || 0) * (breakdown.numAdultos || 0)).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            
            {breakdown.numCriancas > 0 && (
              <div className="flex justify-between">
                <span>Crianças ({breakdown.numCriancas}):</span>
                <span>R$ {((breakdown.criancaUnit || 0) * breakdown.numCriancas).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            )}
            
            {breakdown.numBebes > 0 && (
              <div className="flex justify-between">
                <span>Bebês ({breakdown.numBebes}):</span>
                <span>R$ {((breakdown.bebeUnit || 0) * breakdown.numBebes).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            )}
            
            <div className="flex justify-between text-gray-600">
              <span>Taxa de Embarque (por pax):</span>
              <span>R$ {(breakdown.taxaUnit || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>

            <div className="border-t my-2 border-dashed border-gray-200"></div>

            <div className="flex justify-between">
              <span>Total Tarifa:</span>
              <span>R$ {totalTarifa.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Taxa de Embarque:</span>
              <span>R$ {totalTaxa.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            
            <div className="flex justify-between text-blue-600 font-medium">
              <span>DU:</span>
              <span>R$ {(breakdown.du || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>

            <div className="border-t my-2 border-gray-200 pt-2 flex justify-between text-base font-bold text-gray-900">
              <span>Total:</span>
              <span className="text-emerald-600">R$ {total.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default function NovaCotacao() {
  const { voosSelecionados, removerVoo, atualizarVoo, limparCotacao } = useCotacao()
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null)
  const [operador, setOperador] = useState<OperadorData | null>(null)
  
  // Edit Values Modal State
  const [editingFlight, setEditingFlight] = useState<any | null>(null)
  const [editDu, setEditDu] = useState<string>('0')
  
  // Kanban Modal State
  const [isKanbanModalOpen, setIsKanbanModalOpen] = useState(false)
  const [kanbanMode, setKanbanMode] = useState<'create' | 'select'>('create')
  const [existingCotacoes, setExistingCotacoes] = useState<CotacaoKanban[]>([])
  const [isLoadingCotacoes, setIsLoadingCotacoes] = useState(false)
  const [selectedCotacaoId, setSelectedCotacaoId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // New Quote Form
  const [newQuoteTitle, setNewQuoteTitle] = useState('')
  const [newQuoteClient, setNewQuoteClient] = useState('')
  
  // Client Search State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [foundClients, setFoundClients] = useState<Cliente[]>([])
  const [showClientSuggestions, setShowClientSuggestions] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null)
  const [isSearchingClients, setIsSearchingClients] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setCurrentUser(user)
    })
  }, [])

  useEffect(() => {
    const searchClients = async () => {
      if (!clientSearchTerm || selectedClient?.nome === clientSearchTerm) {
        setFoundClients([])
        return
      }

      setIsSearchingClients(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.user_metadata?.empresa_id) return

        const { data } = await supabase
          .from('clientes')
          .select('*')
          .eq('empresa_id', user.user_metadata.empresa_id)
          .ilike('nome', `%${clientSearchTerm}%`)
          .limit(5)
        
        if (data) setFoundClients(data)
      } catch (error) {
        console.error('Erro ao buscar clientes:', error)
      } finally {
        setIsSearchingClients(false)
      }
    }

    const timeoutId = setTimeout(searchClients, 300)
    return () => clearTimeout(timeoutId)
  }, [clientSearchTerm, selectedClient])

  useEffect(() => {
    const fetchEmpresa = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Set operador info
        setOperador({
          nome: user.user_metadata?.nome || 'Consultor'
        })

        if (user.user_metadata?.empresa_id) {
          const { data } = await supabase
            .from('empresas')
            .select('nome, logotipo, email, cor_personalizada')
            .eq('id', user.user_metadata.empresa_id)
            .single()
          
          if (data) setEmpresa(data)
        }
      }
    }
    fetchEmpresa()
  }, [])

  const fetchExistingCotacoes = async () => {
    setIsLoadingCotacoes(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.user_metadata?.empresa_id) return

      const { data, error } = await supabase
        .from('cotacoes')
        .select('id, titulo, cliente, status, valor')
        .eq('empresa_id', user.user_metadata.empresa_id)
        .not('status', 'in', '("WON","LOST")') // Filter out closed deals if needed
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      if (data) setExistingCotacoes(data)
    } catch (error) {
      console.error('Erro ao buscar cotações:', error)
    } finally {
      setIsLoadingCotacoes(false)
    }
  }

  const handleOpenKanbanModal = () => {
    setIsKanbanModalOpen(true)
    if (kanbanMode === 'select') {
      fetchExistingCotacoes()
    } else {
        // Pre-fill title based on flights
        if (voosSelecionados.length > 0) {
            const first = voosSelecionados[0]
            setNewQuoteTitle(`Aéreo: ${first.origem} -> ${first.destino}`)
        }
    }
  }

  const handleSaveToKanban = async () => {
    if (voosSelecionados.length === 0) {
        alert('Selecione ao menos um voo.')
        return
    }
    
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      let cotacaoId = selectedCotacaoId

      if (kanbanMode === 'create') {
        const clientName = selectedClient ? selectedClient.nome : clientSearchTerm
        
        if (!newQuoteTitle || !clientName) {
            alert('Preencha o título e o cliente.')
            setIsSaving(false)
            return
        }

        // Create new quote
        const codigo = await gerarCodigoUnico()
        
        const { data: newCotacao, error: createError } = await supabase
          .from('cotacoes')
          .insert({
            titulo: newQuoteTitle,
            cliente: clientName,
            cliente_id: selectedClient?.id || null,
            status: 'COTAR',
            codigo: codigo,
            empresa_id: user.user_metadata.empresa_id,
            usuario_id: user.id,
            destino: voosSelecionados[0]?.destino,
            data_viagem: voosSelecionados[0]?.partida ? new Date(voosSelecionados[0].partida) : null,
            valor: voosSelecionados.reduce((acc, curr) => acc + curr.total, 0)
          })
          .select()
          .single()

        if (createError) throw createError
        cotacaoId = newCotacao.id
      }

      if (!cotacaoId) {
          alert('Erro ao identificar a cotação.')
          setIsSaving(false)
          return
      }

      // Prepare flights for insertion (Handling connections and direct flights)
      const flightsToInsert = []
      
      for (const v of voosSelecionados) {
        if (v.conexoes && v.conexoes.length > 0) {
            // Insert segments for connected flights
            v.conexoes.forEach((c: any, index: number) => {
                // Parse dates from "DD/MM/YYYY HH:mm"
                // Assuming c.EmbarqueCompleto is like "25/10/2023 14:30"
                const [datePart, timePart] = c.EmbarqueCompleto.split(' ')
                const [day, month, year] = datePart.split('/')
                const isoDate = `${year}-${month}-${day}`
                
                const [dateCheg, timeCheg] = c.DesembarqueCompleto.split(' ')
                
                // Ensure time has seconds for Postgres time type
                const formatTime = (t: string) => t.length === 5 ? `${t}:00` : t

                flightsToInsert.push({
                    cotacao_id: cotacaoId,
                    companhia: v.cia, // Using main airline for segments as fallback
                    numero_voo: c.NumeroVoo,
                    data_ida: isoDate,
                    horario_partida: formatTime(timePart),
                    horario_chegada: formatTime(timeCheg),
                    origem: c.Origem,
                    destino: c.Destino,
                    duracao: index === 0 ? v.duracao : null, // Show total duration on first segment
                    classe: v.tarifa,
                    preco_opcao: index === 0 ? v.total : 0, // Assign price to first segment to avoid double counting
                    direcao: v.sentido,
                    bagagem_despachada: v.hasBag ? 1 : 0,
                    observacoes: `Conexão ${index + 1}/${v.conexoes?.length || 0} - ${v.cia}`,
                    dados_voo: index === 0 ? v : null // Save full JSON on the first segment/row of the option
                })
            })
        } else {
            // Direct flight
            const formatTimeFromIso = (iso: string) => {
                try {
                    return iso.split('T')[1].substring(0, 8)
                } catch (e) {
                    return '00:00:00'
                }
            }

            flightsToInsert.push({
                cotacao_id: cotacaoId,
                companhia: v.cia,
                numero_voo: v.numero,
                data_ida: v.partida.split('T')[0],
                horario_partida: formatTimeFromIso(v.partida),
                horario_chegada: formatTimeFromIso(v.chegada),
                origem: v.origem,
                destino: v.destino,
                duracao: v.duracao,
                classe: v.tarifa,
                preco_opcao: v.total,
                direcao: v.sentido,
                bagagem_despachada: v.hasBag ? 1 : 0,
                observacoes: 'Voo Direto',
                dados_voo: v // Save full JSON
            })
        }
      }

      const { error: flightsError } = await supabase
        .from('voos')
        .insert(flightsToInsert)

      if (flightsError) throw flightsError

      alert('Voos adicionados ao Kanban com sucesso!')
      setIsKanbanModalOpen(false)
      limparCotacao() // Optional: clear after adding
      
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      alert(`Erro ao salvar: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenEdit = (voo: any) => {
    setEditingFlight(voo)
    const currentDu = voo.breakdown?.du || 0
    setEditDu(currentDu.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  const formatCurrencyInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    if (!numericValue) return '0,00'
    const floatValue = parseFloat(numericValue) / 100
    return floatValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleSaveEdit = () => {
    if (!editingFlight) return
    
    const duValue = parseFloat(editDu.replace(/\./g, '').replace(',', '.') || '0')
    
    // Se já tem originalTotal salvo, usa ele. Se não, o total atual é o original (preço do provedor)
    const originalTotal = editingFlight.breakdown?.originalTotal ?? editingFlight.total
    
    const newTotal = originalTotal + duValue
    
    // Atualiza o objeto do voo com o novo total e o breakdown
    // Também atualizamos 'dados_voo' interno se existir, para manter consistência
    const updatedDadosVoo = editingFlight.dados_voo ? {
        ...editingFlight.dados_voo,
        total: newTotal,
        breakdown: {
            ...(editingFlight.breakdown || {}),
            originalTotal: originalTotal,
            du: duValue
        }
    } : undefined

    atualizarVoo(editingFlight.id, {
        total: newTotal,
        breakdown: {
            ...(editingFlight.breakdown || {}),
            originalTotal: originalTotal,
            du: duValue
        },
        dados_voo: updatedDadosVoo
    })
    
    setEditingFlight(null)
  }

  const voosIda = voosSelecionados.filter(v => v.sentido === 'ida')
  const voosVolta = voosSelecionados.filter(v => v.sentido === 'volta')
  const voosInternos = voosSelecionados.filter(v => v.sentido === 'interno')

  const renderTable = (voos: any[], titulo: string, type: 'ida' | 'volta' | 'interno') => {
    // Se não houver voos e estivermos no modo de impressão, não renderiza nada
    if (voos.length === 0) {
        return (
            <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {/* Icon logic repeated for consistency if needed, but simplified here */}
                        {type === 'ida' && <div className="p-2 rounded-lg bg-teal-50"><Plane className="h-5 w-5 text-teal-600 transform rotate-45" /></div>}
                        {type === 'volta' && <div className="p-2 rounded-lg bg-orange-50"><Plane className="h-5 w-5 text-orange-600 transform -rotate-135" /></div>}
                        {type === 'interno' && <div className="p-2 rounded-lg bg-blue-50"><Plane className="h-5 w-5 text-blue-600 transform rotate-90" /></div>}
                        {titulo}
                    </h3>
                    <span className="text-sm text-gray-500">0 selecionado(s)</span>
                </div>
                <div className="p-8 text-center text-gray-500 italic">
                    Nenhum voo selecionado.
                </div>
            </div>
        )
    }

    const isIda = type === 'ida'
    const isVolta = type === 'volta'
    const isInterno = type === 'interno'
    
    let rotateClass = ''
    let colorClass = ''
    let bgClass = ''
    let iconColor = ''

    if (isIda) {
      rotateClass = 'rotate-45'
      colorClass = 'text-teal-600'
      bgClass = 'bg-teal-50'
      iconColor = 'text-teal-600'
    } else if (isVolta) {
      rotateClass = '-rotate-135'
      colorClass = 'text-orange-600'
      bgClass = 'bg-orange-50'
      iconColor = 'text-orange-600'
    } else {
      rotateClass = 'rotate-90'
      colorClass = 'text-blue-600'
      bgClass = 'bg-blue-50'
      iconColor = 'text-blue-600'
    }

    return (
      <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <div className={`p-2 rounded-lg ${bgClass}`}>
              <Plane className={`h-5 w-5 ${iconColor} transform ${rotateClass}`} />
            </div>
            {titulo}
          </h3>
          <span className="text-sm text-gray-500">{voos.length} selecionado(s)</span>
        </div>
        
        {voos.length === 0 ? (
          <div className="p-8 text-center text-gray-500 italic">
            Nenhum voo selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 pl-4 pr-2 text-left">Cia</th>
                  <th className="py-3 px-2 text-left">Voo</th>
                  <th className="py-3 px-2 text-left">Saída</th>
                  <th className="py-3 px-2 text-left">Chegada</th>
                  <th className="py-3 px-2 text-left">Origem</th>
                  <th className="py-3 px-2 text-left">Destino</th>
                  <th className="py-3 px-2 text-center">Tarifa</th>
                  <th className="py-3 px-2 text-center">Bagagem</th>
                  <th className="py-3 pl-2 pr-4 text-right">Total</th>
                  <th className="py-3 px-2 text-center print:hidden">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {voos.map((voo, i) => {
                  if (voo.conexoes && voo.conexoes.length > 0) {
                    // Render rows for connections
                    return (
                      <React.Fragment key={voo.id}>
                        {voo.conexoes.map((c: any, cIdx: number) => {
                          const partC = c.EmbarqueCompleto ? new Date(c.EmbarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')) : new Date()
                          const chegC = c.DesembarqueCompleto ? new Date(c.DesembarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')) : new Date()
                          
                          return (
                            <tr key={`${voo.id}-${cIdx}`} className={`group bg-gray-50/50 ${cIdx === voo.conexoes.length - 1 ? 'border-b border-gray-100' : ''}`}>
                              {cIdx === 0 && (
                                <td className="py-3 pl-4 pr-2 align-middle" rowSpan={voo.conexoes.length}>
                                  {getAirlineLogoUrl(voo.cia) ? (
                                    <img src={getAirlineLogoUrl(voo.cia)!} alt={voo.cia} className="h-5 w-auto object-contain" />
                                  ) : (
                                    <span className="font-semibold text-gray-700">{voo.cia}</span>
                                  )}
                                </td>
                              )}
                              <td className="py-3 px-2 text-gray-600 font-medium"><div className="flex items-center gap-1">{c.NumeroVoo}</div></td>
                              <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{partC.toLocaleDateString('pt-BR')} - {partC.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                              <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{chegC.toLocaleDateString('pt-BR')} - {chegC.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                              <td className="py-3 px-2 text-gray-600 truncate max-w-[150px]" title={c.Origem}>{c.Origem}</td>
                              <td className="py-3 px-2 text-gray-600 truncate max-w-[200px]" title={c.Destino}>{c.Destino}</td>
                              
                              {cIdx === 0 && (
                                <>
                                  <td className="py-3 px-2 text-center text-gray-600 uppercase font-medium text-xs align-middle" rowSpan={voo.conexoes.length}>{voo.tarifa}</td>
                                  <td className="py-3 px-2 text-center align-middle" rowSpan={voo.conexoes.length}>
                                    {voo.hasBag ? (
                                      <div className="flex justify-center text-teal-600" title="Inclusa"><Luggage className="h-5 w-5" /></div>
                                    ) : (
                                      <div className="flex justify-center text-red-400" title="Não inclusa"><Ban className="h-5 w-5" /></div>
                                    )}
                                  </td>
                                  <td className="py-3 pl-2 pr-4 text-right font-bold text-gray-900 align-middle" rowSpan={voo.conexoes.length}>
                                    R$ {voo.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-2 text-center align-middle print:hidden" rowSpan={voo.conexoes.length}>
                                    <div className="flex items-center justify-center gap-1">
                                        <PriceTooltip breakdown={voo.breakdown} total={voo.total}>
                                          <button 
                                            onClick={() => handleOpenEdit(voo)}
                                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Detalhes de Valores / DU"
                                          >
                                            <Search className="h-4 w-4" />
                                          </button>
                                        </PriceTooltip>
                                        <button 
                                          onClick={() => removerVoo(voo.id)}
                                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Remover"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          )
                        })}
                      </React.Fragment>
                    )
                  } else {
                    // Render standard row for direct flight
                    const part = new Date(voo.partida)
                    const cheg = new Date(voo.chegada)
                    return (
                      <tr key={voo.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 pl-4 pr-2">
                           {getAirlineLogoUrl(voo.cia) ? (
                              <img src={getAirlineLogoUrl(voo.cia)!} alt={voo.cia} className="h-5 w-auto object-contain" />
                            ) : (
                              <span className="font-semibold text-gray-700">{voo.cia}</span>
                            )}
                        </td>
                        <td className="py-3 px-2 text-gray-600">{voo.numero}</td>
                        <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{part.toLocaleDateString('pt-BR')} - {part.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                        <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{cheg.toLocaleDateString('pt-BR')} - {cheg.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                        <td className="py-3 px-2 text-gray-600">{voo.origem}</td>
                        <td className="py-3 px-2 text-gray-600">{voo.destino}</td>
                        <td className="py-3 px-2 text-center uppercase text-xs font-medium text-gray-500">{voo.tarifa}</td>
                        <td className="py-3 px-2 text-center">
                          {voo.hasBag ? (
                            <div className="flex justify-center text-teal-600" title="Inclusa"><Luggage className="h-5 w-5" /></div>
                          ) : (
                            <div className="flex justify-center text-red-400" title="Não inclusa"><Ban className="h-5 w-5" /></div>
                          )}
                        </td>
                        <td className="py-3 pl-2 pr-4 text-right font-bold text-gray-900">
                          R$ {voo.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-2 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1">
                              <PriceTooltip breakdown={voo.breakdown} total={voo.total}>
                                <button 
                                  onClick={() => handleOpenEdit(voo)}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Detalhes de Valores / DU"
                                >
                                  <Search className="h-4 w-4" />
                                </button>
                              </PriceTooltip>
                              <button 
                                onClick={() => removerVoo(voo.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remover"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto print:p-8 print:max-w-none bg-white min-h-screen">
      {/* Header com Logo para Impressão */}
      <div className="hidden print:flex flex-col mb-8 relative">
        {/* Faixa decorativa superior */}
        <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: empresa?.cor_personalizada || '#0d9488' }}></div>
        
        <div className="pt-8 px-2 flex justify-between items-start">
          <div className="flex items-center gap-6">
            {empresa?.logotipo ? (
              <img src={empresa.logotipo} alt={empresa.nome} className="h-24 w-auto object-contain max-w-[200px]" />
            ) : (
              <div className="h-20 w-20 bg-gray-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-500">{empresa?.nome?.charAt(0) || '7'}</span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">{empresa?.nome || '7C Turismo'}</h1>
              <div className="flex flex-col mt-2 text-sm text-gray-600 gap-1">
                {empresa?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {empresa.email}
                  </div>
                )}
                {/* Outros contatos se necessário */}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 min-w-[200px]">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cotação de Viagem</p>
              <p className="text-lg font-bold text-gray-900">{new Date().toLocaleDateString('pt-BR')}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Consultor</p>
                <p className="text-base font-medium text-gray-900 flex items-center justify-end gap-2">
                  {operador?.nome}
                  <Phone className="h-3 w-3 text-gray-400" />
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Título da seção */}
        <div className="mt-8 flex items-center gap-4">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Itinerário da Viagem</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotação em Andamento</h1>
          <p className="text-sm text-gray-500 mt-1">Revise os voos selecionados antes de finalizar</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          <Printer className="h-4 w-4" />
          Gerar Orçamento
        </button>
        <button
          onClick={handleOpenKanbanModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Layout className="h-4 w-4" />
          Adicionar ao Kanban
        </button>
      </div>

      {/* Aviso de Precaução - Não aparece na impressão */}
      <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 print:hidden">
        <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-100 rounded-full flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-700" />
            </div>
            <div>
                <h4 className="font-bold text-yellow-800 mb-1">Atenção ao selecionar voos de diferentes companhias</h4>
                <p className="text-sm text-yellow-700 leading-relaxed">
                    Ao gerar orçamento de ida e volta, priorize a seleção de voos da mesma companhia aérea. 
                    Existe risco de erro de tarifação ao selecionar voos de cias diferentes em uma mesma busca. 
                    Caso necessite de cias diferentes, realize duas buscas separadas (trecho a trecho).
                </p>
            </div>
        </div>
      </div>

      <div className="print:space-y-8">
        {renderTable(voosIda, 'Voos de Ida', 'ida')}
        {renderTable(voosInternos, 'Voos Internos', 'interno')}
        {renderTable(voosVolta, 'Voos de Volta', 'volta')}
      </div>

      {/* Footer para Impressão */}
      <div className="hidden print:flex mt-12 pt-6 border-t border-gray-100 flex-col items-center justify-center text-center text-sm text-gray-500">
        <p className="font-semibold text-gray-900 mb-2">{empresa?.nome || '7C Turismo'}</p>
        <p className="max-w-2xl mx-auto">Valores e disponibilidade sujeitos a alteração sem aviso prévio. Esta cotação é válida apenas para a data de emissão.</p>
        
        <div className="mt-6 pt-6 border-t border-dashed border-gray-200 w-full flex justify-between items-center text-xs text-gray-400">
          <span>Gerado via 7CRM</span>
          <span>{new Date().toLocaleString('pt-BR')}</span>
        </div>
      </div>

      {/* Edit Values Modal */}
      {editingFlight && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Detalhamento de Valores</h3>
              <button onClick={() => setEditingFlight(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Preço do Fornecedor</span>
                <span className="font-bold text-gray-900">
                  R$ {(editingFlight.breakdown?.originalTotal ?? editingFlight.total).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DU (Taxa de Serviço)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                  <input 
                    type="text" 
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-bold text-gray-900"
                    placeholder="0,00"
                    value={editDu}
                    onChange={(e) => {
                      setEditDu(formatCurrencyInput(e.target.value))
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Este valor será somado ao preço final do aéreo.</p>
              </div>
              
              <div className="flex justify-between items-center py-3 px-4 bg-blue-50 rounded-lg border border-blue-100 mt-4">
                <span className="text-blue-800 font-bold">Valor Final</span>
                <span className="text-xl font-extrabold text-blue-900">
                  R$ {((editingFlight.breakdown?.originalTotal ?? editingFlight.total) + (parseFloat(editDu.replace(/\./g, '').replace(',', '.') || '0'))).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                  <button 
                      onClick={() => setEditingFlight(null)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
                  >
                      Cancelar
                  </button>
                  <button 
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                  >
                      <Check className="h-4 w-4" />
                      Salvar Alterações
                  </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Kanban Modal */}
      {isKanbanModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Adicionar ao Kanban</h3>
              <button onClick={() => setIsKanbanModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setKanbanMode('create')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${kanbanMode === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Nova Cotação
                </button>
                <button 
                    onClick={() => { setKanbanMode('select'); fetchExistingCotacoes() }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${kanbanMode === 'select' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Existente
                </button>
              </div>

              {kanbanMode === 'create' ? (
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Título da Cotação</label>
                          <input 
                              type="text" 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              placeholder="Ex: Férias Miami"
                              value={newQuoteTitle}
                              onChange={(e) => setNewQuoteTitle(e.target.value)}
                          />
                      </div>
                      <div className="relative z-10">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
                          {selectedClient ? (
                            <div className="flex items-center justify-between p-2 border border-blue-200 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                  {selectedClient.nome.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium text-blue-900">{selectedClient.nome}</div>
                                  <div className="text-xs text-blue-600">{selectedClient.email}</div>
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  setSelectedClient(null)
                                  setClientSearchTerm('')
                                }}
                                className="p-1 hover:bg-blue-100 rounded-full text-blue-400 hover:text-blue-600 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              {showClientSuggestions && (
                                <div 
                                  className="fixed inset-0 cursor-default" 
                                  onClick={() => setShowClientSuggestions(false)}
                                />
                              )}
                              <div className="relative z-20">
                                <div className="relative">
                                  <input 
                                      type="text" 
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                      placeholder="Busque ou crie um cliente..."
                                      value={clientSearchTerm}
                                      onChange={(e) => {
                                        setClientSearchTerm(e.target.value)
                                        setShowClientSuggestions(true)
                                      }}
                                      onFocus={() => setShowClientSuggestions(true)}
                                  />
                                  {isSearchingClients && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                
                                {showClientSuggestions && (clientSearchTerm || foundClients.length > 0) && (
                                  <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {foundClients.map(client => (
                                      <button
                                        key={client.id}
                                        onClick={() => {
                                          setSelectedClient(client)
                                          setClientSearchTerm(client.nome)
                                          setShowClientSuggestions(false)
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex flex-col border-b border-gray-50 last:border-0"
                                      >
                                        <span className="font-medium text-gray-900">{client.nome}</span>
                                        <span className="text-xs text-gray-500">{client.email} • {client.cpf}</span>
                                      </button>
                                    ))}
                                    
                                    <button
                                      onClick={() => {
                                        setIsClientModalOpen(true)
                                        setShowClientSuggestions(false)
                                      }}
                                      className="w-full text-left px-4 py-3 hover:bg-blue-50 text-blue-600 font-medium flex items-center gap-2 bg-gray-50 sticky bottom-0 border-t border-gray-100"
                                    >
                                      <UserPlus className="h-4 w-4" />
                                      Criar novo cliente "{clientSearchTerm}"
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                  </div>
              ) : (
                  <div className="space-y-4">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input 
                              type="text" 
                              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              placeholder="Buscar cotação..."
                              // Implement search filter later if needed
                          />
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                          {isLoadingCotacoes ? (
                              <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Carregando...
                              </div>
                          ) : existingCotacoes.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 text-sm">Nenhuma cotação encontrada.</div>
                          ) : (
                              existingCotacoes.map(c => (
                                  <button 
                                      key={c.id}
                                      onClick={() => setSelectedCotacaoId(c.id)}
                                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedCotacaoId === c.id ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : ''}`}
                                  >
                                      <div>
                                          <div className="font-medium text-gray-900">{c.titulo}</div>
                                          <div className="text-xs text-gray-500">{c.cliente} • {c.status}</div>
                                      </div>
                                      {selectedCotacaoId === c.id && <Check className="h-4 w-4 text-blue-600" />}
                                  </button>
                              ))
                          )}
                      </div>
                  </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-2">
                  <button 
                      onClick={() => setIsKanbanModalOpen(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
                  >
                      Cancelar
                  </button>
                  <button 
                      onClick={handleSaveToKanban}
                      disabled={isSaving || (kanbanMode === 'select' && !selectedCotacaoId)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layout className="h-4 w-4" />}
                      Salvar no Kanban
                  </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Client Modal */}
      {isClientModalOpen && currentUser && (
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSuccess={(newClient) => {
            setSelectedClient(newClient)
            setClientSearchTerm(newClient.nome)
          }}
          user={currentUser}
        />
      )}
    </div>
  )
}
