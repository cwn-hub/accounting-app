# Changelog

All notable changes to SwissBooks will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-02-24

### Added
- **Dashboard**: Complete financial overview with key metrics, cash position, and monthly trends
- **Transaction Management**: Full CRUD operations for income, expenses, and transfers
- **Journal View**: Chronological listing with filtering, sorting, and pagination
- **Reports**:
  - Profit & Loss report with monthly breakdown
  - Balance Sheet with validation
  - Tax report for VAT filing
  - CSV and PDF export for all reports
- **Settings**:
  - Business configuration
  - Chart of accounts management
  - Tax rate configuration
  - Account management
  - User management
- **Import/Export**:
  - Excel template import
  - Full JSON backup/restore
  - CSV export
- **Mobile Support**:
  - Responsive design
  - PWA support (install as app)
  - Mobile-optimized transaction forms
  - Touch-friendly interface
- **Accessibility**:
  - ARIA labels and roles
  - Keyboard navigation
  - Screen reader support
  - Focus indicators
- **Performance**:
  - Lazy loading for routes
  - Code splitting
  - Optimized bundle sizes
- **Security**:
  - Input validation
  - XSS protection
  - Secure data handling

### Changed
- Upgraded to React 19
- Migrated to React Router v7
- Modernized UI with Tailwind CSS v3.4
- Improved error handling and validation

### Fixed
- React key warnings in mapped components
- Missing accessibility attributes
- ESLint configuration for v9
- Unused variable cleanup
- Dependency array warnings

---

## [0.9.0] - 2026-02-20

### Added
- Sprint 5 features: Tax reports, transfer validation, error highlighting
- Settings modal with tabbed interface
- Data management (backup, restore, import, export)
- Transaction error indicators

### Changed
- Enhanced P&L report with expandable sections
- Improved mobile transaction cards
- Better form validation feedback

### Fixed
- Balance sheet validation logic
- Tax calculation accuracy
- Transfer matching algorithm

---

## [0.8.0] - 2026-02-15

### Added
- Account management interface
- Chart of accounts settings
- Tax rate configuration
- Business settings page

### Changed
- Restructured settings into dedicated pages
- Improved navigation organization

---

## [0.7.0] - 2026-02-10

### Added
- Journal view with filtering and pagination
- Mobile transaction cards
- Responsive table design

### Changed
- Dashboard layout improvements
- Mobile navigation optimization

---

## [0.6.0] - 2026-02-05

### Added
- Balance Sheet report
- Monthly selector for reports
- Validation indicators

### Fixed
- Report calculations accuracy
- Date formatting consistency

---

## [0.5.0] - 2026-02-01

### Added
- Tax report functionality
- Export to CSV/PDF
- Print styles for reports

### Changed
- Improved report UI/UX
- Better chart visualizations

---

## [0.4.0] - 2026-01-25

### Added
- Profit & Loss report
- Monthly trend chart
- Recharts integration

### Changed
- Enhanced dashboard with charts
- Updated color scheme

---

## [0.3.0] - 2026-01-20

### Added
- Transaction editing inline
- Sortable transaction tables
- Category filtering

### Fixed
- Transaction form validation
- Date handling issues

---

## [0.2.0] - 2026-01-15

### Added
- Transaction creation form
- Tax calculation
- Category selection

### Changed
- Updated data model
- Improved mock data

---

## [0.1.0] - 2026-01-10

### Added
- Initial project setup
- Basic dashboard layout
- Navigation structure
- Mock data generation
- React + Vite + Tailwind foundation

---

## Planned Features

### Upcoming in 1.1.0
- [ ] Multi-currency support
- [ ] Bank statement import (CAMT.053)
- [ ] Automated bank feeds
- [ ] Receipt attachment
- [ ] Advanced search

### Future Releases
- [ ] AI-powered categorization
- [ ] Team collaboration features
- [ ] Audit trail
- [ ] Multi-company support
- [ ] API rate limiting dashboard
- [ ] Webhook integrations

---

## Deprecations

### Deprecated in 1.0.0
- Legacy settings modal (replaced with page-based settings)
- Old transaction list component (replaced with react-table)

### Removed in 1.0.0
- Unused mock API endpoints
- Deprecated utility functions

---

*This changelog is maintained by the SwissBooks development team.*
