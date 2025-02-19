<?php
/**
 * Template for view and update settings in Global Options.
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
		$global_options_nonce                      = wp_create_nonce( 'global_options_nonce' );
		$global_options_generated_image_dimensions = isset( $global_options_get_data['global_options_generated_image_dimensions'] ) ? explode( ',', esc_attr( $global_options_get_data['global_options_generated_image_dimensions'] ) ) : array( 1600, 900 );
		$global_options_thumbnail_dimensions       = isset( $global_options_get_data['global_options_thumbnail_dimensions'] ) ? explode( ',', esc_attr( $global_options_get_data['global_options_thumbnail_dimensions'] ) ) : array( 180, 160 );
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
					<?php echo esc_attr( $gm_global_options ); ?>
				</span>
			</li>
		</ul>
	</div>
	<div class="row">
		<div class="col-md-12">
			<div class="portlet box vivid-green">
				<div class="portlet-title">
					<div class="caption">
						<i class="icon-custom-globe"></i>
						<?php echo esc_attr( $gm_global_options ); ?>
					</div>
				</div>
				<div class="portlet-body form">
					<form id="ux_frm_global_options">
						<div class="form-body">
							<div class="form-actions">
								<div class="pull-right">
									<input type="submit" class="btn vivid-green" name="ux_btn_save_changes" id="ux_btn_save_changes" value="<?php echo esc_attr( $gm_save_changes ); ?>">
								</div>
							</div>
							<div class="line-separator"></div>
							<div class="row">
								<div class="col-md-6" style="margin-bottom:15px;">
									<div class="form-group">
										<label class="control-label">
											<?php echo esc_attr( $gm_global_options_generated_image_dimension_title ); ?> :
											<span class="required" aria-required="true">*</span>
										</label>
										<div class="input-icon right">
											<input type="text" class="form-control custom-input-medium input-inline" name="ux_txt_height_width[]" id="ux_txt_width" placeholder="<?php echo esc_attr( $gm_width_placeholder ); ?>" maxlength="4" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" onblur="check_thumbnail_dimension_gallery_master(this, '#ux_txt_thumbnail_width');" value="<?php echo intval( $global_options_generated_image_dimensions[0] ); ?>">
											<input type="text" class="form-control custom-input-medium input-inline" name="ux_txt_height_width[]" id="ux_txt_height" placeholder="<?php echo esc_attr( $gm_height_placeholder ); ?>" maxlength="4" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" onblur="check_thumbnail_dimension_gallery_master(this, '#ux_txt_thumbnail_height');" value="<?php echo intval( $global_options_generated_image_dimensions[1] ); ?>">
										</div>
										<i class="controls-description"><?php echo esc_attr( $gm_global_option_thumbnail_dimension_tooltip ); ?></i>
									</div>
								</div>
								<div class="col-md-6" style="margin-bottom:15px;">
									<div class="form-group">
										<label class="control-label">
											<?php echo esc_attr( $gm_global_option_thumbnail_dimension_title ); ?> :
											<span class="required" aria-required="true">*</span>
										</label>
										<div class="input-icon right">
											<input type="text" class="form-control custom-input-medium input-inline" name="ux_txt_thumbnail_height_width[]" id="ux_txt_thumbnail_width" placeholder="<?php echo esc_attr( $gm_width_placeholder ); ?>" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" onblur="check_thumbnail_dimension_gallery_master(this, '#ux_txt_width')" value="<?php echo intval( $global_options_thumbnail_dimensions[0] ); ?>">
											<input type="text" class="form-control custom-input-medium input-inline" name="ux_txt_thumbnail_height_width[]" id="ux_txt_thumbnail_height" placeholder="<?php echo esc_attr( $gm_height_placeholder ); ?>" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" onblur="check_thumbnail_dimension_gallery_master(this, '#ux_txt_height')" value="<?php echo intval( $global_options_thumbnail_dimensions[1] ); ?>">
										</div>
										<i class="controls-description"><?php echo esc_attr( $gm_global_option_thumbnail_dimension_tooltip ); ?></i>
									</div>
								</div>
							</div>
							<div class="row" style="margin-bottom:15px;">
								<div class="col-md-6">
									<div class="form-group">
										<label class="control-label">
											<?php echo esc_attr( $gm_global_option_right_click_protection_title ); ?> :
											<span class="required" aria-required="true">*</span>
										</label>
										<select name="ux_ddl_right_click" id="ux_ddl_right_click" class="form-control">
											<option value="enable"><?php echo esc_attr( $gm_enable ); ?></option>
											<option value="disable"><?php echo esc_attr( $gm_disable ); ?></option>
										</select>
										<i class="controls-description"><?php echo esc_attr( $gm_global_option_right_click_protection_tooltip ); ?></i>
									</div>
								</div>
								<div class="col-md-6">
									<div class="form-group">
										<label class="control-label">
											<?php echo esc_attr( $gm_global_option_language_direction_title ); ?> :
											<span class="required" aria-required="true">*</span>
										</label>
										<select name="ux_ddl_language_direction" id="ux_ddl_language_direction" class="form-control">
											<option value="right_to_left"><?php echo esc_attr( $gm_global_option_language_direction_right_to_left ); ?></option>
											<option value="left_to_right"><?php echo esc_attr( $gm_global_option_language_direction_left_to_right ); ?></option>
										</select>
										<i class="controls-description"><?php echo esc_attr( $gm_global_option_language_direction_tooltip ); ?></i>
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
					<?php echo esc_attr( $gm_global_options ); ?>
				</span>
			</li>
		</ul>
	</div>
	<div class="row">
		<div class="col-md-12">
			<div class="portlet box vivid-green">
				<div class="portlet-title">
					<div class="caption">
						<i class="icon-custom-globe"></i>
						<?php echo esc_attr( $gm_global_options ); ?>
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
