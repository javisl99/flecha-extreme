<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class WC_Order_Export_Admin_Tab_Status_Change_Jobs extends WC_Order_Export_Admin_Tab_Abstract {
	const KEY = 'order_actions';

	public function __construct() {
		$this->title = "&#x1f512; &nbsp;" . __( 'Status change jobs', 'woo-order-export-lite' );
	}

	public function render() {
		$this->render_template( 'tab/order-actions' );
	}

}