#!/bin/bash

# 🚀 Script de Deployment Rápido para Render
# TaskFlow v2.0

echo "======================================"
echo "🚀 TaskFlow v2.0 - Deploy a Render"
echo "======================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar Git
echo -e "${BLUE}[1/5]${NC} Verificando Git..."
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git no está instalado${NC}"
    echo "Instala Git desde: https://git-scm.com/"
    exit 1
fi
echo -e "${GREEN}✓ Git instalado${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ No se encontró package.json${NC}"
    echo "Asegúrate de ejecutar este script desde la raíz del proyecto"
    exit 1
fi
echo -e "${GREEN}✓ Directorio correcto${NC}"
echo ""

# Verificar .gitignore
echo -e "${BLUE}[2/5]${NC} Verificando archivos..."
if [ ! -f ".gitignore" ]; then
    echo -e "${YELLOW}⚠ Creando .gitignore...${NC}"
    cat > .gitignore << 'EOF'
node_modules/
js/config.js
.env
*.log
.DS_Store
EOF
    echo -e "${GREEN}✓ .gitignore creado${NC}"
else
    echo -e "${GREEN}✓ .gitignore existe${NC}"
fi
echo ""

# Verificar que config.js no será subido
if git check-ignore js/config.js &> /dev/null; then
    echo -e "${GREEN}✓ js/config.js está ignorado (seguro)${NC}"
else
    echo -e "${YELLOW}⚠ ADVERTENCIA: js/config.js podría subirse a GitHub${NC}"
    echo "Asegúrate de que esté en .gitignore"
fi
echo ""

# Git init
echo -e "${BLUE}[3/5]${NC} Inicializando Git..."
if [ -d ".git" ]; then
    echo -e "${GREEN}✓ Repositorio Git ya existe${NC}"
else
    git init
    echo -e "${GREEN}✓ Git inicializado${NC}"
fi
echo ""

# Configurar usuario de Git
echo -e "${BLUE}[4/5]${NC} Configuración de Git..."
if [ -z "$(git config user.name)" ]; then
    echo -e "${YELLOW}Ingresa tu nombre:${NC}"
    read username
    git config user.name "$username"
fi
if [ -z "$(git config user.email)" ]; then
    echo -e "${YELLOW}Ingresa tu email:${NC}"
    read useremail
    git config user.email "$useremail"
fi
echo -e "${GREEN}✓ Usuario configurado:${NC} $(git config user.name)"
echo ""

# Add y commit
echo -e "${BLUE}[5/5]${NC} Preparando código..."
git add .
git commit -m "Initial commit - TaskFlow v2.0" || echo -e "${YELLOW}Ya hay un commit previo${NC}"
echo ""

# Instrucciones finales
echo "======================================"
echo -e "${GREEN}✅ Preparación completa!${NC}"
echo "======================================"
echo ""
echo -e "${BLUE}📋 PRÓXIMOS PASOS:${NC}"
echo ""
echo "1️⃣  Crear repositorio en GitHub:"
echo "   → https://github.com/new"
echo "   → Nombre: taskflow-app"
echo ""
echo "2️⃣  Conectar y subir (reemplaza TU_USUARIO):"
echo "   ${YELLOW}git remote add origin https://github.com/TU_USUARIO/taskflow-app.git${NC}"
echo "   ${YELLOW}git branch -M main${NC}"
echo "   ${YELLOW}git push -u origin main${NC}"
echo ""
echo "3️⃣  Ir a Render:"
echo "   → https://dashboard.render.com"
echo "   → New + → Web Service"
echo "   → Conectar tu repositorio"
echo ""
echo "4️⃣  Configurar:"
echo "   → Build Command: npm install"
echo "   → Start Command: npm start"
echo "   → Variables de entorno:"
echo "     • NODE_ENV = production"
echo "     • SUPABASE_URL = tu_url"
echo "     • SUPABASE_KEY = tu_key"
echo ""
echo "5️⃣  Desplegar:"
echo "   → Create Web Service"
echo "   → Esperar 2-3 minutos"
echo "   → ¡Listo! 🎉"
echo ""
echo -e "${BLUE}📚 Documentación completa:${NC}"
echo "   • QUICK_DEPLOY.md - Guía rápida (15 min)"
echo "   • RENDER_DEPLOYMENT.md - Guía completa"
echo "   • DEPLOYMENT_CHECKLIST.md - Checklist detallado"
echo ""
echo "======================================"
echo -e "${GREEN}¡Buena suerte con tu deployment! 🚀${NC}"
echo "======================================"
