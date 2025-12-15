# 🎯 INICIO RÁPIDO - Deploy en 3 Pasos

## 🚀 Quiero deployar AHORA (15 minutos)

### Paso 1: Sube a GitHub (5 min)
```bash
git init
git add .
git commit -m "Initial commit - TaskFlow v2.0"

# Crear repo en: https://github.com/new
# Nombre: taskflow-app

git remote add origin https://github.com/TU_USUARIO/taskflow-app.git
git branch -M main
git push -u origin main
```

### Paso 2: Configura Render (5 min)
1. Ir a: https://dashboard.render.com
2. New + → Web Service
3. Conectar tu repo: taskflow-app
4. Configurar:
   - Build: `npm install`
   - Start: `npm start`
5. Agregar variables:
   - `NODE_ENV` = `production`
   - `SUPABASE_URL` = (tu URL de Supabase)
   - `SUPABASE_KEY` = (tu anon key de Supabase)

### Paso 3: Deploy (5 min)
1. Clic en "Create Web Service"
2. Esperar 2-3 minutos
3. Ver badge "Live" en verde
4. ¡Listo! Tu app está en: `https://taskflow-app.onrender.com`

---

## 📚 ¿Necesitas más detalles?

- **Súper Rápido (15 min):** [QUICK_DEPLOY.md](QUICK_DEPLOY.md)
- **Guía Completa (30 min):** [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)  
- **Checklist Detallado:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Resumen Visual:** [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)

---

## 🪟 Script Automático (Windows)

Ejecuta en la terminal:
```bash
deploy-prep.bat
```

Esto preparará tu código automáticamente y te dará los comandos exactos para ejecutar.

---

## ✅ ¿Ya deployaste?

Verifica que todo funcione:
- [ ] App carga sin errores
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Crear tareas funciona
- [ ] Todas las features operan correctamente

---

**¡Buena suerte! 🚀**
