import { useState } from 'react'
import { FileDropZone } from '../components/ui/FileDropZone'
import { Button } from '../components/ui/Button'
import { pdfToPptx } from '../lib/pdf-conversion'
import { ArrowRight, Loader2 } from 'lucide-react'

import { useLanguage } from '../contexts/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import { ProgressBar } from '../components/ui/ProgressBar'
import { PdfPreview } from '../components/PdfPreview'

export function PdfToPptPage() {
  const { t } = useLanguage()
  const { progress, estimatedSecondsRemaining, start, update, reset } = useProgress()
  const [file, setFile] = useState<File | null>(null)
  const isConverting = progress > 0

  const handleFilesSelected = (newFiles: File[]) => {
    // Single file for now to keep it simple, or multiple?
    // Let's support single file for conversion tasks usually.
    if (newFiles.length > 0) {
      setFile(newFiles[0])
    }
  }

  const handleConvert = async () => {
    if (!file) return

    start()
    try {
      const pptxBytes = await pdfToPptx(file, (p) => {
        update(p)
      })

      await window.electron.ipcRenderer.invoke('dialog:saveFile', {
        buffer: pptxBytes,
        filters: [{ name: 'PowerPoint', extensions: ['pptx'] }]
      })
    } catch (error) {
      console.error('Conversion failed', error)
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
              {t('page.pdf2ppt.title')}
            </h2>
            <p className="text-slate-400 mb-8 text-center block">{t('page.pdf2ppt.description')}</p>
            <FileDropZone
              onFilesSelected={handleFilesSelected}
              accept="application/pdf"
              multiple={false}
              description={t('page.pdf2ppt.dropDescription')}
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
            <h2 className="text-2xl font-bold text-slate-200">{t('page.pdf2ppt.title')}</h2>
            <p className="text-slate-400">{t('page.pdf2ppt.subtitle', { name: file.name })}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setFile(null)} disabled={isConverting}>
              {t('common.clear')}
            </Button>
            <Button onClick={handleConvert} disabled={isConverting}>
              {isConverting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {isConverting ? t('common.converting') : t('page.pdf2ppt.convert')}
            </Button>
          </div>
        </div>

        {isConverting && (
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
