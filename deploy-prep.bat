@echo off
REM 🚀 Script de Deployment Rápido para Render (Windows)
REM TaskFlow v2.0

echo ======================================
echo 🚀 TaskFlow v2.0 - Deploy a Render
echo ======================================
echo.

REM Verificar Git
echo [1/5] Verificando Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git no está instalado
    echo Instala Git desde: https://git-scm.com/
    pause
    exit /b 1
)
echo ✓ Git instalado
echo.

REM Verificar package.json
if not exist "package.json" (
    echo ❌ No se encontró package.json
    echo Asegúrate de ejecutar este script desde la raíz del proyecto
    pause
    exit /b 1
)
echo ✓ Directorio correcto
echo.

REM Verificar .gitignore
echo [2/5] Verificando archivos...
if not exist ".gitignore" (
    echo ⚠ Creando .gitignore...
    (
        echo node_modules/
        echo js/config.js
        echo .env
        echo *.log
        echo .DS_Store
    ) > .gitignore
    echo ✓ .gitignore creado
) else (
    echo ✓ .gitignore existe
)
echo.

REM Git init
echo [3/5] Inicializando Git...
if exist ".git" (
    echo ✓ Repositorio Git ya existe
) else (
    git init
    echo ✓ Git inicializado
)
echo.

REM Configurar usuario de Git
echo [4/5] Configuración de Git...
git config user.name >nul 2>&1
if %errorlevel% neq 0 (
    set /p username="Ingresa tu nombre: "
    git config user.name "%username%"
)
git config user.email >nul 2>&1
if %errorlevel% neq 0 (
    set /p useremail="Ingresa tu email: "
    git config user.email "%useremail%"
)
for /f "delims=" %%i in ('git config user.name') do set gituser=%%i
echo ✓ Usuario configurado: %gituser%
echo.

REM Add y commit
echo [5/5] Preparando código...
git add .
git commit -m "Initial commit - TaskFlow v2.0" 2>nul
if %errorlevel% neq 0 (
    echo ⚠ Ya hay un commit previo
)
echo.

REM Instrucciones finales
echo ======================================
echo ✅ Preparación completa!
echo ======================================
echo.
echo 📋 PRÓXIMOS PASOS:
echo.
echo 1️⃣  Crear repositorio en GitHub:
echo    → https://github.com/new
echo    → Nombre: taskflow-app
echo.
echo 2️⃣  Conectar y subir (reemplaza TU_USUARIO):
echo    git remote add origin https://github.com/TU_USUARIO/taskflow-app.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3️⃣  Ir a Render:
echo    → https://dashboard.render.com
echo    → New + → Web Service
echo    → Conectar tu repositorio
echo.
echo 4️⃣  Configurar:
echo    → Build Command: npm install
echo    → Start Command: npm start
echo    → Variables de entorno:
echo      • NODE_ENV = production
echo      • SUPABASE_URL = tu_url
echo      • SUPABASE_KEY = tu_key
echo.
echo 5️⃣  Desplegar:
echo    → Create Web Service
echo    → Esperar 2-3 minutos
echo    → ¡Listo! 🎉
echo.
echo 📚 Documentación completa:
echo    • QUICK_DEPLOY.md - Guía rápida (15 min)
echo    • RENDER_DEPLOYMENT.md - Guía completa
echo    • DEPLOYMENT_CHECKLIST.md - Checklist detallado
echo.
echo ======================================
echo ¡Buena suerte con tu deployment! 🚀
echo ======================================
echo.
pause
