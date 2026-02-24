import { cn } from '../utils/cn'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

export default function MonthTabs({ selectedMonth, onSelectMonth }) {
  return (
    <div className="card p-2">
      <div className="flex flex-wrap gap-1">
        {MONTHS.map((month, index) => {
          const monthNum = index + 1
          const isSelected = selectedMonth === monthNum
          
          return (
            <button
              key={month}
              onClick={() => onSelectMonth(monthNum)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                isSelected
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              )}
            >
              {month}
            </button>
          )
        })}
      </div>
    </div>
  )
}
