import { useEffect, useRef, useState } from 'react'

export function useAutoScroll({ smooth, content }: { smooth?: boolean; content: any }) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)

  const scrollToBottom = () => {
    const el = scrollRef.current
    if (!el) return
    const behavior = smooth ? 'smooth' : 'auto'
    el.scrollTo({ top: el.scrollHeight, behavior })
  }

  const checkPosition = () => {
    const el = scrollRef.current
    if (!el) return
    const threshold = 32
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= threshold)
  }

  const disableAutoScroll = () => {
    setAutoScrollEnabled(false)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      checkPosition()
      if (autoScrollEnabled && isAtBottom) scrollToBottom()
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [autoScrollEnabled, isAtBottom])

  useEffect(() => {
    if (autoScrollEnabled) scrollToBottom()
  }, [content, autoScrollEnabled])

  return { scrollRef, isAtBottom, autoScrollEnabled, scrollToBottom, disableAutoScroll }
}

