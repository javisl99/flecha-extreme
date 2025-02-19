<?php
/**
 * Template for add Album.
 *
 * @author  Tech Banker
 * @package gallery-master/views/album
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
					<?php echo isset( $_REQUEST['album_id'] ) ? esc_attr( $gm_update_album_title ) : esc_attr( $gm_add_album ); // WPCS: input var ok, CSRF ok. ?>
				</span>
			</li>
		</ul>
	</div>
	<div class="row">
		<div class="col-md-12">
			<div class="portlet box vivid-green">
				<div class="portlet-title">
					<div class="caption">
						<i class="<?php echo isset( $_REQUEST['album_id'] ) ? 'icon-custom-note' : 'icon-custom-plus'; // WPCS: input var ok, CSRF ok. ?>"></i>
						<?php echo isset( $_REQUEST['album_id'] ) ? esc_attr( $gm_update_album_title ) : esc_attr( $gm_add_album ); // WPCS: input var ok, CSRF ok. ?>
					</div>
				</div>
				<div class="portlet-body form">
					<form id="ux_frm_add_album">
						<div class="form-body">
						<div class="form-actions">
							<div class="pull-right">
								<input type="submit" class="btn vivid-green" name="ux_btn_save_changes" id="ux_btn_save_changes" value="<?php echo esc_attr( $gm_save_changes ); ?>">
							</div>
						</div>
						<div class="line-separator"></div>
						<div class="tabbable-custom">
							<ul class="nav nav-tabs ">
								<li class="active">
									<a aria-expanded="true" href="#basic_details" data-toggle="tab" id="ux_basic_details">
									<?php echo esc_attr( $gm_add_album_basic_detail ); ?>
								</a>
							</li>
							<li class="">
								<a aria-expanded="false" href="#upload_local_media" data-toggle="tab" id="ux_upload_media">
									<?php echo esc_attr( $gm_add_album_upload_local_media ); ?>
								</a>
							</li>
						</ul>
						<div class="tab-content">
							<div class="tab-pane active" id="basic_details">
								<div class="form-group">
									<label class="control-label">
										<?php echo esc_attr( $gm_album_title ); ?> :
										<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
									</label>
									<textarea rows="1" class="form-control" name="ux_txt_album_title" id="ux_txt_album_title" placeholder="<?php echo esc_attr( $gm_add_album_title_placeholder ); ?>"><?php echo isset( $get_album_data_unserialize['album_name'] ) ? esc_attr( $get_album_data_unserialize['album_name'] ) : ''; ?></textarea>
									<i class="controls-description"><?php echo esc_attr( $gm_add_album_title_tooltip ); ?></i>
								</div>
								<div class="form-group">
									<label class="control-label">
										<?php echo esc_attr( $gm_album_description ); ?> :
										<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
									</label>
									<?php
									$gm_album_description_data = isset( $get_album_data_unserialize['album_description'] ) ? htmlspecialchars_decode( $get_album_data_unserialize['album_description'] ) : '';
									wp_editor(
										$gm_album_description_data, 'ux_heading_content', array(
											'teeny' => true,
											'textarea_name' => 'description',
											'media_buttons' => false,
											'textarea_rows' => 20,
										)
									);
									?>
									<textarea name="ux_txtarea_album_heading_content" id="ux_txtarea_album_heading_content" style="display:none;"><?php echo esc_attr( $gm_album_description_data ); ?></textarea>
									<i class="controls-description"><?php echo esc_attr( $gm_add_album_description_tooltip ); ?></i>
								</div>
							</div>
							<div class="tab-pane" id="upload_local_media">
								<div class="row">
									<div class="col-md-5">
										<div class="form-group">
											<label class="control-label">
												<?php echo esc_attr( $gm_galleries_available ); ?> :
												<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
											</label>
											<select class="form-control" multiple="multiple" name="ux_ddl_available_galleries_duplicate" id="ux_ddl_available_galleries_duplicate" style="height:300px">
												<?php
												$seleted_countries_array = isset( $get_album_data_unserialize['selected_galleries'] ) ? $get_album_data_unserialize['selected_galleries'] : array();
												foreach ( $get_galleries_data_for_album as $value ) {
													if ( ! in_array( intval( $value['meta_id'] ), $seleted_countries_array ) ) {// @codingStandardsIgnoreLine
														?>
														<option value="<?php echo intval( $value['meta_id'] ); ?>"><?php echo '' !== $value['gallery_title'] ? esc_attr( $value['gallery_title'] ) : esc_attr( $gm_untitled ); ?></option>
														<?php
													}
												}
												?>
											</select>
											<i class="controls-description"><?php echo esc_attr( $gm_galleries_available_tooltip ); ?></i>
										</div>
									</div>
									<div class="col-md-2">
										<div class="custom-button-gallery">
											<div class="form-actions">
												<input type="button" class="btn vivid-green" id="ux_btn_add_gallery" name="ux_btn_add_gallery" value="<?php echo esc_attr( $gm_add_gallery_button ) . ' >>'; ?>" onclick="add_gallery_gallery_master();" style="width:100px">
											</div>
											<div class="form-action">
												<input type="button" class="btn vivid-green" id="ux_btn_delete_gallery" name="ux_btn_delete_gallery" value="<?php echo '<< ' . esc_attr( $gm_remove_gallery_button ); ?>" onclick="remove_gallery_gallery_master();" style="width:100px">
											</div>
										</div>
									</div>
									<div class="col-md-5">
										<div class="form-group">
											<label class="control-label">
												<?php echo esc_attr( $gm_galleries_included_in_this_album ); ?> :
												<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
											</label>
											<select class="form-control" multiple="multiple" name="ux_ddl_selected_galleries[]" id="ux_ddl_selected_galleries" style="height:300px">
												<?php
												if ( isset( $get_galleries_data_selected_albums_array ) && count( $get_galleries_data_selected_albums_array ) > 0 ) {
													foreach ( $get_galleries_data_selected_albums_array as $value ) {
														?>
														<option value="<?php echo intval( $value['meta_id'] ); ?>"><?php echo '' !== $value['gallery_title'] ? esc_attr( $value['gallery_title'] ) : esc_attr( $gm_untitled ); ?></option>
														<?php
													}
												}
												?>
											</select>
											<i class="controls-description"><?php echo esc_attr( $gm_galleries_included_in_this_album_tooltip ); ?></i>
										</div>
									</div>
								</div>
							</div>
							</div>
							<div class="line-separator"></div>
							<div class="form-actions">
								<div class="pull-right">
									<input type="submit" class="btn vivid-green" name="ux_btn_save_changes" id="ux_btn_save_changes" value="<?php echo esc_attr( $gm_save_changes ); ?>">
								</div>
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
					<?php echo isset( $_REQUEST['album_id'] ) ? esc_attr( $gm_update_album_title ) : esc_attr( $gm_add_album ); // WPCS: input var ok, CSRF ok. ?>
				</span>
			</li>
		</ul>
	</div>
	<div class="row">
		<div class="col-md-12">
			<div class="portlet box vivid-green">
				<div class="portlet-title">
					<div class="caption">
						<i class="<?php echo isset( $_REQUEST['album_id'] ) ? 'icon-custom-note' : 'icon-custom-plus';// WPCS: input var ok, CSRF ok. ?>"></i>
						<?php echo isset( $_REQUEST['album_id'] ) ? esc_attr( $gm_update_album_title ) : esc_attr( $gm_add_album ); // WPCS: input var ok, CSRF ok. ?>
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
