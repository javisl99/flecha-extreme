<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class WC_Order_Export_Admin_Tab_Help extends WC_Order_Export_Admin_Tab_Abstract {
	const KEY = 'help';

	public function __construct() {
		$this->title = __( 'Help', 'woo-order-export-lite' );
	}

	public function render() {
		$this->render_template( 'tab/help' );
	}

}