<?php
/**
 * Template to display the Foo Box free Edition settings.
 *
 * @author  Tech Banker
 * @package     gallery-master/views/lightboxes
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
	} elseif ( LIGHTBOXES_GALLERY_MASTER === '1' ) {
		$foo_box_title_font_style          = isset( $foo_box['foo_box_title_font_style'] ) ? explode( ',', esc_attr( $foo_box['foo_box_title_font_style'] ) ) : array( 16, '#ffffff' );
		$foo_box_description_font_style    = isset( $foo_box['foo_box_description_font_style'] ) ? explode( ',', esc_attr( $foo_box['foo_box_description_font_style'] ) ) : array( 14, '#ffffff' );
		$foo_box_border_style              = isset( $foo_box['foo_box_border_style'] ) ? explode( ',', esc_attr( $foo_box['foo_box_border_style'] ) ) : array( 5, 'solid', '#ffffff' );
		$foo_box_image_title_margin        = isset( $foo_box['foo_box_image_title_margin'] ) ? explode( ',', esc_attr( $foo_box['foo_box_image_title_margin'] ) ) : array( 5, 0, 5, 0 );
		$foo_box_image_title_padding       = isset( $foo_box['foo_box_image_title_padding'] ) ? explode( ',', esc_attr( $foo_box['foo_box_image_title_padding'] ) ) : array( 0, 0, 0, 0 );
		$foo_box_image_description_margin  = isset( $foo_box['foo_box_image_description_margin'] ) ? explode( ',', esc_attr( $foo_box['foo_box_image_description_margin'] ) ) : array( 5, 0, 5, 0 );
		$foo_box_image_description_padding = isset( $foo_box['foo_box_image_description_padding'] ) ? explode( ',', esc_attr( $foo_box['foo_box_image_description_padding'] ) ) : array( 0, 0, 0, 0 );
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
					<a href="admin.php?page=gm_lightcase">
						<?php echo esc_attr( $gm_lightboxes ); ?>
					</a>
					<span>></span>
				</li>
				<li>
					<span>
						<?php echo class_exists( 'fooboxV2' ) ? esc_attr( $gm_foo_box_premium ) : esc_attr( $gm_foo_box_free_edition ); ?>
					</span>
				</li>
			</ul>
		</div>
		<div class="row">
			<div class="col-md-12">
				<div class="portlet box vivid-green">
					<div class="portlet-title">
						<div class="caption">
							<i class="icon-custom-frame"></i>
							<?php echo class_exists( 'fooboxV2' ) ? esc_attr( $gm_foo_box_premium ) : esc_attr( $gm_foo_box_free_edition ); ?>
						</div>
					</div>
					<div class="portlet-body form">
						<form id="ux_frm_foo_box_free_edition">
							<div class="form-body">
								<div class="form-actions">
									<div class="pull-right">
										<input type="submit" class="btn vivid-green" name="ux_btn_add_tag"  id="ux_btn_add_tag" value="<?php echo esc_attr( $gm_save_changes ); ?>">
									</div>
								</div>
								<div class="line-separator"></div>
								<div class="tabbable-custom">
									<ul class="nav nav-tabs ">
										<li class="active">
											<a aria-expanded="true" href="#settings" data-toggle="tab">
												<?php echo esc_attr( $gm_settings ); ?>
											</a>
										</li>
										<li>
											<a aria-expanded="false" href="#image_title" data-toggle="tab">
												<?php echo esc_attr( $gm_add_gallery_image_title ); ?>
											</a>
										</li>
										<li>
											<a aria-expanded="false" href="#image_description" data-toggle="tab">
												<?php echo esc_attr( $gm_add_gallery_image_description_title ); ?>
											</a>
										</li>
									</ul>
									<div class="tab-content">
										<div class="tab-pane active" id="settings">
											<div class="row">
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_foo_box_free_edition_show_count_title ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<select name="ux_ddl_show_count" id="ux_ddl_show_count" class="form-control">
															<option value="true"><?php echo esc_attr( $gm_enable ); ?></option>
															<option value="false"><?php echo esc_attr( $gm_disable ); ?></option>
														</select>
														<i class="controls-description"><?php echo esc_attr( $gm_iimage_counter_tooltip ); ?></i>
													</div>
												</div>
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_foo_box_hide_page_scrollbars_title ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<div class="input-icon right">
															<select name="ux_ddl_hide_page_scrollbar" id="ux_ddl_hide_page_scrollbar" class="form-control">
																<option value="true"><?php echo esc_attr( $gm_enable ); ?></option>
																<option value="false"><?php echo esc_attr( $gm_disable ); ?></option>
															</select>
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_foo_box_hide_page_scrollbars_tooltip ); ?></i>
													</div>
												</div>
											</div>
											<div class="row">
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_foo_box_caption_show_on_hover_title ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<div class="input-icon right">
															<select name="ux_ddl_show_on_hover" id="ux_ddl_show_on_hover" class="form-control">
																<option value="true"><?php echo esc_attr( $gm_enable ); ?></option>
																<option value="false"><?php echo esc_attr( $gm_disable ); ?></option>
															</select>
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_foo_box_caption_show_on_hover_tooltip ); ?></i>
													</div>
												</div>
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_foo_box_close_overlay_click_title ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<select name="ux_ddl_close_overlay_click" id="ux_ddl_close_overlay_click" class="form-control">
															<option value="true"><?php echo esc_attr( $gm_enable ); ?></option>
															<option value="false"><?php echo esc_attr( $gm_disable ); ?></option>
														</select>
														<i class="controls-description"><?php echo esc_attr( $gm_foo_box_close_overlay_click_tooltip ); ?></i>
													</div>
												</div>
											</div>
											<div class="row">
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_lightbox_overlay_color_title ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<div class="input-icon right">
															<input type="text" class="form-control" name="ux_txt_overlay_color" id="ux_txt_overlay_color" placeholder="<?php echo esc_attr( $gm_lightbox_overlay_color_placeholder ); ?>" onfocus="color_picker_gallery_master(this, this.value)"  onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo isset( $foo_box['foo_box_overlay_color'] ) ? esc_attr( $foo_box['foo_box_overlay_color'] ) : '#000000'; ?>">
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_global_loader_color_tooltip ); ?></i>
													</div>
												</div>
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_lightbox_overlay_opacity_title ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<input type="text" class="form-control" name="ux_txt_overlay_opacity" id="ux_txt_overlay_opacity" maxlength="3" onkeypress="only_digits_gallery_master(event);" placeholder="<?php echo esc_attr( $gm_opacity_placeholder ); ?>" onblur="default_value_gallery_master('#ux_txt_overlay_opacity', 75);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo isset( $foo_box['foo_box_overlay_opacity'] ) ? intval( $foo_box['foo_box_overlay_opacity'] ) : 75; ?>">
														<i class="controls-description"><?php echo esc_attr( $gm_layout_opacity_tooltip ); ?></i>
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
															<input type="text" class="form-control input-width-25 input-inline" name="ux_txt_border_style[]" id="ux_txt_border_style_width" placeholder="<?php echo esc_attr( $gm_width_placeholder ); ?>" onblur="default_value_gallery_master('#ux_txt_border_style_width', 5)" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_border_style[0] ); ?>">
															<select name="ux_txt_border_style[]" id="ux_ddl_border_style_thickness" class="form-control input-width-27 input-inline">
																<option value="none"><?php echo esc_attr( $gm_none ); ?></option>
																<option value="solid"><?php echo esc_attr( $gm_solid ); ?></option>
																<option value="dashed"><?php echo esc_attr( $gm_dashed ); ?></option>
																<option value="dotted"><?php echo esc_attr( $gm_dotted ); ?></option>
															</select>
															<input type="text" class="form-control input-normal input-inline" name="ux_txt_border_style[]" id="ux_txt_border_style_color" onblur="default_value_gallery_master('#ux_txt_border_style_color', '#ffffff')" onfocus="color_picker_gallery_master(this, this.value)" placeholder="<?php echo esc_attr( $gm_color_placeholder ); ?>" value="<?php echo esc_attr( $foo_box_border_style[2] ); ?>">
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
														<div class="input-icon right">
															<input type="text" class="form-control" name="ux_txt_border_radius" id="ux_txt_border_radius" placeholder="<?php echo esc_attr( $gm_border_radius_title ); ?>" maxlength="3" onkeypress="only_digits_gallery_master(event);" onblur="default_value_gallery_master('#ux_txt_border_radius', 5)" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo isset( $foo_box['foo_box_border_radius'] ) ? intval( $foo_box['foo_box_border_radius'] ) : 10; ?>">
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_layout_border_radius_tooltip ); ?></i>
													</div>
												</div>
											</div>
										</div>
										<div class="tab-pane" id="image_title">
											<div class="row">
												<div class="col-md-12">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_title ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<div class="input-icon right">
															<select id="ux_ddl_foo_box_title" name="ux_ddl_foo_box_title" class="form-control" onchange="show_hide_control_gallery_master('ux_ddl_foo_box_title', 'foo_box_title_div');">
																<option value="true"><?php echo esc_attr( $gm_show ); ?></option>
																<option value="false"><?php echo esc_attr( $gm_hide ); ?></option>
															</select>
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_title_tooltip ); ?></i>
													</div>
												</div>
											</div>
											<div class="row" id="foo_box_title_div">
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_html_tag ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<div class="input-icon right">
															<select name="ux_ddl_image_title_html_tag" id="ux_ddl_image_title_html_tag" class="form-control">
																<option value="h1"><?php echo esc_attr( $gm_h1_tag ); ?></option>
																<option value="h2"><?php echo esc_attr( $gm_h2_tag ); ?></option>
																<option value="h3"><?php echo esc_attr( $gm_h3_tag ); ?></option>
																<option value="h4"><?php echo esc_attr( $gm_h4_tag ); ?></option>
																<option value="h5"><?php echo esc_attr( $gm_h5_tag ); ?></option>
																<option value="h6"><?php echo esc_attr( $gm_h6_tag ); ?></option>
																<option value="blockquote"><?php echo esc_attr( $gm_blockquote_tag ); ?></option>
																<option value="p"><?php echo esc_attr( $gm_paragraph_tag ); ?></option>
																<option value="span"><?php echo esc_attr( $gm_span_tag ); ?></option>
															</select>
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_html_tag_tooltip ); ?></i>
													</div>
												</div>
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_text_alignment_title ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<div class="input-icon right">
															<select name="ux_ddl_image_title_alignment" id="ux_ddl_image_title_alignment" class="form-control">
																<option value="left"><?php echo esc_attr( $gm_left ); ?></option>
																<option value="center"><?php echo esc_attr( $gm_center ); ?></option>
																<option value="right"><?php echo esc_attr( $gm_right ); ?></option>
															</select>
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_text_alignment_tooltip ); ?></i>
													</div>
												</div>
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_lightbox_title_font_style ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<div class="input-icon right">
															<input type="text" class="form-control custom-input-medium input-inline" name="ux_txt_gallery_title_font_style[]" id="ux_txt_gallery_title_font_size" placeholder="<?php echo esc_attr( $gm_font_size_placeholder ); ?>" onblur="default_value_gallery_master('#ux_txt_gallery_title_font_size', 16);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_title_font_style[0] ); ?>">
															<input type="text" class="form-control custom-input-medium input-inline" name="ux_txt_gallery_title_font_style[]" id="ux_txt_gallery_title_style_color" onblur="default_value_gallery_master('#ux_txt_gallery_title_style_color', '#ffffff');" onfocus="color_picker_gallery_master(this, this.value)"  placeholder="<?php echo esc_attr( $gm_color_placeholder ); ?>" value="<?php echo esc_attr( $foo_box_title_font_style[1] ); ?>">
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_font_style_title_tooltip ); ?></i>
													</div>
												</div>
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_lightbox_title_font_family ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<div class="input-icon right">
															<select name="ux_ddl_gallery_title_font_family" id="ux_ddl_gallery_title_font_family" class="form-control">
																<?php
																if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/web-fonts.php' ) ) {
																	include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/web-fonts.php';
																}
																?>
															</select>
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_lightbox_image_title_font_family_tooltip ); ?></i>
													</div>
												</div>
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_margin_title ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<div class="input-icon right">
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_title_margin_text[]" id="ux_txt_image_title_margin_top" placeholder="<?php echo esc_attr( $gm_top ); ?>" onblur="default_value_gallery_master('#ux_txt_image_title_margin_top', 5);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_title_margin[0] ); ?>">
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_title_margin_text[]" id="ux_txt_image_title_margin_right" placeholder="<?php echo esc_attr( $gm_right ); ?>" onblur="default_value_gallery_master('#ux_txt_image_title_margin_right', 0);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_title_margin[1] ); ?>">
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_title_margin_text[]" id="ux_txt_image_title_margin_bottom" placeholder="<?php echo esc_attr( $gm_bottom ); ?>" onblur="default_value_gallery_master('#ux_txt_image_title_margin_bottom', 5);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_title_margin[2] ); ?>">
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_title_margin_text[]" id="ux_txt_image_title_margin_left" placeholder="<?php echo esc_attr( $gm_left ); ?>" onblur="default_value_gallery_master('#ux_txt_image_title_margin_left', 0);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_title_margin[3] ); ?>">
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
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_title_padding_text[]" id="ux_txt_image_title_padding_top" placeholder="<?php echo esc_attr( $gm_top ); ?>" onblur="default_value_gallery_master('#ux_txt_image_title_padding_top', 0);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_title_padding[0] ); ?>">
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_title_padding_text[]" id="ux_txt_image_title_padding_right" placeholder="<?php echo esc_attr( $gm_right ); ?>" onblur="default_value_gallery_master('#ux_txt_image_title_padding_right', 0);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_title_padding[1] ); ?>">
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_title_padding_text[]" id="ux_txt_image_title_padding_bottom" placeholder="<?php echo esc_attr( $gm_bottom ); ?>" onblur="default_value_gallery_master('#ux_txt_image_title_padding_bottom', 0);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_title_padding[2] ); ?>">
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_title_padding_text[]" id="ux_txt_image_title_padding_left" placeholder="<?php echo esc_attr( $gm_left ); ?>" onblur="default_value_gallery_master('#ux_txt_image_title_padding_left', 0);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_title_padding[3] ); ?>">
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_padding_gallery_title_tooltip ); ?></i>
													</div>
												</div>
											</div>
										</div>
										<div class="tab-pane" id="image_description">
											<div class="row">
												<div class="col-md-12">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_description ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<div class="input-icon right">
															<select id="ux_ddl_foo_box_description" name="ux_ddl_foo_box_description" class="form-control" onchange="show_hide_control_gallery_master('ux_ddl_foo_box_description', 'foo_box_description_div');">
																<option value="true"><?php echo esc_attr( $gm_show ); ?></option>
																<option value="false"><?php echo esc_attr( $gm_hide ); ?></option>
															</select>
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_lightbox_image_description_tooltip ); ?></i>
													</div>
												</div>
											</div>
											<div class="row" id="foo_box_description_div">
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_html_tag ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<div class="input-icon right">
															<select name="ux_ddl_image_description_html_tag" id="ux_ddl_image_description_html_tag" class="form-control">
																<option value="h1"><?php echo esc_attr( $gm_h1_tag ); ?></option>
																<option value="h2"><?php echo esc_attr( $gm_h2_tag ); ?></option>
																<option value="h3"><?php echo esc_attr( $gm_h3_tag ); ?></option>
																<option value="h4"><?php echo esc_attr( $gm_h4_tag ); ?></option>
																<option value="h5"><?php echo esc_attr( $gm_h5_tag ); ?></option>
																<option value="h6"><?php echo esc_attr( $gm_h6_tag ); ?></option>
																<option value="blockquote"><?php echo esc_attr( $gm_blockquote_tag ); ?></option>
																<option value="p"><?php echo esc_attr( $gm_paragraph_tag ); ?></option>
																<option value="span"><?php echo esc_attr( $gm_span_tag ); ?></option>
															</select>
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_html_tag_tooltip ); ?></i>
													</div>
												</div>
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_text_alignment_title ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<div class="input-icon right">
															<select name="ux_ddl_image_description_alignment" id="ux_ddl_image_description_alignment" class="form-control">
																<option value="left"><?php echo esc_attr( $gm_left ); ?></option>
																<option value="center"><?php echo esc_attr( $gm_center ); ?></option>
																<option value="right"><?php echo esc_attr( $gm_right ); ?></option>
															</select>
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_text_alignment_tooltip ); ?></i>
													</div>
												</div>
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_lightbox_description_font_style ); ?> :
															<i class="icon-custom-question tooltips" data-original-title="<?php echo esc_attr( $gm_font_style_title_tooltip ); ?>" data-placement="right"></i>
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<div class="input-icon right">
															<input type="text" class="form-control custom-input-medium input-inline" name="ux_txt_gallery_description_font_style[]" id="ux_txt_gallery_description_font_size" placeholder="<?php echo esc_attr( $gm_font_size_placeholder ); ?>" onblur="default_value_gallery_master('#ux_txt_gallery_description_font_size', 14);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_description_font_style[0] ); ?>">
															<input type="text" class="form-control custom-input-medium input-inline" name="ux_txt_gallery_description_font_style[]" id="ux_txt_gallery_description_style_color" onblur="default_value_gallery_master('#ux_txt_gallery_description_style_color', '#ffffff');"  onfocus="color_picker_gallery_master(this, this.value)"  placeholder="<?php echo esc_attr( $gm_color_placeholder ); ?>" value="<?php echo esc_attr( $foo_box_description_font_style[1] ); ?>">
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_font_style_title_tooltip ); ?></i>
													</div>
												</div>
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_lightbox_description_font_family ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<div class="input-icon right">
															<select name="ux_ddl_gallery_description_font_family" id="ux_ddl_gallery_description_font_family" class="form-control">
																<?php
																if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/web-fonts.php' ) ) {
																	include GALLERY_MASTER_PLUGIN_DIR_PATH . 'includes/web-fonts.php';
																}
																?>
															</select>
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_lightbox_image_title_font_family_tooltip ); ?></i>
													</div>
												</div>
												<div class="col-md-6">
													<div class="form-group">
														<label class="control-label">
															<?php echo esc_attr( $gm_margin_title ); ?> :
															<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
														</label>
														<div class="input-icon right">
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_description_margin[]" id="ux_txt_image_description_margin_top" placeholder="<?php echo esc_attr( $gm_top ); ?>" onblur="default_value_gallery_master('#ux_txt_image_description_margin_top', 5);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_description_margin[0] ); ?>">
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_description_margin[]" id="ux_txt_image_description_margin_right" placeholder="<?php echo esc_attr( $gm_right ); ?>" onblur="default_value_gallery_master('#ux_txt_image_description_margin_right', 0);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_description_margin[1] ); ?>">
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_description_margin[]" id="ux_txt_image_description_margin_bottom" placeholder="<?php echo esc_attr( $gm_bottom ); ?>" onblur="default_value_gallery_master('#ux_txt_image_description_margin_bottom', 5);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_description_margin[2] ); ?>">
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_description_margin[]" id="ux_txt_image_description_margin_left" placeholder="<?php echo esc_attr( $gm_left ); ?>" onblur="default_value_gallery_master('#ux_txt_image_description_margin_left', 0);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_description_margin[3] ); ?>">
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
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_description_padding[]" id="ux_txt_image_description_padding_top" placeholder="<?php echo esc_attr( $gm_top ); ?>" onblur="default_value_gallery_master('#ux_txt_image_description_padding_top', 0);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_description_padding[0] ); ?>">
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_description_padding[]" id="ux_txt_image_description_padding_right" placeholder="<?php echo esc_attr( $gm_right ); ?>" onblur="default_value_gallery_master('#ux_txt_image_description_padding_right', 0);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_description_padding[1] ); ?>">
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_description_padding[]" id="ux_txt_image_description_padding_bottom" placeholder="<?php echo esc_attr( $gm_bottom ); ?>" onblur="default_value_gallery_master('#ux_txt_image_description_padding_bottom', 0);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_description_padding[2] ); ?>">
															<input type="text" class="form-control custom-input-xsmall input-inline" name="ux_txt_image_description_padding[]" id="ux_txt_image_description_padding_left" placeholder="<?php echo esc_attr( $gm_left ); ?>" onblur="default_value_gallery_master('#ux_txt_image_description_padding_left', 0);" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="<?php echo intval( $foo_box_image_description_padding[3] ); ?>">
														</div>
														<i class="controls-description"><?php echo esc_attr( $gm_padding_gallery_title_tooltip ); ?></i>
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
					<a href="admin.php?page=gm_lightcase">
						<?php echo esc_attr( $gm_lightboxes ); ?>
					</a>
					<span>></span>
				</li>
				<li>
					<span>
						<?php echo class_exists( 'fooboxV2' ) ? esc_attr( $gm_foo_box_premium ) : esc_attr( $gm_foo_box_free_edition ); ?>
					</span>
				</li>
			</ul>
		</div>
		<div class="row">
			<div class="col-md-12">
				<div class="portlet box vivid-green">
					<div class="portlet-title">
						<div class="caption">
							<i class="icon-custom-frame"></i>
							<?php echo class_exists( 'fooboxV2' ) ? esc_attr( $gm_foo_box_premium ) : esc_attr( $gm_foo_box_free_edition ); ?>
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
