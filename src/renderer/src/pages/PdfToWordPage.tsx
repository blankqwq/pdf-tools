import { useState } from 'react'
import { FileDropZone } from '../components/ui/FileDropZone'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { pdfToDocx } from '../lib/pdf-conversion'
import { ArrowRight, Loader2, FileText } from 'lucide-react'

export function PdfToWordPage() {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const isConverting = progress !== null

  const handleFilesSelected = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0])
    }
  }

  const handleConvert = async () => {
    if (!file) return
    
    setProgress(0)
    try {
      const docxBytes = await pdfToDocx(file, (p) => {
          // console.log('Progress:', p)
          setProgress(p)
      })
      
      await window.electron.ipcRenderer.invoke('dialog:saveFile', {
        buffer: docxBytes,
        filters: [{ name: 'Word Document', extensions: ['docx'] }]
      })
      
    } catch (error: any) {
      console.error('Conversion failed', error)
      window.alert(`Conversion failed: ${error.message || error}`)
    } finally {
      setProgress(null)
    }
  }

  // ... (render drop zone if no file)
  if (!file) {
    return (
      <div className="p-10 h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="max-w-xl w-full">
             <h2 className="text-3xl font-bold text-slate-200 mb-2 text-center">PDF to Word</h2>
             <p className="text-slate-400 mb-8 text-center block">Extract text from PDF to Word document.</p>
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
          <h2 className="text-2xl font-bold text-slate-200">PDF to Word</h2>
          <p className="text-slate-400">Convert {file?.name} to DOCX</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setFile(null)} disabled={isConverting}>Clear</Button>
          <Button onClick={handleConvert} disabled={isConverting}>
            {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {isConverting ? 'Converting...' : 'Convert to DOCX'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/20 rounded-2xl border border-slate-800 border-dashed relative">
         <FileText className="w-24 h-24 text-slate-700 mb-4" />
         <p className="text-slate-500 font-medium">{file?.name}</p>
         <p className="text-slate-600 text-sm mt-2">{(file!.size / 1024 / 1024).toFixed(2)} MB</p>
         
         {isConverting && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
               <ProgressBar progress={progress} label="Converting..." className="w-64" />
            </div>
         )}
      </div>
    </div>
  )
}

