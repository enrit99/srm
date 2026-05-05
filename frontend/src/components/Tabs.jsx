export function Tabs({ tabs, activeKey, onChange }) {
  return (
    <div className="border-b border-slate-700 mb-6">
      <nav className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              activeKey === tab.key
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 text-xs bg-slate-700 px-1.5 py-0.5 rounded">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
