import React from 'react';
import { BookOpen, FileText, Calendar, Tag } from 'lucide-react';
import { HelpTooltip } from '../components/ContextualHelp';

const Journal = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Journal</h1>
        <p className="text-slate-600">View and manage your general ledger entries</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Journal Entries</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            The journal module is coming soon. You&apos;ll be able to view all transactions 
            in chronological order with filtering and search capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-4 bg-slate-50 rounded-lg">
            <HelpTooltip 
              id="journal-chronological" 
              content="Journal entries are recorded in chronological order, providing a complete audit trail of all financial transactions."
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                <span className="font-medium text-slate-700">Chronological Order</span>
              </div>
            </HelpTooltip>
            <p className="text-sm text-slate-500 mt-2">View transactions by date</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <HelpTooltip 
              id="journal-ledger" 
              content="Each journal entry automatically updates the general ledger, ensuring your books are always balanced."
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                <span className="font-medium text-slate-700">General Ledger</span>
              </div>
            </HelpTooltip>
            <p className="text-sm text-slate-500 mt-2">Automatic ledger posting</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <HelpTooltip 
              id="journal-categories" 
              content="Categorize transactions for easier reporting and analysis. Categories align with Swiss accounting standards."
            >
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                <span className="font-medium text-slate-700">Categories</span>
              </div>
            </HelpTooltip>
            <p className="text-sm text-slate-500 mt-2">Organized by account type</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;
