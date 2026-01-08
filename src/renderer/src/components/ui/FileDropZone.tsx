import { useState, useRef, ChangeEvent, DragEvent } from 'react'
import { Upload } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'


interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  multiple?: boolean
  description?: string
}

export function FileDropZone({ 
  onFilesSelected, 
  accept = "application/pdf", 
  multiple = true,
  description = "Drag & drop PDF files here" 
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files))
    }
    // Reset value so same files can be selected again if needed
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={twMerge(clsx(
        "relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-12 gap-4 group overflow-hidden",
        isDragOver 
          ? "border-blue-500 bg-blue-500/10 scale-[1.01]" 
          : "border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50"
      ))}
    >
      <div className={clsx(
        "p-4 rounded-full transition-colors duration-300",
        isDragOver ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300"
      )}>
        <Upload className="w-8 h-8" />
      </div>
      <div className="text-center space-y-2 relative z-10">
        <h3 className="text-lg font-semibold text-slate-200">
          {description}
        </h3>
        <p className="text-sm text-slate-500">
          or click to browse files
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
      />
      
      {/* Decorative gradient blob */}
      <div className={clsx(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none transition-opacity duration-500",
        isDragOver ? "opacity-100" : "opacity-0"
      )} />
    </div>
  )
}
