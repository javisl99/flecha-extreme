<?php
/**
 * Template for view and update settings in Page Navigation.
 *
 * @author  Tech Banker
 * @package     gallery-master/views/general-settings
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
	} elseif ( GENERAL_SETTINGS_GALLERY_MASTER === '1' ) {
		$page_navigation_margin       = isset( $page_navigation_get_data['page_navigation_margin'] ) ? explode( ',', esc_attr( $page_navigation_get_data['page_navigation_margin'] ) ) : array( 0, 0, 0, 0 );
		$page_navigation_padding      = isset( $page_navigation_get_data['page_navigation_padding'] ) ? explode( ',', esc_attr( $page_navigation_get_data['page_navigation_padding'] ) ) : array( 5, 8, 5, 8 );
		$page_navigation_border_style = isset( $page_navigation_get_data['page_navigation_border_style'] ) ? explode( ',', esc_attr( $page_navigation_get_data['page_navigation_border_style'] ) ) : array( 1, 'solid', '#000000' );
		$page_navigation_font_style   = isset( $page_navigation_get_data['page_navigation_font_style'] ) ? explode( ',', esc_attr( $page_navigation_get_data['page_navigation_font_style'] ) ) : array( 12, '#000000' );
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
					<a href="admin.php?page=gm_global_options">
						<?php echo esc_attr( $gm_general_settings ); ?>
					</a>
					<span>></span>
				</li>
				<li>
					<span>
						<?php echo esc_attr( $gm_page_navigation ); ?>
					</span>
				</li>
			</ul>
		</div>
		<div class="row">
			<div class="col-md-12">
				<div class="portlet box vivid-green">
					<div class="portlet-title">
						<div class="caption">
							<i class="icon-custom-arrow-right"></i>
							<?php echo esc_attr( $gm_page_navigation ); ?>
						</div>
					</div>
					<div class="portlet-body form">
						<form id="ux_frm_page_navigation">
							<div class="form-body">
								<div class="form-actions">
									<div class="pull-right">
										<input type="submit" class="btn vivid-green" name="ux_btn_add_tag"  id="ux_btn_add_tag" value="<?php echo esc_attr( $gm_save_changes ); ?>">
									</div>
								</div>
								<div class="line-separator"></div>
								<div id="pagination_setting">
									<div class="row">
										<div class="col-md-6">
											<div class="form-group">
												<label class="control-label">
													<?php echo esc_attr( $gm_background_color ); ?> :
													<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
												</label>
												<input type="text" class="form-control" name="ux_txt_background_color" id="ux_txt_background_color" placeholder="<?php echo esc_attr( $gm_background_color ); ?>" onfocus="color_picker_gallery_master(this, this.value)"  value="<?php echo isset( $page_navigation_get_data['page_navigation_background_color'] ) ? esc_attr( $page_navigation_get_data['page_navigation_background_color'] ) : '#cfd8dc'; ?>">
												<i class="controls-description"><?php echo esc_attr( $gm_general_background_color_tooltip ); ?></i>
											</div>
										</div>
										<div class="col-md-6">
											<div class="form-group">
												<label class="control-label">
													<?php echo esc_attr( $gm_background_transparency ); ?> :
													<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
												</label>
												<input type="text" class="form-control" name="ux_txt_background_transparency" id="ux_txt_background_transparency" maxlength="3" placeholder="<?php echo esc_attr( $gm_background_transparency ); ?>" onblur="default_value_gallery_master('#ux_txt_background_transparency', 100);" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" onchange="check_opacity_gallery_master(this);" value="<?php echo isset( $page_navigation_get_data['page_navigation_background_transparency'] ) ? intval( $page_navigation_get_data['page_navigation_background_transparency'] ) : 100; ?>">
												<i class="controls-description"><?php echo esc_attr( $gm_layout_opacity_tooltip ); ?></i>
											</div>
										</div>
									</div>
									<div class="row">
										<div class="col-md-6">
											<div class="form-group">
												<label class="control-label">
													<?php echo esc_attr( $gm_page_navigation_numbering_title ); ?> :
													<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
												</label>
												<select name="ux_ddl_numbering" id="ux_ddl_numbering" class="form-control">
													<option value="yes"><?php echo esc_attr( $gm_yes ); ?></option>
													<option value="no"><?php echo esc_attr( $gm_no ); ?></option>
												</select>
												<i class="controls-description"><?php echo esc_attr( $gm_page_navigation_numbering_tooltip ); ?></i>
											</div>
										</div>
										<div class="col-md-6">
											<div class="form-group">
												<label class="control-label">
													<?php echo esc_attr( $gm_button_text ); ?> :
													<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
												</label>
												<select name="ux_ddl_button_text" id="ux_ddl_button_text" class="form-control">
													<option value="text"><?php echo esc_attr( $gm_text ); ?></option>
													<option value="arrow"><?php echo esc_attr( $gm_page_navigation_arrow ); ?></option>
												</select>
												<i class="controls-description"><?php echo esc_attr( $gm_page_navigation_button_text_tooltip ); ?></i>
											</div>
										</div>
									</div>
									<div class="row">
										<div class="col-md-6">
											<div class="form-group">
												<label class="control-label">
													<?php echo esc_attr( $gm_alignment_title ); ?> :
													<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
												</label>
												<select name="ux_ddl_alignment_page" id="ux_ddl_alignment_page" class="form-control">
													<option value="left"><?php echo esc_attr( $gm_left ); ?></option>
													<option value="center"><?php echo esc_attr( $gm_center ); ?></option>
													<option value="right"><?php echo esc_attr( $gm_right ); ?></option>
												</select>
												<i class="controls-description"><?php echo esc_attr( $gm_text_alignment_tooltip ); ?></i>
											</div>
										</div>
										<div class="col-md-6">
											<div class="form-group">
												<label class="control-label">
													<?php echo esc_attr( $gm_page_navigation_position_title ); ?> :
													<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
												</label>
												<select name="ux_ddl_position" id="ux_ddl_position" class="form-control">
													<option value="top"><?php echo esc_attr( $gm_top ); ?></option>
													<option value="bottom"><?php echo esc_attr( $gm_bottom ); ?></option>
													<option value="both"><?php echo esc_attr( $gm_both ); ?></option>
												</select>
												<i class="controls-description"><?php echo esc_attr( $gm_set_control_position ); ?></i>
											</div>
										</div>
									</div>
									<div class="row">
										<div class="col-md-6">
											<div class="form-group">
												<label class="control-label">
													<?php echo esc_attr( $gm_border_style_title ); ?> :
													<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
												</label>
												<div class="input-icon right">
													<input type="text" class="form-control input-width-25 input-inline" name="ux_txt_border_style[]" id="ux_txt_border_style_width" placeholder="<?php echo esc_attr( $gm_width_placeholder ); ?>" onblur="default_value_gallery_master('#ux_txt_border_style_width', 0)" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $page_navigation_border_style[0] ); ?>">
													<select name="ux_txt_border_style[]" id="ux_ddl_border_style_thickness" class="form-control input-width-27 input-inline">
														<option value="none"><?php echo esc_attr( $gm_none ); ?></option>
														<option value="solid"><?php echo esc_attr( $gm_solid ); ?></option>
														<option value="dashed"><?php echo esc_attr( $gm_dashed ); ?></option>
														<option value="dotted"><?php echo esc_attr( $gm_dotted ); ?></option>
													</select>
													<input type="text" class="form-control input-normal input-inline" name="ux_txt_border_style[]" id="ux_txt_border_color" onblur="default_value_gallery_master('#ux_txt_border_color', '#000000')" onfocus="color_picker_gallery_master(this, this.value)"  placeholder="<?php echo esc_attr( $gm_color_placeholder ); ?>" value="<?php echo esc_attr( $page_navigation_border_style[2] ); ?>">
												</div>
												<i class="controls-description"><?php echo esc_attr( $gm_border_style_tooltip ); ?></i>
											</div>
										</div>
										<div class="col-md-6">
											<div class="form-group">
												<label class="control-label">
													<?php echo esc_attr( $gm_border_radius_title ); ?> :
													<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
												</label>
												<input type="text" class="form-control" name="ux_txt_border_radius" id="ux_txt_border_radius" placeholder="<?php echo esc_attr( $gm_border_radius_title ); ?>" maxlength="3" onkeypress="only_digits_gallery_master(event);" onblur="default_value_gallery_master('#ux_txt_border_radius', 0);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo isset( $page_navigation_get_data['page_navigation_border_radius'] ) ? intval( $page_navigation_get_data['page_navigation_border_radius'] ) : 5; ?>">
												<i class="controls-description"><?php echo esc_attr( $gm_layout_border_radius_tooltip ); ?></i>
											</div>
										</div>
									</div>
									<div class="row">
										<div class="col-md-6">
											<div class="form-group">
												<label class="control-label">
													<?php echo esc_attr( $gm_font_style ); ?> :
													<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
												</label>
												<div class="input-icon right">
													<input type="text" class="form-control custom-input-medium input-inline" name="ux_txt_navigation_font_style[]" id="ux_txt_navigation_font_style" placeholder="<?php echo esc_attr( $gm_font_size_placeholder ); ?>" onblur="default_value_gallery_master('#ux_txt_navigation_font_style', 14)" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $page_navigation_font_style[0] ); ?>">
													<input type="text" class="form-control custom-input-medium input-inline" name="ux_txt_navigation_font_style[]" id="ux_txt_navigation_font_color" onblur="default_value_gallery_master('#ux_txt_navigation_font_color', '#ffffff')" onfocus="color_picker_gallery_master(this, this.value)"  placeholder="<?php echo esc_attr( $gm_color_placeholder ); ?>" value="<?php echo esc_attr( $page_navigation_font_style[1] ); ?>">
												</div>
												<i class="controls-description"><?php echo esc_attr( $gm_font_style_title_tooltip ); ?></i>
											</div>
										</div>
										<div class="col-md-6">
											<div class="form-group">
												<label class="control-label">
													<?php echo esc_attr( $gm_font_family_title ); ?> :
													<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
												</label>
												<select name="ux_ddl_title_font_family" id="ux_ddl_title_font_family" class="form-control">
													<?php
													if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/web-fonts.php' ) ) {
														include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/web-fonts.php';
													}
													?>
												</select>
												<i class="controls-description"><?php echo esc_attr( $gm_lightbox_image_title_font_family_tooltip ); ?></i>
											</div>
										</div>
									</div>
									<div class="row">
										<div class="col-md-6">
											<div class="form-group">
												<label class="control-label">
													<?php echo esc_attr( $gm_margin_title ); ?> :
													<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
												</label>
												<div class="input-icon right">
													<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_page_navigation_margin[]" id="ux_txt_page_navigation_margin_top_text" placeholder="<?php echo esc_attr( $gm_top ); ?>"  onblur="default_value_gallery_master('#ux_txt_page_navigation_margin_top_text', 20);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $page_navigation_margin[0] ); ?>">
													<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_page_navigation_margin[]" id="ux_txt_page_navigation_margin_right_text" placeholder="<?php echo esc_attr( $gm_right ); ?>" onblur="default_value_gallery_master('#ux_txt_page_navigation_margin_right_text', 2);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $page_navigation_margin[1] ); ?>">
													<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_page_navigation_margin[]" id="ux_txt_page_navigation_margin_bottom_text" placeholder="<?php echo esc_attr( $gm_bottom ); ?>" onblur="default_value_gallery_master('#ux_txt_page_navigation_margin_bottom_text', 20);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $page_navigation_margin[2] ); ?>">
													<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_page_navigation_margin[]" id="ux_txt_page_navigation_margin_left_text" placeholder="<?php echo esc_attr( $gm_left ); ?>" onblur="default_value_gallery_master('#ux_txt_page_navigation_margin_left_text', 2);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $page_navigation_margin[3] ); ?>">
												</div>
												<i class="controls-description"><?php echo esc_attr( $gm_margin_gallery_title_tooltip ); ?></i>
											</div>
										</div>
										<div class="col-md-6">
											<div class="form-group">
												<label class="control-label">
													<?php echo esc_attr( $gm_padding_title ); ?> :
													<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
												</label>
												<div class="input-icon right">
													<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_page_navigation_padding[]" id="ux_txt_page_navigation_padding_top_text" placeholder="<?php echo esc_attr( $gm_top ); ?>" onblur="default_value_gallery_master('#ux_txt_page_navigation_padding_top_text', 5);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $page_navigation_padding[0] ); ?>">
													<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_page_navigation_padding[]" id="ux_txt_page_navigation_padding_right_text" placeholder="<?php echo esc_attr( $gm_right ); ?>" onblur="default_value_gallery_master('#ux_txt_page_navigation_padding_right_text', 10);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $page_navigation_padding[1] ); ?>">
													<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_page_navigation_padding[]" id="ux_txt_page_navigation_padding_bottom_text" placeholder="<?php echo esc_attr( $gm_bottom ); ?>" onblur="default_value_gallery_master('#ux_txt_page_navigation_padding_bottom_text', 5);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $page_navigation_padding[2] ); ?>">
													<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_page_navigation_padding[]" id="ux_txt_page_navigation_padding_left_text" placeholder="<?php echo esc_attr( $gm_left ); ?>" onblur="default_value_gallery_master('#ux_txt_page_navigation_padding_left_text', 10);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $page_navigation_padding[3] ); ?>">
												</div>
												<i class="controls-description"><?php echo esc_attr( $gm_padding_gallery_title_tooltip ); ?></i>
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
						<a href="admin.php?page=gm_gallery_master">
							<?php echo esc_attr( $gallery_master ); ?>
						</a>
						<span>></span>
					</li>
					<li>
						<a href="admin.php?page=gm_global_options">
							<?php echo esc_attr( $gm_general_settings ); ?>
						</a>
						<span>></span>
					</li>
					<li>
						<span>
							<?php echo esc_attr( $gm_page_navigation ); ?>
						</span>
					</li>
				</ul>
			</div>
		<div class="row">
			<div class="col-md-12">
				<div class="portlet box vivid-green">
					<div class="portlet-title">
						<div class="caption">
							<i class="icon-custom-arrow-right"></i>
							<?php echo esc_attr( $gm_page_navigation ); ?>
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
