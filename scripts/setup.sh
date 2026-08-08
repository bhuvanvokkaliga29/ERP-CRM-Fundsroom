#!/bin/bash
set -e

echo "🚀 Bootstrapping Ledger Development Environment..."

echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ ! -f .env ]; then
  echo "📄 Copying backend .env..."
  cp .env.example .env
fi
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend
npm install
if [ ! -f .env ]; then
  echo "📄 Copying frontend .env..."
  cp .env.example .env
fi
cd ..

echo "🐳 Starting database container..."
docker-compose up -d

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

echo "🗄️ Running database migrations and seeding data..."
cd backend
npx prisma migrate dev
npm run seed
cd ..

echo "✅ Setup complete! You can now start the servers."
echo "Run 'make dev-backend' and 'make dev-frontend' in separate terminals."
