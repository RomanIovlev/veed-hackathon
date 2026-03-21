# CareLearn - Training Platform

A web application for managing staff training, built with React, TypeScript, and PostgreSQL.

## Tech Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS + Shadcn/UI
- **Backend:** Node.js + Express API
- **Database:** PostgreSQL (Docker)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+) or [Bun](https://bun.sh/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local database)

## Running the Web App

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Backend & Database

The app uses a local Docker PostgreSQL database with a Node.js/Express API backend.

### Starting the Database

To start the local Docker database:

```bash
.\start-database.bat
```

### Starting the Backend API

To start the backend API server:

```bash
# Navigate to backend directory
cd backend

# Install dependencies (first time only)
npm install

# Start the server
npm run dev
```

The backend API will be available at `http://localhost:3002`

### Database Admin Interface

Access the database admin interface at:

- URL: `http://localhost:8085`
- System: PostgreSQL
- Server: `localhost:5433`
- Database: `training_db`
- Username: `training_user`
- Password: `training_pass`

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun build` | Build for production |
| `bun preview` | Preview production build |
| `bun test` | Run tests |
| `bun lint` | Run ESLint |

## Mobile App

This project does not currently include a mobile application. The web app is responsive and can be accessed on mobile devices through a web browser.
