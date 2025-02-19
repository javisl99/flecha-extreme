<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'dbs1287434' );

/** MySQL database username */
define( 'DB_USER', 'dbu283464' );

/** MySQL database password */
define( 'DB_PASSWORD', '0091Robe*#' );

/** MySQL hostname */
define( 'DB_HOST', 'db5001539853.hosting-data.io' );

/** Database Charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The Database Collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY',         '}f}-8&c:+&hVzlK>~7BFU{xlPl@5K 1V)w(Jym6Ps*mO<Z#^MgRQ$7Z=al;Czi/3');
define('SECURE_AUTH_KEY',  ';`Hql<zLNG~y -Y>o<huMfhucwkt;U7l 77X?j3-tkk,`iHI2rhbjZdh*MN2u~aT');
define('LOGGED_IN_KEY',    'r4 Nk?nbNy8%u5P!D17nhgT!B:])JSl<vBLWAX68_GSp;JQcy,7_@=9|yM-YW,0&');
define('NONCE_KEY',        '.XP|rM]vV_+R/-zzT;O&GL(fwK/+le+e|5L@*4$]n~:[60ADJ1+a2b6!*YT!e%LO');
define('AUTH_SALT',        'g:C5xIDoY<2v}^S3n;@%}1pN7H(`u$):Xz+02.YFNxdxF0:f]hJsa431?+QW^RBK');
define('SECURE_AUTH_SALT', ',nFCxrZ!TOX8*F3`VCN J4qf|m0~ZZ/b8 iSMvRC}BDc%|rw<+C/P<o#a,eYf04T');
define('LOGGED_IN_SALT',   'eFn-bSIHVC*y]:i?+tj(A6qq>6d:w/kk_/]I!--8%5~XFZJ+i_=buC|^|9J=LT&D');
define('NONCE_SALT',       'ESoqY<i^)OU10x(v-G1vsZG8TOn<<sh}q5X=0omz6Qm-UJT]>Ta;y(um8m+e-9{r');

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
define( 'WP_DEBUG', false );

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
