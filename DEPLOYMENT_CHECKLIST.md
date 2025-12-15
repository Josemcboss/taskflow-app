# ✅ Checklist de Deployment - TaskFlow v2.0

## 🎯 ANTES DE DESPLEGAR

### Base de Datos (Supabase)
- [ ] Cuenta creada en supabase.com
- [ ] Proyecto creado
- [ ] SQL migration ejecutada (`001_taskflow_v2_schema.sql`)
- [ ] Storage bucket "avatars" creado (público)
- [ ] Storage bucket "attachments" creado (privado)
- [ ] Políticas de Storage configuradas
- [ ] Credenciales copiadas (URL + anon key)

### Código Local
- [ ] `npm install` ejecutado exitosamente
- [ ] `npm start` funciona localmente
- [ ] Todas las features probadas localmente
- [ ] Archivo `.gitignore` creado
- [ ] Archivo `js/config.js` con credenciales locales
- [ ] Archivo `js/config.example.js` existe (sin credenciales reales)

### Control de Versiones (GitHub)
- [ ] Cuenta de GitHub creada
- [ ] Git instalado localmente
- [ ] Repositorio creado en GitHub
- [ ] Git inicializado (`git init`)
- [ ] Código commiteado (`git commit`)
- [ ] Código pusheado a GitHub (`git push`)
- [ ] Verificado que `js/config.js` NO está en GitHub

---

## 🚀 DURANTE EL DEPLOYMENT

### Render Setup
- [ ] Cuenta creada en render.com
- [ ] GitHub conectado con Render
- [ ] Web Service creado
- [ ] Runtime configurado: Node
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Plan seleccionado: Free

### Variables de Entorno
- [ ] Variable `NODE_ENV` = `production`
- [ ] Variable `SUPABASE_URL` configurada
- [ ] Variable `SUPABASE_KEY` configurada

### Deployment
- [ ] Deploy iniciado
- [ ] Build completado sin errores
- [ ] Logs muestran: "🚀 TaskFlow Server iniciado"
- [ ] Badge "Live" en verde

---

## ✅ DESPUÉS DEL DEPLOYMENT

### Verificación Básica
- [ ] URL accesible: `https://tu-app.onrender.com`
- [ ] Página de login carga
- [ ] Sin errores en DevTools Console
- [ ] CSS se aplica correctamente
- [ ] JavaScript carga sin errores

### Autenticación
- [ ] Registro de nuevo usuario funciona
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Redirección a app.html funciona

### Features Core
- [ ] Dashboard de tareas carga
- [ ] Crear tarea funciona
- [ ] Editar tarea funciona
- [ ] Completar tarea funciona
- [ ] Eliminar tarea funciona

### Features Avanzadas
- [ ] Sistema de prioridades funciona
- [ ] Contador de caracteres funciona
- [ ] Búsqueda funciona
- [ ] Filtros funcionan
- [ ] Categorías: crear/editar/eliminar
- [ ] Subtareas: crear/editar/colapsar
- [ ] Drag & Drop funciona
- [ ] Reordenamiento persiste

### Profile & Storage
- [ ] Página de perfil carga
- [ ] Editar información funciona
- [ ] Subir avatar funciona
- [ ] Avatar se ve correctamente
- [ ] Adjuntar archivos a tareas funciona
- [ ] Descargar archivos funciona
- [ ] Preview de archivos funciona

### Colaboración
- [ ] Compartir tarea funciona
- [ ] Permisos se aplican correctamente
- [ ] Lista de usuarios compartidos muestra

### Analytics & Export
- [ ] Página de analytics carga
- [ ] Gráficos se renderizan (Chart.js)
- [ ] Filtros de fecha funcionan
- [ ] Estadísticas calculan correctamente
- [ ] Exportar PDF funciona
- [ ] Exportar CSV funciona
- [ ] Exportar JSON funciona

### Notificaciones
- [ ] Botón de notificaciones aparece
- [ ] Permisos se pueden solicitar
- [ ] Notificaciones se envían (si hay tareas vencidas)

### Responsive Design
- [ ] Desktop (>1024px): UI completa
- [ ] Tablet (768-1024px): UI adaptada
- [ ] Mobile (480-768px): UI simplificada
- [ ] Small Mobile (<480px): UI compacta
- [ ] Todos los modales son responsivos
- [ ] Navegación funciona en todos los tamaños

---

## 🔧 CONFIGURACIÓN POST-DEPLOYMENT

### Dominio Personalizado (Opcional)
- [ ] Dominio comprado
- [ ] Dominio agregado en Render
- [ ] DNS configurado
- [ ] SSL/HTTPS activo
- [ ] Propagación DNS completada

### Monitoreo
- [ ] Dashboard de Render configurado
- [ ] Métricas revisadas
- [ ] Logs monitoreados
- [ ] Alertas configuradas (opcional)

### Backup
- [ ] Backup de base de datos programado
- [ ] Código en GitHub actualizado
- [ ] Documentación actualizada

---

## 📝 INFORMACIÓN DE DEPLOYMENT

### URLs
- **Producción:** `https://____________.onrender.com`
- **GitHub:** `https://github.com/____________/taskflow-app`
- **Supabase:** `https://app.supabase.com/project/____________`

### Credenciales (NO COMPARTIR)
- **Supabase URL:** `https://____________.supabase.co`
- **Supabase Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Comandos Útiles
```bash
# Ver logs en tiempo real
# (En dashboard de Render)

# Actualizar código
git add .
git commit -m "Descripción del cambio"
git push origin main

# Probar localmente
npm start
```

---

## 🐛 PROBLEMAS COMUNES

### App no carga
- [ ] Verificar que Render está "Live"
- [ ] Revisar logs de Render
- [ ] Verificar variables de entorno
- [ ] Limpiar cache del navegador

### Errores de Supabase
- [ ] Verificar credenciales en Render
- [ ] Verificar que SQL migration se ejecutó
- [ ] Verificar políticas RLS
- [ ] Verificar que las tablas existen

### Storage no funciona
- [ ] Verificar que buckets existen
- [ ] Verificar políticas de Storage
- [ ] Verificar límites de tamaño
- [ ] Revisar CORS en Supabase

### Cold Start (App lenta)
- [ ] Normal en plan Free de Render
- [ ] App se duerme después de 15 min
- [ ] Primer request tarda 30-60 segundos
- [ ] Considerar upgrade a plan paid (opcional)

---

## 🎉 DEPLOYMENT COMPLETADO

**Fecha:** _______________  
**Por:** _______________  
**Estado:** ✅ Producción  

**Próximos Pasos:**
1. Compartir URL con usuarios
2. Monitorear métricas y logs
3. Recopilar feedback
4. Planear mejoras futuras

---

**¡Felicidades! TaskFlow v2.0 está en producción! 🚀**
