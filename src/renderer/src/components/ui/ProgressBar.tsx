import { twMerge } from 'tailwind-merge'

interface ProgressBarProps {
  progress: number
  className?: string
  label?: string
}

export function ProgressBar({ progress, className, label }: ProgressBarProps) {
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
    </div>
  )
}
