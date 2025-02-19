<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

trait WC_Order_Export_Admin_Tab_Abstract_Ajax_Export {
	use WC_Order_Export_Ajax_Helpers;

	public function ajax_preview() {
		global $wp_filter;
		
		$settings = ($_POST['mode'] == 'frontend' ) ? json_decode($_POST['settings'],true) : WC_Order_Export_Manage::make_new_settings( $_POST );
		// use unsaved settings

		do_action( 'woe_start_preview_job', $_POST['id'], $settings );
		
		WC_Order_Export_Engine::kill_buffers();
		
		ob_start(); // we need html for preview , even empty!
		
		$currrent_wp_filter = $wp_filter;
		$total = WC_Order_Export_Engine::build_file( $settings, 'estimate_preview', 'file', 0, 0, 'test');
		$wp_filter = $currrent_wp_filter;//revert all hooks/fiilters added by build_file

		WC_Order_Export_Engine::build_file( $settings, 'preview', 'browser', 0, $_POST['limit'] );
		
		$html = ob_get_contents();
		ob_end_clean();

		echo json_encode( array( 'total' => $total, 'html' => $html ) );
	}

	public function ajax_estimate() {

		$settings = ($_POST['mode'] == 'frontend' ) ? json_decode($_POST['settings'],true) : WC_Order_Export_Manage::make_new_settings( $_POST );
		// use unsaved settings

		$total = WC_Order_Export_Engine::build_file( $settings, 'estimate', 'file', 0, 0, 'test' );

		echo json_encode( array( 'total' => $total ) );
	}

	public function ajax_export_start() {
		$this->start_prevent_object_cache();
		$settings = ($_POST['mode'] == 'frontend' ) ? json_decode($_POST['settings'],true) : WC_Order_Export_Manage::make_new_settings( $_POST );

		if ( $settings['format'] === 'XLS' && ! function_exists( "mb_strtolower" ) ) {
			die( __( 'Please, install/enable PHP mbstring extension!', 'woo-order-export-lite' ) );
		}

		$filename = WC_Order_Export_Engine::get_filename( "orders" );
		if ( ! $filename ) {
			die( __( 'Can\'t create temporary file', 'woo-order-export-lite' ) );
		}
		//no free space or other file system errors?
		try {
			file_put_contents( $filename, '' );
			do_action( 'woe_start_export_job', $_POST['id'], $settings );
			$result = WC_Order_Export_Engine::build_file( $settings, 'start_estimate', 'file', 0, 0, $filename );
		} catch ( Exception $e ) {
			die( $e->getMessage() );
		}
		// file created
		$file_id = current_time( 'timestamp' );
		set_transient( $this->tempfile_prefix . $file_id, $filename, 60 );
		$this->stop_prevent_object_cache();
		echo json_encode( array( 
			'total' => $result['total'], 
			'file_id' => $file_id,
			'max_line_items' => $result['max_line_items'],
			'max_coupons' => $result['max_coupons'],
		 ) );
	}


	public function ajax_export_part() {

		$settings = ($_POST['mode'] == 'frontend' ) ? json_decode($_POST['settings'],true) : WC_Order_Export_Manage::make_new_settings( $_POST );
		$main_settings = WC_Order_Export_Main_Settings::get_settings();

		$settings['max_line_items'] = $_POST['max_line_items'];
		$settings['max_coupons'] = $_POST['max_coupons'];

		WC_Order_Export_Engine::build_file( $settings, 'partial', 'file', intval( $_POST['start'] ),
			$main_settings['ajax_orders_per_step'],
			$this->get_temp_file_name() );

		echo json_encode( array( 'start' => $_POST['start'] + $main_settings['ajax_orders_per_step'] ) );
	}

	public function ajax_plain_export() {

		// use unsaved settings
		$settings = ($_POST['mode'] == 'frontend' ) ? json_decode($_POST['settings']) : WC_Order_Export_Manage::make_new_settings( $_POST );
		do_action( 'woe_start_export_job', $_POST['id'], $settings );

		// custom export worked for plain
		if ( apply_filters( 'woe_plain_export_custom_func', false, $_POST['id'], $settings ) ) {
			return;
		}

		if ( $settings['format'] === 'XLS' && ! function_exists( "mb_strtolower" ) ) {
			die( __( 'Please, install/enable PHP mbstring extension!', 'woo-order-export-lite' ) );
		}

		$file = WC_Order_Export_Engine::build_file_full( $settings );
		//$order_id = WC_Order_Export_Engine::$orders_for_export;
		if ( $file !== false ) {
			$file_id = current_time( 'timestamp' );
			$this->start_prevent_object_cache();
			set_transient( $this->tempfile_prefix . $file_id, $file, 600 );
			$this->stop_prevent_object_cache();

			WC_Order_Export_Manage::set_correct_file_ext( $settings );

			$_GET['format']  = $settings['format'];
			$_GET['file_id'] = $_REQUEST['file_id'] = $file_id;
			$filename = WC_Order_Export_Engine::make_filename( $settings['export_filename'] );
			$this->start_prevent_object_cache();
			set_transient( $this->tempfile_prefix . 'download_filename', $filename, 60 );
			$this->stop_prevent_object_cache();

			$this->set_filename($filename);
			$this->set_tmp_filename($file);
			$this->ajax_export_download();
		} else {
			_e( 'Nothing to export. Please, adjust your filters', 'woo-order-export-lite' );
		}
	}


	public function ajax_export_download() {

		$this->start_prevent_object_cache();
		$format   = basename( $_GET['format'] );
		$filename = $this->get_temp_file_name();
		delete_transient( $this->tempfile_prefix . $_GET['file_id'] );

		$download_name = $this->filename ? $this->filename : get_transient( $this->tempfile_prefix . 'download_filename' );
		$this->send_headers( $format, $download_name );
		$this->send_contents_delete_file( $filename );
		$this->stop_prevent_object_cache();
	}

	public function ajax_export_finish() {
		$settings = ($_POST['mode'] == 'frontend' ) ? json_decode($_POST['settings'],true) : WC_Order_Export_Manage::make_new_settings( $_POST );
		WC_Order_Export_Engine::build_file( $settings, 'finish', 'file', 0, 0, $this->get_temp_file_name() );

		$filename = WC_Order_Export_Engine::make_filename( $settings['export_filename'] );
		$this->start_prevent_object_cache();
		set_transient( $this->tempfile_prefix . 'download_filename', $filename, 60 );
		$this->stop_prevent_object_cache();
		echo json_encode( array( 'done' => true ) );
	}

	public function ajax_cancel_export() {

		$this->delete_temp_file();
		echo json_encode( array() );
	}

}