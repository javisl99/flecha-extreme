<?php
/**
 * This file is used for creating user_helper class.
 *
 * @author  Tech Banker
 * @package gallery-master/user-views/lib
 * @version  2.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly.
if ( ! class_exists( 'User_Helper_Gallery_Master' ) ) {
	/**
	 * This Class is used for return data in unserialize form and convert HEX-color into RGB values.
	 *
	 * @package    gallery-master
	 * @subpackage user-views/lib
	 *
	 * @author  Tech Banker
	 */
	class User_Helper_Gallery_Master {
		/**
		 * This function is used for return data in unserialize form.
		 *
		 * @param string $type .
		 * @param string $meta_key .
		 */
		public static function get_unserialize_mode_data_gallery_master( $type, $meta_key ) {
			global $wpdb;
			$manage_data               = $wpdb->get_results(
				$wpdb->prepare(
					'SELECT * FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE ' . $type, $meta_key
				)
			);// WPCS: db call ok; no-cache ok, unprepared SQL ok, PreparedSQLPlaceholders replacement count ok.
			$unserialize_complete_data = array();
			foreach ( $manage_data as $value ) {
				$unserialize_data                   = maybe_unserialize( $value->meta_value );
				$unserialize_data['id']             = $value->id;
				$unserialize_data['old_gallery_id'] = $value->old_gallery_id;
				$unserialize_data['meta_id']        = $value->meta_id;
				array_push( $unserialize_complete_data, $unserialize_data );
			}
			return $unserialize_complete_data;
		}
		/**
		 * This function is used for convert a normal HEX-color into RGB values.
		 *
		 * @param string $hex .
		 */
		public static function hex2rgm_gallery_master( $hex ) {
			$hex = str_replace( '#', '', $hex );
			if ( strlen( $hex ) === 3 ) {
				$r = hexdec( substr( $hex, 0, 1 ) . substr( $hex, 0, 1 ) );
				$g = hexdec( substr( $hex, 1, 1 ) . substr( $hex, 1, 1 ) );
				$b = hexdec( substr( $hex, 2, 1 ) . substr( $hex, 2, 1 ) );
			} else {
				$r = hexdec( substr( $hex, 0, 2 ) );
				$g = hexdec( substr( $hex, 2, 2 ) );
				$b = hexdec( substr( $hex, 4, 2 ) );
			}
			$rgb = array( $r, $g, $b );
			return $rgb;
		}
		/**
		 * This function is used for return data in unserialize form.
		 *
		 * @param string $meta_key .
		 */
		public static function get_meta_value_gallery_master( $meta_key ) {
			global $wpdb;
			$meta_value = $wpdb->get_var(
				$wpdb->prepare(
					'SELECT meta_value FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE meta_key = %s', $meta_key
				)
			);// WPCS: db call ok; no-cache ok.
			return maybe_unserialize( $meta_value );
		}
		/**
		 * This function is used for font-family.
		 *
		 * @param string $font_families .
		 */
		public static function font_families_gallery_master( $font_families ) {
			foreach ( $font_families as $font_family ) {
				if ( 'inherit' !== $font_family ) {
					if ( strpos( $font_family, ':' ) !== false ) {
						$position           = strpos( $font_family, ':' );
						$font_style         = ( substr( $font_family, $position + 4, 6 ) === 'italic' ) ? "\r\n\tfont-style: italic !important;" : '';
						$font_family_name[] = "'" . substr( $font_family, 0, $position ) . "' !important;\r\n\tfont-weight: " . substr( $font_family, $position + 1, 3 ) . ' !important;' . $font_style;
					} else {
						$font_family_name[] = ( strpos( $font_family, '&' ) !== false ) ? "'" . strstr( $font_family, '&', 1 ) . "' !important;" : "'" . $font_family . "' !important;";
					}
				} else {
					$font_family_name[] = 'inherit';
				}
			}
			return $font_family_name;
		}
		/**
		 * This function is used for font-family.
		 *
		 * @param string $unique_font_families .
		 */
		public static function unique_font_families_gallery_master( $unique_font_families ) {
			$import_font_family = '';
			foreach ( $unique_font_families as $font_family ) {
				if ( 'inherit' !== $font_family ) {
					$font_family = urlencode( $font_family );// @codingStandardsIgnoreLine.
					if ( is_ssl() ) {
						$import_font_family .= "@import url('https://fonts.googleapis.com/css?family=" . $font_family . "');\r\n";
					} else {
						$import_font_family .= "@import url('http://fonts.googleapis.com/css?family=" . $font_family . "');\r\n";
					}
				}
			}
			return $import_font_family;
		}
	}
}
