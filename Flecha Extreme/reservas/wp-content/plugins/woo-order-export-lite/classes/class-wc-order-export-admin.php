<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class WC_Order_Export_Admin {

	var $activation_notice_option = 'woocommerce-order-export-activation-notice-shown';
	var $step = 30;
	public static $formats = array( 'XLS', 'CSV', 'XML', 'JSON', 'TSV', 'PDF', 'HTML' );
	public static $export_types = array( 'EMAIL', 'FTP', 'HTTP', 'FOLDER', 'SFTP', 'ZAPIER' );
	public $url_plugin;
	public $path_plugin;

	protected $tabs;
	
	const last_bulk_export_results = 'woe-last-bulk-export-results';
	public static $cap_export_orders = "export_woocommerce_orders";

	public function __construct() {
		$this->url_plugin         = dirname( plugin_dir_url( __FILE__ ) ) . '/';
		$this->path_plugin        = dirname( plugin_dir_path( __FILE__ ) ) . '/';
		$this->path_views_default = dirname( plugin_dir_path( __FILE__ ) ) . "/view/";

		add_action( 'init', array( $this, 'load_textdomain' ) );

		if ( is_admin() ) { // admin actions
			add_action( 'admin_menu', array( $this, 'add_menu' ) );

			// load scripts on our pages only
			if ( isset( $_GET['page'] ) && $_GET['page'] == 'wc-order-export' ) {
				add_action( 'admin_enqueue_scripts', array( $this, 'thematic_enqueue_scripts' ) );
				add_filter( 'script_loader_src', array( $this, 'script_loader_src' ), 999, 2 );
			}

			add_action( 'wp_loaded' , function() { //init tabs after loading text domains!
				$this->tabs = $this->get_tabs();
			});
			

			add_action( 'wp_ajax_order_exporter', array( $this, 'ajax_gate' ) );

			//Add custom bulk export action in Woocomerce orders Table, modified for WP 4.7
			add_filter( 'bulk_actions-edit-shop_order', array( $this, 'export_orders_bulk_action' ) );
			add_filter( 'handle_bulk_actions-edit-shop_order', array(
				$this,
				'export_orders_bulk_action_process',
			), 10, 3 );
			add_action( 'admin_notices', array( $this, 'export_orders_bulk_action_notices' ) );

			//do once
			if ( ! get_option( $this->activation_notice_option ) ) {
				add_action( 'admin_notices', array( $this, 'display_plugin_activated_message' ) );
			}

			//extra links in >Plugins
			add_filter( 'plugin_action_links_' . WOE_PLUGIN_BASENAME, array( $this, 'add_action_links' ) );

			// Add 'Export Status' orders page column header
			add_filter( 'manage_edit-shop_order_columns', array( $this, 'add_order_status_column_header' ), 20 );
			add_filter( 'manage_edit-shop_order_sortable_columns', array( $this, 'add_order_status_sortable_columns' ) );
			add_filter( 'request', array( $this, 'add_order_status_request_query' ) );

			// Add 'Export Status' orders page column content
			add_action( 'manage_shop_order_posts_custom_column', array( $this, 'add_order_status_column_content' ) );

			// Style for 'Export Status' column
			if ( isset( $_GET['post_type'] ) && $_GET['post_type'] == 'shop_order' ) {
				add_action( 'admin_print_styles', array( $this, 'add_order_status_column_style' ) );
				add_action( 'admin_enqueue_scripts', array( $this, 'woe_add_orders_style' ) );
			}
		}

		do_action( 'woe_order_export_admin_init', $this );

		$this->settings = WC_Order_Export_Main_Settings::get_settings();

	}

	public function load_textdomain() {
		$locale = apply_filters( 'plugin_locale', get_locale(), 'woo-order-export-lite' );
		load_textdomain( 'woo-order-export-lite', WP_LANG_DIR . '/woo-order-export-lite/woo-order-export-lite' . $locale . '.mo' );
	}

	public function get_tabs() {

		$tabs = array(
			WC_Order_Export_Admin_Tab_Export_Now::get_key()         => new WC_Order_Export_Admin_Tab_Export_Now(),
			WC_Order_Export_Admin_Tab_Profiles::get_key()           => new WC_Order_Export_Admin_Tab_Profiles(),
			WC_Order_Export_Admin_Tab_Status_Change_Jobs::get_key() => new WC_Order_Export_Admin_Tab_Status_Change_Jobs(),
			WC_Order_Export_Admin_Tab_Schedule_Jobs::get_key()      => new WC_Order_Export_Admin_Tab_Schedule_Jobs(),
			WC_Order_Export_Admin_Tab_Tools::get_key()              => new WC_Order_Export_Admin_Tab_Tools(),
			WC_Order_Export_Admin_Tab_Help::get_key()               => new WC_Order_Export_Admin_Tab_Help(),
		);

		return apply_filters( 'woe_order_export_admin_tabs', $tabs );
	}

	public function add_order_status_column_header( $columns ) {
		if ( ! $this->settings['show_export_status_column'] ) {
			return $columns;
		}

		$new_columns = array();
		foreach ( $columns as $column_name => $column_info ) {
			if ( 'order_actions' === $column_name OR 'wc_actions' === $column_name ) { // Woocommerce uses wc_actions since 3.3.0
				$label                            = __( 'Export Status', 'woo-order-export-lite' );
				$new_columns['woe_export_status'] = $label;
			}
			$new_columns[ $column_name ] = $column_info;
		}

		return $new_columns;
	}

	/**
	 * Define which columns are sortable.
	 *
	 * @param array $columns Existing columns.
	 *
	 * @return array
	 */
	public function add_order_status_sortable_columns( $columns ) {
		if ( ! $this->settings['show_export_status_column'] ) {
			return $columns;
		}
		$columns['woe_export_status'] = 'woe_export_status';

		return $columns;
	}

	/**
	 * @param array $query_vars Query vars.
	 *
	 * @return array
	 */
	public function add_order_status_request_query( $query_vars ) {
		if ( isset( $query_vars['orderby'] ) ) {
			if ( 'woe_export_status' === $query_vars['orderby'] ) {
				$order      = isset( $query_vars['order'] ) ? $query_vars['order'] : 'ASC';
				$query_vars = array_merge( $query_vars, array(
					'orderby'    => array( 'meta_value_num' => $order, 'date' => 'DESC' ),
					'meta_query' => array(
						'relation' => 'OR',
						// NOT EXISTS required! Otherwise, you will not get all orders.
						array(
							'key'     => 'woe_order_exported',
							'compare' => 'NOT EXISTS',
						),
						array(
							'key'     => 'woe_order_exported',
							'compare' => 'EXISTS',
						),
					),
				) );
			}
		}

		return $query_vars;
	}

	public function add_order_status_column_content( $column ) {
		global $post;

		if ( 'woe_export_status' === $column ) {
			$is_exported = false;

			if ( get_post_meta( $post->ID, 'woe_order_exported', true ) ) {
				$is_exported = true;
			}

			if ( $is_exported ) {
				echo '<span class="dashicons dashicons-yes" style="color: #2ea2cc"></span>';
			} else {
				echo '<span class="dashicons dashicons-minus"></span>';
			}
		}
	}

	function add_order_status_column_style() {
		$css = '.widefat .column-woe_export_status { width: 45px; text-align: center; }';
		wp_add_inline_style( 'woocommerce_admin_styles', $css );
	}
	function woe_add_orders_style() {
		wp_enqueue_style( 'woe_orders_style', $this->url_plugin . 'assets/css/orders_style.css', array(), WOE_VERSION );
	}

	public function display_plugin_activated_message() {
		?>
        <div class="notice notice-success is-dismissible">
            <p><?php _e( 'Advanced Order Export For WooCommerce is available <a href="admin.php?page=wc-order-export">on this page</a>.',
					'woo-order-export-lite' ); ?></p>
        </div>
		<?php
		update_option( $this->activation_notice_option, true, false );
	}

	public function add_action_links( $links ) {
		$mylinks = array(
			'<a href="admin.php?page=wc-order-export">' . __( 'Settings', 'woo-order-export-lite' ) . '</a>',
			'<a href="https://docs.algolplus.com/order-export-docs/" target="_blank">' . __( 'Docs',
				'woo-order-export-lite' ) . '</a>',
			'<a href="https://docs.algolplus.com/support/" target="_blank">' . __( 'Support',
				'woo-order-export-lite' ) . '</a>',
		);

		return array_merge( $mylinks, $links );
	}

	public function deactivate() {
		wp_clear_scheduled_hook( "wc_export_cron_global" );
		delete_option( $this->activation_notice_option );
	}

	public function add_menu() {
		if ( apply_filters( 'woe_current_user_can_export', true ) ) {
			if ( current_user_can( 'manage_woocommerce' )  ) {
				add_submenu_page( 'woocommerce', __( 'Export Orders', 'woo-order-export-lite' ),
					__( 'Export Orders', 'woo-order-export-lite' ), "manage_woocommerce", 'wc-order-export',
					array( $this, 'render_menu' ) );
			} else // add after Sales Report!
			{
				$capability = current_user_can(self::$cap_export_orders) ? self::$cap_export_orders : 'view_woocommerce_reports';
				add_menu_page( __( 'Export Orders', 'woo-order-export-lite' ),
					__( 'Export Orders', 'woo-order-export-lite' ), $capability, 'wc-order-export',
					array( $this, 'render_menu' ), null, '55.7' );
			}
		}
	}

	/**
	 * @param string $tab
     *
     * @return bool
	 */
	protected function is_tab_exists( $tab ) {
		return isset( $this->tabs[ $tab ] );
	}

	public function render_menu() {

		$active_tab = isset( $_REQUEST['tab'] ) && $this->is_tab_exists( $_REQUEST['tab'] ) ? $_REQUEST['tab'] : $this->settings['default_tab'];
		$this->render( 'main', array(
			'WC_Order_Export' => $this,
			'ajaxurl'         => admin_url( 'admin-ajax.php' ),
			'tabs'            => $this->tabs,
			'active_tab'      => $active_tab,
		) );

		if ( isset( $this->tabs[ $active_tab ] ) ) {
			$this->tabs[ $active_tab ]->render();
		}
	}

	public function thematic_enqueue_scripts() {

		wp_enqueue_media();

		wp_enqueue_script( 'jquery-ui-datepicker' );
		wp_enqueue_script( 'jquery-ui-sortable' );
		wp_enqueue_script( 'jquery-ui-draggable' );
		wp_enqueue_script( 'jquery-touch-punch' );
		wp_enqueue_style( 'jquery-style',
			'//ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/themes/smoothness/jquery-ui.css' );

		$active_tab = isset( $_REQUEST['tab'] ) && $this->is_tab_exists( $_REQUEST['tab'] ) ? $_REQUEST['tab'] : $this->settings['default_tab'];

		$this->enqueue_select2_scripts( $active_tab );

		wp_enqueue_script( 'serializejson', $this->url_plugin . 'assets/js/jquery.serializejson.js', array( 'jquery' ), WOE_VERSION );

		// kill learn-press
		// prevent to rewrite $.fn.serializeJSON
		add_action( 'learn-press/admin/after-enqueue-scripts', function () {
			wp_scripts()->dequeue( array('learn-press-utils', 'lp-admin-learnpress', 'lp-admin') );
		},PHP_INT_MAX );
		
		wp_enqueue_style( 'export', $this->url_plugin . 'assets/css/export.css', array(), WOE_VERSION );

		wp_enqueue_style( 'woocommerce_admin_styles', WC()->plugin_url() . '/assets/css/admin.css', array() );

		$_REQUEST['tab'] = isset( $_REQUEST['tab'] ) && $this->is_tab_exists( $_REQUEST['tab'] ) ? $_REQUEST['tab'] : $this->settings['default_tab'];

		if ( isset( $_REQUEST['wc_oe'] ) AND ( strpos( $_REQUEST['wc_oe'], 'add_' ) === 0 OR strpos( $_REQUEST['wc_oe'],
					'edit_' ) === 0 ) OR $_REQUEST['tab'] == 'export' ) {

			$localize_settings_form = array(
				'add_fields_to_export'      => __( 'Add %s fields', 'woo-order-export-lite' ),
				'repeats'                   => array(
					'rows'            => __( 'rows', 'woo-order-export-lite' ),
					'columns'         => __( 'columns', 'woo-order-export-lite' ),
					'inside_one_cell' => __( 'one row', 'woo-order-export-lite' ),
				),
				'js_tpl_popup'              => array(
					'add'                      => __( 'Add', 'woo-order-export-lite' ),
					'as'                       => __( 'as', 'woo-order-export-lite' ),
					'split_values_by'          => __( 'Split values by', 'woo-order-export-lite' ),
					'fill_order_columns_label' => __( 'Fill order columns for', 'woo-order-export-lite' ),
					'for_all_rows_label'       => __( 'all rows', 'woo-order-export-lite' ),
					'for_first_row_only_label' => __( '1st row only', 'woo-order-export-lite' ),
					'grouping_by'              => array(
						'products' => __( 'Grouping by product', 'woo-order-export-lite' ),
						'coupons'  => __( 'Grouping by coupon', 'woo-order-export-lite' ),
					),
				),
				'index'                     => array(
					'product_pop_up_title' => __( 'Set up product fields', 'woo-order-export-lite' ),
					'coupon_pop_up_title'  => __( 'Set up coupon fields', 'woo-order-export-lite' ),
					'products'             => __( 'products', 'woo-order-export-lite' ),
					'coupons'              => __( 'coupons', 'woo-order-export-lite' ),
				),
				'remove_all_fields_confirm' => __( 'Remove all fields?', 'woo-order-export-lite' ),
				'reset_profile_confirm'     => __( 'This action will reset filters, settings and fields to default state. Are you sure?', 'woo-order-export-lite' ),

			);
			$settings = WC_Order_Export_Main_Settings::get_settings();

			$settings_form = array(
				'save_settings_url' => esc_url( add_query_arg(
					array(
						'page' => 'wc-order-export',
						'tab'  => $active_tab,
						'save' => 'y',
					),
					admin_url( 'admin.php' ) ) ),

				'EXPORT_NOW'          => WC_Order_Export_Manage::EXPORT_NOW,
				// TODO start - replace later
				'EXPORT_PROFILE'      => WC_Order_Export_Manage::EXPORT_PROFILE,
				'EXPORT_SCHEDULE'     => WC_Order_Export_Manage::EXPORT_SCHEDULE,
				'EXPORT_ORDER_ACTION' => WC_Order_Export_Manage::EXPORT_ORDER_ACTION,
				// end - replace later

				'copy_to_profiles_url' => esc_url( add_query_arg(
					array(
						'page'  => 'wc-order-export',
						'tab'   => 'profiles',
						'wc_oe' => 'edit_profile',
					),
					admin_url( 'admin.php' ) ) ),

				'flat_formats'   => array_map( 'strtoupper', WC_Order_Export_Engine::get_plain_formats() ),
				'object_formats' => array( 'XML', 'JSON' ),
				'xml_formats'    => array( 'XML' ),

				'day_names' => WC_Order_Export_Manage::get_days(),

				'woe_nonce'      => wp_create_nonce( 'woe_nonce' ),
				'woe_active_tab' => $active_tab,
				'settings' => $settings,
			);

			wp_enqueue_script( 'settings-form', $this->url_plugin . 'assets/js/settings-form.js', array(), WOE_VERSION );

			wp_localize_script( 'settings-form', 'settings_form', $settings_form );

			wp_localize_script( 'settings-form', 'localize_settings_form', $localize_settings_form );

			// Localize the script with new data
			$translation_array = array(
				'empty_column_name'           => __( 'empty column name', 'woo-order-export-lite' ),
				'empty_meta_key'              => __( 'empty meta key', 'woo-order-export-lite' ),
				'empty_meta_key_and_taxonomy' => __( 'select product field or taxonomy',
					'woo-order-export-lite' ),
				'empty_item_field'			  => __( 'select item field', 'woo-order-export-lite' ),
				'empty_value'                 => __( 'empty value', 'woo-order-export-lite' ),
				'empty_title'                 => __( 'Title is empty', 'woo-order-export-lite' ),
				'wrong_date_range'            => __( 'Date From is greater than Date To', 'woo-order-export-lite' ),
				'no_fields'                   => __( 'Please, set up fields to export', 'woo-order-export-lite' ),
				'no_results'                  => __( 'Nothing to export. Please, adjust your filters',
					'woo-order-export-lite' ),
				'empty'                       => __( 'empty', 'woo-order-export-lite' ),
			);

			wp_localize_script( 'settings-form', 'export_messages', $translation_array );

			wp_enqueue_script( 'woe_filters', $this->url_plugin . 'assets/js/filters.js', array(), WOE_VERSION );

			wp_enqueue_script( 'woe_buttons', $this->url_plugin . 'assets/js/buttons.js', array(), WOE_VERSION );

			wp_enqueue_script( 'woe_export_fields', $this->url_plugin . 'assets/js/export-fields.js', array(), WOE_VERSION );

			wp_enqueue_script( 'wp-color-picker' );

			wp_enqueue_style( 'wp-color-picker' );

			do_action( 'woe_thematic_enqueue_scripts_settings_form' );
		}

		do_action( 'woe_thematic_enqueue_scripts' );
	}

	private function get_select2_locale() {
		$locale          = get_locale();
		$select2_locales = array(
			'de_DE' => 'de',
			'de_CH' => 'de',
			'ru_RU' => 'ru',
			'pt_BR' => 'pt-BR',
			'pt_PT' => 'pt',
			'zh_CN' => 'zh-CN',
			'fr_FR' => 'fr',
			'es_ES' => 'es',
		);

		return isset( $select2_locales[ $locale ] ) ? $select2_locales[ $locale ] : 'en';
	}

	private function enqueue_select2_scripts( $active_tab ) {
		$settings = WC_Order_Export_Main_Settings::get_settings();
		wp_enqueue_script( 'select22', $this->url_plugin . 'assets/js/select2/select2.full.js',
			array( 'jquery' ), '4.0.3' );

		if ( $select2_locale = $this->get_select2_locale() ) {
			// enable by default
			if ( $select2_locale !== 'en' ) {
				wp_enqueue_script( "select22-i18n-{$select2_locale}",
					$this->url_plugin . "assets/js/select2/i18n/{$select2_locale}.js", array( 'jquery', 'select22' ) );
			}
		}

		wp_enqueue_script( 'select2-i18n', $this->url_plugin . 'assets/js/select2-i18n.js', array(
			'jquery',
			'select22',
		), WOE_VERSION );

		$script_data = array(
			'locale'                    => get_locale(),
			'select2_locale'            => $this->get_select2_locale(),
			'active_tab'                => $active_tab,
			'show_all_items_in_filters' => isset( $settings['show_all_items_in_filters'] ) ? $settings['show_all_items_in_filters'] : false,
		);

		wp_localize_script( 'select2-i18n', 'script_data', $script_data );

		wp_enqueue_style( 'select2-css', $this->url_plugin . 'assets/css/select2/select2.min.css',
			array(), WC_VERSION );
	}

	public function script_loader_src( $src, $handle ) {
		// don't load ANY select2.js / select2.min.js  and OUTDATED select2.full.js
		if ( ! preg_match( '/\/select2\.full\.js\?ver=[1-3]/', $src ) && ! preg_match( '/\/select2\.min\.js/',
				$src ) && ! preg_match( '/\/select2\.js/', $src )
		     && ! preg_match( '#jquery\.serialize-object\.#', $src )  /*this script breaks our json!*/
		) {
			return $src;
		}

		return "";
	}

	public function render( $view, $params = array(), $path_views = null ) {
		$params = apply_filters( 'woe_render_params', $params );
		$params = apply_filters( 'woe_render_params_' . $view, $params );

		extract( $params );
		if ( $path_views ) {
			include $path_views . "$view.php";
		} else {
			include $this->path_views_default . "$view.php";
		}
	}

	// AJAX part
	// calls ajax_action_XXXX
	public function ajax_gate() {

		if( !current_user_can('view_woocommerce_reports')  AND !current_user_can(self::$cap_export_orders) ){
			die( __( 'You can not do it', 'woo-order-export-lite' ) );
		}

		if ( ! isset( $_REQUEST['method'] ) ) {
			die( __( 'Empty method', 'woo-order-export-lite' ) );
		}

		$method = 'ajax_' . $_REQUEST['method'];
		$tab = isset( $_REQUEST['tab'] ) && $this->is_tab_exists( $_REQUEST['tab'] ) ? $_REQUEST['tab'] : false;

		do_action( 'woe_order_export_admin_ajax_gate_before');

		if ( ! isset( $this->tabs[ $tab ] ) ) {
			$ajax_handler = apply_filters( 'woe_global_ajax_handler', new WC_Order_Export_Ajax() );
			if ( ! method_exists( $ajax_handler, $method ) ) {
				die( sprintf( __( 'Unknown AJAX method %s', 'woo-order-export-lite' ), $method) );
			}

			$ajax_handler->$method();
			die();
		}

		if ( ! method_exists( $this->tabs[ $tab ], $method ) ) {
			die( sprintf( __( 'Unknown tab method %s', 'woo-order-export-lite' ), $method) );
		}

		if ( $_POST && ! check_admin_referer( 'woe_nonce', 'woe_nonce' ) ) {
			die( __( 'Wrong nonce', 'woo-order-export-lite' ) );
		}

		$_POST = stripslashes_deep( $_POST );

		// parse json to arrays?
		if ( ! empty( $_POST['json'] ) ) {
			$json = json_decode( $_POST['json'], true );
			if ( is_array( $json ) ) {
				// add $_POST['settings'],$_POST['orders'],$_POST['products'],$_POST['coupons']
				$_POST = $_POST + $json;
				unset( $_POST['json'] );
			}
		}

		$this->tabs[ $tab ]->$method();

		die();
	}

	//Works since Wordpress 4.7
	function export_orders_bulk_action( $actions ) {
		$settings = WC_Order_Export_Manage::get( WC_Order_Export_Manage::EXPORT_NOW );
		WC_Order_Export_Manage::set_correct_file_ext( $settings );

		// default
		if ( ! empty( $settings['format'] ) ) {
			$actions['woe_export_selected_orders'] = sprintf( __( 'Export as %s', 'woo-order-export-lite' ),
				$settings['format'] );
		}

		// mark/unmark
		if ( $this->settings['show_export_actions_in_bulk'] ) {
			$actions['woe_mark_exported']   = __( 'Mark exported', 'woo-order-export-lite' );
			$actions['woe_unmark_exported'] = __( 'Unmark exported', 'woo-order-export-lite' );
		}

		return $actions;
	}

	function export_orders_bulk_action_process( $redirect_to, $action, $ids ) {
		$new_redirect_to = false;
		switch ( $action ) {
			case 'woe_export_selected_orders':
				$new_redirect_to = admin_url( 'admin-ajax.php' ) . "?action=order_exporter&method=export_download_bulk_file&export_bulk_profile=now&ids=" . join( ',', $ids );
				break;
			case 'woe_mark_exported':
				foreach ( $ids as $post_id ) {
					update_post_meta( $post_id, 'woe_order_exported', 1 );
				}
				$new_redirect_to = add_query_arg( array(
					'woe_bulk_mark_exported'   => count( $ids ),
					'woe_bulk_unmark_exported' => false,
				), $redirect_to );
				break;
			case 'woe_unmark_exported':
				foreach ( $ids as $post_id ) {
					delete_post_meta( $post_id, 'woe_order_exported' );
				}
				$new_redirect_to = add_query_arg( array(
					'woe_bulk_mark_exported'   => false,
					'woe_bulk_unmark_exported' => count( $ids ),
				), $redirect_to );
				break;
		}

		if ( $new_redirect_to ) {
			wp_redirect( $new_redirect_to );
			exit();
        }

		return $redirect_to;
	}

	function export_orders_bulk_action_notices() {

		global $post_type, $pagenow;

		if ( $pagenow == 'edit.php' && $post_type == 'shop_order' && isset( $_REQUEST['woe_bulk_mark_exported'] ) ) {
			$count = intval( $_REQUEST['woe_bulk_mark_exported'] );
			printf(
				'<div id="message" class="updated fade">' .
				_n( '%s order marked.', '%s orders marked.', $count, 'woo-order-export-lite' )
				. '</div>',
				$count
			);

		} else if ( $pagenow == 'edit.php' && $post_type == 'shop_order' && isset( $_REQUEST['woe_bulk_unmark_exported'] ) ) {
			$count = intval( $_REQUEST['woe_bulk_unmark_exported'] );
			printf(
				'<div id="message" class="updated fade">' .
				_n( '%s order unmarked.', '%s orders unmarked.', $count, 'woo-order-export-lite' )
				. '</div>',
				$count
			);
		} else {
			$logs = get_transient( WC_Order_Export_Admin::last_bulk_export_results );
			if ( $logs ) {
				delete_transient( WC_Order_Export_Admin::last_bulk_export_results );
				echo "<div id=\"notice-orders\" class=\"notice notice-info is-dismissible\" style=\"padding: 15px\">{$logs}</div>";
			}
		}
		
	}

	function must_run_ajax_methods() {
		// wait admin ajax!
		$script_name = ! empty( $_SERVER['SCRIPT_NAME'] ) ? $_SERVER['SCRIPT_NAME'] : $_SERVER['PHP_SELF'];
		if ( basename( $script_name ) != "admin-ajax.php" ) {
			return false;
		}

		// our method MUST BE called
		return isset( $_REQUEST['action'] ) AND ( $_REQUEST['action'] == "order_exporter" OR $_REQUEST['action'] == "order_exporter_run" );
	}

	public static function user_can_add_custom_php() {
		return apply_filters( 'woe_user_can_add_custom_php', current_user_can( 'edit_themes' ) );
	}

}
