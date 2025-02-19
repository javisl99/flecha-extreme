<?php

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

class EAApiFullCalendar
{
    /**
     * The namespace.
     *
     * @var string
     */
    protected $namespace;

    /**
     * Rest base for the current object.
     *
     * @var string
     */
    protected $rest_base;

    /**
     * @var EADBModels
     */
    protected $db_models;

    /**
     * @var EAOptions
     */
    private $options;

    /**
     * @var EAMail
     */
    private $mail;

    /**
     * Category_List_Rest constructor.
     * @param $db_models
     * @param $options
     */
    public function __construct($db_models, $options, $mail) {
        $this->namespace = 'easy-appointments/v1';
        $this->rest_base = 'appointments';
        $this->db_models = $db_models;
        $this->options = $options;
        $this->mail = $mail;
    }

    /**
     * Register the routes for the objects of the controller.
     */
    public function register_routes() {
        register_rest_route( $this->namespace, '/' . $this->rest_base, array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_items' ),
                'permission_callback' => array( $this, 'get_items_permissions_check' ),
                'args'                => $this->arguments_definition(),
            )
        ));

        register_rest_route( $this->namespace, '/appointment/(?P<id>\d+)', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_item' ),
                'permission_callback' => array( $this, 'get_items_permissions_check' ),
                'args'                => $this->get_item_arguments_definition(),
            )
        ));
    }
    /**
     * Check permissions for the read.
     *
     * @param WP_REST_Request $request get data from request.
     *
     * @return bool|WP_Error
     */
    public function get_items_permissions_check( $request ) {
        // just for demo page
        $have_access = apply_filters( 'ea_calendar_public_access', false);

        if ( ! current_user_can( 'read' ) && !$have_access ) {
            return new WP_Error( 'rest_forbidden', esc_html__( 'You cannot view the category resource.' ), array( 'status' => $this->authorization_status_code() ) );
        }

        return true;
    }

    /**
     * Check permissions for the update
     *
     * @param WP_REST_Request $request get data from request.
     *
     * @return bool|WP_Error
     */
    public function update_item_permissions_check( $request ) {
        if ( ! current_user_can( 'manage_options' ) ) {
            return new WP_Error( 'rest_forbidden', esc_html__( 'You cannot update the category resource.' ), array( 'status' => $this->authorization_status_code() ) );
        }
        return true;
    }

    /**
     * Grabs all the category list.
     *
     * @param WP_REST_Request $request get data from request.
     *
     * @return mixed|WP_REST_Response
     */
    public function get_items( $request ) {
        $title_key = $request->get_param('title_field');

        $params = array(
            'from'     => $request->get_param('start'),
            'to'       => $request->get_param('end'),
            'location' => $request->get_param('location'),
            'worker'   => $request->get_param('worker'),
            'service'  => $request->get_param('service'),
        );

        if ($params['location'] === null) {
            unset($params['location']);
        }

        if ($params['worker'] === null) {
            unset($params['worker']);
        }

        if ($params['service'] === null) {
            unset($params['service']);
        }

        /**
         * Process current logged user and show only his/her events
         */
        if ($params['worker'] === 'logged') {
            $params['worker'] = '0';

            $current_user = wp_get_current_user();
            $current_id = $this->db_models->get_worker_id_by_email($current_user->user_email);

            if ($current_id !== null) {
                $params['worker'] = (int)$current_id;
            }

            if ($current_user->has_cap('manage_options')) {
                unset($params['worker']);
            }
        }

        $res = $this->db_models->get_all_appointments($params);

        $fields = $this->db_models->get_all_rows('ea_meta_fields', array(), array('position' => 'ASC'));

        $res = array_map(function($element) use ($fields, $title_key) {
            $result = array(
                'start'  => $element->date . 'T' . $element->start,
                'end'    => $element->end_date . 'T' . $element->end,
                'status' => $element->status,
                'id'     => $element->id,
                'hash'   => $this->calculate_hash($element->id),
            );

            $result['title'] = $element->{$title_key};

            return $result;
        }, $res);

        // Return all of our comment response data.
        return rest_ensure_response( $res );
    }

    private function calculate_hash($id) {
        return md5($id . wp_salt());
    }

    /**
     * Sets up the proper HTTP status code for authorization.
     *
     * @return int
     */
    public function authorization_status_code() {
        $status = 401;
        if ( is_user_logged_in() ) {
            $status = 403;
        }
        return $status;
    }


    /**
     * We can use this function to contain our arguments for the example product endpoint.
     */
    public function arguments_definition() {
        $args = array();

        $args['_wpnonce'] = array(
            'description' => esc_html__( 'Nonce', 'easy-appointments' ),
            'type'        => 'string',
            'required'    => true,
        );

        $args['location'] = array(
            'description'       => esc_html__( 'Location id that will be used for getting free / taken slots', 'easy-appointments' ),
            'type'              => 'integer',
//            'required'          => true,
            'sanitize_callback' => 'absint',
        );

        $args['service'] = array(
            'description'       => esc_html__( 'Service id that will be used for getting free / taken slots', 'easy-appointments' ),
            'type'              => 'integer',
//            'required'          => true,
            'sanitize_callback' => 'absint',
        );

        $args['worker'] = array(
            'description'       => esc_html__( 'Worker id that will be used for getting free / taken slots', 'easy-appointments' ),
            'type'              => 'string',
//            'required'          => true,
            'validate_callback' => function($param, $request, $key) {
                if ($param === 'logged') {
                    return true;
                }

                return is_numeric($param);
            }
        );

        $args['title_field'] = array(
            'description'       => esc_html__( 'Field that will be used as title', 'easy-appointments' ),
            'type'              => 'string',
            'required'          => true,
        );

        $args['start'] = array(
            'description'       => esc_html__( 'Start filter from', 'easy-appointments' ),
            'type'              => 'string',
            'required'          => true,
            'validate_callback' => function($param, $request, $key) {
                // 2000-01-01
                if (strlen($param) !== 10) {
                    return false;
                }

                return (DateTime::createFromFormat('Y-m-d', $param) !== false);
            }
        );

        $args['end'] = array(
            'description'       => esc_html__( 'End filter from', 'easy-appointments' ),
            'type'              => 'string',
            'required'          => true,
            'validate_callback' => function($param, $request, $key) {
                // 2000-01-01
                if (strlen($param) !== 10) {
                    return false;
                }

                if (DateTime::createFromFormat('Y-m-d', $param) === false) {
                    return false;
                }

                $ts1 = strtotime($request->get_param('start'));
                $ts2 = strtotime($request->get_param('end'));

                $diff = floor(($ts2-$ts1)/3600/24);

                if ($diff >= 33) {
                    return false;
                }

                return true;
            }
        );

        return $args;
    }

    /**
     * @param WP_REST_Request $request get data from request.
     */
    public function get_item($request) {
        header('Content-Type: text/plain');

        $id   = $request->get_param('id');
        $hash = $request->get_param('hash');
        $app  = $this->db_models->get_appintment_by_id($id);

        // Load options
        $tplStr = $this->options->get_option_value('fullcalendar.event.template', '');

        $data = [
            'id'           => $id,
            'hash'         => $hash,
            'event'        => $app,
            'user'         => wp_get_current_user(),
            'is_admin'     => is_admin(),
            'is_logged_in' => is_user_logged_in(),
            'language'     => get_locale(),
            'link_cancel'  => $this->mail->generate_link_element($app, 'cancel', __('Cancel appointment', 'easy-appointments')),
            'link_confirm' => $this->mail->generate_link_element($app, 'confirm', __('Confirm appointment', 'easy-appointments')),
        ];

        $template = new Leuffen\TextTemplate\TextTemplate($tplStr);
        try {
            echo $template->apply($data);
        } catch (\Leuffen\TextTemplate\TemplateParsingException $e) {
            echo '';
        }

        exit();
    }

    /**
     * @return array
     */
    public function get_item_arguments_definition() {
        $args = array();

        $args['id'] = array(
            'description' => esc_html__( 'Appointments id', 'easy-appointments' ),
            'type'        => 'integer',
            'required'    => true,
        );

        $args['hash'] = array(
            'description' => esc_html__( 'Appointments hash', 'easy-appointments' ),
            'type'        => 'string',
            'required'    => true,
            'validate_callback' => function($param, $request, $key) {
                return $param === $this->calculate_hash($request->get_param('id'));
            },
        );

        return $args;
    }
}
