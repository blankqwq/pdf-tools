import { PdfPreview } from '../components/PdfPreview'
import { FileDropZone } from '../components/ui/FileDropZone'

interface SplitPageProps {
  file: File | null
  onFilesChange: (files: File[]) => void
}

export function SplitPage({ file, onFilesChange }: SplitPageProps) {
  const handleFilesSelected = (files: File[]) => {
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
            description="Drop PDF file here or click to upload"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-200">Preview</h3>
        <button
          onClick={() => onFilesChange([])}
          className="text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Clear File
        </button>
      </div>
      <div className="flex-1 p-8">
        <PdfPreview file={file} className="h-full" />
      </div>
    </div>
  )
}
