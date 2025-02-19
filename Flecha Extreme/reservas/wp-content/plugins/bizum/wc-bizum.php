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

if(!function_exists("escribirLog")) {
	require_once('apiRedsys/redsysLibrary.php');
}
if(!class_exists("RedsysAPI")) {
	require_once('apiRedsys/apiRedsysFinal.php');
}

 
class WC_Bizum extends WC_Payment_Gateway {

	var $notify_url;
			/**
			 * Constructor for the gateway.
			 */
	public function __construct() {
		$this->id                 = 'bizum';
		$this->icon               = plugins_url() . '/bizum/pages/assets/images/Bizum.png';
		$this->method_title       = __( 'Pago con BIZUM', 'woocommerce' );
		$this->method_description = __( 'Esta es la opción de la pasarela de pago de Bizum.', 'woocommerce' );
		$this ->notify_url		  = add_query_arg( 'wc-api', 'WC_bizum', home_url( '/' ) );
		$this->log  			  =  new WC_Logger();
		$this->idLog 			  = generateIdLog();

		$this->has_fields         = false;

		// Load the settings
		$this->init_form_fields();
		$this->init_settings();

		$this->title 			  = $this->get_option( 'title' );
		$this->description        = $this->get_option( 'description' );
				
		// Get settings
		$this->entorno      	  = $this->get_option( 'entorno' );
		$this->nombre       	  = $this->get_option( 'name' );
		$this->fuc 				  = $this->get_option( 'fuc' );
		$this->clave256  		  = $this->get_option( 'clave256' );
		$this->terminal    		  = $this->get_option( 'terminal' );
		$this->moneda  			  = $this->get_option( 'moneda' );
		//$this->trans 			  = $this->get_option( 'trans' );
		$this->activar_log		  = $this->get_option( 'activar_log' );
		$this->estado	  		  = $this->get_option( 'estado' );
		$this->idioma	  		  = $this->get_option( 'idioma' );


		// Actions
		add_action( 'woocommerce_receipt_bizum', array( $this, 'receipt_page' ) );
		add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
		//Payment listener/API hook
		add_action( 'woocommerce_api_wc_bizum', array( $this, 'check_rds_response' ) );
	}

			/**
			 * Initialise Gateway Settings Form Fields
			 */
	public function init_form_fields() {
		global $woocommerce;

		$this->form_fields = array(
			'enabled' => array(
				'title'       => __( 'Activar Bizum:', 'woocommerce' ),
				'label'       => __( 'Activar pago Bizum', 'woocommerce' ),
				'type'        => 'checkbox',
				'description' => '',
				'default'     => 'yes'
			),
			'title' => array(
				'title'       => __( 'Título', 'woocommerce' ),
				'type'        => 'text',
				'description' => __( 'Payment method description that the customer will see on your checkout.', 'woocommerce' ),
				'default'     => __( 'BIZUM', 'woocommerce' ),
				'desc_tip'    => true,
			),
			'description' => array(
				'title'       => __( 'Descripción', 'woocommerce' ),
				'type'        => 'textarea',
				'description' => __( 'Payment method description that the customer will see on your website.', 'woocommerce' ),
				'default'     => __( 'Esta es la opción de pago de Bizum! Le ayudamos en todo lo que necesite desde nuestra página web <b>www.bizum.es</b>.', 'woocommerce' ),
				'desc_tip'    => true,
			),
			'entorno' => array(
				'title'       => __( 'Entorno de Bizum', 'woocommerce' ),
				'type'        => 'select',
				'description' => __( 'Entorno del proceso de pago.', 'woocommerce' ),
				'default'     => 'Sis-d',
				'desc_tip'    => true,
				'options'     => array(
					'Sis-d' => __( 'Sis-d', 'woocommerce' ),
					'Sis-i' => __( 'Sis-i', 'woocommerce' ),
					'Sis-t' => __( 'Sis-t', 'woocommerce' ),
					'Sis' 	=> __( 'Sis', 'woocommerce' )
				)
			),
			'name' => array(
				'title'       => __( 'Nombre Comercio', 'woocommerce' ),
				'type'        => 'text',
				'description' => __( 'Nombre Comercio.', 'woocommerce' ),
				'default'     => __( 'Prueba', 'woocommerce' ),
				'desc_tip'    => true,
			),
			'fuc' => array(
				'title'       => __( 'FUC Comercio', 'woocommerce' ),
				'type'        => 'text',
				'description' => __( 'FUC del comercio.', 'woocommerce' ),
				'default'     => __( '', 'woocommerce' ),
				'desc_tip'    => true,
			),
			'clave256' => array(
				'title'       => __( 'Clave secreta de encriptación (SHA-256)', 'woocommerce' ),
				'type'        => 'text',
				'description' => __( 'Clave del comercio.', 'woocommerce' ),
				'default'     => __( '', 'woocommerce' ),
				'desc_tip'    => true,
			),
			'terminal' => array(
				'title'       => __( 'Terminal', 'woocommerce' ),
				'type'        => 'text',
				'description' => __( 'Terminal del comercio.', 'woocommerce' ),
				'default'     => __( '1', 'woocommerce' ),
				'desc_tip'    => true,
			),
			'moneda' => array(
				'title'       => __( 'Tipo de Moneda', 'woocommerce' ),
				'type'        => 'select',
				'description' => __( 'Moneda del proceso de pago.', 'woocommerce' ),
				'default'     => '978',
				'desc_tip'    => true,
				'options'     => array(
					'978' => __( 'EURO', 'woocommerce' ),
					'840' => __( 'DOLAR', 'woocommerce' ),
					'826' => __( 'LIBRA', 'woocommerce' )
				)
			),
			'activar_log' => array(
				'title'       => __( 'Activar Log', 'woocommerce' ),
				'type'        => 'select',
				'description' => __( 'Activar trazas de log.', 'woocommerce' ),
				'default'     => 'no',
				'desc_tip'    => true,
				'options'     => array(
					'no' => __( 'No', 'woocommerce' ),
					'si' => __( 'Si', 'woocommerce' )
				)
			),
			'idioma' => array(
				'title'       => __( 'Activar Idiomas', 'woocommerce' ),
				'type'        => 'select',
				'description' => __( 'Idioma del proceso de pago.', 'woocommerce' ),
				'default'     => 'no',
				'desc_tip'    => true,
				'options'     => array(
					'no' => __( 'No', 'woocommerce' ),
					'si' => __( 'Si', 'woocommerce' )
				)
			),
			'estado' => array(
				'title'       => __( 'Estado', 'woocommerce' ),
				'type'        => 'select',
				'description' => __( 'Estado tras el pago.', 'woocommerce' ),
				'default'     => 'no',
				'desc_tip'    => true,
				'options'     => array()
			)
	   	);
		
		$tmp_estados=wc_get_order_statuses();
		foreach($tmp_estados as $est_id=>$est_na){
			$this->form_fields['estado']['options'][substr($est_id,3)]=$est_na;
		}
	}
			
	function process_payment($order_id){
		global $woocommerce;
		$order = new WC_Order($order_id);
		$logActivo=$this->activar_log;

		//Esquema de logs de Redsys
		//$this->log->add( 'bizum', 'Acceso a la opción de pago con Bizum ');
		$this->escribirLog($this->idLog." -- "."Acceso a la opción de pago con Bizum",$logActivo);
	
		// Return receipt_page redirect
		return array(
			'result' 	=> 'success',
			'redirect'	=> $order->get_checkout_payment_url( true )
		);
	}

	function generate_bizum_form( $order_id ) {	
		// Version
		$merchantModule = 'wo_bizum_3.0.3';
		//Recuperamos los datos de config.
		$nombre=$this->nombre;
		$codigo=$this->fuc;
		$terminal=$this->terminal;
		$trans=$this->trans;
		$moneda=$this->moneda;
		$clave256=$this->clave256;	
		$logActivo=$this->activar_log;
		$idioma=$this->idioma;
		$entorno=$this->entorno;
		$estado=$this->estado;

		//Esquema de logs de Bizum
		//$this->log->add( 'bizum', 'Acceso a la opción de pago con Bizum ');
		$this->escribirLog($this->idLog." -- "."Acceso a la opción de pago con Bizum",$logActivo);

		//Callback
		$urltienda = $this -> notify_url;

		//Objeto tipo pedido
		$order = new WC_Order($order_id);

		//Calculo del precio total del pedido
		$transaction_amount = number_format( (float) ($order->get_total()), 2, '.', '' );
		$transaction_amount = str_replace('.','',$transaction_amount);
		$transaction_amount = floatval($transaction_amount);

		// Descripción de los productos
		$productos = '';
		$products = WC()->cart->cart_contents;
		foreach ($products as $product) {
			$productos .= $product['quantity'].'x'.$product['data']->post->post_title.'/';
		}
		$productos = str_replace("%","&#37;",$productos);
		
		$numpedido =  str_pad($order_id, 12, "0", STR_PAD_LEFT);
		// Obtenemos el valor de la config del idioma 
		if($idioma=="no"){
			$idiomaFinal="0";
		}
		else {
				$idioma_web = substr($_SERVER["HTTP_ACCEPT_LANGUAGE"],0,2);
				switch ($idioma_web) {
					case 'es':
					$idiomaFinal='001';
					break;
					case 'en':
					$idiomaFinal='002';
					break;
					case 'ca':
					$idiomaFinal='003';
					break;
					case 'fr':
					$idiomaFinal='004';
					break;
					case 'de':
					$idiomaFinal='005';
					break;
					case 'nl':
					$idiomaFinal='006';
					break;
					case 'it':
					$idiomaFinal='007';
					break;
					case 'sv':
					$idiomaFinal='008';
					break;
					case 'pt':
					$idiomaFinal='009';
					break;
					case 'pl':
					$idiomaFinal='011';
					break;
					case 'gl':
					$idiomaFinal='012';
					break;
					case 'eu':
					$idiomaFinal='013';
					break;
					default:
					$idiomaFinal='002';
			}
		}

		// Generamos la firma	
		$miObj = new RedsysAPI;
		$miObj->setParameter("DS_MERCHANT_AMOUNT",$transaction_amount);
		$miObj->setParameter("DS_MERCHANT_ORDER",$numpedido);
		$miObj->setParameter("DS_MERCHANT_MERCHANTCODE",$codigo);
		$miObj->setParameter("DS_MERCHANT_CURRENCY",$moneda);
		$miObj->setParameter("DS_MERCHANT_TRANSACTIONTYPE", 0);
		$miObj->setParameter("DS_MERCHANT_TERMINAL",$terminal);
		$miObj->setParameter("DS_MERCHANT_MERCHANTURL",$urltienda);
		$miObj->setParameter("DS_MERCHANT_URLOK",$this->get_return_url($order));
		$miObj->setParameter("DS_MERCHANT_URLKO",$order->get_cancel_order_url());
		$miObj->setParameter("Ds_Merchant_ConsumerLanguage",$idiomaFinal);
		$miObj->setParameter("Ds_Merchant_ProductDescription",$productos);
        $miObj->setParameter("Ds_Merchant_Titular",$order -> billing_first_name." ".$order -> billing_last_name);
		$miObj->setParameter("Ds_Merchant_MerchantData",sha1($urltienda));
		$miObj->setParameter("Ds_Merchant_MerchantName",$nombre);
		$miObj->setParameter("Ds_Merchant_PayMethods",'z');
		$miObj->setParameter("Ds_Merchant_Module",$merchantModule);

		//Datos de configuración
		$version = getVersionClave();
		
		//Clave del comercio que se extrae de la configuración del comercio
		// Se generan los parámetros de la petición
		$request = "";
		$paramsBase64 = $miObj->createMerchantParameters();
		$signatureMac = $miObj->createMerchantSignature($this->clave256);

		$resys_args = array(
			'Ds_SignatureVersion' => $version,
			'Ds_MerchantParameters' => $paramsBase64,
			'Ds_Signature' => $signatureMac
			//, 'this_path' => $this->_path
		);
		 
		//Se establecen los input del formulario con los datos del pedido y la redirección
		$resys_args_array = array();
		foreach($resys_args as $key => $value){
		  $resys_args_array[] = "<input type='hidden' name='$key' value='$value'/>";
		}
				
		//Se establece el entorno del SIS
		if($entorno=="Sis-d"){
			$action="http://sis-d.redsys.es/sis/realizarPago/utf-8";
		}
		else if($entorno=="Sis-i"){
			$action="https://sis-i.redsys.es:25443/sis/realizarPago/utf-8";
		}
		else if($entorno=="Sis-t"){
			$action="https://sis-t.redsys.es:25443/sis/realizarPago/utf-8";
		}
		else{
			$action="https://sis.redsys.es/sis/realizarPago/utf-8";
		}	
				
		//Formulario que envía los datos del pedido y la redirección al formulario de acceso al TPV
		return '<form action="'.$action.'" method="post" id="bizum_payment_form">
		' . implode('', $resys_args_array) . '
		<input type="submit" class="button-alt" id="submit_bizum_payment_form" value="'.__('Pagar con BIZUM', 'bizum').'" /> <a class="button cancel" href="'.$order->get_cancel_order_url().'">'.__('Cancelar Pedido', 'bizum').'</a>
		
		 </form>';
	}
			
	function check_rds_response() {
		$this->idLog = generateIdLog();
		$estado=$this->estado;
		
		$logActivo=$this->activar_log;
		if (!empty( $_REQUEST ) ) {
			if (!empty( $_POST ) ) {//URL DE RESP. ONLINE

				/** Recoger datos de respuesta **/
				$version     = $_POST["Ds_SignatureVersion"];
				$datos    = $_POST["Ds_MerchantParameters"];
				$firma_remota    = $_POST["Ds_Signature"];
				
				// Se crea Objeto
				$miObj = new RedsysAPI;
				
				/** Se decodifican los datos enviados y se carga el array de datos **/
				$decodec = $miObj->decodeMerchantParameters($datos);

				/** Clave **/
				$kc = $this->get_option( 'clave256' );
				
				/** Se calcula la firma **/
				$firma_local = $miObj->createMerchantSignatureNotif($kc,$datos);	
				
				/** Extraer datos de la notificaciÃ³n **/
				$total     = $miObj->getParameter('Ds_Amount');
				$pedido    = $miObj->getParameter('Ds_Order');
				$codigo    = $miObj->getParameter('Ds_MerchantCode');
				$moneda    = $miObj->getParameter('Ds_Currency');
				$respuesta = $miObj->getParameter('Ds_Response');
				$id_trans = $miObj->getParameter('Ds_AuthorisationCode');

				//Modificamos en caso de que el $id_trans tenga '+' por cadena vacía.
				$id_trans = str_replace("+", "", $id_trans);

				$pedido = intval($pedido);

				$this->escribirLog($this->idLog." -- DS_MerchantParameters: ".$datos,$logActivo);
				
				if ($firma_local === $firma_remota
							&& checkRespuesta($respuesta)
							&& checkMoneda($moneda)
							&& checkFuc($codigo)
							&& checkPedidoNum($pedido)
							&& checkImporte($total)
				) {
					// Formatear variables
					$respuesta = intval($respuesta);
					
					if ($respuesta < 101) {
							$order = new WC_Order($pedido);
							$order->update_status($estado,__( 'Awaiting bizum payment', 'woocommerce' ));
							//$this->log->add( 'bizum', 'Operación finalizada. PEDIDO ACEPTADO ');
							$this->escribirLog($this->idLog." -- idTrans: ".$id_trans,$logActivo);
							$this->escribirLog($this->idLog." -- "."Operación finalizada. PEDIDO ACEPTADO",$logActivo);
							$order->reduce_order_stock();
							// Remove cart
							WC()->cart->empty_cart();
							//wp_redirect(WC()->plugin_url()."/includes/gateways/bizum/pages/sucess.php?pedido=".$pedido);
					}
					else {
							$order = new WC_Order($pedido);
							$order->update_status('cancelled',__( 'Awaiting bizum payment', 'woocommerce' ));
							WC()->cart->empty_cart();
							//$this->log->add( 'bizum', 'Operación finalizada. PEDIDO CANCELADO ');
							$this->escribirLog($this->idLog." -- "."Operación finalizada. PEDIDO CANCELADO",$logActivo);
							//wp_redirect(WC()->plugin_url()."/includes/gateways/bizum/pages/failure.php?pedido=".$pedido);
					
					}
				}// if (firma_local=firma_remota)
				else {
						if ($firma_local !== $firma_remota) {
							$this->escribirLog($this->idLog." -- La firma no coincide: ".$firma_local.":".$firma_remota,$logActivo);
						}
						if (!checkRespuesta($respuesta)) {
							$this->escribirLog($this->idLog." -- Respuesta incorrecta: ".$respuesta,$logActivo);
						}
						if (!checkMoneda($moneda)) {
							$this->escribirLog($this->idLog." -- Moneda incorrecta: ".$moneda,$logActivo);
						}
						if (!checkFuc($codigo)) {
							$this->escribirLog($this->idLog." -- F.U.C. incorrecto: ".$codigo,$logActivo);
						}
						if (!checkPedidoNum($pedido)) {
							$this->escribirLog($this->idLog." -- Pedido incorrecto: ".$pedido,$logActivo);
						}
						if (!checkImporte($total)) {
							$this->escribirLog($this->idLog." -- Importe incorrecto: ".$total,$logActivo);
						}
						// Fallo de firma o algún otro parámetro
						// Se vacía siempre el carro por motivos de seguridad
						$order = new WC_Order($pedido);
						$order->update_status('cancelled',__( 'Awaiting bizum payment', 'woocommerce' ));
						WC()->cart->empty_cart();
						//$this->log->add( 'bizum', 'Operación finalizada. PEDIDO CANCELADO ');
						$this->escribirLog($this->idLog." -- "."Error de firma. Operación finalizada. PEDIDO CANCELADO",$logActivo);
						//wp_redirect(WC()->plugin_url()."/includes/gateways/bizum/pages/failure.php?pedido=".$pedido);
						
					}		
			}
			else {
				wp_die( '<img src="'.plugins_url() . '/bizum/pages/assets/images/Bizum.png" alt="Redys" height="70" width="242"/><br>	
				<img src="'.plugins_url() . '/bizum/pages/assets/images/cross.png" alt="Desactivado" title="Desactivado" />
				<b>BIZUM</b>: Fallo en el proceso de pago.<br>Su pedido ha sido cancelado.' );
			}	
		} else{
				wp_die( '<img src="'.plugins_url() . '/bizum/pages/assets/images/Bizum.png" alt="Redys" height="70" width="242"/><br>	
				<img src="'.plugins_url() . '/bizum/pages/assets/images/cross.png" alt="Desactivado" title="Desactivado" />
				<b>BIZUM</b>: Fallo en el proceso de pago.<br>Su pedido ha sido cancelado.' );
			}
								
	}
			
	function receipt_page($order){
		//Esquema de logs de Bizum
		//$this->log->add( 'bizum', 'Acceso a la página de confirmación de la opción de pago con Bizum ');
		$logActivo=$this->activar_log;
		$this->escribirLog($this->idLog." -- "."Acceso a la página de confirmación de la opción de pago con Bizum",$logActivo);
		echo '<p>'.__('Gracias por su pedido, por favor pulsa el botón para pagar con Bizum.', 'bizum').'</p>';
		echo $this -> generate_bizum_form($order);

	}
			
	function escribirLog($texto,$activo) {
		if($activo=="si"){
			// Log
			$this->log->add( 'bizum', $texto."\r\n");
		}
	}
}