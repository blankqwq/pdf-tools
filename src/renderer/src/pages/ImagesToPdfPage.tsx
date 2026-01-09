import { useLanguage } from '../contexts/LanguageContext'
import { Image } from 'lucide-react'
import { FileDropZone } from '../components/ui/FileDropZone'

interface ImagesToPdfPageProps {
  files: File[]
  onFilesChange: (files: File[]) => void
}

export function ImagesToPdfPage({ files, onFilesChange }: ImagesToPdfPageProps) {
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
            accept="image/*"
            multiple={true}
            description="Drop image files here or click to upload"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-200">
            {t('sidebar.fileCount', { count: files.length })}
          </h2>
          <p className="text-sm text-slate-400 mt-1">Images ready to convert to PDF</p>
        </div>
        <button
          onClick={() => onFilesChange([])}
          className="text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Clear All Files
        </button>
      </div>

      {/* Image Grid Preview */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-3 gap-4">
          {files.map((file, index) => (
            <div
              key={index}
              className="aspect-square bg-slate-800 rounded-lg flex flex-col items-center justify-center p-4"
            >
              <Image className="w-12 h-12 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 text-center truncate w-full">{file.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
