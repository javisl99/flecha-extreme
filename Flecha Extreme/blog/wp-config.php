<?php
/** 
 * Configuración básica de WordPress.
 *
 * Este archivo contiene las siguientes configuraciones: ajustes de MySQL, prefijo de tablas,
 * claves secretas, idioma de WordPress y ABSPATH. Para obtener más información,
 * visita la página del Codex{@link http://codex.wordpress.org/Editing_wp-config.php Editing
 * wp-config.php} . Los ajustes de MySQL te los proporcionará tu proveedor de alojamiento web.
 *
 * This file is used by the wp-config.php creation script during the
 * installation. You don't have to use the web site, you can just copy this file
 * to "wp-config.php" and fill in the values.
 *
 * @package WordPress
 */
// ** Ajustes de MySQL. Solicita estos datos a tu proveedor de alojamiento web. ** //
/** El nombre de tu base de datos de WordPress */
define('WP_CACHE', true); //Added by WP-Cache Manager
define( 'WPCACHEHOME', '/homepages/0/d319165250/htdocs/Flecha Extreme/blog/wp-content/plugins/wp-super-cache/' ); //Added by WP-Cache Manager
define('DB_NAME', 'db661771367');
/** Tu nombre de usuario de MySQL */
define('DB_USER', 'dbo661771367');
/** Tu contraseña de MySQL */
define('DB_PASSWORD', '0091Robe');
/** Host de MySQL (es muy probable que no necesites cambiarlo) */
define('DB_HOST', 'db661771367.db.1and1.com');
/** Codificación de caracteres para la base de datos. */
define('DB_CHARSET', 'utf8mb4');
/** Cotejamiento de la base de datos. No lo modifiques si tienes dudas. */
define('DB_COLLATE', '');
/**#@+
 * Claves únicas de autentificación.
 *
 * Define cada clave secreta con una frase aleatoria distinta.
 * Puedes generarlas usando el {@link https://api.wordpress.org/secret-key/1.1/salt/ servicio de claves secretas de WordPress}
 * Puedes cambiar las claves en cualquier momento para invalidar todas las cookies existentes. Esto forzará a todos los usuarios a volver a hacer login.
 *
 * @since 2.6.0
 */
define('AUTH_KEY', ']hd!u4E_+fh_rL3Z(1[`$m(Fw5]rSzKLCq!x{#H~>~e2]JB5/t1?d_5<xli/?B~Q');
define('SECURE_AUTH_KEY', 'AMkv7=o3&fg5PJ}{%8AdCh8RLwU<_|DKyps^D _#au+I_Z-~K1[*oZYse<6TJ{Gx');
define('LOGGED_IN_KEY', 'KO![T0Hl.-P!#Z`-PbWwKF ICcR0jd3?;V^C1K|#w0Qd`3+U^Pr,yY>?^XZIAc:K');
define('NONCE_KEY', 'm6+@&(/9C!cm;Qn[w7-k6M)h|>)#vfM/Y&z8s5t/8Sg~=f)LHWY}&Sq!MYV{]Z}.');
define('AUTH_SALT', 'd`^,)6~cw-vuHJ^fe[2kJrv{<wbz$(wNqI$dS9JQe:]Z&U/;NVon4OndM919O=1x');
define('SECURE_AUTH_SALT', 'Lt]]^-3JJ~z2tp@0gk[rft*l%r>cN[aFJY4I~2kO(]_,]xf28|VVkDP:t2=H^[b7');
define('LOGGED_IN_SALT', ':Z5W_Si@ISTS3!`<N6E5_x*Z-uieUJISQwO>O{NVw(Z*3L;RIji3!r&GgpqVZ@w3');
define('NONCE_SALT', 'Jin(n}cZf~7BwoVp|}l+_!NYpJ%?r7wz:Sle>pyX}PEigVn/k6ob.3 ^SN`!@-bQ');
/**#@-*/
/**
 * Prefijo de la base de datos de WordPress.
 *
 * Cambia el prefijo si deseas instalar multiples blogs en una sola base de datos.
 * Emplea solo números, letras y guión bajo.
 */
$table_prefix  = 'wp_';
/**
 * Para desarrolladores: modo debug de WordPress.
 *
 * Cambia esto a true para activar la muestra de avisos durante el desarrollo.
 * Se recomienda encarecidamente a los desarrolladores de temas y plugins que usen WP_DEBUG
 * en sus entornos de desarrollo.
 */
define('WP_DEBUG', false);
/* ¡Eso es todo, deja de editar! Feliz blogging */
/** WordPress absolute path to the Wordpress directory. */
if ( !defined('ABSPATH') )
	define('ABSPATH', dirname(__FILE__) . '/');
/** Sets up WordPress vars and included files. */
require_once(ABSPATH . 'wp-settings.php');
