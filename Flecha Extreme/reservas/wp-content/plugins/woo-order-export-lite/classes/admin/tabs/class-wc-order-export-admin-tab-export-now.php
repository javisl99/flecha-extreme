<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class WC_Order_Export_Admin_Tab_Export_Now extends WC_Order_Export_Admin_Tab_Abstract {
	const KEY = 'export';

	public function __construct() {
		$this->title = __( 'Export now', 'woo-order-export-lite' );
	}

	public function render() {
		$this->render_template( 'tab/export', array( 'ajaxurl' => admin_url( 'admin-ajax.php' ), 'tab' => $this ) );
	}

}