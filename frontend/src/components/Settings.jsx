import { useState, useCallback } from 'react'
import BusinessSettings from './settings/BusinessSettings'
import ChartOfAccountsSettings from './settings/ChartOfAccountsSettings'
import TaxRateSettings from './settings/TaxRateSettings'
import AccountManagement from './settings/AccountManagement'
import DataManagement from './settings/DataManagement'

const TABS = [
  { id: 'business', label: 'Business', icon: '🏢' },
  { id: 'accounts', label: 'Accounts', icon: '💳' },
  { id: 'categories', label: 'Chart of Accounts', icon: '📊' },
  { id: 'taxes', label: 'Tax Rates', icon: '💰' },
  { id: 'data', label: 'Data', icon: '💾' },
]

export default function Settings({ businessId, onClose }) {
  const [activeTab, setActiveTab] = useState('business')
  const [_refreshTrigger, setRefreshTrigger] = useState(0)

  const handleDataChange = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'business':
        return <BusinessSettings businessId={businessId} />
      case 'accounts':
        return <AccountManagement businessId={businessId} onChange={handleDataChange} />
      case 'categories':
        return <ChartOfAccountsSettings businessId={businessId} onChange={handleDataChange} />
      case 'taxes':
        return <TaxRateSettings businessId={businessId} onChange={handleDataChange} />
      case 'data':
        return <DataManagement businessId={businessId} />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r border-slate-200 bg-slate-50">
            <nav className="p-2 space-y-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
