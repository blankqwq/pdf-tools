import { useState } from 'react'
import { FileDropZone } from '../components/ui/FileDropZone'
import { Button } from '../components/ui/Button'
import { mergePdfs } from '../lib/pdf-actions'
import { File as FileIcon, X, ArrowRight, Loader2 } from 'lucide-react'

import { useLanguage } from '../contexts/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import { ProgressBar } from '../components/ui/ProgressBar'

export function MergePage() {
  const { t } = useLanguage()
  const { progress, estimatedSecondsRemaining, start, update, reset } = useProgress()
  const [files, setFiles] = useState<File[]>([])
  const isMerging = progress > 0

  const handleFilesSelected = (newFiles: File[]) => {
    // Check for duplicates based on name and size
    const uniqueFiles = newFiles.filter(nf => 
      !files.some(f => f.name === nf.name && f.size === nf.size)
    )
    setFiles([...files, ...uniqueFiles])
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleMerge = async () => {
    if (files.length < 2) return
    
    start()
    try {
      const mergedPdfBytes = await mergePdfs(files, (p) => {
        update(p)
      })
      
      const result = await window.electron.ipcRenderer.invoke('dialog:savePdf', mergedPdfBytes)
      
      if (result.success) {
        setFiles([])
      }
    } catch (error) {
      console.error('Merge failed', error)
    } finally {
      reset()
    }
  }

  if (files.length === 0) {
    return (
      <div className="p-10 h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="max-w-xl w-full">
             <h2 className="text-3xl font-bold text-slate-200 mb-2 text-center">{t('page.merge.title')}</h2>
             <p className="text-slate-400 mb-8 text-center block">{t('page.merge.description')}</p>
             <FileDropZone onFilesSelected={handleFilesSelected} multiple={true} description={t('page.merge.dropDescription')} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 h-full flex flex-col max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">{t('page.merge.title')}</h2>
          <p className="text-slate-400">{t('page.merge.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setFiles([])} disabled={isMerging}>{t('common.clearAll')}</Button>
          <Button onClick={handleMerge} disabled={isMerging || files.length < 2}>
            {isMerging ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {isMerging ? t('common.converting') : t('page.merge.convert')}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 relative">
        {isMerging && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
            <ProgressBar progress={progress} label={t('common.converting')} estimatedSecondsRemaining={estimatedSecondsRemaining} className="w-64" />
          </div>
        )}
        
        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <FileIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-slate-200 font-medium truncate">{file.name}</h4>
              <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button 
              onClick={() => removeFile(index)}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
        
        <div className="pt-4">
          <FileDropZone 
            onFilesSelected={handleFilesSelected} 
            multiple={true} 
            description={t('page.merge.addMore')}
          />
        </div>
      </div>
    </div>
  )
}
