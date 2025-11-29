import { useEffect, useRef, useState } from 'react'
import { X, Send, Bot, Headphones } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type ChatWidgetProps = {
  onClose: () => void
  user: User
}

type Message = {
  id: string
  author: 'user' | 'ia' | 'central'
  text: string
  ts: number
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ onClose, user }) => {
  const [mode, setMode] = useState<'ia' | 'central'>('ia')
  const [input, setInput] = useState('')
  const [messagesIA, setMessagesIA] = useState<Message[]>([])
  const [messagesCentral, setMessagesCentral] = useState<Message[]>([])
  const listRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const [typingIA, setTypingIA] = useState(false)
  const [typingCentral, setTypingCentral] = useState(false)
  const [setteEnabled, setSetteEnabled] = useState<boolean>(true)
  const [setteVisible, setSetteVisible] = useState<boolean>(true)
  const [centralVisible, setCentralVisible] = useState<boolean>(false)
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [animState, setAnimState] = useState<'in' | 'out'>('in')
  const [showBotWave, setShowBotWave] = useState<boolean>(true)
  const [botHint, setBotHint] = useState<string>('')
  const hints = [
    'Cadastre um novo cliente em segundos.',
    'Vamos lançar contas a pagar e receber agora?',
    'Crie uma tarefa no calendário para não esquecer.',
    'Adicione um card no Kanban e organize seus clientes.',
    'Quer ver voos e quem embarca? Eu consulto já.',
    'Infos rápidas: destinos, vistos, passagens, hospedagem e câmbio.'
  ]

  const currentMessages = mode === 'ia' ? messagesIA : messagesCentral
  const setCurrentMessages = mode === 'ia' ? setMessagesIA : setMessagesCentral

  const scrollToBottom = () => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentMessages, mode])

  // Persistência de histórico por 48h
  const persistHistory = (ia: Message[], central: Message[]) => {
    try {
      const empresaId = (user.user_metadata?.empresa_id as string | undefined) || 'na'
      const key = `sette_chat_${user.id}_${empresaId}`
      const payload = { ia, central }
      localStorage.setItem(key, JSON.stringify(payload))
    } catch {}
  }

  const loadHistory = () => {
    try {
      const empresaId = (user.user_metadata?.empresa_id as string | undefined) || 'na'
      const key = `sette_chat_${user.id}_${empresaId}`
      const raw = localStorage.getItem(key)
      if (!raw) return
      const data = JSON.parse(raw)
      const cutoff = Date.now() - 48 * 60 * 60 * 1000
      const ia = Array.isArray(data?.ia) ? data.ia.filter((m: Message) => m.ts >= cutoff) : []
      const central = Array.isArray(data?.central) ? data.central.filter((m: Message) => m.ts >= cutoff) : []
      setMessagesIA(ia)
      setMessagesCentral(central)
      persistHistory(ia, central)
    } catch {}
  }

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    setShowBotWave(true)
    const key = 'sette_hint_idx'
    const last = Number(localStorage.getItem(key) || '0')
    const next = (isNaN(last) ? 0 : last + 1) % hints.length
    localStorage.setItem(key, String(next))
    setBotHint(hints[next])
    const t = setTimeout(() => setShowBotWave(false), 3200)
    return () => clearTimeout(t)
  }, [])

  const resolveEmpresaId = async (): Promise<string | null> => {
    if (empresaId) return empresaId
    let empId: string | null = (user.user_metadata?.empresa_id as string | undefined) || null
    if (!empId) {
      const { data } = await supabase
        .from('usuarios_empresas')
        .select('empresa_id')
        .eq('usuario_id', user.id)
        .limit(1)
      if (data && data[0]?.empresa_id) empId = data[0].empresa_id as string
    }
    if (empId) setEmpresaId(empId)
    return empId
  }

  const queueUnsent = (empId: string | null, item: { client_id: string, mode: 'ia' | 'central', author: 'user' | 'ia' | 'central', text: string, ts: string }) => {
    try {
      const eid = empId || 'na'
      const key = `sette_unsent_${user.id}_${eid}`
      const raw = localStorage.getItem(key)
      const arr = raw ? JSON.parse(raw) : []
      arr.push(item)
      localStorage.setItem(key, JSON.stringify(arr))
    } catch {}
  }

  const flushUnsent = async (empId: string) => {
    try {
      const key = `sette_unsent_${user.id}_${empId}`
      const raw = localStorage.getItem(key)
      if (!raw) return
      const arr: Array<{ client_id: string, mode: 'ia' | 'central', author: 'user' | 'ia' | 'central', text: string, ts: string }> = JSON.parse(raw)
      if (!Array.isArray(arr) || arr.length === 0) return
      const { error } = await supabase.from('chat_messages').insert(
        arr.map(i => ({ usuario_id: user.id, empresa_id: empId, client_id: i.client_id, mode: i.mode, author: i.author, text: i.text, ts: i.ts }))
      )
      if (!error) localStorage.removeItem(key)
    } catch {}
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - 48 * 60 * 60 * 1000
      setMessagesIA(prev => {
        const next = prev.filter(m => m.ts >= cutoff)
        persistHistory(next, messagesCentral)
        return next
      })
      setMessagesCentral(prev => {
        const next = prev.filter(m => m.ts >= cutoff)
        persistHistory(messagesIA, next)
        return next
      })
    }, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [messagesIA, messagesCentral])

  useEffect(() => {
    const fetchSettings = async () => {
      let empId: string | null = await resolveEmpresaId()
      if (!empId) return
      setEmpresaId(empId)
      await supabase.rpc('purge_expired_chat_messages')
      await flushUnsent(empId)
      const { data } = await supabase
        .from('empresas')
        .select('sette_enabled, sette_visible, central_visible')
        .eq('id', empId)
        .single()
      if (data) {
        setSetteEnabled(typeof data.sette_enabled === 'boolean' ? data.sette_enabled : true)
        setSetteVisible(typeof data.sette_visible === 'boolean' ? data.sette_visible : true)
        setCentralVisible(typeof data.central_visible === 'boolean' ? data.central_visible : false)
        if (!data.sette_visible && mode === 'ia' && data.central_visible) setMode('central')
        if (!data.central_visible && mode === 'central' && data.sette_visible) setMode('ia')
        if (!data.central_visible && !data.sette_visible) setMode('ia')
      }
      const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      const { data: history } = await supabase
        .from('chat_messages')
        .select('mode, author, text, ts')
        .eq('usuario_id', user.id)
        .eq('empresa_id', empId)
        .gte('ts', since)
        .order('ts', { ascending: true })
      if (history && Array.isArray(history)) {
        const iaMsgs: Message[] = []
        const centralMsgs: Message[] = []
        history.forEach((h: any) => {
          const msg: Message = {
            id: Math.random().toString(36).slice(2),
            author: h.author === 'user' ? 'user' : (h.author === 'ia' ? 'ia' : 'central'),
            text: h.text,
            ts: new Date(h.ts).getTime()
          }
          if (h.mode === 'ia') iaMsgs.push(msg)
          else centralMsgs.push(msg)
        })
        setMessagesIA(iaMsgs)
        setMessagesCentral(centralMsgs)
      }
    }
    fetchSettings().catch(() => {})
  }, [user])

  const webhookUrl = (import.meta as any).env.VITE_SETTE_WEBHOOK_URL || 'https://n8n.srv999039.hstgr.cloud/webhook/400e1a10-1a0f-4e50-bdac-1e4c3797c6d4'

  const sendToWebhook = async (text: string) => {
    const payload = {
      message: text,
      empresa_id: user.user_metadata?.empresa_id ?? null,
      user_id: user.id,
      user_name: user.user_metadata?.nome ?? user.user_metadata?.full_name ?? user.email,
      empresa_name: user.user_metadata?.empresa ?? null,
      timestamp: new Date().toISOString()
    }
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      let reply = 'Sette: sua mensagem foi recebida.'
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const body = await res.json()
        reply = body.output || body.reply || body.message || body.text || (typeof body === 'string' ? body : JSON.stringify(body))
      } else {
        const textBody = await res.text()
        if (textBody) reply = textBody
      }
      return { ok: res.ok, reply }
    } catch {
      return { ok: false, reply: 'Sette: houve um erro ao enviar sua mensagem.' }
    }
  }

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return
    const id = Math.random().toString(36).slice(2)
    const now = Date.now()
    const userMsg: Message = { id, author: 'user', text, ts: now }
    setCurrentMessages(prev => {
      const next = [...prev, userMsg]
      if (mode === 'ia') persistHistory(next, messagesCentral)
      else persistHistory(messagesIA, next)
      return next
    })
    setInput('')
    if (mode === 'ia') {
      if (!setteEnabled) {
        const replyMsg: Message = { id: id + '-r', author: 'ia', text: 'Sette está desativado pelo administrador.', ts: Date.now() }
        setMessagesIA(prev => {
          const next = [...prev, replyMsg]
          persistHistory(next, messagesCentral)
          return next
        })
        return
      }
      setTypingIA(true)
      resolveEmpresaId().then(async (empId) => {
        const tsIso = new Date(now).toISOString()
        const cidUser = `${user.id}-ia-user-${now}-${Math.random().toString(36).slice(2)}`
        if (empId) {
          const { error } = await supabase.from('chat_messages').insert({ usuario_id: user.id, empresa_id: empId, client_id: cidUser, mode: 'ia', author: 'user', text, ts: tsIso })
          if (error) queueUnsent(empId, { client_id: cidUser, mode: 'ia', author: 'user', text, ts: tsIso })
        } else {
          queueUnsent(null, { client_id: cidUser, mode: 'ia', author: 'user', text, ts: tsIso })
        }
      })
      sendToWebhook(text).then(({ ok, reply }) => {
        setTypingIA(false)
        const replyText = ok ? reply : 'Sette: houve um erro ao enviar sua mensagem.'
        const replyMsg: Message = { id: id + '-r', author: 'ia', text: replyText, ts: Date.now() }
        setMessagesIA(prev => {
          const next = [...prev, replyMsg]
          persistHistory(next, messagesCentral)
          resolveEmpresaId().then(async (empId) => {
            const tsIso = new Date().toISOString()
            const cidIa = `${user.id}-ia-reply-${Date.now()}-${Math.random().toString(36).slice(2)}`
            if (empId) {
              const { error } = await supabase.from('chat_messages').insert({ usuario_id: user.id, empresa_id: empId, client_id: cidIa, mode: 'ia', author: 'ia', text: replyText, ts: tsIso })
              if (error) queueUnsent(empId, { client_id: cidIa, mode: 'ia', author: 'ia', text: replyText, ts: tsIso })
            } else {
              queueUnsent(null, { client_id: cidIa, mode: 'ia', author: 'ia', text: replyText, ts: tsIso })
            }
          })
          return next
        })
      })
    } else {
      setTypingCentral(true)
      resolveEmpresaId().then(async (empId) => {
        const tsIso = new Date(now).toISOString()
        const cidUser = `${user.id}-central-user-${now}-${Math.random().toString(36).slice(2)}`
        if (empId) {
          const { error } = await supabase.from('chat_messages').insert({ usuario_id: user.id, empresa_id: empId, client_id: cidUser, mode: 'central', author: 'user', text, ts: tsIso })
          if (error) queueUnsent(empId, { client_id: cidUser, mode: 'central', author: 'user', text, ts: tsIso })
        } else {
          queueUnsent(null, { client_id: cidUser, mode: 'central', author: 'user', text, ts: tsIso })
        }
      })
      setTimeout(() => {
        setTypingCentral(false)
        const replyText = 'Central 7C: estamos disponíveis para ajudar.'
        const reply: Message = { id: id + '-r', author: 'central', text: replyText, ts: Date.now() }
        setMessagesCentral(prev => {
          const next = [...prev, reply]
          persistHistory(messagesIA, next)
          resolveEmpresaId().then(async (empId) => {
            const tsIso = new Date().toISOString()
            const cidCentral = `${user.id}-central-reply-${Date.now()}-${Math.random().toString(36).slice(2)}`
            if (empId) {
              const { error } = await supabase.from('chat_messages').insert({ usuario_id: user.id, empresa_id: empId, client_id: cidCentral, mode: 'central', author: 'central', text: replyText, ts: tsIso })
              if (error) queueUnsent(empId, { client_id: cidCentral, mode: 'central', author: 'central', text: replyText, ts: tsIso })
            } else {
              queueUnsent(null, { client_id: cidCentral, mode: 'central', author: 'central', text: replyText, ts: tsIso })
            }
          })
          return next
        })
      }, 600)
    }
  }

  const handleClose = () => {
    setAnimState('out')
    setTimeout(() => {
      onClose()
    }, 220)
  }

  return (
    <div id={animState === 'in' ? 'chat-enter' : 'chat-exit'} className="fixed bottom-24 right-6 z-50 w-96 sm:w-[30rem] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-visible">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {setteVisible && (
            <button
              onClick={() => setMode('ia')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${mode === 'ia' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
            >
              <Bot className="h-4 w-4" />
              Sette
            </button>
          )}
          {centralVisible && (
            <button
              onClick={() => setMode('central')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded_full text-sm ${mode === 'central' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
            >
              <Headphones className="h-4 w-4" />
              Central 7C
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Fechar chat"
          title="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div ref={listRef} className="h-80 overflow-y-auto p-3 space-y-2 bg-white">
        {currentMessages.map(m => (
          <div key={m.id} className={`flex ${m.author === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
              m.author === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
            } whitespace-pre-line break-words`}>
              {m.text}
            </div>
          </div>
        ))}
        {mode === 'ia' && typingIA && (
          <div className="flex justify-start">
            <div className="max-w-[75%] px-3 py-2 rounded-2xl text-sm bg-gray-100 text-gray-900 rounded-bl-sm">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          </div>
        )}
        {mode === 'central' && typingCentral && (
          <div className="flex justify-start">
            <div className="max-w-[75%] px-3 py-2 rounded-2xl text-sm bg-gray-100 text-gray-900 rounded-bl-sm">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="flex items-center gap-2">
          <textarea
            ref={inputRef}
            rows={3}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              } else if (e.key === ' ' && e.shiftKey) {
                e.preventDefault()
                const ta = e.target as HTMLTextAreaElement
                const start = ta.selectionStart ?? input.length
                const end = ta.selectionEnd ?? input.length
                const newVal = input.slice(0, start) + '\n' + input.slice(end)
                setInput(newVal)
                requestAnimationFrame(() => {
                  const el = inputRef.current
                  if (el) el.setSelectionRange(start + 1, start + 1)
                })
              }
            }}
            placeholder={mode === 'ia' ? (setteEnabled ? 'Enviar mensagem para Sette' : 'Sette desativado pelo admin') : 'Enviar mensagem para Central 7C'}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
          <button
            onClick={sendMessage}
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400"
            aria-label="Enviar"
            title="Enviar"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
      {showBotWave && (
        <div className="absolute -top-10 left-6 z-50 pointer-events-none">
          <div className="h-10 w-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg bot-wave">
            <Bot className="h-5 w-5" />
          </div>
          <div className="bot-bubble absolute -top-2 left-14 bg-white border border-gray-200 rounded-2xl px-4 py-2 text-sm text-gray-800 shadow-lg whitespace-nowrap min-w-[18rem]">
            {botHint}
            <div className="absolute left-2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatWidget