<?php
/**
 * This file is used for creating dbHelper class.
 *
 * @author  Tech Banker
 * @package gallery-master/lib
 * @version  2.0.0
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
		/**
		 * Class Name: Dbhelper_Gallery_Master
		 * Parameters: No
		 * Description: This Class is used for Insert, Update and Delete operations.
		 * Created On: 01-06-2017 09:00
		 * Created By: Tech Banker Team
		 */
		class Dbhelper_Gallery_Master {
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
			 * This function is used for delete data from database.
			 *
			 * @param string $table_name passes parameter as table name.
			 * @param string $where passes parameter as where.
			 */
			public function delete_command( $table_name, $where ) {
				global $wpdb;
				$wpdb->delete( $table_name, $where );// WPCS: db call ok, cache ok.
			}
			/**
			 * This function is used for delete data from database.
			 *
			 * @param string $table_name passes parameter as table name.
			 * @param string $where passes parameter as where.
			 * @param string $data passes parameter as data.
			 */
			public function bulk_delete_command( $table_name, $where, $data ) {
				global $wpdb;
				$wpdb->query(
					"DELETE FROM $table_name WHERE $where IN ($data)"
				);// WPCS: unprepared SQL ok, WPCS: db call ok; no-cache ok.
			}
		}
		if ( ! class_exists( 'Plugin_Info_Gallery_Master' ) ) {
			/**
			 * This Class is used for Get Plugin Information.
			 *
			 * @package    gallery-master
			 * @subpackage lib
			 *
			 * @author  Tech Banker
			 */
			class Plugin_Info_Gallery_Master {// @codingStandardsIgnoreLine
				/**
				 * Function Name: get_plugin_info_gallery_master
				 * Parameters: No
				 * Decription: This function is used to return the information about plugins.
				 * Created On: 13-06-2017 10:07
				 * Created By: Tech Banker Team
				 */
				public function get_plugin_info_gallery_master() {
					$active_plugins = (array) get_option( 'active_plugins', array() );
					if ( is_multisite() ) {
						$active_plugins = array_merge( $active_plugins, get_site_option( 'active_sitewide_plugins', array() ) );
					}
					$plugins = array();
					if ( count( $active_plugins ) > 0 ) {
						$get_plugins = array();
						foreach ( $active_plugins as $plugin ) {
							$plugin_data = @get_plugin_data( WP_PLUGIN_DIR . '/' . $plugin );// @codingStandardsIgnoreLine

							$get_plugins['plugin_name']    = strip_tags( $plugin_data['Name'] );
							$get_plugins['plugin_author']  = strip_tags( $plugin_data['Author'] );
							$get_plugins['plugin_version'] = strip_tags( $plugin_data['Version'] );
							array_push( $plugins, $get_plugins );
						}
						return $plugins;
					}
				}
			}
		}

		global $uploaded_images;
		$uploaded_images = array();
		class Image_Process_Gallery_Master {// @codingStandardsIgnoreLine
			/**
			 * This function is used for online video.
			 *
			 * @param string $url passes parameter as data.
			 */
			public function online_video_thumb_gallery_master( $url ) {
				if ( preg_match( '/youtube\.com\/watch/i', $url ) ) {
					$id                   = explode( '?', $url );
					$new_id               = explode( 'v=', $id[1] );
					$video_thumbnail_path = 'http://img.youtube.com/vi/' . $new_id[1] . '/mqdefault.jpg';
				} elseif ( preg_match( '/youtu\.be\//i', $url ) ) {
					$id                   = explode( '.be/', $url );
					$video_thumbnail_path = 'http://img.youtube.com/vi/' . $id[1] . '/mqdefault.jpg';
				} elseif ( preg_match( '/(?:vimeo(?:pro)?.com)\/(?:[^\d]+)?(\d+)(?:.*)/', $url ) ) {
					$path                 = explode( '/', $url );
					$id                   = end( $path );
					$hash                 = maybe_unserialize( file_get_contents( "http://vimeo.com/api/v2/video/$id.php" ) );// @codingStandardsIgnoreLine
					$video_thumbnail_path = $hash[0]['thumbnail_medium'];
				} elseif ( preg_match( '/dailymotion\.com/i', $url ) ) {
					$path                 = explode( '/[_]/', $url );
					$id                   = explode( '/', $path[0] );
					$video_thumbnail_path = json_decode( file_get_contents( 'https://api.dailymotion.com/video/' . $id[4] . '?fields=thumbnail_medium_url' ) );// @codingStandardsIgnoreLine
					$video_thumbnail_path = $video_thumbnail_path->thumbnail_medium_url;
				} elseif ( preg_match( '/metacafe\.com\/watch/i', $url ) ) {
					$path  = explode( '/', $url );
					$parse = file_get_contents( 'http://www.metacafe.com/embed/' . $path[4] . '/' . $path[5] );// @codingStandardsIgnoreLine
					preg_match_all( '/{(.*?)}/', $parse, $matches );
					$get_thumb            = explode( '"', $matches[0][1] );
					$video_thumbnail_path = stripslashes( $get_thumb[7] );
				} elseif ( preg_match( '/facebook\.com/i', $url ) ) {
					$id = explode( 'v=', $url );
					if ( count( $id ) == 1 ) {// WPCS: loose comparison ok.
						$id                   = explode( '/', $url );
						$path                 = $id[6];
						$video_thumbnail_path = 'https://graph.facebook.com/' . $path . '/picture';
					} else {
						$path                 = explode( '&', $id[1] );
						$video_thumbnail_path = 'https://graph.facebook.com/' . $path[0] . '/picture';
					}
				} elseif ( preg_match( '/flickr\.com(?!.+\/show\/)/i', $url ) ) {
					$get_video_info       = file_get_contents( "http://www.flickr.com/services/oembed/?url={$url}&format=json" );// @codingStandardsIgnoreLine
					$data                 = json_decode( $get_video_info, true );
					$video_thumbnail_path = $data['thumbnail_url'];
				} elseif ( preg_match( '/youku\.com/', $url ) ) {
					$video                = explode( 'id_', $url );
					$video_id             = explode( '==', $video[1] );
					$video_thumbnail_path = 'http://events.youku.com/global/api/video-thumb.php?vid=' . $video_id[0];
				}
				return $video_thumbnail_path;
			}
			/**
			 * This function is used fetch folder files.
			 *
			 * @param string $dir passes parameter as dir.
			 */
			public function fetch_folder_files( $dir ) {
				global $uploaded_images;
				$folder_files = scandir( $dir );
				foreach ( $folder_files as $folder_file ) {
					if ( '.' !== $folder_file && '..' !== $folder_file ) {
						if ( is_dir( $dir . '/' . $folder_file ) ) {
							$this->fetch_folder_files( $dir . '/' . $folder_file );
						}
						if ( is_file( $dir . '/' . $folder_file ) ) {
							$path = $dir . '/' . $folder_file;
							array_push( $uploaded_images, $path );
						}
					}
				}
				return $uploaded_images;
			}
			/**
			 * This function is used to copy images.
			 *
			 * @param string $src passes parameter as src.
			 * @param string $destination passes parameter as destination.
			 */
			public function copy_images_gallery_master( $src, $destination ) {
				$ch = curl_init();// @codingStandardsIgnoreLine
				curl_setopt( $ch, CURLOPT_URL, $src );// @codingStandardsIgnoreLine
				curl_setopt( $ch, CURLOPT_HEADER, 0 );// @codingStandardsIgnoreLine
				curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 );// @codingStandardsIgnoreLine
				curl_setopt( $ch, CURLOPT_FOLLOWLOCATION, 1 );// @codingStandardsIgnoreLine
				$data = curl_exec( $ch );// @codingStandardsIgnoreLine
				curl_close( $ch );// @codingStandardsIgnoreLine
				if ( $data ) {
					$fp = fopen( $destination, 'wb' );// @codingStandardsIgnoreLine
					if ( $fp ) {
						fwrite( $fp, $data );// @codingStandardsIgnoreLine
						fclose( $fp );// @codingStandardsIgnoreLine
					} else {
						fclose( $fp );// @codingStandardsIgnoreLine
						return false;
					}
				} else {
					return false;
				}
			}
			/**
			 * This function is used to copy images.
			 *
			 * @param string $fname passes parameter as fname.
			 * @param string $image_data passes parameter as image_data.
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
			 * This function is used to copy images.
			 *
			 * @param string $file passes parameter as file.
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
			/**
			 * This function is used to generate thumbs.
			 *
			 * @param string $file_name passes parameter as file_name.
			 * @param string $thumb_dimension passes parameter as thumb_dimension.
			 */
			public function generate_thumbs_edited_image_gallery_master( $file_name, $thumb_dimension ) {
				if ( function_exists( 'wp_get_image_editor' ) ) {
					$image             = wp_get_image_editor( GALLERY_MASTER_ORIGINAL_DIR . $file_name );
					$image_non_cropped = wp_get_image_editor( GALLERY_MASTER_ORIGINAL_DIR . $file_name );
					if ( ! is_wp_error( $image ) || ! is_wp_error( $image_non_cropped ) ) {
						$image->resize( $thumb_dimension[0], $thumb_dimension[1], true );
						$image->save( GALLERY_MASTER_THUMBS_CROPPED_DIR . $file_name );

						$image_non_cropped->resize( $thumb_dimension[0], $thumb_dimension[1], false );
						$image_non_cropped->save( GALLERY_MASTER_THUMBS_NON_CROPPED_DIR . $file_name );
					}
				} else {
					$img = image_resize( GALLERY_MASTER_ORIGINAL_DIR . $file_name, $thumb_dimension[0], $thumb_dimension[1], true ); // @codingStandardsIgnoreLine
					copy( $img, GALLERY_MASTER_THUMBS_CROPPED_DIR . $file_name );
					unlink( $img ); // @codingStandardsIgnoreLine

					$img = image_resize( GALLERY_MASTER_ORIGINAL_DIR . $file_name, $thumb_dimension[0], $thumb_dimension[1], false ); // @codingStandardsIgnoreLine
					copy( $img, GALLERY_MASTER_THUMBS_NON_CROPPED_DIR . $file_name );
					unlink( $img ); // @codingStandardsIgnoreLine
				}
			}
			/**
			 * This function is used to alter thumbs.
			 *
			 * @param string $image_names passes parameter as image_names.
			 * @param string $thumb_dimension passes parameter as thumb_dimension.
			 */
			public function alter_thumbs_gallery_master( $image_names, $thumb_dimension ) {
				foreach ( $image_names as $image_name ) {
					$this->generate_thumbs_edited_image_gallery_master( $image_name, $thumb_dimension );
				}
			}
		}
	}
}
