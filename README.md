# BucketList Frontend

A simple Vue.js application with Docker support.

## Quick Start

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
- Stopwatch functionality
- Local storage for time tracking
- Responsive design

## Docker Files

- `Dockerfile` - Production build
- `Dockerfile.dev` - Development build
- `docker-compose.yml` - Multi-service orchestration
- `.dockerignore` - Files to exclude from Docker context
