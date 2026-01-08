import { ReactNode } from 'react'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden flex">
      {children}
    </div>
  )
}
