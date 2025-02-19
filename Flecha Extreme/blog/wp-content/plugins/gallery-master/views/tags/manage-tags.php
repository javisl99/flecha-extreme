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
						<?php echo esc_attr( $gm_manage_tags ); ?>
					</span>
				</li>
			</ul>
		</div>
		<div class="row">
			<div class="col-md-12">
				<div class="portlet box vivid-green">
					<div class="portlet-title">
						<div class="caption">
							<i class="icon-custom-tag"></i>
							<?php echo esc_attr( $gm_manage_tags ); ?>
						</div>
					</div>
				<div class="portlet-body form">
					<form id="ux_frm_add_tag">
						<div class="form-body">
							<div class="table-top-margin">
								<select name="ux_ddl_manage_tags" id="ux_ddl_manage_tags">
									<option value=""><?php echo esc_attr( $gm_bulk_action ); ?></option>
									<option value="delete" style="color:red;"><?php echo esc_attr( $gm_delete . ' ( ' . $gm_premium_edition . ' )' ); ?></option>
								</select>
								<input type="button" class="btn vivid-green" name="ux_btn_apply_manage_tags" id="ux_btn_apply_manage_tags" value="<?php echo esc_attr( $gm_apply ); ?>" onclick='premium_edition_notification_gallery_master();'>
								<a href="admin.php?page=gm_add_tag" class="btn vivid-green"><?php echo esc_attr( $gm_add_tag ); ?></a>
							</div>
							<div class="line-separator"></div>
							<table class="table table-striped table-bordered table-hover table-margin-top" id="ux_tbl_manage_tags">
								<thead>
									<tr>
										<th style="width: 5%; text-align:center;" class="chk-action">
											<input type="checkbox" class="custom-chkbox-operation" name="ux_chk_all" id="ux_chk_all">
										</th>
										<th class="custom-gallery-title" style="width: 15%;">
											<label class="control-label">
												<?php echo esc_attr( $gm_tag_name_title ); ?>
											</label>
										</th>
										<th class="custom-gallery-description" style="width: 45%;">
											<label class="control-label">
												<?php echo esc_attr( $gm_tag_description_title ); ?>
											</label>
										</th>
										<th style="width: 10%;">
											<label class="control-label" >
												<?php echo esc_attr( $gm_status ); ?>
											</label>
										</th>
										<th class="chk-action" style="text-align:center; width: 25%;">
											<label class="control-label">
												<?php echo esc_attr( $gm_action ); ?>
											</label>
										</th>
									</tr>
								</thead>
								<tbody>
									<?php
									foreach ( $manage_tag_data as $row ) {
										?>
										<tr>
											<td style="text-align:center;width: 5%;">
												<input type="checkbox" name="ux_chk_details_<?php echo intval( $row['id'] ); ?>" id="ux_chk_details_<?php echo intval( $row['id'] ); ?>" value="<?php echo intval( $row['id'] ); ?>" onclick="check_all_gallery_master('#ux_chk_all');"
													<?php
													if ( in_array( intval( $row['id'] ), $get_gallery_tags, true ) ) {
														echo 'disabled';
													}
													?>
													>
											</td>
											<td style="width: 15%;">
												<label>
													<?php echo esc_html( $row['tag_name'] ); ?>
												</label>
											</td>
											<td style="width: 45%;">
												<label>
													<?php echo htmlspecialchars_decode( $row['tag_description'] );// WPCS: XSS ok. ?>
												</label>
											</td>
											<td style="width: 10%;">
												<label>
													<?php
													if ( in_array( intval( $row['id'] ), $get_gallery_tags, true ) ) {
														echo esc_attr( $gm_used );
													} else {
														echo esc_attr( $gm_unused );
													}
													?>
													</label>
												</td>
												<td class="custom-alternative" style="width: 25%;">
													<a href="admin.php?page=gm_add_tag&id=<?php echo intval( $row['id'] ); ?>" class="btn gallery-master-buttons"> <?php echo esc_attr( $gm_edit_tooltip ); ?>
													</a>
													<a href="javascript:void(0);" class="btn gallery-master-buttons" onclick='premium_edition_notification_gallery_master();'><?php echo esc_attr( $gm_delete ); ?>
													</a>
												</td>
											</tr>
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
					<a href="admin.php?page=gm_manage_tags">
						<?php echo esc_attr( $gm_tags ); ?>
					</a>
					<span>></span>
				</li>
				<li>
					<span>
						<?php echo esc_attr( $gm_manage_tags ); ?>
					</span>
				</li>
			</ul>
		</div>
		<div class="row">
			<div class="col-md-12">
				<div class="portlet box vivid-green">
					<div class="portlet-title">
						<div class="caption">
							<i class="icon-custom-tag"></i>
							<?php echo esc_attr( $gm_manage_tags ); ?>
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
