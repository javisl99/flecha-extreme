<?php
/**
 * Template for update and view settings in Roles and Capabilities.
 *
 * @author  Tech Banker
 * @package     gallery-master/views/roles-and-capabilities
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
	} elseif ( ROLES_AND_CAPABILITIES_GALLERY_MASTER === '1' ) {
		$roles_and_capabilities = explode( ',', isset( $details_roles_capabilities ) ? $details_roles_capabilities['roles_and_capabilities'] : '1,1,1,0,0,0' );
		$author                 = explode( ',', isset( $details_roles_capabilities ) ? $details_roles_capabilities['author_privileges'] : '0,1,1,0,0,0,1,0,0,0,1,0' );
		$editor                 = explode( ',', isset( $details_roles_capabilities ) ? $details_roles_capabilities['editor_privileges'] : '0,0,0,0,0,0,1,0,1,0,0,0' );
		$contributor            = explode( ',', isset( $details_roles_capabilities ) ? $details_roles_capabilities['contributor_privileges'] : '0,0,0,1,0,0,1,0,0,0,0,0' );
		$subscriber             = explode( ',', isset( $details_roles_capabilities ) ? $details_roles_capabilities['subscriber_privileges'] : '0,0,0,0,0,0,0,0,0,0,0,0' );
		$other_capability       = explode( ',', isset( $details_roles_capabilities ) ? $details_roles_capabilities['other_privileges'] : '0,0,0,0,0,0,0,0,0,0,0,0' );
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
						<?php echo esc_attr( $gm_roles_and_capabilities ); ?>
					</span>
				</li>
			</ul>
		</div>
		<div class="row">
			<div class="col-md-12">
				<div class="portlet box vivid-green">
					<div class="portlet-title">
						<div class="caption">
							<i class="icon-custom-users"></i>
							<?php echo esc_attr( $gm_roles_and_capabilities ); ?>
						</div>
					</div>
					<div class="portlet-body form">
						<form id="ux_frm_roles_and_capabilities">
							<div class="form-body">
								<div class="form-actions">
									<div class="pull-right">
										<input type="submit" class="btn vivid-green" name="ux_btn_add_tag"  id="ux_btn_add_tag" value="<?php echo esc_attr( $gm_save_changes ); ?>">
									</div>
								</div>
								<div class="line-separator"></div>
								<div class="form-group">
									<label class="control-label">
										<?php echo esc_attr( $gm_roles_capabilities_show_menu ); ?> :
										<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>									</label>
									<table class="table table-striped table-bordered table-margin-top" id="ux_tbl_gallery_master">
										<thead>
											<tr>
												<th>
													<input type="checkbox" name="ux_chk_administrator" id="ux_chk_administrator" value="1" checked="checked" disabled="disabled" <?php echo '1' === $roles_and_capabilities[0] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_roles_capabilities_administrator ); ?>
												</th>
												<th>
													<input type="checkbox" name="ux_chk_author" id="ux_chk_author" value="1" onclick="show_roles_capabilities_gallery_master(this, 'ux_div_author_roles');" <?php echo '1' === $roles_and_capabilities[1] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_roles_capabilities_author ); ?>
												</th>
												<th>
													<input type="checkbox" name="ux_chk_editor" id="ux_chk_editor" value="1" onclick="show_roles_capabilities_gallery_master(this, 'ux_div_editor_roles');" <?php echo '1' === $roles_and_capabilities[2] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_roles_capabilities_editor ); ?>
												</th>
												<th>
													<input type="checkbox" name="ux_chk_contributor" id="ux_chk_contributor" value="1" onclick="show_roles_capabilities_gallery_master(this, 'ux_div_contributor_roles');" <?php echo '1' === $roles_and_capabilities[3] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_roles_capabilities_contributor ); ?>
												</th>
												<th>
													<input type="checkbox" name="ux_chk_subscriber" id="ux_chk_subscriber" value="1" onclick="show_roles_capabilities_gallery_master(this, 'ux_div_subscriber_roles');" <?php echo '1' === $roles_and_capabilities[4] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_roles_capabilities_subscriber ); ?>
												</th>
												<th>
													<input type="checkbox"  name="ux_chk_others_privileges" id="ux_chk_others_privileges" value="1" onclick="show_roles_capabilities_gallery_master(this, 'ux_div_other_privileges_roles');" <?php echo '1' === $roles_and_capabilities[5] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_roles_capabilities_others ); ?>
												</th>
											</tr>
										</thead>
									</table>
									<i class="controls-description"><?php echo esc_attr( $gm_roles_capabilities_show_menu_tooltip ); ?></i>
								</div>
							<div class="form-group">
								<label class="control-label">
									<?php echo esc_attr( $gm_roles_capabilities_topbar_menu ); ?> :
									<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>								</label>
								<select name="ux_ddl_gallery_master_menu" id="ux_ddl_gallery_master_menu" class="form-control">
									<option value="enable"><?php echo esc_attr( $gm_enable ); ?></option>
									<option value="disable"><?php echo esc_attr( $gm_disable ); ?></option>
								</select>
								<i class="controls-description"><?php echo esc_attr( $gm_roles_capabilities_topbar_menu_tooltip ); ?></i>
							</div>
							<div class="line-separator"></div>
							<div class="form-group">
								<div id="ux_div_administrator_roles">
									<label class="control-label">
										<?php echo esc_attr( $gm_roles_capabilities_administrator_role ); ?> :
										<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>									</label>
									<div class="table-margin-top">
										<table class="table table-striped table-bordered table-hover" id="ux_tbl_administrator">
										<thead>
											<tr>
												<th style="width: 40% !important;">
													<input type="checkbox" name="ux_chk_full_control_administrator" id="ux_chk_full_control_administrator" checked="checked" disabled="disabled" value="1">
													<?php echo esc_attr( $gm_roles_capabilities_full_control ); ?>
												</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_galleries_admin" disabled="disabled" checked="checked" id="ux_chk_galleries_admin" value="1">
													<?php echo esc_attr( $gm_galleries ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_albums_admin" disabled="disabled" checked="checked" id="ux_chk_albums_admin" value="1">
													<?php echo esc_attr( $gm_albums ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_tags_admin" disabled="disabled" checked="checked" id="ux_chk_tags_admin" value="1">
													<?php echo esc_attr( $gm_tags ); ?>
												</td>
											</tr>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_layout_settings_admin" disabled="disabled" checked="checked" id="ux_chk_layout_settings_admin" value="1">
													<?php echo esc_attr( $gm_layout_settings ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_lightboxes_admin" disabled="disabled" checked="checked" id="ux_chk_lightboxes_admin" value="1">
													<?php echo esc_attr( $gm_lightboxes ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_general_settings_admin" disabled="disabled" checked="checked" id="ux_chk_general_settings_admin" value="1">
													<?php echo esc_attr( $gm_general_settings ); ?>
												</td>
											</tr>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_shortcode_generator_admin" disabled="disabled" checked="checked" id="ux_chk_shortcode_generator_admin" value="1">
													<?php echo esc_attr( $gm_shortcode_generator ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_other_settings_admin" id="ux_chk_other_settings_admin" disabled="disabled" checked="checked" value="1">
													<?php echo esc_attr( $gm_other_setting ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_roles_admin" disabled="disabled" checked="checked" id="ux_chk_roles_admin" value="1">
													<?php echo esc_attr( $gm_roles_and_capabilities ); ?>
												</td>
											</tr>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_system_information_admin" disabled="disabled" checked="checked" id="ux_chk_system_information_admin" value="1">
													<?php echo esc_attr( $gm_system_information ); ?>
												</td>
												<td>
												</td>
												<td>
												</td>
											</tr>
										</tbody>
									</table>
									<i class="controls-description"><?php echo esc_attr( $gm_roles_capabilities_administrator_role_tooltip ); ?></i>
									</div>
									<div class="line-separator"></div>
								</div>
							</div>
							<div class="form-group">
								<div id="ux_div_author_roles">
									<label class="control-label">
										<?php echo esc_attr( $gm_roles_capabilities_author_role ); ?> :
										<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>									</label>
									<div class="table-margin-top">
										<table class="table table-striped table-bordered table-hover" id="ux_tbl_author">
										<thead>
											<tr>
												<th style="width: 40% !important;">
													<input type="checkbox" name="ux_chk_full_control_author" id="ux_chk_full_control_author" value="1" onclick="full_control_function_gallery_master(this, 'ux_div_author_roles');" <?php echo isset( $author ) && '1' === $author[0] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_roles_capabilities_full_control ); ?>
												</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_galleries_author" id="ux_chk_galleries_author" value="1" <?php echo isset( $author ) && '1' === $author[1] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_galleries ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_albums_author" id="ux_chk_albums_author" value="1" <?php echo isset( $author ) && '1' === $author[2] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_albums ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_tags_author" id="ux_chk_tags_author" value="1" <?php echo isset( $author ) && '1' === $author[3] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_tags ); ?>
												</td>
											</tr>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_layout_settings_author" id="ux_chk_layout_settings_author" value="1" <?php echo isset( $author ) && '1' === $author[4] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_layout_settings ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_lightboxes_author" id="ux_chk_lightboxes_author" value="1" <?php echo isset( $author ) && '1' === $author[5] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_lightboxes ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_general_settings_author" id="ux_chk_general_settings_author" value="1" <?php echo isset( $author ) && '1' === $author[6] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_general_settings ); ?>
												</td>
											</tr>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_shortcode_generator_author" id="ux_chk_shortcode_generator_author" value="1" <?php echo isset( $author ) && '1' === $author[7] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_shortcode_generator ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_other_settings_author" id="ux_chk_other_settings_author " value="1" <?php echo isset( $author ) && '1' === $author[8] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_other_setting ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_roles_author" id="ux_chk_roles_author" value="1" <?php echo isset( $author ) && '1' === $author[9] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_roles_and_capabilities ); ?>
												</td>
											</tr>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_system_information_author" id="ux_chk_system_information_author" value="1" <?php echo isset( $author ) && '1' === $author[10] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_system_information ); ?>
												</td>
												<td>
												</td>
												<td>
												</td>
											</tr>
										</tbody>
									</table>
									<i class="controls-description"><?php echo esc_attr( $gm_roles_capabilities_author_role_tooltip ); ?></i>
									</div>
									<div class="line-separator"></div>
								</div>
							</div>
							<div class="form-group">
								<div id="ux_div_editor_roles">
									<label class="control-label">
										<?php echo esc_attr( $gm_roles_capabilities_editor_role ); ?> :
										<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>									</label>
									<div class="table-margin-top">
										<table class="table table-striped table-bordered table-hover" id="ux_tbl_editor">
										<thead>
											<tr>
												<th style="width: 40% !important;">
													<input type="checkbox" name="ux_chk_full_control_editor" id="ux_chk_full_control_editor" value="1" onclick="full_control_function_gallery_master(this, 'ux_div_editor_roles');" <?php echo isset( $editor ) && '1' === $editor[0] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_roles_capabilities_full_control ); ?>
												</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_galleries_editor" id="ux_chk_galleries_editor" value="1" <?php echo isset( $editor ) && '1' === $editor[1] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_galleries ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_albums_editor" id="ux_chk_albums_editor" value="1" <?php echo isset( $editor ) && '1' === $editor[2] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_albums ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_tags_editor" id="ux_chk_tags_editor" value="1" <?php echo isset( $editor ) && '1' === $editor[3] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_tags ); ?>
												</td>
											</tr>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_layout_settings_editor" id="ux_chk_layout_settings_editor" value="1" <?php echo isset( $editor ) && '1' === $editor[4] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_layout_settings ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_lightboxes_editor" id="ux_chk_lightboxes_editor" value="1" <?php echo isset( $editor ) && '1' === $editor[5] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_lightboxes ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_general_settings_editor" id="ux_chk_general_settings_editor" value="1" <?php echo isset( $editor ) && '1' === $editor[6] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_general_settings ); ?>
												</td>
											</tr>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_shortcode_generator_editor" id="ux_chk_shortcode_generator_editor" value="1" <?php echo isset( $editor ) && '1' === $editor[7] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_shortcode_generator ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_other_settings_editor" id="ux_chk_other_settings_editor" value="1" <?php echo isset( $editor ) && '1' === $editor[8] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_other_setting ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_roles_editor" id="ux_chk_roles_editor" value="1" <?php echo isset( $editor ) && '1' === $editor[9] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_roles_and_capabilities ); ?>
												</td>
											</tr>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_system_information_editor" id="ux_chk_system_information_editor" value="1" <?php echo isset( $editor ) && '1' === $editor[10] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_system_information ); ?>
												</td>
												<td>
												</td>
												<td>
												</td>
											</tr>
										</tbody>
									</table>
									<i class="controls-description"><?php echo esc_attr( $gm_roles_capabilities_editor_role_tooltip ); ?></i>
									</div>
									<div class="line-separator"></div>
								</div>
							</div>
							<div class="form-group">
								<div id="ux_div_contributor_roles">
									<label class="control-label">
										<?php echo esc_attr( $gm_roles_capabilities_contributor_role ); ?> :
										<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>									</label>
									<div class="table-margin-top">
										<table class="table table-striped table-bordered table-hover" id="ux_tbl_contributor">
										<thead>
											<tr>
												<th style="width: 40% !important;">
													<input type="checkbox" name="ux_chk_full_control_contributor" id="ux_chk_full_control_contributor" value="1" onclick="full_control_function_gallery_master(this, 'ux_div_contributor_roles');" <?php echo isset( $contributor ) && '1' === $contributor[0] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_roles_capabilities_full_control ); ?>
												</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_galleries_contributor" id="ux_chk_galleries_contributor" value="1" <?php echo isset( $contributor ) && '1' === $contributor[1] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_galleries ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_albums_contributor" id="ux_chk_albums_contributor" value="1" <?php echo isset( $contributor ) && '1' === $contributor[2] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_albums ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_tags_contributor" id="ux_chk_tags_contributor" value="1" <?php echo isset( $contributor ) && '1' === $contributor[3] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_tags ); ?>
												</td>
											</tr>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_layout_settings_contributor" id="ux_chk_layout_settings_contributor" value="1" <?php echo isset( $contributor ) && '1' === $contributor[4] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_layout_settings ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_lightboxes_contributor" id="ux_chk_lightboxes_contributor" value="1" <?php echo isset( $contributor ) && '1' === $contributor[5] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_lightboxes ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_general_settings_contributor" id="ux_chk_general_settings_contributor" value="1" <?php echo isset( $contributor ) && '1' === $contributor[6] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_general_settings ); ?>
												</td>
											</tr>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_shortcode_generator_contributor" id="ux_chk_shortcode_generator_contributor" value="1" <?php echo isset( $contributor ) && '1' === $contributor[7] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_shortcode_generator ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_other_settings_contributor" id="ux_chk_other_settings_contributor" value="1" <?php echo isset( $contributor ) && '1' === $contributor[8] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_other_setting ); ?>
												</td>
												<td>
													<input type="checkbox" name="ux_chk_roles_contributor" id="ux_chk_roles_contributor" value="1" <?php echo isset( $contributor ) && '1' === $contributor[9] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_roles_and_capabilities ); ?>
												</td>
											</tr>
											<tr>
												<td>
													<input type="checkbox" name="ux_chk_system_information_contributor" id="ux_chk_system_information_contributor" value="1" <?php echo isset( $contributor ) && '1' === $contributor[10] ? 'checked = checked' : ''; ?>>
													<?php echo esc_attr( $gm_system_information ); ?>
												</td>
												<td>
												</td>
												<td>
												</td>
											</tr>
										</tbody>
									</table>
									<i class="controls-description"><?php echo esc_attr( $gm_roles_capabilities_contributor_role_tooltip ); ?></i>
									</div>
									<div class="line-separator"></div>
								</div>
							</div>
							<div class="form-group">
								<div id="ux_div_subscriber_roles">
									<label class="control-label">
										<?php echo esc_attr( $gm_roles_capabilities_subscriber_role ); ?> :
										<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>									</label>
									<div class="table-margin-top">
										<table class="table table-striped table-bordered table-hover" id="ux_tbl_subscriber">
											<thead>
												<tr>
													<th style="width: 40% !important;">
														<input type="checkbox" name="ux_chk_full_control_subscriber" id="ux_chk_full_control_subscriber" value="1" onclick="full_control_function_gallery_master(this, 'ux_div_subscriber_roles');" <?php echo isset( $subscriber ) && '1' === $subscriber[0] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_roles_capabilities_full_control ); ?>
													</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td>
														<input type="checkbox" name="ux_chk_galleries_subscriber" id="ux_chk_galleries_subscriber" value="1" <?php echo isset( $subscriber ) && '1' === $subscriber[1] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_galleries ); ?>
													</td>
													<td>
														<input type="checkbox" name="ux_chk_albums_subscriber" id="ux_chk_albums_subscriber" value="1" <?php echo isset( $subscriber ) && '1' === $subscriber[2] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_albums ); ?>
													</td>
													<td>
														<input type="checkbox" name="ux_chk_tags_subscriber" id="ux_chk_tags_subscriber" value="1" <?php echo isset( $subscriber ) && '1' === $subscriber[3] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_tags ); ?>
													</td>
												</tr>
												<tr>
													<td>
														<input type="checkbox" name="ux_chk_layout_settings_subscriber" id="ux_chk_layout_settings_subscriber" value="1" <?php echo isset( $subscriber ) && '1' === $subscriber[4] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_layout_settings ); ?>
													</td>
													<td>
														<input type="checkbox" name="ux_chk_lightboxes_subscriber" id="ux_chk_lightboxes_subscriber" value="1" <?php echo isset( $subscriber ) && '1' === $subscriber[5] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_lightboxes ); ?>
													</td>
													<td>
														<input type="checkbox" name="ux_chk_general_settings_subscriber" id="ux_chk_general_settings_subscriber" value="1" <?php echo isset( $subscriber ) && '1' === $subscriber[6] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_general_settings ); ?>
													</td>
												</tr>
												<tr>
													<td>
														<input type="checkbox" name="ux_chk_shortcode_generator_subscriber" id="ux_chk_shortcode_generator_subscriber" value="1" <?php echo isset( $subscriber ) && '1' === $subscriber[7] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_shortcode_generator ); ?>
													</td>
													<td>
														<input type="checkbox" name="ux_chk_other_settings_subscriber" id="ux_chk_other_settings_subscriber" value="1" <?php echo isset( $subscriber ) && '1' === $subscriber[8] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_other_setting ); ?>
													</td>
													<td>
														<input type="checkbox" name="ux_chk_roles_subscriber" id="ux_chk_roles_subscriber" value="1" <?php echo isset( $subscriber ) && '1' === $subscriber[9] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_roles_and_capabilities ); ?>
													</td>
												</tr>
												<tr>
													<td>
														<input type="checkbox" name="ux_chk_system_information_subscriber" id="ux_chk_system_information_subscriber" value="1" <?php echo isset( $subscriber ) && '1' === $subscriber[10] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_system_information ); ?>
													</td>
													<td>
													</td>
													<td>
													</td>
												</tr>
											</tbody>
										</table>
										<i class="controls-description"><?php echo esc_attr( $gm_roles_capabilities_subscriber_role_tooltip ); ?></i>
									</div>
									<div class="line-separator"></div>
								</div>
							</div>
							<div class="form-group">
								<div id="ux_div_other_privileges_roles">
									<label class="control-label">
										<?php echo esc_attr( $gm_roles_capabilities_other_role ); ?> :
										<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>									</label>
									<div class="table-margin-top">
										<table class="table table-striped table-bordered table-hover" id="ux_tbl_subscriber">
											<thead>
												<tr>
													<th style="width: 40% !important;">
														<input type="checkbox" name="ux_chk_full_control_others" id="ux_chk_full_control_others" value="1" onclick="full_control_function_gallery_master(this, 'ux_div_other_privileges_roles');" <?php echo isset( $other_capability ) && '1' === $other_capability[0] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_roles_capabilities_full_control ); ?>
													</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td>
														<input type="checkbox" name="ux_chk_galleries_other" id="ux_chk_galleries_other" value="1" <?php echo isset( $other_capability ) && '1' === $other_capability[1] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_galleries ); ?>
													</td>
													<td>
														<input type="checkbox" name="ux_chk_albums_other" id="ux_chk_albums_other" value="1" <?php echo isset( $other_capability ) && '1' === $other_capability[2] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_albums ); ?>
													</td>
													<td>
														<input type="checkbox" name="ux_chk_tags_other" id="ux_chk_tags_other" value="1" <?php echo isset( $other_capability ) && '1' === $other_capability[3] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_tags ); ?>
													</td>
												</tr>
												<tr>
													<td>
														<input type="checkbox" name="ux_chk_layout_settings_other" id="ux_chk_layout_settings_other" value="1" <?php echo isset( $other_capability ) && '1' === $other_capability[4] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_layout_settings ); ?>
													</td>
													<td>
														<input type="checkbox" name="ux_chk_lightboxes_other" id="ux_chk_lightboxes_other" value="1" <?php echo isset( $other_capability ) && '1' === $other_capability[5] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_lightboxes ); ?>
													</td>
													<td>
														<input type="checkbox" name="ux_chk_general_settings_other" id="ux_chk_general_settings_other" value="1" <?php echo isset( $other_capability ) && '1' === $other_capability[6] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_general_settings ); ?>
													</td>
												</tr>
												<tr>
													<td>
														<input type="checkbox" name="ux_chk_shortcode_generator_other" id="ux_chk_shortcode_generator_other" value="1" <?php echo isset( $other_capability ) && '1' === $other_capability[7] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_shortcode_generator ); ?>
													</td>
													<td>
														<input type="checkbox" name="ux_chk_other_setting" id="ux_chk_other_setting" value="1" <?php echo isset( $other_capability ) && '1' === $other_capability[8] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_other_setting ); ?>
													</td>
													<td>
														<input type="checkbox" name="ux_chk_roles_other" id="ux_chk_roles_other" value="1" <?php echo isset( $other_capability ) && '1' === $other_capability[9] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_roles_and_capabilities ); ?>
													</td>
												</tr>
												<tr>
													<td>
														<input type="checkbox" name="ux_chk_system_information_other" id="ux_chk_system_information_other" value="1" <?php echo isset( $other_capability ) && '1' === $other_capability[10] ? 'checked = checked' : ''; ?>>
														<?php echo esc_attr( $gm_system_information ); ?>
													</td>
													<td>
													</td>
													<td>
													</td>
												</tr>
											</tbody>
										</table>
										<i class="controls-description"><?php echo esc_attr( $gm_roles_capabilities_other_role_tooltip ); ?></i>
									</div>
									<div class="line-separator"></div>
								</div>
							</div>
							<div class="form-group">
								<div id="ux_div_other_roles">
									<label class="control-label">
										<?php echo esc_attr( $gm_roles_capabilities_other_roles_capabilities ); ?> :
										<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>									</label>
									<div class="table-margin-top">
										<table class="table table-striped table-bordered table-hover" id="ux_tbl_other_roles">
											<thead>
												<tr>
													<th style="width: 40% !important;">
														<input type="checkbox" name="ux_chk_full_control_other_roles" id="ux_chk_full_control_other_roles" value="1" onclick="full_control_function_gallery_master(this, 'ux_div_other_roles');" >
														<?php echo esc_attr( $gm_roles_capabilities_full_control ); ?>
													</th>
												</tr>
											</thead>
											<tbody>
												<?php
												$flag              = 0;
												$user_capabilities = get_others_capabilities_gallery_master();
												foreach ( $user_capabilities as $key => $value ) {
													$other_roles = in_array( $value, $other_roles_array, true ) ? 'checked=checked' : '';
													$flag++;
													if ( 0 === $key % 3 ) {
														?>
														<tr>
														<?php
													}
														?>
														<td>
														<input type="checkbox" name="ux_chk_other_capabilities_<?php echo esc_attr( $value ); ?>" id="ux_chk_other_capabilities_<?php echo esc_attr( $value ); ?>" value="<?php echo esc_attr( $value ); ?>" <?php echo esc_attr( $other_roles ); ?>>
														<?php echo esc_attr( $value ); ?>
														</td>
														<?php
														if ( count( $user_capabilities ) === $flag && 1 === $flag % 3 ) {
															?>
															<td>
															</td>
															<td>
															</td>
															<?php
														}
														?>
														<?php
														if ( count( $user_capabilities ) === $flag && 2 === $flag % 3 ) {
															?>
															<td>
															</td>
															<?php
														}
														?>
														<?php
														if ( 0 === $flag % 3 ) {
															?>
														</tr>
														<?php
														}
												}
												?>
											</tbody>
										</table>
										<i class="controls-description"><?php echo esc_attr( $gm_roles_capabilities_other_roles_capabilities_tooltip ); ?></i>
									</div>
									<div class="line-separator"></div>
								</div>
							</div>
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
				</a>
				<?php echo esc_attr( $gallery_master ); ?>
				<span>></span>
			</li>
			<li>
				<span>
				</span>
				<?php echo esc_attr( $gm_roles_and_capabilities ); ?>
			</li>
		</ul>
	</div>
	<div class="row">
		<div class="col-md-12">
			<div class="portlet box vivid-green">
				<div class="portlet-title">
					<div class="caption">
						<i class="icon-custom-users"></i>
						<?php echo esc_attr( $gm_roles_and_capabilities ); ?>
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
