import { useState } from 'react'
import { FileDropZone } from '../components/ui/FileDropZone'
import { Button } from '../components/ui/Button'
import { splitPdf } from '../lib/pdf-actions'
import { Split, ArrowRight, Loader2 } from 'lucide-react'

import { useLanguage } from '../contexts/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import { ProgressBar } from '../components/ui/ProgressBar'

export function SplitPage() {
  const { t } = useLanguage()
  const { progress, estimatedSecondsRemaining, start, update, reset } = useProgress()
  const [file, setFile] = useState<File | null>(null)
  const isSplitting = progress > 0

  const handleFilesSelected = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0])
    }
  }

  const handleSplit = async () => {
    if (!file) return

    start()
    try {
      const zipBytes = await splitPdf(file, (p) => {
        update(p)
      })

      await window.electron.ipcRenderer.invoke('dialog:saveFile', {
        buffer: zipBytes,
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
      })
    } catch (error) {
      console.error('Split failed', error)
    } finally {
      reset()
    }
  }

  if (!file) {
    return (
      <div className="p-10 h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="max-w-xl w-full">
            <h2 className="text-3xl font-bold text-slate-200 mb-2 text-center">
              {t('page.split.title')}
            </h2>
            <p className="text-slate-400 mb-8 text-center block">{t('page.split.description')}</p>
            <FileDropZone
              onFilesSelected={handleFilesSelected}
              accept="application/pdf"
              multiple={false}
              description={t('page.split.dropDescription')}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 h-full flex flex-col max-w-5xl mx-auto">

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-200">{t('page.split.title')}</h2>
            <p className="text-slate-400">{t('page.split.subtitle', { name: file.name })}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setFile(null)} disabled={isSplitting}>
              {t('common.clear')}
            </Button>
            <Button onClick={handleSplit} disabled={isSplitting}>
              {isSplitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {isSplitting ? t('common.converting') : t('page.split.convert')}
            </Button>
          </div>
        </div>
        
        {isSplitting && (
          <ProgressBar
            progress={progress}
            label={t('common.converting')}
            estimatedSecondsRemaining={estimatedSecondsRemaining}
          />
        )}
      </div>

      <div className="flex-1">
        <PdfPreview file={file} className="h-full" />
      </div>
    </div>
  )
}
