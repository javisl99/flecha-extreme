<?php 

///// 3DSecure | TABLA 4 - Json Object acctInfo

//// chAccAgeInd & chAccDate
if(!is_user_logged_in()){
	$chAccAgeInd 			= "01";
}
else{
	// Calculamos los minutos que la cuenta lleva abierta
	$accountCreated			= intval( (strtotime("now") - strtotime(get_userdata(get_current_user_id())->user_registered))/60 );
	// Calculamos los días que la cuenta lleva abierta
	$nDays					= intval($accountCreated/1440);
	// Si la cuenta tiene menos de 20 minutos lo tomaremos como que la ha creado mientras hacía el pedido
	$dt 					= new DateTime(get_userdata(get_current_user_id())->user_registered);
	$chAccDate				= $dt->format('Ymd');
	if ($accountCreated < 20) {
		$chAccAgeInd 		= "02";
	}
	elseif ($nDays < 30) {
		$chAccAgeInd 		= "03";
	}
	elseif ($nDays >= 30 && $nDays <= 60) {
		$chAccAgeInd 		= "04";
	}
	else {
		$chAccAgeInd 		= "05";
	}
}

//// chAccChange & chAccChangeInd
if (is_user_logged_in()) {
	$customer				= new WC_Customer(get_current_user_id());
	$dt						= new DateTime($customer->data['date_modified']);
	$chAccChange			= $dt->format('Ymd');
	$accountModified		= intval( (strtotime("now") - strtotime($cusomer->data['date_modified']))/60 );
	$nDays					= intval($accountModified/1440);
	if($accountModified < 20) {
		$chAccChangeInd		= "01";
	}
	elseif ($nDays < 30) {
		$chAccChangeInd		= "02";
	}
	elseif ($nDays >= 30 && $nDays <= 60) {
		$chAccChangeInd		= "03";
	}
	else {
		$chAccChangeInd		= "04";
	}
}

//// chAccPwChange			| No se puede sacar este dato
// $chAccPwChange			= "";

//// chAccPwChangeInd		| No se puede sacar este dato
// $chAccPwChangeInd		= "";

//// nbPurchaseAccount
if (is_user_logged_in()) {
	$customer_orders		= get_posts( array(
        'numberposts'		=> -1,
        'meta_key'			=> '_customer_user',
        'meta_value'		=> get_current_user_id(),
        'post_type'			=> wc_get_order_types(),
        'post_status'		=> 'wc-completed',
		'date_query'		=> array(
			array(
				'after'		=> '6 month ago'
			)
		)
    ));
    $nbPurchaseAccount		= count($customer_orders);
}

//// provisionAttemptsDay	| No se puede sacar este dato
// $provisionAttemptsDay	= "";

//// txnActivityDay
if (is_user_logged_in()) {
	$customer_orders		= get_posts( array(
        'numberposts'		=> -1,
        'meta_key'			=> '_customer_user',
        'meta_value'		=> get_current_user_id(),
        'post_type'			=> wc_get_order_types(),
        'post_status'		=> array('wc-completed', 'wc-pending'),
		'date_query'		=> array(
			array(
				'after'		=> '1 day ago'
			)
		)
    ));
    $txnActivityDay			= count($customer_orders);
}

//// txnActivityYear
if (is_user_logged_in()) {
	$customer_orders		= get_posts( array(
        'numberposts'		=> -1,
        'meta_key'			=> '_customer_user',
        'meta_value'		=> get_current_user_id(),
        'post_type'			=> wc_get_order_types(),
        'post_status'		=> array('wc-completed', 'wc-pending'),
		'date_query'		=> array(
			array(
				'after'		=> '1 year ago'
			)
		)
    ));
    $txnActivityYear		= count($customer_orders);
}

//// paymentAccAge			| No se puede sacar este dato
// $paymentAccAge			= "";

//// paymentAccInd			| No se puede sacar este dato
// $paymentAccInd			= "";

//// shipAddressUsage & shipAddressUsageInd
if ($order->has_shipping_address()) {
	$query					= get_posts(array(
		'post_type'			=> wc_get_order_types(),
		'post_status'		=> array_keys( wc_get_order_statuses() ),
		'meta_query'		=> array(
			array(
				'key'		=> '_shipping_address_1',
				'value'		=> $order->get_shipping_address_1()
			),
			array(
				'key'		=> '_shipping_address_2',
				'value'		=> $order->get_shipping_address_2()
			),
			array(
				'key'		=> '_shipping_city',
				'value'		=> $order->get_shipping_city()
			),
			array(
				'key'		=> '_shipping_postcode',
				'value'		=> $order->get_shipping_postcode()
			),
			array(
				'key'		=> '_shipping_country',
				'value'		=> $order->get_shipping_country()
			)
		),
		'order'				=> 'ASC'
	));
	if (count($query) != 0 ){
		$dt = new DateTime($query[0]->post_date);
		$shipAddressUsage	= $dt->format('Ymd');
		
		$nDays				= intval( ((strtotime("now") - strtotime($query[0]->post_date))/60)/1440 );
		if ($nDays < 30) {
			$shipAddressUsageInd = "02";
		}
		elseif ($nDays >= 30 && $nDays <= 60) {
			$shipAddressUsageInd = "03";
		}
		else{
			$shipAddressUsageInd = "04";
		}
	}
	else{
		$fechaBase				= strtotime("now");
		$dt						= new DateTime("@$fechaBase");
		$shipAddressUsage		= $dt->format('Ymd');
		$shipAddressUsageInd 	= "01";
	}
}

//// shipNameIndicator		| No se puede sacar este dato
// $shipNameIndicator		= "";

//// suspiciousAccActivity	| No se puede sacar este dato
// $suspiciousAccActivity	= "";

///// 3DSecure | FIN TABLA 4


///// 3DSecure | TABLA 1 - Ds_Merchant_EMV3DS (json Object)
//// addrMatch
if ($order->has_shipping_address()) {
	if (
		($order->get_shipping_address_1() == $order->get_billing_address_1())
		&&
		($order->get_shipping_address_2() == $order->get_billing_address_2())
		&&
		($order->get_shipping_city() == $order->get_billing_city())
		&&
		($order->get_shipping_postcode() == $order->get_billing_postcode())
		&&
		($order->get_shipping_country() == $order->get_billing_country())
	){
		$addrMatch			= "Y";
	}
	else{
		$addrMatch			= "N";
	}
}
else{
	$addrMatch				= "N";
}

//// billAddrCity
$billAddrCity 				= $order->get_billing_city();

//// billAddrCountry		| No se puede sacar este dato
//$billAddrCountry 			= "";

//// billAddrLine1
$billAddrLine1 				= $order->get_billing_address_1();

//// billAddrLine2
$billAddrLine2				= $order->get_billing_address_2();

//// billAddrLine3			| No se puede sacar este dato
// $billAddrLine3			= "";

//// billAddrPostCode
$billAddrPostCode			= $order->get_billing_postcode();

//// billAddrState
$billAddrState				= $order->get_billing_state();

//// Email
$Email						= $order->get_billing_email();

//// homePhone
$homePhone					= array("subscriber" => $order->get_billing_phone(), "cc" => "34");

//// mobilePhone
// $mobilePhone				= ;

//// cardholderName 		| No se puede sacar este dato
// $cardholderName			= "";

if ($order->has_shipping_address()) {
	//// shipAddrCity
	$shipAddrCity 			= $order->get_shipping_city();
	
	//// shipAddrCountry	| No se puede sacar este dato
	//$shipAddrCountry 		= "";
	
	//// shipAddrLine1
	$shipAddrLine1 			= $order->get_shipping_address_1();
	
	//// shipAddrLine2
	$shipAddrLine2			= $order->get_shipping_address_2();
	
	//// shipAddrLine3		| No se puede sacar este dato
	// $shipAddrLine3		= "";
	
	//// shipAddrPostCode
	$shipAddrPostCode		= $order->get_shipping_postcode();
	
	//// shipAddrState
	$shipAddrState			= $order->get_shipping_state();
}

//// workPhone
// $workPhone				= "";

//// threeDSRequestorAuthenticationInfo | No lo ponemos

//// acctInfo					| Información de la TABLA 4
$acctInfo 					= array(
	'chAccAgeInd'			=> $chAccAgeInd
);
if ($order->has_shipping_address()) {
	$acctInfo['shipAddressUsage'] 		= strval($shipAddressUsage);
	$acctInfo['shipAddressUsageInd']	= strval($shipAddressUsageInd);
}
if (is_user_logged_in()) {
	$acctInfo['chAccDate']				= strval($chAccDate);
	$acctInfo['chAccChange']			= strval($chAccChange);
	$acctInfo['chAccChangeInd']			= strval($chAccChangeInd);
	$acctInfo['nbPurchaseAccount']		= strval($nbPurchaseAccount);
	$acctInfo['txnActivityDay']			= strval($txnActivityDay);
	$acctInfo['txnActivityYear']		= strval($txnActivityYear);
}

//// purchaseInstalData		| No se puede sacar este dato
// $purchaseInstalData		= "";

//// recurringExpiry		| No se puede sacar este dato
// $recurringExpiry			= "";

//// recurringFrequency		| No se puede sacar este dato
// $recurringFrequency		= "";

//// merchantRiskIndicator	| No se puede sacar este dato
// $merchantRiskIndicator   = array();

//// challengeWindowSize	| No se puede sacar este dato
// $challengeWindowSize 	= "";


///// 3DSecure | FIN TABLA 1

///// 3DSecure | Insertamos el parámetro "Ds_Merchant_EMV3DS" en $miObj

$Ds_Merchant_EMV3DS 		= array(
	'addrMatch'				=> $addrMatch,
	'billAddrCity'			=> $billAddrCity,
	'billAddrLine1'			=> $billAddrLine1,
	'billAddrPostCode'		=> $billAddrPostCode,
	// 'billAddrState'			=> $billAddrState, // No se envía porque no se puede obtener el país
	'email'					=> $Email,
	'acctInfo'				=> $acctInfo,
	'homePhone'				=> $homePhone
);
if ($billAddrLine2 != '') {
	$Ds_Merchant_EMV3DS['billAddrLine2']	= $billAddrLine2;
}
if ($order->has_shipping_address()) {
	// $Ds_Merchant_EMV3DS['acctInfo']			= array(
	// 	'shipAddressUsage'					=> $shipAddressUsage,
	// 	'shipAddressUsageInd'				=> $shipAddressUsageInd
	// );
	$Ds_Merchant_EMV3DS['shipAddrCity']		= $shipAddrCity;
	$Ds_Merchant_EMV3DS['shipAddrLine1']	= $shipAddrLine1;
	$Ds_Merchant_EMV3DS['shipAddrPostCode']	= $shipAddrPostCode;
	// $Ds_Merchant_EMV3DS['shipAddrState']	= $shipAddrState; // No se envía porque no se puede obtener el país
	if ($shipAddrLine2 != '') {
		$Ds_Merchant_EMV3DS['shipAddrLine2']= $shipAddrLine2;	
	}
}

$Ds_Merchant_EMV3DS 		= json_encode($Ds_Merchant_EMV3DS);

$miObj->setParameter("Ds_Merchant_EMV3DS", $Ds_Merchant_EMV3DS);

?>
