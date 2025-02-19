<?php
/**
 * The template for displaying the header
 *
 * Displays all of the head element and everything up until the "site-content" div.
 *
 * @package WordPress
 * @subpackage Twenty_Sixteen
 * @since Twenty Sixteen 1.0
 */

?><!DOCTYPE html>
<html <?php language_attributes(); ?> class="no-js">
<head>
<!--favicon-->
<link rel="apple-touch-icon" sizes="57x57" href="/favicon/apple-icon-57x57.png">
<link rel="apple-touch-icon" sizes="60x60" href="/favicon/apple-icon-60x60.png">
<link rel="apple-touch-icon" sizes="72x72" href="/favicon/apple-icon-72x72.png">
<link rel="apple-touch-icon" sizes="76x76" href="/favicon/apple-icon-76x76.png">
<link rel="apple-touch-icon" sizes="114x114" href="/favicon/apple-icon-114x114.png">
<link rel="apple-touch-icon" sizes="120x120" href="/favicon/apple-icon-120x120.png">
<link rel="apple-touch-icon" sizes="144x144" href="/favicon/apple-icon-144x144.png">
<link rel="apple-touch-icon" sizes="152x152" href="/favicon/apple-icon-152x152.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-icon-180x180.png">
<link rel="icon" type="image/png" sizes="192x192"  href="/favicon/android-icon-192x192.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon/favicon-96x96.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png">
<link rel="manifest" href="/manifest.json">
<meta name="msapplication-TileColor" content="#ffffff">
<meta name="msapplication-TileImage" content="/ms-icon-144x144.png">
<meta name="theme-color" content="#ffffff">
<!--end Favicon-->
<base href="http://www.flechaextreme.com" />
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<title>Flecha Extreme. Kitesurf-Paddle SUP-Kayak-Campamentos</title>

<!-- Styles CSS-->
<link href="<?php bloginfo( 'stylesheet_url' ); ?>" rel="stylesheet" media="all" type="text/css" />
<link href="https://www.flechaextreme.com/css/stylefx" rel="stylesheet" type="text/css">
<link href="https://www.flechaextreme.com/css/logoblog.css" rel="stylesheet" type="text/css">
<link href="https://fonts.googleapis.com/css?family=Gloria+Hallelujah" rel="stylesheet">
<link href="https://www.flechaextreme.com/css/bootstrap.css" rel="stylesheet" type="text/css" />
<!-- End Styles CSS-->
<meta name="Blog de Flecha Extreme. Kitesurf-Paddle-Surf-Kayak" />
<meta name="Keywords" content="kitesurf, paddle SUP, Surf, Kayak, Alquiler de barcos, Actividades infantiles, Campamentos niños " />
<meta name="Description" content="Información sobre el mundo del Kitesurf, Surf, Kayak y Paddle SUP del Centro de Actividades Náuticas Flecha Extreme" />
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="http://gmpg.org/xfn/11">
	<?php if ( is_singular() && pings_open( get_queried_object() ) ) : ?>
	<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>">
	<?php endif; ?>
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
      <a class="logoblog hidelogo" href="#"><span class="ico icoicono-logo "></span></a>
    </div>
	
    <div id="navbar" class="navbar-collapse collapse">
      <ul class="nav navbar-nav">
	  
	 			
        		<li><a href="index.html"><span class="ico icoicono-logo-chico"></span> INICIO</a></li>
                <li><a class="" href="kitesurf.html"><span class="ico icoicono-kite"></span> KITE</a></li>
                <li><a href="kayaks.html"><span class="ico icoicono-kayak"></span> KAYAK</a></li>  
                <li><a href="paddle.html"><span class="ico icoicono-paddle"></span> PADDLE</a></li> 
				<li><a href="paddle.html"><span class="boat boatboat"></span> BARCOS</a></li>
				<li><a href="paddle.html"><span class="icono icolifebuoy"></span> PARKING</a></li>
				<li><a href="paddle.html"><span class="icono icocart"></span> TIENDA</a></li>
                <li><a href="surf.html"><span class="surf surf-icosurf"></span> SURF</a></li>
                <li><a href="camps.html"><span class="ico icocamp"></span> CAMPS</a></li> 
                <li><a href="regala.html"><span class="icon icogift"></span> REGALA</a></li>
                <li><a href="mapa.html"><span class="ico icolocation"></span> MAPA</a></li>
                <li><a href="reservas.html"><span class="ico icomail"></span> RESERVA</a></li>
                <li><a href="http://www.flechaextreme.com/blog" title="Blog" target="_self"><span class="surf surf-pencil2"></span> BLOG</a></li>
                <li><a href="meteo/index.htm"><span class="cuadrado"> METEO</span></a></li>
                
      </ul>
    </div>
  </div>
</nav>
<div id="page" class="site">
	<div class="site-inner">
		<a class="skip-link screen-reader-text" href="#content"><?php _e( 'Skip to content', 'twentysixteen' ); ?></a>

		<!-- .site-header -->

		<div id="content" class="site-content">
