<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class WC_Order_Export_Admin_Tab_Profiles extends WC_Order_Export_Admin_Tab_Abstract {
	const KEY = 'profiles';

	public function __construct() {
		$this->title = "&#x1f512; &nbsp;" . __( 'Profiles', 'woo-order-export-lite' ) ;
		parent::__construct();
	}

	public function render() {
		$this->render_template( 'tab/profiles' );
	}

}