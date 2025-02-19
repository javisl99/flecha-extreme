<?php // @codingStandardsIgnoreLine.
/**
 * Plugin Name: Gallery Master - Photo Gallery - Image Gallery - Photo Albums - WordPress Gallery Plugin
 * Plugin URI: https://tech-banker.com/gallery-master/
 * Description: Gallery Master - Responsive Gallery Images, Photo Albums in Gallery Widget, Images Gallery, Media Gallery, Filterable Portfolio, Gallery Lightbox.
 * Author: Tech Banker
 * Author URI: https://tech-banker.com/gallery-master/
 * Version: 2.0.18
 * License: GPLv3
 * Text Domain: gallery-master
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly.

/* Constant Declaration */

if ( ! defined( 'GALLERY_MASTER_PLUGIN_DIR_PATH' ) ) {
	define( 'GALLERY_MASTER_PLUGIN_DIR_PATH', plugin_dir_path( __FILE__ ) );
}

if ( ! defined( 'GALLERY_MASTER_PLUGIN_DIRNAME' ) ) {
	define( 'GALLERY_MASTER_PLUGIN_DIRNAME', plugin_basename( dirname( __FILE__ ) ) );
}

if ( ! defined( 'GALLERY_MASTER_MAIN_DIR' ) ) {
	define( 'GALLERY_MASTER_MAIN_DIR', dirname( dirname( dirname( __FILE__ ) ) ) . '/gallery-master/' );
}

if ( ! defined( 'GALLERY_MASTER_UPLOAD_DIR' ) ) {
	define( 'GALLERY_MASTER_UPLOAD_DIR', GALLERY_MASTER_MAIN_DIR . 'original-uploads/' );
}

if ( ! defined( 'GALLERY_MASTER_THUMBS_CROPPED_DIR' ) ) {
	define( 'GALLERY_MASTER_THUMBS_CROPPED_DIR', GALLERY_MASTER_MAIN_DIR . 'thumbs-cropped/' );
}

if ( ! defined( 'GALLERY_MASTER_THUMBS_NON_CROPPED_DIR' ) ) {
	define( 'GALLERY_MASTER_THUMBS_NON_CROPPED_DIR', GALLERY_MASTER_MAIN_DIR . 'thumbs-non-cropped/' );
}

if ( ! defined( 'GALLERY_MASTER_ORIGINAL_DIR' ) ) {
	define( 'GALLERY_MASTER_ORIGINAL_DIR', GALLERY_MASTER_MAIN_DIR . 'original-images/' );
}
if ( ! defined( 'GALLERY_MASTER_USER_VIEWS_PATH' ) ) {
	define( 'GALLERY_MASTER_USER_VIEWS_PATH', GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/' );
}

if ( ! defined( 'GALLERY_MASTER_PLUGIN_DIR_URL' ) ) {
	define( 'GALLERY_MASTER_PLUGIN_DIR_URL', plugin_dir_url( __FILE__ ) );
}

if ( ! defined( 'GALLERY_MASTER_MAIN_URL' ) ) {
	define( 'GALLERY_MASTER_MAIN_URL', WP_CONTENT_URL . '/gallery-master/' );
}

if ( ! defined( 'GALLERY_MASTER_ORIGINAL_URL' ) ) {
	define( 'GALLERY_MASTER_ORIGINAL_URL', WP_CONTENT_URL . '/gallery-master/original-images/' );
}

if ( ! defined( 'GALLERY_MASTER_THUMBS_CROPPED_URL' ) ) {
	define( 'GALLERY_MASTER_THUMBS_CROPPED_URL', WP_CONTENT_URL . '/gallery-master/thumbs-cropped/' );
}

if ( ! defined( 'GALLERY_MASTER_THUMBS_NON_CROPPED_URL' ) ) {
	define( 'GALLERY_MASTER_THUMBS_NON_CROPPED_URL', WP_CONTENT_URL . '/gallery-master/thumbs-non-cropped/' );
}
if ( ! defined( 'TECH_BANKER_URL' ) ) {
	define( 'TECH_BANKER_URL', 'https://tech-banker.com' );
}
if ( ! defined( 'TECH_BANKER_GALLERY_URL' ) ) {
	define( 'TECH_BANKER_GALLERY_URL', 'https://tech-banker.com/gallery-master/' );
}
if ( ! defined( 'TECH_BANKER_STATS_URL' ) ) {
	define( 'TECH_BANKER_STATS_URL', 'http://stats.tech-banker-services.org' );
}
if ( ! defined( 'GALLERY_MASTER_WIZARD_VERSION_NUMBER' ) ) {
	define( 'GALLERY_MASTER_WIZARD_VERSION_NUMBER', '2.0.18' );
}

if ( ! is_dir( GALLERY_MASTER_MAIN_DIR ) ) {
	wp_mkdir_p( GALLERY_MASTER_MAIN_DIR );
}
if ( ! is_dir( GALLERY_MASTER_UPLOAD_DIR ) ) {
	wp_mkdir_p( GALLERY_MASTER_UPLOAD_DIR );
}
if ( ! is_dir( GALLERY_MASTER_THUMBS_NON_CROPPED_DIR ) ) {
	wp_mkdir_p( GALLERY_MASTER_THUMBS_NON_CROPPED_DIR );
}
if ( ! is_dir( GALLERY_MASTER_THUMBS_CROPPED_DIR ) ) {
	wp_mkdir_p( GALLERY_MASTER_THUMBS_CROPPED_DIR );
}
if ( ! is_dir( GALLERY_MASTER_ORIGINAL_DIR ) ) {
	wp_mkdir_p( GALLERY_MASTER_ORIGINAL_DIR );
}
$memory_limit_gallery_master = intval( ini_get( 'memory_limit' ) );
if ( ! extension_loaded( 'suhosin' ) && $memory_limit_gallery_master < 512 ) {
	@ini_set( 'memory_limit', '1024M' );// @codingStandardsIgnoreLine.
}
@ini_set( 'max_execution_time', 6000 );// @codingStandardsIgnoreLine.

/**
 * This function is used to include install script for gallery master.
 */
function install_script_for_gallery_master() {
	global $wpdb;
	if ( is_multisite() ) {
		$blog_ids = $wpdb->get_col( "SELECT blog_id FROM $wpdb->blogs" );// WPCS: db call ok, no-cache ok.
		foreach ( $blog_ids as $blog_id ) {
			switch_to_blog( $blog_id );// @codingStandardsIgnoreLine.
			$version = get_option( 'gallery-master-key' );
			if ( $version < '2.0.1' ) {
				if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/class-dbhelper-install-script-gallery-master.php' ) ) {
					include GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/class-dbhelper-install-script-gallery-master.php';
				}
			}
			restore_current_blog();
		}
	} else {
		$version = get_option( 'gallery-master-key' );
		if ( $version < '2.0.1' ) {
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/class-dbhelper-install-script-gallery-master.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/class-dbhelper-install-script-gallery-master.php';
			}
		}
	}
}
/**
 * This function is used for creating a parent table.
 */
function gallery_master_parent() {
	global $wpdb;
	return $wpdb->prefix . 'gallery_master';
}
/**
 * This function is used for creating a meta table.
 */
function gallery_master_meta() {
	global $wpdb;
	return $wpdb->prefix . 'gallery_master_meta';
}
/**
 * This function is used for checking roles of different users.
 *
 * @param string $user .
 */
function check_user_roles_gallery_master( $user = null ) {
	$user = $user ? new WP_User( $user ) : wp_get_current_user();
	return $user->roles ? $user->roles[0] : false;
}
/**
 * This function is used to create link for Pro Editions.
 *
 * @param string $plugin_link .
 */
function gallery_master_action_links( $plugin_link ) {
	$plugin_link[] = '<a href="https://tech-banker.com/gallery-master/pricing/" style="color: red; font-weight: bold;" target="_blank">Go Pro!</a>';
	return $plugin_link;
}
/**
 * This function is used to get all the roles available in WordPress.
 */
function get_others_capabilities_gallery_master() {
	$user_capabilities = array();
	if ( function_exists( 'get_editable_roles' ) ) {
		foreach ( get_editable_roles() as $role_name => $role_info ) {
			foreach ( $role_info['capabilities'] as $capability => $values ) {
				if ( ! in_array( $capability, $user_capabilities, true ) ) {
					array_push( $user_capabilities, $capability );
				}
			}
		}
	} else {
		$user_capabilities = array(
			'manage_options',
			'edit_plugins',
			'edit_posts',
			'publish_posts',
			'publish_pages',
			'edit_pages',
			'read',
		);
	}
	return $user_capabilities;
}
$version = get_option( 'gallery-master-key' );
if ( '2.0.1' === $version ) {
	/**
	 * This function is used to add a widget to the dashboard.
	 */
	function add_dashboard_widgets_gallery_master() {

		wp_add_dashboard_widget(
			'gm_dashboard_widget', // Widget slug.
			'Gallery Master Statistics', // Title.
			'dashboard_widget_function_gallery_master'// Display function.
		);
	}
	/**
	 * This function is used to to output the contents of our Dashboard Widget.
	 */
	function dashboard_widget_function_gallery_master() {

		global $wpdb;
		if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/dashboard-widget.php' ) ) {
			include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/dashboard-widget.php';
		}
	}
	if ( is_admin() ) {
		/**
		 * This is used for calling a js and css backend function.
		 *
		 * @param string $hook .
		 */
		function backend_js_css_for_gallery_master( $hook ) {
			$pages_gallery_master           = array(
				'gm_wizard_gallery_master',
				'gallery_master',
				'gm_other_settings',
				'gm_add_gallery',
				'gm_sort_galleries',
				'gm_manage_albums',
				'gm_add_album',
				'gm_sort_albums',
				'gm_add_tag',
				'gm_manage_tags',
				'gm_thumbnail_layout',
				'gm_masonry_layout',
				'gm_slideshow_layout',
				'gm_image_browser_layout',
				'gm_justified_grid_layout',
				'gm_blog_style_layout',
				'gm_compact_album_layout',
				'gm_extended_album_layout',
				'gm_custom_css',
				'gm_fancy_box',
				'gm_color_box',
				'gm_foo_box_free_edition',
				'gm_nivo_lightbox',
				'gm_lightcase',
				'gm_global_options',
				'gm_filter_settings',
				'gm_lazy_load_settings',
				'gm_search_box_settings',
				'gm_order_by_settings',
				'gm_page_navigation',
				'gm_watermark_settings',
				'gm_advertisement',
				'gm_shortcodes',
				'gm_roles_and_capabilities',
				'gm_system_information',
				'post',
			);
			$datatable_pages_gallery_master = array(
				'gallery_master',
				'gm_manage_albums',
				'gm_add_gallery',
				'gm_manage_tags',
				'gm_roles_and_capabilities',
			);
			$layout_pages_gallery_master    = array(
				'gm_thumbnail_layout',
				'gm_masonry_layout',
				'gm_slideshow_layout',
				'gm_image_browser_layout',
				'gm_justified_grid_layout',
				'gm_blog_style_layout',
				'gm_compact_album_layout',
				'gm_extended_album_layout',
				'gm_custom_css',
				'gm_fancy_box',
				'gm_color_box',
				'gm_foo_box_free_edition',
				'gm_nivo_lightbox',
				'gm_lightcase',
				'gm_global_options',
				'gm_filter_settings',
				'gm_lazy_load_settings',
				'gm_search_box_settings',
				'gm_order_by_settings',
				'gm_page_navigation',
				'gm_watermark_settings',
				'gm_advertisement',
			);
			if ( strpos( $hook, 'post' ) !== false ) {
				wp_enqueue_script( 'jquery' );
				wp_enqueue_script( 'custom.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/custom/js/custom.js' );
				wp_enqueue_script( 'toastr.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/toastr/toastr.js' );
				wp_enqueue_style( 'gallery-master-custom.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/admin/layout/css/gallery-master-custom.css' );
				if ( is_rtl() ) {
					wp_enqueue_style( 'gallery-master-bootstrap.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/custom/css/custom-rtl.css' );
					wp_enqueue_style( 'tech-banker-custom-rtl.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/admin/layout/css/tech-banker-custom-rtl.css' );
				} else {
					wp_enqueue_style( 'gallery-master-bootstrap.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/custom/css/custom.css' );
					wp_enqueue_style( 'tech-banker-custom.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/admin/layout/css/tech-banker-custom.css' );
				}
				wp_enqueue_style( 'gallery-master-toastr.min.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/toastr/toastr.css' );
			}
			if ( isset( $_REQUEST['page'] ) ) {
				$page_url = sanitize_text_field( wp_unslash( $_REQUEST['page'] ) ); // WPCS: Input var ok, CSRF ok.
				if ( in_array( $page_url, $pages_gallery_master, true ) ) {
					wp_enqueue_script( 'jquery' );
					wp_enqueue_script( 'custom.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/custom/js/custom.js' );
					wp_enqueue_script( 'jquery.validate.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/validation/jquery.validate.js' );
					wp_enqueue_script( 'toastr.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/toastr/toastr.js' );
					wp_enqueue_style( 'simple-line-icons.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/icons/icons.css' );
					wp_enqueue_style( 'components.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/css/components.css' );
					wp_enqueue_style( 'gallery-master-custom.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/admin/layout/css/gallery-master-custom.css' );

					if ( is_rtl() ) {
						wp_enqueue_style( 'gallery-master-bootstrap.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/custom/css/custom-rtl.css' );
						wp_enqueue_style( 'gallery-master-layout-rtl.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/admin/layout/css/layout-rtl.css' );
						wp_enqueue_style( 'tech-banker-custom-rtl.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/admin/layout/css/tech-banker-custom-rtl.css' );
					} else {
						wp_enqueue_style( 'gallery-master-bootstrap.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/custom/css/custom.css' );
						wp_enqueue_style( 'gallery-master-layout.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/admin/layout/css/layout.css' );
						wp_enqueue_style( 'tech-banker-custom.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/admin/layout/css/tech-banker-custom.css' );
					}
					wp_enqueue_script( 'jquery.clipboard.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/clipboard/clipboard.js' );
					wp_enqueue_style( 'gallery-master-plugins.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/css/plugins.css' );
					wp_enqueue_style( 'gallery-master-default.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/admin/layout/css/themes/default.css' );
					wp_enqueue_style( 'gallery-master-toastr.min.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/toastr/toastr.css' );
					if ( in_array( $page_url, $datatable_pages_gallery_master, true ) ) {
						wp_enqueue_script( 'jquery.datatables.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/datatables/media/js/jquery.datatables.js' );
						wp_enqueue_script( 'jquery.fngetfilterednodes.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/datatables/media/js/fngetfilterednodes.js' );
						wp_enqueue_style( 'gallery-master-datatables.foundation.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/datatables/media/css/datatables.foundation.css' );
					}
					if ( in_array( $page_url, $layout_pages_gallery_master, true ) ) {
						wp_enqueue_script( 'colpick.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/colorpicker/colpick.js' );
						wp_enqueue_style( 'colpick.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/colorpicker/colpick.css' );
					}
					if ( 'gm_sort_galleries' === $page_url || 'gm_sort_albums' === $page_url ) {
						wp_enqueue_script( array( 'jquery-ui-draggable', 'jquery-ui-sortable', 'jquery-ui-dialog', 'jquery-ui-widget' ), false );
					}
				}
			}
			if ( strpos( $hook, 'gm_add_gallery' ) !== false ) {
				wp_enqueue_script( 'plupload-all' );
				wp_enqueue_script( 'jquery.ui.plupload.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/pluploader/js/jquery.ui.plupload.js', array( 'jquery-ui-draggable', 'jquery-ui-sortable', 'jquery-ui-dialog', 'jquery-ui-widget', 'jquery-ui-progressbar' ), null, true );
				wp_enqueue_style( 'jquery.ui.plupload.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/pluploader/css/jquery.ui.plupload.css' );
				wp_enqueue_style( 'jquery-ui.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/pluploader/css/jquery-ui.css' );
				wp_enqueue_script( 'bootstrap-hover-dropdown.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/custom/js/bootstrap-hover-dropdown.js' );
				wp_enqueue_script( 'bootstrap-modal.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/modal/js/bootstrap-modal.js' );
				wp_enqueue_script( 'bootstrap-modalmanager.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/modal/js/bootstrap-modalmanager.js' );
				wp_enqueue_style( 'bootstrap-modal.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/modal/css/bootstrap-modal.css' );
				wp_enqueue_style( 'bootstrap-modal-bs3patch.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/plugins/modal/css/bootstrap-modal-bs3patch.css' );
			}
		}
		add_action( 'admin_enqueue_scripts', 'backend_js_css_for_gallery_master' );
	}
	/**
	 * This function is used to get users capabilities.
	 */
	function get_users_capabilities_gallery_master() {
		global $wpdb;
		$capabilities              = $wpdb->get_var(
			$wpdb->prepare(
				'SELECT meta_value FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE meta_key = %s', 'roles_and_capabilities_settings'
			)
		);// WPCS: db call ok, no-cache ok.
		$core_roles                = array(
			'manage_options',
			'edit_plugins',
			'edit_posts',
			'publish_posts',
			'publish_pages',
			'edit_pages',
		);
		$unserialized_capabilities = maybe_unserialize( $capabilities );
		return isset( $unserialized_capabilities['capabilities'] ) ? $unserialized_capabilities['capabilities'] : $core_roles;
	}
	/**
	 * This is used for calling a sidebar menu function.
	 */
	function sidebar_menu_for_gallery_master() {
		global $wpdb, $current_user;
		$user_role_permission = get_users_capabilities_gallery_master();
		if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
			include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
		}
		if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/sidebar-menu.php' ) ) {
			include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/sidebar-menu.php';
		}
	}
	/**
	 * This function is used to call helper file for gallery master.
	 */
	function helper_file_for_gallery_master() {
		global $wpdb, $current_user;
		$user_role_permission = get_users_capabilities_gallery_master();

		if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/class-dbhelper-gallery-master.php' ) ) {
			include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/class-dbhelper-gallery-master.php';
		}
	}
	/**
	 * This function is used to register ajax for gallery master.
	 */
	function main_ajax_file_for_gallery_master() {
		global $wpdb, $current_user;
		$user_role_permission = get_users_capabilities_gallery_master();
		if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/action-library.php' ) ) {
			include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/action-library.php';
		}
	}
	/**
	 * This is used for calling a top bar menu function.
	 */
	function top_bar_menu_for_gallery_master() {
		global $wpdb, $current_user, $wp_admin_bar;
		$user_role_permission         = get_users_capabilities_gallery_master();
		$role_capabilities            = $wpdb->get_var(
			$wpdb->prepare(
				'SELECT meta_value from ' . $wpdb->prefix . 'gallery_master_meta WHERE meta_key = %s', 'roles_and_capabilities_settings'
			)
		);// WPCS: db call ok, no-cache ok.
		$role_capabilities_serialized = maybe_unserialize( $role_capabilities );
		if ( 'enable' === $role_capabilities_serialized['show_gallery_master_top_bar_menu'] ) {
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/admin-bar-menu.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/admin-bar-menu.php';
			}
		}
	}
	/**
	 * This function is used to load languages.
	 */
	function plugin_load_textdomain_gallery_master() {
		if ( function_exists( 'load_plugin_textdomain' ) ) {
			load_plugin_textdomain( 'gallery-master', false, GALLERY_MASTER_PLUGIN_DIRNAME . '/languages' );
		}
	}
	/**
	 * This function used for calling admin function fired on admin_init hook.
	 */
	function admin_functions_gallery_master() {
		helper_file_for_gallery_master();
	}
	/**
	 * This function decode url symbols into original form.
	 *
	 * @param string $string .
	 */
	function gallery_master_url_encode( $string ) {
		$entities     = array( '%21', '%2A', '%27', '%28', '%29', '%3B', '%3A', '%40', '%26', '%3D', '%2B', '%24', '%2C', '%2F', '%3F', '%25', '%23', '%5B', '%5D' );
		$replacements = array( '!', '*', "'", '(', ')', ';', ':', '@', '&', '=', '+', '$', ',', '/', '?', '%', '#', '[', ']' );
		return str_replace( $entities, $replacements, urlencode( $string ) );// @codingStandardsIgnoreLine
	}
	/**
	 * This function is used to register ajax for gallery master.
	 */
	function upload_ajax_file_for_gallery_master() {
		global $wpdb, $current_user;
		$user_role_permission = get_users_capabilities_gallery_master();
		if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/upload.php' ) ) {
			include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'lib/upload.php';
		}
	}
	/**
	 * This function is used to Parse nested shortcodes and add formatting.
	 *
	 * @param string $content .
	 */
	function parse_shortcode_content_gallery_master( $content ) {

		/* Parse nested shortcodes and add formatting. */
		$content = trim( do_shortcode( shortcode_unautop( $content ) ) );

		/* Remove '' from the start of the string. */
		if ( substr( $content, 0, 4 ) === '' ) {
			$content = substr( $content, 4 );
		}

		/* Remove '' from the end of the string. */
		if ( substr( $content, -3, 3 ) === '' ) {
			$content = substr( $content, 0, -3 );
		}

		/* Remove any instances of ''. */
		$content = str_replace( array( '<p></p>' ), '', $content );
		$content = str_replace( array( '<p>  </p>' ), '', $content );

		return $content;
	}
	/**
	 * It is used for a creating shortcode for gallery master.
	 *
	 * @param string $atts .
	 * @param string $content .
	 */
	function gallery_master_shortcode( $atts, $content ) {
		extract(// @codingStandardsIgnoreLine.
			shortcode_atts(
				array(
					'layout_type'           => '',
					'source_type'           => '',
					'id'                    => '',
					'album_type'            => '',
					'sort_images_by'        => '',
					'album_title'           => '',
					'album_description'     => '',
					'order_images_by'       => '',
					'alignment'             => '',
					'lightbox_type'         => '',
					'columns'               => '',
					'filters'               => '',
					'lazy_load'             => '',
					'search_box'            => '',
					'order_by'              => '',
					'page_navigation'       => '',
					'images_per_page'       => '',
					'gallery_title'         => '',
					'gallery_description'   => '',
					'thumbnail_title'       => '',
					'thumbnail_description' => '',
					'animation_effects'     => '',
					'special_effects'       => '',
					'auto_play'             => '',
					'time_interval'         => '',
					'next_previous_button'  => '',
					'play_pause_button'     => '',
					'slideshow_width'       => '',
					'control_buttons'       => '',
					'buttons_type'          => '',
					'slideshow_filmstrips'  => '',
					'image_browser_height'  => '',
					'image_browser_width'   => '',
					'blog_image_width'      => '',
					'row_height'            => '',
					'theme'                 => '',
					'gallery_type'          => '',
					'show_title'            => '',
					'show_desc'             => '',
					'lightbox'              => '',
				), $atts
			)
		);
		if ( ! is_feed() ) {
			if ( ! class_exists( 'SiteOrigin_Panels' ) && ! class_exists( 'ckeditor_wordpress' ) && ! class_exists( 'Tinymce_Advanced' ) ) {
				ob_start();
			}
			if ( isset( $theme ) && '' !== $theme ) {
				$source_type = 'gallery';
				switch ( $theme ) {
					case 'thumbnails':
						$layout_type = 'thumbnail_layout';
						$columns     = 3;
						break;
					case 'masonry':
						$layout_type = 'masonry_layout';
						$columns     = 3;
						break;
				}
				$gallery_title         = 'show' === $show_title || 'show' === $show_desc ? 'show' : 'hide';
				$gallery_description   = 'show' === $show_title || 'show' === $show_desc ? 'show' : 'hide';
				$thumbnail_title       = 'show' === $show_title ? 'show' : 'hide';
				$thumbnail_description = 'show' === $show_desc ? 'show' : 'hide';
				$lightbox_type         = 'enabled' === $lightbox ? 'lightcase' : '';
				switch ( $order_by ) {
					case 'random':
						$sort_images_by = 'random_order';
						break;
					case 'pic_id':
						$sort_images_by = 'image_name';
						break;
					case 'pic_name':
						$sort_images_by = 'image_name';
						break;
					case 'title':
						$sort_images_by = 'image_title';
						break;
					case 'date':
						$sort_images_by = 'upload_date';
						break;
				}
			}
			if ( isset( $_REQUEST['gallery_id'] ) && isset( $album_type ) && '' !== $album_type && isset( $_REQUEST['album_id'] ) && $_REQUEST['album_id'] === $id ) { // WPCS: CSRF ok, input var ok.
				$source_type = 'gallery';
			} elseif ( isset( $_REQUEST['gallery_id'] ) && isset( $album_type ) && '' === $album_type ) { // WPCS: CSRF ok, input var ok.
				$source_type = '';
			}
			if ( isset( $source_type ) ) {
				if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/includes/common-variables.php' ) ) {
					require GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/includes/common-variables.php';
				}
				switch ( esc_attr( $source_type ) ) {
					case 'gallery':
						if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/includes/galleries/structure.php' ) ) {
							require GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/includes/galleries/structure.php';
						}
						break;
				}
			}
			if ( class_exists( 'SiteOrigin_Panels' ) || class_exists( 'ckeditor_wordpress' ) || class_exists( 'Tinymce_Advanced' ) ) {
				$content = parse_shortcode_content_gallery_master( $content );
				return $content;
			} else {
				$gallery_master_output = ob_get_clean();
				wp_reset_query();// @codingStandardsIgnoreLine.
				return $gallery_master_output;
			}
		}
	}
	/**
	 * This function is used to call helper file for gallery master frontend.
	 */
	function helper_file_for_gallery_master_frontend() {
		global $wpdb;
		if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/lib/class-user-helper-gallery-master.php' ) ) {
			include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/lib/class-user-helper-gallery-master.php';
		}
	}
	/**
	 * This function is used to call user_functions_gallery_master.
	 */
	function user_functions_gallery_master() {
		wp_enqueue_script( 'jquery' );
		helper_file_for_gallery_master_frontend();
		plugin_load_textdomain_gallery_master();
	}
	/**
	 * This function is used for including the frontend ajax file.
	 */
	function frontend_ajax_call_gallery_master() {
		global $wpdb;
		if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/lib/frontend-ajax.php' ) ) {
			include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/lib/frontend-ajax.php';
		}
	}
	/**
	 * This function is used to create the button in pages and posts.
	 */
	function add_gallery_master_shortcode_button() {
		$add_shortcode_name = __( 'Add Gallery Master Shortcode', 'gallery-master' );
		echo '<a href="admin.php?page=gm_shortcodes" target="_blank" id="insert-gallery-master-shortcode" class="button" > <img style="width:16px; height:16px; vertical-align:middle; margin-right:3px; margin-top:5px; float:left;" src=' . esc_url( GALLERY_MASTER_PLUGIN_DIR_URL ) . 'assets/global/img/icon.png >' . esc_attr( $add_shortcode_name ) . '</a>';
	}
	/**
	 * This class is used to add widget.
	 */
	class Gallery_Master_Widget extends WP_Widget {
		/**
		 * Public Contructor.
		 */
		public function __construct() {
			parent::__construct(
				'gallery_master_widget', __( 'Gallery Master', 'gallery-master' ), array( 'description' => __( 'Display Gallery Master', 'gallery-master' ) )
			);
		}
		/**
		 * This function is used to add widget form.
		 *
		 * @param array $instance .
		 */
		public function form( $instance ) {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/includes/galleries/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/includes/galleries/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/includes/widget-form.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/includes/widget-form.php';
			}
		}
		/**
		 * This function is used to display widget.
		 *
		 * @param array $args .
		 * @param array $instance .
		 */
		public function widget( $args, $instance ) {
			extract( $args, EXTR_SKIP );// @codingStandardsIgnoreLine.
			echo $before_widget;// WPCS: XSS ok.
			$shortcode_data = empty( $instance['shortcode'] ) ? ' ' : apply_filters( 'widget_gallery_master_shortcode', $instance['shortcode'] );
			if ( ! empty( $shortcode_data ) ) {
				$shortcode = $shortcode_data;
			}
			echo do_shortcode( $shortcode );
			echo $after_widget;// WPCS: XSS ok.
		}
		/**
		 * This function is used to update widget.
		 *
		 * @param array $new_instance .
		 * @param array $old_instance .
		 */
		public function update( $new_instance, $old_instance ) {
			$instance              = $old_instance;
			$instance['shortcode'] = $new_instance['ux_txt_gallery_master_shortcode'];
			return $instance;
		}
	}
	/**
	 * This function is used for executing the code on deactivation.
	 */
	function deactivation_function_for_gallery_master() {
		delete_option( 'gallery-master-welcome-page' );
	}

	/**
	 * This function is used to add metabox content.
	 */
	function gallery_master_add_metabox_callback() {
		global $wpdb, $current_user;
		$user_role_permission = get_users_capabilities_gallery_master();
		if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . '/includes/translations.php' ) ) {
			include GALLERY_MASTER_PLUGIN_DIR_PATH . '/includes/translations.php';
		}
		if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . '/lib/shortcode.php' ) ) {
			include_once GALLERY_MASTER_PLUGIN_DIR_PATH . '/lib/shortcode.php';
		}
	}

	/**
	 * This function is used to add metabox content.
	 */
	function gallery_master_add_meta_box() {
		add_meta_box( 'gallery_master_add_metabox', __( 'Add Gallery Master	Shortcode', 'gallery-master' ), 'gallery_master_add_metabox_callback', array( 'page', 'post' ) );
	}

	// Hooks.
	/**
	 * This hook is used for calling all the Backend Functions
	 */

	add_action( 'admin_init', 'admin_functions_gallery_master' );

	/**
	 * This hook is used for calling backend ajax function
	 */

	add_action( 'wp_ajax_gallery_master_action_module', 'main_ajax_file_for_gallery_master' );

	/**
	 * This hook is used for calling upload ajax function
	 */

	add_action( 'wp_ajax_gallery_master_image_upload', 'upload_ajax_file_for_gallery_master' );

	/**
	 * This hook is used for calling a function of sidebar menu
	 */

	add_action( 'admin_menu', 'sidebar_menu_for_gallery_master' );
	add_action( 'network_admin_menu', 'sidebar_menu_for_gallery_master' );

	/**
	 * This hook is used to add metabox.
	 */
	add_action( 'add_meta_boxes', 'gallery_master_add_meta_box' );

	/**
	 * This hook is used for calling a function of top bar menu.
	 */

	add_action( 'admin_bar_menu', 'top_bar_menu_for_gallery_master', 100 );

	/**
	 * This hook is used for calling all the frontend Functions
	 */

	add_action( 'init', 'user_functions_gallery_master' );

	/**
	 * This hook is used for shortcode.
	 */

	add_shortcode( 'gallery_master', 'gallery_master_shortcode' );

	/**
	 * This hook is used for calling frontend ajax function.
	 */

	add_action( 'wp_ajax_gallery_master_frontend_ajax_call', 'frontend_ajax_call_gallery_master' );
	add_action( 'wp_ajax_nopriv_gallery_master_frontend_ajax_call', 'frontend_ajax_call_gallery_master' );

	/**
	 * This hook is used for add gallery master button.
	 */

	add_action( 'media_buttons', 'add_gallery_master_shortcode_button' );

	/**
	 * This hook is used for initiate Widget
	 */
	function register_foo_widget_gallery_master() {
		register_widget( 'Gallery_Master_Widget' );
	}
	add_action( 'widgets_init', 'register_foo_widget_gallery_master' );

	/**
	 * This hook is used for apply the shortcode for Widget.
	 */

	add_filter( 'widget_text', 'do_shortcode' );

	/**
	 * This hook is used to add widget on dashboard.
	 */

	add_action( 'wp_dashboard_setup', 'add_dashboard_widgets_gallery_master' );
}

/**
 * This hook is used to call install script
 */

register_activation_hook( __FILE__, 'install_script_for_gallery_master' );

/**
 * This hook is used for calling the function of install script.
 */

add_action( 'admin_init', 'install_script_for_gallery_master' );

/**
 * This hook is used to create link for premium Edition.
 */
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'gallery_master_action_links' );

/**
 * This function is used to add option on plugin activation.
 */
function plugin_activate_gallery_master() {
	add_option( 'gallery_master_do_activation_redirect', true );
}

/**
 * This function is used to redirect to manage maps menu.
 */
function gallery_master_redirect() {
	if ( get_option( 'gallery_master_do_activation_redirect', false ) ) {
		delete_option( 'gallery_master_do_activation_redirect' );
		wp_safe_redirect( admin_url( 'admin.php?page=gallery_master' ) );
		exit;
	}
}

/**
 * This hook is used to sets the deactivation hook for a plugin.
 */

register_deactivation_hook( __FILE__, 'deactivation_function_for_gallery_master' );

/**
 * This Hook is used for redirecting to main menu after activation.
 */

register_activation_hook( __FILE__, 'plugin_activate_gallery_master' );
add_action( 'admin_init', 'gallery_master_redirect' );

/**
 * This function is used to create the object of admin notices.
 */
function gallery_master_admin_notice_class() {
	global $wpdb;
	/**
	 * This class is used to add admin notices.
	 */
	class Gallery_Master_Admin_Notices {// @codingStandardsIgnoreLine.
		/**
		 * The $promo_link of this plugin.
		 *
		 * @access   protected
		 * @var      string    $promo_link  .
		 */
		protected $promo_link = '';
		/**
		 * This is $config variable.
		 *
		 * @access   public
		 * @var      string    $config .
		 */
		public $config;
		/**
		 * This is $notice_spam variable.
		 *
		 * @access   public
		 * @var      integer    $notice_spam .
		 */
		public $notice_spam = 0;
		/**
		 * This is $notice_spam_max variable.
		 *
		 * @access   public
		 * @var      integer    $notice_spam_max .
		 */
		public $notice_spam_max = 2;
		/**
		 * Public Constructor
		 *
		 * @param array $config .
		 */
		public function __construct( $config = array() ) {
			// Runs the admin notice ignore function incase a dismiss button has been clicked.
			add_action( 'admin_init', array( $this, 'gm_admin_notice_ignore' ) );
			// Runs the admin notice temp ignore function incase a temp dismiss link has been clicked.
			add_action( 'admin_init', array( $this, 'gm_admin_notice_temp_ignore' ) );
			add_action( 'admin_notices', array( $this, 'gm_display_admin_notices' ) );
		}
		/**
		 * Checks to ensure notices aren't disabled and the user has the correct permissions.
		 */
		public function gm_admin_notices() {
			$settings = get_option( 'gm_admin_notice' );
			if ( ! isset( $settings['disable_admin_notices'] ) || ( isset( $settings['disable_admin_notices'] ) && 0 === $settings['disable_admin_notices'] ) ) {
				if ( current_user_can( 'manage_options' ) ) {
					return true;
				}
			}
			return false;
		}
		/**
		 * Primary notice function that can be called from an outside function sending necessary variables.
		 *
		 * @param string $admin_notices .
		 */
		public function change_admin_notice_gallery_master( $admin_notices ) {
			// Check options.
			if ( ! $this->gm_admin_notices() ) {
				return false;
			}
			foreach ( $admin_notices as $slug => $admin_notice ) {
				// Call for spam protection.
				if ( $this->gm_anti_notice_spam() ) {
					return false;
				}
				// Check for proper page to display on.
				if ( isset( $admin_notices[ $slug ]['pages'] ) && is_array( $admin_notices[ $slug ]['pages'] ) ) {
					if ( ! $this->gm_admin_notice_pages( $admin_notices[ $slug ]['pages'] ) ) {
						return false;
					}
				}
				// Check for required fields.
				if ( ! $this->gm_required_fields( $admin_notices[ $slug ] ) ) {

					// Get the current date then set start date to either passed value or current date value and add interval.
					$current_date = current_time( 'm/d/Y' );
					$start        = ( isset( $admin_notices[ $slug ]['start'] ) ? $admin_notices[ $slug ]['start'] : $current_date );
					$start        = date( 'm/d/Y' );
					$interval     = ( isset( $admin_notices[ $slug ]['int'] ) ? $admin_notices[ $slug ]['int'] : 0 );
					$date         = strtotime( '+' . $interval . ' days', strtotime( $start ) );
					$start        = date( 'm/d/Y', $date );

					// This is the main notices storage option.
					$admin_notices_option = get_option( 'gm_admin_notice', array() );
					// Check if the message is already stored and if so just grab the key otherwise store the message and its associated date information.
					if ( ! array_key_exists( $slug, $admin_notices_option ) ) {
						$admin_notices_option[ $slug ]['start'] = date( 'm/d/Y' );
						$admin_notices_option[ $slug ]['int']   = $interval;
						update_option( 'gm_admin_notice', $admin_notices_option );
					}
					// Sanity check to ensure we have accurate information.
					// New date information will not overwrite old date information.
					$admin_display_check    = ( isset( $admin_notices_option[ $slug ]['dismissed'] ) ? $admin_notices_option[ $slug ]['dismissed'] : 0 );
					$admin_display_start    = ( isset( $admin_notices_option[ $slug ]['start'] ) ? $admin_notices_option[ $slug ]['start'] : $start );
					$admin_display_interval = ( isset( $admin_notices_option[ $slug ]['int'] ) ? $admin_notices_option[ $slug ]['int'] : $interval );
					$admin_display_msg      = ( isset( $admin_notices[ $slug ]['msg'] ) ? $admin_notices[ $slug ]['msg'] : '' );
					$admin_display_title    = ( isset( $admin_notices[ $slug ]['title'] ) ? $admin_notices[ $slug ]['title'] : '' );
					$admin_display_link     = ( isset( $admin_notices[ $slug ]['link'] ) ? $admin_notices[ $slug ]['link'] : '' );
					$output_css             = false;
					// Ensure the notice hasn't been hidden and that the current date is after the start date.
					if ( 0 === $admin_display_check && strtotime( $admin_display_start ) <= strtotime( $current_date ) ) {

						// Get remaining query string.
						$query_str = ( isset( $admin_notices[ $slug ]['later_link'] ) ? $admin_notices[ $slug ]['later_link'] : esc_url( add_query_arg( 'gm_admin_notice_ignore', $slug ) ) );
						if ( strpos( $slug, 'promo' ) === false ) {
							// Admin notice display output.
							echo '<div class="update-nag gb-admin-notice" style="width:95%!important;">
															 <div></div>
																<strong><p>' . $admin_display_title . '</p></strong>
																<strong><p style="font-size:14px !important">' . $admin_display_msg . '</p></strong>
																<strong><ul>' . $admin_display_link . '</ul></strong>
															</div>';// WPCS: XSS ok.
						} else {
							echo '<div class="admin-notice-promo">';
							echo $admin_display_msg;// WPCS: XSS ok.
							echo '<ul class="notice-body-promo blue">
																		' . $admin_display_link . '
																	</ul>';// WPCS: XSS ok.
							echo '</div>';
						}
						$this->notice_spam += 1;
						$output_css         = true;
					}
				}
			}
		}
		/**
		 * Spam protection check
		 */
		public function gm_anti_notice_spam() {
			if ( $this->notice_spam >= $this->notice_spam_max ) {
				return true;
			}
			return false;
		}
		/**
		 * Ignore function that gets ran at admin init to ensure any messages that were dismissed get marked.
		 */
		public function gm_admin_notice_ignore() {
			// If user clicks to ignore the notice, update the option to not show it again.
			if ( isset( $_GET['gm_admin_notice_ignore'] ) ) {// WPCS: CSRF ok, input var ok.
				$admin_notices_option = get_option( 'gm_admin_notice', array() );
				$admin_notices_option[ $_GET['gm_admin_notice_ignore'] ]['dismissed'] = 1;// WPCS: CSRF ok, input var ok, sanitization ok.
				update_option( 'gm_admin_notice', $admin_notices_option );
				$query_str = remove_query_arg( 'gm_admin_notice_ignore' );
				wp_safe_redirect( $query_str );
				exit;
			}
		}
		/**
		 * Ignore function that gets ran at admin init to ensure any messages that were dismissed get marked
		 */
		public function gm_admin_notice_temp_ignore() {
			// If user clicks to temp ignore the notice, update the option to change the start date - default interval of 14 days.
			if ( isset( $_GET['gm_admin_notice_temp_ignore'] ) ) {// WPCS: CSRF ok, input var ok.
				$admin_notices_option = get_option( 'gm_admin_notice', array() );
				$current_date         = current_time( 'm/d/Y' );
				$date_array           = explode( '/', $current_date );
				$interval             = ( isset( $_GET['int'] ) ? intval( wp_unslash( $_GET['int'] ) ) : 7 );// WPCS: CSRF ok, input var ok.
				$date                 = strtotime( '+' . $interval . ' days', strtotime( $current_date ) );
				$new_start            = date( 'm/d/Y', $date );

				$admin_notices_option[ $_GET['gm_admin_notice_temp_ignore'] ]['start']     = $new_start;// WPCS: CSRF ok, input var ok, sanitization ok.
				$admin_notices_option[ $_GET['gm_admin_notice_temp_ignore'] ]['dismissed'] = 0;// WPCS: CSRF ok, input var ok, sanitization ok.
				update_option( 'gm_admin_notice', $admin_notices_option );
				$query_str = remove_query_arg( array( 'gm_admin_notice_temp_ignore', 'int' ) );
				wp_safe_redirect( $query_str );
				exit;
			}
		}
		/**
		 * Display admin notice on pages.
		 *
		 * @param array $pages .
		 */
		public function gm_admin_notice_pages( $pages ) {
			foreach ( $pages as $key => $page ) {
				if ( is_array( $page ) ) {
					if ( isset( $_GET['page'] ) && $_GET['page'] === $page[0] && isset( $_GET['tab'] ) && $_GET['tab'] === $page[1] ) {// WPCS: CSRF ok, input var ok.
						return true;
					}
				} else {
					if ( 'all' === $page ) {
						return true;
					}
					if ( get_current_screen()->id === $page ) {
						return true;
					}
					if ( isset( $_GET['page'] ) && $page === $_GET['page'] ) {// WPCS: CSRF ok, input var ok.
						return true;
					}
				}
				return false;
			}
		}
		/**
		 * Required fields check.
		 *
		 * @param array $fields .
		 */
		public function gm_required_fields( $fields ) {
			if ( ! isset( $fields['msg'] ) || ( isset( $fields['msg'] ) && empty( $fields['msg'] ) ) ) {
				return true;
			}
			if ( ! isset( $fields['title'] ) || ( isset( $fields['title'] ) && empty( $fields['title'] ) ) ) {
				return true;
			}
			return false;
		}
		/**
		 * Display Content in admin notice.
		 */
		public function gm_display_admin_notices() {
			$two_week_review_ignore = add_query_arg( array( 'gm_admin_notice_ignore' => 'two_week_review' ) );
			$two_week_review_temp   = add_query_arg(
				array(
					'gm_admin_notice_temp_ignore' => 'two_week_review',
					'int'                         => 7,
				)
			);

			$notices['two_week_review'] = array(
				'title'      => __( 'Leave A Gallery Master Review?' ),
				'msg'        => 'We love and care about you. Gallery Master Team is putting our maximum efforts to provide you the best functionalities.<br> We would really appreciate if you could spend a couple of seconds to give a Nice Review to the plugin for motivating us!',
				'link'       => '<span class="dashicons dashicons-external gallery-master-admin-notice"></span><span class="gallery-master-admin-notice"><a href="https://wordpress.org/support/plugin/gallery-master/reviews/?filter=5" target="_blank" class="gallery-master-admin-notice-link">' . __( 'Sure! I\'d love to!', 'gb' ) . '</a></span>
												<span class="dashicons dashicons-smiley gallery-master-admin-notice"></span><span class="gallery-master-admin-notice"><a href="' . $two_week_review_ignore . '" class="gallery-master-admin-notice-link"> ' . __( 'I\'ve already left a review', 'gb' ) . '</a></span>
												<span class="dashicons dashicons-calendar-alt gallery-master-admin-notice"></span><span class="gallery-master-admin-notice"><a href="' . $two_week_review_temp . '" class="gallery-master-admin-notice-link">' . __( 'Maybe Later', 'gb' ) . '</a></span>',
				'later_link' => $two_week_review_temp,
				'int'        => 7,
			);

			$this->change_admin_notice_gallery_master( $notices );
		}
	}
	$plugin_info_gallery_master = new Gallery_Master_Admin_Notices();
}
add_action( 'init', 'gallery_master_admin_notice_class' );
/**
 * Add Pop on deactivation.
 */
function add_popup_on_deactivation_gallery_master() {
	global $wpdb;
	/**
	 * This class is used to add Pop on deactivation.
	 */
	class Gallery_Master_Deactivation_Form {// @codingStandardsIgnoreLine.
		/**
		 * Public Constructor.
		 */
		function __construct() {
			add_action( 'wp_ajax_post_user_feedback_gallery_master', array( $this, 'post_user_feedback_gallery_master' ) );
			global $pagenow;
			if ( 'plugins.php' === $pagenow ) {
					add_action( 'admin_enqueue_scripts', array( $this, 'feedback_form_js_gallery_master' ) );
					add_action( 'admin_head', array( $this, 'add_form_layout_gallery_master' ) );
					add_action( 'admin_footer', array( $this, 'add_deactivation_dialog_form_gallery_master' ) );
			}
		}
		/**
		 * Add css and js files.
		 */
		function feedback_form_js_gallery_master() {
			wp_enqueue_style( 'wp-jquery-ui-dialog' );
			wp_register_script( 'gallery-master-post-feedback', plugins_url( 'assets/global/plugins/deactivation/deactivate-popup.js', __FILE__ ), array( 'jquery', 'jquery-ui-core', 'jquery-ui-dialog' ), false, true );
			wp_localize_script( 'gallery-master-post-feedback', 'post_feedback', array( 'admin_ajax' => admin_url( 'admin-ajax.php' ) ) );
			wp_enqueue_script( 'gallery-master-post-feedback' );
		}
		/**
		 * Add css and js files.
		 */
		function post_user_feedback_gallery_master() {
			$gallery_master_deactivation_reason = isset( $_POST['reason'] ) ? wp_unslash( $_POST['reason'] ) : ''; // WPCS: Input var ok, CSRF ok, sanitization ok.
			$type                               = get_option( 'gm_welcome_gallery_master' );
			$user_admin_email                   = get_option( 'gallery-master-admin-email' );
			$plugin_info_gallery_master         = new plugin_info_gallery_master();
			global $wp_version, $wpdb;
			$url           = TECH_BANKER_STATS_URL . '/wp-admin/admin-ajax.php';
			$theme_details = array();

			if ( $wp_version >= 3.4 ) {
				$active_theme                   = wp_get_theme();
				$theme_details['theme_name']    = strip_tags( $active_theme->name );
				$theme_details['theme_version'] = strip_tags( $active_theme->version );
				$theme_details['author_url']    = strip_tags( $active_theme->{'Author URI'} );
			}

			$plugin_stat_data                     = array();
			$plugin_stat_data['plugin_slug']      = 'gallery-master';
			$plugin_stat_data['reason']           = $gallery_master_deactivation_reason;
			$plugin_stat_data['type']             = 'standard_edition';
			$plugin_stat_data['version_number']   = GALLERY_MASTER_WIZARD_VERSION_NUMBER;
			$plugin_stat_data['status']           = $type;
			$plugin_stat_data['event']            = 'de-activate';
			$plugin_stat_data['domain_url']       = site_url();
			$plugin_stat_data['wp_language']      = defined( 'WPLANG' ) && WPLANG ? WPLANG : get_locale();
			$plugin_stat_data['email']            = false !== $user_admin_email ? $user_admin_email : get_option( 'admin_email' );
			$plugin_stat_data['wp_version']       = $wp_version;
			$plugin_stat_data['php_version']      = esc_html( phpversion() );
			$plugin_stat_data['mysql_version']    = $wpdb->db_version();
			$plugin_stat_data['max_input_vars']   = ini_get( 'max_input_vars' );
			$plugin_stat_data['operating_system'] = PHP_OS . '  (' . PHP_INT_SIZE * 8 . ') BIT';
			$plugin_stat_data['php_memory_limit'] = ini_get( 'memory_limit' ) ? ini_get( 'memory_limit' ) : 'N/A';
			$plugin_stat_data['extensions']       = get_loaded_extensions();
			$plugin_stat_data['plugins']          = $plugin_info_gallery_master->get_plugin_info_gallery_master();
			$plugin_stat_data['themes']           = $theme_details;

			$response = wp_safe_remote_post(
				$url, array(
					'method'      => 'POST',
					'timeout'     => 45,
					'redirection' => 5,
					'httpversion' => '1.0',
					'blocking'    => true,
					'headers'     => array(),
					'body'        => array(
						'data'    => maybe_serialize( $plugin_stat_data ),
						'site_id' => false !== get_option( 'gm_tech_banker_site_id' ) ? get_option( 'gm_tech_banker_site_id' ) : '',
						'action'  => 'plugin_analysis_data',
					),
				)
			);
			if ( ! is_wp_error( $response ) ) {
				false !== $response['body'] ? update_option( 'gm_tech_banker_site_id', $response['body'] ) : '';
			}
				die( 'success' );
		}
		/**
		 * Add form layout of deactivation form.
		 */
		function add_form_layout_gallery_master() {
			?>
			<style type="text/css">
					.gallery-master-feedback-form .ui-dialog-buttonset {
						float: none !important;
					}
					#gallery-master-feedback-dialog-continue,#gallery-master-feedback-dialog-skip {
						float: right;
					}
					#gallery-master-feedback-cancel{
						float: left;
					}
					#gallery-master-feedback-content p {
						font-size: 1.1em;
					}
					.gallery-master-feedback-form .ui-icon {
						display: none;
					}
					#gallery-master-feedback-dialog-continue.gallery-master-ajax-progress .ui-icon {
						text-indent: inherit;
						display: inline-block !important;
						vertical-align: middle;
						animation: rotate 2s infinite linear;
					}
					#gallery-master-feedback-dialog-continue.gallery-master-ajax-progress .ui-button-text {
						vertical-align: middle;
					}
					@keyframes rotate {
						0%    { transform: rotate(0deg); }
						100%  { transform: rotate(360deg); }
					}
			</style>
			<?php
		}
		/**
		 * Add deactivation dialog form.
		 */
		function add_deactivation_dialog_form_gallery_master() {
			?>
			<div id="gallery-master-feedback-content" style="display: none;">
			<p style="margin-top:-5px"><?php echo esc_attr( __( 'We feel guilty when anyone stop using Gallery Master', 'gallery-master' ) ); ?></p>
						<p><?php echo esc_attr( __( 'If Gallery Master isn\'t working for you, others also may not', 'gallery-master' ) ); ?></p>
						<p><?php echo esc_attr( __( 'We would love to hear your feedback about what went wrong', 'gallery-master' ) ); ?></p>
						<p><?php echo esc_attr( __( 'We would like to help you in fixing the issue', 'gallery-master' ) ); ?></p>
						<p><?php echo esc_attr( __( 'If you click Continue, some data would be sent to our servers for Compatiblity Testing Purposes.', 'gallery-master' ) ); ?></p>
						<p><?php echo esc_attr( __( 'If you Skip, no data would be shared with our servers.', 'gallery-master' ) ); ?></p>
			<form>
				<?php wp_nonce_field(); ?>
				<ul id="gallery-master-deactivate-reasons">
					<li class="gallery-master-reason gallery-master-custom-input">
						<label>
							<span><input value="0" type="radio" name="reason"/></span>
							<span><?php echo esc_attr( __( 'The Plugin didn\'t work', 'gallery-master' ) ); ?></span>
						</label>
					</li>
					<li class="gallery-master-reason gallery-master-custom-input">
						<label>
							<span><input value="1" type="radio" name="reason" /></span>
							<span><?php echo esc_attr( __( 'I found a better Plugin', 'gallery-master' ) ); ?></span>
						</label>
					</li>
					<li class="gallery-master-reason">
						<label>
							<span><input value="2" type="radio" name="reason" checked /></span>
							<span><?php echo esc_attr( __( 'It\'s a temporary deactivation. I\'m just debugging an issue', 'gallery-master' ) ); ?></span>
						</label>
					</li>
					<li class="gallery-master-reason gallery-master-custom-input">
						<label>
							<span><input value="3" type="radio" name="reason" /></span>
							<span><a href="https://wordpress.org/support/plugin/gallery-master" target="_blank"><?php echo esc_attr( __( 'Open a Support Ticket for me.', 'gallery-master' ) ); ?></a></span>
						</label>
					</li>
				</ul>
			</form>
		</div>
			<?php
		}
	}
	$plugin_deactivation_details = new Gallery_Master_Deactivation_Form();
}
add_action( 'plugins_loaded', 'add_popup_on_deactivation_gallery_master' );
/**
 * Insert deactivation link.
 *
 * @param array $links .
 */
function insert_deactivate_link_id_gallery_master( $links ) {
	if ( ! is_multisite() ) {
		$links['deactivate'] = str_replace( '<a', '<a id="gallery-master-plugin-disable-link"', $links['deactivate'] );
	}
	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'insert_deactivate_link_id_gallery_master', 10, 2 );
