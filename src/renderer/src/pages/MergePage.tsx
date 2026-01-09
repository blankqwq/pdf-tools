import { useLanguage } from '../contexts/LanguageContext'
import { PdfPreview } from '../components/PdfPreview'
import { FileDropZone } from '../components/ui/FileDropZone'

interface MergePageProps {
  files: File[]
  onFilesChange: (files: File[]) => void
}

export function MergePage({ files, onFilesChange }: MergePageProps) {
  const { t } = useLanguage()

  const handleFilesSelected = (newFiles: File[]) => {
    onFilesChange([...files, ...newFiles])
  }

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-xl w-full">
          <FileDropZone
            onFilesSelected={handleFilesSelected}
            accept="application/pdf"
            multiple={true}
            description="Drop PDF files here or click to upload"
          />
        </div>
      </div>
    )
  }

  // Show preview of first file
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-200">
            {t('sidebar.fileCount', { count: files.length })}
          </h2>
          <p className="text-sm text-slate-400 mt-1">Preview of first file</p>
        </div>
        <button
          onClick={() => onFilesChange([])}
          className="text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Clear All Files
        </button>
      </div>
      <div className="flex-1 p-8">
        <PdfPreview file={files[0]} className="h-full" />
      </div>
    </div>
  )
}
