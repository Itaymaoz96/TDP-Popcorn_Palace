# Popcorn Palace: Movie Ticket Booking System

This is a NestJS-based RESTful API for a movie ticket booking system. The system manages movies, showtimes, and ticket bookings.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Docker and Docker Compose (for PostgreSQL)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Itaymaoz96/TDP-Popcorn_Palace
cd TDP-Popcorn_Palace
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up the Database

The project uses PostgreSQL. You can start a PostgreSQL instance using Docker Compose:

```bash
docker-compose up -d
```

This will start a PostgreSQL container using the provided `compose.yml` file.

### 4. Start the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at http://localhost:3000.

## Running Tests

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```
