import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

export interface SearchCacheData<T = any> {
  timestamp: number
  formData: any
  results: T[]
  type: 'domestico' | 'internacional'
}

export const useSearchCache = (key: string) => {
  const [expiresAt, setExpiresAt] = useState<number | null>(null)

  const saveCache = useCallback(async (formData: any, results: any[], type: 'domestico' | 'internacional') => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = Date.now()
      const cacheData: SearchCacheData = {
        timestamp: now,
        formData,
        results,
        type
      }
      
      const expires_at = new Date(now + CACHE_DURATION).toISOString()

      const { error } = await supabase
        .from('user_search_cache')
        .upsert({
          user_id: user.id,
          key,
          data: cacheData,
          expires_at
        })

      if (error) throw error
      
      setExpiresAt(now + CACHE_DURATION)
    } catch (error) {
      console.error('Failed to save search cache to Supabase:', error)
    }
  }, [key])

  const loadCache = useCallback(async (): Promise<SearchCacheData | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('user_search_cache')
        .select('data, expires_at')
        .eq('user_id', user.id)
        .eq('key', key)
        .maybeSingle()

      if (error || !data) return null

      const now = Date.now()
      const expirationTime = new Date(data.expires_at).getTime()
      
      if (now > expirationTime) {
        await clearCache()
        return null
      }

      setExpiresAt(expirationTime)
      return data.data as SearchCacheData
    } catch (e) {
      console.error('Error loading search cache from Supabase', e)
      return null
    }
  }, [key])

  const clearCache = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('user_search_cache')
        .delete()
        .eq('user_id', user.id)
        .eq('key', key)
      
      setExpiresAt(null)
    } catch (e) {
      console.error('Error clearing cache', e)
    }
  }, [key])

  return {
    expiresAt,
    saveCache,
    loadCache,
    clearCache
  }
}
