# Quick Start Guide

## Development Mode

### 1. Start Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Backend will be available at http://localhost:8000

### 2. Start Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at http://localhost:5173

## Production Mode (Docker)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Update with rebuild
docker-compose down
docker-compose up -d --build
```

## Import Data from Excel

1. Open `00-source-excel/Accounting-Excel-Template.xlsx`
2. Fill in your business data
3. Upload via API:
```bash
curl -X POST -F "file=@Accounting-Excel-Template.xlsx" http://localhost:8000/import/excel
```

## Export Reports

```bash
# P&L Report CSV
curl "http://localhost:8000/reports/pl?business_id=1&year=2024&format=csv" -o pl.csv

# Balance Sheet CSV
curl "http://localhost:8000/reports/balance-sheet?business_id=1&year=2024&format=csv" -o bs.csv

# Tax Report CSV
curl "http://localhost:8000/reports/tax?business_id=1&year=2024&format=csv" -o tax.csv
```

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

```bash
cd backend
pytest tests/ -v
```
