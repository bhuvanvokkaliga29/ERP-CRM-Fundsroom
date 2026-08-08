.PHONY: setup dev dev-backend dev-frontend db-up db-down db-seed clean

setup:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Setting up environment files..."
	@if not exist "backend\.env" copy backend\.env.example backend\.env
	@if not exist "frontend\.env" copy frontend\.env.example frontend\.env

db-up:
	docker-compose up -d

db-down:
	docker-compose down

db-seed:
	cd backend && npx prisma db seed

dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

clean:
	@echo "Cleaning node_modules..."
	rmdir /S /Q backend\node_modules
	rmdir /S /Q frontend\node_modules
	@echo "Done!"
