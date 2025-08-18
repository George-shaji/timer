# BucketList Frontend

A simple Vue.js application with Docker support.

## Storage Configuration

This application uses **Google Sheets only** for data storage. LocalStorage has been completely removed.

### Current Status:
- ✅ **Read Operations**: Can read timer data from Google Sheets
- ❌ **Write Operations**: Requires additional setup (see `GOOGLE_SHEETS_WRITE_SETUP.md`)

### Quick Setup for Write Operations:
1. See `GOOGLE_SHEETS_WRITE_SETUP.md` for detailed instructions
2. Option 1: Google Apps Script Web App (recommended)
3. Option 2: Service Account authentication

### Data Flow:
- All timer sessions are stored in Google Sheets
- Data persists across devices and browser sessions
- CSV export comes directly from Google Sheets
- No local storage dependencies


### Using Docker (Recommended)

#### Production Mode
```bash
# Build and run the production container
npm run docker:prod

# Or manually:
docker-compose up
```

#### Development Mode
```bash
# Run in development mode with hot reload
npm run docker:dev

# Or manually:
docker-compose --profile dev up
```

#### Manual Docker Commands
```bash
# Build the Docker image
npm run docker:build

# Run the container
npm run docker:run

# Stop containers
npm run docker:stop
```

### Traditional Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Access the Application

- **Production**: http://localhost:3000
- **Development**: http://localhost:5173

## Login Credentials

- Email: `george@gmail.com`
- Password: `password123`

## Features

- Simple login system
- Stopwatch functionality with persistence
- **Database-as-Spreadsheet functionality**
- Local storage for time tracking
- **Spreadsheet view of all timer data**
- **CSV export capabilities**
- **User statistics and analytics**
- Responsive design

## New Database Features

This application now includes a **database-as-spreadsheet** system that allows you to:

- View all timer data in a spreadsheet-like interface
- Export data to CSV files for use in Excel or Google Sheets
- Track user statistics (total time, session count, averages)
- Filter and sort data by different criteria
- Delete individual sessions
- View recent activity

### Accessing the Spreadsheet

1. Login to the application
2. Use the timer to create some data
3. Click "📊 View Data Spreadsheet" to see all your data
4. Use the export features to download your data as CSV files

See `DATABASE_SETUP.md` for detailed information about the database features.

## Docker Files

- `Dockerfile` - Production build
- `Dockerfile.dev` - Development build
- `docker-compose.yml` - Multi-service orchestration
- `.dockerignore` - Files to exclude from Docker context
