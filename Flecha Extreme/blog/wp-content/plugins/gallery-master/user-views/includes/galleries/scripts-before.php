<?php
/**
 * This file is used to call script.
 *
 * @author  Tech Banker
 * @package gallery-master/user-views/includes/galleries
 * @version  2.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
// Exit if accessed directly.
?>
<script type="text/javascript">
	var ajaxurl = "<?php echo esc_attr( admin_url( 'admin-ajax.php' ) ); ?>";
	var global_options_right_click_protection = "<?php echo isset( $global_options_settings['global_options_right_click_protection'] ) ? esc_attr( $global_options_settings['global_options_right_click_protection'] ) : 'disable'; ?>";
	var animation_effect = "<?php echo isset( $animation_effects ) ? esc_attr( $animation_effects ) : 'none'; ?>";

	if (typeof (call_gallery_master_layout_type_<?php echo intval( $random ); ?>) !== "function")
	{
		/**
		* This function is used for Layouts.
		*/
		function call_gallery_master_layout_type_<?php echo intval( $random ); ?>()
		{
			<?php
			if ( isset( $layout_type ) ) {
				switch ( $layout_type ) {
					case 'masonry_layout':
						?>
						if (jQuery(".masonry_grid_layout_container").data('isotope'))
						{
							jQuery(".masonry_grid_layout_container").isotope('destroy');
						}
						jQuery(".masonry_grid_layout_container").imagesLoaded(function ()
						{
							jQuery(".masonry_grid_layout_container").isotope
							({
								itemSelector: ".masonry_grid_wrapper_item",
								layoutMode: 'masonry',
								percentPosition: true
							});
							jQuery(".gm_animate").scrolla_gb();
						});
						<?php
						break;
				}
			}
			?>
		}
	}
	if (typeof (call_gallery_master_lightbox_<?php echo intval( $random ); ?>) !== "function")
	{
		/**
		* This function is used for Lightboxes.
		*
		* @param string lightbox_type .
		*
		*/
		function call_gallery_master_lightbox_<?php echo intval( $random ); ?>(lightbox_type)
		{
			switch (lightbox_type)
			{
				case "foo_box_free_edition":
					<?php
					if ( ! class_exists( 'fooboxV2' ) ) {
						?>
						var showCount_settings = <?php echo isset( $foobox_meta_data['foo_box_show_count'] ) ? esc_attr( $foobox_meta_data['foo_box_show_count'] ) : true; ?>;
						var closeOnOverlayClick = <?php echo isset( $foobox_meta_data['foo_box_close_overlay_click'] ) ? esc_attr( $foobox_meta_data['foo_box_close_overlay_click'] ) : true; ?>;
						var hideScrollbars = <?php echo isset( $foobox_meta_data['foo_box_hide_page_scrollbar'] ) ? esc_attr( $foobox_meta_data['foo_box_hide_page_scrollbar'] ) : true; ?>;
						var onlyShowOnHover = <?php echo isset( $foobox_meta_data['foo_box_show_on_hover'] ) ? esc_attr( $foobox_meta_data['foo_box_show_on_hover'] ) : true; ?>;
						(function (FOOBOX, $)
						{
							FOOBOX.init = function () {
								FOOBOX.o = {
									showCount: showCount_settings,
									closeOnOverlayClick: closeOnOverlayClick,
									hideScrollbars: hideScrollbars,
									captions:
									{
										onlyShowOnHover: onlyShowOnHover,
										overrideTitle: true,
										titleSource: 'anchor',
										overrideDesc: true,
										descSource: 'anchor'
									}
								};
								$(".foobox").foobox(FOOBOX.o);
							};
						}(window.FOOBOX = window.FOOBOX || {}, jQuery));
						jQuery(function ($)
						{
							FOOBOX.init();
						});
						<?php
					}
					?>
					break;
			}
		}
	}
	jQuery(document).ready(function ()
	{
		if (animation_effect !== "none")
		{
			jQuery(".gm_animate").scrolla_gb();
		}
		if (global_options_right_click_protection === "enable") {
			jQuery("#gallery_master_main_container_<?php echo intval( $random ); ?>").on("contextmenu", function (e)
			{
				return false;
			});
		}
		call_gallery_master_layout_type_<?php echo intval( $random ); ?>();
		call_gallery_master_lightbox_<?php echo intval( $random ); ?>("<?php echo esc_attr( $lightbox_type ); ?>");
});
</script>
