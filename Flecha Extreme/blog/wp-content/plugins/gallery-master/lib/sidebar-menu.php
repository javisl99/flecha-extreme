<?php
/**
 * This file is used for sidebar menus.
 *
 * @author   Tech Banker
 * @package  gallery-master/lib
 * @version   2.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly
if ( ! is_user_logged_in() ) {
	return;
} else {
	$access_granted = false;
	foreach ( $user_role_permission as $permission ) {
		if ( current_user_can( $permission ) ) {
			$access_granted = true;
			break;
		}
	}
	if ( ! $access_granted ) {
		return;
	} else {
		$flag = 0;

		$role_capabilities                   = $wpdb->get_var(
			$wpdb->prepare(
				'SELECT meta_value from ' . $wpdb->prefix . 'gallery_master_meta WHERE meta_key = %s', 'roles_and_capabilities_settings'
			)
		);// WPCS: db call ok, cache ok.
		$roles_and_capabilities_unserialized = maybe_unserialize( $role_capabilities );
		$capabilities                        = explode( ',', isset( $roles_and_capabilities_unserialized['roles_and_capabilities'] ) ? esc_attr( $roles_and_capabilities_unserialized['roles_and_capabilities'] ) : '1,1,1,0,0,0' );
		if ( is_super_admin() ) {
			$gm_role = 'administrator';
		} else {
			$gm_role = check_user_roles_gallery_master( $current_user );
		}
		switch ( $gm_role ) {
			case 'administrator':
				$privileges = 'administrator_privileges';
				$flag       = $capabilities[0];
				break;

			case 'author':
				$privileges = 'author_privileges';
				$flag       = $capabilities[1];
				break;

			case 'editor':
				$privileges = 'editor_privileges';
				$flag       = $capabilities[2];
				break;

			case 'contributor':
				$privileges = 'contributor_privileges';
				$flag       = $capabilities[3];
				break;

			case 'subscriber':
				$privileges = 'subscriber_privileges';
				$flag       = $capabilities[4];
				break;

			default:
				$privileges = 'other_privileges';
				$flag       = $capabilities[5];
		}
		$privileges_value = '0,0,0,0,0,0,0,0,0,0,0,0';
		foreach ( $roles_and_capabilities_unserialized as $key => $value ) {
			if ( $key === $privileges ) {
				$privileges_value = $value;
				break;
			}
		}
		$full_control = explode( ',', $privileges_value );
		if ( ! defined( 'FULL_CONTROL' ) ) {
			define( 'FULL_CONTROL', "$full_control[0]" );
		}
		if ( ! defined( 'GALLERIES_GALLERY_MASTER' ) ) {
			define( 'GALLERIES_GALLERY_MASTER', "$full_control[1]" );
		}
		if ( ! defined( 'ALBUMS_GALLERY_MASTER' ) ) {
			define( 'ALBUMS_GALLERY_MASTER', "$full_control[2]" );
		}
		if ( ! defined( 'TAGS_GALLERY_MASTER' ) ) {
			define( 'TAGS_GALLERY_MASTER', "$full_control[3]" );
		}
		if ( ! defined( 'LAYOUT_SETTINGS_GALLERY_MASTER' ) ) {
			define( 'LAYOUT_SETTINGS_GALLERY_MASTER', "$full_control[4]" );
		}
		if ( ! defined( 'LIGHTBOXES_GALLERY_MASTER' ) ) {
			define( 'LIGHTBOXES_GALLERY_MASTER', "$full_control[5]" );
		}
		if ( ! defined( 'GENERAL_SETTINGS_GALLERY_MASTER' ) ) {
			define( 'GENERAL_SETTINGS_GALLERY_MASTER', "$full_control[6]" );
		}
		if ( ! defined( 'SHORTCODE_GENERATOR_GALLERY_MASTER' ) ) {
			define( 'SHORTCODE_GENERATOR_GALLERY_MASTER', "$full_control[7]" );
		}
		if ( ! defined( 'OTHER_SETTINGS_GALLERY_MASTER' ) ) {
			define( 'OTHER_SETTINGS_GALLERY_MASTER', "$full_control[8]" );
		}
		if ( ! defined( 'ROLES_AND_CAPABILITIES_GALLERY_MASTER' ) ) {
			define( 'ROLES_AND_CAPABILITIES_GALLERY_MASTER', "$full_control[9]" );
		}
		if ( ! defined( 'SYSTEM_INFORMATION_GALLERY_MASTER' ) ) {
			define( 'SYSTEM_INFORMATION_GALLERY_MASTER', "$full_control[10]" );
		}
		$check_gallery_master_wizard = get_option( 'gallery-master-welcome-page' );
		if ( '1' === $flag ) {
			$icon = GALLERY_MASTER_PLUGIN_DIR_URL . 'assets/global/img/icon.png';
			if ( $check_gallery_master_wizard ) {
				add_menu_page( $gallery_master, $gallery_master, 'read', 'gallery_master', '', $icon );
			} else {
				add_menu_page( $gallery_master, $gallery_master, 'read', 'gm_wizard_gallery_master', '', plugins_url( 'assets/global/img/icon.png', dirName( __FILE__ ) ) );
				add_submenu_page( $gallery_master, $gallery_master, '', 'read', 'gm_wizard_gallery_master', 'gm_wizard_gallery_master' );
			}
			add_submenu_page( 'gallery_master', $gm_galleries, $gm_galleries, 'read', 'gallery_master', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gallery_master' );
			add_submenu_page( 'gallery_master', $gm_albums, $gm_albums, 'read', 'gm_manage_albums', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_manage_albums' );
			add_submenu_page( 'gallery_master', $gm_tags, $gm_tags, 'read', 'gm_manage_tags', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_manage_tags' );
			add_submenu_page( 'gallery_master', $gm_layout_settings, $gm_layout_settings, 'read', 'gm_thumbnail_layout', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_thumbnail_layout' );
			add_submenu_page( 'gallery_master', $gm_lightboxes, $gm_lightboxes, 'read', 'gm_lightcase', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_lightcase' );
			add_submenu_page( 'gallery_master', $gm_general_settings, $gm_general_settings, 'read', 'gm_global_options', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_global_options' );
			add_submenu_page( 'gallery_master', $gm_shortcode_generator, $gm_shortcode_generator, 'read', 'gm_shortcodes', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_shortcodes' );
			add_submenu_page( 'gallery_master', $gm_other_setting, $gm_other_setting, 'read', 'gm_other_settings', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_other_settings' );
			add_submenu_page( 'gallery_master', $gm_roles_and_capabilities, $gm_roles_and_capabilities, 'read', 'gm_roles_and_capabilities', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_roles_and_capabilities' );
			add_submenu_page( 'gallery_master', $gm_feature_requests, $gm_feature_requests, 'read', 'https://wordpress.org/support/plugin/gallery-master' );
			add_submenu_page( 'gallery_master', $gm_system_information, $gm_system_information, 'read', 'gm_system_information', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_system_information' );
			add_submenu_page( 'gallery_master', $gm_premium_edition, $gm_premium_edition, 'read', 'https://tech-banker.com/gallery-master/pricing/' );


			add_submenu_page( $gm_galleries, $gm_add_gallery, '', 'read', 'gm_add_gallery', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_add_gallery' );
			add_submenu_page( $gm_galleries, $gm_sort_galleries, '', 'read', 'gm_sort_galleries', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_sort_galleries' );

			add_submenu_page( $gm_albums, $gm_add_album, '', 'read', 'gm_add_album', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_add_album' );
			add_submenu_page( $gm_albums, $gm_sort_albums, '', 'read', 'gm_sort_albums', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_sort_albums' );

			add_submenu_page( $gm_tags, $gm_add_tag, '', 'read', 'gm_add_tag', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_add_tag' );
			add_submenu_page( $gm_tags, $gm_manage_tags, '', 'read', 'gm_manage_tags', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_manage_tags' );

			add_submenu_page( $gm_layout_settings, $gm_thumbnail_layout, '', 'read', 'gm_thumbnail_layout', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_thumbnail_layout' );
			add_submenu_page( $gm_layout_settings, $gm_masonry_layout, '', 'read', 'gm_masonry_layout', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_masonry_layout' );
			add_submenu_page( $gm_layout_settings, $gm_slideshow_layout, '', 'read', 'gm_slideshow_layout', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_slideshow_layout' );
			add_submenu_page( $gm_layout_settings, $gm_image_browser_layout, '', 'read', 'gm_image_browser_layout', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_image_browser_layout' );
			add_submenu_page( $gm_layout_settings, $gm_justified_grid_layout, '', 'read', 'gm_justified_grid_layout', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_justified_grid_layout' );
			add_submenu_page( $gm_layout_settings, $gm_blog_style_layout, '', 'read', 'gm_blog_style_layout', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_blog_style_layout' );
			add_submenu_page( $gm_layout_settings, $gm_compact_album_layout, '', 'read', 'gm_compact_album_layout', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_compact_album_layout' );
			add_submenu_page( $gm_layout_settings, $gm_extended_album_layout, '', 'read', 'gm_extended_album_layout', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_extended_album_layout' );
			add_submenu_page( $gm_layout_settings, $gm_custom_css, '', 'read', 'gm_custom_css', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_custom_css' );

			add_submenu_page( $gm_lightboxes, $gm_fancy_box, '', 'read', 'gm_fancy_box', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_fancy_box' );
			add_submenu_page( $gm_lightboxes, $gm_color_box, '', 'read', 'gm_color_box', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_color_box' );
			add_submenu_page( $gm_lightboxes, $gm_foo_box_free_edition, '', 'read', 'gm_foo_box_free_edition', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_foo_box_free_edition' );
			add_submenu_page( $gm_lightboxes, $gm_nivo_lightbox, '', 'read', 'gm_nivo_lightbox', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_nivo_lightbox' );
			add_submenu_page( $gm_lightboxes, $gm_lightcase, '', 'read', 'gm_lightcase', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_lightcase' );

			add_submenu_page( $gm_general_settings, $gm_global_options, '', 'read', 'gm_global_options', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_global_options' );
			add_submenu_page( $gm_general_settings, $gm_lazy_load_settings, '', 'read', 'gm_lazy_load_settings', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_lazy_load_settings' );
			add_submenu_page( $gm_general_settings, $gm_filter_settings, '', 'read', 'gm_filter_settings', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_filter_settings' );
			add_submenu_page( $gm_general_settings, $gm_order_by_settings, '', 'read', 'gm_order_by_settings', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_order_by_settings' );
			add_submenu_page( $gm_general_settings, $gm_search_box_settings, '', 'read', 'gm_search_box_settings', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_search_box_settings' );
			add_submenu_page( $gm_general_settings, $gm_page_navigation, '', 'read', 'gm_page_navigation', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_page_navigation' );
			add_submenu_page( $gm_general_settings, $gm_watermark_settings, '', 'read', 'gm_watermark_settings', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_watermark_settings' );
			add_submenu_page( $gm_general_settings, $gm_advertisement, '', 'read', 'gm_advertisement', false === $check_gallery_master_wizard ? 'gm_wizard_gallery_master' : 'gm_advertisement' );
		}

		/**
		 * Function Name: gm_wizard_gallery_master
		 * Parameters: No
		 * Description: This function is used for creating gm_wizard_gallery_master menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_wizard_gallery_master() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/wizard/wizard.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/wizard/wizard.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gallery_master
		 * Parameters: No
		 * Description: This function is used for manage-galleries menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gallery_master() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/galleries/manage-galleries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/galleries/manage-galleries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_add_gallery
		 * Parameters: No
		 * Description: This function is used for add-gallery menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_add_gallery() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/galleries/add-gallery.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/galleries/add-gallery.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_sort_galleries
		 * Parameters: No
		 * Description: This function is used for sort-galleries menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_sort_galleries() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/galleries/sort-galleries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/galleries/sort-galleries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_manage_albums
		 * Parameters: No
		 * Description: This function is used for manage-albums menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_manage_albums() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/albums/manage-albums.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/albums/manage-albums.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_add_album
		 * Parameters: No
		 * Description: This function is used for add-album menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_add_album() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/albums/add-album.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/albums/add-album.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_sort_albums
		 * Parameters: No
		 * Description: This function is used for sort-album menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_sort_albums() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/albums/sort-albums.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/albums/sort-albums.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_add_tag
		 * Parameters: No
		 * Description: This function is used for add-tag menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_add_tag() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/tags/add-tag.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/tags/add-tag.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_manage_tags
		 * Parameters: No
		 * Description: This function is used for manage-tags menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_manage_tags() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/tags/manage-tags.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/tags/manage-tags.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_thumbnail_layout
		 * Parameters: No
		 * Description: This function is used for thumbnail-layout menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_thumbnail_layout() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}

			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/thumbnail-layout.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/thumbnail-layout.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_masonry_layout
		 * Parameters: No
		 * Description: This function is used for masonry-layout menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_masonry_layout() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/masonry-layout.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/masonry-layout.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_slideshow_layout
		 * Parameters: No
		 * Description: This function is used for slideshow-layout menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_slideshow_layout() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/slideshow-layout.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/slideshow-layout.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_image_browser_layout
		 * Parameters: No
		 * Description: This function is used for image-browser-layout menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_image_browser_layout() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/image-browser-layout.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/image-browser-layout.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_justified_grid_layout
		 * Parameters: No
		 * Description: This function is used for justified-grid-layout menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_justified_grid_layout() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/justified-grid-layout.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/justified-grid-layout.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_blog_style_layout
		 * Parameters: No
		 * Description: This function is used for blog-style-layout menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_blog_style_layout() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/blog-style-layout.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/blog-style-layout.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_compact_album_layout
		 * Parameters: No
		 * Description: This function is used for blog-style-layout menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_compact_album_layout() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/compact-album-layout.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/compact-album-layout.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_extended_album_layout
		 * Parameters: No
		 * Description: This function is used for blog-style-layout menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_extended_album_layout() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/extended-album-layout.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/extended-album-layout.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_custom_css
		 * Parameters: No
		 * Description: This function is used for custom css menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_custom_css() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/custom-css.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/layout-settings/custom-css.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_fancy_box
		 * Parameters: No
		 * Description: This function is used for fancy-box menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_fancy_box() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/lightboxes/fancy-box.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/lightboxes/fancy-box.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_color_box
		 * Parameters: No
		 * Description: This function is used for color-box menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_color_box() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/lightboxes/color-box.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/lightboxes/color-box.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_foo_box_free_edition
		 * Parameters: No
		 * Description: This function is used for foo-box-free-edition menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_foo_box_free_edition() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/lightboxes/foo-box-free-edition.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/lightboxes/foo-box-free-edition.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_nivo_lightbox
		 * Parameters: No
		 * Description: This function is used for lightbox menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_nivo_lightbox() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/lightboxes/nivo-lightbox.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/lightboxes/nivo-lightbox.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_lightcase
		 * Parameters: No
		 * Description: This function is used for lightbox menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_lightcase() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/lightboxes/lightcase.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/lightboxes/lightcase.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_global_options
		 * Parameters: No
		 * Description: This function is used for global-options menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_global_options() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/global-options.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/global-options.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_filter_settings
		 * Parameters: No
		 * Description: This function is used for filter_settings menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_filter_settings() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/filters-settings.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/filters-settings.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_lazy_load_settings
		 * Parameters: No
		 * Description: This function is used for lazy_load_settings menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_lazy_load_settings() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/lazy-load-settings.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/lazy-load-settings.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_search_box_settings
		 * Parameters: No
		 * Description: This function is used for search_box_settings menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_search_box_settings() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/search-box-settings.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/search-box-settings.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_order_by_settings
		 * Parameters: No
		 * Description: This function is used for order_by_settings menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_order_by_settings() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/order-by-settings.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/order-by-settings.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_page_navigation
		 * Parameters: No
		 * Description: This function is used for page-navigation menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_page_navigation() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/page-navigation.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/page-navigation.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_watermark_settings
		 * Parameters: No
		 * Description: This function is used for watermark-settings menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_watermark_settings() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/watermark-settings.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/watermark-settings.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_advertisement
		 * Parameters: No
		 * Description: This function is used for advertisment menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_advertisement() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/advertisement.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/general-settings/advertisement.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_other_settings
		 * Parameters: No
		 * Description: This function is used for other-settings menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_other_settings() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/other-settings/other-settings.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/other-settings/other-settings.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_roles_and_capabilities
		 * Parameters: No
		 * Description: This function is used for roles-and-capabilities menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_roles_and_capabilities() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/roles-and-capabilities/roles-and-capabilities.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/roles-and-capabilities/roles-and-capabilities.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_shortcodes
		 * Parameters: No
		 * Description: This unction is used for thumbnail-layout-shortcode menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_shortcodes() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/shortcodes/shortcodes.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/shortcodes/shortcodes.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
		/**
		 * Function Name: gm_system_information
		 * Parameters: No
		 * Description: This function is used for system-information menu.
		 * Created On: 13-04-2017 10:22
		 * Created By: Tech Banker Team
		 */
		function gm_system_information() {
			global $wpdb;
			$user_role_permission = get_users_capabilities_gallery_master();
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php' ) ) {
				include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/translations.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/header.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/sidebar.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/queries.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/system-information/system-information.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'views/system-information/system-information.php';
			}
			if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php' ) ) {
				include_once GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/footer.php';
			}
		}
	}
}
