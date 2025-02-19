<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

trait WC_Order_Export_Ajax_Helpers {
	protected $tempfile_prefix = 'woocommerce-order-file-';
	//to avoid using transients for file name
	protected $filename;
	protected $tmp_filename;

	protected $_wp_using_ext_object_cache_previous;

	protected function send_headers( $format, $download_name = '' ) {

		WC_Order_Export_Engine::kill_buffers();

		switch ( $format ) {
			case 'XLSX':
				if ( empty( $download_name ) ) {
					$download_name = "orders.xlsx";
				}
				header( 'Content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' );
				break;
			case 'XLS':
				if ( empty( $download_name ) ) {
					$download_name = "orders.xls";
				}
				header( 'Content-type: application/vnd.ms-excel; charset=utf-8' );
				break;
			case 'CSV':
				if ( empty( $download_name ) ) {
					$download_name = "orders.csv";
				}
				header( 'Content-type: text/csv' );
				break;
			case 'TSV':
				if ( empty( $download_name ) ) {
					$download_name = "orders.tsv";
				}
				header( 'Content-type: text/tsv' );
				break;
			case 'JSON':
				if ( empty( $download_name ) ) {
					$download_name = "orders.json";
				}
				header( 'Content-type: application/json' );
				break;
			case 'XML':
				if ( empty( $download_name ) ) {
					$download_name = "orders.xml";
				}
				header( 'Content-type: text/xml' );
				break;
			case 'PDF':
				if ( empty( $download_name ) ) {
					$download_name = "orders.pdf";
				}
				header("Content-type: application/pdf");
				break;
			case 'HTML':
				if ( empty( $download_name ) ) {
					$download_name = "orders.html";
				}

				$settings = WC_Order_Export_Main_Settings::get_settings();

				if ( ! empty( $settings['display_html_report_in_browser'] ) ) {
				    return;
				}

				break;
		}
		header( 'Content-Disposition: attachment; filename="' . $download_name . '"' );
	}

	protected function start_prevent_object_cache() {

		global $_wp_using_ext_object_cache;

		$this->_wp_using_ext_object_cache_previous = $_wp_using_ext_object_cache;
		$_wp_using_ext_object_cache                = false;
	}

	protected function stop_prevent_object_cache() {

		global $_wp_using_ext_object_cache;

		$_wp_using_ext_object_cache = $this->_wp_using_ext_object_cache_previous;
	}

	protected function send_contents_delete_file( $filename ) {
		if ( ! empty( $filename ) ) {
			if( !$this->function_disabled('readfile') ) {
				readfile( $filename );
			} else {
				// fallback, emulate readfile 
				$file = fopen($filename, 'rb');
				if ( $file !== false ) {
					while ( !feof($file) ) {
						echo fread($file, 4096);
					}
					fclose($file);
				}
			}
			unlink( $filename );
		}
	}
	
	function function_disabled($function) {
		$disabled_functions = explode(',', ini_get('disable_functions'));
		return in_array($function, $disabled_functions);
	}

	protected function get_temp_file_name() {

		$this->start_prevent_object_cache();

		$filename = $this->tmp_filename ? $this->tmp_filename :	get_transient( $this->tempfile_prefix . $_REQUEST['file_id'] );
		if ( $filename === false ) {
			echo json_encode( array( 'error' => __( 'Can\'t find exported file', 'woo-order-export-lite' ) ) );
			die();
		}
		set_transient( $this->tempfile_prefix . $_REQUEST['file_id'], $filename, 60 );
		$this->stop_prevent_object_cache();

		return $filename;
	}

	public function set_filename($filename) {
		$this->filename = $filename;
	}

	public function set_tmp_filename($tmp_filename) {
		$this->tmp_filename = $tmp_filename;
	}

	protected function delete_temp_file() {

		$this->start_prevent_object_cache();
		$filename = get_transient( $this->tempfile_prefix . $_REQUEST['file_id'] );
		if ( $filename !== false ) {
			delete_transient( $this->tempfile_prefix . $_REQUEST['file_id'] );
			unlink( $filename );
            //also delete storage file
            if(file_exists($filename . '.storage')) {
                unlink($filename . '.storage');
            }
		}
		$this->stop_prevent_object_cache();
	}

	protected function build_and_send_file( $settings, $export = false, $browser_output = true ) {
		$result = [];
		$filename = WC_Order_Export_Engine::build_file_full( $settings, '', 0, explode( ",", $_REQUEST['ids'] ) );
		$download_name = WC_Order_Export_Engine::make_filename( $settings['export_filename'] );
		WC_Order_Export_Manage::set_correct_file_ext( $settings );
		if ( $export ) {
			$result = WC_Order_Export_Pro_Engine::export( $settings, $filename );
		}
		if ( $browser_output ) {
			$this->send_headers( $settings['format'], $download_name );
			$this->send_contents_delete_file( $filename );
		}
		return $result;
	}

}