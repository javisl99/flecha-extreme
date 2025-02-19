<?php
/**
 * This file is used for displaying sidebar menus.
 *
 * @author   Tech Banker
 * @package  gallery-master/includes
 * @version   2.0.0
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
		?>
		<div class='page-sidebar-wrapper-tech-banker'>
			<div class='page-sidebar-tech-banker navbar-collapse collapse'>
				<div class='sidebar-menu-tech-banker'>
					<ul class='page-sidebar-menu-tech-banker' data-slide-speed='200'>
						<div class='sidebar-search-wrapper' style='padding:20px;text-align:center'>
							<a class='plugin-logo' href='<?php echo esc_attr( TECH_BANKER_GALLERY_URL ); ?>' target='_blank'>
								<img src='<?php echo esc_attr( GALLERY_MASTER_PLUGIN_DIR_URL ) . 'assets/global/img/logo.png'; ?>'/>
							</a>
						</div>
						<li id='ux_li_galleries'>
							<a href='javascript:;'>
								<i class='icon-custom-picture'></i>
								<span class='title'>
									<?php echo esc_attr( $gm_galleries ); ?>
								</span>
							</a>
							<ul class='sub-menu'>
								<li id='ux_li_manage_galleries'>
									<a href='admin.php?page=gallery_master'>
										<i class='icon-custom-picture'></i>
										<?php echo esc_attr( $gm_manage_galleries ); ?>
									</a>
								</li>
								<li id='ux_li_add_galleries'>
									<a href='javascript:;' onclick='get_gallery_id_gallery_master();'>
										<i class='icon-custom-plus'></i>
										<?php echo esc_attr( $gm_add_gallery ); ?>
									</a>
								</li>
								<li id='ux_li_sort_galleries'>
									<a href='admin.php?page=gm_sort_galleries'>
										<i class='icon-custom-list'></i>
										<?php echo esc_attr( $gm_sort_galleries ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
							</ul>
						</li>
						<li id='ux_li_album'>
							<a href='javascript:;'>
								<i class='icon-custom-folder'></i>
								<span class='title'>
									<?php echo esc_attr( $gm_albums ); ?>
								</span>
							</a>
							<ul class='sub-menu'>
								<li id='ux_li_manage_albums'>
									<a href='admin.php?page=gm_manage_albums'>
										<i class='icon-custom-folder'></i>
										<?php echo esc_attr( $gm_manage_albums ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_add_album'>
									<a href='admin.php?page=gm_add_album'>
										<i class='icon-custom-plus'></i>
										<?php echo esc_attr( $gm_add_album ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_sort_albums'>
									<a href='admin.php?page=gm_sort_albums'>
										<i class='icon-custom-list'></i>
										<?php echo esc_attr( $gm_sort_albums ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
							</ul>
						</li>
						<li id='ux_li_tags'>
							<a href='javascript:;'>
								<i class='icon-custom-tag'></i>
								<span class='title'>
									<?php echo esc_attr( $gm_tags ); ?>
								</span>
							</a>
							<ul class='sub-menu'>
								<li id='ux_li_manage_tags'>
									<a href='admin.php?page=gm_manage_tags'>
										<i class='icon-custom-tag'></i>
										<?php echo esc_attr( $gm_manage_tags ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_add_tag'>
									<a href='admin.php?page=gm_add_tag'>
										<i class='icon-custom-plus'></i>
										<?php echo esc_attr( $gm_add_tag ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
							</ul>
						</li>
						<li id='ux_li_layout_settings'>
							<a href='javascript:;'>
								<i class='icon-custom-settings'></i>
								<span class='title'>
									<?php echo esc_attr( $gm_layout_settings ); ?>
								</span>
							</a>
							<ul class='sub-menu'>
								<li id='ux_li_thumbnail_layout'>
									<a href='admin.php?page=gm_thumbnail_layout'>
										<i class='icon-custom-screen-tablet'></i>
										<?php echo esc_attr( $gm_thumbnail_layout ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_masonry_layout'>
									<a href='admin.php?page=gm_masonry_layout'>
										<i class='icon-custom-energy'></i>
										<?php echo esc_attr( $gm_masonry_layout ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_slideshow_layout'>
									<a href='admin.php?page=gm_slideshow_layout'>
										<i class='icon-custom-control-play'></i>
										<?php echo esc_attr( $gm_slideshow_layout ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_image_browser_layout'>
									<a href='admin.php?page=gm_image_browser_layout'>
										<i class='icon-custom-feed'></i>
										<?php echo esc_attr( $gm_image_browser_layout ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_justified_grid_layout'>
									<a href='admin.php?page=gm_justified_grid_layout'>
										<i class='icon-custom-grid'></i>
										<?php echo esc_attr( $gm_justified_grid_layout ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_blog_style_layout'>
									<a href='admin.php?page=gm_blog_style_layout'>
										<i class='icon-custom-bubble'></i>
										<?php echo esc_attr( $gm_blog_style_layout ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_compact_album_layout'>
									<a href='admin.php?page=gm_compact_album_layout'>
										<i class='icon-custom-bubbles'></i>
										<?php echo esc_attr( $gm_compact_album_layout ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_extended_album_layout'>
									<a href='admin.php?page=gm_extended_album_layout'>
										<i class='icon-custom-diamond'></i>
										<?php echo esc_attr( $gm_extended_album_layout ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_custom_css'>
									<a href='admin.php?page=gm_custom_css'>
										<i class='icon-custom-pencil'></i>
										<?php echo esc_attr( $gm_custom_css ); ?>
									</a>
								</li>
							</ul>
						</li>
						<li id='ux_li_lightboxes'>
							<a href='javascript:;'>
								<i class='icon-custom-frame'></i>
								<span class='title'>
									<?php echo esc_attr( $gm_lightboxes ); ?>
								</span>
							</a>
							<ul class = 'sub-menu'>
								<li id='ux_li_gm_lightcase'>
									<a href='admin.php?page=gm_lightcase'>
										<i class='icon-custom-magnet'></i>
										<?php echo esc_attr( $gm_lightcase ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_fancy_box'>
									<a href='admin.php?page=gm_fancy_box'>
										<i class='icon-custom-social-dropbox'></i>
										<?php echo esc_attr( $gm_fancy_box ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_color_box'>
									<a href='admin.php?page=gm_color_box'>
										<i class='icon-custom-magic-wand'></i>
										<?php echo esc_attr( $gm_color_box ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_foo_box_free_edition'>
									<a href='admin.php?page=gm_foo_box_free_edition'>
										<i class='icon-custom-frame'></i>
										<?php echo class_exists( 'fooboxV2' ) ? esc_attr( $gm_foo_box_premium ) : esc_attr( $gm_foo_box_free_edition ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_nivo_light_box'>
									<a href='admin.php?page=gm_nivo_lightbox'>
										<i class='icon-custom-paper-plane'></i>
										<?php echo esc_attr( $gm_nivo_lightbox ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
							</ul>
						</li>
						<li id='ux_li_general_settings'>
							<a href='javascript:;'>
								<i class='icon-custom-wrench'></i>
								<span class='title'>
									<?php echo esc_attr( $gm_general_settings ); ?>
								</span>
							</a>
							<ul class='sub-menu'>
								<li id='ux_li_global_options'>
									<a href='admin.php?page=gm_global_options'>
										<i class='icon-custom-globe'></i>
										<?php echo esc_attr( $gm_global_options ); ?>
									</a>
								</li>
								<li id='ux_li_lazyload_settings'>
									<a href='admin.php?page=gm_lazy_load_settings'>
										<i class='icon-custom-reload'></i>
										<?php echo esc_attr( $gm_lazy_load_settings ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_filter_settings'>
									<a href='admin.php?page=gm_filter_settings'>
										<i class='icon-custom-hourglass'></i>
										<?php echo esc_attr( $gm_filter_settings ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_orderby_settings'>
									<a href='admin.php?page=gm_order_by_settings'>
										<i class='icon-custom-check'></i>
										<?php echo esc_attr( $gm_order_by_settings ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_searchbox_settings'>
									<a href='admin.php?page=gm_search_box_settings'>
										<i class='icon-custom-magnifier'></i>
										<?php echo esc_attr( $gm_search_box_settings ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_page_navigation'>
									<a href='admin.php?page=gm_page_navigation'>
										<i class='icon-custom-arrow-right'></i>
										<?php echo esc_attr( $gm_page_navigation ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_watermark_settings'>
									<a href='admin.php?page=gm_watermark_settings'>
										<i class='icon-custom-note'></i>
										<?php echo esc_attr( $gm_watermark_settings ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
								<li id='ux_li_advertisement'>
									<a href='admin.php?page=gm_advertisement'>
										<i class='icon-custom-volume-2'></i>
										<?php echo esc_attr( $gm_advertisement ); ?>
											<span class="badge">Pro</span>
									</a>
								</li>
							</ul>
						</li>
						<li id='ux_li_shortcode_generator'>
							<a href='admin.php?page=gm_shortcodes'>
								<i class='icon-custom-rocket'></i>
								<span class='title'>
									<?php echo esc_attr( $gm_shortcode_generator ); ?>
								</span>
							</a>
						</li>
						<li id='ux_li_other_setting'>
							<a href='admin.php?page=gm_other_settings'>
								<i class='icon-custom-wrench'></i>
								<?php echo esc_attr( $gm_other_setting ); ?>
							</a>
						</li>
						<li id='ux_li_roles_capabilities'>
							<a href='admin.php?page=gm_roles_and_capabilities'>
								<i class='icon-custom-users'></i>
								<?php echo esc_attr( $gm_roles_and_capabilities ); ?>
								<span class="badge">Pro</span>
							</a>
						</li>
						<li id="ux_li_support_features">
								<a href='https://wordpress.org/support/plugin/gallery-master' target='_blank'>
									<i class='icon-custom-users'></i>
									<span class='title'>
										<?php echo esc_attr( $gm_feature_requests ); ?>
									</span>
								</a>
						</li>
						<li id='ux_li_system_information'>
							<a href='admin.php?page=gm_system_information'>
								<i class='icon-custom-screen-desktop'></i>
								<span class='title'>
									<?php echo esc_attr( $gm_system_information ); ?>
								</span>
							</a>
						</li>
						<li id='ux_li_pricing_plans'>
							<a href='https://tech-banker.com/gallery-master/pricing/' target='_blank'>
								<i class='icon-custom-key'></i>
								<span class='title'>
									<strong style='color:yellow;'>
									<?php echo esc_attr( $gm_premium_edition ); ?>
							</strong>
							</span>
							</a>
				</li>
					</ul>
				</div>
			</div>
			</div>
			<div class='page-content-wrapper'>
			<div class='page-content'>
			<?php
	}
}
