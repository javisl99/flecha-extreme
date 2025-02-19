<?php
/**
 * This file is used for fetching data from database.
 *
 * @author  Tech Banker
 * @package gallery-master/user-views/includes/galleries
 * @version  2.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
if ( isset( $id ) ) {
	if ( isset( $_REQUEST['gallery_id'] ) ) {// WPCS: input var ok, CSRF ok.
			$id           = intval( $_REQUEST['gallery_id'] );// WPCS: input var ok, CSRF ok.
			$gallery_data = $wpdb->get_row(
				$wpdb->prepare( 'SELECT * FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE meta_key = %s AND old_gallery_id = %d', 'gallery_data', $id )
			);// WPCS: db call ok; no-cache ok.
	} else {
		$gallery_data = $wpdb->get_row(
			$wpdb->prepare( 'SELECT * FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE meta_key = %s AND old_gallery_id = %d', 'gallery_data', $id )
		);// WPCS: db call ok; no-cache ok.
	}
	if ( isset( $gallery_data ) && '' !== $gallery_data ) {
		$display_gallery_data = maybe_unserialize( $gallery_data->meta_value );
		if ( isset( $display ) && 'selected' === $display ) {
			$images_count              = isset( $no_of_images ) && '' !== $no_of_images ? $no_of_images : '';
			$gallery_image_data_detail = array();
			$manage_data               = $wpdb->get_results(
				$wpdb->prepare(
					'SELECT * FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE old_gallery_id = %d AND meta_key != %s ORDER BY meta_id DESC LIMIT $images_count', $id, 'gallery_data'
				)
			);// WPCS: db call ok; no-cache ok.
			$unserialize_complete_data = array();
			foreach ( $manage_data as $value ) {
				$unserialize_data                   = maybe_unserialize( $value->meta_value );
				$unserialize_data['id']             = $value->id;
				$unserialize_data['old_gallery_id'] = $value->old_gallery_id;
				$unserialize_data['meta_id']        = $value->meta_id;
				array_push( $gallery_image_data_detail, $unserialize_data );
			}
		} else {
			$gallery_image_data_detail = User_Helper_Gallery_Master::get_unserialize_mode_data_gallery_master( "old_gallery_id = $id AND meta_key != %s ", 'gallery_data' );
		}
		$gallery_image_detail_only_included_images = array();
		// loop to only include images that were not exculded to be displayed.
		foreach ( $gallery_image_data_detail as $images ) {
			if ( '1' !== $images['exclude_image'] ) {
				$gallery_image_detail_only_included_images[] = $images;
			}
		}
		if ( isset( $lightbox_type ) ) {
			switch ( esc_attr( $lightbox_type ) ) {
				case 'foo_box_free_edition':
					$foobox_meta_data = User_Helper_Gallery_Master::get_meta_value_gallery_master( 'foo_box_settings' );
					break;
			}
		}
		if ( isset( $layout_type ) ) {
			switch ( $layout_type ) {
				case 'thumbnail_layout':
					$thumbnail_layout_settings = User_Helper_Gallery_Master::get_meta_value_gallery_master( 'thumbnail_layout_settings' );
					break;

				case 'masonry_layout':
					$masonry_layout_settings = User_Helper_Gallery_Master::get_meta_value_gallery_master( 'masonry_layout_settings' );
					break;
			}
		}
	}
}
