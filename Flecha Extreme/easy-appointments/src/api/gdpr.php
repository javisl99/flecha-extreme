<?php

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

class EAGDPRActions {
    /**
     * @var string
     */
    private $namespace;

    /**
     * @var EADBModels
     */
    private $db_models;

    public function __construct($db_models) {
        $this->namespace = 'easy-appointments/v1';
        $this->db_models = $db_models;
    }

    /**
     *
     */
    public function register_routes() {
        $mail_log = 'gdpr';
        register_rest_route( $this->namespace, '/' . $mail_log, array(
            array(
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => array( $this, 'clear_old_custom_data' ),
                'permission_callback' => function () {
                    return current_user_can( 'manage_options' );
                }
            )
        ));
    }

    public function clear_old_custom_data() {
        $table_app = $this->db_models->get_wpdb()->prefix . 'ea_appointments';
        $table_fields = $this->db_models->get_wpdb()->prefix . 'ea_fields';
        $query = "DELETE f FROM $table_app a INNER JOIN $table_fields f ON (a.id = f.app_id) WHERE a.end_date <= (now() - interval 6 month) AND a.end_date IS NOT NULL";
        $this->db_models->get_wpdb()->query($query);

        return __('Data deleted', 'easy-appointments');
    }
}