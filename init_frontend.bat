@echo off
mkdir frontend
cd frontend
call npx -y create-vite ./ --template react
call npm install
call npm install -D tailwindcss postcss autoprefixer
call npx tailwindcss init -p
call npm install lucide-react
