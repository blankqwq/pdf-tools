import { useState, useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { Button } from './ui/Button'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

interface PdfPreviewProps {
  file: File
  className?: string
}

export function PdfPreview({ file, className }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const loadedFileRef = useRef<{ name: string; size: number } | null>(null)

  // Load PDF
  useEffect(() => {
    // Check if this is the same file we already loaded
    if (
      loadedFileRef.current &&
      loadedFileRef.current.name === file.name &&
      loadedFileRef.current.size === file.size
    ) {
      return // Skip reload if same file
    }

    let isMounted = true
    setLoading(true)

    const loadPdf = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdfDoc = await loadingTask.promise

        if (isMounted) {
          setPdf(pdfDoc)
          setNumPages(pdfDoc.numPages)
          setCurrentPage(1)
          setLoading(false)
          loadedFileRef.current = { name: file.name, size: file.size }
        }
      } catch (error) {
        console.error('Failed to load PDF:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadPdf()

    return () => {
      isMounted = false
    }
  }, [file])

  // Render current page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage)
        const canvas = canvasRef.current!
        const context = canvas.getContext('2d')!

        const viewport = page.getViewport({ scale })
        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise
      } catch (error) {
        console.error('Failed to render page:', error)
      }
    }

    renderPage()
  }, [pdf, currentPage, scale])

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(numPages, prev + 1))
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(3, prev + 0.25))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.25))
  }

  const handleFitWidth = () => {
    setScale(1.0)
  }

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pageNum = parseInt(e.target.value, 10)
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
      setCurrentPage(pageNum)
    }
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Scroll down = next page, scroll up = previous page
    if (e.deltaY > 0) {
      // Scrolling down
      setCurrentPage((prev) => Math.min(numPages, prev + 1))
    } else if (e.deltaY < 0) {
      // Scrolling up
      setCurrentPage((prev) => Math.max(1, prev - 1))
    }
  }

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-800/20 rounded-2xl border border-slate-800 ${className || ''}`}
      >
        <p className="text-slate-500">Loading preview...</p>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col bg-slate-800/20 rounded-2xl border border-slate-800 ${className || ''}`}
    >
      {/* Controls */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="!p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="number"
              min="1"
              max={numPages}
              value={currentPage}
              onChange={handlePageInput}
              className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-center"
            />
            <span className="text-slate-500">/ {numPages}</span>
          </div>

          <Button
            variant="secondary"
            onClick={handleNextPage}
            disabled={currentPage === numPages}
            className="!p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="!p-2"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          <span className="text-sm text-slate-400 min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>

          <Button variant="secondary" onClick={handleZoomIn} disabled={scale >= 3} className="!p-2">
            <ZoomIn className="w-4 h-4" />
          </Button>

          <Button variant="secondary" onClick={handleFitWidth} className="!p-2">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/50"
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="shadow-2xl" />
      </div>
    </div>
  )
}
