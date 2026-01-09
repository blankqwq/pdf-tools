import { useState } from 'react'
import { Layout } from './components/Layout'
import { Sidebar, TabId } from './components/Sidebar'
import { LanguageProvider } from './contexts/LanguageContext'
import { useProgress } from './hooks/useProgress'

import { MergePage } from './pages/MergePage'
import { ImagesToPdfPage } from './pages/ImagesToPdfPage'
import { SplitPage } from './pages/SplitPage'
import { ConvertPage, ConversionFormat } from './pages/ConvertPage'

import { mergePdfs, imagesToPdf, splitPdf } from './lib/pdf-actions'
import { pdfToDocx, pdfToPptx, pdfToImageZip } from './lib/pdf-conversion'

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>('merge')
  const [files, setFiles] = useState<File[]>([])
  const [targetFormat, setTargetFormat] = useState<ConversionFormat>('word')
  const { progress, estimatedSecondsRemaining, start, update, reset } = useProgress()
  const isProcessing = progress > 0

  const handleTabChange = (newTab: TabId): void => {
    const oldAcceptType = activeTab === 'img2pdf' ? 'image' : 'pdf'
    const newAcceptType = newTab === 'img2pdf' ? 'image' : 'pdf'

    // Clear files if switching between incompatible tool types (image vs pdf)
    if (oldAcceptType !== newAcceptType) {
      setFiles([])
    } else {
      // If switching from multi-file to single-file, keep only the first file
      const newIsMultiFile = newTab === 'merge' || newTab === 'img2pdf'
      if (!newIsMultiFile && files.length > 1) {
        setFiles([files[0]])
      }
    }

    setActiveTab(newTab)
  }

  const handleExecute = async () => {
    if (files.length === 0) return

    start()
    try {
      switch (activeTab) {
        case 'merge':
          if (files.length < 2) {
            alert('Please select at least 2 PDF files to merge')
            reset()
            return
          }
          const mergedPdf = await mergePdfs(files, update)
          await window.electron.ipcRenderer.invoke('dialog:saveFile', {
            buffer: mergedPdf,
            filters: [{ name: 'PDF', extensions: ['pdf'] }]
          })
          break

        case 'split':
          if (files.length !== 1) {
            alert('Please select exactly 1 PDF file to split')
            reset()
            return
          }
          const splitZip = await splitPdf(files[0], update)
          await window.electron.ipcRenderer.invoke('dialog:saveFile', {
            buffer: splitZip,
            filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
          })
          break

        case 'img2pdf':
          if (files.length === 0) {
            alert('Please select at least 1 image file')
            reset()
            return
          }
          const pdfFromImages = await imagesToPdf(files, update)
          await window.electron.ipcRenderer.invoke('dialog:saveFile', {
            buffer: pdfFromImages,
            filters: [{ name: 'PDF', extensions: ['pdf'] }]
          })
          break

        case 'pdf2any': {
          if (files.length !== 1) {
            alert('Please select exactly 1 PDF file')
            reset()
            return
          }
          let resultBuffer: Uint8Array
          let fileName: string
          let extensions: string[]

          if (targetFormat === 'word') {
            resultBuffer = await pdfToDocx(files[0], update)
            fileName = 'Word Document'
            extensions = ['docx']
          } else if (targetFormat === 'ppt') {
            resultBuffer = await pdfToPptx(files[0], update)
            fileName = 'PowerPoint'
            extensions = ['pptx']
          } else {
            resultBuffer = await pdfToImageZip(files[0], update)
            fileName = 'ZIP Archive'
            extensions = ['zip']
          }

          await window.electron.ipcRenderer.invoke('dialog:saveFile', {
            buffer: resultBuffer,
            filters: [{ name: fileName, extensions }]
          })
          break
        }
      }

      // Files are no longer cleared after successful operation to keep preview
      // setFiles([])
    } catch (error: any) {
      console.error('Operation failed', error)
      alert(`Operation failed: ${error.message || error}`)
    } finally {
      reset()
    }
  }

  const renderContent = () => {
    const file = files.length > 0 ? files[0] : null

    switch (activeTab) {
      case 'merge':
        return <MergePage files={files} onFilesChange={setFiles} />
      case 'split':
        return <SplitPage file={file} onFilesChange={setFiles} />
      case 'img2pdf':
        return <ImagesToPdfPage files={files} onFilesChange={setFiles} />
      case 'pdf2any':
        return <ConvertPage file={file} onFilesChange={setFiles} />
      default:
        return <div />
    }
  }

  return (
    <LanguageProvider>
      <Layout>
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          files={files}
          onFilesChange={setFiles}
          onExecute={handleExecute}
          progress={progress}
          estimatedSecondsRemaining={estimatedSecondsRemaining}
          isProcessing={isProcessing}
          targetFormat={targetFormat}
          onFormatChange={setTargetFormat}
        />
        <main className="flex-1 h-full bg-slate-950 overflow-hidden">{renderContent()}</main>
      </Layout>
    </LanguageProvider>
  )
}

export default App
