import { useState } from 'react'
import { FileDropZone } from '../components/ui/FileDropZone'
import { Button } from '../components/ui/Button'
import { mergePdfs } from '../lib/pdf-actions'
import { File as FileIcon, X, ArrowRight, Loader2 } from 'lucide-react'

export function MergePage() {
  const [files, setFiles] = useState<File[]>([])
  const [isMerging, setIsMerging] = useState(false)

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
    
    setIsMerging(true)
    try {
      const mergedPdfBytes = await mergePdfs(files)
      
      // Send to main process to save
      // We need to cast window to any or extend the type, but for now using strict type provided by electron-vite defaults
      // The default type usually is window.electron.ipcRenderer
      
      const result = await window.electron.ipcRenderer.invoke('dialog:savePdf', mergedPdfBytes)
      
      if (result.success) {
        // Maybe show toast?
        console.log('Saved to', result.filePath)
        setFiles([]) // Reset or keep? Reset implies done.
      }
    } catch (error) {
      console.error('Merge failed', error)
      // Show error
    } finally {
      setIsMerging(false)
    }
  }

  if (files.length === 0) {
    return (
      <div className="p-10 h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="max-w-xl w-full">
             <h2 className="text-3xl font-bold text-slate-200 mb-2 text-center">Merge PDFs</h2>
             <p className="text-slate-400 mb-8 text-center block">Combine multiple PDF files into a single document.</p>
             <FileDropZone onFilesSelected={handleFilesSelected} multiple={true} description="Drop PDF files here to merge" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 h-full flex flex-col max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Merge PDFs</h2>
          <p className="text-slate-400">Drag items to reorder (coming soon)</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setFiles([])} disabled={isMerging}>Clear All</Button>
          <Button onClick={handleMerge} disabled={isMerging || files.length < 2}>
            {isMerging ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {isMerging ? 'Merging...' : 'Merge Files'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
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
            description="Add more files"
          />
        </div>
      </div>
    </div>
  )
}
