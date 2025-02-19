<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class WC_Order_Export_Admin_Tab_Tools extends WC_Order_Export_Admin_Tab_Abstract {
	const KEY = 'tools';

	public function __construct() {
		$this->title = __( 'Tools', 'woo-order-export-lite' );
	}

	public function render() {
		$this->render_template( 'tab/tools' );
	}

	public function ajax_save_tools() {

		$data = json_decode( $_POST['tools-import'], true );

		if ( $data ) {
			WC_Order_Export_Manage::import_settings( $data );
		}
	}
}