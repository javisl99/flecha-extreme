<?php
/**
 * This file is used for displaying admin bar menus.
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
		$flag                                = 0;
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
				$flag = $capabilities[0];
				break;

			case 'author':
				$flag = $capabilities[1];
				break;

			case 'editor':
				$flag = $capabilities[2];
				break;

			case 'contributor':
				$flag = $capabilities[3];
				break;

			case 'subscriber':
				$flag = $capabilities[4];
				break;
		}

		if ( '1' === $flag ) {
			$wp_admin_bar->add_menu(
				array(
					'id'    => 'gallery_master',
					'title' => '<img src= "' . plugins_url( 'assets/global/img/icon.png', dirname( __FILE__ ) ) .
					"\" width=\"16\" height=\"16\" style=\"vertical-align:text-top; margin-right:5px; display:inline-block;\"./> $gallery_master",
					'href'  => admin_url( 'admin.php?page=gallery_master' ),
				)
			);

			$wp_admin_bar->add_menu(
				array(
					'parent' => 'gallery_master',
					'id'     => 'gm_galleries',
					'title'  => $gm_galleries,
					'href'   => admin_url( 'admin.php?page=gallery_master' ),
				)
			);

			$wp_admin_bar->add_menu(
				array(
					'parent' => 'gallery_master',
					'id'     => 'gm_albums',
					'title'  => $gm_albums,
					'href'   => admin_url( 'admin.php?page=gm_manage_albums' ),
				)
			);

			$wp_admin_bar->add_menu(
				array(
					'parent' => 'gallery_master',
					'id'     => 'gm_tags',
					'title'  => $gm_tags,
					'href'   => admin_url( 'admin.php?page=gm_manage_tags' ),
				)
			);

			$wp_admin_bar->add_menu(
				array(
					'parent' => 'gallery_master',
					'id'     => 'gm_layout_settings',
					'title'  => $gm_layout_settings,
					'href'   => admin_url( 'admin.php?page=gm_thumbnail_layout' ),
				)
			);

			$wp_admin_bar->add_menu(
				array(
					'parent' => 'gallery_master',
					'id'     => 'gm_lightboxes',
					'title'  => $gm_lightboxes,
					'href'   => admin_url( 'admin.php?page=gm_lightcase' ),
				)
			);

			$wp_admin_bar->add_menu(
				array(
					'parent' => 'gallery_master',
					'id'     => 'gm_general_settings',
					'title'  => $gm_general_settings,
					'href'   => admin_url( 'admin.php?page=gm_global_options' ),
				)
			);

			$wp_admin_bar->add_menu(
				array(
					'parent' => 'gallery_master',
					'id'     => 'gm_shortcode_generator',
					'title'  => $gm_shortcode_generator,
					'href'   => admin_url( 'admin.php?page=gm_shortcodes' ),
				)
			);

			$wp_admin_bar->add_menu(
				array(
					'parent' => 'gallery_master',
					'id'     => 'gm_other_settings',
					'title'  => $gm_other_setting,
					'href'   => admin_url( 'admin.php?page=gm_other_settings' ),
				)
			);

			$wp_admin_bar->add_menu(
				array(
					'parent' => 'gallery_master',
					'id'     => 'gm_roles_and_capabilities',
					'title'  => $gm_roles_and_capabilities,
					'href'   => admin_url( 'admin.php?page=gm_roles_and_capabilities' ),
				)
			);

			$wp_admin_bar->add_menu(
				array(
					'parent' => 'gallery_master',
					'id'     => 'gm_support_forum',
					'title'  => $gm_feature_requests,
					'href'   => 'https://wordpress.org/support/plugin/gallery-master',
					'meta'   => array( 'target' => '_blank' ),
				)
			);

			$wp_admin_bar->add_menu(
				array(
					'parent' => 'gallery_master',
					'id'     => 'gm_system_information',
					'title'  => $gm_system_information,
					'href'   => admin_url( 'admin.php?page=gm_system_information' ),
				)
			);

			$wp_admin_bar->add_menu(
				array(
					'parent' => 'gallery_master',
					'id'     => 'gm_pricing_plans',
					'title'  => $gm_premium_edition,
					'href'   => 'https://tech-banker.com/gallery-master/pricing/',
					'meta'   => array( 'target' => '_blank' ),
				)
			);
		}
	}
}
