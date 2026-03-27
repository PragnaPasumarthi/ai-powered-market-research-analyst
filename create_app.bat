@echo off
rmdir /s /q frontend
call npm create vite@latest frontend -- --template react
cd frontend
call npm install
call npm install -D tailwindcss postcss autoprefixer
call npx tailwindcss init -p
call npm install lucide-react
