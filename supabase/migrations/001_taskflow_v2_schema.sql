-- ============================================================
-- TaskFlow v2.0 - Database Migration Script
-- ============================================================
-- Este script contiene todas las migraciones necesarias para
-- actualizar la aplicación TaskFlow a la versión 2.0
-- 
-- IMPORTANTE: Ejecuta este script en tu proyecto de Supabase
-- desde el SQL Editor en el dashboard de Supabase
-- ============================================================

-- ============================================================
-- 1. ACTUALIZAR TABLA TODOS
-- ============================================================

-- Agregar nuevas columnas a la tabla todos
ALTER TABLE todos 
  ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS category_id BIGINT,
  ADD COLUMN IF NOT EXISTS parent_id BIGINT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "position" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_subtask BOOLEAN DEFAULT FALSE;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category_id);
CREATE INDEX IF NOT EXISTS idx_todos_parent ON todos(parent_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_position ON todos("position");

-- ============================================================
-- 2. TABLA CATEGORIES (Categorías/Etiquetas)
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#667eea',
  icon VARCHAR(10) DEFAULT '📁',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

-- RLS Policies para categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own categories" ON categories;
CREATE POLICY "Users can create their own categories"
  ON categories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;
CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE 
  USING (auth.uid() = user_id);

-- Agregar foreign key constraint después de crear la tabla
ALTER TABLE todos 
  DROP CONSTRAINT IF EXISTS todos_category_id_fkey;

ALTER TABLE todos 
  ADD CONSTRAINT todos_category_id_fkey 
  FOREIGN KEY (category_id) 
  REFERENCES categories(id) 
  ON DELETE SET NULL;

-- Agregar constraint para parent_id (subtareas)
ALTER TABLE todos 
  DROP CONSTRAINT IF EXISTS todos_parent_id_fkey;

ALTER TABLE todos 
  ADD CONSTRAINT todos_parent_id_fkey 
  FOREIGN KEY (parent_id) 
  REFERENCES todos(id) 
  ON DELETE CASCADE;

-- ============================================================
-- 3. TABLA USER_PROFILES (Perfil de Usuario)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  theme VARCHAR(20) DEFAULT 'dark',
  notifications_enabled BOOLEAN DEFAULT true,
  email_reminders BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies para user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Función para auto-crear perfil cuando se registra un usuario
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auto-crear perfil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ============================================================
-- 4. TABLA SHARED_TODOS (Compartir Tareas / Colaboración)
-- ============================================================

CREATE TABLE IF NOT EXISTS shared_todos (
  id BIGSERIAL PRIMARY KEY,
  todo_id BIGINT REFERENCES todos(id) ON DELETE CASCADE NOT NULL,
  shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission VARCHAR(10) DEFAULT 'view', -- 'view' or 'edit'
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(todo_id, shared_with)
);

CREATE INDEX IF NOT EXISTS idx_shared_todos_todo ON shared_todos(todo_id);
CREATE INDEX IF NOT EXISTS idx_shared_todos_user ON shared_todos(shared_with);

-- RLS Policies para shared_todos
ALTER TABLE shared_todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tasks shared with them" ON shared_todos;
CREATE POLICY "Users can view tasks shared with them"
  ON shared_todos FOR SELECT 
  USING (auth.uid() = shared_with OR auth.uid() = shared_by);

DROP POLICY IF EXISTS "Owners can share their tasks" ON shared_todos;
CREATE POLICY "Owners can share their tasks"
  ON shared_todos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM todos 
      WHERE id = todo_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Sharers can delete shares" ON shared_todos;
CREATE POLICY "Sharers can delete shares"
  ON shared_todos FOR DELETE
  USING (auth.uid() = shared_by);

-- ============================================================
-- 5. TABLA TODO_ATTACHMENTS (Archivos Adjuntos)
-- ============================================================

CREATE TABLE IF NOT EXISTS todo_attachments (
  id BIGSERIAL PRIMARY KEY,
  todo_id BIGINT REFERENCES todos(id) ON DELETE CASCADE NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_todo ON todo_attachments(todo_id);

-- RLS Policies para todo_attachments
ALTER TABLE todo_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view attachments for their todos" ON todo_attachments;
CREATE POLICY "Users can view attachments for their todos"
  ON todo_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM todos 
      WHERE id = todo_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add attachments to their todos" ON todo_attachments;
CREATE POLICY "Users can add attachments to their todos"
  ON todo_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM todos 
      WHERE id = todo_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete attachments from their todos" ON todo_attachments;
CREATE POLICY "Users can delete attachments from their todos"
  ON todo_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM todos 
      WHERE id = todo_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. ACTUALIZAR RLS POLICIES DE TODOS (para compartir)
-- ============================================================

-- Política para permitir ver tareas compartidas
DROP POLICY IF EXISTS "Users can view shared todos" ON todos;
CREATE POLICY "Users can view shared todos"
  ON todos FOR SELECT
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM shared_todos 
      WHERE todo_id = todos.id AND shared_with = auth.uid()
    )
  );

-- Política para permitir actualizar tareas compartidas con permisos de edición
DROP POLICY IF EXISTS "Users can update shared todos with edit permission" ON todos;
CREATE POLICY "Users can update shared todos with edit permission"
  ON todos FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM shared_todos 
      WHERE todo_id = todos.id 
      AND shared_with = auth.uid() 
      AND permission = 'edit'
    )
  );

-- ============================================================
-- 7. FUNCIONES AUXILIARES
-- ============================================================

-- Función para obtener estadísticas del usuario
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_tasks', COUNT(*),
    'completed_tasks', COUNT(*) FILTER (WHERE completed = true),
    'active_tasks', COUNT(*) FILTER (WHERE completed = false),
    'high_priority', COUNT(*) FILTER (WHERE priority = 'high'),
    'overdue_tasks', COUNT(*) FILTER (WHERE due_date < NOW() AND completed = false)
  )
  INTO stats
  FROM todos
  WHERE user_id = user_uuid;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener tareas con categorías (solo tareas padre, no subtareas)
CREATE OR REPLACE FUNCTION get_todos_with_categories(user_uuid UUID)
RETURNS TABLE (
  id BIGINT,
  text TEXT,
  completed BOOLEAN,
  priority VARCHAR(10),
  due_date TIMESTAMPTZ,
  notes TEXT,
  "position" INTEGER,
  is_subtask BOOLEAN,
  parent_id BIGINT,
  category_id BIGINT,
  category_name VARCHAR(50),
  category_color VARCHAR(7),
  category_icon VARCHAR(10),
  subtasks_count BIGINT,
  completed_subtasks_count BIGINT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.text,
    t.completed,
    t.priority,
    t.due_date,
    t.notes,
    t."position",
    t.is_subtask,
    t.parent_id,
    t.category_id,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon,
    (SELECT COUNT(*) FROM todos WHERE parent_id = t.id AND user_id = user_uuid) as subtasks_count,
    (SELECT COUNT(*) FROM todos WHERE parent_id = t.id AND completed = true AND user_id = user_uuid) as completed_subtasks_count,
    t.created_at
  FROM todos t
  LEFT JOIN categories c ON t.category_id = c.id
  WHERE t.user_id = user_uuid 
    AND (t.parent_id IS NULL OR t.is_subtask = false)  -- Solo tareas padre
  ORDER BY t."position", t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. STORAGE BUCKETS (Para avatares y archivos adjuntos)
-- ============================================================
-- NOTA: Este código debe ejecutarse manualmente o desde el dashboard de Supabase
-- ya que la creación de buckets no se puede hacer siempre desde SQL

-- Para crear los buckets, ve a Storage en el dashboard de Supabase y crea:
-- 1. Bucket 'avatars' (público)
-- 2. Bucket 'attachments' (privado)

-- O ejecuta estos comandos si tienes acceso:
/*
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Políticas de Storage para attachments
CREATE POLICY "Users can view their own attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
*/

-- ============================================================
-- 9. INSERTAR CATEGORÍAS POR DEFECTO (OPCIONAL)
-- ============================================================

-- Esta función crea categorías por defecto para usuarios existentes
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    INSERT INTO categories (user_id, name, color, icon)
    VALUES 
      (user_record.id, 'Personal', '#667eea', '🏠'),
      (user_record.id, 'Trabajo', '#f5576c', '💼'),
      (user_record.id, 'Estudios', '#00f2fe', '📚'),
      (user_record.id, 'Salud', '#4facfe', '🏥')
    ON CONFLICT (user_id, name) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar para crear categorías por defecto (comentado por seguridad)
-- SELECT create_default_categories();

-- ============================================================
-- 10. VERIFICACIÓN Y RESUMEN
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'TaskFlow v2.0 - Migration Completed Successfully!';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas/actualizadas:';
  RAISE NOTICE '  ✓ todos (actualizada con nuevas columnas)';
  RAISE NOTICE '  ✓ categories';
  RAISE NOTICE '  ✓ user_profiles';
  RAISE NOTICE '  ✓ shared_todos';
  RAISE NOTICE '  ✓ todo_attachments';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✓ create_user_profile() + trigger';
  RAISE NOTICE '  ✓ get_user_stats()';
  RAISE NOTICE '  ✓ get_todos_with_categories()';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos pasos:';
  RAISE NOTICE '  1. Crear Storage Buckets: avatars, attachments';
  RAISE NOTICE '  2. Actualizar el código del frontend';
  RAISE NOTICE '  3. Configurar Edge Functions para emails (opcional)';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;
