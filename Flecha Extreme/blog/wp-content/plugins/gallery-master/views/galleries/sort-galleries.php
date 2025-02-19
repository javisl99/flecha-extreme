<?php
/**
 * Template for sort Galleries.
 *
 * @author  Tech Banker
 * @package     gallery-master/views/galleries
 * @version  2.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly.
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
	} elseif ( GALLERIES_GALLERY_MASTER === '1' ) {
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
					<a href="admin.php?page=gallery_master">
						<?php echo esc_attr( $gm_galleries ); ?>
					</a>
					<span>></span>
				</li>
				<li>
					<span>
						<?php echo esc_attr( $gm_sort_galleries ); ?>
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
							<?php echo esc_attr( $gm_sort_galleries ); ?>
						</div>
					</div>
					<div class="portlet-body form">
						<form id="ux_frm_sort_galleries">
							<div class="form-body">
								<div class="form-actions">
									<div class="pull-right">
										<input type="submit" class="btn vivid-green" id="ux_ddl_submit" name="ux_ddl_submit" value="<?php echo esc_attr( $gm_save_changes ); ?>">
									</div>
								</div>
								<div class="line-separator"></div>
								<div class="form-group">
									<label class="control-label">
										<?php echo esc_attr( $gm_choose_gallery_title ); ?> :
										<span class="required"> <?php echo '( ' . esc_attr( $gm_premium_edition ) . ' )'; ?></span>
									</label>
									<select name="ux_ddl_sort_galleries" id="ux_ddl_sort_galleries" class="form-control" onchange="choose_gallery_gallery_master(this.value);">
										<option value=""><?php echo esc_attr( $gm_sort_galleries_choose_gallery_tooltip ); ?></option>
										<?php
										foreach ( $sort_galleries_get_title as $value ) {
											?>
											<option value="<?php echo intval( $value['meta_id'] ); ?>"><?php echo '' !== $value['gallery_title'] ? esc_attr( $value['gallery_title'] ) : esc_attr( $gm_untitled ); ?></option>
											<?php
										}
										?>
									</select>
									<i class="controls-description"><?php echo esc_attr( $gm_sort_galleries_choose_gallery_tooltip ); ?></i>
								</div>
								<div id="ux_div_sort_images" >
									<ul class="custom-top-space-img" id="ux_ul_sort_images">
										<?php
										$count_images = 1;
										if ( isset( $_REQUEST['gallery_id'] ) ) {// WPCS: input var ok, CSRF ok.
											foreach ( $images_data as $image ) {
												?>
												<li class="custom-sort-gallery thumbnail_dimensions attachment-csb save-ready" id="<?php echo intval( $image['id'] ); ?>">
													<div class="attachment-preview-csb" style="height:<?php echo intval( $thumbnail_dimensions_gallery_master[1] ); ?>px">
														<div class="thumbnail-csb">
															<div class="centered-csb">
																<?php
																if ( 'image' === $image['file_type'] ) {
																	$gm_gallery_image = GALLERY_MASTER_THUMBS_CROPPED_URL . esc_attr( $image['image_name'] );
																	if ( ! file_exists( GALLERY_MASTER_THUMBS_NON_CROPPED_DIR . esc_attr( $image['image_name'] ) ) ) {
																		if ( strpos( esc_attr( $image['image_name'] ), '.' ) !== false ) {
																			$filename_actual  = explode( '.', esc_attr( $image['image_name'] ) );
																			$gm_gallery_image = GALLERY_MASTER_THUMBS_CROPPED_URL . $filename_actual[0] . '.' . strtoupper( $filename_actual[1] );
																		} else {
																			$gm_gallery_image = GALLERY_MASTER_PLUGIN_DIR_URL . '/assets/admin/images/gallery-cover.png';
																		}
																	}
																	?>
																	<img src="<?php echo esc_attr( $gm_gallery_image ); ?>" id="ux_txt_img_<?php echo intval( $image['id'] ); ?>" name="ux_txt_img_<?php echo intval( $image['id'] ); ?>" img_name="<?php echo esc_attr( $image['image_name'] ); ?>">
																	<?php
																} else {
																	?>
																	<img src="<?php echo esc_attr( $image['video_thumb'] ); ?>" id="ux_txt_img_<?php echo intval( $image['id'] ); ?>" name="ux_txt_img_<?php echo intval( $image['id'] ); ?>" style="height:<?php echo intval( $thumbnail_dimensions_gallery_master[1] ); ?>px" img_name="<?php echo esc_attr( $image['image_name'] ); ?>">
																	<?php
																}
																?>
															</div>
														</div>
													</div>
													<button type="button" class="button-link-csb check-csb" tabindex="-1">
														<span style="color:#ffffff;font-weight:bold">
															<?php echo intval( $count_images ); ?>
														</span>
													</button>
												</li>
												<?php
												$count_images++;
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
					<a href="javascript:;" onclick="get_gallery_id();">
						<?php echo esc_attr( $gm_galleries ); ?>
					</a>
					<span>></span>
				</li>
				<li>
					<span>
						<?php echo esc_attr( $gm_sort_galleries ); ?>
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
							<?php echo esc_attr( $gm_sort_galleries ); ?>
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
