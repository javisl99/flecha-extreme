<?php
/**
 * This file is used for removing tables at Uninstall.
 *
 * @author   Tech Banker
 * @package  gallery-master
 * @version   2.0.0
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	die;
}
if ( ! current_user_can( 'manage_options' ) ) {
	return;
} else {
	global $wpdb;
	if ( is_multisite() ) {
		$blog_ids = $wpdb->get_col( "SELECT blog_id FROM $wpdb->blogs" );// WPCS: db call ok; no-cache ok.
		foreach ( $blog_ids as $blog_id ) {
			switch_to_blog( $blog_id );// @codingStandardsIgnoreLine.
			$gallery_master_version_number = get_option( 'gallery-master-key' );
			if ( false !== $gallery_master_version_number ) {
				$get_other_settings      = $wpdb->get_var(
					$wpdb->prepare(
						'SELECT meta_value from ' . $wpdb->prefix . 'gallery_master_meta WHERE meta_key = %s', 'other_settings'
					)
				);// WPCS: db call ok; no-cache ok.
				$get_other_settings_data = maybe_unserialize( $get_other_settings );
				if ( 'enable' === $get_other_settings_data['remove_table_at_uninstall'] ) {
					$wpdb->query( 'DROP TABLE IF EXISTS ' . $wpdb->prefix . 'gallery_master' );// @codingStandardsIgnoreLine.
					$wpdb->query( 'DROP TABLE IF EXISTS ' . $wpdb->prefix . 'gallery_master_meta' );// @codingStandardsIgnoreLine.

					delete_option( 'gallery-master-key' );
					delete_option( 'foobox-free' );
					delete_option( 'gm_admin_notice' );
					delete_option( 'gallery-master-welcome-page' );
				}
			}
			restore_current_blog();
		}
	} else {
		$gallery_master_version_number = get_option( 'gallery-master-key' );
		if ( false !== $gallery_master_version_number ) {
			$get_other_settings = $wpdb->get_var(
				$wpdb->prepare(
					'SELECT meta_value from ' . $wpdb->prefix . 'gallery_master_meta WHERE meta_key = %s', 'other_settings'
				)
			);// WPCS: db call ok; no-cache ok.

			$get_other_settings_data = maybe_unserialize( $get_other_settings );

			if ( 'enable' === $get_other_settings_data['remove_table_at_uninstall'] ) {
				$wpdb->query( 'DROP TABLE IF EXISTS ' . $wpdb->prefix . 'gallery_master' );// @codingStandardsIgnoreLine.
				$wpdb->query( 'DROP TABLE IF EXISTS ' . $wpdb->prefix . 'gallery_master_meta' );// @codingStandardsIgnoreLine.

				delete_option( 'gallery-master-key' );
				delete_option( 'foobox-free' );
				delete_option( 'gm_admin_notice' );
				delete_option( 'gallery-master-welcome-page' );
			}
		}
	}
}
