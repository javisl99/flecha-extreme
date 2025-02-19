<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

/**
 * Class WC_Order_Export_Ajax
 *
 * Class for handle ajax requests which not require tab name to execute
 *
 */
class WC_Order_Export_Ajax {
	use WC_Order_Export_Ajax_Helpers;
	
	public function ajax_run_one_job() {

		if ( ! empty( $_REQUEST['profile'] ) AND $_REQUEST['profile'] == 'now'  ) {
			$settings = WC_Order_Export_Manage::get( WC_Order_Export_Manage::EXPORT_NOW );
		} else {
			_e( 'Profile required!', 'woo-order-export-lite' );
		}

		$filename = WC_Order_Export_Engine::build_file_full( $settings );
		WC_Order_Export_Manage::set_correct_file_ext( $settings );

		$this->send_headers( $settings['format'], WC_Order_Export_Engine::make_filename( $settings['export_filename'] ) );
		$this->send_contents_delete_file( $filename );
	}
	

	public function ajax_export_download_bulk_file() {
	
		$main_settings = WC_Order_Export_Main_Settings::get_settings();
		$destination_flag = $main_settings['show_destination_in_profile'];
		$settings = array_merge( WC_Order_Export_Manage::get_defaults_filters(), $this->get_settings_from_bulk_request() );
		$browser_output = empty($settings['destination']['not_download_browser']); 
		$result = $this->build_and_send_file( $settings, $destination_flag, $browser_output );
		
		$output = sprintf( __( 'Export as profile "%s".', 'woo-order-export-lite' ) . "<br>\n" . __( 'Result: %s', 'woo-order-export-lite' ),
			$settings['title'], implode("<br>\n\r", array_map(function ($v) { return $v['text']; }, $result)) );
		
		$logger         = function_exists( "wc_get_logger" ) ? wc_get_logger() : false; //new logger in 3.0+
		$logger_context = array( 'source' => 'woo-order-export-lite' );
		if ( $logger && ! empty( $result ) ) {
			$logger->info( $output, $logger_context );
		}

		//admin will see non-emty message in any case , later 
		if ( !empty( $result ) AND $settings['title'] ) 
			set_transient( WC_Order_Export_Admin::last_bulk_export_results, $output, 5 * MINUTE_IN_SECONDS  );
		if ( !$browser_output  ) { // we don't send file to user, so we must redirect to previous page! 
			if( isset( $_SERVER['HTTP_REFERER'] ) ) { 
				wp_redirect( $_SERVER['HTTP_REFERER'] );
				exit();
			} else { // if we don't know the referer - just show the message
				die($output);
			}	
		}
	}

	protected function get_settings_from_bulk_request() {
		$settings = false;
		if ( ! empty( $_REQUEST['export_bulk_profile'] ) && $_REQUEST['export_bulk_profile'] == 'now' ) {
			$settings = WC_Order_Export_Manage::get( WC_Order_Export_Manage::EXPORT_NOW );
		}

		return $settings;
	}
	
}