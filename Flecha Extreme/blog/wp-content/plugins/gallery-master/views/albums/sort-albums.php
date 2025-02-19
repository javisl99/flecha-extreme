<?php
/**
 * Template for Sort Album.
 *
 * @author  Tech Banker
 * @package     gallery-master/views/album
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
	} elseif ( ALBUMS_GALLERY_MASTER === '1' ) {
		$thumbnail_dimensions_gallery_master = explode( ',', isset( $thumbnail_dimensions_data['global_options_thumbnail_dimensions'] ) ? $thumbnail_dimensions_data['global_options_thumbnail_dimensions'] : '200,150' );
		?>
		<div class="page-bar">
			<ul class="page-breadcrumb">
			<li>
				<i class="icon-custom-home"></i>
				<a href="admin.php?page=gallery_master">
					<?php echo esc_attr( $gallery_master ); ?>
				</a>
				<span>></span>
			</li>
			<li>
				<a href="admin.php?page=gm_manage_albums">
					<?php echo esc_attr( $gm_albums ); ?>
				</a>
				<span>></span>
			</li>
			<li>
				<span>
					<?php echo esc_attr( $gm_sort_albums ); ?>
				</span>
			</li>
		</ul>
	</div>
	<div class="row">
		<div class="col-md-12">
			<div class="portlet box vivid-green">
				<div class="portlet-title">
					<div class="caption">
						<i class="icon-custom-list"></i>
						<?php echo esc_attr( $gm_sort_albums ); ?>
					</div>
				</div>
				<div class="portlet-body form">
					<form id="ux_frm_sort_album">
						<div class="form-body">
						<div class="form-actions">
							<div class="pull-right">
								<input type="submit" class="btn vivid-green" id="ux_ddl_submit" name="ux_ddl_submit" value="<?php echo esc_attr( $gm_save_changes ); ?>">
							</div>
						</div>
						<div class="line-separator"></div>
						<div class="form-group">
							<label class="control-label">
								<?php echo esc_attr( $gm_choose_album_title ); ?> :
								<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
							</label>
							<select name="ux_ddl_sort_albums" id="ux_ddl_sort_albums" class="form-control" onchange="choose_album_gallery_master(this.value);">
								<option value=""><?php echo esc_attr( $gm_sort_albums_message ); ?></option>
								<?php
								foreach ( $sort_albums_get_title as $value ) {
									?>
									<option value="<?php echo intval( $value['meta_id'] ); ?>"><?php echo isset( $value['album_name'] ) && '' !== $value['album_name'] ? esc_attr( $value['album_name'] ) : esc_attr( $gm_untitled_album ); ?></option>
									<?php
								}
								?>
							</select>
							<i class="controls-description"><?php echo esc_attr( $gm_sort_albums_choose_album_tooltip ); ?></i>
						</div>
						<div id="ux_div_sort_images" >
							<ul class="custom-top-space-img" id="ux_ul_sort_images">
								<?php
								$count_images = 1;
								if ( isset( $_REQUEST['album_id'] ) ) {// WPCS: input var ok, CSRF ok.
									foreach ( $sort_albums_serialized_data['selected_galleries'] as $image ) {
										$gm_album_cover_image      = '';
										$gm_gallery_data_images    = '0';
										$check_album               = 0;
										$get_galleries_data_images = $wpdb->get_var(
											$wpdb->prepare(
												'SELECT meta_value FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE old_gallery_id = %d', $image
											)
										);// WPCS: db call ok, cache ok.
										if ( '' !== $get_galleries_data_images ) {

											$gallery_data              = $wpdb->get_var(
												$wpdb->prepare(
													'SELECT meta_value FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE meta_key = %s and old_gallery_id = %d', 'gallery_data', $image
												)
											);// WPCS: db call ok, cache ok.
											$gallery_unserialized_data = maybe_unserialize( $gallery_data );
											if ( '' !== $gallery_unserialized_data['gallery_cover_image'] ) {
												if ( isset( $gallery_unserialized_data['file_type'] ) && 'video' === $gallery_unserialized_data['file_type'] ) {
													$gm_album_cover_image = esc_attr( $gallery_unserialized_data['gallery_cover_image'] );
												} else {
													$gm_album_cover_image = GALLERY_MASTER_THUMBS_CROPPED_URL . esc_attr( $gallery_unserialized_data['gallery_cover_image'] );
													if ( ! file_exists( GALLERY_MASTER_THUMBS_NON_CROPPED_DIR . esc_attr( $gallery_unserialized_data['gallery_cover_image'] ) ) ) {
														if ( strpos( esc_attr( $gallery_unserialized_data['gallery_cover_image'] ), '.' ) !== false ) {
															$filename_actual = explode( '.', esc_attr( $gallery_unserialized_data['gallery_cover_image'] ) );
															$filename_thumbs = GALLERY_MASTER_THUMBS_NON_CROPPED_URL . $filename_actual[0] . '.' . strtoupper( $filename_actual[1] );
														} else {
															$filename_thumbs = GALLERY_MASTER_PLUGIN_DIR_URL . '/assets/admin/images/album-cover.png';
														}
													}
												}
												if ( isset( $gallery_unserialized_data['file_type'] ) && 'video' === $gallery_unserialized_data['file_type'] ) {
													$check_album = 0;
												} else {
													$check_album = 1;
												}
											} else {
												$gm_album_cover_image = GALLERY_MASTER_PLUGIN_DIR_URL . '/assets/admin/images/album-cover.png';
											}
										} else {
											echo $image; // WPCS: XSS ok.
											$gm_album_cover_image = GALLERY_MASTER_PLUGIN_DIR_URL . '/assets/admin/images/album-cover.png';
										}
										$count = 0;
										if ( '1' !== $gm_gallery_data_images ) {
											$album_height_style = 0 === $check_album ? "height=$thumbnail_dimensions_gallery_master[1]" : '';
											$album_width_style  = 0 === $check_album ? "width=$thumbnail_dimensions_gallery_master[0]" : '';
											?>
											<li class="custom-sort-gallery thumbnail_dimensions attachment-csb save-ready" id="<?php echo $image;// WPCS: XSS ok. ?>">
											<div class="attachment-preview-csb" style="height:<?php echo intval( $thumbnail_dimensions_gallery_master[1] ); ?>px">
												<div class="thumbnail-csb">
												<div class="centered-csb">
													<img src="<?php echo esc_attr( $gm_album_cover_image ); ?>" <?php echo esc_attr( $album_height_style ); ?> <?php echo esc_attr( $album_width_style ); ?> id="ux_txt_img_<?php echo intval( $image ); ?>" name="ux_txt_img_<?php echo intval( $image ); ?>">
												</div>
											</div>
											</div>
											<button type="button" class="button-link-csb check-csb" tabindex="-1">
												<span style="color:#ffffff;font-weight:bold">
												<?php echo esc_attr( $count_images ); ?>
											</span>
											</button>
											</li>
											<?php
											$count_images++;
										}
									}
								}
								?>
							</ul>
							<div style="clear:both;"></div>
						</div>
						<div class="line-separator" style="clear:both;"></div>
						<div class="form-actions">
							<div class="pull-right">
								<input type="submit" class="btn vivid-green" id="ux_ddl_submit" name="ux_ddl_submit" value="<?php echo esc_attr( $gm_save_changes ); ?>">
							</div>
						</div>
						</div>
					</form>
				</div>
			</div>
			</div>
		</div>
		<?php
	} else {
		?>
		<div class="page-bar">
			<ul class="page-breadcrumb">
			<li>
				<i class="icon-custom-home"></i>
				<a href="admin.php?page=gallery_master">
					<?php echo esc_attr( $gallery_master ); ?>
				</a>
				<span>></span>
			</li>
			<li>
				<a href="admin.php?page=gm_manage_albums">
					<?php echo esc_attr( $gm_albums ); ?>
				</a>
				<span>></span>
			</li>
			<li>
				<span>
					<?php echo esc_attr( $gm_sort_albums ); ?>
				</span>
			</li>
		</ul>
	</div>
	<div class="row">
		<div class="col-md-12">
			<div class="portlet box vivid-green">
				<div class="portlet-title">
					<div class="caption">
						<i class="icon-custom-list"></i>
						<?php echo esc_attr( $gm_sort_albums ); ?>
					</div>
				</div>
				<div class="portlet-body form">
					<div class="form-body">
						<strong><?php echo esc_attr( $gm_user_access_message ); ?></strong>
					</div>
				</div>
			</div>
		</div>
	</div>
		<?php
	}
}
