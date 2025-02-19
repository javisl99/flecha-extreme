<?php

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

class EALogActions {
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
        $mail_log = 'mail_log';
        register_rest_route( $this->namespace, '/' . $mail_log, array(
            array(
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => array( $this, 'clear_error_log' ),
                'permission_callback' => function () {
                    return current_user_can( 'manage_options' );
                }
            )
        ));

        $log_file = 'log_file';
        register_rest_route( $this->namespace, '/' . $log_file, array(
            array(
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => array( $this, 'clear_log_file' ),
                'permission_callback' => function () {
                    return current_user_can( 'manage_options' );
                }
            )
        ));
    }

    public function clear_error_log() {
        $table_app = $this->db_models->get_wpdb()->prefix . 'ea_error_logs';
        $query = "DELETE FROM $table_app";
        $this->db_models->get_wpdb()->query($query);

        return __('Log records deleted', 'easy-appointments');
    }

    public function clear_log_file() {
        do_action('EA_CLEAR_LOG');

        return __('Log file removed', 'easy-appointments');
    }
}