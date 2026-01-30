import React, { useEffect, useState, useRef } from 'react'
import { Clock } from 'lucide-react'

interface SearchTimerProps {
  expiresAt: number | null
  onExpire: () => void
  label?: string
}

const SearchTimer: React.FC<SearchTimerProps> = ({ expiresAt, onExpire, label = 'Resultados expiram em:' }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const onExpireRef = useRef(onExpire)

  // Keep ref updated
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(null)
      return
    }

    // Check immediately
    const checkTime = () => {
      const now = Date.now()
      const diff = expiresAt - now

      if (diff <= 0) {
        setTimeLeft(0)
        onExpireRef.current()
        return false // Stop
      } else {
        setTimeLeft(diff)
        return true // Continue
      }
    }

    if (!checkTime()) return

    const interval = setInterval(() => {
      if (!checkTime()) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  if (!expiresAt) return null

  // Show "Calculando..." or initial state if timeLeft is null but expiresAt is present
  // This prevents it from returning null and not rendering anything during the first tick
  const displayTime = timeLeft !== null ? timeLeft : (expiresAt - Date.now())

  if (displayTime <= 0) return null

  const minutes = Math.floor(displayTime / 60000)
  const seconds = Math.floor((displayTime % 60000) / 1000)

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 shadow-sm">
      <Clock className="h-4 w-4" />
      <span>
        {label} {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  )
}

export default SearchTimer
