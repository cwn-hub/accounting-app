import React, { createContext, useContext, useState, useCallback } from 'react';
import { HelpCircle, X } from 'lucide-react';

const HelpContext = createContext(null);

export const HelpProvider = ({ children }) => {
  const [activeTooltip, setActiveTooltip] = useState(null);

  const showHelp = useCallback((id) => setActiveTooltip(id), []);
  const hideHelp = useCallback(() => setActiveTooltip(null), []);

  return (
    <HelpContext.Provider value={{ activeTooltip, showHelp, hideHelp }}>
      {children}
    </HelpContext.Provider>
  );
};

export const useHelp = () => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within HelpProvider');
  }
  return context;
};

export const HelpTooltip = ({ id, content, children, position = 'top' }) => {
  const { activeTooltip, showHelp, hideHelp } = useHelp();
  const isActive = activeTooltip === id;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-flex items-center gap-1">
      {children}
      <button
        type="button"
        onClick={() => isActive ? hideHelp() : showHelp(id)}
        className="text-indigo-400 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
        aria-label={`Help: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`}
        aria-expanded={isActive}
      >
        <HelpCircle className="w-4 h-4" aria-hidden="true" />
      </button>
      {isActive && (
        <div 
          className={`absolute ${positionClasses[position]} z-50 w-64 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-lg`}
          role="tooltip"
        >
          <button
            type="button"
            onClick={hideHelp}
            className="absolute top-1 right-1 text-slate-400 hover:text-white p-1 rounded focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close help tooltip"
          >
            <X className="w-3 h-3" aria-hidden="true" />
          </button>
          <p>{content}</p>
          <div className={`absolute w-2 h-2 bg-slate-800 transform rotate-45 ${
            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
            position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
            'right-full top-1/2 -translate-y-1/2 -mr-1'
          }`} aria-hidden="true" />
        </div>
      )}
    </div>
  );
};

export const FieldTooltip = ({ content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="text-indigo-400 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
        aria-label={`Help: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`}
        aria-expanded={isVisible}
      >
        <HelpCircle className="w-4 h-4" aria-hidden="true" />
      </button>
      {isVisible && (
        <div 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-50"
          role="tooltip"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-800 transform rotate-45" aria-hidden="true" />
        </div>
      )}
    </div>
  );
};

export default HelpTooltip;
