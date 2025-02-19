<?php

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 *
 */
class EAMetaFields
{

    // We need to compile with PHP 5.2
    // const T_INPUT    = 'INPUT';
    // const T_TEXTAREA = 'TEXTAREA';
    // const T_SELECT   = 'SELECT';

    function __construct()
    {
    }

    static function get_meta_fields_type()
    {
        return array(
            'INPUT'    => __('Input', 'easy_appointments'),
            'TEXTAREA' => __('Select', 'easy_appointments'),
            'SELECT'   => __('Text', 'easy_appointments'),
            'PHONE'    => __('Phone', 'easy_appointments'),
            'EMAIL'    => __('Email', 'easy_appointments'),
        );
    }

    static function parse_field_slug_name($data, $next_id)
    {
        $slug = sanitize_title($data['label']);

        // case if there are some utf8 chars in slug
        if (strpos($slug, '%') > -1) {
            if (extension_loaded('iconv')) {
                $slug = trim(iconv('UTF8', 'ASCII//IGNORE//TRANSLIT', $data['label']));
            }

            if ($slug == '' || strlen($data['slug']) < 5) {

                $max = $next_id;

                if (!empty($data['id'])) {
                    $max = $data['id'];
                }

                $slug = 'custom_field_' . $max;
            }
        }

        return $slug;
    }
}