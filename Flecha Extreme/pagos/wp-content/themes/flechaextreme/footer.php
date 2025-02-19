<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the #content div and all content after
 *
 * @package WordPress
 * @subpackage Twenty_Sixteen
 * @since Twenty Sixteen 1.0
 */
?>

		</div><!-- .site-content -->

		<footer id="colophon" class="site-footer" role="contentinfo">
		

			<?php if ( has_nav_menu( 'primary' ) ) : ?>
				<nav class="main-navigation" role="navigation" aria-label="<?php esc_attr_e( 'Footer Primary Menu', 'twentysixteen' ); ?>">
					<?php
						wp_nav_menu( array(
							'theme_location' => 'primary',
							'menu_class'     => 'primary-menu',
						 ) );
					?>
				</nav><!-- .main-navigation -->
			<?php endif; ?>

			<?php if ( has_nav_menu( 'social' ) ) : ?>
				<nav class="social-navigation" role="navigation" aria-label="<?php esc_attr_e( 'Footer Social Links Menu', 'twentysixteen' ); ?>">
					<?php
						wp_nav_menu( array(
							'theme_location' => 'social',
							'menu_class'     => 'social-links-menu',
							'depth'          => 1,
							'link_before'    => '<span class="screen-reader-text">',
							'link_after'     => '</span>',
						) );
					?>
				</nav><!-- .social-navigation -->
			<?php endif; ?>


<div class="hidel col-xs-12 col-sm-12 col-md-12 col-lg-12">
<img class="img-responsive al-center" src="images/footer/plano.jpg" width="332" height="277" alt="localizacion escuela de kitesurf, paddle, kayaks y campamentos" />
</div>



<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">
  <div id="subfooter" class="hidem">
    	<div class="hidemap col-xs-12 col-sm-4 col-md-4 col-lg-4">
    	<img class="img-responsive" src="https://www.flechaextreme.com/images/footer/plano.jpg" width="335" alt="localizacion escuela de kitesurf, paddle, kayaks y campamentos" />
        </div>
       
        <div class="pad-subfooter40 col-xs-12 col-sm-7 col-md-7 col-lg-7">
        	<div class="col-xs-3 col-sm-3 col-md-3 col-lg-3">
            <a class="grey" href="https://www.facebook.com/flechaextreme" target="_new"><span class="ico icofacebook"></span></a>
            </div>
            <div class="col-xs-3 col-sm-3 col-md-3 col-lg-3">
            <a class="grey" href="http://instagram.com/flechaextreme?ref=badge" target="_new"><span class="ico icoinstagram"></span></a></div>
            <div class="col-xs-3 col-sm-3 col-md-3 col-lg-3">
            <a class="grey" href="https://twitter.com/Flecha_Extreme" target="_new"><span class="ico icotwitter"></span></a>
            </div>
            <div class="col-xs-3 col-sm-3 col-md-3 col-lg-3">
            <a class="grey " href="https://www.youtube.com/channel/UCrssIMcm70vMlBoICGUabhw" target="_new"><span class="ico icoyoutube"></span></a>
            </div>
         </div>
         
         
        
         <div class="pad-subfooter40 col-xs-12 col-sm-7 col-md-7 col-lg-7">
        <h2><span class="text-white"><strong>¡Ven a divertirte con nosotros!</strong></h2>Estamos en El Portil, Huelva en un enclave conocido como "La Flecha". Es un paraiso natural, solo accesible en barco, que reune las condiciones perfectas para nuestras actividades.<strong> Kitesurf, Paddle SUP, Surf, Kayak, Vela Ligera, Campamentos infantiles</strong>...tu elijes. <br />
  <br />
        
<table width="100%" border="0">
    <tr>
        <th scope="col">CALIDAD</th>
        <th class="text-white" scope="col">CONDICIONES</th>
        <th scope="col">COMPROMISO</th>
        <th class="text-white" scope="col">SEGURIDAD</th>
    
  	</tr>
	</table>
   	</div>
        
  </div>
</div>
   


<!-- pie large-->
<div class="col-xs-12 col-sm-12col-md-12 col-lg-12">
  <div id="pie">
    <div id="menupie" class="hidem">
    	<div class="col-xs-7 col-sm-7 col-md-8 col-lg-8">
        	<div class="interlinelist blond col-xs-6 col-sm-6 col-md-6 col-lg-6">
            	<div class="columpie">
                     <a class="blond" href="kitesurf.html" target="_self">KITESURF</a><br />
                     <a class="blond" href="kayaks.html" target="_self">KAYAK</a><br />
                     <a class="blond" href="paddle.html" target="_self">PADDLE</a><br />
                     <a class="blond" href="surf.html" target="_self">SURF</a><br />         
                     <a class="blond" href="camps.html" target="_self">CAMPS</a><br />
                </div>
            </div>
            <div class="interlinelist col-xs-6 col-sm-6 col-md-6 col-lg-6">
                <div class="columpie">
                 <a class="blond" href="reservas.html" target="_self">CONTACTO</a><br />
                 <a class="blond" href="mapa.html" target="_self">MAPA</a><br />
                 <a class="blond" href="kitesurf" target="_self">BLOGGER</a><br />
                 <a class="blond" href="https://www.windguru.cz/48747" target="new">PREVISION</a><br />         
                 <a class="blond" href="https://www.robertoriccidesigns.com/" target="new">RRD</a><br />
                </div>
            </div>
        </div>
        <div class="col-xs-5 col-sm-5 col-md-4 col-lg-4">
        	<div class="columpie-d">
            <img src="https://www.flechaextreme.com/images/iconos/Logo center. kitesurf huelva.png" width="111" height="50" alt="logo escuela kitesurf paddle kayak" /><br /><br />
<span class="siguenos">
¡SÍGUENOS!<br /></span>



<a class="white" href="https://www.facebook.com/flechaextreme" target="_new"><span class="ico icofacebook2"></span></a>
<a class="white" href="https://instagram.com/flechaextreme?ref=badge" target="_new"><span class="ico icoinstagram2"></span></a>
<a class="white" href="https://twitter.com/Flecha_Extreme" target="_new"><span class="ico icotwitter2"></span></a>
<a class="white" href="https://www.youtube.com/channel/UCrssIMcm70vMlBoICGUabhw" target="_new"><span class="ico icoyoutube2"></span></a>

            </div>
      </div>
    </div>


<div class="hidel col-xs-12 col-sm-12">
	
	<div class="col-xs-4 col-sm-4">
        <div id="logopiexs">
        <img src="https://www.flechaextreme.com/images/iconos/icono. kitesurf huelva.png" width="53" height="55" alt="logo. centro de actividades náuticas" />
        </div>
    </div>

	<div class="col-xs-8 col-sm-8">
    	<div id="contpiexs">
       ¡SÍGUENOS!<br />
<div id="socialpiemovil">
<a class="white" href="https://www.facebook.com/flechaextreme" target="_new"><span class="ico icofacebook2"></span></a>
<a class="white" href="https://instagram.com/flechaextreme?ref=badge" target="_new"><span class="ico icoinstagram2"></span></a>
<a class="white" href="https://twitter.com/Flecha_Extreme" target="_new"><span class="ico icotwitter2"></span></a>
<a class="white" href="https://www.youtube.com/channel/UCrssIMcm70vMlBoICGUabhw" target="_new"><span class="ico icoyoutube2"></span></a>
</div>
         </div>
    </div>
    <div class="col-xs-12 col-sm-12">
	<div id="lastfoot">
&copy;Flecha Extreme 2017 By RoBe
    </div>
    
</div>

</div>

  </div>	
</div>
<!--End pie large--></footer><!-- .site-footer -->
	</div><!-- .site-inner -->
</div><!-- .site -->


<?php wp_footer(); ?>
</body>
</html>
