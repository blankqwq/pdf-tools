import { useState } from 'react'
import { FileText, Merge, Split, Image, Languages, X, FileImage, Presentation } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { Button } from './ui/Button'
import { ProgressBar } from './ui/ProgressBar'
import { ConversionFormat } from '../pages/ConvertPage'

export type TabId = 'merge' | 'split' | 'img2pdf' | 'pdf2any'

type NavItem = {
  id: TabId
  labelKey: string
  icon: typeof Merge
}

interface SidebarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  files: File[]
  onFilesChange: (files: File[]) => void
  onExecute: () => void
  progress: number
  estimatedSecondsRemaining: number | null
  isProcessing: boolean
  targetFormat?: ConversionFormat
  onFormatChange?: (format: ConversionFormat) => void
}

export function Sidebar({
  activeTab,
  onTabChange,
  files,
  onFilesChange,
  onExecute,
  progress,
  estimatedSecondsRemaining,
  isProcessing,
  targetFormat,
  onFormatChange
}: SidebarProps): React.JSX.Element {
  const { t, locale, setLocale } = useLanguage()
  const [showMenu, setShowMenu] = useState(true)

  const navItems: NavItem[] = [
    { id: 'merge', labelKey: 'sidebar.merge', icon: Merge },
    { id: 'split', labelKey: 'sidebar.split', icon: Split },
    { id: 'img2pdf', labelKey: 'sidebar.img2pdf', icon: Image },
    { id: 'pdf2any', labelKey: 'sidebar.pdf2any', icon: FileText }
  ]

  const isMultiFile = activeTab === 'merge' || activeTab === 'img2pdf'
  const acceptType = activeTab === 'img2pdf' ? 'image/*' : 'application/pdf'
  const currentTool = navItems.find((item) => item.id === activeTab) as NavItem

  const handleFileInputClick = (): void => {
    const input = document.getElementById('file-input') as HTMLInputElement
    if (input) {
      input.click()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) {
      if (isMultiFile) {
        onFilesChange([...files, ...selectedFiles])
      } else {
        onFilesChange([selectedFiles[0]])
      }
    }
    e.target.value = '' // Reset input
  }

  const handleRemoveFile = (index: number): void => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  const handleClearAll = (): void => {
    onFilesChange([])
  }

  const handleToolSelect = (tab: TabId): void => {
    onTabChange(tab)
    setShowMenu(false)
  }

  const handleBackToMenu = () => {
    if (isProcessing) {
      const confirmed = window.confirm(
        locale === 'zh'
          ? '操作正在进行中，确定要中断吗？'
          : 'Operation in progress. Are you sure you want to interrupt?'
      )
      if (!confirmed) return
    }
    setShowMenu(true)
  }

  return (
    <aside className="w-80 bg-slate-900 text-white flex flex-col border-r border-slate-800">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          {t('app.title')}
        </h1>
      </div>

      {/* Tool Navigation - Show when menu is visible */}
      {showMenu ? (
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleToolSelect(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{t(item.labelKey as any)}</span>
                </button>
              )
            })}
          </div>
        </nav>
      ) : (
        <>
          {/* Current Tool Header with Back Button */}
          {currentTool && (
            <div className="p-4 border-b border-slate-800">
              <button
                onClick={handleBackToMenu}
                disabled={isProcessing}
                className="flex items-center gap-2 text-slate-400 hover:text-white mb-3 disabled:opacity-50"
              >
                <span className="text-sm">← {locale === 'zh' ? '返回' : 'Back'}</span>
              </button>
              <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <currentTool.icon className="w-5 h-5" />
                {t(currentTool.labelKey as any)}
              </h2>
            </div>
          )}

          {/* Format Selection - Only for pdf2any */}
          {!showMenu && activeTab === 'pdf2any' && onFormatChange && (
            <div className="p-4 border-b border-slate-800 bg-slate-800/30">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
                {locale === 'zh' ? '选择目标格式' : 'Select Target Format'}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    id: 'word',
                    label: 'Word (DOCX)',
                    icon: FileText,
                    color: 'text-blue-400',
                    bg: 'bg-blue-400/10'
                  },
                  {
                    id: 'ppt',
                    label: 'PowerPoint (PPTX)',
                    icon: Presentation,
                    color: 'text-orange-400',
                    bg: 'bg-orange-400/10'
                  },
                  {
                    id: 'image',
                    label: 'Image (PNG)',
                    icon: FileImage,
                    color: 'text-emerald-400',
                    bg: 'bg-emerald-400/10'
                  }
                ].map((format) => {
                  const Icon = format.icon
                  const active = targetFormat === format.id
                  return (
                    <button
                      key={format.id}
                      onClick={() => onFormatChange(format.id as any)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all border ${
                        active
                          ? `${format.bg} ${format.color} border-${format.color.split('-')[1]}-400/30 shadow-lg shadow-black/20`
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{format.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* File Management */}
          <div className="overflow-auto p-4">
            <div className="space-y-4">
              {/* Hidden File Input */}
              <input
                id="file-input"
                type="file"
                accept={acceptType}
                multiple={isMultiFile}
                onChange={handleFileSelect}
                disabled={isProcessing}
                className="hidden"
              />

              {/* Upload Button */}
              <Button onClick={handleFileInputClick} disabled={isProcessing} className="w-full">
                {isMultiFile ? t('sidebar.addFiles') : t('sidebar.uploadFile')}
              </Button>

              {/* File List */}
              {files.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  {t('sidebar.noFiles')}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                    <span>{t('sidebar.fileCount', { count: files.length })}</span>
                    {files.length > 0 && !isProcessing && (
                      <button
                        onClick={handleClearAll}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        {t('common.clearAll')}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{file.name}</p>
                          <p className="text-xs text-slate-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        {!isProcessing && (
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Controls */}
          <div className="p-4 space-y-3">
            {/* Execute Button */}
            <Button
              onClick={onExecute}
              disabled={files.length === 0 || isProcessing}
              className="w-full"
            >
              {isProcessing ? t('sidebar.processing') : t('sidebar.execute')}
            </Button>

            {/* Progress Bar - Only show when processing */}
            {isProcessing && (
              <ProgressBar
                progress={progress}
                label={t('sidebar.processing')}
                estimatedSecondsRemaining={estimatedSecondsRemaining}
              />
            )}
          </div>
        </>
      )}

      {/* Language Toggle */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full justify-center py-2"
        >
          <Languages className="w-4 h-4" />
          <span className="text-sm">{locale === 'zh' ? 'English' : '中文'}</span>
        </button>
      </div>
    </aside>
  )
}
