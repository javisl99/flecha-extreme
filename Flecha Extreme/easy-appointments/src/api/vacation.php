<?php


// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

class EAVacationActions
{
    /**
     * @var string
     */
    private $namespace;

    /**
     * @var EADBModels
     */
    private $db_models;

    /**
     * @var EAOptions
     */
    private $options;

    public function __construct($db_models, $options)
    {
        $this->namespace = 'easy-appointments/v1';
        $this->db_models = $db_models;
        $this->options = $options;
    }

    public static function get_url()
    {
        return rest_url('easy-appointments/v1/vacation');
    }

    /**
     *
     */
    public function register_routes()
    {
        $vacation = 'vacation';
        register_rest_route($this->namespace, '/' . $vacation, array(
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array($this, 'get_vacations'),
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                },

            )
        ));

        register_rest_route($this->namespace, '/' . $vacation, array(
            array(
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => array($this, 'update_vacations'),
                'permission_callback' => function () {
                    return current_user_can('manage_options');
                }
            )
        ));
    }

    public function get_vacations()
    {
        $vacations = $this->options->get_option_value('vacations');

        $result = $vacations === null ? array() : json_decode($vacations);

        wp_send_json($result);
    }

    /**
     * @param WP_REST_Request $request get data from request.
     */
    public function update_vacations($request)
    {
        $input = $request->get_body();
        $data = $this->process_data($input);

        $option = array(
            'ea_key'   => 'vacations',
            'ea_value' => $data,
            'type'     => 'JSON_ARRAY',
        );

        $result = $this->db_models->update_option($option);

        wp_send_json(array('result' => $result));
    }

    /**
     * Checks if array of data is valid
     *
     * @param $data
     * @return false|float|int|mixed|Services_JSON_Error|string|void
     */
    private function process_data($data)
    {
        $array = json_decode($data, true);

        if (!is_array($array)) {
            return '[]';
        }

        $result = array();
        $keys = array('id', 'title', 'tooltip', 'workers', 'days');

        foreach ($array as $item) {
            if (!is_array($item)) {
                continue;
            }

            $is_valid = true;
            // check for name, tooltip, workers, days
            foreach ($keys as $key) {
                if (array_key_exists($key, $item)) {
                    continue;
                }

                $is_valid = false;
                break;
            }

            if ($is_valid) {
                $result[] = $item;
            }
        }

        return json_encode($result);
    }
}