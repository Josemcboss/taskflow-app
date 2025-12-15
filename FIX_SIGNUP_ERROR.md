# 🔧 Solución al Error 500 en Signup

## ❌ Problema
Cuando un usuario intenta registrarse, aparece:
```
POST https://xxxxx.supabase.co/auth/v1/signup 500 (Internal Server Error)
```

## 🔍 Causa
El trigger que crea automáticamente el perfil del usuario no se ejecutó correctamente o tiene problemas de permisos.

## ✅ Solución Rápida (3 pasos)

### Paso 1: Abrir Supabase SQL Editor
1. Ve a tu proyecto en [app.supabase.com](https://app.supabase.com)
2. Clic en **SQL Editor** en el menú izquierdo
3. Clic en **New query**

### Paso 2: Ejecutar Script de Corrección
Copia y pega este código completo y ejecuta:

```sql
-- 1. Recrear función con manejo de errores
DROP FUNCTION IF EXISTS create_user_profile() CASCADE;

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

-- 3. Agregar política permisiva para la función
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;
CREATE POLICY "Service role can insert profiles"
  ON user_profiles FOR INSERT 
  WITH CHECK (true);

-- 4. Verificar que funciona
SELECT 'Trigger recreado exitosamente' as status;
```

### Paso 3: Probar Registro
1. Vuelve a tu aplicación
2. Intenta registrar un nuevo usuario
3. Debería funcionar correctamente

---

## 🔍 Diagnóstico Avanzado

Si el problema persiste, ejecuta estos comandos para diagnosticar:

### Verificar si el trigger existe:
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```
**Resultado esperado:** Debe mostrar 1 fila con `tgenabled = 'O'`

### Verificar estructura de user_profiles:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles';
```
**Resultado esperado:** Debe mostrar columnas: id, display_name, avatar_url, etc.

### Verificar políticas RLS:
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles';
```
**Resultado esperado:** Debe mostrar 4 políticas (SELECT, UPDATE, INSERT x2)

---

## 🆘 Solución de Emergencia

Si NADA funciona, desactiva temporalmente RLS:

```sql
-- ⚠️ SOLO PARA DESARROLLO/PRUEBAS
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
```

Prueba el registro. Si funciona, significa que el problema son las políticas RLS.

Para re-habilitarlo después:
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

---

## 📝 Verificar Resultado

Después de ejecutar la solución, verifica que el perfil se creó:

```sql
SELECT id, display_name, created_at 
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;
```

Deberías ver el nuevo usuario registrado.

---

## 🎯 Resumen

| Problema | Solución |
|----------|----------|
| Trigger no existe | Recrear con script del Paso 2 |
| Permisos insuficientes | Agregar política "Service role can insert" |
| RLS muy restrictivo | Política permisiva para función DEFINER |

---

## 📚 Archivos de Referencia

- **Script completo:** [002_fix_signup_trigger.sql](../supabase/migrations/002_fix_signup_trigger.sql)
- **Script original:** [001_taskflow_v2_schema.sql](../supabase/migrations/001_taskflow_v2_schema.sql)

---

**Después de aplicar la solución, el registro debería funcionar perfectamente! ✅**
