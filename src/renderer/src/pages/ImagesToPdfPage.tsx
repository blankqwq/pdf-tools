import { useState } from 'react'
import { FileDropZone } from '../components/ui/FileDropZone'
import { Button } from '../components/ui/Button'
import { imagesToPdf } from '../lib/pdf-actions'
import { X, ArrowRight, Loader2 } from 'lucide-react'

export function ImagesToPdfPage() {
  const [files, setFiles] = useState<File[]>([])
  const [isConverting, setIsConverting] = useState(false)

  const handleFilesSelected = (newFiles: File[]) => {
    const uniqueFiles = newFiles.filter(nf => 
      !files.some(f => f.name === nf.name && f.size === nf.size)
    )
    setFiles([...files, ...uniqueFiles])
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleConvert = async () => {
    if (files.length === 0) return
    
    setIsConverting(true)
    try {
      const pdfBytes = await imagesToPdf(files)
      
      const result = await window.electron.ipcRenderer.invoke('dialog:savePdf', pdfBytes)
      
      if (result.success) {
        console.log('Saved to', result.filePath)
        setFiles([])
      }
    } catch (error) {
      console.error('Conversion failed', error)
    } finally {
      setIsConverting(false)
    }
  }

  if (files.length === 0) {
    return (
      <div className="p-10 h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="max-w-xl w-full">
             <h2 className="text-3xl font-bold text-slate-200 mb-2 text-center">Images to PDF</h2>
             <p className="text-slate-400 mb-8 text-center block">Convert your images to a PDF document.</p>
             <FileDropZone 
               onFilesSelected={handleFilesSelected} 
               accept="image/png, image/jpeg"
               multiple={true} 
               description="Drop images (PNG, JPG) here" 
             />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 h-full flex flex-col max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Images to PDF</h2>
          <p className="text-slate-400">{files.length} images selected</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setFiles([])} disabled={isConverting}>Clear All</Button>
          <Button onClick={handleConvert} disabled={isConverting}>
            {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {isConverting ? 'Converting...' : 'Convert to PDF'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors group">
            <div className="w-16 h-16 rounded-lg bg-slate-700/50 overflow-hidden flex items-center justify-center relative">
              <img 
                src={URL.createObjectURL(file)} 
                alt="preview" 
                className="w-full h-full object-cover" 
                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
              />
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
            accept="image/png, image/jpeg"
            multiple={true} 
            description="Add more images"
          />
        </div>
      </div>
    </div>
  )
}
