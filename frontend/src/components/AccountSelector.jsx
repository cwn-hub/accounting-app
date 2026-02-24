import { cn } from '../utils/cn'

export default function AccountSelector({ accounts, selected, onSelect }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-slate-600">Account:</label>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className={cn(
          'block w-44 rounded-lg border-slate-300 shadow-sm',
          'focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
          'bg-white border px-3 py-2 transition-all duration-150',
          'hover:border-slate-400'
        )}
      >
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
    </div>
  )
}
