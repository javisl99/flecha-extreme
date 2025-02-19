<?php

/**
* NOTA SOBRE LA LICENCIA DE USO DEL SOFTWARE
* 
* El uso de este software está sujeto a las Condiciones de uso de software que
* se incluyen en el paquete en el documento "Aviso Legal.pdf". También puede
* obtener una copia en la siguiente url:
* http://www.redsys.es/wps/portal/redsys/publica/areadeserviciosweb/descargaDeDocumentacionYEjecutables
* 
* Redsys es titular de todos los derechos de propiedad intelectual e industrial
* del software.
* 
* Quedan expresamente prohibidas la reproducción, la distribución y la
* comunicación pública, incluida su modalidad de puesta a disposición con fines
* distintos a los descritos en las Condiciones de uso.
* 
* Redsys se reserva la posibilidad de ejercer las acciones legales que le
* correspondan para hacer valer sus derechos frente a cualquier infracción de
* los derechos de propiedad intelectual y/o industrial.
* 
* Redsys Servicios de Procesamiento, S.L., CIF B85955367
*/

/**
 * Plugin Name: Bizum WooCommerce
 * Plugin URI: http://www.redsys.es
 * Description: Pagar mediante la pasarela de pago Bizum
 * Version: 3.0.3
 * Author: Bizum
 *
 */

add_action( 'init', 'init_bizum' );
add_action( 'plugins_loaded', 'load_bizum' );

function init_bizum() {
    load_plugin_textdomain( "bizum", false, dirname( plugin_basename( __FILE__ ) ));
}

function load_bizum() {
    if ( !class_exists( 'WC_Payment_Gateway' ) ) 
        exit;

    include_once ('wc-bizum.php');
	
    add_filter( 'woocommerce_payment_gateways', 'anadir_pago_woocommerce_bizum' );
}

function anadir_pago_woocommerce_bizum($methods) {
    $methods[] = 'WC_Bizum';
    return $methods;
}