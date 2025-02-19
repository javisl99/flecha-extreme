<?php

class EAUserFieldMapper
{
    public function __construct() { }

    public function init()
    {
        add_filter('ea_form_rows', array($this, 'process_fields'));
    }

    public function process_fields($fields)
    {
        $current_user = wp_get_current_user();
        $user_data = $current_user->to_array();
        $meta_data = get_user_meta(get_current_user_id());

        // Maybe here is no meta data
        if (is_array($meta_data)) {
            $user_data = array_merge($user_data, $meta_data);
        }

        if (empty($user_data)) {
            // clear field template values
            foreach ($fields as $field) {
                // skip phone field
                if ($field->type === 'PHONE' || $field->type === 'MASKED') {
                    continue;
                }

                $field->default_value = '';
            }
            return $fields;
        }

        // ID, user_login, user_nicename, user_email, user_url, display_name
        foreach ($fields as $field) {
            if (array_key_exists($field->default_value, $user_data)) {
                $field->default_value = $user_data[$field->default_value];
            }
        }

        return $fields;
    }

    public static function all_field_keys()
    {
        $current_user = wp_get_current_user();
        $user_data = array_merge($current_user->to_array(), get_user_meta(get_current_user_id()));

        return implode(', ', array_keys($user_data));
    }
}