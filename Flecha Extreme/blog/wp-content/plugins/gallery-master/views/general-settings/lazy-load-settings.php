<?php
/**
 * Template for view and update Lazy Load Settings.
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
		$lazy_loader_font_style = isset( $lazyload_settings_get_data['lazy_loader_font_style'] ) ? explode( ',', esc_attr( $lazyload_settings_get_data['lazy_loader_font_style'] ) ) : array( 15, '#000000' );
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
						<?php echo esc_attr( $gm_lazy_load_settings ); ?>
					</span>
				</li>
			</ul>
		</div>
		<div class="row">
			<div class="col-md-12">
				<div class="portlet box vivid-green">
					<div class="portlet-title">
						<div class="caption">
							<i class="icon-custom-reload"></i>
							<?php echo esc_attr( $gm_lazy_load_settings ); ?>
						</div>
					</div>
					<div class="portlet-body form">
						<form id="ux_frm_lazyload_settings">
							<div class="form-body">
								<div class="form-actions">
									<div class="pull-right">
										<input type="submit" class="btn vivid-green" name="ux_btn_save_changes" id="ux_btn_save_changes" value="<?php echo esc_attr( $gm_save_changes ); ?>">
									</div>
								</div>
								<div class="line-separator"></div>
								<div class="row">
									<div class="col-md-6">
										<div class="form-group">
											<label class="control-label">
												<?php echo esc_attr( $gm_background_color ); ?> :
												<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
											</label>
											<input type="text" class="form-control" name="ux_txt_background_color" id="ux_txt_background_color" placeholder="<?php echo esc_attr( $gm_background_color ); ?>" onfocus="color_picker_gallery_master(this, this.value)" value="<?php echo isset( $lazyload_settings_get_data['lazy_loader_background_color'] ) ? esc_attr( $lazyload_settings_get_data['lazy_loader_background_color'] ) : '#ffffff'; ?>">
											<i class="controls-description"><?php echo esc_attr( $gm_general_background_color_tooltip ); ?></i>
										</div>
									</div>
									<div class="col-md-6">
										<div class="form-group">
											<label class="control-label">
												<?php echo esc_attr( $gm_loader_color ); ?> :
												<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
											</label>
											<input type="text" class="form-control" name="ux_txt_loader_color" id="ux_txt_loader_color" placeholder="<?php echo esc_attr( $gm_loader_color ); ?>" onblur="default_value_gallery_master('#ux_txt_loader_color', '#080808');"  onfocus="color_picker_gallery_master(this, this.value)" value="<?php echo isset( $lazyload_settings_get_data['lazy_loader_color'] ) ? esc_attr( $lazyload_settings_get_data['lazy_loader_color'] ) : '#080808'; ?>">
											<i class="controls-description"><?php echo esc_attr( $gm_global_loader_color_tooltip ); ?></i>
										</div>
									</div>
								</div>
								<div class="row">
									<div class="col-md-12">
										<div class="form-group">
											<label class="control-label">
												<?php echo esc_attr( $gm_text ); ?> :
												<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
											</label>
											<select name="ux_ddl_loader_text" id="ux_ddl_loader_text" class="form-control" onchange="show_hide_control_gallery_master('ux_ddl_loader_text', 'ux_div_loader_title');">
												<option value="show"><?php echo esc_attr( $gm_show ); ?></option>
												<option value="hide"><?php echo esc_attr( $gm_hide ); ?></option>
											</select>
											<i class="controls-description"><?php echo esc_attr( $gm_display_control_tooltip ); ?></i>
										</div>
									</div>
								</div>
								<div id="ux_div_loader_title">
									<div class="row">
										<div class="col-md-12">
											<div class="form-group">
												<label class="control-label">
													<?php echo esc_attr( $gm_title ); ?> :
													<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
												</label>
												<input type="text" class="form-control" name="ux_txt_loader_title" id="ux_txt_loader_title" placeholder="<?php echo esc_attr( $gm_title ); ?>" value="<?php echo isset( $lazyload_settings_get_data['lazy_loader_title'] ) ? esc_attr( $lazyload_settings_get_data['lazy_loader_title'] ) : 'Loading. Please Wait...'; ?>">
												<i class="controls-description"><?php echo esc_attr( $gm_text_tooltip ); ?></i>
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
												<div class="input-icon-right">
													<input type="text" class="form-control custom-input-medium input-inline" name="ux_txt_font_style[]" id="ux_txt_font_style" placeholder="<?php echo esc_attr( $gm_font_size_placeholder ); ?>" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" onblur="default_value_gallery_master('#ux_txt_font_style', 15);"  value="<?php echo intval( $lazy_loader_font_style[0] ); ?>">
													<input type="text" class="form-control custom-input-medium input-inline" name="ux_txt_font_style[]" id="ux_txt_font_style_color" onblur="default_value_gallery_master('#ux_txt_font_style_color', '#000000');" onfocus="color_picker_gallery_master(this, this.value)"  placeholder="<?php echo esc_attr( $gm_color_placeholder ); ?>" value="<?php echo esc_attr( $lazy_loader_font_style[1] ); ?>">
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
												<select name="ux_ddl_loader_font_family" id="ux_ddl_loader_font_family" class="form-control">
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
						<?php echo esc_attr( $gm_lazy_load_settings ); ?>
					</span>
				</li>
			</ul>
		</div>
		<div class="row">
			<div class="col-md-12">
				<div class="portlet box vivid-green">
					<div class="portlet-title">
					<div class="caption">
						<i class="icon-custom-reload"></i>
						<?php echo esc_attr( $gm_lazy_load_settings ); ?>
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
