<?php

if (!defined('ABSPATH'))
    exit;

class AWCFE_Backend
{

    /**
     * @var    object
     * @access  private
     * @since    1.0.0
     */
    private static $_instance = null;

    /**
     * The version number.
     * @var     string
     * @access  public
     * @since   1.0.0
     */
    public $_version;

    /**
     * The token.
     * @var     string
     * @access  public
     * @since   1.0.0
     */
    public $_token;

    /**
     * The main plugin file.
     * @var     string
     * @access  public
     * @since   1.0.0
     */
    public $file;

    /**
     * The main plugin directory.
     * @var     string
     * @access  public
     * @since   1.0.0
     */
    public $dir;

    /**
     * The plugin assets directory.
     * @var     string
     * @access  public
     * @since   1.0.0
     */
    public $assets_dir;

    /**
     * Suffix for Javascripts.
     * @var     string
     * @access  public
     * @since   1.0.0
     */
    public $script_suffix;

    /**
     * The plugin assets URL.
     * @var     string
     * @access  public
     * @since   1.0.0
     */
    public $assets_url;
    public $hook_suffix = array();
    public $plugin_slug;

    /**
     * Constructor function.
     * @access  public
     * @since   1.0.0
     * @return  void
     */
    public function __construct($file = '', $version = '1.0.0')
    {
        $this->_version = $version;
        $this->_token = AWCFE_TOKEN;
        $this->file = $file;
        $this->dir = dirname($this->file);
        $this->assets_dir = trailingslashit($this->dir) . 'assets';
        $this->assets_url = esc_url(trailingslashit(plugins_url('/assets/', $this->file)));

        $this->plugin_slug = 'abc';

        $this->script_suffix = defined('SCRIPT_DEBUG') && SCRIPT_DEBUG ? '' : '.min';


        register_activation_hook($this->file, array($this, 'install'));

        add_action('admin_menu', array($this, 'register_root_page'),999);
        add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'), 10, 1);
        add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_styles'), 10, 1);

        add_filter('woocommerce_admin_billing_fields', array($this, 'admin_billing_fields'), 15, 1);
        add_filter('woocommerce_admin_shipping_fields', array($this, 'admin_shipping_fields'), 15, 1);

        add_action( '‌woocommerce_before_order_object_save', array($this, 'before_order_object_save'), 10, 2);

        // add_action('pll_init', array($this, 'pll_init')); // poly lang inits

        $plugin = plugin_basename($this->file);
        add_filter("plugin_action_links_$plugin", array($this, 'add_settings_link'));

        add_action('init', array($this, 'awcfe_init'));
        add_action('admin_notices', array($this, 'awcfe_admin_notices'));
        add_action('admin_head', array($this, 'awcfe_notification_scripting'));
        add_action('wp_ajax_nopriv_awcfe_rating', array($this, 'awcfe_rating') );
        add_action('wp_ajax_awcfe_rating', array($this, 'awcfe_rating') );

    }



    public function before_order_object_save($order, $ata_store){
        // $order
        $ata_store;
    }
    /**
     *
     *
     * Ensures only one instance of WCPA is loaded or can be loaded.
     *
     * @since 1.0.0
     * @static
     * @see WordPress_Plugin_Template()
     * @return Main WCPA instance
     */
    public static function instance($file = '', $version = '1.0.0')
    {
        if (is_null(self::$_instance)) {
            self::$_instance = new self($file, $version);
        }
        return self::$_instance;
    }


    public function admin_billing_fields($billing_fields)
    {

        return $this->admin_order_fields($billing_fields, 'billing');
    }

    public function admin_order_fields($billing_fields, $section)
    {

        global $post;
        $order_id = $post->ID;
        $order   = $order_id ? wc_get_order( $order_id ) : null;
        $meta_data = get_post_meta($order_id, AWCFE_ORDER_META_KEY, true);

        if (isset($meta_data[$section]) && is_array($meta_data[$section])) {
            foreach ($meta_data[$section] as $v) {
                if (!in_array($v['type'], ['paragraph', 'header'])) {

                    $billing_fields[str_replace($section.'_','',$v['name'])] = array(
                        'label' => $v['label'],
//                        'id' => $v['name'],
                        'show' => true
//                        'value' => $v['value'],
                    );
                }
            }
        }
        return $billing_fields;
    }

    public function admin_shipping_fields($billing_fields)
    {

        return $this->admin_order_fields($billing_fields, 'shipping');
    }

    public function register_root_page()
    {

        $this->hook_suffix[] = add_submenu_page(
            'woocommerce',
            __('WooCommerce Checkout Fields Editor', 'checkout-field-editor-and-manager-for-woocommerce'),
            __('Checkout Fields', 'checkout-field-editor-and-manager-for-woocommerce'),
            'manage_woocommerce',
            'awcfe_admin_ui',
            array($this, 'admin_ui')
        );
    }

    public function admin_ui()
    {
        AWCFE_Backend::view('admin-root', []);
    }

    public function add_settings_link($links)
    {
        $settings = '<a href="' . admin_url('admin.php?page=awcfe_admin_ui#/') . '">' . __('Checkout Fields','checkout-field-editor-and-manager-for-woocommerce') . '</a>';
        array_push($links, $settings);
        return $links;
    }

    /**
     *    Create post type forms
     */

    static function view($view, $data = array())
    {
        extract($data);
        include(plugin_dir_path(__FILE__) . 'views/' . $view . '.php');
    }


    /**
     * Load admin CSS.
     * @access  public
     * @since   1.0.0
     * @return  void
     */
    public function admin_enqueue_styles($hook = '')
    {
        wp_register_style($this->_token . '-admin', esc_url($this->assets_url) . 'css/backend.css', array(), $this->_version);
        wp_enqueue_style($this->_token . '-admin');
    }

    /**
     * Load admin Javascript.
     * @access  public
     * @since   1.0.0
     * @return  void
     */
    public function admin_enqueue_scripts($hook = '')
    {
        if (!isset($this->hook_suffix) || empty($this->hook_suffix)) {
            return;
        }


        $screen = get_current_screen();

        wp_enqueue_script('jquery');

        if (in_array($screen->id, $this->hook_suffix)) {
            $ml = new AWCFE_Ml();
            if (!wp_script_is('wp-i18n', 'registered')) {
                wp_register_script('wp-i18n', esc_url($this->assets_url) . 'js/i18n.min.js', array('jquery'), $this->_version, true);
            }


            wp_enqueue_script($this->_token . '-backend', esc_url($this->assets_url) . 'js/backend.js', array('wp-i18n'), $this->_version, true);
            wp_localize_script($this->_token . '-backend', 'awcfe_object', array(
                    'api_nonce' => wp_create_nonce('wp_rest'),
                    'root' => rest_url('awcfe/v1/'),
                    'isMlActive' => $ml->is_active(),
                    'ml' => $ml->is_active() ? [
                        'currentLang' => $ml->current_language(),
                        'isDefault' => $ml->is_default_lan() ? $ml->is_default_lan() : (($ml->current_language() === 'all') ? true : false)
                    ] : false,

                )
            );

        }


    }


    /**
     * Cloning is forbidden.
     *
     * @since 1.0.0
     */
    public function __clone()
    {
        _doing_it_wrong(__FUNCTION__, __('Cheatin&#8217; huh?'), $this->_version);
    }

    /**
     * Unserializing instances of this class is forbidden.
     *
     * @since 1.0.0
     */
    public function __wakeup()
    {
        _doing_it_wrong(__FUNCTION__, __('Cheatin&#8217; huh?'), $this->_version);
    }

    /**
     * Installation. Runs on activation.
     * @access  public
     * @since   1.0.0
     * @return  void
     */
    public function install()
    {
        $this->_log_version_number();

    }

    /**
     * Log the plugin version number.
     * @access  public
     * @since   1.0.0
     * @return  void
     */
    private function _log_version_number()
    {
        update_option($this->_token . '_version', $this->_version);
    }

    // public function pll_init()
    // {
    //     $ml = new AWCFE_Ml();
    //     if ($ml->is_active()) {
    //         $ml->settings_to_ml_poly();
    //     }
    //
    // }

	/* Admin notice */

	    public function awcfe_init(){

        if ( false === get_option('awcfe_install_date') ){
           add_option('awcfe_install_date', date("d-m-Y"), '', 'yes');
        }

      }

	  public function awcfe_admin_notices(){

			$screen = get_current_screen();
			if ($screen->id === 'dashboard' || $screen->id === 'woocommerce_page_awcfe_admin_ui'){
        if(!isset($_COOKIE['awcfeShowRating'])){
          if ( get_option('awcfe_rate_us') === false || get_option('awcfe_rate_us') == '' ){
             if ( get_option('awcfe_install_date') != '' ){
               $setDate = strtotime(get_option('awcfe_install_date'));
               $curDate = strtotime(date("d-m-Y"));
               if($curDate > $setDate){

        			    echo $this->awcfe_display_notices();
                  //update_option('awcfe_rate_us', 'yes');
                  //setcookie('awcfeShowRating','yes', time() + 86400);
              }
            }
          }
        }
			}
		}

    public function awcfe_display_notices(){
      $msg = '<div id="awcfe_notice" class="notice notice-info is-dismissible">
        <div class="awcfe-notice-info">
          <h3> Enjoy using Checkout Field Editor and Manager for WooCommerce plugin? </h3>
          <p> We\'ve worked tirelessly to make this the best plugin - not only in terms of its functionality but also with its design and UX - and we hope you\'re enjoying it. If you think that we deserve a kudos for this, <strong>please do rate us on WordPress</strong>, which would really motivate us to make this even better with more exciting features. Thanks! </p>
          <div>
            <a class="awcfe-notice-link desrve" data-item="deserve" href="https://wordpress.org/support/plugin/checkout-field-editor-and-manager-for-woocommerce/reviews/?filter=5#new-post" target="_blank" ><span class="dashicons dashicons-smiley"></span> Ok, you deserve it</a>
            <a href="#" class="awcfe-notice-link do-dismiss-notice" data-item="later" ><span class="thumbs-down"></span> Nope, maybe later</a>
            <a href="#" class="awcfe-notice-link do-accept-notice" data-item="already" ><span class="thumbs-up"></span> I already did</a>

            </div>
        </div>
        <div  class="awcfe-notice-img">
        </div>
      </div>';
      return $msg;
    }

	function awcfe_notification_scripting(){
		$screen = get_current_screen();
		if ($screen->id === 'dashboard' || $screen->id === 'woocommerce_page_awcfe_admin_ui'){
		?>
		<script>
    jQuery(document).on('click', '.awcfe-notice-link', function (e) {
        e.preventDefault();
        var item = jQuery(this).data('item');
        jQuery.ajax({
          type: "POST",
          url: "<?php echo admin_url('admin-ajax.php'); ?>",
          data: {item:item, 'action': 'awcfe_rating',},
          success: function(result){}
        });
        //if( item == 'later' || item == 'already' ){
          jQuery(this).parent().parent('.awcfe-notice-info').siblings('.notice-dismiss').trigger('click');
        //}
        if( item == 'deserve' ){
          var url = jQuery(this).attr('href');
          window.open(url, '_blank');
        }
    });
		</script>
		<?php
		}
	}

  function awcfe_rating(){

    if( isset($_POST['item']) ){
      $item = $_POST['item'];
      if( $item == 'deserve' ){
        update_option('awcfe_rate_us', 'yes');
      } else if( $item == 'later' ){
        setcookie('awcfeShowRating','yes', time() + 86400);
      } else if( $item == 'already' ){
        update_option('awcfe_rate_us', 'yes');
      }
    }
    die(0);

  }

	/* Admin notice */


}
