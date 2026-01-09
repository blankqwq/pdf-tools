import * as pdfjsLib from 'pdfjs-dist'
import PptxGenJS from 'pptxgenjs'
import JSZip from 'jszip'
import { Document, Packer, Paragraph, TextRun, PageBreak, ImageRun } from 'docx'

// Configure worker
// In a real production app, we should bundle this. For now, pointing to the installed node_modules path via relative URL or CDN 
// might be tricky in Electron without asset handling.
// Using the "legacy" worker import pattern for Vite often works best:
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export async function pdfToPptx(file: File, onProgress?: (percent: number) => void): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise
  
  const pptx = new PptxGenJS()
  
  const numPages = pdf.numPages
  
  for (let i = 1; i <= numPages; i++) {
    onProgress?.(Math.round((i / numPages) * 100))
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2.0 }) // 2x scale for better quality
    
    // Create canvas
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    if (!context) continue

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise
    
    const imgData = canvas.toDataURL('image/jpeg', 0.8)
    
    // Create slide
    const slide = pptx.addSlide()
    
    // Fit image to slide (assuming default 16:9, but we can adjust)
    // PptxGenJS uses inches. 10 x 5.625 for 16:9 roughly.
    // Or we can just center it.
    slide.addImage({ 
      data: imgData, 
      x: 0, 
      y: 0, 
      w: '100%', 
      h: '100%' 
    })
  }
  
  // Generate ArrayBuffer
  const buffer = await pptx.write({ outputType: 'arraybuffer' }) as ArrayBuffer
  return new Uint8Array(buffer)
}

export async function pdfToDocx(file: File, onProgress?: (percent: number) => void): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise
  
  const children: any[] = []
  
  const numPages = pdf.numPages
  
  const safeNumPages = numPages || 1
  for (let i = 1; i <= numPages; i++) {
    const percent = Math.min(100, Math.round((i / safeNumPages) * 100))
    onProgress?.(percent)
    const page = await pdf.getPage(i)
    
    // 1. Text Extraction
    const textContent = await page.getTextContent()
    const textItems = textContent.items.map((item: any) => {
      const tx = item.transform[4]
      const ty = item.transform[5]
      const fontSize = Math.sqrt(item.transform[0] * item.transform[0])
      return {
        type: 'text',
        str: item.str,
        x: tx,
        y: ty,
        fontSize: fontSize,
        hasEOL: item.hasEOL,
        height: item.height || fontSize // fallback
      }
    }).filter(item => item.str.trim().length > 0)

    // 2. Image Extraction
    const ops = await page.getOperatorList()
    const imageItems: any[] = []
    
    let ctm = [1, 0, 0, 1, 0, 0] // [scaleX, skewY, skewX, scaleY, translateX, translateY]
    const ctmStack: number[][] = []
    
    const transform = (m1: number[], m2: number[]) => {
      // m1 * m2
      return [
        m1[0] * m2[0] + m1[2] * m2[1],
        m1[1] * m2[0] + m1[3] * m2[1],
        m1[0] * m2[2] + m1[2] * m2[3],
        m1[1] * m2[2] + m1[3] * m2[3],
        m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
        m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
      ]
    }
    
    for (let j = 0; j < ops.fnArray.length; j++) {
      const fn = ops.fnArray[j]
      const args = ops.argsArray[j]
      
      if (fn === pdfjsLib.OPS.save) {
        ctmStack.push([...ctm])
      } else if (fn === pdfjsLib.OPS.restore) {
        if (ctmStack.length > 0) {
          ctm = ctmStack.pop()!
        }
      } else if (fn === pdfjsLib.OPS.transform) {
        // args: [a, b, c, d, e, f]
        ctm = transform(ctm, args)
      } else if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
        try {
        let imgObj: any = null
        
        if (fn === pdfjsLib.OPS.paintInlineImageXObject) {
             imgObj = args[0]
        } else {
            const imgName = args[0]
            try {
              // console.log(`[PDF] Extracting image: ${imgName}`)
              imgObj = await new Promise<any>((resolve) => {
                 const t = setTimeout(() => {
                    // console.warn(`[PDF] Timeout waiting for ${imgName}`)
                    resolve(null)
                 }, 1000)
                 try {
                     if (page.objs && page.objs.has(imgName)) {
                        page.objs.get(imgName, (img: any) => {
                            clearTimeout(t)
                            resolve(img)
                        })
                     } else if (page.commonObjs && page.commonObjs.has(imgName)) {
                         page.commonObjs.get(imgName, (img: any) => {
                            clearTimeout(t)
                            resolve(img)
                         })
                     } else {
                        // Start fallback attempt
                        try {
                            if (page.objs) {
                               page.objs.get(imgName, (img: any) => {
                                   clearTimeout(t)
                                   resolve(img)
                               })
                            } else {
                               throw new Error('No objs')
                            }
                        } catch {
                            clearTimeout(t)
                            console.warn(`[PDF] Image ${imgName} not found in objs/commonObjs`)
                            resolve(null)
                        }
                     }
                 } catch (e: any) {
                    clearTimeout(t)
                    console.error(e)
                    resolve(null)
                 }
              })
            } catch (e) {
                console.warn('Image resolve error', e)
            }
        }

          if (imgObj) {
            // Determine dimensions from CTM
            // Image is typically 1x1 at (0,0) in local space
            // Apply CTM to 0,0 and 1,0 and 0,1 to get width/height
            // Or simpler: scaleX is roughly ctm[0], scaleY is ctm[3] (ignoring rotation)
            
            // For Docx, we need width/height in pixels or EMUs.
            // 1 PDF unit = 1/72 inch.
            // valid width stats
            const w = Math.sqrt(ctm[0] * ctm[0] + ctm[1] * ctm[1])
            const h = Math.sqrt(ctm[2] * ctm[2] + ctm[3] * ctm[3])
            const x = ctm[4]
            const y = ctm[5] 
            
            // Convert image to buffer
            let imgBuffer: ArrayBuffer | null = null
            
            // console.log(`[PDF] Image Object Type:`, imgObj?.constructor?.name, Object.keys(imgObj || {}))

            if (imgObj instanceof ImageBitmap) {
               const canvas = document.createElement('canvas')
               canvas.width = imgObj.width
               canvas.height = imgObj.height
               const ctx = canvas.getContext('2d')
               ctx?.drawImage(imgObj, 0, 0)
               const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'))
               if (blob) imgBuffer = await blob.arrayBuffer()
            } else if (imgObj instanceof HTMLImageElement) {
               const canvas = document.createElement('canvas')
               canvas.width = imgObj.naturalWidth
               canvas.height = imgObj.naturalHeight
               const ctx = canvas.getContext('2d')
               ctx?.drawImage(imgObj, 0, 0)
               const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'))
               if (blob) imgBuffer = await blob.arrayBuffer()
            } else if (imgObj && typeof imgObj.width === 'number' && typeof imgObj.height === 'number') {
                // Raw image data or other object with dimensions
                // Might have .data (Uint8Array/Uint8ClampedArray)
                if (imgObj.data) { // Uint8ClampedArray (RGBA)
                     const canvas = document.createElement('canvas')
                     canvas.width = imgObj.width
                     canvas.height = imgObj.height
                     const ctx = canvas.getContext('2d')
                     if (ctx) {
                         const imageData = new ImageData(imgObj.data, imgObj.width, imgObj.height)
                         ctx.putImageData(imageData, 0, 0)
                         const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'))
                         if (blob) imgBuffer = await blob.arrayBuffer()
                     }
                } else if (imgObj.bitmap) { // Some pdfjs versions
                     const bmp = imgObj.bitmap
                     const canvas = document.createElement('canvas')
                     canvas.width = bmp.width
                     canvas.height = bmp.height
                     const ctx = canvas.getContext('2d')
                     ctx?.drawImage(bmp, 0, 0)
                     const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'))
                     if (blob) imgBuffer = await blob.arrayBuffer()
                }
            }
            
            if (imgBuffer) {
              imageItems.push({
                 type: 'image',
                 buffer: imgBuffer,
                 x: x,
                 y: y + h, // pdf coords y is bottom, but we transform normally? 
                           // wait, we handled text y inversion in text extraction (ty).
                           // CTM usually handles the coordinate system.
                           // Standard PDF is Bottom-Left origin.
                           // Text extraction code used item.transform[5] which is ty.
                           // We will stick to using 'y' as 'ty'.
                 width: w,
                 height: h
              })
            }
          }
        } catch (e) {
             console.warn('Image extraction failed', e)
        }
      }
    }
    
    // Combining items
    const allItems = [...textItems, ...imageItems]
    
    // Sort
    allItems.sort((a, b) => {
      const yDiff = Math.abs(a.y - b.y)
      if (yDiff < 5) return a.x - b.x
      return b.y - a.y // PDF y is bottom-up
    })

    // Group lines
    const lines: typeof allItems[] = []
    let currentLine: typeof allItems = []
    let lastY = allItems[0]?.y

    for (const item of allItems) {
      if (currentLine.length === 0) {
        currentLine.push(item)
        lastY = item.y
        continue
      }
      if (Math.abs(item.y - lastY) < 5) {
        currentLine.push(item)
      } else {
        lines.push(currentLine)
        currentLine = [item]
        lastY = item.y
      }
    }
    if (currentLine.length > 0) lines.push(currentLine)

    // Paragraph construction
    for (const line of lines) {
      const runChildren: any[] = []
      let previousX = 0
      
      // Determine page left margin offset (approx 0?)
      // We can normalize X coordinates relative to the first item of the line?
      const lineStartX = line[0].x
      
      const indentation = Math.max(0, lineStartX * 10) // generic scaling factor
      
      for (let k = 0; k < line.length; k++) {
        const item = line[k]
        
        if (item.type === 'image') {
           // Insert Image
           // Docx ImageRun requires width/height in transformation objects
           runChildren.push(new ImageRun({
             data: item.buffer,
             transformation: {
               width: item.width,
               height: item.height
             },
             type: 'png' // Explicitly set type
           }))
           continue;
        }
        
        // Gap detection
        if (k > 0) {
            const gap = item.x - previousX
            if (gap > 20) {
                 runChildren.push(new TextRun({ text: "\t" }))
            } else if (gap > 5) {
                 runChildren.push(new TextRun({ text: " " }))
            }
        }
        
        const size = Math.round(item.fontSize * 2) 
        runChildren.push(new TextRun({
          text: item.str,
          size: size
        }))
        
        previousX = item.x + (item.str.length * (item.fontSize / 2)) 
      }
      
      children.push(new Paragraph({
        children: runChildren,
        spacing: { before: 0, after: 0, line: 240 },
        indent: { left: Math.round(indentation) }
      }))
    }
    
    if (i < numPages) {
       children.push(new Paragraph({ children: [new PageBreak()] }))
    }
  }
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  })
  
  const blob = await Packer.toBlob(doc)
  const blobBuffer = await blob.arrayBuffer()
  return new Uint8Array(blobBuffer)
}

export async function pdfToImageZip(file: File, onProgress?: (percent: number) => void): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise
  const numPages = pdf.numPages
  
  const zip = new JSZip()

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(Math.round((i / numPages) * 100))
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2.0 })
    
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    if (!context) continue

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise
    
    // Convert to blob
    // canvas.toBlob is standard but async.
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
    if (blob) {
       const arrayBuffer = await blob.arrayBuffer()
       const filename = `${file.name.replace('.pdf', '')}_page_${i}.png`
       zip.file(filename, arrayBuffer)
    }
  }

  const content = await zip.generateAsync({ type: 'uint8array' })
  return content
}
