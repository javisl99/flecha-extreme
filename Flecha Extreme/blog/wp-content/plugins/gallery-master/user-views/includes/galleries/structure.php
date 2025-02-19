<?php
/**
 * This file is used for frontend layout.
 *
 * @author  Tech Banker
 * @package gallery-master/user-views/includes/galleries
 * @version  2.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
// Exit if accessed directly.
if ( file_exists( GALLERY_MASTER_USER_VIEWS_PATH . 'includes/galleries/queries.php' ) ) {
	include GALLERY_MASTER_USER_VIEWS_PATH . 'includes/galleries/queries.php';
}
?>
<div id="<?php echo intval( $random ); ?>">
	<div id="gallery_master_main_container_<?php echo intval( $random ); ?>" class="gallery_master_main_container">
		<?php
		if ( isset( $layout_type ) ) {
			if ( isset( $gallery_data ) && '' !== $gallery_data ) {
				switch ( esc_attr( $layout_type ) ) {
					case 'thumbnail_layout':
						$gallery_title_html_tag = isset( $thumbnail_layout_settings['thumbnail_layout_gallery_title_html_tag'] ) ? esc_attr( $thumbnail_layout_settings['thumbnail_layout_gallery_title_html_tag'] ) : 'h2';
						$gallery_desc_html_tag  = isset( $thumbnail_layout_settings['thumbnail_layout_gallery_description_html_tag'] ) ? esc_attr( $thumbnail_layout_settings['thumbnail_layout_gallery_description_html_tag'] ) : 'h3';
						break;
					case 'masonry_layout':
						$gallery_title_html_tag = isset( $masonry_layout_settings['masonry_layout_gallery_title_html_tag'] ) ? esc_attr( $masonry_layout_settings['masonry_layout_gallery_title_html_tag'] ) : 'h2';
						$gallery_desc_html_tag  = isset( $masonry_layout_settings['masonry_layout_gallery_description_html_tag'] ) ? esc_attr( $masonry_layout_settings['masonry_layout_gallery_description_html_tag'] ) : 'h3';
						break;
				}
				if ( isset( $lightbox_type ) ) {
					switch ( esc_attr( $lightbox_type ) ) {
						case 'foo_box_free_edition':
							if ( ! class_exists( 'fooboxV2' ) ) {
								wp_enqueue_style( 'foobox.free.min.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'user-views/assets/lightboxes/foobox/css/foobox.free.min.css' );
								wp_enqueue_style( 'foobox.noie7.min.css', GALLERY_MASTER_PLUGIN_DIR_URL . 'user-views/assets/lightboxes/foobox/css/foobox.noie7.min.css' );
								wp_enqueue_script( 'foobox.free.min.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'user-views/assets/lightboxes/foobox/js/foobox.free.min.js' );
							}
							break;
					}
				}
				if ( file_exists( GALLERY_MASTER_USER_VIEWS_PATH . 'includes/galleries/translations.php' ) ) {
					include GALLERY_MASTER_USER_VIEWS_PATH . 'includes/galleries/translations.php';
				}
				if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/includes/galleries/style-sheet.php' ) ) {
					include GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/includes/galleries/style-sheet.php';
				}
				if ( 'show' === $gallery_title && '' !== $display_gallery_data['gallery_title'] ) {
					?>
					<div id="gallery_title_container_<?php echo intval( $random ); ?>" class="gallery_title_container">
						<<?php echo esc_attr( $gallery_title_html_tag ); ?>>
							<?php echo isset( $display_gallery_data['gallery_title'] ) ? esc_attr( $display_gallery_data['gallery_title'] ) : ''; ?>
						</<?php echo esc_attr( $gallery_title_html_tag ); ?>>
					</div>
					<?php
				}
				if ( 'show' === $gallery_description && '' !== $display_gallery_data['gallery_description'] ) {
					?>
					<div id="gallery_desc_container_<?php echo intval( $random ); ?>" class="gallery_desc_container">
						<<?php echo esc_attr( $gallery_desc_html_tag ); ?>>
							<?php echo isset( $display_gallery_data['gallery_description'] ) ? htmlspecialchars_decode( $display_gallery_data['gallery_description'] ) : '';// WPCS: XSS ok. ?>
						</<?php echo esc_attr( $gallery_desc_html_tag ); ?>>
					</div>
					<?php
				}
				if ( file_exists( GALLERY_MASTER_USER_VIEWS_PATH . 'includes/galleries/common-options.php' ) ) {
					include GALLERY_MASTER_USER_VIEWS_PATH . 'includes/galleries/common-options.php';
				}
				if ( file_exists( GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/includes/galleries/scripts-before.php' ) ) {
					include GALLERY_MASTER_PLUGIN_DIR_PATH . 'user-views/includes/galleries/scripts-before.php';
				}
				?>
				<div id="grid_layout_container_<?php echo intval( $random ); ?>">
				<?php
				switch ( esc_attr( $layout_type ) ) {
					case 'thumbnail_layout':
						if ( file_exists( GALLERY_MASTER_USER_VIEWS_PATH . 'layouts/thumbnail-layout/thumbnail-layout.php' ) ) {
							include GALLERY_MASTER_USER_VIEWS_PATH . 'layouts/thumbnail-layout/thumbnail-layout.php';
						}
						break;

					case 'masonry_layout':
						if ( file_exists( GALLERY_MASTER_USER_VIEWS_PATH . 'layouts/masonry-layout/masonry-layout.php' ) ) {
							include GALLERY_MASTER_USER_VIEWS_PATH . 'layouts/masonry-layout/masonry-layout.php';
						}
						wp_enqueue_script( 'imageloaded.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'user-views/assets/layouts/isotope-master/imageloaded.js' );
						wp_enqueue_script( 'isotope.js', GALLERY_MASTER_PLUGIN_DIR_URL . 'user-views/assets/layouts/isotope-master/isotope.js' );
						break;
				}
			}
		}
		?>
		</div>
	</div>
</div>
<?php
