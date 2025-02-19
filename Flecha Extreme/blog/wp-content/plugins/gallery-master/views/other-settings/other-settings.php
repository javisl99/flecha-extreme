<?php
/**
 * Template to display other settings
 *
 * @author  Tech Banker
 * @package     gallery-master/views/other-settings
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
	} elseif ( OTHER_SETTINGS_GALLERY_MASTER === '1' ) {
		$other_settings_nonce = wp_create_nonce( 'other_settings_nonce' );
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
					<span>
						<?php echo esc_attr( $gm_other_setting ); ?>
					</span>
				</li>
			</ul>
		</div>
		<div class="row">
			<div class="col-md-12">
				<div class="portlet box vivid-green">
					<div class="portlet-title">
						<div class="caption">
							<i class="icon-custom-wrench"></i>
							<?php echo esc_attr( $gm_other_setting ); ?>
						</div>
					</div>
					<div class="portlet-body form">
						<form id="ux_frm_other_setting">
							<div class="form-body">
								<div class="form-group">
									<label class="control-label">
										<?php echo esc_attr( $gm_other_setting_remove_table_at_uninstall_title ); ?> :
										<span class="required" aria-required="true">*</span>
									</label>
									<select id="ux_ddl_remove_table" name="ux_ddl_remove_table" class="form-control">
										<option value="enable"><?php echo esc_attr( $gm_enable ); ?></option>
										<option value="disable"><?php echo esc_attr( $gm_disable ); ?></option>
									</select>
									<i class="controls-description"><?php echo esc_attr( $gm_other_setting_remove_table_at_uninstall_tooltip ); ?></i>
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
					<span>
						<?php echo esc_attr( $gm_other_setting ); ?>
					</span>
				</li>
			</ul>
		</div>
		<div class="row">
			<div class="col-md-12">
				<div class="portlet box vivid-green">
					<div class="portlet-title">
						<div class="caption">
							<i class="icon-custom-wrench"></i>
							<?php echo esc_attr( $gm_other_setting ); ?>
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
