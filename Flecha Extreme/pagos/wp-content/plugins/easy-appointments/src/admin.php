<?php

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * Admin panel
 */
class EAAdminPanel
{
    protected $compatibility_mode;

    /**
     * @var EAOptions
     */
    protected $options;

    /**
     * @var EALogic
     */
    protected $logic;

    /**
     * @var EADBModels
     */
    protected $models;

    /**
     * @var EADateTime
     */
    protected $datetime;

    /**
     * EAAdminPanel constructor.
     * @param EAOptions $options
     * @param EALogic $logic
     * @param EADBModels $models
     * @param EADateTime $datetime
     */
    function __construct($options, $logic, $models, $datetime)
    {
        $this->options = $options;
        $this->logic = $logic;
        $this->models = $models;
        $this->datetime = $datetime;
    }

    /**
     * Init action callbacks
     */
    public function init()
    {
        // Hook for adding admin menus
        add_action('admin_menu', array($this, 'add_menu_pages'));

        // Init action
        add_action('admin_init', array($this, 'init_scripts'));
        //add_action( 'admin_enqueue_scripts', array( $this, 'init' ) );
    }

    /**
     * Init of admin page
     */
    public function init_scripts()
    {
        // admin panel script
        wp_register_script(
            'ea-compatibility-mode',
            EA_PLUGIN_URL . 'js/backbone.sync.fix.js',
            array('backbone'),
            EASY_APPOINTMENTS_VERSION,
            true
        );

        // admin panel script
        wp_register_script(
            'time-picker-i18n',
            EA_PLUGIN_URL . 'js/libs/jquery-ui-timepicker-addon-i18n.js',
            array('jquery', 'time-picker'),
            EASY_APPOINTMENTS_VERSION,
            true
        );

        // bootstrap script
        wp_register_script(
            'ea-momentjs',
            EA_PLUGIN_URL . 'js/libs/moment.min.js',
            array(),
            EASY_APPOINTMENTS_VERSION,
            true
        );

        // admin panel script
        wp_register_script(
            'time-picker',
            EA_PLUGIN_URL . 'js/libs/jquery-ui-timepicker-addon.js',
            array('jquery', 'jquery-ui-datepicker'),
            EASY_APPOINTMENTS_VERSION,
            true
        );

        // admin panel script
        wp_register_script(
            'jquery-chosen',
            EA_PLUGIN_URL . 'js/libs/chosen.jquery.min.js',
            array('jquery'),
            EASY_APPOINTMENTS_VERSION,
            true
        );

        // vacation panel script
        wp_register_script(
            'ea-vacation',
            EA_PLUGIN_URL . 'js/bundle.js',
            array('jquery', 'wp-api', 'wp-i18n'),
            EASY_APPOINTMENTS_VERSION,
            true
        );

        // vacation style
        wp_register_style(
            'ea-vacation-css',
            EA_PLUGIN_URL . 'css/theme/main.css',
            array(),
            EASY_APPOINTMENTS_VERSION
        );

        // admin panel script
        wp_register_script(
            'ea-settings',
            EA_PLUGIN_URL . 'js/admin.prod.js',
            array(
                'jquery',
                'ea-momentjs',
                'jquery-ui-datepicker',
                'ea-datepicker-localization',
                'time-picker',
                'backbone',
                'underscore',
                'jquery-ui-sortable',
                'jquery-chosen',
                'wp-api',
                'thickbox'
            ),
            EASY_APPOINTMENTS_VERSION,
            true
        );

        // appointments panel script
        wp_register_script(
            'ea-appointments',
            EA_PLUGIN_URL . 'js/settings.prod.js',
            array(
                'jquery',
                'ea-momentjs',
                'jquery-ui-datepicker',
                'ea-datepicker-localization',
                'time-picker',
                'backbone',
                'underscore'
            ),
            EASY_APPOINTMENTS_VERSION,
            true
        );

        // report panel script
        wp_register_script(
            'ea-report',
            EA_PLUGIN_URL . 'js/report.prod.js',
            array('jquery', 'time-picker', 'ea-datepicker-localization', 'backbone', 'underscore'),
            EASY_APPOINTMENTS_VERSION,
            true
        );

        wp_register_script(
            'ea-datepicker-localization',
            EA_PLUGIN_URL . 'js/libs/jquery-ui-i18n.min.js',
            array('jquery'),
            EASY_APPOINTMENTS_VERSION,
            true
        );

        wp_register_script(
            'ea-tinymce',
            EA_PLUGIN_URL . 'js/libs/mce.plugin.code.min.js',
            array('tinymce_js'),
            EASY_APPOINTMENTS_VERSION,
            true
        );

        // admin style
        wp_register_style(
            'ea-admin-css',
            EA_PLUGIN_URL . 'css/admin.css',
            array(),
            EASY_APPOINTMENTS_VERSION
        );

        // admin style
        wp_register_style(
            'jquery-chosen',
            EA_PLUGIN_URL . 'css/chosen.min.css',
            array(),
            EASY_APPOINTMENTS_VERSION
        );


        // report style
        wp_register_style(
            'ea-report-css',
            EA_PLUGIN_URL . 'css/report.css',
            array(),
            EASY_APPOINTMENTS_VERSION
        );

        // admin style
        wp_register_style(
            'ea-admin-awesome-css',
            EA_PLUGIN_URL . 'css/font-awesome.css',
            array(),
            EASY_APPOINTMENTS_VERSION
        );

        // admin style
        wp_register_style(
            'time-picker',
            EA_PLUGIN_URL . 'css/jquery-ui-timepicker-addon.css',
            array(),
            EASY_APPOINTMENTS_VERSION
        );

        wp_register_style(
            'jquery-style',
            EA_PLUGIN_URL . 'css/jquery-ui.css',
            array(),
            EASY_APPOINTMENTS_VERSION
        );

        // custom fonts
        wp_register_style(
            'ea-admin-fonts-css',
            EA_PLUGIN_URL . 'css/fonts.css',
            array(),
            EASY_APPOINTMENTS_VERSION
        );

    }

    /**
     * Adds required JS
     */
    public function add_settings_js()
    {
        $this->compatibility_mode = $this->options->get_option_value('compatibility.mode', 0);

        if (!empty($this->compatibility_mode)) {
            wp_enqueue_script('ea-compatibility-mode');
        }

        // we need tinyMce for WYSIWYG editor
        wp_enqueue_script('tinymce_js', includes_url( 'js/tinymce/' ) . 'wp-tinymce.php', array( 'jquery' ), false, true );
        wp_enqueue_script('ea-tinymce');
        wp_enqueue_style('ea-editor-style', includes_url('/css/editor.min.css'));

//        wp_enqueue_script( 'time-picker-i18n' );
        wp_enqueue_script('ea-settings');

        wp_enqueue_style('ea-admin-css');
        wp_enqueue_style('jquery-style');
        wp_enqueue_style('time-picker');
        wp_enqueue_style('ea-admin-awesome-css');
        wp_enqueue_style('thickbox');
        wp_enqueue_style('jquery-chosen');
        wp_enqueue_style('ea-admin-fonts-css');
        

        // style editor

    }

    /**
     * Adds required JS
     */
    public function add_appointments_js()
    {
        $this->compatibility_mode = $this->options->get_option_value('compatibility.mode', 0);

        if (!empty($this->compatibility_mode)) {
            wp_enqueue_script('ea-compatibility-mode');
        }

        wp_enqueue_script('ea-appointments');
        wp_enqueue_style('ea-admin-css');
        wp_enqueue_style('jquery-style');
        wp_enqueue_style('time-picker');
        wp_enqueue_style('ea-admin-awesome-css');
    }

    /**
     * JS for report admin page
     */
    public function add_report_js()
    {
        if (!empty($this->compatibility_mode)) {
            wp_enqueue_script('ea-compatibility-mode');
        }

        wp_enqueue_script('ea-report');
        wp_enqueue_script('jquery-ui-datepicker');
        wp_enqueue_style('ea-admin-awesome-css');
        wp_enqueue_style('ea-report-css');
        wp_enqueue_style('jquery-style');
        wp_enqueue_style('ea-admin-fonts-css');
    }

    /**
     * create menu structure
     */
    public function add_menu_pages()
    {
        // top_level_menu
        add_menu_page(
            'Easy Appointments',
            'Easy Appointments',
            'edit_posts',
            'easy_app_top_level',
            null,
            'dashicons-calendar-alt',
            '10.842015'
        );

        // Rename first
        $page_app_suffix = add_submenu_page(
            'easy_app_top_level',
            __('Appointments', 'easy-appointments'),
            __('Appointments', 'easy-appointments'),
            'edit_posts',
            'easy_app_top_level',
            array($this, 'top_level_appointments')
        );

        // locations page
        $page_location_suffix = add_submenu_page(
            'easy_app_top_level',
            __('Locations', 'easy-appointments'),
            '1. ' . __('Locations', 'easy-appointments'),
            'manage_options',
            'easy_app_locations',
            array($this, 'locations_page')
        );

        // services
        $page_services_suffix = add_submenu_page(
            'easy_app_top_level',
            __('Services', 'easy-appointments'),
            '2. ' . __('Services', 'easy-appointments'),
            'manage_options',
            'easy_app_services',
            array($this, 'services_page')
        );

        // Workers
        $page_worker_suffix = add_submenu_page(
            'easy_app_top_level',
            __('Employees', 'easy-appointments'),
            '3. ' . __('Employees', 'easy-appointments'),
            'manage_options',
            'easy_app_workers',
            array($this, 'workers_page')
        );

        // settings
        $page_settings_suffix = add_submenu_page(
            'easy_app_top_level',
            __('Settings', 'easy-appointments'),
            '4. ' . __('Settings', 'easy-appointments'),
            'manage_options',
            'easy_app_settings',
            array($this, 'top_settings_menu')
        );

        // vacation page
        $page_vacation_suffix = add_submenu_page(
            'easy_app_top_level',
            __('Vacation', 'easy-appointments'),
            __('Vacation', 'easy-appointments'),
            'manage_options',
            'easy_app_vacation',
            array($this, 'vacation_page')
        );

        // Overview - report
        $page_report_suffix = add_submenu_page(
            'easy_app_top_level',
            __('Overview', 'easy-appointments'),
            __('Reports', 'easy-appointments'),
            'manage_options',
            'easy_app_reports',
            array($this, 'reports_page')
        );

        add_action('load-' . $page_settings_suffix, array($this, 'add_settings_js'));
        add_action('load-' . $page_app_suffix, array($this, 'add_appointments_js'));
        add_action('load-' . $page_report_suffix, array($this, 'add_report_js'));
    }

    /**
     * Content of appointments admin page
     */
    public function top_level_appointments()
    {

        // check if APS tags are on
        if ($this->is_asp_tags_are_on()) {
            require_once EA_SRC_DIR . 'templates/asp_tag_message.tpl.php';
            return;
        }

        $settings = $this->options->get_options();

        $settings['date_format'] = $this->datetime->convert_to_moment_format(get_option('date_format', 'F j, Y'));

        wp_localize_script('ea-appointments', 'ea_settings', $settings);
        wp_localize_script('ea-appointments', 'ea_app_status', $this->logic->getStatus());
        wp_localize_script('ea-appointments', 'ea_connections', $this->models->get_connections_combinations());

        $screen = get_current_screen();
        $screen->add_help_tab(array(
            'id'    => 'easyapp_settings_help'
        , 'title'   => 'Appointments manager'
        , 'content' => '<p>Use filter for date to reduce output results for appointments. You can filter by <b>location</b>, <b>service</b>, <b>worker</b>, <b>status</b> and <b>date</b>.</p>'
        ));

        $screen->set_help_sidebar('<a href="https://easy-appointments.net/documentation/">More info!</a>');

        require_once EA_SRC_DIR . 'templates/appointments.tpl.php';
        require_once EA_SRC_DIR . 'templates/inlinedata.sorted.tpl.php';
    }

    /**
     * Content of top menu page
     */
    public function reports_page()
    {
        // check if APS tags are on
        if ($this->is_asp_tags_are_on()) {
            require_once EA_SRC_DIR . 'templates/asp_tag_message.tpl.php';
            return;
        }

        $settings = $this->options->get_options();
        wp_localize_script('ea-report', 'ea_settings', $settings);

        $screen = get_current_screen();
        $screen->add_help_tab(array(
            'id'    => 'easyapp_settings_help'
        , 'title'   => 'Time table'
        , 'content' => '<p>Time table report shows free slots for every location - service - worker connection on whole month</p>' .
                '<p>There can you see free times an how many slots are taken.</p>'
        ));

        $screen->set_help_sidebar('<a href="https://easy-appointments.net/documentation/">More info!</a>');

        require_once EA_SRC_DIR . 'templates/report.tpl.php';
        require_once EA_SRC_DIR . 'templates/inlinedata.tpl.php';
    }

    /**
     * Content of top menu page
     */
    public function top_settings_menu()
    {
        // check if APS tags are on
        if ($this->is_asp_tags_are_on()) {
            require_once EA_SRC_DIR . 'templates/asp_tag_message.tpl.php';
            return;
        }

        $settings = $this->options->get_options();
        $settings['rest_url'] = get_rest_url();
        wp_localize_script('ea-settings', 'ea_settings', $settings);

        $screen = get_current_screen();
        $screen->add_help_tab(array(
            'id'    => 'easyapp_settings_help'
        , 'title'   => 'Settings'
        , 'content' => '<p>You need to define at least one location, worker and service! Without that widget won\'t work.</p>'
        ));

        $screen->set_help_sidebar('<a href="https://easy-appointments.net/documentation/">More info!</a>');

        require_once EA_SRC_DIR . 'templates/admin.tpl.php';
        require_once EA_SRC_DIR . 'templates/inlinedata.tpl.php';
    }

    /**
     * Content of top menu page
     */
    public function vacation_page()
    {
        // check if APS tags are on
        if ($this->is_asp_tags_are_on()) {
            require_once EA_SRC_DIR . 'templates/asp_tag_message.tpl.php';
            return;
        }

        wp_enqueue_style('ea-vacation-css');
        wp_enqueue_script('ea-vacation');

        $settings = $this->options->get_options();
        $settings['rest_url'] = get_rest_url();
        $settings['rest_url_vacation'] = EAVacationActions::get_url();

        $wpurl = get_bloginfo('wpurl');
        $url   = get_bloginfo('url');

        $settings['image_base'] = $wpurl === $url ? '' : $wpurl;
        wp_localize_script('ea-vacation', 'ea_settings', $settings);

        if (function_exists('wp_set_script_translations')) {
            wp_set_script_translations('ea-vacation', 'easy-appointments');
        }

        $screen = get_current_screen();
        $screen->add_help_tab(array(
            'id'    => 'easyapp_settings_help'
        , 'title'   => 'Settings'
        , 'content' => '<p>You need to define at least one location, worker and service! Without that widget won\'t work.</p>'
        ));

        $screen->set_help_sidebar('<a href="https://easy-appointments.net/documentation/">More info!</a>');

        require_once EA_SRC_DIR . 'templates/vacation.tpl.php';
        require_once EA_SRC_DIR . 'templates/inlinedata.tpl.php';
    }

    /**
     * Content of top menu page
     */
    public function locations_page()
    {
        // check if APS tags are on
        if ($this->is_asp_tags_are_on()) {
            require_once EA_SRC_DIR . 'templates/asp_tag_message.tpl.php';
            return;
        }

        wp_enqueue_style('ea-vacation-css');
        wp_enqueue_script('ea-vacation');

        $settings = $this->options->get_options();
        $settings['rest_url'] = get_rest_url();

        $wpurl = get_bloginfo('wpurl');
        $url   = get_bloginfo('url');

        $settings['image_base'] = $wpurl === $url ? '' : $wpurl;
        wp_localize_script('ea-vacation', 'ea_settings', $settings);

        if (function_exists('wp_set_script_translations')) {
            wp_set_script_translations('ea-vacation', 'easy-appointments');
        }

        require_once EA_SRC_DIR . 'templates/locations.tpl.php';
        require_once EA_SRC_DIR . 'templates/inlinedata.tpl.php';
    }

    /**
     * Content of top menu page
     */
    public function workers_page()
    {
        // check if APS tags are on
        if ($this->is_asp_tags_are_on()) {
            require_once EA_SRC_DIR . 'templates/asp_tag_message.tpl.php';
            return;
        }

        wp_enqueue_style('ea-vacation-css');
        wp_enqueue_script('ea-vacation');

        $settings = $this->options->get_options();
        $settings['rest_url'] = get_rest_url();

        $wpurl = get_bloginfo('wpurl');
        $url   = get_bloginfo('url');

        $settings['image_base'] = $wpurl === $url ? '' : $wpurl;
        wp_localize_script('ea-vacation', 'ea_settings', $settings);

        if (function_exists('wp_set_script_translations')) {
            wp_set_script_translations('ea-vacation', 'easy-appointments');
        }

        require_once EA_SRC_DIR . 'templates/workers.tpl.php';
        require_once EA_SRC_DIR . 'templates/inlinedata.tpl.php';
    }

    /**
     * Content of top menu page
     */
    public function services_page()
    {
        // check if APS tags are on
        if ($this->is_asp_tags_are_on()) {
            require_once EA_SRC_DIR . 'templates/asp_tag_message.tpl.php';
            return;
        }

        wp_enqueue_style('ea-vacation-css');
        wp_enqueue_script('ea-vacation');

        $settings = $this->options->get_options();
        $settings['rest_url'] = get_rest_url();

        $wpurl = get_bloginfo('wpurl');
        $url   = get_bloginfo('url');

        $settings['image_base'] = $wpurl === $url ? '' : $wpurl;
        wp_localize_script('ea-vacation', 'ea_settings', $settings);

        if (function_exists('wp_set_script_translations')) {
            wp_set_script_translations('ea-vacation', 'easy-appointments');
        }

        require_once EA_SRC_DIR . 'templates/services.tpl.php';
        require_once EA_SRC_DIR . 'templates/inlinedata.tpl.php';
    }

    /**
     * We need to check if asp tags are turned on
     */
    public function is_asp_tags_are_on()
    {
        $aps_tags = ini_get('asp_tags');

        if (!empty($aps_tags)) {
            if (ini_set('asp_tags', '0') === false) {
                return true;
            }
        }

        return false;
    }
}