import { useState } from 'react'
import { FileDropZone } from '../components/ui/FileDropZone'
import { Button } from '../components/ui/Button'
import { splitPdf } from '../lib/pdf-actions'
import { Split, ArrowRight, Loader2 } from 'lucide-react'

export function SplitPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isSplitting, setIsSplitting] = useState(false)

  const handleFilesSelected = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0])
    }
  }

  const handleSplit = async () => {
    if (!file) return
    
    setIsSplitting(true)
    try {
      const zipBytes = await splitPdf(file)
      
      await window.electron.ipcRenderer.invoke('dialog:saveFile', {
        buffer: zipBytes,
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
      })
      
    } catch (error) {
      console.error('Split failed', error)
    } finally {
      setIsSplitting(false)
    }
  }

  if (!file) {
    return (
      <div className="p-10 h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="max-w-xl w-full">
             <h2 className="text-3xl font-bold text-slate-200 mb-2 text-center">Split PDF</h2>
             <p className="text-slate-400 mb-8 text-center block">Separate one PDF file into multiple files (one per page).</p>
             <FileDropZone 
               onFilesSelected={handleFilesSelected} 
               accept="application/pdf"
               multiple={false} 
               description="Drop PDF file here" 
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
          <h2 className="text-2xl font-bold text-slate-200">Split PDF</h2>
          <p className="text-slate-400">Split {file.name} into individual pages</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setFile(null)} disabled={isSplitting}>Clear</Button>
          <Button onClick={handleSplit} disabled={isSplitting}>
            {isSplitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {isSplitting ? 'Splitting...' : 'Split & Download ZIP'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/20 rounded-2xl border border-slate-800 border-dashed">
         <Split className="w-24 h-24 text-slate-700 mb-4" />
         <p className="text-slate-500 font-medium">{file.name}</p>
         <p className="text-slate-600 text-sm mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
         <p className="text-slate-500 text-xs mt-4">Will output a .zip file containing all pages</p>
      </div>
    </div>
  )
}
