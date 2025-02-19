<?php
/**
 * This file is used for displaying dashboard widget.
 *
 * @author   Tech Banker
 * @package  gallery-master/lib
 * @version  4.0.15
 */

	/**
	 * This file is used to get count of gallery data.
	 *
	 * @param string $type passes parameter as type.
	 */
function get_count_of_data_gallery_master( $type ) {
	global $wpdb;
	$gm_total_data_count = $wpdb->get_var(
		$wpdb->prepare(
			'SELECT count(meta_id) FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE meta_key = %s', $type
		)
	);// WPCS: db call ok, cache ok.
	return $gm_total_data_count;
}
?>
<style>
	.gm-statistics-list {
		overflow: hidden;
		margin: 0;
		margin-top: -12px !important;
	}
	.gm-gallery-data,.gm-images-data{
		border-top: 0px !important;
	}
	.gm-statistics-list li a:hover {
		color: #2ea2cc;
	}
	.gm-statistics-list li a {
		display: block;
		color: #aaa;
		padding: 9px 12px;
		-webkit-transition: all ease .5s;
		transition: all ease .5s;
		position: relative;
		font-size: 12px;
	}
	.gm-statistics-list li {
		width: 50%;
		float: left;
		padding: 0;
		box-sizing: border-box;
		margin: 0;
		border-top: 1px solid #ececec;
		color: #aaa;
	}
	.gm-statistics-list li.gm-images-data {
		border-right: 1px solid #ececec;
	}
	.gm-statistics-list li.gm-albums-data {
		border-right: 1px solid #ececec;
	}
	.gm-statistics-list li a strong {
		font-size: 18px;
		line-height: 1.2em;
		font-weight: 400;
		display: block;
		color: #21759b;
	}
	.gm-statistics-list li a::before {
		font-family: WooCommerce;
		speak: none;
		font-weight: 400;
		font-variant: normal;
		text-transform: none;
		line-height: 1;
		-webkit-font-smoothing: antialiased;
		margin: 0;
		text-indent: 0;
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		text-align: center;
		content: "��?";
		font-size: 2em;
		position: relative;
		width: auto;
		line-height: 1.2em;
		color: #464646;
		float: left;
		margin-right: 12px;
		margin-bottom: 12px;
	}
	.gm-statistics-list li.gm-images-data a::before {
		font-family: Dashicons;
		content: "\f128";
	}
	.gm-statistics-list li.gm-gallery-data a::before {
		font-family: Dashicons;
		content: "\f161";
	}
	.gm-statistics-list li.gm-albums-data a::before {
		font-family: Dashicons;
		content: "\f322";
	}
	.gm-statistics-list li.gm-tags-data a::before {
		font-family: Dashicons;
		content: "\f323";
	}

</style>
<ul class="gm-statistics-list">
	<li class="gm-images-data">
		<a href="admin.php?page=gallery_master">
			<strong><?php echo get_count_of_data_gallery_master( 'image_data' ); // WPCS: XSS ok. ?> <?php echo esc_attr( __( 'Images', 'gallery-master' ) ); ?></strong>
		</a>
	</li>
	<li class="gm-gallery-data">
		<a href="admin.php?page=gallery_master">
			<strong><?php echo get_count_of_data_gallery_master( 'gallery_data' ); // WPCS: XSS ok. ?> <?php echo esc_attr( __( 'Galleries', 'gallery-master' ) ); ?></strong>
		</a>
	</li>
	<li class="gm-albums-data">
		<a href="admin.php?page=gm_manage_albums">
			<strong><?php echo get_count_of_data_gallery_master( 'album_data' ); // WPCS: XSS ok. ?> <?php echo esc_attr( __( 'Albums', 'gallery-master' ) ); ?></strong>
		</a>
	</li>
	<li class="gm-tags-data">
		<a href="admin.php?page=gm_manage_tags">
			<strong><?php echo get_count_of_data_gallery_master( 'tag_data' ); // WPCS: XSS ok. ?> <?php echo esc_attr( __( 'Tags', 'gallery-master' ) ); ?></strong>
		</a>
	</li>
</ul>
