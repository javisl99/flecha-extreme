# Flecha Extreme

Aplicación web de gestión back-office para organizar reservas, clientes, actividades, empleados, parking, pagos, contabilidad, documentos y tienda.

## Demo pública

La ruta `/demo` ofrece un recorrido interactivo por dashboard, reservas, clientes y pagos con datos completamente ficticios. La demostración mantiene su estado únicamente en memoria, se reinicia al recargar y no monta la sesión de usuario ni realiza consultas de negocio contra Supabase.

Desde la pantalla de acceso se puede entrar mediante **Probar demo con datos ficticios**, sin publicar credenciales ni conceder acceso a la base de datos real.

## Stack

- Next.js 16 y React 19
- TypeScript
- Supabase para autenticación y persistencia
- Tailwind CSS
- Resend y React Email para el envío de correos
- pnpm como gestor de paquetes

## Puesta en marcha

Requisitos: Node.js 22 o superior y pnpm 10.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

Antes de iniciar sesión, completa `.env.local` con las variables del proyecto de Supabase. El envío de correo está desactivado por defecto en el ejemplo.

## Variables de entorno

Consulta [.env.example](./.env.example). Nunca subas `.env.local`, claves de API, credenciales de Supabase con privilegios elevados ni claves privadas al repositorio.

La clave `NEXT_PUBLIC_SUPABASE_ANON_KEY` se utiliza desde el navegador; la protección real de los datos depende de las políticas RLS y de los permisos definidos en `supabase/migrations/`.

## Comandos útiles

```bash
pnpm dev
pnpm lint
pnpm build
pnpm start
```

## Base de datos

Las migraciones están en `supabase/migrations/`. Los scripts de `supabase/manual/` son operaciones explícitas para tareas puntuales y deben revisarse antes de ejecutarse en un entorno compartido o de producción.

## Contribuir

Consulta [CONTRIBUTING.md](./CONTRIBUTING.md) para el flujo de ramas, validaciones y Pull Requests.

## Seguridad

Consulta [SECURITY.md](./SECURITY.md) para informar de vulnerabilidades sin publicarlas en un issue.
