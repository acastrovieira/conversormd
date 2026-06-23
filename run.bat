@echo off
title Conversor MD - Inicializador
echo ==================================================
echo           INICIANDO CONVERSOR MD
echo ==================================================
echo.
echo [1/2] Iniciando Servidor Backend...
start "Conversor MD - Backend" cmd /k "cd backend && npm run dev"

echo [2/2] Iniciando Servidor Frontend...
start "Conversor MD - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==================================================
echo ✅ Servidores iniciados com sucesso!
echo 🌐 Abra o navegador em: http://localhost:5173
echo ==================================================
echo.
pause
