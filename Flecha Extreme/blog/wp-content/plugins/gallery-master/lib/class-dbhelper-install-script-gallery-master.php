<?php
/**
 * This file is used for creating table.
 *
 * @author   Tech Banker
 * @package  gallery-master/lib
 * @version  2.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly
if ( ! is_user_logged_in() ) {
	return;
} else {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	} else {
		if ( ! class_exists( 'dbhelper_install_script_gallery_master' ) ) {
			/**
			 * Class Name: dbhelper_install_script_gallery_master
			 * Parameter: No
			 * Description: This Class is used for Insert,Update and Delete operations.
			 * Created On: 01-06-2017 09:00
			 * Created By: Tech Banker Team
			 */
			class dbhelper_install_script_gallery_master {// @codingStandardsIgnoreLine
				/**
				 * This Function is used for Insert data in database.
				 *
				 * @param string $table_name passes parameter as table name.
				 * @param string $data passes parameter as data.
				 */
				public function insert_command( $table_name, $data ) {
					global $wpdb;
					$wpdb->insert( $table_name, $data );// WPCS: db call ok, cache ok.
					return $wpdb->insert_id;
				}
				/**
				 * This function is used for Update data in database.
				 *
				 * @param string $table_name passes parameter as table name.
				 * @param string $data passes parameter as data.
				 * @param string $where passes parameter as where.
				 */
				public function update_command( $table_name, $data, $where ) {
					global $wpdb;
					$wpdb->update( $table_name, $data, $where );// WPCS: db call ok, cache ok.
				}
				/**
				 * This function is used for Update data in database.
				 *
				 * @param string $fname passes parameter as $fname.
				 * @param string $image_data passes parameter as $image_data.
				 */
				public function create_thumbs_gallery_master( $fname, $image_data ) {
					$file_name = wp_unique_filename( GALLERY_MASTER_THUMBS_CROPPED_DIR, $fname );
					if ( function_exists( 'wp_get_image_editor' ) ) {
						$image_original              = wp_get_image_editor( GALLERY_MASTER_ORIGINAL_DIR . $fname );
						$image_thumbnail_cropped     = wp_get_image_editor( GALLERY_MASTER_ORIGINAL_DIR . $fname );
						$image_thumbnail_non_cropped = wp_get_image_editor( GALLERY_MASTER_ORIGINAL_DIR . $fname );
						if ( ! is_wp_error( $image_original ) || ! is_wp_error( $image_thumbnail_cropped ) || ! is_wp_error( $image_thumbnail_non_cropped ) ) {
							$image_original->resize( $image_data[0], $image_data[1], false );
							$image_original->save( GALLERY_MASTER_ORIGINAL_DIR . $file_name );

							$image_thumbnail_cropped->resize( $image_data[2], $image_data[3], true );
							$image_thumbnail_cropped->save( GALLERY_MASTER_THUMBS_CROPPED_DIR . $file_name );

							$image_thumbnail_non_cropped->resize( $image_data[2], $image_data[3], false );
							$image_thumbnail_non_cropped->save( GALLERY_MASTER_THUMBS_NON_CROPPED_DIR . $file_name );
						}
					} else {
						image_resize( GALLERY_MASTER_ORIGINAL_DIR . $fname, $image_data[0], $image_data[1], false );// @codingStandardsIgnoreLine
						image_resize( GALLERY_MASTER_THUMBS_CROPPED_DIR . $fname, $image_data[2], $image_data[3], true );// @codingStandardsIgnoreLine
						image_resize( GALLERY_MASTER_THUMBS_NON_CROPPED_DIR . $fname, $image_data[2], $image_data[3], false );// @codingStandardsIgnoreLine
					}
					return $file_name;
				}
				/**
				 * This function is used for Update data in database.
				 *
				 * @param string $file passes parameter as $file.
				 */
				public function file_exif_information_gallery_master( $file ) {
					$meta_data_array           = array();
					$image_data                = getimagesize( $file );
					$meta_data_array['width']  = $image_data[0];
					$meta_data_array['height'] = $image_data[1];
					if ( preg_match( '!^image/!', $image_data['mime'] ) && file_is_displayable_image( $file ) ) {
						$meta_data_array['mime_type']        = $image_data['mime'];
						$meta_data_array['file']             = _wp_relative_upload_path( $file );
						$meta_data_array['exif_information'] = wp_read_image_metadata( $file );
					}
					return $meta_data_array;
				}

			}

		}


		if ( ! function_exists( 'get_array_data_gallery_master' ) ) {
			/**
			 * Function Name: get_array_data_gallery_master
			 *
			 * @param int   $id passes parameter as id.
			 * @param array $array passes parameter as array.
			 */
			function get_array_data_gallery_master( $id, $array ) {
				$gallery_meta_data_unserialized_data = array();
				foreach ( $array as $key => $val ) {
					if ( $val->gallery_id === $id ) {
						array_push( $gallery_meta_data_unserialized_data, $val );
					}
				}
				return $gallery_meta_data_unserialized_data;
			}
		}

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$gallery_master_version_number = get_option( 'gallery-master-key' );

		if ( ! function_exists( 'table_gallery_master' ) ) {
			/**
			 * Function Name: table_gallery_master
			 * Parameter: No
			 * Description: It is used for creating a parent table.
			 * Created On: 01-06-2017 09:00
			 * Created By: Tech Banker Team
			 */
			function table_gallery_master() {
				global $wpdb;
				$collate                            = $wpdb->get_charset_collate();
				$obj_dbhelper_gallery_master_parent = new dbhelper_install_script_gallery_master();
				$sql                                = 'CREATE TABLE IF NOT EXISTS ' . gallery_master_parent() . '
				(
					`id` int(10) NOT NULL AUTO_INCREMENT,
					`type` longtext NOT NULL,
					`parent_id` int(10) DEFAULT NULL,
					PRIMARY KEY (`id`)
					)' . $collate;
				dbDelta( $sql );

				$data = 'INSERT INTO ' . gallery_master_parent() . " (`type`, `parent_id`) VALUES
				('galleries', 0),
				('albums',0),
				('tags', 0),
				('collation_type', 0),
				('layout_settings', 0),
				('lightboxes_settings', 0),
				('general_settings', 0),
				('other_settings', 0),
				('roles_and_capabilities_settings', 0)";
				dbDelta( $data );
			}
		}
		if ( ! function_exists( 'table_gallery_master_meta' ) ) {
			/**
			 * Function Name: table_gallery_master_meta
			 * Parameter: No
			 * Description: It is used for creating a meta table.
			 * Created On: 01-06-2017 09:00
			 * Created By: Tech Banker Team
			 */
			function table_gallery_master_meta() {
				global $wpdb;
				$collate                                = $wpdb->get_charset_collate();
				$obj_dbhelper_gallery_master_meta_table = new dbhelper_install_script_gallery_master();
				$sql                                    = 'CREATE TABLE IF NOT EXISTS ' . gallery_master_meta() . '
				(
					`id` int(10) unsigned NOT NULL AUTO_INCREMENT,
					`meta_id` int(10) NOT NULL,
					`meta_key` varchar(100) NOT NULL,
					`meta_value` longtext NOT NULL,
																				`old_gallery_id` int(10) NOT NULL,
					PRIMARY KEY (`id`)
				)' . $collate;
				dbDelta( $sql );

				$parent_table_data = $wpdb->get_results(
					'SELECT id,type FROM ' . $wpdb->prefix . 'gallery_master'
				);// WPCS: db call ok, cache ok.

				foreach ( $parent_table_data as $row ) {
					switch ( $row->type ) {
						case 'layout_settings':
							$thumbnail_layout_data                                     = array();
							$thumbnail_layout_data['thumbnail_layout_general_margin']  = '10,10,0,0';
							$thumbnail_layout_data['thumbnail_layout_general_padding'] = '0,0,0,0';
							$thumbnail_layout_data['thumbnail_layout_general_border_style']                  = '0,none,#000000';
							$thumbnail_layout_data['thumbnail_layout_general_border_radius']                 = '0';
							$thumbnail_layout_data['thumbnail_layout_general_shadow']                        = '0,0,0,0';
							$thumbnail_layout_data['thumbnail_layout_general_shadow_color']                  = '#000000';
							$thumbnail_layout_data['thumbnail_layout_general_hover_effect_value']            = 'none,0,0,0';
							$thumbnail_layout_data['thumbnail_layout_general_transition_time']               = '1';
							$thumbnail_layout_data['thumbnail_layout_general_background_color_transparency'] = '#ebe8eb,50';
							$thumbnail_layout_data['thumbnail_layout_general_thumbnail_opacity']             = '100';
							$thumbnail_layout_data['thumbnail_layout_thumbnail_dimensions']                  = '250,200';
							$thumbnail_layout_data['thumbnail_layout_container_width']                       = '100';
							$thumbnail_layout_data['thumbnail_layout_thumbnail_position']                    = 'center,center';

							$thumbnail_layout_data['thumbnail_layout_gallery_title_html_tag']       = 'h2';
							$thumbnail_layout_data['thumbnail_layout_gallery_title_text_alignment'] = 'left';
							$thumbnail_layout_data['thumbnail_layout_gallery_title_font_style']     = '20,#000000';
							$thumbnail_layout_data['thumbnail_layout_gallery_title_line_height']    = '1.7em';
							$thumbnail_layout_data['thumbnail_layout_gallery_title_font_family']    = 'Roboto Slab:700';
							$thumbnail_layout_data['thumbnail_layout_gallery_title_margin']         = '10,0,10,0';
							$thumbnail_layout_data['thumbnail_layout_gallery_title_padding']        = '10,0,10,0';

							$thumbnail_layout_data['thumbnail_layout_gallery_description_html_tag']       = 'h3';
							$thumbnail_layout_data['thumbnail_layout_gallery_description_text_alignment'] = 'left';
							$thumbnail_layout_data['thumbnail_layout_gallery_description_font_style']     = '16,#787D85';
							$thumbnail_layout_data['thumbnail_layout_gallery_description_line_height']    = '1.7em';
							$thumbnail_layout_data['thumbnail_layout_gallery_description_font_family']    = 'Roboto Slab:300';
							$thumbnail_layout_data['thumbnail_layout_gallery_description_margin']         = '10,0,10,0';
							$thumbnail_layout_data['thumbnail_layout_gallery_description_padding']        = '0,0,10,0';

							$thumbnail_layout_data['thumbnail_layout_thumbnail_title_html_tag']       = 'h3';
							$thumbnail_layout_data['thumbnail_layout_thumbnail_title_text_alignment'] = 'left';
							$thumbnail_layout_data['thumbnail_layout_thumbnail_title_font_style']     = '14,#787D85';
							$thumbnail_layout_data['thumbnail_layout_thumbnail_title_line_height']    = '1.7em';
							$thumbnail_layout_data['thumbnail_layout_thumbnail_title_font_family']    = 'Roboto Slab:700';
							$thumbnail_layout_data['thumbnail_layout_thumbnail_title_margin']         = '0,5,0,5';
							$thumbnail_layout_data['thumbnail_layout_thumbnail_title_padding']        = '10,10,10,10';

							$thumbnail_layout_data['thumbnail_layout_thumbnail_description_html_tag']       = 'p';
							$thumbnail_layout_data['thumbnail_layout_thumbnail_description_text_alignment'] = 'left';
							$thumbnail_layout_data['thumbnail_layout_thumbnail_description_font_style']     = '12,#787D85';
							$thumbnail_layout_data['thumbnail_layout_thumbnail_description_line_height']    = '1.7em';
							$thumbnail_layout_data['thumbnail_layout_thumbnail_description_font_family']    = 'Roboto Slab:300';
							$thumbnail_layout_data['thumbnail_layout_thumbnail_description_margin']         = '0,5,0,5';
							$thumbnail_layout_data['thumbnail_layout_thumbnail_description_padding']        = '5,10,10,5';
							$thumbnail_layout_data_serialize                   = array();
							$thumbnail_layout_data_serialize['meta_id']        = $row->id;
							$thumbnail_layout_data_serialize['old_gallery_id'] = $row->id;
							$thumbnail_layout_data_serialize['meta_key']       = 'thumbnail_layout_settings';// WPCS: slow query ok.
							$thumbnail_layout_data_serialize['meta_value']     = maybe_serialize( $thumbnail_layout_data );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $thumbnail_layout_data_serialize );

							$masonry_layout_data                                        = array();
							$masonry_layout_data['masonry_layout_general_margin']       = '10,10,0,0';
							$masonry_layout_data['masonry_layout_general_padding']      = '0,0,0,0';
							$masonry_layout_data['masonry_layout_general_border_style'] = '0,solid,#cccccc';
							$masonry_layout_data['masonry_layout_general_border_radius']                 = '0';
							$masonry_layout_data['masonry_layout_general_shadow']                        = '0,0,0,0';
							$masonry_layout_data['masonry_layout_general_shadow_color']                  = '#000000';
							$masonry_layout_data['masonry_layout_general_hover_effect_value']            = 'none,0,0,0';
							$masonry_layout_data['masonry_layout_general_transition_time']               = '1';
							$masonry_layout_data['masonry_layout_general_background_color_transparency'] = '#ebe8eb,50';
							$masonry_layout_data['masonry_layout_general_masonry_opacity']               = '100';
							$masonry_layout_data['masonry_layout_general_thumbnail_width']               = '250';

							$masonry_layout_data['masonry_layout_gallery_title_html_tag']       = 'h2';
							$masonry_layout_data['masonry_layout_gallery_title_text_alignment'] = 'left';
							$masonry_layout_data['masonry_layout_gallery_title_font_style']     = '20,#000000';
							$masonry_layout_data['masonry_layout_gallery_title_line_height']    = '1.7em';
							$masonry_layout_data['masonry_layout_gallery_title_font_family']    = 'Roboto Slab:700';
							$masonry_layout_data['masonry_layout_gallery_title_margin']         = '10,0,10,0';
							$masonry_layout_data['masonry_layout_gallery_title_padding']        = '10,0,10,0';

							$masonry_layout_data['masonry_layout_gallery_description_html_tag']       = 'h3';
							$masonry_layout_data['masonry_layout_gallery_description_text_alignment'] = 'left';
							$masonry_layout_data['masonry_layout_gallery_description_font_style']     = '16,#787D85';
							$masonry_layout_data['masonry_layout_gallery_description_line_height']    = '1.7em';
							$masonry_layout_data['masonry_layout_gallery_description_font_family']    = 'Roboto Slab:300';
							$masonry_layout_data['masonry_layout_gallery_description_margin']         = '10,0,10,0';
							$masonry_layout_data['masonry_layout_gallery_description_padding']        = '0,0,10,0';

							$masonry_layout_data['masonry_layout_thumbnail_title_html_tag']       = 'h3';
							$masonry_layout_data['masonry_layout_thumbnail_title_text_alignment'] = 'left';
							$masonry_layout_data['masonry_layout_thumbnail_title_font_style']     = '14,#787D85';
							$masonry_layout_data['masonry_layout_thumbnail_title_line_height']    = '1.7em';
							$masonry_layout_data['masonry_layout_thumbnail_title_font_family']    = 'Roboto Slab:700';
							$masonry_layout_data['masonry_layout_thumbnail_title_margin']         = '0,5,0,5';
							$masonry_layout_data['masonry_layout_thumbnail_title_padding']        = '10,10,10,10';

							$masonry_layout_data['masonry_layout_thumbnail_description_html_tag']       = 'p';
							$masonry_layout_data['masonry_layout_thumbnail_description_text_alignment'] = 'left';
							$masonry_layout_data['masonry_layout_thumbnail_description_font_style']     = '12,#787D85';
							$masonry_layout_data['masonry_layout_thumbnail_description_line_height']    = '1.7em';
							$masonry_layout_data['masonry_layout_thumbnail_description_font_family']    = 'Roboto Slab:300';
							$masonry_layout_data['masonry_layout_thumbnail_description_margin']         = '0,5,0,5';
							$masonry_layout_data['masonry_layout_thumbnail_description_padding']        = '5,10,10,5';
							$masonry_layout_data_serialize                   = array();
							$masonry_layout_data_serialize['meta_id']        = $row->id;
							$masonry_layout_data_serialize['old_gallery_id'] = $row->id;
							$masonry_layout_data_serialize['meta_key']       = 'masonry_layout_settings';// WPCS: slow query ok.
							$masonry_layout_data_serialize['meta_value']     = maybe_serialize( $masonry_layout_data );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $masonry_layout_data_serialize );

							$slideshow_layout_data = array();
							$slideshow_layout_data['slideshow_layout_general_background_color']                = '#ebe8eb';
							$slideshow_layout_data['slideshow_layout_general_border_style']                    = '0,none,#cccccc';
							$slideshow_layout_data['slideshow_layout_general_border_radius']                   = '0';
							$slideshow_layout_data['slideshow_layout_general_buttons_hover_color']             = '#105278';
							$slideshow_layout_data['slideshow_layout_general_buttons_color']                   = '#000000';
							$slideshow_layout_data['slideshow_layout_general_buttons_border_style']            = '0,none,#cccccc';
							$slideshow_layout_data['slideshow_layout_general_buttons_border_radius']           = '0';
							$slideshow_layout_data['slideshow_layout_general_shadow']                          = '0,0,0,0';
							$slideshow_layout_data['slideshow_layout_general_shadow_color']                    = '#000000';
							$slideshow_layout_data['slideshow_layout_general_buttons_transparency']            = '75';
							$slideshow_layout_data['slideshow_layout_general_filmstrip_margin']                = '5,5,5,0';
							$slideshow_layout_data['slideshow_layout_general_filmstrip_padding']               = '5,5,5,0';
							$slideshow_layout_data['slideshow_layout_general_filmstrip_border_style']          = '1,solid,#555';
							$slideshow_layout_data['slideshow_layout_general_filmstrip_border_radius']         = '0';
							$slideshow_layout_data['slideshow_layout_general_filmstrip_active_border_style']   = '2,solid,#fff';
							$slideshow_layout_data['slideshow_layout_general_filmstrip_deactive_transparency'] = '75';

							$slideshow_layout_data['slideshow_layout_gallery_title_html_tag']       = 'h2';
							$slideshow_layout_data['slideshow_layout_gallery_title_text_alignment'] = 'left';
							$slideshow_layout_data['slideshow_layout_gallery_title_font_style']     = '20,#000000';
							$slideshow_layout_data['slideshow_layout_gallery_title_line_height']    = '1.7em';
							$slideshow_layout_data['slideshow_layout_gallery_title_font_family']    = 'Roboto Slab:700';
							$slideshow_layout_data['slideshow_layout_gallery_title_margin']         = '10,0,10,0';
							$slideshow_layout_data['slideshow_layout_gallery_title_padding']        = '10,0,10,0';

							$slideshow_layout_data['slideshow_layout_gallery_description_html_tag']       = 'h3';
							$slideshow_layout_data['slideshow_layout_gallery_description_text_alignment'] = 'left';
							$slideshow_layout_data['slideshow_layout_gallery_description_font_style']     = '16,#787D85';
							$slideshow_layout_data['slideshow_layout_gallery_description_line_height']    = '1.7em';
							$slideshow_layout_data['slideshow_layout_gallery_description_font_family']    = 'Roboto Slab:300';
							$slideshow_layout_data['slideshow_layout_gallery_description_margin']         = '10,0,10,0';
							$slideshow_layout_data['slideshow_layout_gallery_description_padding']        = '0,0,10,0';

							$slideshow_layout_data['slideshow_layout_thumbnail_title_html_tag']       = 'h3';
							$slideshow_layout_data['slideshow_layout_thumbnail_title_text_alignment'] = 'left';
							$slideshow_layout_data['slideshow_layout_thumbnail_title_font_style']     = '14,#efefef';
							$slideshow_layout_data['slideshow_layout_thumbnail_title_line_height']    = '1.7em';
							$slideshow_layout_data['slideshow_layout_thumbnail_title_font_family']    = 'Roboto Slab:700';
							$slideshow_layout_data['slideshow_layout_thumbnail_title_margin']         = '0,5,0,5';
							$slideshow_layout_data['slideshow_layout_thumbnail_title_padding']        = '5,10,0,0';

							$slideshow_layout_data['slideshow_layout_thumbnail_description_html_tag']       = 'p';
							$slideshow_layout_data['slideshow_layout_thumbnail_description_text_alignment'] = 'left';
							$slideshow_layout_data['slideshow_layout_thumbnail_description_font_style']     = '12,#dfdfdf';
							$slideshow_layout_data['slideshow_layout_thumbnail_description_line_height']    = '1.7em';
							$slideshow_layout_data['slideshow_layout_thumbnail_description_font_family']    = 'Roboto Slab:300';
							$slideshow_layout_data['slideshow_layout_thumbnail_description_margin']         = '0,5,0,5';
							$slideshow_layout_data['slideshow_layout_thumbnail_description_padding']        = '5,10,0,0';

							$slideshow_layout_data_serialize                   = array();
							$slideshow_layout_data_serialize['meta_id']        = $row->id;
							$slideshow_layout_data_serialize['old_gallery_id'] = $row->id;
							$slideshow_layout_data_serialize['meta_key']       = 'slideshow_layout_settings';// WPCS: slow query ok.
							$slideshow_layout_data_serialize['meta_value']     = maybe_serialize( $slideshow_layout_data );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $slideshow_layout_data_serialize );

							$image_browser_layout_data = array();
							$image_browser_layout_data['image_browser_layout_container_width']                        = '100';
							$image_browser_layout_data['image_browser_layout_general_border_style']                   = '0,none,#000000';
							$image_browser_layout_data['image_browser_layout_general_border_radius']                  = '0';
							$image_browser_layout_data['image_browser_layout_general_shadow']                         = '0,0,0,0';
							$image_browser_layout_data['image_browser_layout_general_shadow_color']                   = '#000000';
							$image_browser_layout_data['image_browser_layout_general_buttons_font_style']             = '14,#ffffff';
							$image_browser_layout_data['image_browser_layout_general_buttons_font_family']            = 'Roboto Slab:700';
							$image_browser_layout_data['image_browser_layout_general_buttons_hover_color']            = '#105278';
							$image_browser_layout_data['image_browser_layout_general_buttons_color']                  = '#000000';
							$image_browser_layout_data['image_browser_layout_general_buttons_border_style']           = '0,none,#ffffff';
							$image_browser_layout_data['image_browser_layout_general_buttons_border_radius']          = '0';
							$image_browser_layout_data['image_browser_layout_general_image_browser_background_color'] = '#ebe8eb';
							$image_browser_layout_data['image_browser_layout_general_image_browser_opacity']          = '100';
							$image_browser_layout_data['image_browser_layout_general_button_margin']                  = '10,5,0,5';
							$image_browser_layout_data['image_browser_layout_general_button_padding']                 = '5,10,5,10';

							$image_browser_layout_data['image_browser_layout_gallery_title_html_tag']       = 'h2';
							$image_browser_layout_data['image_browser_layout_gallery_title_text_alignment'] = 'left';
							$image_browser_layout_data['image_browser_layout_gallery_title_font_style']     = '20,#000000';
							$image_browser_layout_data['image_browser_layout_gallery_title_line_height']    = '1.7em';
							$image_browser_layout_data['image_browser_layout_gallery_title_font_family']    = 'Roboto Slab:700';
							$image_browser_layout_data['image_browser_layout_gallery_title_margin']         = '10,0,10,0';
							$image_browser_layout_data['image_browser_layout_gallery_title_padding']        = '10,0,10,0';

							$image_browser_layout_data['image_browser_layout_gallery_description_html_tag']       = 'h3';
							$image_browser_layout_data['image_browser_layout_gallery_description_text_alignment'] = 'left';
							$image_browser_layout_data['image_browser_layout_gallery_description_font_style']     = '16,#787D85';
							$image_browser_layout_data['image_browser_layout_gallery_description_line_height']    = '1.7em';
							$image_browser_layout_data['image_browser_layout_gallery_description_font_family']    = 'Roboto Slab:300';
							$image_browser_layout_data['image_browser_layout_gallery_description_margin']         = '10,0,10,0';
							$image_browser_layout_data['image_browser_layout_gallery_description_padding']        = '0,0,10,0';

							$image_browser_layout_data['image_browser_layout_thumbnail_title_html_tag']       = 'h3';
							$image_browser_layout_data['image_browser_layout_thumbnail_title_text_alignment'] = 'left';
							$image_browser_layout_data['image_browser_layout_thumbnail_title_font_style']     = '14,#efefef';
							$image_browser_layout_data['image_browser_layout_thumbnail_title_line_height']    = '1.7em';
							$image_browser_layout_data['image_browser_layout_thumbnail_title_font_family']    = 'Roboto Slab:700';
							$image_browser_layout_data['image_browser_layout_thumbnail_title_margin']         = '0,5,0,5';
							$image_browser_layout_data['image_browser_layout_thumbnail_title_padding']        = '5,10,0,0';

							$image_browser_layout_data['image_browser_layout_thumbnail_description_html_tag']       = 'p';
							$image_browser_layout_data['image_browser_layout_thumbnail_description_text_alignment'] = 'left';
							$image_browser_layout_data['image_browser_layout_thumbnail_description_font_style']     = '12,#dfdfdf';
							$image_browser_layout_data['image_browser_layout_thumbnail_description_line_height']    = '1.7em';
							$image_browser_layout_data['image_browser_layout_thumbnail_description_font_family']    = 'Roboto Slab:300';
							$image_browser_layout_data['image_browser_layout_thumbnail_description_margin']         = '0,5,0,5';
							$image_browser_layout_data['image_browser_layout_thumbnail_description_padding']        = '5,10,0,0';
							$image_browser_layout_data_serialize                   = array();
							$image_browser_layout_data_serialize['meta_id']        = $row->id;
							$image_browser_layout_data_serialize['old_gallery_id'] = $row->id;
							$image_browser_layout_data_serialize['meta_key']       = 'image_browser_layout_settings';// WPCS: slow query ok.
							$image_browser_layout_data_serialize['meta_value']     = maybe_serialize( $image_browser_layout_data );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $image_browser_layout_data_serialize );

							$justified_grid_layout_data = array();
							$justified_grid_layout_data['justified_grid_layout_general_padding']                 = '0,0,0,0';
							$justified_grid_layout_data['justified_grid_layout_general_border_style']            = '0,none,#000000';
							$justified_grid_layout_data['justified_grid_layout_general_border_radius']           = '0';
							$justified_grid_layout_data['justified_grid_layout_general_shadow']                  = '0,0,0,0';
							$justified_grid_layout_data['justified_grid_layout_general_shadow_color']            = '#000000';
							$justified_grid_layout_data['justified_grid_layout_general_hover_effect_value']      = 'none,0,0,0';
							$justified_grid_layout_data['justified_grid_layout_general_trasition']               = '1';
							$justified_grid_layout_data['justified_grid_layout_general_background_transparency'] = '#ebe8eb,50';
							$justified_grid_layout_data['justified_grid_layout_general_justified_grid_opacity']  = '100';

							$justified_grid_layout_data['justified_grid_layout_gallery_title_html_tag']       = 'h2';
							$justified_grid_layout_data['justified_grid_layout_gallery_title_text_alignment'] = 'left';
							$justified_grid_layout_data['justified_grid_layout_gallery_title_font_style']     = '20,#000000';
							$justified_grid_layout_data['justified_grid_layout_gallery_title_line_height']    = '1.7em';
							$justified_grid_layout_data['justified_grid_layout_gallery_title_font_family']    = 'Roboto Slab:700';
							$justified_grid_layout_data['justified_grid_layout_gallery_title_margin']         = '10,0,10,0';
							$justified_grid_layout_data['justified_grid_layout_gallery_title_padding']        = '10,0,10,0';

							$justified_grid_layout_data['justified_grid_layout_gallery_description_html_tag']       = 'h3';
							$justified_grid_layout_data['justified_grid_layout_gallery_description_text_alignment'] = 'left';
							$justified_grid_layout_data['justified_grid_layout_gallery_description_font_style']     = '16,#787D85';
							$justified_grid_layout_data['justified_grid_layout_gallery_description_line_height']    = '1.7em';
							$justified_grid_layout_data['justified_grid_layout_gallery_description_font_family']    = 'Roboto Slab:300';
							$justified_grid_layout_data['justified_grid_layout_gallery_description_margin']         = '10,0,10,0';
							$justified_grid_layout_data['justified_grid_layout_gallery_description_padding']        = '0,0,10,0';

							$justified_grid_layout_data['justified_grid_layout_thumbnail_title_html_tag']       = 'h3';
							$justified_grid_layout_data['justified_grid_layout_thumbnail_title_text_alignment'] = 'center';
							$justified_grid_layout_data['justified_grid_layout_thumbnail_title_font_style']     = '14,#efefef';
							$justified_grid_layout_data['justified_grid_layout_thumbnail_title_line_height']    = '1.7em';
							$justified_grid_layout_data['justified_grid_layout_thumbnail_title_font_family']    = 'Roboto Slab:700';
							$justified_grid_layout_data['justified_grid_layout_thumbnail_title_margin']         = '0,5,0,0';
							$justified_grid_layout_data['justified_grid_layout_thumbnail_title_padding']        = '5,10,10,5';

							$justified_grid_layout_data['justified_grid_layout_thumbnail_description_html_tag']       = 'p';
							$justified_grid_layout_data['justified_grid_layout_thumbnail_description_text_alignment'] = 'left';
							$justified_grid_layout_data['justified_grid_layout_thumbnail_description_font_style']     = '12,#dfdfdf';
							$justified_grid_layout_data['justified_grid_layout_thumbnail_description_line_height']    = '1.7em';
							$justified_grid_layout_data['justified_grid_layout_thumbnail_description_font_family']    = 'Roboto Slab:300';
							$justified_grid_layout_data['justified_grid_layout_thumbnail_description_margin']         = '0,5,0,0';
							$justified_grid_layout_data['justified_grid_layout_thumbnail_description_padding']        = '5,10,10,5';
							$justified_grid_layout_data_serialize                   = array();
							$justified_grid_layout_data_serialize['meta_id']        = $row->id;
							$justified_grid_layout_data_serialize['old_gallery_id'] = $row->id;
							$justified_grid_layout_data_serialize['meta_key']       = 'justified_grid_layout_settings';// WPCS: slow query ok.
							$justified_grid_layout_data_serialize['meta_value']     = maybe_serialize( $justified_grid_layout_data );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $justified_grid_layout_data_serialize );

							$blog_style_layout_data                                      = array();
							$blog_style_layout_data['blog_style_layout_general_margin']  = '0,0,15,0';
							$blog_style_layout_data['blog_style_layout_general_padding'] = '0,0,0,0';
							$blog_style_layout_data['blog_style_layout_general_border_style']            = '2,solid,#cccccc';
							$blog_style_layout_data['blog_style_layout_general_border_radius']           = '0';
							$blog_style_layout_data['blog_style_layout_general_shadow']                  = '0,0,0,0';
							$blog_style_layout_data['blog_style_layout_general_shadow_color']            = '#000000';
							$blog_style_layout_data['blog_style_layout_general_hover_effect_value']      = 'none,0,0,0';
							$blog_style_layout_data['blog_style_layout_general_trasition']               = '2';
							$blog_style_layout_data['blog_style_layout_general_background_color']        = '#ebe8eb';
							$blog_style_layout_data['blog_style_layout_general_blog_style_opacity']      = '100';
							$blog_style_layout_data['blog_style_layout_general_background_transparency'] = '100';

							$blog_style_layout_data['blog_style_layout_gallery_title_html_tag']       = 'h2';
							$blog_style_layout_data['blog_style_layout_gallery_title_text_alignment'] = 'left';
							$blog_style_layout_data['blog_style_layout_gallery_title_font_style']     = '20,#000000';
							$blog_style_layout_data['blog_style_layout_gallery_title_line_height']    = '1.7em';
							$blog_style_layout_data['blog_style_layout_gallery_title_font_family']    = 'Roboto Slab:700';
							$blog_style_layout_data['blog_style_layout_gallery_title_margin']         = '10,0,10,0';
							$blog_style_layout_data['blog_style_layout_gallery_title_padding']        = '10,0,10,0';

							$blog_style_layout_data['blog_style_layout_gallery_description_html_tag']       = 'h3';
							$blog_style_layout_data['blog_style_layout_gallery_description_text_alignment'] = 'left';
							$blog_style_layout_data['blog_style_layout_gallery_description_font_style']     = '16,#787D85';
							$blog_style_layout_data['blog_style_layout_gallery_description_line_height']    = '1.7em';
							$blog_style_layout_data['blog_style_layout_gallery_description_font_family']    = 'Roboto Slab:300';
							$blog_style_layout_data['blog_style_layout_gallery_description_margin']         = '10,0,10,0';
							$blog_style_layout_data['blog_style_layout_gallery_description_padding']        = '0,0,10,0';

							$blog_style_layout_data['blog_style_layout_thumbnail_title_html_tag']       = 'h3';
							$blog_style_layout_data['blog_style_layout_thumbnail_title_text_alignment'] = 'left';
							$blog_style_layout_data['blog_style_layout_thumbnail_title_font_style']     = '14,#787D85';
							$blog_style_layout_data['blog_style_layout_thumbnail_title_line_height']    = '1.7em';
							$blog_style_layout_data['blog_style_layout_thumbnail_title_font_family']    = 'Roboto Slab:700';
							$blog_style_layout_data['blog_style_layout_thumbnail_title_margin']         = '0,5,0,5';
							$blog_style_layout_data['blog_style_layout_thumbnail_title_padding']        = '10,10,10,10';

							$blog_style_layout_data['blog_style_layout_thumbnail_description_html_tag']       = 'p';
							$blog_style_layout_data['blog_style_layout_thumbnail_description_text_alignment'] = 'left';
							$blog_style_layout_data['blog_style_layout_thumbnail_description_font_style']     = '12,#787D85';
							$blog_style_layout_data['blog_style_layout_thumbnail_description_line_height']    = '1.7em';
							$blog_style_layout_data['blog_style_layout_thumbnail_description_font_family']    = 'Roboto Slab:300';
							$blog_style_layout_data['blog_style_layout_thumbnail_description_margin']         = '0,5,0,5';
							$blog_style_layout_data['blog_style_layout_thumbnail_description_padding']        = '5,10,10,5';
							$blog_style_layout_data_serialize                   = array();
							$blog_style_layout_data_serialize['meta_id']        = $row->id;
							$blog_style_layout_data_serialize['old_gallery_id'] = $row->id;
							$blog_style_layout_data_serialize['meta_key']       = 'blog_style_layout_settings';// WPCS: slow query ok.
							$blog_style_layout_data_serialize['meta_value']     = maybe_serialize( $blog_style_layout_data );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $blog_style_layout_data_serialize );

							$compact_album_layout_data                                       = array();
							$compact_album_layout_data['compact_album_layout_cover_margin']  = '10,10,0,0';
							$compact_album_layout_data['compact_album_layout_cover_padding'] = '0,0,0,0';
							$compact_album_layout_data['compact_album_layout_cover_border_style']                  = '0,none,#000000';
							$compact_album_layout_data['compact_album_layout_cover_border_radius']                 = '0';
							$compact_album_layout_data['compact_album_layout_cover_shadow']                        = '0,0,0,0';
							$compact_album_layout_data['compact_album_layout_cover_shadow_color']                  = '#000000';
							$compact_album_layout_data['compact_album_layout_cover_hover_effect_value']            = 'none,0,0,0';
							$compact_album_layout_data['compact_album_layout_cover_transition_time']               = '1';
							$compact_album_layout_data['compact_album_layout_cover_background_color_transparency'] = '#ffffff,50';
							$compact_album_layout_data['compact_album_layout_cover_thumbnail_opacity']             = '100';
							$compact_album_layout_data['compact_album_layout_cover_thumbnail_dimensions']          = '250,200';

							$compact_album_layout_data['compact_album_layout_title_html_tag']       = 'h2';
							$compact_album_layout_data['compact_album_layout_title_text_alignment'] = 'left';
							$compact_album_layout_data['compact_album_layout_title_font_style']     = '20,#000000';
							$compact_album_layout_data['compact_album_layout_title_line_height']    = '1.7em';
							$compact_album_layout_data['compact_album_layout_title_font_family']    = 'Roboto Slab:700';
							$compact_album_layout_data['compact_album_layout_title_margin']         = '10,0,10,0';
							$compact_album_layout_data['compact_album_layout_title_padding']        = '10,0,10,0';

							$compact_album_layout_data['compact_album_layout_description_html_tag']       = 'h3';
							$compact_album_layout_data['compact_album_layout_description_text_alignment'] = 'left';
							$compact_album_layout_data['compact_album_layout_description_font_style']     = '16,#787D85';
							$compact_album_layout_data['compact_album_layout_description_line_height']    = '1.7em';
							$compact_album_layout_data['compact_album_layout_description_font_family']    = 'Roboto Slab:300';
							$compact_album_layout_data['compact_album_layout_description_margin']         = '10,0,10,0';
							$compact_album_layout_data['compact_album_layout_description_padding']        = '0,0,10,0';

							$compact_album_layout_data['compact_album_layout_gallery_title_html_tag']       = 'h3';
							$compact_album_layout_data['compact_album_layout_gallery_title_text_alignment'] = 'left';
							$compact_album_layout_data['compact_album_layout_gallery_title_font_style']     = '14,#787D85';
							$compact_album_layout_data['compact_album_layout_gallery_title_line_height']    = '1.7em';
							$compact_album_layout_data['compact_album_layout_gallery_title_font_family']    = 'Roboto Slab:700';
							$compact_album_layout_data['compact_album_layout_gallery_title_margin']         = '0,5,0,5';
							$compact_album_layout_data['compact_album_layout_gallery_title_padding']        = '10,10,10,10';

							$compact_album_layout_data['compact_album_layout_gallery_description_html_tag']       = 'p';
							$compact_album_layout_data['compact_album_layout_gallery_description_text_alignment'] = 'left';
							$compact_album_layout_data['compact_album_layout_gallery_description_font_style']     = '12,#787D85';
							$compact_album_layout_data['compact_album_layout_gallery_description_line_height']    = '1.7em';
							$compact_album_layout_data['compact_album_layout_gallery_description_font_family']    = 'Roboto Slab:300';
							$compact_album_layout_data['compact_album_layout_gallery_description_margin']         = '0,5,0,5';
							$compact_album_layout_data['compact_album_layout_gallery_description_padding']        = '5,10,10,10';

							$compact_album_layout_data['compact_album_layout_button_text']               = 'Back To Album';
							$compact_album_layout_data['compact_album_layout_button_color']              = '#a4cd39';
							$compact_album_layout_data['compact_album_layout_button_hover_color']        = '#a4cd39';
							$compact_album_layout_data['compact_album_layout_button_font_style']         = '14,#ffffff';
							$compact_album_layout_data['compact_album_layout_button_font_hover_color']   = '#ffffff';
							$compact_album_layout_data['compact_album_layout_button_text_alignment']     = 'left';
							$compact_album_layout_data['compact_album_layout_button_border_style']       = '0,none,#a4cd39';
							$compact_album_layout_data['compact_album_layout_button_border_hover_color'] = '#a4cd39';
							$compact_album_layout_data['compact_album_layout_button_border_radius']      = '4';
							$compact_album_layout_data['compact_album_layout_button_text_font_family']   = 'Roboto Slab:700';
							$compact_album_layout_data['compact_album_layout_button_margin']             = '10,0,0,0';
							$compact_album_layout_data['compact_album_layout_button_padding']            = '8,12,8,12';

							$compact_album_data_serialize                   = array();
							$compact_album_data_serialize['meta_id']        = $row->id;
							$compact_album_data_serialize['old_gallery_id'] = $row->id;
							$compact_album_data_serialize['meta_key']       = 'compact_album_layout_settings';// WPCS: slow query ok.
							$compact_album_data_serialize['meta_value']     = maybe_serialize( $compact_album_layout_data );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $compact_album_data_serialize );

							$extended_album_layout_data                                        = array();
							$extended_album_layout_data['extended_album_layout_cover_margin']  = '10,10,10,10';
							$extended_album_layout_data['extended_album_layout_cover_padding'] = '0,0,0,0';
							$extended_album_layout_data['extended_album_layout_cover_border_style']                  = '0,none,#000000';
							$extended_album_layout_data['extended_album_layout_cover_border_radius']                 = '0';
							$extended_album_layout_data['extended_album_layout_cover_shadow']                        = '0,0,0,0';
							$extended_album_layout_data['extended_album_layout_cover_shadow_color']                  = '#000000';
							$extended_album_layout_data['extended_album_layout_cover_hover_effect_value']            = 'none,0,0,0';
							$extended_album_layout_data['extended_album_layout_cover_transition_time']               = '1';
							$extended_album_layout_data['extended_album_layout_cover_background_color_transparency'] = '#ffffff,50';
							$extended_album_layout_data['extended_album_layout_cover_thumbnail_opacity']             = '100';
							$extended_album_layout_data['extended_album_layout_cover_thumbnail_dimensions']          = '250,200';

							$extended_album_layout_data['extended_album_layout_title_html_tag']       = 'h2';
							$extended_album_layout_data['extended_album_layout_title_text_alignment'] = 'left';
							$extended_album_layout_data['extended_album_layout_title_font_style']     = '20,#000000';
							$extended_album_layout_data['extended_album_layout_title_line_height']    = '1.7em';
							$extended_album_layout_data['extended_album_layout_title_font_family']    = 'Roboto Slab:700';
							$extended_album_layout_data['extended_album_layout_title_margin']         = '10,0,10,0';
							$extended_album_layout_data['extended_album_layout_title_padding']        = '10,0,10,0';

							$extended_album_layout_data['extended_album_layout_description_html_tag']       = 'h3';
							$extended_album_layout_data['extended_album_layout_description_text_alignment'] = 'left';
							$extended_album_layout_data['extended_album_layout_description_font_style']     = '16,#787D85';
							$extended_album_layout_data['extended_album_layout_description_line_height']    = '1.7em';
							$extended_album_layout_data['extended_album_layout_description_font_family']    = 'Roboto Slab:300';
							$extended_album_layout_data['extended_album_layout_description_margin']         = '10,0,10,0';
							$extended_album_layout_data['extended_album_layout_description_padding']        = '0,0,10,0';

							$extended_album_layout_data['extended_album_layout_gallery_title_html_tag']       = 'h3';
							$extended_album_layout_data['extended_album_layout_gallery_title_text_alignment'] = 'left';
							$extended_album_layout_data['extended_album_layout_gallery_title_font_style']     = '16,#000000';
							$extended_album_layout_data['extended_album_layout_gallery_title_line_height']    = '1.7em';
							$extended_album_layout_data['extended_album_layout_gallery_title_font_family']    = 'Roboto Slab:700';
							$extended_album_layout_data['extended_album_layout_gallery_title_margin']         = '0,5,0,5';
							$extended_album_layout_data['extended_album_layout_gallery_title_padding']        = '10,10,10,10';

							$extended_album_layout_data['extended_album_layout_gallery_description_html_tag']       = 'p';
							$extended_album_layout_data['extended_album_layout_gallery_description_text_alignment'] = 'left';
							$extended_album_layout_data['extended_album_layout_gallery_description_font_style']     = '12,#787D85';
							$extended_album_layout_data['extended_album_layout_gallery_description_line_height']    = '1.7em';
							$extended_album_layout_data['extended_album_layout_gallery_description_font_family']    = 'Roboto Slab:300';
							$extended_album_layout_data['extended_album_layout_gallery_description_margin']         = '0,5,0,5';
							$extended_album_layout_data['extended_album_layout_gallery_description_padding']        = '5,10,10,10';

							$extended_album_layout_data['extended_album_layout_button_text']               = 'Back To Album';
							$extended_album_layout_data['extended_album_layout_button_color']              = '#a4cd39';
							$extended_album_layout_data['extended_album_layout_button_hover_color']        = '#a4cd39';
							$extended_album_layout_data['extended_album_layout_button_font_style']         = '14,#ffffff';
							$extended_album_layout_data['extended_album_layout_button_font_hover_color']   = '#ffffff';
							$extended_album_layout_data['extended_album_layout_button_text_alignment']     = 'left';
							$extended_album_layout_data['extended_album_layout_button_border_style']       = '0,none,#a4cd39';
							$extended_album_layout_data['extended_album_layout_button_border_hover_color'] = '#a4cd39';
							$extended_album_layout_data['extended_album_layout_button_border_radius']      = '4';
							$extended_album_layout_data['extended_album_layout_button_text_font_family']   = 'Roboto Slab:700';
							$extended_album_layout_data['extended_album_layout_button_margin']             = '10,0,0,0';
							$extended_album_layout_data['extended_album_layout_button_padding']            = '8,12,8,12';

							$extended_album_data_serialize                   = array();
							$extended_album_data_serialize['meta_id']        = $row->id;
							$extended_album_data_serialize['old_gallery_id'] = $row->id;
							$extended_album_data_serialize['meta_key']       = 'extended_album_layout_settings';// WPCS: slow query ok.
							$extended_album_data_serialize['meta_value']     = maybe_serialize( $extended_album_layout_data );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $extended_album_data_serialize );

							$custom_css_data               = array();
							$custom_css_data['custom_css'] = '';

							$custom_css_data_serialize                   = array();
							$custom_css_data_serialize['meta_id']        = $row->id;
							$custom_css_data_serialize['old_gallery_id'] = $row->id;
							$custom_css_data_serialize['meta_key']       = 'custom_css';// WPCS: slow query ok.
							$custom_css_data_serialize['meta_value']     = maybe_serialize( $custom_css_data );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $custom_css_data_serialize );
							break;

						case 'lightboxes_settings':
							$fancy_box_setting                                      = array();
							$fancy_box_setting['fancy_box_margin']                  = '100';
							$fancy_box_setting['fancy_box_padding']                 = '20';
							$fancy_box_setting['fancy_box_open_effect']             = 'fade';
							$fancy_box_setting['fancy_box_close_effect']            = 'fade';
							$fancy_box_setting['fancy_box_open_speed']              = '300';
							$fancy_box_setting['fancy_box_close_speed']             = '300';
							$fancy_box_setting['fancy_box_overlay_color']           = '#000000';
							$fancy_box_setting['fancy_box_overlay_opacity']         = '75';
							$fancy_box_setting['fancy_box_border_style']            = '2,solid,#cccccc';
							$fancy_box_setting['fancy_box_border_radius']           = '2';
							$fancy_box_setting['fancy_box_background_color']        = '#ffffff';
							$fancy_box_setting['fancy_box_background_opacity']      = '100';
							$fancy_box_setting['fancy_box_title']                   = 'true';
							$fancy_box_setting['fancy_box_title_font_style']        = '14,#000000';
							$fancy_box_setting['fancy_box_title_font_family']       = 'Roboto Slab:700';
							$fancy_box_setting['fancy_box_description']             = 'true';
							$fancy_box_setting['fancy_box_description_font_style']  = '12,#000000';
							$fancy_box_setting['fancy_box_description_font_family'] = 'Roboto Slab:300';
							$fancy_box_setting['fancy_box_cyclic']                  = 'false';
							$fancy_box_setting['fancy_box_arrows']                  = 'true';
							$fancy_box_setting['fancy_box_mouse_wheel']             = 'true';
							$fancy_box_setting['fancy_box_button_position']         = 'bottom';
							$fancy_box_setting['fancy_box_enable_escape_button']    = 'false';
							$fancy_box_setting['fancy_box_title_position']          = 'inside';
							$fancy_box_setting['fancy_box_show_close_button']       = 'true';
							$fancy_box_setting['fancy_box_change_speed']            = '3000';
							$fancy_box_setting['fancy_box_title_html_tag']          = 'h2';
							$fancy_box_setting['fancy_box_title_text_alignment']    = 'left';
							$fancy_box_setting['fancy_box_title_margin']            = '5,0,5,0';
							$fancy_box_setting['fancy_box_title_padding']           = '0,0,0,0';
							$fancy_box_setting['fancy_box_description_html_tag']    = 'h3';
							$fancy_box_setting['fancy_box_description_text_alignment'] = 'left';
							$fancy_box_setting['fancy_box_description_margin']         = '5,0,5,0';
							$fancy_box_setting['fancy_box_description_padding']        = '0,0,0,0';

							$fancy_box_data_serialize                   = array();
							$fancy_box_data_serialize['meta_id']        = $row->id;
							$fancy_box_data_serialize['old_gallery_id'] = $row->id;
							$fancy_box_data_serialize['meta_key']       = 'fancy_box_settings';// WPCS: slow query ok.
							$fancy_box_data_serialize['meta_value']     = maybe_serialize( $fancy_box_setting );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $fancy_box_data_serialize );

							$color_box_settings                            = array();
							$color_box_settings['lightbox_color_box_type'] = 'type1';
							$color_box_settings['lightbox_color_box_transition_effect'] = 'elastic';
							$color_box_settings['lightbox_color_box_transition_speed']  = '350';
							$color_box_settings['lightbox_color_box_fadeout']           = '300';
							$color_box_settings['lightbox_color_box_opacity']           = '75';
							$color_box_settings['lightbox_color_box_title']             = 'true';

							$color_box_settings['lightbox_color_box_title_html_tag']       = 'h2';
							$color_box_settings['lightbox_color_box_title_text_alignment'] = 'left';
							$color_box_settings['lightbox_color_box_title_font_style']     = '16,#ffffff';
							$color_box_settings['lightbox_color_box_title_font_family']    = 'Roboto Slab:700';
							$color_box_settings['lightbox_color_box_title_margin']         = '5,0,5,0';
							$color_box_settings['lightbox_color_box_title_padding']        = '0,0,0,10';

							$color_box_settings['lightbox_color_box_description']                = 'true';
							$color_box_settings['lightbox_color_box_description_html_tag']       = 'h3';
							$color_box_settings['lightbox_color_box_description_text_alignment'] = 'left';
							$color_box_settings['lightbox_color_box_description_font_style']     = '14,#ffffff';
							$color_box_settings['lightbox_color_box_description_font_family']    = 'Roboto Slab:300';
							$color_box_settings['lightbox_color_box_description_margin']         = '5,0,5,0';
							$color_box_settings['lightbox_color_box_description_padding']        = '0,0,0,10';

							$color_box_settings['lightbox_color_box_open_page_load']    = 'false';
							$color_box_settings['lightbox_color_box_show_close_button'] = 'true';
							$color_box_settings['lightbox_color_box_sideshow']          = 'true';
							$color_box_settings['lightbox_color_box_slideshow_speed']   = '10000';
							$color_box_settings['lightbox_color_box_auto_slideshow']    = 'true';
							$color_box_settings['lightbox_color_box_fixed_position']    = 'false';
							$color_box_settings['lightbox_color_box_postioning']        = 'reposition';
							$color_box_settings['lightbox_color_box_postioning_value']  = '50';
							$color_box_settings['lightbox_color_box_background']        = '#000000';

							$color_box_setting_serialize                   = array();
							$color_box_setting_serialize['meta_id']        = $row->id;
							$color_box_setting_serialize['old_gallery_id'] = $row->id;
							$color_box_setting_serialize['meta_key']       = 'color_box_settings';// WPCS: slow query ok.
							$color_box_setting_serialize['meta_value']     = maybe_serialize( $color_box_settings );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $color_box_setting_serialize );

							$foo_box_settings                            = array();
							$foo_box_settings['foo_box_overlay_color']   = '#000000';
							$foo_box_settings['foo_box_overlay_opacity'] = '75';
							$foo_box_settings['foo_box_border_style']    = '5,solid,#ffffff';
							$foo_box_settings['foo_box_border_radius']   = '5';

							$foo_box_settings['foo_box_image_title_html_tag']       = 'h2';
							$foo_box_settings['foo_box_image_title_text_alignment'] = 'left';
							$foo_box_settings['foo_box_title']                      = 'true';
							$foo_box_settings['foo_box_title_font_style']           = '16,#ffffff';
							$foo_box_settings['foo_box_title_font_family']          = 'Roboto Slab:700';
							$foo_box_settings['foo_box_image_title_margin']         = '10,0,10,0';
							$foo_box_settings['foo_box_image_title_padding']        = '10,10,10,10';

							$foo_box_settings['foo_box_image_description_html_tag']       = 'h3';
							$foo_box_settings['foo_box_image_description_text_alignment'] = 'left';
							$foo_box_settings['foo_box_description']                      = 'true';
							$foo_box_settings['foo_box_description_font_style']           = '14,#ffffff';
							$foo_box_settings['foo_box_description_font_family']          = 'Roboto Slab:300';
							$foo_box_settings['foo_box_image_description_margin']         = '5,0,5,0';
							$foo_box_settings['foo_box_image_description_padding']        = '20,10,10,10';

							$foo_box_settings['foo_box_show_count']          = 'true';
							$foo_box_settings['foo_box_close_overlay_click'] = 'false';
							$foo_box_settings['foo_box_hide_page_scrollbar'] = 'false';
							$foo_box_settings['foo_box_show_on_hover']       = 'false';

							$foo_box_settings_serialize                   = array();
							$foo_box_settings_serialize['meta_id']        = $row->id;
							$foo_box_settings_serialize['old_gallery_id'] = $row->id;
							$foo_box_settings_serialize['meta_key']       = 'foo_box_settings';// WPCS: slow query ok.
							$foo_box_settings_serialize['meta_value']     = maybe_serialize( $foo_box_settings );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $foo_box_settings_serialize );

							$nivo_lightbox_settings                                       = array();
							$nivo_lightbox_settings['lightbox_nivo_choose_effect']        = 'fade';
							$nivo_lightbox_settings['lightbox_nivo_keyboard_navigation']  = 'false';
							$nivo_lightbox_settings['lightbox_nivo_click_image_to_close'] = 'true';
							$nivo_lightbox_settings['lightbox_nivo_click_overlay_to_close'] = 'true';
							$nivo_lightbox_settings['lightbox_nivo_overlay_color']          = '#000000';
							$nivo_lightbox_settings['lightbox_nivo_overlay_opacity']        = '75';
							$nivo_lightbox_settings['lightbox_nivo_border_style']           = '5,solid,#ffffff';
							$nivo_lightbox_settings['lightbox_nivo_border_radius']          = '5';
							$nivo_lightbox_settings['lightbox_nivo_title']                  = 'true';

							$nivo_lightbox_settings['lightbox_nivo_title_html_tag']       = 'h2';
							$nivo_lightbox_settings['lightbox_nivo_title_text_alignment'] = 'center';
							$nivo_lightbox_settings['lightbox_nivo_title_font_style']     = '16,#ffffff';
							$nivo_lightbox_settings['lightbox_nivo_title_font_family']    = 'Roboto Slab:700';
							$nivo_lightbox_settings['lightbox_nivo_title_margin']         = '10,0,0,0';
							$nivo_lightbox_settings['lightbox_nivo_title_padding']        = '10,10,0,10';

							$nivo_lightbox_settings['lightbox_nivo_description']                = 'true';
							$nivo_lightbox_settings['lightbox_nivo_description_html_tag']       = 'h3';
							$nivo_lightbox_settings['lightbox_nivo_description_text_alignment'] = 'center';
							$nivo_lightbox_settings['lightbox_nivo_description_font_style']     = '14,#ffffff';
							$nivo_lightbox_settings['lightbox_nivo_description_font_family']    = 'Roboto Slab:300';
							$nivo_lightbox_settings['lightbox_nivo_description_margin']         = '0,0,0,0';
							$nivo_lightbox_settings['lightbox_nivo_description_padding']        = '0,10,10,10';

							$nivo_lightbox_serialize                   = array();
							$nivo_lightbox_serialize['meta_id']        = $row->id;
							$nivo_lightbox_serialize['old_gallery_id'] = $row->id;
							$nivo_lightbox_serialize['meta_key']       = 'nivo_lightbox_settings';// WPCS: slow query ok.
							$nivo_lightbox_serialize['meta_value']     = maybe_serialize( $nivo_lightbox_settings );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $nivo_lightbox_serialize );

							$lightcase_settings                               = array();
							$lightcase_settings['lightcase_image_transition'] = 'fade';
							$lightcase_settings['lightcase_animation_speed_starting_transition'] = 350;
							$lightcase_settings['lightcase_animation_speed_ending_transition']   = 250;
							$lightcase_settings['lightcase_onoverlay_color']                     = '#000000';
							$lightcase_settings['lightcase_onoverlay_opacity']                   = 75;
							$lightcase_settings['lightcase_button_font_style']                   = '30,#ffffff';
							$lightcase_settings['lightcase_close_button']                        = 'show';
							$lightcase_settings['lightcase_image_counter']                       = 'show';
							$lightcase_settings['lightcase_counter_font_style']                  = '10,#ffffff';
							$lightcase_settings['lightcase_counter_font_family']                 = 'Roboto Slab:700';
							$lightcase_settings['lightcase_border']                              = '0,none,#ffffff';
							$lightcase_settings['lightcase_border_radius']                       = 0;
							$lightcase_settings['lightcase_autoplay_slideshow']                  = 'true';
							$lightcase_settings['lightcase_slideshow_interval']                  = '10';

							$lightcase_settings['lightcase_image_title_html_tag']       = 'h2';
							$lightcase_settings['lightcase_image_title_text_alignment'] = 'left';
							$lightcase_settings['lightcase_image_title_font_style']     = '16,#ffffff';
							$lightcase_settings['lightcase_image_title_font_family']    = 'Roboto Slab:700';
							$lightcase_settings['lightcase_image_title_margin']         = '5,0,5,0';
							$lightcase_settings['lightcase_image_title_padding']        = '0,0,0,0';
							$lightcase_settings['lightcase_image_title']                = 'true';
							$lightcase_settings['lightcase_image_description']          = 'true';

							$lightcase_settings['lightcase_image_description_html_tag']       = 'h3';
							$lightcase_settings['lightcase_image_description_text_alignment'] = 'left';
							$lightcase_settings['lightcase_image_description_font_style']     = '14,#ffffff';
							$lightcase_settings['lightcase_image_description_font_family']    = 'Roboto Slab:300';
							$lightcase_settings['lightcase_image_description_margin']         = '5,0,5,0';
							$lightcase_settings['lightcase_image_description_padding']        = '0,0,0,0';

							$lightcase_settings_serialize                   = array();
							$lightcase_settings_serialize['meta_id']        = $row->id;
							$lightcase_settings_serialize['old_gallery_id'] = $row->id;
							$lightcase_settings_serialize['meta_key']       = 'lightcase_settings';// WPCS: slow query ok.
							$lightcase_settings_serialize['meta_value']     = maybe_serialize( $lightcase_settings );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $lightcase_settings_serialize );
							break;

						case 'general_settings':
							$global_options = array();
							$global_options['global_options_generated_image_dimensions'] = '1600,900';
							$global_options['global_options_thumbnail_dimensions']       = '250,200';
							$global_options['global_options_language_direction']         = 'left_to_right';
							$global_options['global_options_right_click_protection']     = 'disable';

							$global_options_serialize                   = array();
							$global_options_serialize['meta_id']        = $row->id;
							$global_options_serialize['old_gallery_id'] = $row->id;
							$global_options_serialize['meta_key']       = 'global_options_settings';// WPCS: slow query ok.
							$global_options_serialize['meta_value']     = maybe_serialize( $global_options );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $global_options_serialize );

							$lazyload_settings                                 = array();
							$lazyload_settings['loader_text']                  = 'show';
							$lazyload_settings['lazy_loader_title']            = 'Loading. Please Wait...';
							$lazyload_settings['lazy_loader_background_color'] = '#ffffff';
							$lazyload_settings['lazy_loader_color']            = '#080808';
							$lazyload_settings['lazy_loader_font_style']       = '15,#000000';
							$lazyload_settings['loader_font_family']           = 'Roboto Slab:700';

							$lazyload_settings_serialize                   = array();
							$lazyload_settings_serialize['meta_id']        = $row->id;
							$lazyload_settings_serialize['old_gallery_id'] = $row->id;
							$lazyload_settings_serialize['meta_key']       = 'lazy_load_settings';// WPCS: slow query ok.
							$lazyload_settings_serialize['meta_value']     = maybe_serialize( $lazyload_settings );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $lazyload_settings_serialize );

							$searchbox_settings                                = array();
							$searchbox_settings['search_box_font_style']       = '14,#000000';
							$searchbox_settings['search_box_font_family']      = 'Roboto Slab:700';
							$searchbox_settings['search_box_placeholder_text'] = 'Search ...';
							$searchbox_settings['search_box_background_color_and_background_transparency'] = ',100';
							$searchbox_settings['search_box_border_style']                                 = '2,solid,#9e9e9e';
							$searchbox_settings['search_box_border_radius']                                = '0';
							$searchbox_settings['search_box_margin']                                       = '0,5,20,0';
							$searchbox_settings['search_box_padding']                                      = '5,10,5,10';

							$searchbox_settings_serialize                   = array();
							$searchbox_settings_serialize['meta_id']        = $row->id;
							$searchbox_settings_serialize['old_gallery_id'] = $row->id;
							$searchbox_settings_serialize['meta_key']       = 'search_box_settings';// WPCS: slow query ok.
							$searchbox_settings_serialize['meta_value']     = maybe_serialize( $searchbox_settings );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $searchbox_settings_serialize );

							$orderby_settings                         = array();
							$orderby_settings['order_by_font_style']  = '14,#000000';
							$orderby_settings['order_by_font_family'] = 'Roboto Slab:700';
							$orderby_settings['order_by_background_color_and_background_transparency'] = ',100';
							$orderby_settings['order_by_background_hover_color']                       = '';
							$orderby_settings['order_by_active_font_color']                            = '#2fbfc1';
							$orderby_settings['order_by_active_font_hover_color']                      = '#2fbfc1';
							$orderby_settings['order_by_border_style']                                 = '2,solid,#9e9e9e';
							$orderby_settings['order_by_border_radius']                                = '0';
							$orderby_settings['order_by_border_hover_color']                           = '#2fbfc1';
							$orderby_settings['order_by_margin']                                       = '0,5,20,0';
							$orderby_settings['order_by_padding']                                      = '5,10,5,10';

							$orderby_settings_serialize                   = array();
							$orderby_settings_serialize['meta_id']        = $row->id;
							$orderby_settings_serialize['old_gallery_id'] = $row->id;
							$orderby_settings_serialize['meta_key']       = 'order_by_settings';// WPCS: slow query ok.
							$orderby_settings_serialize['meta_value']     = maybe_serialize( $orderby_settings );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $orderby_settings_serialize );

							$filter_settings                        = array();
							$filter_settings['filters_font_style']  = '14,#000000';
							$filter_settings['filters_font_family'] = 'Roboto Slab:700';
							$filter_settings['filters_margin']      = '0,5,20,0';
							$filter_settings['filters_padding']     = '5,10,5,10';
							$filter_settings['filters_background_color_and_background_transparency'] = ',100';
							$filter_settings['filters_background_hover_color']                       = '';
							$filter_settings['filters_border_style']                                 = '2,solid,#9e9e9e';
							$filter_settings['filters_border_radius']                                = '0';
							$filter_settings['filters_border_hover_color']                           = '#2fbfc1';
							$filter_settings['filters_active_font_color']                            = '#2fbfc1';
							$filter_settings['filters_active_font_hover_color']                      = '#2fbfc1';

							$filter_settings_serialize                   = array();
							$filter_settings_serialize['meta_id']        = $row->id;
							$filter_settings_serialize['old_gallery_id'] = $row->id;
							$filter_settings_serialize['meta_key']       = 'filter_settings';// WPCS: slow query ok.
							$filter_settings_serialize['meta_value']     = maybe_serialize( $filter_settings );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $filter_settings_serialize );

							$page_navigation                                     = array();
							$page_navigation['page_navigation_margin']           = '20,2,20,2';
							$page_navigation['page_navigation_padding']          = '5,10,5,10';
							$page_navigation['page_navigation_border_style']     = '1,solid,#000000';
							$page_navigation['page_navigation_border_radius']    = '0';
							$page_navigation['page_navigation_alignment']        = 'center';
							$page_navigation['page_navigation_position']         = 'bottom';
							$page_navigation['page_navigation_numbering']        = 'yes';
							$page_navigation['page_navigation_button_text']      = 'text';
							$page_navigation['page_navigation_font_style']       = '14,#ffffff';
							$page_navigation['page_navigation_font_family']      = 'Roboto Slab:700';
							$page_navigation['page_navigation_background_color'] = '#000000';
							$page_navigation['page_navigation_background_transparency'] = '100';

							$page_navigation_serialize                   = array();
							$page_navigation_serialize['meta_id']        = $row->id;
							$page_navigation_serialize['old_gallery_id'] = $row->id;
							$page_navigation_serialize['meta_key']       = 'page_navigation_settings';// WPCS: slow query ok.
							$page_navigation_serialize['meta_value']     = maybe_serialize( $page_navigation );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $page_navigation_serialize );

							$watermark_settings                                  = array();
							$watermark_settings['watermark_settings_type']       = 'none';
							$watermark_settings['watermark_settings_text']       = '';
							$watermark_settings['watermark_settings_font_style'] = '20,#cccccc';
							$watermark_settings['watermark_settings_position']   = 'top_left';
							$watermark_settings['watermark_settings_url']        = '';
							$watermark_settings['watermark_settings_size']       = '';
							$watermark_settings['watermark_setting_angle']       = '0';
							$watermark_settings['watermark_setting_offset']      = '0,0';
							$watermark_settings['watermark_setting_opacity']     = '100';

							$watermark_settings_serialize                   = array();
							$watermark_settings_serialize['meta_id']        = $row->id;
							$watermark_settings_serialize['old_gallery_id'] = $row->id;
							$watermark_settings_serialize['meta_key']       = 'watermark_settings';// WPCS: slow query ok.
							$watermark_settings_serialize['meta_value']     = maybe_serialize( $watermark_settings );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $watermark_settings_serialize );

							$advertisement                              = array();
							$advertisement['advertisement_type']        = 'none';
							$advertisement['advertisement_text']        = '';
							$advertisement['advertisement_link']        = '';
							$advertisement['advertisement_font_style']  = '20,#cccccc';
							$advertisement['advertisement_text_angle']  = '';
							$advertisement['advertisement_font_family'] = 'Roboto Slab:300';
							$advertisement['advertisement_position']    = 'top_left';
							$advertisement['advertisement_url']         = '';
							$advertisement['advertisement_width']       = '100';
							$advertisement['advertisement_height']      = '100';
							$advertisement['advertisement_opacity']     = '100';

							$advertisement_serialize                   = array();
							$advertisement_serialize['meta_id']        = $row->id;
							$advertisement_serialize['old_gallery_id'] = $row->id;
							$advertisement_serialize['meta_key']       = 'advertisement_settings';// WPCS: slow query ok.
							$advertisement_serialize['meta_value']     = maybe_serialize( $advertisement );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $advertisement_serialize );
							break;

						case 'other_settings':
							$other_settings                              = array();
							$other_settings['remove_table_at_uninstall'] = 'enable';
							$other_settings['automatic_updates']         = 'disable';

							$other_settings_serialize                   = array();
							$other_settings_serialize['meta_id']        = $row->id;
							$other_settings_serialize['old_gallery_id'] = $row->id;
							$other_settings_serialize['meta_key']       = 'other_settings';// WPCS: slow query ok.
							$other_settings_serialize['meta_value']     = maybe_serialize( $other_settings );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $other_settings_serialize );
							break;
						case 'roles_and_capabilities_settings':
							$roles_data                                     = array();
							$roles_data['roles_and_capabilities']           = '1,1,1,0,0,0';
							$roles_data['show_gallery_master_top_bar_menu'] = 'enable';
							$roles_data['others_full_control_capability']   = '0';
							$roles_data['administrator_privileges']         = '1,1,1,1,1,1,1,1,1,1,1,1';
							$roles_data['author_privileges']                = '0,1,1,0,0,0,1,0,0,0,1,0';
							$roles_data['editor_privileges']                = '0,0,0,0,0,0,1,0,1,0,0,0';
							$roles_data['contributor_privileges']           = '0,0,0,1,0,0,1,0,0,0,0,0';
							$roles_data['subscriber_privileges']            = '0,0,0,0,0,0,0,0,0,0,0,0';
							$roles_data['other_privileges']                 = '0,0,0,0,0,0,0,0,0,0,0,0';
							$user_capabilities                              = get_others_capabilities_gallery_master();
							$other_roles_array                              = array();
							$other_roles_access_array                       = array(
								'manage_options',
								'edit_plugins',
								'edit_posts',
								'publish_posts',
								'publish_pages',
								'edit_pages',
								'read',
							);
							foreach ( $other_roles_access_array as $role ) {
								if ( in_array( $role, $user_capabilities, true ) ) {
									array_push( $other_roles_array, $role );
								}
							}
							$roles_data['capabilities'] = $other_roles_array;

							$roles_data_serialize                   = array();
							$roles_data_serialize['meta_id']        = $row->id;
							$roles_data_serialize['old_gallery_id'] = $row->id;
							$roles_data_serialize['meta_key']       = 'roles_and_capabilities_settings';// WPCS: slow query ok.
							$roles_data_serialize['meta_value']     = maybe_serialize( $roles_data );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $roles_data_serialize );
							break;
					}
				}
			}
		}
		if ( ! function_exists( 'get_parent_id_gallery_master' ) ) {
			/**
			 * Get gallery id.
			 *
			 * @param string $type passes parameter as type.
			 */
			function get_parent_id_gallery_master( $type ) {
						global $wpdb;
						$parent_id = $wpdb->get_var(
							$wpdb->prepare(
								'SELECT id FROM ' . $wpdb->prefix . 'gallery_master WHERE type = %s', $type
							)
						);// WPCS: db call ok, cache ok.
						return $parent_id;
			}
		}
		$obj_dbhelper_gallery_master_meta_table = new dbhelper_install_script_gallery_master();
		/**
		 * This function is used to get thumbnail dimensions.
		 */
		function get_thumbnail_dimension_gallery_master() {
			global $wpdb;
			$thumbnail_data = $wpdb->get_var(
				$wpdb->prepare(
					'SELECT meta_value FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE meta_key = %s', 'global_options_settings'
				)
			);// WPCS: db call ok, cache ok.

			$thumbnail_data_unserialize = maybe_unserialize( $thumbnail_data );
			$image_dimension            = explode( ',', $thumbnail_data_unserialize['global_options_generated_image_dimensions'] );
			$thumbnail_dimensions       = explode( ',', $thumbnail_data_unserialize['global_options_thumbnail_dimensions'] );
			$image_data                 = array_merge( $image_dimension, $thumbnail_dimensions );
			return $image_data;
		}
		switch ( $gallery_master_version_number ) {
			case '':
				global $wpdb, $current_user;
				$gallery_master_admin_notices_array                    = array();
				$gallery_master_start_date                             = date( 'm/d/Y' );
				$gallery_master_start_date                             = strtotime( $gallery_master_start_date );
				$gallery_master_start_date                             = strtotime( '+7 day', $gallery_master_start_date );
				$gallery_master_start_date                             = date( 'm/d/Y', $gallery_master_start_date );
				$gallery_master_admin_notices_array['two_week_review'] = array( 'start' => $gallery_master_start_date, 'int' => 7, 'dismissed' => 0 ); // @codingStandardsIgnoreLine.
				update_option( 'gm_admin_notice', $gallery_master_admin_notices_array );

				table_gallery_master();
				table_gallery_master_meta();

				$insert_parent_table_data              = array();
				$insert_parent_table_data['type']      = 'serialized_data';
				$insert_parent_table_data['parent_id'] = '0';
				$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_parent(), $insert_parent_table_data );
				$count_gallery = $wpdb->get_var(
					$wpdb->prepare(
						'SELECT count(id) FROM ' . $wpdb->prefix . 'gallery_master WHERE type = %s', 'gallery'
					)
				);// WPCS: db call ok, cache ok.
				if ( 0 == $count_gallery ) { // loose comparison ok.
						$gallery_parent_id           = get_parent_id_gallery_master( 'galleries' );
						$insert_gallery              = array();
						$insert_gallery['type']      = 'gallery';
						$insert_gallery['parent_id'] = $gallery_parent_id;
						$gallery_id                  = $obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_parent(), $insert_gallery );

						$insert_gallery_meta                        = array();
						$insert_gallery_meta['gallery_title']       = 'Every day is a journey, and the journey itself is home.';
						$insert_gallery_meta['gallery_description'] = '<p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.</p>';
						$insert_gallery_meta['created_date']        = time();
						$insert_gallery_meta['edited_on']           = time();
						$insert_gallery_meta['gallery_cover_image'] = 'demo2.jpg';
						$insert_gallery_meta['edited_by']           = $current_user->display_name;
						$insert_gallery_meta['author']              = $current_user->display_name;

						$insert_gallery_data                   = array();
						$insert_gallery_data['meta_id']        = $gallery_id;
						$insert_gallery_data['old_gallery_id'] = $gallery_id;
						$insert_gallery_data['meta_key']       = 'gallery_data';// WPCS: db sql slow query.
						$insert_gallery_data['meta_value']     = maybe_serialize( $insert_gallery_meta );// WPCS: db sql slow query.
						$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $insert_gallery_data );

						$image_meta_data = array();

						$images = array( 'demo1.jpg', 'demo2.jpg', 'demo3.jpg', 'after.jpg', 'bg-app.jpg', 'demo1.jpg', 'demo2.jpg', 'demo3.jpg', 'after.jpg', 'bg-app.jpg', 'demo1.jpg', 'demo2.jpg', 'demo3.jpg', 'after.jpg', 'bg-app.jpg', 'demo1.jpg', 'demo2.jpg', 'demo3.jpg', 'after.jpg', 'bg-app.jpg' );
					for ( $flag = 0; $flag < count( $images ); $flag++ ) {// @codingStandardsIgnoreLine
							$image_name = $images[ $flag ];

							$image_data = get_thumbnail_dimension_gallery_master();
							$file_name  = wp_unique_filename( GALLERY_MASTER_ORIGINAL_DIR, $image_name );

							$src_file = GALLERY_MASTER_PLUGIN_DIR_URL . '/assets/admin/images/' . $image_name;
							copy( $src_file, GALLERY_MASTER_ORIGINAL_DIR . $file_name );
							copy( $src_file, GALLERY_MASTER_UPLOAD_DIR . $file_name );

							$thumbnail_image_name = $obj_dbhelper_gallery_master_meta_table->create_thumbs_gallery_master( $image_name, $image_data );
							$image_exif_detail    = $obj_dbhelper_gallery_master_meta_table->file_exif_information_gallery_master( GALLERY_MASTER_UPLOAD_DIR . $image_name, 'FILE' );

							$image_meta_data['image_title'] = 'Demo Image';
							$image_meta_data['image_name']  = $file_name;

							$image_meta_data['enable_redirect'] = '';
							$image_meta_data['redirect_url']    = 'http://';
						if ( 1 === $flag ) {
								$image_meta_data['gallery_cover_image'] = '1';
						} else {
								$image_meta_data['gallery_cover_image'] = '';
						}
							$image_meta_data['width']       = intval( $image_exif_detail['width'] );
							$image_meta_data['height']      = intval( $image_exif_detail['height'] );
							$image_meta_data['mime_type']   = esc_attr( $image_exif_detail['mime_type'] );
							$image_meta_data['aperture']    = esc_attr( $image_exif_detail['exif_information']['aperture'] );
							$image_meta_data['upload_type'] = '';

							$image_meta_data['image_description']     = '';
							$image_meta_data['alt_text']              = '';
							$image_meta_data['sort_order']            = '';
							$image_meta_data['tags']                  = array();
							$image_meta_data['upload_date']           = time();
							$image_meta_data['file_type']             = 'image';
							$image_meta_data['exclude_image']         = '';
							$image_meta_data_insert                   = array();
							$image_meta_data_insert['meta_id']        = $gallery_id;
							$image_meta_data_insert['old_gallery_id'] = $gallery_id;
							$image_meta_data_insert['meta_key']       = 'image_data';// WPCS: db sql slow query.
							$image_meta_data_insert['meta_value']     = maybe_serialize( $image_meta_data );// WPCS: db sql slow query.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $image_meta_data_insert );
					}
				}
				break;
			default:
				global $wpdb;
				$parent_table_data = $wpdb->get_var(
					$wpdb->prepare(
						'SELECT count(type) FROM ' . $wpdb->prefix . 'gallery_master WHERE type=%s', 'serialized_data'
					)
				);// WPCS: db call ok, cache ok.
				if ( 0 == $parent_table_data ) {// WPCS: loose comparison ok.
					// get gallery data from parent table.
					$manage_gallery = $wpdb->get_results(
						'SELECT * FROM ' . $wpdb->prefix . 'gallery_master'
					);// WPCS: db call ok, cache ok.
					// get data from meta table.
					$manage_gallery_pic_data = $wpdb->get_results(
						'SELECT * FROM ' . $wpdb->prefix . 'gallery_master_meta'
					);// WPCS: db call ok, cache ok.
					$wpdb->query( 'DROP TABLE IF EXISTS ' . $wpdb->prefix . 'gallery_master' );// @codingStandardsIgnoreLine
					$wpdb->query( 'DROP TABLE IF EXISTS ' . $wpdb->prefix . 'gallery_master_meta' );// @codingStandardsIgnoreLine
					$wpdb->query( 'DROP TABLE IF EXISTS ' . $wpdb->prefix . 'gallery_master_settings' );// @codingStandardsIgnoreLine

					if ( $wpdb->query( "SHOW TABLES LIKE '" . $wpdb->prefix . 'gallery_master' . "'" ) === 0 ) {
						table_gallery_master();// WPCS: db call ok, cache ok.
					}
					if ( $wpdb->query( "SHOW TABLES LIKE '" . $wpdb->prefix . 'gallery_master_meta' . "'" ) === 0 ) {
						table_gallery_master_meta();// WPCS: db call ok, cache ok.
					}

					// get parent id from parent table.
					$parent_id                      = $wpdb->get_var(
						$wpdb->prepare(
							'SELECT id FROM ' . $wpdb->prefix . 'gallery_master WHERE type = %s', 'galleries'
						)
					);// WPCS: db call ok, cache ok.
					$gallery_data_unserialized_data = array();
					foreach ( $manage_gallery as $key => $val ) {
						if ( 'gallery' == $val->type ) { // loose comparison ok.
							array_push( $gallery_data_unserialized_data, $val );
						}
					}

					foreach ( $gallery_data_unserialized_data as $key ) {
						$galleries_array = get_array_data_gallery_master( $key->gallery_id, $manage_gallery_pic_data );

						// get gallery data from meta table.
						$gallery_meta_data_unserialized_data = array();
						foreach ( $galleries_array as $gallery_data ) {
							$gallery_meta_data_unserialized_data[ $gallery_data->gallery_meta_key ] = $gallery_data->gallery_meta_value;
						}

						// insert gallery data in main and meta table.
						$insert_gallery              = array();
						$insert_gallery['type']      = 'gallery';
						$insert_gallery['parent_id'] = $parent_id;
						$gallery_id                  = $obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_parent(), $insert_gallery );

						$insert_gallery_meta                        = array();
						$insert_gallery_meta['gallery_title']       = urldecode( $gallery_meta_data_unserialized_data['gallery_title'] );
						$insert_gallery_meta['gallery_description'] = urldecode( $gallery_meta_data_unserialized_data['gallery_description'] );
						$insert_gallery_meta['created_date']        = strtotime( $gallery_meta_data_unserialized_data['gallery_date'] );
						$insert_gallery_meta['edited_on']           = strtotime( $gallery_meta_data_unserialized_data['edited_on'] );
						$insert_gallery_meta['edited_by']           = $gallery_meta_data_unserialized_data['edited_by'];
						$insert_gallery_meta['author']              = $gallery_meta_data_unserialized_data['author'];


						// get pic data from parent table.
						$pic_parent_unserialized_data = array();
						foreach ( $manage_gallery as $pic_key => $val ) {
							if ( 'pic' == $val->type && $val->parent_id == $key->gallery_id ) {// WPCS: loose comparison ok.
								array_push( $pic_parent_unserialized_data, $val );
							}
						}
						$count = 0;
						foreach ( $pic_parent_unserialized_data as $data ) {
							$gallery_pics_array = get_array_data_gallery_master( $data->gallery_id, $manage_gallery_pic_data );

							// insert pic data in meta table.
							$pic_data_unserialized_array = array();
							foreach ( $gallery_pics_array as $pic_data ) {
								$pic_data_unserialized_array[ $pic_data->gallery_meta_key ] = $pic_data->gallery_meta_value;
							}
							$image_upload_location = isset( $pic_data_unserialized_array['upload_url'] ) ? explode( 'uploads/', $pic_data_unserialized_array['upload_url'] ) : '';
							$image_name            = $image_upload_location[1];

							$image_data = get_thumbnail_dimension_gallery_master();
							$file_name  = wp_unique_filename( GALLERY_MASTER_ORIGINAL_DIR, $image_name );

							$src_file = GALLERY_MASTER_MAIN_URL . $pic_data_unserialized_array['upload_url'];
							copy( $src_file, GALLERY_MASTER_ORIGINAL_DIR . $file_name );
							copy( $src_file, GALLERY_MASTER_UPLOAD_DIR . $file_name );

							$thumbnail_image_name = $obj_dbhelper_gallery_master_meta_table->create_thumbs_gallery_master( $image_name, $image_data );
							$image_exif_detail    = $obj_dbhelper_gallery_master_meta_table->file_exif_information_gallery_master( GALLERY_MASTER_UPLOAD_DIR . $image_name, 'FILE' );
							if ( 0 == $count ) {// WPCS: loose comparison ok.
								$gallery_cover_image = $file_name;
							}

							$image_meta_data                        = array();
							$image_meta_data['image_title']         = urldecode( $pic_data_unserialized_array['image_title'] );
							$image_meta_data['image_name']          = $file_name;
							$image_meta_data['enable_redirect']     = intval( $pic_data_unserialized_array['enable_redirect'] );
							$image_meta_data['redirect_url']        = $pic_data_unserialized_array['redirect_url'];
							$image_meta_data['gallery_cover_image'] = 0 == $count ? 1 : '';// WPCS: loose comparison ok.
							$image_meta_data['width']               = intval( $image_exif_detail['width'] );
							$image_meta_data['height']              = intval( $image_exif_detail['height'] );
							$image_meta_data['mime_type']           = esc_attr( $image_exif_detail['mime_type'] );
							$image_meta_data['aperture']            = esc_attr( $image_exif_detail['exif_information']['aperture'] );
							$image_meta_data['upload_type']         = '';
							$image_meta_data['image_description']   = urldecode( $pic_data_unserialized_array['image_description'] );
							$image_meta_data['alt_text']            = urldecode( $pic_data_unserialized_array['alt_text'] );
							$image_meta_data['sort_order']          = $data->sorting_order;
							$image_meta_data['tags']                = array();
							$image_meta_data['upload_date']         = time();
							$image_meta_data['file_type']           = 'image';
							$image_meta_data['exclude_image']       = '';

							$image_meta_data_insert                   = array();
							$image_meta_data_insert['old_gallery_id'] = $key->gallery_id;
							$image_meta_data_insert['meta_id']        = $gallery_id;
							$image_meta_data_insert['meta_key']       = 'image_data';// WPCS: slow query ok.
							$image_meta_data_insert['meta_value']     = maybe_serialize( $image_meta_data );// WPCS: slow query ok.
							$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $image_meta_data_insert );
							$count++;
						}
						$insert_gallery_meta['gallery_cover_image'] = $gallery_cover_image;

						$insert_gallery_data                   = array();
						$insert_gallery_data['meta_id']        = $gallery_id;
						$insert_gallery_data['old_gallery_id'] = $key->gallery_id;
						$insert_gallery_data['meta_key']       = 'gallery_data';// WPCS: slow query ok.
						$insert_gallery_data['meta_value']     = maybe_serialize( $insert_gallery_meta );// WPCS: slow query ok.
						$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_meta(), $insert_gallery_data );
					}
					$insert_parent_table_data              = array();
					$insert_parent_table_data['type']      = 'serialized_data';
					$insert_parent_table_data['parent_id'] = '0';
					$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_parent(), $insert_parent_table_data );
				}
				$get_collate_status_data = $wpdb->query(
					$wpdb->prepare(
						'SELECT type FROM ' . $wpdb->prefix . 'gallery_master WHERE type=%s', 'collation_type'
					)
				);// db call ok; no-cache ok.
				if ( 0 === $get_collate_status_data ) {
					$charset_collate = '';
					if ( ! empty( $wpdb->charset ) ) {
						$charset_collate .= 'CONVERT TO CHARACTER SET ' . $wpdb->charset;
					}
					if ( ! empty( $wpdb->collate ) ) {
						$charset_collate .= ' COLLATE ' . $wpdb->collate;
					}
					if ( ! empty( $charset_collate ) ) {
						$change_collate_main_table = $wpdb->query(
							'ALTER TABLE ' . $wpdb->prefix . 'gallery_master ' . $charset_collate // @codingStandardsIgnoreLine.
						);// WPCS: db call ok, no-cache ok.
						$change_collate_meta_table = $wpdb->query(
							'ALTER TABLE ' . $wpdb->prefix . 'gallery_master_meta ' . $charset_collate // @codingStandardsIgnoreLine.
						);// WPCS: db call ok, no-cache ok.

						$collation_data_array              = array();
						$collation_data_array['type']      = 'collation_type';
						$collation_data_array['parent_id'] = '0';
						$obj_dbhelper_gallery_master_meta_table->insert_command( gallery_master_parent(), $collation_data_array );
					}
				}
				break;
		}
		update_option( 'gallery-master-key', '2.0.1' );
	}
}
