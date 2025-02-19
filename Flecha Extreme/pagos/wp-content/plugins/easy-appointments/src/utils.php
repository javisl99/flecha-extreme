<?php

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * Utils class
 */
class EAUtils
{
    public function get_template_path($template_file_name)
    {
        $default_path = EA_SRC_DIR . 'templates/' . $template_file_name;
        $theme_path = get_stylesheet_directory() . '/easy-appointments/' . $template_file_name;

        if (file_exists($theme_path)) {
            return $theme_path;
        }

        return $default_path;
    }
}