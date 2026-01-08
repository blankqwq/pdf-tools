import { useState } from 'react'
import { FileDropZone } from '../components/ui/FileDropZone'
import { Button } from '../components/ui/Button'
import { pdfToImageZip } from '../lib/pdf-conversion'
import { FileImage, ArrowRight, Loader2 } from 'lucide-react'

export function PdfToImagesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isConverting, setIsConverting] = useState(false)

  const handleFilesSelected = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0])
    }
  }

  const handleConvert = async () => {
    if (!file) return
    
    setIsConverting(true)
    try {
      const zipBytes = await pdfToImageZip(file)
      
      await window.electron.ipcRenderer.invoke('dialog:saveFile', {
        buffer: zipBytes,
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
      })
      
    } catch (error) {
      console.error('Conversion failed', error)
    } finally {
      setIsConverting(false)
    }
  }

  if (!file) {
    return (
      <div className="p-10 h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="max-w-xl w-full">
             <h2 className="text-3xl font-bold text-slate-200 mb-2 text-center">PDF to Images</h2>
             <p className="text-slate-400 mb-8 text-center block">Convert PDF pages to high-quality images.</p>
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
          <h2 className="text-2xl font-bold text-slate-200">PDF to Images</h2>
          <p className="text-slate-400">Convert {file.name} to PNGs</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setFile(null)} disabled={isConverting}>Clear</Button>
          <Button onClick={handleConvert} disabled={isConverting}>
            {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {isConverting ? 'Converting...' : 'Convert & Download ZIP'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-slate-800/20 rounded-2xl border border-slate-800 border-dashed">
         <FileImage className="w-24 h-24 text-slate-700 mb-4" />
         <p className="text-slate-500 font-medium">{file.name}</p>
         <p className="text-slate-600 text-sm mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
         <p className="text-slate-500 text-xs mt-4">Will output a .zip file containing all pages as PNG</p>
      </div>
    </div>
  )
}
