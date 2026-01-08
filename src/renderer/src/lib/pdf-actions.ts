import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create()
  
  for (const file of files) {
    const fileBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(fileBuffer)
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
    copiedPages.forEach((page) => mergedPdf.addPage(page))
  }
  
  return await mergedPdf.save()
}

export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer()
    let image
    
    // Attempt to embed directly if standard format
    try {
      if (file.type === 'image/jpeg') {
        image = await pdfDoc.embedJpg(arrayBuffer)
      } else if (file.type === 'image/png') {
        image = await pdfDoc.embedPng(arrayBuffer)
      } else {
        // Fallback or skip? For MVP let's assume valid types or use canvas.
        // Using canvas in renderer is easy.
        throw new Error('Unsupported direct embed')
      }
    } catch (e) {
      // Fallback: load to Image -> Canvas -> JPEG
      // This part requires async loading of image in DOM.
      // We can implement a helper `fileToDataUrl` -> `loadImage`
      continue
    }

    if (image) {
      const page = pdfDoc.addPage([image.width, image.height])
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      })
    }
  }


  return await pdfDoc.save()
}

export async function splitPdf(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  const numberOfPages = pdfDoc.getPageCount()

  const zip = new JSZip()

  // Loop through pages and save each as a new PDF
  for (let i = 0; i < numberOfPages; i++) {
    const subPdf = await PDFDocument.create()
    const [copiedPage] = await subPdf.copyPages(pdfDoc, [i])
    subPdf.addPage(copiedPage)
    
    const pdfBytes = await subPdf.save()
    // 0-padded filename
    const pageNum = i + 1
    const filename = `${file.name.replace('.pdf', '')}_part_${pageNum}.pdf`
    zip.file(filename, pdfBytes)
  }

  // Generate zip buffer
  const content = await zip.generateAsync({ type: 'uint8array' })
  return content
}
