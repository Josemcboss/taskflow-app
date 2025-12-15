# 🚀 Guía de Deployment en Render - TaskFlow v2.0

## 📋 PRE-REQUISITOS

### 1. Cuenta en Render
- ✅ Crear cuenta gratuita en [render.com](https://render.com)
- ✅ Verificar email

### 2. Cuenta en GitHub
- ✅ Tener cuenta en [github.com](https://github.com)
- ✅ Instalar Git en tu computadora

### 3. Base de Datos Supabase
- ✅ Proyecto creado en [supabase.com](https://supabase.com)
- ✅ Migración SQL ejecutada
- ✅ Storage buckets creados (avatars, attachments)

---

## 🔧 PASO 1: CONFIGURAR SUPABASE

### 1.1 Ejecutar Migración SQL
```sql
-- Abrir Supabase SQL Editor
-- https://app.supabase.com/project/YOUR_PROJECT/sql/new

-- Copiar y ejecutar todo el contenido de:
supabase/migrations/001_taskflow_v2_schema.sql
```

### 1.2 Crear Storage Buckets

**Bucket 1: avatars (Público)**
```
1. Ir a: Storage > Create new bucket
2. Name: avatars
3. Public: ✓ Sí
4. File size limit: 5 MB
5. Allowed MIME types: image/jpeg, image/png, image/webp
```

**Bucket 2: attachments (Privado)**
```
1. Ir a: Storage > Create new bucket
2. Name: attachments
3. Public: ✗ No
4. File size limit: 10 MB
5. Allowed MIME types: Todos
```

### 1.3 Configurar Storage Policies

```sql
-- Políticas para avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas para attachments
CREATE POLICY "Users can view own attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 1.4 Obtener Credenciales de Supabase

```
1. Ir a: Project Settings > API
2. Copiar:
   - Project URL: https://xxxxx.supabase.co
   - anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANTE:** Guarda estas credenciales, las necesitarás más adelante.

---

## 📦 PASO 2: PREPARAR CÓDIGO PARA GITHUB

### 2.1 Verificar archivo config.example.js

Asegúrate de que `js/config.example.js` existe:

```javascript
// js/config.example.js
const SUPABASE_URL = 'TU_SUPABASE_URL_AQUI';
const SUPABASE_KEY = 'TU_SUPABASE_ANON_KEY_AQUI';
```

### 2.2 Actualizar tu archivo config.js local

```javascript
// js/config.js
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### 2.3 Verificar .gitignore

El archivo `.gitignore` ya debe estar creado con:

```
node_modules/
js/config.js
.env
*.log
```

Esto evita subir tus credenciales a GitHub.

---

## 🐙 PASO 3: SUBIR A GITHUB

### 3.1 Crear Repositorio en GitHub

```
1. Ir a: https://github.com/new
2. Repository name: taskflow-app
3. Description: TaskFlow v2.0 - Aplicación de Tareas con Supabase
4. Visibility: Public (o Private si prefieres)
5. NO inicializar con README, .gitignore ni license
6. Clic en "Create repository"
```

### 3.2 Inicializar Git Local

Abre terminal en la carpeta del proyecto:

```bash
# Inicializar repositorio Git
git init

# Configurar tu usuario (si no lo has hecho)
git config user.name "Tu Nombre"
git config user.email "tu@email.com"

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Initial commit - TaskFlow v2.0"

# Conectar con GitHub (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/taskflow-app.git

# Subir código
git branch -M main
git push -u origin main
```

### 3.3 Verificar en GitHub

```
1. Recargar tu página de GitHub
2. Deberías ver todos tus archivos
3. Verifica que js/config.js NO esté en el repositorio (está en .gitignore)
```

---

## 🌐 PASO 4: DESPLEGAR EN RENDER

### 4.1 Conectar GitHub con Render

```
1. Ir a: https://dashboard.render.com
2. Clic en "New +" > "Web Service"
3. Clic en "Connect GitHub" (si no lo has hecho)
4. Autorizar Render en GitHub
5. Buscar tu repositorio: taskflow-app
6. Clic en "Connect"
```

### 4.2 Configurar Web Service

**Configuración Básica:**
```
Name: taskflow-app
Region: Oregon (US West) o el más cercano
Branch: main
Runtime: Node
```

**Build & Deploy:**
```
Build Command: npm install
Start Command: npm start
```

**Plan:**
```
Instance Type: Free
```

### 4.3 Variables de Entorno

**IMPORTANTE:** Debes configurar variables de entorno para que Render pueda conectarse a Supabase.

```
1. En la configuración de Render, ir a "Environment"
2. Clic en "Add Environment Variable"
3. Agregar las siguientes variables:
```

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | Tu Project URL de Supabase |
| `SUPABASE_KEY` | Tu anon public key de Supabase |

### 4.4 Crear archivo de configuración para producción

Necesitas modificar cómo se cargan las credenciales en producción.

**Opción A: Inyectar variables en el HTML (Recomendado)**

Crear archivo `js/config.production.js`:

```javascript
// js/config.production.js
// Este archivo se usa en producción con variables de entorno inyectadas
const SUPABASE_URL = window.ENV?.SUPABASE_URL || 'https://xxxxx.supabase.co';
const SUPABASE_KEY = window.ENV?.SUPABASE_KEY || 'eyJhbGciOiJIUzI1...';
```

**Opción B: Usar directamente en HTML (Más simple)**

Modificar `index.html` y `app.html` para incluir:

```html
<!-- Antes de cargar config.js -->
<script>
  // Variables de entorno inyectadas por Render
  window.ENV = {
    SUPABASE_URL: 'https://xxxxx.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  };
</script>
<script src="js/config.js"></script>
```

### 4.5 Iniciar Deployment

```
1. Revisar toda la configuración
2. Clic en "Create Web Service"
3. Render comenzará a:
   - Clonar tu repositorio
   - Ejecutar npm install
   - Iniciar tu servidor
4. Esperar 3-5 minutos
```

### 4.6 Monitorear el Deploy

```
1. Ver logs en tiempo real en la página de Render
2. Buscar el mensaje: "🚀 TaskFlow Server iniciado"
3. Una vez completado, verás "Live" en verde
```

---

## ✅ PASO 5: VERIFICAR DEPLOYMENT

### 5.1 Acceder a tu App

Tu aplicación estará disponible en:
```
https://taskflow-app.onrender.com
```

(El nombre puede variar según disponibilidad)

### 5.2 Probar Funcionalidades

**Checklist de Pruebas:**
- [ ] Página de login carga correctamente
- [ ] Puedes registrar un nuevo usuario
- [ ] Puedes iniciar sesión
- [ ] Dashboard de tareas carga
- [ ] Puedes crear una tarea
- [ ] Filtros funcionan
- [ ] Búsqueda funciona
- [ ] Categorías se crean correctamente
- [ ] Drag & Drop funciona
- [ ] Perfil de usuario carga
- [ ] Subir avatar funciona
- [ ] Adjuntar archivos funciona
- [ ] Analytics carga con gráficos
- [ ] Exportar PDF/CSV funciona
- [ ] Notificaciones se pueden activar
- [ ] Diseño responsive funciona en móvil

### 5.3 Verificar Consola del Navegador

```
1. Abrir DevTools (F12)
2. Ir a Console
3. NO debe haber errores rojos
4. Verificar que Supabase se conecta correctamente
```

---

## 🔧 CONFIGURACIÓN ADICIONAL

### Dominio Personalizado (Opcional)

Si tienes un dominio propio:

```
1. En Render, ir a Settings
2. Custom Domain > Add Custom Domain
3. Ingresar tu dominio: taskflow.tudominio.com
4. Configurar DNS según las instrucciones de Render
5. Esperar propagación (puede tardar 24-48 horas)
```

### SSL/HTTPS

✅ Render proporciona HTTPS automáticamente (gratis)

### Auto-Deploy

✅ Render desplegará automáticamente cuando hagas push a GitHub:

```bash
# Hacer cambios en tu código
git add .
git commit -m "Descripción del cambio"
git push origin main

# Render detectará el push y desplegará automáticamente
```

---

## 🐛 TROUBLESHOOTING

### Problema 1: Error de conexión a Supabase

**Síntoma:** Error "Failed to fetch" en consola

**Solución:**
```
1. Verificar que SUPABASE_URL y SUPABASE_KEY están correctos
2. Revisar políticas RLS en Supabase
3. Verificar que las tablas existen
```

### Problema 2: Archivos no cargan

**Síntoma:** CSS/JS no se aplican

**Solución:**
```
1. Verificar que server.js sirve archivos estáticos correctamente
2. Revisar rutas en HTML (usar rutas relativas)
3. Limpiar cache del navegador (Ctrl + Shift + R)
```

### Problema 3: Storage buckets no funcionan

**Síntoma:** Error al subir avatar/archivos

**Solución:**
```
1. Verificar que los buckets existen en Supabase
2. Revisar políticas de Storage
3. Verificar límites de tamaño de archivos
4. Comprobar CORS en Supabase Storage
```

### Problema 4: Build falla en Render

**Síntoma:** Deploy falla con error en npm install

**Solución:**
```
1. Revisar package.json (debe ser válido)
2. Verificar que node_modules no está en Git
3. Revisar logs de Render para error específico
4. Probar npm install localmente primero
```

### Problema 5: App carga pero no funciona

**Síntoma:** Página en blanco o errores JavaScript

**Solución:**
```
1. Abrir DevTools > Console
2. Buscar errores específicos
3. Verificar que config.js tiene las credenciales correctas
4. Verificar que todas las rutas JS/CSS cargan (Network tab)
```

---

## 📊 MONITOREO Y MANTENIMIENTO

### Ver Logs en Tiempo Real

```
1. Dashboard de Render > Tu servicio
2. Clic en "Logs"
3. Ver logs en tiempo real
4. Filtrar por errores
```

### Métricas de Uso

```
1. Dashboard de Render > Tu servicio
2. Metrics: Ver CPU, memoria, requests
3. Plan Free tiene 750 horas/mes (suficiente para uso personal)
```

### Actualizar la Aplicación

```bash
# Local: hacer cambios
git add .
git commit -m "Actualización de features"
git push origin main

# Render desplegará automáticamente en 2-3 minutos
```

### Rollback a Versión Anterior

```
1. Render > Deploy History
2. Seleccionar un deploy anterior exitoso
3. Clic en "Rollback to this version"
```

---

## 💰 COSTOS (Plan Free)

### Render Free Tier
- ✅ 750 horas/mes gratis
- ✅ HTTPS incluido
- ✅ Auto-deploy desde GitHub
- ⚠️ Se duerme después de 15 min de inactividad
- ⚠️ Primer request puede tardar 30-60 segundos (cold start)

### Supabase Free Tier
- ✅ 500 MB database
- ✅ 1 GB file storage
- ✅ 50,000 monthly active users
- ✅ 2 GB bandwidth

**Total: $0/mes para uso personal o pequeño equipo**

---

## 🎓 TIPS DE PRODUCCIÓN

### 1. Backup de Base de Datos
```sql
-- Exportar regularmente desde Supabase
-- Project Settings > Database > Backup & Restore
```

### 2. Monitorear Errores
```javascript
// Agregar error tracking (Opcional)
// Instalar Sentry, LogRocket o similar
```

### 3. Optimización de Performance
- ✅ Habilitar compresión en Express
- ✅ Cachear assets estáticos
- ✅ Optimizar imágenes antes de subir
- ✅ Usar CDN para librerías (Chart.js, etc.)

### 4. Seguridad
- ✅ Mantener dependencias actualizadas
- ✅ Revisar políticas RLS regularmente
- ✅ No exponer API keys en el código
- ✅ Usar HTTPS siempre (Render lo hace automático)

---

## 🎯 CHECKLIST FINAL

Antes de considerar el deployment completo:

- [ ] SQL migration ejecutada correctamente
- [ ] Storage buckets creados y configurados
- [ ] Código subido a GitHub
- [ ] Web Service creado en Render
- [ ] Variables de entorno configuradas
- [ ] Deployment exitoso (badge verde en Render)
- [ ] URL de producción accesible
- [ ] Login/Register funciona
- [ ] Todas las features probadas
- [ ] Responsive design verificado
- [ ] Sin errores en consola del navegador
- [ ] Storage de archivos funciona
- [ ] Notificaciones funcionan
- [ ] Analytics carga correctamente
- [ ] Export funciona (PDF/CSV/JSON)

---

## 📞 SOPORTE

### Recursos Oficiales
- **Render Docs:** https://render.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Express Docs:** https://expressjs.com

### Comunidad
- **Render Discord:** https://render.com/community
- **Supabase Discord:** https://discord.supabase.com

---

## 🎉 ¡FELICIDADES!

Tu aplicación **TaskFlow v2.0** está ahora en producción y accesible desde cualquier parte del mundo. 🌍

**URL de tu app:** `https://taskflow-app.onrender.com`

Comparte el link con amigos, colegas o tu equipo para que empiecen a usar TaskFlow!

---

**Desarrollado con ❤️ para TaskFlow v2.0**  
**Deploy Guide v1.0**  
**Última actualización:** Diciembre 2025
