<?php
/**
 * Template for manage Galleries.
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
		$gm_manage_gallery_nonce = wp_create_nonce( 'gm_manage_gallery_nonce' );
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
						<?php echo esc_attr( $gm_manage_galleries ); ?>
					</span>
				</li>
			</ul>
		</div>
		<div class="row">
			<div class="col-md-12">
				<div class="portlet box vivid-green">
					<div class="portlet-title">
						<div class="caption">
							<i class="icon-custom-picture"></i>
							<?php echo esc_attr( $gm_manage_galleries ); ?>
						</div>
					</div>
					<div class="portlet-body form">
						<form id="ux_frm_manage_gallery_master">
							<div class="form-body">
								<div class="table-top-margin">
									<select name="ux_ddl_manage_galleries" id="ux_ddl_manage_galleries">
										<option value=""><?php echo esc_attr( $gm_bulk_action ); ?></option>
										<option value="delete_galleries" style="color: red;"><?php echo esc_attr( $gm_manage_galleries_delete_gallery ) . ' ( ' . esc_attr( $gm_premium_edition ) . ' )'; ?></option>
										<option value="duplicate_galleries" style="color: red;"><?php echo esc_attr( $gm_manage_galleries_duplicate_gallery ) . ' ( ' . esc_attr( $gm_premium_edition ) . ' )'; ?></option>
									</select>
									<input type="button" class="btn vivid-green" name="ux_btn_apply_manage_galleries" id="ux_btn_apply_manage_galleries" value="<?php echo esc_attr( $gm_apply ); ?>" onclick="premium_edition_notification_gallery_master()">
									<a href="javascript:;" onclick="get_gallery_id_gallery_master();" class="btn vivid-green"><?php echo esc_attr( $gm_add_gallery ); ?></a>
									<input type="button" class="btn vivid-green" name="ux_btn_apply_delete_all_galleries" id="ux_btn_apply_delete_all_galleries" onclick="premium_edition_notification_gallery_master();" value="<?php echo esc_attr( $gm_delete_all_galleries ); ?>">
									<input type="button" class="btn vivid-green" name="ux_btn_apply_purge_galleries" id="ux_btn_apply_purge_galleries" onclick="premium_edition_notification_gallery_master();" value="<?php echo esc_attr( $gm_purge_galleries ); ?>">
								</div>
								<div class="line-separator"></div>
								<table class="table table-striped table-bordered table-hover table-margin-top" id="ux_tbl_manage_gallery">
									<thead>
										<tr>
											<th class="custom-checkbox chk-action">
												<input type="checkbox" name="ux_chk_all_galleries" id="ux_chk_all_galleries">
											</th>
											<th class="custom-gallery-title">
												<label class="control-label">
													<?php echo esc_attr( $gm_manage_galleries_cover_image ); ?>
												</label>
											</th>
											<th class="custom-gallery-description">
												<label class="control-label">
													<?php echo esc_attr( $gm_manage_galleries_overview ); ?>
												</label>
											</th>
										</tr>
									</thead>
									<tbody>
										<?php
										if ( isset( $manage_gallery_data_unserialize ) && count( $manage_gallery_data_unserialize ) > 0 ) {
											foreach ( $manage_gallery_data_unserialize as $row ) {
												$get_count_image = $wpdb->get_var(
													$wpdb->prepare(
														'SELECT count(id) FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE meta_id = %d and meta_key != %s', $row['meta_id'], 'gallery_data'
													)
												);// WPCS: db call ok; no-cache ok.
													$count       = 0;
													?>
													<tr>
														<td class="custom-checkbox" style="width:5%;">
															<input type="checkbox" name="ux_chk_manage_gallery_<?php echo intval( $row['meta_id'] ); ?>" id="ux_chk_manage_gallery_<?php echo intval( $row['meta_id'] ); ?>" value="<?php echo intval( $row['meta_id'] ); ?>" onclick="check_all_gallery_master('#ux_chk_all_galleries');">
														</td>
														<td class="custom-alternative custom-gallery-thumbnail" style="width:20%;">
															<a href="admin.php?page=gm_add_gallery&gallery_id=<?php echo intval( $row['meta_id'] ); ?>&mode=edit">
																<?php
																if ( isset( $row['file_type'] ) && 'video' === $row['file_type'] ) {
																	if ( '0' === $get_count_image ) {
																		?>
																		<img id="ux_gm_img" class="tech-banker-cover-image" src="<?php echo esc_attr( GALLERY_MASTER_PLUGIN_DIR_URL . '/assets/admin/images/gallery-cover.png' ); ?>">
																		<?php
																	} else {
																		?>
																		<img id="ux_gm_img" class="tech-banker-cover-image" src="<?php echo esc_attr( $row['gallery_cover_image'] ); ?>">
																		<?php
																	}
																	?>
																	<?php
																} else {
																	if ( '0' === $get_count_image ) {
																		?>
																		<label>
																			<img id="ux_gm_img" class="tech-banker-cover-image" src="<?php echo esc_attr( GALLERY_MASTER_PLUGIN_DIR_URL . '/assets/admin/images/gallery-cover.png' ); ?>">
																		</label>
																		<?php
																	} else {
																		$filename_thumbs = GALLERY_MASTER_THUMBS_NON_CROPPED_URL . $row['gallery_cover_image'];
																		if ( ! file_exists( GALLERY_MASTER_THUMBS_NON_CROPPED_DIR . $row['gallery_cover_image'] ) ) {
																			if ( strpos( $row['gallery_cover_image'], '.' ) !== false ) {
																				$filename_actual = explode( '.', $row['gallery_cover_image'] );
																				$filename_thumbs = GALLERY_MASTER_THUMBS_NON_CROPPED_URL . $filename_actual[0] . '.' . strtoupper( $filename_actual[1] );
																			} else {
																				$filename_thumbs = GALLERY_MASTER_PLUGIN_DIR_URL . '/assets/admin/images/gallery-cover.png';
																			}
																		}
																		?>
																		<img id="ux_gm_img" class="tech-banker-cover-image" src="<?php echo esc_attr( $filename_thumbs ); ?>">
																		<?php
																	}
																}
																?>
															</a>
															<a href="admin.php?page=gm_add_gallery&gallery_id=<?php echo intval( $row['meta_id'] ); ?>&mode=edit">
																<?php echo esc_attr( $gm_edit_tooltip ); ?>
															</a>
															<label>|</label>
															<a href="javascript:void(0);" onclick='confirm_delete_gallery_master("<?php echo intval( $row['meta_id'] ); ?>",<?php echo wp_json_encode( $gm_entries_delete ); ?>, "admin.php?page=gallery_master", "manage_gallery_module", "<?php echo esc_attr( $gm_manage_gallery_nonce ); ?>");'>
																<?php echo esc_attr( $gm_delete ); ?>
															</a>
														</td>
														<td class="custom-gallery-description">
															<table>
																<tr>
																	<th style="text-align: left;">
																		<label><?php echo esc_attr( $gm_manage_galleries_details ); ?></label>
																	</th>
																</tr>
																<tr>
																	<td>
																		<i>
																			<label><?php echo isset( $row['gallery_title'] ) && '' !== esc_attr( $row['gallery_title'] ) ? esc_attr( $row['gallery_title'] ) : esc_attr( $gm_untitled ); ?></label>
																		</i>
																	</td>
																</tr>
																<tr>
																	<td>
																		<i>
																			<label><?php echo isset( $row['gallery_description'] ) && '' !== esc_attr( $row['gallery_description'] ) ? htmlspecialchars_decode( $row['gallery_description'] ) : '';// WPCS: XSS ok. ?></label>
																		</i>
																	</td>
																</tr>
															</table>
															<table>
																<tr>
																	<td>
																		<strong><?php echo esc_attr( $gm_shortcode_for_grid_style_masonry_layout ); ?></strong>
																	</td>
																</tr>
																<tr>
																	<td>
																		<div class="icon-custom-docs tooltips pull-right" style="font-size:18px;" data-original-title="<?php echo esc_attr( $gm_copy_to_clipboard ); ?>" data-placement="left" data-clipboard-action="copy" data-clipboard-target="#ux_txtarea_masonry_generate_shortcode_<?php echo esc_attr( $row['old_gallery_id'] ); ?>"></div>
																		<span class="form-control ux_txtarea_generate_shortcode" readonly name="ux_txtarea_masonry_generate_shortcode_<?php echo esc_attr( $row['old_gallery_id'] ); ?>" id="ux_txtarea_masonry_generate_shortcode_<?php echo esc_attr( $row['old_gallery_id'] ); ?>" rows="4" style="margin-bottom:20px !important;">[gallery_master source_type="gallery" id="<?php echo esc_attr( $row['old_gallery_id'] ); ?>" layout_type="masonry_layout"  alignment="left" lightbox_type="foo_box_free_edition" order_images_by="sort_asc" sort_images_by="sort_order" gallery_title="show" gallery_description="show" thumbnail_title="show" thumbnail_description="show" filters="disable" lazy_load="disable" search_box="disable" order_by="disable" columns="4" page_navigation="disable"  animation_effects="fadeIn" special_effects="none"][/gallery_master]</span>
																	</td>
																</tr>
																<tr>
																	<td>
																		<strong><?php echo esc_attr( $gm_shortcode_for_grid_style_thumbnail_layout ); ?></strong>
																	</td>
																</tr>
																<tr>
																	<td>
																		<div class="icon-custom-docs tooltips pull-right" style="font-size:18px;" data-original-title="<?php echo esc_attr( $gm_copy_to_clipboard ); ?>" data-placement="left" data-clipboard-action="copy" data-clipboard-target="#ux_txtarea_thumbnail_generate_shortcode_<?php echo esc_attr( $row['old_gallery_id'] ); ?>"></div>
																		<span class="form-control ux_txtarea_thumbnail_generate_shortcode" readonly name="ux_txtarea_thumbnail_generate_shortcode_<?php echo esc_attr( $row['old_gallery_id'] ); ?>" id="ux_txtarea_thumbnail_generate_shortcode_<?php echo esc_attr( $row['old_gallery_id'] ); ?>" rows="4" style="margin-bottom:20px !important;">[gallery_master source_type="gallery" id="<?php echo esc_attr( $row['old_gallery_id'] ); ?>" layout_type="thumbnail_layout" alignment="left" lightbox_type="foo_box_free_edition" order_images_by="sort_asc" sort_images_by="sort_order" gallery_title="show" gallery_description="show" thumbnail_title="show" thumbnail_description="show" filters="disable" lazy_load="disable" search_box="disable" order_by="disable" columns="4" page_navigation="disable" animation_effects="fadeIn" special_effects="none"][/gallery_master]</span>
																	</td>
																</tr>
															</table>
														</td>
													</tr>
												<?php
											}
										}
										?>
										</tbody>
									</table>
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
					<a href="admin.php?page=gallery_master">
					<?php echo esc_attr( $gm_galleries ); ?>
					</a>
					<span>></span>
					</li>
				<li>
					<span>
					<?php echo esc_attr( $gm_manage_galleries ); ?>
					</span>
				</li>
			</ul>
		</div>
		<div class="row">
			<div class="col-md-12">
				<div class="portlet box vivid-green">
					<div class="portlet-title">
						<div class="caption">
							<i class="icon-custom-picture"></i>
							<?php echo esc_attr( $gm_manage_galleries ); ?>
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
