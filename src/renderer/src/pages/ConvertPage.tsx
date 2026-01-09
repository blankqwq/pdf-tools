import { PdfPreview } from '../components/PdfPreview'
import { FileDropZone } from '../components/ui/FileDropZone'
import { useLanguage } from '../contexts/LanguageContext'

export type ConversionFormat = 'word' | 'ppt' | 'image'

interface ConvertPageProps {
  file: File | null
  onFilesChange: (files: File[]) => void
  targetFormat: ConversionFormat
  onFormatChange: (format: ConversionFormat) => void
}

export function ConvertPage({
  file,
  onFilesChange
}: Pick<ConvertPageProps, 'file' | 'onFilesChange'>): React.JSX.Element {
  const { t } = useLanguage()

  const handleFilesSelected = (files: File[]): void => {
    if (files.length > 0) {
      onFilesChange([files[0]])
    }
  }

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-xl w-full">
          <FileDropZone
            onFilesSelected={handleFilesSelected}
            accept="application/pdf"
            multiple={false}
            description={t('page.pdf2any.dropDescription')}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-slate-200">{t('common.preview')}</h3>
        <button
          onClick={() => onFilesChange([])}
          className="text-sm text-red-500/80 hover:text-red-400 transition-colors px-3 py-1 hover:bg-red-500/10 rounded-lg"
        >
          {t('common.clear')}
        </button>
      </div>
      <div className="flex-1 p-8 overflow-hidden">
        <PdfPreview file={file} className="h-full" />
      </div>
    </div>
  )
}
