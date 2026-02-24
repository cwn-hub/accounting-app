import React, { useState } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Settings,
  ArrowLeftRight,
  HelpCircle,
  ChevronDown,
  Menu,
  X,
  FileText,
  PieChart,
  Building2,
  Users,
  Calculator,
} from 'lucide-react';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const location = useLocation();

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Journal', path: '/journal', icon: BookOpen },
    {
      name: 'Reports',
      icon: BarChart3,
      dropdown: [
        { name: 'Profit & Loss', path: '/reports/pnl', icon: PieChart },
        { name: 'Balance Sheet', path: '/reports/balance', icon: FileText },
        { name: 'Tax Report', path: '/reports/tax', icon: Calculator },
      ],
    },
    {
      name: 'Settings',
      icon: Settings,
      dropdown: [
        { name: 'Business Info', path: '/settings/business', icon: Building2 },
        { name: 'Chart of Accounts', path: '/settings/accounts', icon: Calculator },
        { name: 'Users', path: '/settings/users', icon: Users },
      ],
    },
    { name: 'Import/Export', path: '/import-export', icon: ArrowLeftRight },
    { name: 'Help', path: '/help', icon: HelpCircle },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-700 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="main-navigation"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        id="main-navigation"
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200">
            <Link to="/" className="flex items-center gap-3" aria-label="SwissBooks Home">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg" aria-hidden="true">S</span>
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-lg">SwissBooks</h1>
                <p className="text-xs text-slate-500">Accounting Made Simple</p>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Sidebar">
            <ul className="space-y-1" role="menubar">
              {navItems.map((item) => {
                const Icon = item.icon;
                const hasDropdown = !!item.dropdown;
                const isDropdownOpen = openDropdown === item.name;
                const isItemActive = item.path ? isActive(item.path) : item.dropdown?.some(d => isActive(d.path));

                return (
                  <li key={item.name} role="none">
                    {hasDropdown ? (
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleDropdown(item.name)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isItemActive
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                          aria-expanded={isDropdownOpen}
                          aria-haspopup="true"
                          role="menuitem"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${isItemActive ? 'text-indigo-600' : 'text-slate-500'}`} aria-hidden="true" />
                            <span>{item.name}</span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform ${
                              isDropdownOpen ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                        {isDropdownOpen && (
                          <ul className="mt-1 ml-4 pl-4 border-l-2 border-slate-200 space-y-1" role="menu">
                            {item.dropdown.map((subItem) => {
                              const SubIcon = subItem.icon;
                              return (
                                <li key={subItem.path} role="none">
                                  <NavLink
                                    to={subItem.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                        isActive
                                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                      }`
                                    }
                                    role="menuitem"
                                  >
                                    <SubIcon className="w-4 h-4" aria-hidden="true" />
                                    <span>{subItem.name}</span>
                                  </NavLink>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <NavLink
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`
                        }
                        role="menuitem"
                      >
                        <Icon className={`w-5 h-5 ${isActive(item.path) ? 'text-indigo-600' : 'text-slate-500'}`} aria-hidden="true" />
                        <span>{item.name}</span>
                      </NavLink>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              © 2026 SwissBooks
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navigation;
