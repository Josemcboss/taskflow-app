# 📝 TaskFlow - Aplicación de Lista de Tareas

Aplicación web moderna de lista de tareas con autenticación de usuarios usando Supabase. Diseño elegante con glassmorphism, gradientes vibrantes y animaciones suaves.

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor local
npm start

# 3. Abrir en el navegador
# http://localhost:3000
```

> [!IMPORTANT]
> Antes de usar la aplicación, debes configurar Supabase. Sigue la sección [Configuración Inicial](#-configuración-inicial) más abajo.

## ✨ Características

- 🔐 **Autenticación completa** - Registro e inicio de sesión con Supabase Auth
- ✅ **Gestión de tareas** - Crear, editar, eliminar y marcar tareas como completadas
- 🎯 **Filtros inteligentes** - Ver todas las tareas, solo activas o solo completadas
- 📊 **Estadísticas en tiempo real** - Contador de tareas totales, activas y completadas
- 🔄 **Actualizaciones en tiempo real** - Sincronización automática con la base de datos
- 🎨 **Diseño moderno** - UI premium con glassmorphism, gradientes y micro-animaciones
- 📱 **Totalmente responsive** - Funciona perfectamente en móviles, tablets y desktop
- 🌐 **Persistencia de datos** - Todas las tareas se guardan en Supabase

## 🚀 Configuración Inicial

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratuita
2. Haz clic en "New Project"
3. Completa los detalles:
   - **Name**: TaskFlow (o el nombre que prefieras)
   - **Database Password**: Crea una contraseña segura
   - **Region**: Selecciona la más cercana a tu ubicación
4. Haz clic en "Create new project" y espera unos minutos

### 2. Obtener Credenciales

1. En tu proyecto de Supabase, ve a **Settings** (⚙️) → **API**
2. Encontrarás:
   - **Project URL**: Copia esta URL
   - **Project API keys** → **anon/public**: Copia esta clave

### 3. Configurar la Aplicación

1. Abre el archivo `js/config.js`
2. Reemplaza los valores con tus credenciales:

```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-clave-anon-aqui';
```

### 4. Crear la Tabla de Tareas

1. En Supabase, ve a **SQL Editor**
2. Haz clic en "New query"
3. Copia y pega el siguiente código SQL:

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

-- Índice para mejorar el rendimiento de consultas por usuario
CREATE INDEX idx_todos_user_id ON todos(user_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias tareas
CREATE POLICY "Users can view their own todos"
  ON todos FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden crear sus propias tareas
CREATE POLICY "Users can create their own todos"
  ON todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias tareas
CREATE POLICY "Users can update their own todos"
  ON todos FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propias tareas
CREATE POLICY "Users can delete their own todos"
  ON todos FOR DELETE
  USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en cada modificación
CREATE TRIGGER update_todos_updated_at 
  BEFORE UPDATE ON todos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

4. Haz clic en "Run" para ejecutar el script

### 5. Habilitar Realtime (Opcional pero Recomendado)

1. En Supabase, ve a **Database** → **Replication**
2. En "Source", busca la tabla `todos`
3. Habilita el toggle para activar realtime en esta tabla

## 🎯 Uso de la Aplicación

### Primera Vez

1. Abre `index.html` en tu navegador
2. Haz clic en "Regístrate"
3. Ingresa tu email y contraseña (mínimo 6 caracteres)
4. Haz clic en "Crear Cuenta"
5. Serás redirigido automáticamente a la aplicación

### Crear Tareas

1. En el campo "¿Qué necesitas hacer hoy?", escribe tu tarea
2. Presiona Enter o haz clic en "Agregar"
3. La tarea aparecerá inmediatamente en tu lista

### Gestionar Tareas

- **Completar/Descompletar**: Haz clic en el checkbox (✓) a la izquierda
- **Editar**: Haz clic en el ícono de lápiz (✎), modifica el texto y guarda (✓)
- **Eliminar**: Haz clic en el ícono de papelera (🗑) y confirma

### Filtrar Tareas

- **Todas**: Muestra todas las tareas
- **Activas**: Muestra solo las tareas pendientes
- **Completadas**: Muestra solo las tareas completadas

## 🛠️ Tecnologías Utilizadas

- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos con variables CSS, glassmorphism y animaciones
- **JavaScript (Vanilla)** - Lógica de la aplicación
- **Supabase** - Backend as a Service
  - Supabase Auth - Autenticación de usuarios
  - Supabase Database (PostgreSQL) - Almacenamiento de datos
  - Supabase Realtime - Actualizaciones en tiempo real
- **Google Fonts (Inter)** - Tipografía moderna

## 📂 Estructura del Proyecto

```
todo-app-supabase/
├── index.html          # Página de autenticación (login/registro)
├── app.html            # Aplicación principal de tareas
├── server.js           # Servidor Node.js con Express
├── package.json        # Dependencias del proyecto
├── .gitignore          # Archivos ignorados por Git
├── styles/
│   ├── auth.css       # Estilos para autenticación
│   └── app.css        # Estilos para la aplicación principal
├── js/
│   ├── config.js      # Configuración de Supabase
│   ├── auth.js        # Lógica de autenticación
│   └── app.js         # Lógica principal de la aplicación
└── README.md          # Este archivo
```

## 🔒 Seguridad

- **Row Level Security (RLS)**: Cada usuario solo puede acceder a sus propias tareas
- **Políticas de Supabase**: Controlan qué operaciones puede realizar cada usuario
- **Autenticación segura**: Gestionada por Supabase Auth
- **Claves públicas**: La anon key es segura para usar en el frontend

## 🎨 Personalización

### Cambiar Colores

Edita las variables CSS en `styles/auth.css` y `styles/app.css`:

```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  /* ... más colores ... */
}
```

### Modificar Animaciones

Ajusta los valores de `transition` y `@keyframes` en los archivos CSS.

## 🐛 Solución de Problemas

### "Supabase configuration not set"

- Verifica que hayas actualizado `js/config.js` con tus credenciales reales
- Asegúrate de que no haya comillas extra o espacios

### No puedo crear tareas

- Verifica que la tabla `todos` exista en Supabase
- Confirma que las políticas RLS estén configuradas correctamente
- Revisa la consola del navegador (F12) para ver errores

### Las tareas no se actualizan en tiempo real

- Habilita Realtime en la tabla `todos` en Supabase
- Verifica tu conexión a internet

### Error al iniciar sesión

- Verifica que el email y contraseña sean correctos
- Para nuevos usuarios, puede ser necesario confirmar el email (revisa tu configuración de Auth en Supabase)

## 📝 Notas

- **Email Confirmation**: Por defecto, Supabase puede requerir confirmación de email. Puedes deshabilitarlo en Settings → Auth → Email Auth
- **Límites gratuitos**: El plan gratuito de Supabase incluye 500MB de base de datos y 2GB de transferencia mensual, más que suficiente para uso personal
- **Deployment**: Puedes desplegar esta app en servicios como Netlify, Vercel, GitHub Pages, etc.

## 🚀 Próximos Pasos

Ideas para mejorar la aplicación:

- Agregar fechas de vencimiento a las tareas
- Implementar categorías o etiquetas
- Añadir prioridades (alta, media, baja)
- Crear subtareas
- Agregar modo oscuro/claro
- Implementar búsqueda de tareas
- Exportar tareas a PDF o JSON

## 🌐 Deployment en Producción

### Desplegar en Render (Recomendado)

**Versión Rápida:** Lee [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - 15 minutos desde cero  
**Guía Completa:** Lee [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) - Paso a paso detallado  
**Checklist:** Usa [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Para verificar todo

#### Resumen:
1. Sube tu código a GitHub
2. Crea Web Service en Render
3. Configura variables de entorno
4. ¡Deploy automático!

**Costo:** $0/mes (plan gratuito)

### Otras Opciones

- **Vercel**: Excelente para Next.js, requiere adaptación
- **Netlify**: Necesita configuración adicional para Express
- **Railway**: Alternativa similar a Render
- **Heroku**: Opción confiable pero con menos horas gratuitas

## 📄 Licencia

Este proyecto es de código abierto y está disponible libremente para uso personal o comercial.

---

Hecho con ❤️ usando Supabase
