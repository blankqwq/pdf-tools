import { useState } from 'react'
import { Layout } from './components/Layout'
import { Sidebar, TabId } from './components/Sidebar'
import { LanguageProvider } from './contexts/LanguageContext'

import { MergePage } from './pages/MergePage'
import { ImagesToPdfPage } from './pages/ImagesToPdfPage'
import { PdfToPptPage } from './pages/PdfToPptPage'
import { PdfToWordPage } from './pages/PdfToWordPage'
import { SplitPage } from './pages/SplitPage'
import { PdfToImagesPage } from './pages/PdfToImagesPage'

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>('merge')

  const renderContent = () => {
    switch (activeTab) {
      case 'merge':
        return <MergePage />
      case 'split':
        return <SplitPage />
      case 'img2pdf':
        return <ImagesToPdfPage />
      case 'pdf2img':
        return <PdfToImagesPage />
      case 'pdf2ppt':
        return <PdfToPptPage />
      case 'pdf2word':
        return <PdfToWordPage />
      default:
        return <div />
    }
  }

  return (
    <LanguageProvider>
      <Layout>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 h-full bg-slate-950 overflow-auto">{renderContent()}</main>
      </Layout>
    </LanguageProvider>
  )
}

export default App
