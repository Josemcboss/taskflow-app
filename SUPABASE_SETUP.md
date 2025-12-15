# 🔧 Cómo Obtener tus Credenciales de Supabase

## Paso 1: Crear Cuenta en Supabase

1. **Ve a:** https://supabase.com
2. **Haz clic en:** "Start your project" (botón verde)
3. **Regístrate con:**
   - GitHub (recomendado)
   - O email y contraseña

## Paso 2: Crear tu Proyecto

1. Una vez dentro, haz clic en **"New Project"**
2. **Completa el formulario:**
   ```
   Name: TaskFlow
   Database Password: [Crea una contraseña segura y GUÁRDALA]
   Region: South America (São Paulo) - o la más cercana
   Pricing Plan: Free (ya seleccionado)
   ```
3. Haz clic en **"Create new project"**
4. **Espera 1-2 minutos** mientras se crea el proyecto (verás una barra de progreso)

## Paso 3: Obtener las Credenciales ⭐

Una vez que el proyecto esté listo:

### 3.1 Ir a Configuración de API
1. En el menú lateral izquierdo, busca el ícono de **engrane** ⚙️ (Settings)
2. Haz clic en **"API"** en el submenú

### 3.2 Copiar Project URL
Busca la sección **"Project URL"**:
```
https://xxxxxxxxxxxxxxxxxxxxx.supabase.co
```
- Haz clic en el ícono de **copiar** 📋 al lado de la URL
- Esta es tu `SUPABASE_URL`

### 3.3 Copiar API Key
Baja a la sección **"Project API keys"**:
- Busca **"anon public"** (NO uses "service_role")
- Verás una clave larga que empieza con `eyJ...`
- Haz clic en el ícono de **copiar** 📋
- Esta es tu `SUPABASE_ANON_KEY`

## Paso 4: Actualizar config.js

1. Abre el archivo `js/config.js`
2. Reemplaza las dos líneas:

```javascript
const SUPABASE_URL = 'https://tu-proyecto-real.supabase.co'; // 👈 Pega tu URL aquí
const SUPABASE_ANON_KEY = 'eyJhbGci...tu-clave-completa-aqui'; // 👈 Pega tu key aquí
```

3. **Guarda el archivo** (Ctrl+S)
4. **Recarga el navegador** (F5)

## Paso 5: Crear la Tabla de Base de Datos

1. En Supabase, en el menú lateral, haz clic en **"SQL Editor"** 
2. Haz clic en **"New query"**
3. **Copia y pega TODO este código:**

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

4. Haz clic en **"Run"** (botón verde)
5. Deberías ver "Success. No rows returned"

## ✅ Verificar

1. Recarga tu aplicación: http://localhost:3000
2. Ya NO deberías ver errores en la consola
3. Haz clic en "Regístrate"
4. Crea tu primera cuenta

## 🆘 Solución de Problemas

### "Project URL is invalid"
- Asegúrate de que la URL empiece con `https://`
- No incluyas espacios ni caracteres extra
- Ejemplo correcto: `https://abcdefgh.supabase.co`

### "Invalid API key"
- La clave debe ser MUY larga (300+ caracteres)
- Empieza con `eyJ`
- Asegúrate de copiarla completa

### "Failed to create project"
- Verifica tu conexión a Internet
- Intenta con otro navegador
- Espera un poco más (puede tardar hasta 3 minutos)

## 📺 Video Tutorial Oficial
Si prefieres ver un video: https://supabase.com/docs/guides/getting-started

---

**¿Necesitas ayuda?** Déjame saber en qué paso estás y te ayudo.
