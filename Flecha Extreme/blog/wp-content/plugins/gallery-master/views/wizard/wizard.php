<?php
/**
 * This Template is used for Wizard
 *
 * @author  Tech Banker
 * @package gallery-master/views/wizard
 * @version  2.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly.
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
	} else {
		$gallery_master_check_status = wp_create_nonce( 'gallery_master_check_status' );
		?>
		<html>
			<body>
				<div><div><div>
					<div class="page-container header-wizard">
						<div class="page-content">
							<div class="row row-custom">
								<div class="col-md-12 textalign">
									<p><?php echo esc_attr( __( 'Hi there!', 'gallery-master' ) ); ?></p>
									<p><?php echo esc_attr( __( 'Don\'t ever miss an opportunity to opt in for Email Notifications / Announcements about exciting New Features and Update Releases', 'gallery-master' ) ); ?></p>
									<p><?php echo esc_attr( __( 'Contribute in helping us making our plugin compatible with most plugins and themes by allowing to share non-sensitive information about your website', 'gallery-master' ) ); ?></p>
									<p><?php echo esc_attr( __( 'If you opt in, some data about your usage of Gallery Master Plugin will be sent to our servers for Compatiblity Testing Purposes and email notifications.', 'gallery-master' ) ); ?></p>
								</div>
							</div>
							<div class="row row-custom">
								<div class="col-md-12">
									<div style="padding-left: 40px;">
										<label style="font-size:16px;" class="control-label">
											<?php echo 'Email Address for Notifications'; ?> :
											</label>
											<span id="ux_txt_validation_gdpr_gallery_master" style="display:none;vertical-align:middle;">*</span>
											<input type="text" style="width: 90%;" class="form-control" name="ux_txt_email_address_notifications" id="ux_txt_email_address_notifications" value="">
										</div>
										<div class="textalign">
											<p><?php echo esc_attr( __( "If you're not ready to Opt-In, that's ok too!", 'gallery-master' ) ); ?></p>
											<p><strong><?php echo esc_attr( __( 'Gallery Master will still work fine', 'gallery-master' ) ); ?></strong></p>
										</div>
									</div>
									<div class="col-md-12">
										<a class="permissions" onclick="show_hide_details_gallery_master();"><?php echo esc_attr( __( 'What permissions are being granted?', 'gallery-master' ) ); ?></a>
									</div>
									<div class="col-md-12" style="display:none;" id="ux_div_wizard_set_up">
										<div class="col-md-6">
											<ul>
												<li>
													<i class="dashicons dashicons-admin-users gb-dashicons-admin-users"></i>
													<div class="admin">
														<span><strong><?php echo esc_attr( __( 'User Details', 'gallery-master' ) ); ?></strong></span>
														<p><?php echo esc_attr( __( 'Name and Email Address', 'gallery-master' ) ); ?></p>
													</div>
												</li>
											</ul>
										</div>
										<div class="col-md-6 align align2">
											<ul>
												<li>
													<i class="dashicons dashicons-admin-plugins gb-dashicons-admin-plugins"></i>
													<div class="admin-plugins">
														<span><strong><?php echo esc_attr( __( 'Current Plugin Status', 'gallery-master' ) ); ?></strong></span>
														<p><?php echo esc_attr( __( 'Activation, Deactivation and Uninstall', 'gallery-master' ) ); ?></p>
													</div>
												</li>
											</ul>
										</div>
										<div class="col-md-6">
											<ul>
												<li>
													<i class="dashicons dashicons-testimonial gb-dashicons-testimonial"></i>
													<div class="testimonial">
														<span><strong><?php echo esc_attr( __( 'Notifications', 'gallery-master' ) ); ?></strong></span>
														<p><?php echo esc_attr( __( 'Updates &amp; Announcements', 'gallery-master' ) ); ?></p>
													</div>
												</li>
											</ul>
										</div>
										<div class="col-md-6 align2">
											<ul>
												<li>
													<i class="dashicons dashicons-welcome-view-site gb-dashicons-welcome-view-site"></i>
													<div class="settings">
														<span><strong><?php echo esc_attr( __( 'Website Overview', 'gallery-master' ) ); ?></strong></span>
														<p><?php echo esc_attr( __( 'Site URL, WP Version, PHP Info, Plugins &amp; Themes Info', 'gallery-master' ) ); ?></p>
													</div>
												</li>
											</ul>
										</div>
									</div>
									<div class="col-md-12 allow">
										<div class="tech-banker-actions">
											<a onclick="plugin_stats_gallery_master('opt_in');" class="button button-primary-wizard">
												<strong><?php echo esc_attr( __( 'Opt-In &amp; Continue', 'gallery-master' ) ); ?> </strong>
												<i class="dashicons dashicons-arrow-right-alt gb-dashicons-arrow-right-alt"></i>
											</a>
											<a onclick="plugin_stats_gallery_master('skip');" class="button button-secondary-wizard" tabindex="2">
												<strong><?php echo esc_attr( __( 'Skip &amp; Continue', 'gallery-master' ) ); ?> </strong>
												<i class="dashicons dashicons-arrow-right-alt gb-dashicons-arrow-right-alt"></i>
											</a>
											<div class="clearfix"></div>
										</div>
									</div>
									<div class="col-md-12 terms">
										<a href="https://tech-banker.com/privacy-policy/" target="_blank"><?php echo esc_attr( __( 'Privacy Policy', 'gallery-master' ) ); ?> </a>
										<span> - </span>
										<a href="https://tech-banker.com/terms-and-conditions/" target="_blank"><?php echo esc_attr( __( 'Terms &amp; Conditions', 'gallery-master' ) ); ?></a>
									</div>
								</div>
							</div>
						</div>
					</body>
					</html>
				<?php
	}
}
