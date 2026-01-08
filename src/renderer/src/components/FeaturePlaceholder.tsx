export function FeaturePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-10 h-full">
      <div className="text-center space-y-4 bg-slate-900/50 p-12 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <h2 className="text-3xl font-bold text-slate-200">{title}</h2>
        <p className="text-slate-400">This feature is under development.</p>
      </div>
    </div>
  )
}
