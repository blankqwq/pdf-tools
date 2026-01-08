import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { 
  Files, 
  Split, 
  Merge, 
  Image, 
  FileImage,
  Presentation,
  FileText
} from 'lucide-react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type TabId = 'merge' | 'split' | 'img2pdf' | 'pdf2img' | 'pdf2ppt' | 'pdf2word'

interface SidebarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navItems = [
    { id: 'merge', label: 'Merge PDF', icon: Merge },
    { id: 'split', label: 'Split PDF', icon: Split },
    { id: 'img2pdf', label: 'Images to PDF', icon: Image },
    { id: 'pdf2img', label: 'PDF to Images', icon: FileImage },
    { id: 'pdf2ppt', label: 'PDF to PPT', icon: Presentation },
    { id: 'pdf2word', label: 'PDF to Word', icon: FileText },
  ] as const

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-700/50">
      <div className="p-6 flex items-center gap-3">
        <Files className="w-8 h-8 text-blue-400" />
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          PDF Tools
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
              activeTab === item.id 
                ? "bg-blue-600/10 text-blue-400 shadow-[0_0_20px_-5px_rgba(96,165,250,0.3)] border border-blue-500/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100 hover:translate-x-1"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              activeTab === item.id ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
            )} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800/50">
        <div className="text-xs text-slate-500 text-center">
          v1.0.0 • Electron
        </div>
      </div>
    </aside>
  )
}
