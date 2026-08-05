# Política de seguridad

## Informar de una vulnerabilidad

No publiques credenciales, datos personales ni detalles explotables en un issue público.

Para informar de una vulnerabilidad, utiliza la opción de reporte privado de vulnerabilidades de GitHub en la pestaña **Security** del repositorio. Si esa opción no está disponible, contacta con el propietario del repositorio mediante su perfil de GitHub e indica que se trata de un reporte de seguridad.

Incluye, cuando sea posible:

- una descripción clara del impacto;
- los pasos mínimos para reproducirlo;
- las rutas, archivos o componentes afectados;
- cualquier condición previa necesaria;
- una propuesta de mitigación, si la tienes.

## Credenciales y datos

No incluyas valores de `.env.local`, tokens, claves privadas, datos reales de clientes o empleados, documentos ni información de pagos en issues, Pull Requests o commits.

Si una credencial se ha publicado por error, revócala o rótala inmediatamente y avisa en el reporte privado. Eliminarla del último commit no la invalida.

## Versiones soportadas

La rama `master` es la referencia principal del proyecto. Las correcciones de seguridad se priorizarán sobre esa rama.
