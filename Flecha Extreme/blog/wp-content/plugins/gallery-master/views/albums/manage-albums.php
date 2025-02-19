<?php
/**
 * Template for Manage Album.
 *
 * @author  Tech Banker
 * @package   gallery-master/views/album
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
						<?php echo esc_attr( $gm_manage_albums ); ?>
					</span>
				</li>
			</ul>
		</div>
		<div class="row">
			<div class="col-md-12">
			<div class="portlet box vivid-green">
				<div class="portlet-title">
					<div class="caption">
						<i class="icon-custom-folder"></i>
						<?php echo esc_attr( $gm_manage_albums ); ?>
					</div>
				</div>
				<div class="portlet-body form">
					<form id="ux_frm_manage_album">
						<div class="form-body">
						<div class="table-top-margin">
							<select name="ux_ddl_manage_albums" id="ux_ddl_manage_albums">
								<option value=""><?php echo esc_attr( $gm_bulk_action ); ?></option>
								<option value="delete_albums" style="color:red;"><?php echo esc_attr( $gm_manage_delete_album ) . ' ( ' . esc_attr( $gm_premium_edition ) . ' )'; ?></option>
								<option value="duplicate_albums" style="color:red;"><?php echo esc_attr( $gm_manage_duplicate_album ) . ' ( ' . esc_attr( $gm_premium_edition ) . ' )'; ?></option>
							</select>
							<input type="button" class="btn vivid-green" name="ux_btn_apply_manage_albums" id="ux_btn_apply_manage_albums" value="<?php echo esc_attr( $gm_apply ); ?>" onclick="premium_edition_notification_gallery_master();">
							<a href="admin.php?page=gm_add_album" class="btn vivid-green"><?php echo esc_attr( $gm_add_album ); ?></a>
							<input type="button" class="btn vivid-green" name="ux_btn_apply_delete_all_albums" id="ux_btn_apply_delete_all_albums" value="<?php echo esc_attr( $gm_delete_all_albums ); ?>" onclick="premium_edition_notification_gallery_master();">
						</div>
						<div class="line-separator"></div>
						<table class="table table-striped table-bordered table-hover table-margin-top" id="ux_tbl_manage_album">
							<thead>
								<tr>
									<th class="custom-checkbox chk-action">
									<input type="checkbox" name="ux_chk_all_albums" id="ux_chk_all_albums">
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
								foreach ( $manage_albums_data_unserialize as $album_data ) {
									$album_cover_image = GALLERY_MASTER_PLUGIN_DIR_URL . '/assets/admin/images/album-cover.png';
									if ( isset( $album_data['selected_galleries'] ) && count( $album_data['selected_galleries'] ) > 0 ) {
										$gm_gallery_cover_image = $album_data['selected_galleries'];
										foreach ( $gm_gallery_cover_image as $value ) {
											$get_gallery_data                   = $wpdb->get_var(
												$wpdb->prepare(
													'SELECT meta_value FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE old_gallery_id = %d and meta_key = %s', $value, 'gallery_data'
												)
											);// WPCS: db call ok, cache ok.
											$selected_gallery_unserialized_data = maybe_unserialize( $get_gallery_data );
											if ( count( $selected_gallery_unserialized_data ) > 0 ) {
												if ( esc_attr( $selected_gallery_unserialized_data['gallery_cover_image'] ) !== '' ) {
													if ( isset( $selected_gallery_unserialized_data['file_type'] ) && 'video' === $selected_gallery_unserialized_data['file_type'] ) {
														$album_cover_image = esc_attr( $selected_gallery_unserialized_data['gallery_cover_image'] );
													} else {
														$album_cover_image = GALLERY_MASTER_THUMBS_NON_CROPPED_URL . esc_attr( $selected_gallery_unserialized_data['gallery_cover_image'] );
														if ( ! file_exists( GALLERY_MASTER_THUMBS_NON_CROPPED_DIR . esc_attr( $selected_gallery_unserialized_data['gallery_cover_image'] ) ) ) {
															if ( strpos( esc_attr( $selected_gallery_unserialized_data['gallery_cover_image'] ), '.' ) !== false ) {
																$filename_actual   = explode( '.', esc_attr( $selected_gallery_unserialized_data['gallery_cover_image'] ) );
																$album_cover_image = GALLERY_MASTER_THUMBS_NON_CROPPED_URL . $filename_actual[0] . '.' . strtoupper( $filename_actual[1] );
															} else {
																$album_cover_image = GALLERY_MASTER_PLUGIN_DIR_URL . '/assets/admin/images/album-cover.png';
															}
														}
													}
													break;
												}
											}
										}
									}
									$galleries_data_array     = isset( $album_data['selected_galleries'] ) ? implode( ',', $album_data['selected_galleries'] ) : '';
									$gm_count_galleries_added = $wpdb->get_var(
										$wpdb->prepare(
											'SELECT count(old_gallery_id) FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE old_gallery_id IN (' . $galleries_data_array . ') and meta_key = %s', 'gallery_data'
										)
									);// WPCS: db call ok, cache ok, unprepared SQL OK.
									?>
									<tr>
									<td class="custom-checkbox" style="width:5%;">
										<input type="checkbox" name="ux_chk_manage_album_<?php echo intval( $album_data['meta_id'] ); ?>" id="ux_chk_manage_album_<?php echo intval( $album_data['meta_id'] ); ?>" value="<?php echo intval( $album_data['meta_id'] ); ?>">
									</td>
									<td class="custom-alternative custom-gallery-thumbnail" style="width:20%;">
										<a href="admin.php?page=gm_add_album&album_id=<?php echo intval( $album_data['meta_id'] ); ?>">
											<img class="tech-banker-cover-image" src="<?php echo esc_attr( $album_cover_image ); ?>">
										</a>
										<a href="admin.php?page=gm_add_album&album_id=<?php echo intval( $album_data['meta_id'] ); ?>">
											<?php echo esc_attr( $gm_edit_tooltip ); ?>
										</a>
										<label>|</label>
										<a href="javascript:void(0);">
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
													<label><?php echo isset( $album_data['album_name'] ) && '' !== $album_data['album_name'] ? esc_attr( $album_data['album_name'] ) : esc_attr( $gm_untitled_album ); ?></label>
												</i>
											</td>
										</tr>
										<tr>
											<td>
												<i>
													<label><?php echo isset( $album_data['album_description'] ) && '' !== $album_data['album_description'] ? htmlspecialchars_decode( $album_data['album_description'] ) : ''; // WPCS: XSS ok. ?></label>
												</i>
											</td>
										</tr>
									</table>
									<table>
										<tr>
											<th style="text-align: left;">
												<label>
													<?php echo esc_attr( $meta_information ); ?>
												</label>
											</th>
										</tr>
										<tr>
											<td>
												<b>
													<label>
														<?php echo esc_attr( $gm_get_count_galleries ); ?>
													</label>
												</b>
											</td>
										</tr>
										<tr>
											<td colspan="2">
												<i>
													<label>
														<?php echo intval( $gm_count_galleries_added ); ?>
													</label>
												</i>
											</td>
										</tr>
										<tr>
											<td>
												<b>
													<label>
														<?php echo esc_attr( $created_by ); ?>
													</label>
												</b>
											</td>
											<td>
												<b>
													<label>
														<?php echo esc_attr( $created_on ); ?>
													</label>
												</b>
											</td>
										</tr>
										<tr>
											<td>
												<i>
													<label>
														<?php echo esc_attr( $album_data['author'] ); ?>
													</label>
												</i>
											</td>
											<td>
												<i>
													<label>
														<?php echo esc_attr( date( 'm-d-Y', doubleval( $album_data['created_date'] ) ) ); ?>
													</label>
												</i>
											</td>
										</tr>
										<tr>
											<td>
												<b>
													<label>
														<?php echo esc_attr( $gm_manage_galleries_edited_by ); ?>
													</label>
												</b>
											</td>
											<td>
												<b>
													<label>
														<?php echo esc_attr( $gm_manage_galleries_edited_on ); ?>
													</label>
												</b>
											</td>
										</tr>
										<tr>
											<td>
												<i>
													<label>
														<?php echo esc_attr( $album_data['edited_by'] ); ?>
													</label>
												</i>
											</td>
											<td>
												<i>
													<label>
														<?php echo esc_attr( date( 'm-d-Y', doubleval( $album_data['edited_on'] ) ) ); ?>
													</label>
												</i>
											</td>
										</tr>
									</table>
									</td>
									<?php
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
				<a href="admin.php?page=gm_manage_albums">
					<?php echo esc_attr( $gm_albums ); ?>
				</a>
				<span>></span>
			</li>
			<li>
				<span>
					<?php echo esc_attr( $gm_manage_albums ); ?>
				</span>
			</li>
		</ul>
	</div>
	<div class="row">
		<div class="col-md-12">
			<div class="portlet box vivid-green">
				<div class="portlet-title">
					<div class="caption">
						<i class="icon-custom-folder"></i>
						<?php echo esc_attr( $gm_manage_albums ); ?>
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
