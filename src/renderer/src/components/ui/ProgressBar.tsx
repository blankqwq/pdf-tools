import { twMerge } from 'tailwind-merge'
import { useLanguage } from '../../contexts/LanguageContext'

interface ProgressBarProps {
  progress: number
  className?: string
  label?: string
  estimatedSecondsRemaining?: number | null
}

export function ProgressBar({ progress, className, label, estimatedSecondsRemaining }: ProgressBarProps) {
  const { t } = useLanguage()

  return (
    <div className={twMerge("w-full max-w-md", className)}>
      <div className="flex justify-between mb-1">
        {label && <span className="text-sm font-medium text-slate-300">{label}</span>}
        <span className="text-sm font-medium text-slate-400">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
      {estimatedSecondsRemaining !== null && estimatedSecondsRemaining !== undefined && estimatedSecondsRemaining > 0 && (
        <p className="text-xs text-slate-500 mt-2 text-center">
          {t('common.timeRemaining')}: {estimatedSecondsRemaining} {t('common.seconds')}
        </p>
      )}
    </div>
  )
}
