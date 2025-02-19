<?php
/**
 * This file is used for upload image from pluploader.
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
		if ( ( isset( $_REQUEST['param'] ) ? 'upload_gallery_pics' === sanitize_text_field( wp_unslash( $_REQUEST['param'] ) ) : '' ) && ( isset( $_REQUEST['_wp_nonce'] ) ? wp_verify_nonce( sanitize_text_field( wp_unslash( $_REQUEST['_wp_nonce'] ) ), 'upload_local_system_files_nonce' ) : '' ) ) {// WPCS: CSRF ok, input var ok.
			/**
			* Upload.php
			*
			* Copyright 2013, Moxiecode Systems AB
			* Released under GPL License.
			*
			* License: http://www.plupload.com/license
			* Contributing: http://www.plupload.com/contributing
			*/
			// Make sure file is not cached (as it happens for example on iOS devices).
			header( 'Expires: Mon, 26 Jul 1997 05:00:00 GMT' );
			header( 'Last-Modified: ' . gmdate( 'D, d M Y H:i:s' ) . ' GMT' );
			header( 'Cache-Control: no-store, no-cache, must-revalidate' );
			header( 'Cache-Control: post-check=0, pre-check=0', false );
			header( 'Pragma: no-cache' );

			// 5 minutes execution time
			set_time_limit( 5 * 60 );

			// Settings.
			$target_dir          = GALLERY_MASTER_UPLOAD_DIR;
			$target_dir_original = GALLERY_MASTER_ORIGINAL_DIR;

			$cleanup_target_dir = true; // Remove old files.
			$max_file_age       = 5 * 3600; // Temp file age in seconds
			// Create target dir.
			if ( ! file_exists( $target_dir ) ) {
				@mkdir( $target_dir );// @codingStandardsIgnoreLine.
			}

			if ( ! file_exists( $target_dir_original ) ) {
				@mkdir( $target_dir_original );// @codingStandardsIgnoreLine.
			}
			// Get a file name.
			if ( isset( $_REQUEST['name'] ) ) {
				$file_name = sanitize_text_field( wp_unslash( $_REQUEST['name'] ) );// WPCS: input var ok.
			} elseif ( ! empty( $_FILES ) && isset( $_FILES['file']['name'] ) ) {
				$file_name = $_FILES['file']['name'];// WPCS: input var ok, sanitization ok.
			} else {
				$file_name = uniqid( 'file_' );
			}
			$proper_filename         = false;
			$file_temp_path_original = $target_dir_original . DIRECTORY_SEPARATOR . $file_name;
			$filetype_checks         = wp_check_filetype_and_ext( $file_temp_path_original, $file_name );

			$proper_filename = empty( $filetype_checks['proper_filename'] ) ? '' : $filetype_checks['proper_filename'];
			if ( $proper_filename ) {
				$file_name = $proper_filename;
			}
			$file_name = wp_unique_filename( $target_dir_original, $file_name );

			$file_path_original = $target_dir_original . DIRECTORY_SEPARATOR . $file_name;

			$file_path = $target_dir . DIRECTORY_SEPARATOR . $file_name;
			// Chunking might be enabled.
			$chunk  = isset( $_REQUEST['chunk'] ) ? intval( $_REQUEST['chunk'] ) : 0;// WPCS: input var ok.
			$chunks = isset( $_REQUEST['chunks'] ) ? intval( $_REQUEST['chunks'] ) : 0;// WPCS: input var ok.

			// Remove old temp files.
			if ( $cleanup_target_dir ) {
				if ( ! is_dir( $target_dir ) || ! $dir = opendir( $target_dir ) ) {// @codingStandardsIgnoreLine.
					die( '{"jsonrpc" : "2.0", "error" : {"code": 100, "message": "Failed to open temp directory."}, "id" : "id"}' );
				}
				if ( ! is_dir( $target_dir_original ) || ! $dir_original = opendir( $target_dir_original ) ) {// @codingStandardsIgnoreLine.
					die( '{"jsonrpc" : "2.0", "error" : {"code": 100, "message": "Failed to open temp directory."}, "id" : "id"}' );
				}
				while ( ( $file = readdir( $dir_original ) ) !== false ) {// @codingStandardsIgnoreLine.
					$tmp_file_path = $target_dir_original . DIRECTORY_SEPARATOR . $file;

					// If temp file is current file proceed to the next.
					if ( "{$file_path_original}.part" === $tmp_file_path ) {
						continue;
					}

					// Remove temp file if it is older than the max age and is not the current file.
					if ( preg_match( '/\.part$/', $file ) && ( filemtime( $tmp_file_path ) < time() - $max_file_age ) ) {
						@unlink( $tmp_file_path );// @codingStandardsIgnoreLine.
					}
				}
				closedir( $dir_original );

				while ( ( $file = readdir( $dir ) ) !== false ) {// @codingStandardsIgnoreLine.
					$tmp_file_path = $target_dir . DIRECTORY_SEPARATOR . $file;

					// If temp file is current file proceed to the next.
					if ( "{$file_path}.part" === $tmp_file_path ) {
						continue;
					}

					// Remove temp file if it is older than the max age and is not the current file.
					if ( preg_match( '/\.part$/', $file ) && ( filemtime( $tmp_file_path ) < time() - $max_file_age ) ) {
						@unlink( $tmp_file_path );// @codingStandardsIgnoreLine.
					}
				}
				closedir( $dir );
			}

			// Open temp file.
			if ( ! $outOriginal = @fopen( "{$file_path_original}.part", $chunks ? 'ab' : 'wb' ) ) {// @codingStandardsIgnoreLine.
				die( '{"jsonrpc" : "2.0", "error" : {"code": 102, "message": "Failed to open output stream."}, "id" : "id"}' );
			}
			if ( ! $out = @fopen( "{$file_path}.part", $chunks ? 'ab' : 'wb' ) ) {// @codingStandardsIgnoreLine.
				die( '{"jsonrpc" : "2.0", "error" : {"code": 102, "message": "Failed to open output stream."}, "id" : "id"}' );
			}
			if ( ! empty( $_FILES ) ) {// WPCS: input var ok.
				if ( $_FILES['file']['error'] || ! is_uploaded_file( $_FILES['file']['tmp_name'] ) ) {// WPCS: input var ok, sanitization ok.
					die( '{"jsonrpc" : "2.0", "error" : {"code": 103, "message": "Failed to move uploaded file."}, "id" : "id"}' );
				}

				// Read binary input stream and append it to temp file.
				if ( ! $in = @fopen( $_FILES['file']['tmp_name'], 'rb' ) ) {// @codingStandardsIgnoreLine.
					die( '{"jsonrpc" : "2.0", "error" : {"code": 101, "message": "Failed to open input stream."}, "id" : "id"}' );
				}
			} else {
				if ( ! $in = @fopen( 'php://input', 'rb' ) ) {// @codingStandardsIgnoreLine.
					die( '{"jsonrpc" : "2.0", "error" : {"code": 101, "message": "Failed to open input stream."}, "id" : "id"}' );
				}
			}

			while ( $buff = fread( $in, 4096 ) ) {// @codingStandardsIgnoreLine.
				fwrite( $outOriginal, $buff );// @codingStandardsIgnoreLine.
				fwrite( $out, $buff );// @codingStandardsIgnoreLine.
			}

			fclose( $out );// @codingStandardsIgnoreLine.
			fclose( $outOriginal );// @codingStandardsIgnoreLine.
			fclose( $in );// @codingStandardsIgnoreLine.

			// Check if file has been uploaded.
			if ( ! $chunks || $chunk === $chunks - 1 ) {
				// Strip the temp .part suffix off.
				rename( "{$file_path}.part", $file_path );// @codingStandardsIgnoreLine.
				rename( "{$file_path_original}.part", $file_path_original );// @codingStandardsIgnoreLine.
			}

			// Return Success JSON-RPC response.
			die( '{"jsonrpc" : "2.0", "result" :  "' . $file_name . '", "id" : "id"}' );// WPCS: XSS ok.
		}
	}
}
