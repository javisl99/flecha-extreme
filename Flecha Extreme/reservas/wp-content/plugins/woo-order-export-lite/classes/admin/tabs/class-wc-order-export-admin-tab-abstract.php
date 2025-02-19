<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class WC_Order_Export_Admin_Tab_Abstract {
	use WC_Order_Export_Admin_Tab_Abstract_Ajax;

	const KEY = null;

	protected $title;

	protected $settings;

	public function __construct() {
		$this->settings = WC_Order_Export_Main_Settings::get_settings();
	}

	public static function get_key() {
		return static::KEY;
	}

	public function get_title() {
		return $this->title;
	}

	public function get_settings() {
		return $this->settings;
	}
	public function process() {
	}

	public function render() {
	}

	public function render_template( $view, $params = array(), $path_views = null ) {

		$params = apply_filters( 'woe_render_params', $params );
		$params = apply_filters( 'woe_render_params_' . $view, $params );

		$active_tab = static::get_key();

		extract( $params );

		if ( $path_views ) {
			include $path_views . "$view.php";
		} else {
			include WOE_PLUGIN_BASEPATH . "/view/" . "$view.php";
		}
	}

}