# Contribuir

## Flujo de trabajo

1. Crea una rama descriptiva a partir de `master`.
2. Mantén los cambios centrados en una única mejora o corrección.
3. No incluyas archivos `.env*`, credenciales, datos personales reales ni documentos de producción.
4. Abre un Pull Request con una descripción del problema, la solución y las validaciones realizadas.

## Desarrollo local

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Validaciones antes de abrir un Pull Request

```bash
pnpm lint
pnpm build
```

Si el cambio modifica la base de datos, incluye la migración correspondiente en `supabase/migrations/` y explica cómo se aplicó y cómo se puede revertir. Revisa especialmente las políticas RLS y las funciones `security definer`.

## Pull Requests

- Describe el comportamiento anterior y el nuevo.
- Añade capturas cuando cambie la interfaz.
- Indica los riesgos de datos, permisos o despliegue.
- No mezcles secretos ni datos reales en el diff.
