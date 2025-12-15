-- ============================================================
-- DIAGNÓSTICO Y CORRECCIÓN DE SIGNUP
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. VERIFICAR SI EL TRIGGER EXISTE
SELECT 
  tgname as trigger_name,
  tgtype as trigger_type,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Si no aparece, el trigger no existe

-- ============================================================
-- 2. ELIMINAR Y RECREAR LA FUNCIÓN Y EL TRIGGER
-- ============================================================

-- Eliminar trigger existente (si existe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Eliminar función existente (si existe)
DROP FUNCTION IF EXISTS create_user_profile() CASCADE;

-- Recrear función con manejo de errores
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(SPLIT_PART(NEW.email, '@', 1), 'Usuario'))
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error pero no falla el signup
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recrear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_user_profile();

-- ============================================================
-- 3. VERIFICAR POLÍTICAS RLS DE user_profiles
-- ============================================================

-- Deshabilitar RLS temporalmente para diagnóstico
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- O asegurarse de que las políticas permitan INSERT
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- También permitir que la función DEFINER haga inserts
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;
CREATE POLICY "Service role can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 4. VERIFICAR QUE LA TABLA EXISTE
-- ============================================================

-- Debe retornar la estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- ============================================================
-- 5. PROBAR MANUALMENTE LA FUNCIÓN
-- ============================================================

-- Crear un usuario de prueba manualmente
-- (Reemplaza con un email real que NO exista)
/*
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);
*/

-- ============================================================
-- 6. VER LOGS DE ERRORES (SI HAY)
-- ============================================================

-- Ver últimos errores en la función
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%create_user_profile%' 
ORDER BY calls DESC 
LIMIT 5;

-- ============================================================
-- 7. SOLUCIÓN ALTERNATIVA: RLS MÁS PERMISIVO
-- ============================================================

-- Si nada funciona, temporalmente permitir todos los inserts
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Después de probar que funciona, re-habilitar:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. VERIFICAR RESULTADO
-- ============================================================

-- Después de ejecutar lo anterior, intenta crear un usuario
-- desde la app y luego verifica:
SELECT id, display_name, created_at 
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================================
-- RESUMEN DE COMANDOS MÍNIMOS NECESARIOS
-- ============================================================

/*
-- Ejecutar estos 3 comandos en orden:

-- 1. Recrear función
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(SPLIT_PART(NEW.email, '@', 1), 'Usuario'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creating profile: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 2. Recrear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();

-- 3. Agregar política permisiva
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;
CREATE POLICY "Service role can insert profiles"
  ON user_profiles FOR INSERT WITH CHECK (true);
*/
