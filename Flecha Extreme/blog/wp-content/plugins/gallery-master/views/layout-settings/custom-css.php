<?php
/**
 * Template to view and update the Custom CSS.
 *
 * @author   Tech Banker
 * @package  gallery-master/views/layout-settings
 * @version   2.0.0
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
	} elseif ( LAYOUT_SETTINGS_GALLERY_MASTER === '1' ) {
		$custom_css_nonce = wp_create_nonce( 'custom_css_nonce' );
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
					<a href="admin.php?page=gm_thumbnail_layout">
						<?php echo esc_attr( $gm_layout_settings ); ?>
					</a>
					<span>></span>
				</li>
				<li>
					<span>
						<?php echo esc_attr( $gm_custom_css ); ?>
					</span>
				</li>
		</ul>
	</div>
	<div class="row">
		<div class="col-md-12">
			<div class="portlet box vivid-green">
				<div class="portlet-title">
					<div class="caption">
						<i class="icon-custom-pencil"></i>
						<?php echo esc_attr( $gm_custom_css ); ?>
					</div>
				</div>
				<div class="portlet-body form">
					<form id="ux_frm_custom_css">
						<div class="form-body">
							<div class="form-group">
								<label class="control-label">
									<?php echo esc_attr( $gm_custom_css ); ?> :
								</label>
								<textarea rows="20" class="form-control" name="ux_txt_custom_css" placeholder="<?php echo esc_attr( $gm_custom_css_placeholder ); ?>" id="ux_txt_custom_css"><?php echo isset( $details_custom_css['custom_css'] ) ? esc_attr( $details_custom_css['custom_css'] ) : ''; ?></textarea>
								<i class="controls-description"><?php echo esc_attr( $gm_custom_css_tooltip ); ?></i>
							</div>
						<div class="line-separator"></div>
							<div class="form-actions">
								<div class="pull-right">
									<input type="submit" value="<?php echo esc_attr( $gm_save_changes ); ?>" class="btn vivid-green" name="ux_btn_custom_css" id="ux_btn_custom_css">
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
				<a href="admin.php?page=gm_thumbnail_layout">
					<?php echo esc_attr( $gm_layout_settings ); ?>
				</a>
				<span>></span>
			</li>
			<li>
				<span>
					<?php echo esc_attr( $gm_custom_css ); ?>
				</span>
			</li>
		</ul>
	</div>
	<div class="row">
		<div class="col-md-12">
			<div class="portlet box vivid-green">
				<div class="portlet-title">
					<div class="caption">
						<i class="icon-custom-pencil"></i>
						<?php echo esc_attr( $gm_custom_css ); ?>
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
