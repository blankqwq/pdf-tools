import { useState, useRef, useCallback } from 'react'

export interface ProgressState {
  percentage: number // 0-100
  estimatedSecondsRemaining: number | null
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>({
    percentage: 0,
    estimatedSecondsRemaining: null
  })
  
  const startTimeRef = useRef<number | null>(null)
  
  const start = useCallback(() => {
    setState({ percentage: 0, estimatedSecondsRemaining: null })
    startTimeRef.current = Date.now()
  }, [])
  
  const update = useCallback((percentage: number) => {
    setState(prev => {
      const now = Date.now()
      if (!startTimeRef.current) startTimeRef.current = now
      
      const elapsed = (now - startTimeRef.current) / 1000
      
      // Don't estimate if progress is too low or time is too short
      if (percentage < 5 || elapsed < 1) {
        return { percentage, estimatedSecondsRemaining: null }
      }
      
      // Rate = percentage / elapsed
      // Remaining = (100 - percentage) / Rate
      const rate = percentage / elapsed
      const remaining = (100 - percentage) / rate
      
      return {
        percentage,
        estimatedSecondsRemaining: Math.ceil(remaining)
      }
    })
  }, [])
  
  const reset = useCallback(() => {
    setState({ percentage: 0, estimatedSecondsRemaining: null })
    startTimeRef.current = null
  }, [])
  
  return {
    progress: state.percentage,
    estimatedSecondsRemaining: state.estimatedSecondsRemaining,
    start,
    update,
    reset
  }
}
