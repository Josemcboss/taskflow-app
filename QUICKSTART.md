# 🚀 Guía de Inicio Rápido - TaskFlow

Esta guía te ayudará a poner en marcha TaskFlow en menos de 5 minutos.

## Requisitos Previos

- ✅ Node.js instalado (versión 14 o superior)
- ✅ Navegador web moderno (Chrome, Firefox, Edge, Safari)
- ✅ Conexión a Internet

## Paso 1: Instalar Dependencias

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Esto instalará Express y las dependencias necesarias.

## Paso 2: Iniciar el Servidor

```bash
npm start
```

Deberías ver:
```
🚀 TaskFlow Server iniciado
📍 Servidor corriendo en: http://localhost:3000
📝 Aplicación: http://localhost:3000
✅ Presiona Ctrl+C para detener el servidor
```

## Paso 3: Abrir en el Navegador

Abre tu navegador y ve a:
```
http://localhost:3000
```

## Paso 4: Configurar Supabase

> [!WARNING]
> La aplicación **NO funcionará** hasta que configures Supabase.

### 4.1 Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Crea una cuenta (gratis)
3. Haz clic en "New Project"
4. Completa:
   - **Name**: TaskFlow
   - **Database Password**: (guarda esta contraseña)
   - **Region**: La más cercana a ti
5. Espera 1-2 minutos mientras se crea

### 4.2 Obtener Credenciales

1. En Supabase, ve a **Settings** ⚙️ → **API**
2. Copia:
   - **Project URL** (ejemplo: `https://xxxxx.supabase.co`)
   - **anon/public key** (clave larga, empieza con `eyJ...`)

### 4.3 Actualizar Configuración

1. Abre el archivo `js/config.js`
2. Reemplaza:
```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...tu-clave-aqui...';
```

### 4.4 Crear Tabla de Base de Datos

1. En Supabase, ve a **SQL Editor**
2. Haz clic en "New query"
3. Copia y pega este SQL completo:

```sql
-- Crear tabla de tareas
CREATE TABLE todos (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para rendimiento
CREATE INDEX idx_todos_user_id ON todos(user_id);

-- Habilitar Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view their own todos"
  ON todos FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own todos"
  ON todos FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos"
  ON todos FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos"
  ON todos FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_todos_updated_at 
  BEFORE UPDATE ON todos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

4. Haz clic en **Run**

### 4.5 (Opcional) Habilitar Realtime

1. En Supabase, ve a **Database** → **Replication**
2. Busca la tabla `todos`
3. Activa el toggle

## Paso 5: ¡Usar la Aplicación!

1. Regresa a http://localhost:3000
2. Haz clic en "Regístrate"
3. Ingresa email y contraseña (mínimo 6 caracteres)
4. Crea tu primera tarea

## 🎉 ¡Listo!

Tu aplicación está funcionando. Ahora puedes:
- ✅ Crear tareas
- ✅ Marcar como completadas
- ✅ Editar y eliminar
- ✅ Filtrar por estado
- ✅ Ver estadísticas en tiempo real

## 🔧 Comandos Útiles

```bash
# Iniciar servidor
npm start

# Verificar versión de Node
node --version

# Reinstalar dependencias
npm install

# Ver ayuda de npm
npm help
```

## 🐛 Solución de Problemas

### Error: "Cannot find module 'express'"
**Solución**: Ejecuta `npm install`

### Error: "Port 3000 is already in use"
**Solución**: Detén otros servidores en el puerto 3000 o cambia el puerto en `server.js`

### La página carga pero no funciona
**Solución**: Verifica que hayas configurado `js/config.js` con tus credenciales de Supabase

### No puedo crear tareas
**Solución**: Asegúrate de haber ejecutado el SQL script en Supabase para crear la tabla `todos`

## 📚 Más Información

- **README completo**: [README.md](README.md)
- **Documentación de Supabase**: https://supabase.com/docs
- **Guía de Express**: https://expressjs.com/

---

¿Necesitas ayuda? Revisa el README.md para más detalles.
