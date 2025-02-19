<?php
/**
 * Template for adding a New Tag or Modifying an Existing Tag.
 *
 * @author  Tech Banker
 * @package     gallery-master/views/tags
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
	} elseif ( TAGS_GALLERY_MASTER === '1' ) {
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
						<a href="admin.php?page=gm_manage_tags">
							<?php echo esc_attr( $gm_tags ); ?>
						</a>
						<span>></span>
					</li>
					<li>
						<span>
							<?php echo isset( $_REQUEST['id'] ) ? esc_attr( $gm_update_tag ) : esc_attr( $gm_add_tag ); // WPCS: input var ok,CSRF ok. ?>
						</span>
					</li>
				</ul>
			</div>
			<div class="row">
				<div class="col-md-12">
					<div class="portlet box vivid-green">
						<div class="portlet-title">
							<div class="caption">
								<i class="icon <?php echo isset( $_REQUEST['id'] ) ? 'icon-custom-note' : 'icon-custom-plus'; // WPCS: input var ok,CSRF ok. ?>"></i>
								<?php echo isset( $_REQUEST['id'] ) ? esc_attr( $gm_update_tag ) : esc_attr( $gm_add_tag ); // WPCS: input var ok,CSRF ok. ?>
							</div>
						</div>
						<div class="portlet-body form">
							<form id="ux_frm_add_tag">
								<div class="form-body">
									<div class="form-actions">
										<div class="pull-right">
											<input type="submit" class="btn vivid-green" name="ux_btn_add_tag"  id="ux_btn_add_tag" value="<?php echo esc_attr( $gm_save_changes ); ?>">
										</div>
									</div>
									<div class="line-separator"></div>
									<div class="form-group">
										<label class="control-label">
											<?php echo esc_attr( $gm_tag_name_title ); ?> :
											<span class="required" aria-required="true">* ( <?php echo esc_attr( esc_attr( esc_attr( $gm_premium_edition ) ) ); ?> )</span>
										</label>
										<input type="text" class="form-control" name="ux_txt_tag_name" id="ux_txt_tag_name" value="<?php echo isset( $manage_tag_data['tag_name'] ) ? esc_html( $manage_tag_data['tag_name'] ) : ''; ?>" placeholder="<?php echo esc_attr( $gm_add_tag_name_placeholder ); ?>">
										<i class="controls-description"><?php echo esc_attr( $gm_add_tag_name_tooltip ); ?></i>
									</div>
									<div class="form-group">
										<label class="control-label">
											<?php echo esc_attr( $gm_tag_description_title ); ?> :
											<span class="required" aria-required="true"><?php echo esc_attr( ' ( ' . $gm_premium_edition . ' ) ' ); ?></span>
										</label>
										<textarea class="form-control" name="ux_txtarea_tag_description" id="ux_txtarea_tag_description" rows="5" placeholder="<?php echo esc_attr( $gm_add_tag_description_placeholder ); ?>"><?php echo isset( $manage_tag_data['tag_description'] ) ? esc_html( $manage_tag_data['tag_description'] ) : ''; ?></textarea>
										<i class="controls-description"><?php echo esc_attr( $gm_add_tag_description_tooltip ); ?></i>
									</div>
									<div class="line-separator"></div>
									<div class="form-actions">
										<div class="pull-right">
											<input type="submit" class="btn vivid-green" name="ux_btn_add_tag"  id="ux_btn_add_tag" value="<?php echo esc_attr( $gm_save_changes ); ?>">
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
					<a href="admin.php?page=gm_manage_tags">
						<?php echo esc_attr( $gm_tags ); ?>
					</a>
					<span>></span>
				</li>
				<li>
					<span>
						<?php echo isset( $_REQUEST['id'] ) ? esc_attr( $gm_update_tag ) : esc_attr( $gm_add_tag ); // WPCS: input var ok,CSRF ok. ?>
					</span>
				</li>
			</ul>
		</div>
		<div class="row">
			<div class="col-md-12">
				<div class="portlet box vivid-green">
					<div class="portlet-title">
						<div class="caption">
							<i class="icon-custom-plus"></i>
							<?php echo esc_attr( $gm_add_tag ); ?>
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
