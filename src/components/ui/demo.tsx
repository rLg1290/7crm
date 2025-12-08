"use client"

import { useState, FormEvent } from 'react'
import { Send, Bot, CornerDownLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat-bubble'
import { ChatInput } from '@/components/ui/chat-input'
import { ExpandableChat, ExpandableChatHeader, ExpandableChatBody, ExpandableChatFooter } from '@/components/ui/expandable-chat'
import { ChatMessageList } from '@/components/ui/chat-message-list'

export function ExpandableChatDemo() {
  const [messages, setMessages] = useState([
    { id: 1, content: 'Olá! Como posso ajudar?', sender: 'ai' },
    { id: 2, content: 'Tenho uma dúvida sobre o componente.', sender: 'user' },
    { id: 3, content: 'Claro! O que você precisa?', sender: 'ai' }
  ])

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setMessages(prev => [...prev, { id: prev.length + 1, content: input, sender: 'user' }])
    setInput('')
    setIsLoading(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { id: prev.length + 1, content: 'Resposta da IA ao seu texto.', sender: 'ai' }])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="h-[600px] relative">
      <ExpandableChat size="lg" position="bottom-right" icon={<Bot className="h-6 w-6" />}>
        <ExpandableChatHeader className="flex-col text-center justify-center bg-white">
          <h1 className="text-xl font-semibold">Chat</h1>
          <p className="text-sm text-gray-600">Formato visual com fundos brancos</p>
        </ExpandableChatHeader>
        <ExpandableChatBody>
          <ChatMessageList>
            {messages.map(message => (
              <ChatBubble key={message.id} variant={message.sender === 'user' ? 'sent' : 'received'}>
                <ChatBubbleAvatar className="h-8 w-8 shrink-0" fallback={message.sender === 'user' ? 'US' : 'AI'} />
                <ChatBubbleMessage variant={message.sender === 'user' ? 'sent' : 'received'}>
                  {message.content}
                </ChatBubbleMessage>
              </ChatBubble>
            ))}
            {isLoading && (
              <ChatBubble variant="received">
                <ChatBubbleAvatar className="h-8 w-8 shrink-0" fallback="AI" />
                <ChatBubbleMessage isLoading />
              </ChatBubble>
            )}
          </ChatMessageList>
        </ExpandableChatBody>
        <ExpandableChatFooter className="bg-white">
          <form onSubmit={handleSubmit} className="relative rounded-lg border bg-white focus-within:ring-1 focus-within:ring-blue-400 p-1">
            <ChatInput value={input} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)} placeholder="Digite sua mensagem..." className="min-h-12 resize-none rounded-lg bg-white border-0 p-3 shadow-none focus-visible:ring-0" />
            <div className="flex items-center p-3 pt-0 justify-end">
              <Button type="submit" size="sm" className="ml-auto gap-1.5">
                Enviar
                <CornerDownLeft className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        </ExpandableChatFooter>
      </ExpandableChat>
    </div>
  )
}
