<?php
/**
 * The template for displaying the header
 *
 * Displays all of the head element and everything up until the "site-content" div.
 *
 * @package WordPress
 * @subpackage Twenty_Fifteen
 * @since Twenty Fifteen 1.0
 */
?><!DOCTYPE html>
<html <?php language_attributes(); ?> class="no-js">
<head>
<base href="http://www.flechaextreme.com" />
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<!--favicon-->
<link rel="apple-touch-icon" sizes="57x57" href="/flechaextreme/favicon/apple-icon-57x57.png">
<link rel="apple-touch-icon" sizes="60x60" href="/flechaextreme/favicon/apple-icon-60x60.png">
<link rel="apple-touch-icon" sizes="72x72" href="/flechaextreme/favicon/apple-icon-72x72.png">
<link rel="apple-touch-icon" sizes="76x76" href="/flechaextreme/favicon/apple-icon-76x76.png">
<link rel="apple-touch-icon" sizes="114x114" href="/flechaextreme/favicon/apple-icon-114x114.png">
<link rel="apple-touch-icon" sizes="120x120" href="/flechaextreme/favicon/apple-icon-120x120.png">
<link rel="apple-touch-icon" sizes="144x144" href="/flechaextreme/favicon/apple-icon-144x144.png">
<link rel="apple-touch-icon" sizes="152x152" href="/flechaextreme/favicon/apple-icon-152x152.png">
<link rel="apple-touch-icon" sizes="180x180" href="/flechaextreme/favicon/apple-icon-180x180.png">
<link rel="icon" type="image/png" sizes="192x192"  href="/flechaextreme/favicon/android-icon-192x192.png">
<link rel="icon" type="image/png" sizes="32x32" href="/flechaextreme/favicon/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="96x96" href="/flechaextreme/favicon/favicon-96x96.png">
<link rel="icon" type="image/png" sizes="16x16" href="/flechaextreme/favicon/favicon-16x16.png">
<link rel="manifest" href="/manifest.json">
<meta name="msapplication-TileColor" content="#ffffff">
<meta name="msapplication-TileImage" content="/ms-icon-144x144.png">
<meta name="theme-color" content="#ffffff">
<!--end Favicon-->
<title>Flecha Extreme. Kitesurf-Paddle SUP-Kayak-Campamentos</title>

<!-- Styles CSS-->
<link href="<?php bloginfo( 'stylesheet_url' ); ?>" rel="stylesheet" media="all" type="text/css" />
<link href="css/stylefx.css" rel="stylesheet" type="text/css">
<link href="css/logoblog.css" rel="stylesheet" type="text/css">
<link href="https://fonts.googleapis.com/css?family=Gloria+Hallelujah" rel="stylesheet">
<link href="css/bootstrap.css" rel="stylesheet" type="text/css" />
<!-- End Styles CSS-->
<meta name="Escuela de Kitesurf, Surf, Paddle y Kaykak Huelva" content="Cursos de kitesurf Huelva. Cursos de Surf. Campamentos Infantiles. Kayak" />
<meta name="Keywords" content="cursos de kitesurf huelva-kitesurf Huelva-kitesurf el portil-cursos de surf-escuela de surf-campamentos infantiles huelva-surf camps Huelva-campamento de surf huelva- rutas de kayak-paseos en kayak huelva-Alquiler de Kayaks-kitesurf el rompido-cursos de paddle huelva- alquiler de paddle huelva- el portil-huelva-escuela de surf el rompido-kayak el rompido-piragüismo-canoas huelva" />
<meta name="Description" content="Escuela de Kitesurf, Paddle, Surf, Kayak y Campamentos Infantiles en El Portil, Huelva. Aprende kitesurf, surf y paddle, realiza nuestras rutas y paseos en Kayak. Campamentos" />

	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width">
	<link rel="profile" href="http://gmpg.org/xfn/11">
	<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>">
	<!--[if lt IE 9]>
	<script src="<?php echo esc_url( get_template_directory_uri() ); ?>/js/html5.js"></script>
	<![endif]-->
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<header>
    <nav class="navbar navbar-default navbar-fixed-top">
  <div class="container">
    <input type="checkbox" id="navbar-toggle-cbox">
    <div class="navbar-header">
      <label for="navbar-toggle-cbox" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
      </label>
      <a class="logoblog" href="#"><span class="ico icoicono-logo"></span></a>
    </div>
    <div id="navbar" class="navbar-collapse collapse">
      <ul class="nav navbar-nav">
        		<li><a href="index.html"><span class="ico icoicono-logo-chico"></span> INICIO</a></li>
                <li><a class="" href="kitesurf.html"><span class="ico icoicono-kite"></span> KITE</a></li>
                <li><a href="kayaks.html"><span class="ico icoicono-kayak"></span> KAYAK</a></li>  
                <li><a href="paddle.html"><span class="ico icoicono-paddle"></span> PADDLE</a></li> 
                <li><a href="surf.html"><span class="ico icoicono-surf"></span> SURF</a></li>
                <li><a href="camps.html"><span class="ico icocamp"></span> CAMPS</a></li> 
                <li><a href="regala.html"><span class="icon icogift"></span> REGALA</a></li>
                <li><a href="mapa.html"><span class="ico icolocation"></span> MAPA</a></li>
                <li><a href="reservas.html"><span class="ico icomail"></span> RESERVA</a></li>
                <li><a href="indexen.html">HELLO!</a></li>
      </ul>
    </div>
  </div>
</nav>
  <div id="fondohead" class="hidem"></div>
</header>

<div id="page" class="hfeed site">
	<a class="skip-link screen-reader-text" href="#content"><?php _e( 'Skip to content', 'twentyfifteen' ); ?></a>

	<div id="sidebar" class="sidebar">
		<header id="masthead" class="site-header" role="banner">
			<div class="site-branding">
				<?php
					twentyfifteen_the_custom_logo();

					if ( is_front_page() && is_home() ) : ?>
						<h1 class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></h1>
					<?php else : ?>
						<p class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></p>
					<?php endif;

					$description = get_bloginfo( 'description', 'display' );
					if ( $description || is_customize_preview() ) : ?>
						<p class="site-description"><?php echo $description; ?></p>
					<?php endif;
				?>
				<button class="secondary-toggle"><?php _e( 'Menu and widgets', 'twentyfifteen' ); ?></button>
			</div><!-- .site-branding -->
		</header><!-- .site-header -->

		<?php get_sidebar(); ?>
	</div><!-- .sidebar -->

	<div id="content" class="site-content">
