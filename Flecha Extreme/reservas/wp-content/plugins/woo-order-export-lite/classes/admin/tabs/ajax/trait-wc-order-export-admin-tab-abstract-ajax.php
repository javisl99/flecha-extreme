<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

trait WC_Order_Export_Admin_Tab_Abstract_Ajax {
	use WC_Order_Export_Admin_Tab_Abstract_Ajax_Filters;
	use WC_Order_Export_Admin_Tab_Abstract_Ajax_Export;

	public function ajax_save_settings() {

		$settings = WC_Order_Export_Manage::make_new_settings( $_POST );

		/*
		array_walk_recursive($settings, function(&$_value, $_key) {
		    if ($_key !== 'custom_php_code'  AND $_key !== 'email_body') {
			$_value = esc_attr($_value);
		    }
		});
		*/

		$id = WC_Order_Export_Manage::save_export_settings( $_POST['mode'], (int) $_POST['id'], $settings );

		echo json_encode( array( 'id' => $id ) );
	}

	public function ajax_reset_profile() {
		$id = WC_Order_Export_Manage::save_export_settings( $_POST['mode'], $_POST['id'], array() );
		wp_send_json_success();
	}

}