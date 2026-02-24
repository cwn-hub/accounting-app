import { useState } from 'react';
import { 
  Home, 
  PlusCircle, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../utils/cn';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * MobileBottomNav - Bottom tab bar for mobile navigation
 */
export function MobileBottomNav({ 
  activeTab = 'home', 
  onTabChange,
  onAddPress,
  className 
}) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
    { id: 'add', icon: PlusCircle, label: 'Add', isAction: true },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav 
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white border-t border-slate-200',
        'safe-area-inset-bottom',
        'sm:hidden',
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                onClick={onAddPress}
                className={cn(
                  'flex items-center justify-center',
                  'w-14 h-14 -mt-4',
                  'bg-blue-600 rounded-full shadow-lg',
                  'text-white',
                  'active:scale-95 transition-transform',
                  'min-touch-target'
                )}
                aria-label={tab.label}
              >
                <Icon className="w-7 h-7" />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center',
                'w-16 h-full',
                'min-touch-target',
                'active:scale-95 transition-all duration-200',
                isActive ? 'text-blue-600' : 'text-slate-400'
              )}
            >
              <Icon className={cn(
                'w-6 h-6 transition-transform',
                isActive && 'scale-110'
              )} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * MobileMonthSelector - Horizontal swipeable month selector for mobile
 */
export function MobileMonthSelector({ 
  selectedMonth, 
  onSelectMonth,
  className 
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handlePrevMonth = () => {
    if (selectedMonth > 1) {
      onSelectMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth < 12) {
      onSelectMonth(selectedMonth + 1);
    }
  };

  return (
    <div className={cn('sm:hidden', className)}>
      {/* Swipe Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-slate-200 p-2">
        <button
          onClick={handlePrevMonth}
          disabled={selectedMonth === 1}
          className={cn(
            'p-3 rounded-lg transition-colors min-touch-target',
            selectedMonth === 1 
              ? 'text-slate-300 cursor-not-allowed' 
              : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'
          )}
          aria-label="Previous month"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 font-semibold text-lg text-slate-900 min-touch-target"
        >
          {MONTHS[selectedMonth - 1]} 2026
          <ChevronDown className={cn(
            'w-5 h-5 transition-transform',
            showDropdown && 'rotate-180'
          )} />
        </button>

        <button
          onClick={handleNextMonth}
          disabled={selectedMonth === 12}
          className={cn(
            'p-3 rounded-lg transition-colors min-touch-target',
            selectedMonth === 12 
              ? 'text-slate-300 cursor-not-allowed' 
              : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'
          )}
          aria-label="Next month"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Month Dropdown */}
      {showDropdown && (
        <div className="absolute left-4 right-4 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-fade-in">
          <div className="p-2">
            <div className="grid grid-cols-4 gap-2">
              {MONTHS.map((month, index) => {
                const monthNum = index + 1;
                const isSelected = selectedMonth === monthNum;
                
                return (
                  <button
                    key={month}
                    onClick={() => {
                      onSelectMonth(monthNum);
                      setShowDropdown(false);
                    }}
                    className={cn(
                      'py-3 px-2 rounded-lg text-sm font-medium transition-colors min-touch-target',
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}

// ChevronDown icon component
function ChevronDown({ className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

/**
 * MobileHeader - Collapsible header for mobile
 */
export function MobileHeader({ 
  title, 
  subtitle,
  onMenuPress,
  rightAction,
  className 
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={cn(
      'sm:hidden bg-white border-b border-slate-200 sticky top-0 z-30',
      'safe-area-inset-top',
      className
    )}>
      <div className="flex items-center justify-between px-4 h-14">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 -ml-2 rounded-lg hover:bg-slate-100 min-touch-target"
        >
          {menuOpen ? (
            <X className="w-6 h-6 text-slate-600" />
          ) : (
            <Menu className="w-6 h-6 text-slate-600" />
          )}
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
        </div>

        <div className="w-10">
          {rightAction}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg animate-fade-in">
          <nav className="p-2 space-y-1">
            {['Dashboard', 'Transactions', 'Reports', 'Settings'].map((item) => (
              <button
                key={item}
                className="w-full text-left px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 font-medium min-touch-target"
                onClick={() => {
                  setMenuOpen(false);
                  onMenuPress?.(item);
                }}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export default {
  MobileBottomNav,
  MobileMonthSelector,
  MobileHeader
};
