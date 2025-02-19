<?php
/**
 * This file is used to add metabox in case of Gutenberg Editor.
 *
 * @package gallery-master/lib
 */

/**
 * This function is used to get unserialized data.
 *
 * @param string $type .
 * @param string $meta_key .
 */
function get_unserialize_data_gallery_master( $type, $meta_key ) {
	global $wpdb;
	$manage_data               = $wpdb->get_results(
		$wpdb->prepare(
			'SELECT * FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE ' . $type . ' ORDER BY meta_id DESC',
			$meta_key
		)
	);// WPCS: PreparedSQLPlaceholders replacement count ok,db call ok; no-cache ok, unprepared SQL OK.
	$unserialize_complete_data = array();
	foreach ( $manage_data as $value ) {
		$unserialize_data            = maybe_unserialize( $value->meta_value );
		$unserialize_data['id']      = $value->id;
		$unserialize_data['meta_id'] = $value->meta_id;
		array_push( $unserialize_complete_data, $unserialize_data );
	}
	return $unserialize_complete_data;
}

/**
 * This function is used to return the unserialized data.
 *
 * @param string $type .
 * @param string $meta_key .
 */
function get_unserialize_gallery_data_gallery_master( $type, $meta_key ) {
	global $wpdb;
	$manage_data                       = $wpdb->get_results(
		$wpdb->prepare(
			'SELECT * FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE ' . $type . ' ORDER BY meta_id DESC',
			$meta_key
		)
	);// WPCS: PreparedSQLPlaceholders replacement count ok,db call ok; no-cache ok, unprepared SQL OK.
	$unserialize_complete_gallery_data = array();
	foreach ( $manage_data as $value ) {
		$unserialize_data            = maybe_unserialize( $value->meta_value );
		$unserialize_data['id']      = $value->id;
		$unserialize_data['meta_id'] = $value->old_gallery_id;
		array_push( $unserialize_complete_gallery_data, $unserialize_data );
	}
	return $unserialize_complete_gallery_data;
}

/**
 * This function is used to get meta value.
 *
 * @param string $meta_key .
 */
function get_meta_value_gallery_master( $meta_key ) {
	global $wpdb;
	$meta_value = $wpdb->get_var(
		$wpdb->prepare(
			'SELECT meta_value FROM ' . $wpdb->prefix . 'gallery_master_meta WHERE meta_key = %s',
			$meta_key
		)
	);// WPCS: db call ok; no-cache ok.
	return maybe_unserialize( $meta_value );
}
$global_options_get_data         = get_meta_value_gallery_master( 'global_options_settings' );
$image_dimensions                = isset( $global_options_get_data['global_options_generated_image_dimensions'] ) ? explode( ',', $global_options_get_data['global_options_generated_image_dimensions'] ) : array( '1600', '900' );
$thumbnail_layout_get_data       = get_unserialize_gallery_data_gallery_master( 'meta_key = %s', 'gallery_data' );
$thumbnail_layout_get_album_data = get_unserialize_data_gallery_master( 'meta_key = %s', 'album_data' );

?>
<style>
.col-md-6 {
	width: 46% !important;
	}
</style>
<div class="form-body">
	<div class="row">
		<div class="col-md-6">
			<div class="form-group">
				<label class="control-label">
					<?php echo esc_attr( $gm_choose_type ); ?> :
					<span class="required" aria-required="true">*</span>
				</label>
				<select id="ux_ddl_choose_type" name="ux_ddl_choose_type" class="form-control" onchange="shortcode_source_type_control_gallery_master('ux_ddl_choose_type', 'ux_div_gallery', 'ux_div_album', 'ux_album_title_description_div');">
					<option value="gallery"><?php echo esc_attr( $gm_gallery ); ?></option>
					<option value="album" style="color:red;"><?php echo esc_attr( $gm_album ) . ' ( ' . esc_attr( $gm_premium_edition ) . ' )'; ?></option>
				</select>
				<i class="controls-description"><?php echo esc_attr( $gm_choose_type_tooltip ); ?></i>
			</div>
		</div>
		<div class="col-md-6">
			<div class="form-group" id="ux_div_gallery">
				<label class="control-label">
					<?php echo esc_attr( $gm_choose_gallery_title ); ?> :
					<span class="required" aria-required="true">*</span>
				</label>
				<select id="ux_ddl_choose_gallery" name="ux_ddl_choose_gallery" class="form-control" >
					<option value=""><?php echo esc_attr( $gm_choose_gallery_title ); ?></option>
					<?php
					foreach ( $thumbnail_layout_get_data as $value ) {
						?>
						<option value="<?php echo intval( $value['meta_id'] ); ?>"><?php echo isset( $value['gallery_title'] ) && '' !== $value['gallery_title'] ? esc_attr( $value['gallery_title'] ) : esc_attr( $gm_untitled ); ?></option>
						<?php
					}
					?>
				</select>
				<i class="controls-description"><?php echo esc_attr( $gm_choose_gallery_tooltip ); ?></i>
			</div>
			<div class="form-group" id="ux_div_album">
				<label class="control-label">
					<?php echo esc_attr( $gm_choose_album_title ); ?> :
					<span class="required" aria-required="true">*</span>
				</label>
				<select id="ux_ddl_choose_album" name="ux_ddl_choose_album" class="form-control" >
					<option value=""><?php echo esc_attr( $gm_choose_album_title ); ?></option>
					<?php
					foreach ( $thumbnail_layout_get_album_data as $value ) {
						?>
						<option value="<?php echo intval( $value['meta_id'] ); ?>"><?php echo isset( $value['album_name'] ) && '' !== $value['album_name'] ? esc_attr( $value['album_name'] ) : esc_attr( $gm_untitled_album ); ?></option>
						<?php
					}
					?>
				</select>
				<i class="controls-description"><?php echo esc_attr( $gm_choose_album_tooltip ); ?></i>
			</div>
		</div>
	</div>
	<div id="ux_div_album_type">
		<div class="form-group">
			<label class="control-label">
				<?php echo esc_attr( $gm_choose_album_type ); ?> :
				<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
			</label>
			<select id="ux_ddl_choose_album_type" name="ux_ddl_choose_album_type" class="form-control" >
				<option value="compact_album"><?php echo esc_attr( $gm_album_compact ); ?></option>
				<option value="extended_album"><?php echo esc_attr( $gm_album_extended ); ?></option>
			</select>
			<i class="controls-description"><?php echo esc_attr( $gm_choose_album_type_tooltip ); ?></i>
		</div>
		<div class="row">
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_sort_albums_title ); ?> :
						<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
					</label>
					<select name="ux_ddl_sort_albums_by" id="ux_ddl_sort_albums_by" class="form-control" >
						<option value="album_title"><?php echo esc_attr( $gm_title ); ?></option>
						<option value="upload_date"><?php echo esc_attr( $gm_date ); ?></option>
						<option value="album_name"><?php echo esc_attr( $gm_filename ); ?></option>
						<option value="file_type"><?php echo esc_attr( $gm_type ); ?></option>
						<option value="sort_order" selected="selected"><?php echo esc_attr( $gm_custom_order ); ?></option>
						<option value="random_order"><?php echo esc_attr( $gm_random_order ); ?></option>
					</select>
					<i class="controls-description"><?php echo esc_attr( $gm_sort_albums_tooltip ); ?></i>
				</div>
			</div>
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_order_albums_by_title ); ?> :
						<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
					</label>
					<select name="ux_ddl_order_albums" id="ux_ddl_order_albums" class="form-control" >
						<option value="sort_asc"><?php echo esc_attr( $gm_ascending ); ?></option>
						<option value="sort_desc"><?php echo esc_attr( $gm_descending ); ?></option>
					</select>
					<i class="controls-description"><?php echo esc_attr( $gm_order_albums_by_tooltip ); ?></i>
				</div>
			</div>
		</div>
	</div>
	<div class="form-group">
		<label class="control-label">
			<?php echo esc_attr( $gm_choose_layout ); ?> :
			<span class="required" aria-required="true">*</span>
		</label>
		<select id="ux_ddl_layout_type" name="ux_ddl_layout_type" class="form-control" onchange="show_hide_layout_changes_gallery_master();">
			<option value="thumbnail_layout"><?php echo esc_attr( $gm_thumbnail_layout ); ?></option>
			<option value="masonary_layout"><?php echo esc_attr( $gm_masonry_layout ); ?></option>
			<option value="slideshow_layout" style="color:red;" disabled='disabled'><?php echo esc_attr( $gm_slideshow_layout ) . ' ( ' . esc_attr( $gm_premium_edition ) . ' )'; ?></option>
			<option value="image_browser_layout" style="color:red;" disabled='disabled'><?php echo esc_attr( $gm_image_browser_layout ) . ' ( ' . esc_attr( $gm_premium_edition ) . ' )'; ?></option>
			<option value="justified_grid_layout" style="color:red;" disabled='disabled'><?php echo esc_attr( $gm_justified_grid_layout ) . ' ( ' . esc_attr( $gm_premium_edition ) . ' )'; ?></option>
			<option value="blog_style_layout" style="color:red;" disabled='disabled'><?php echo esc_attr( $gm_blog_style_layout ) . ' ( ' . esc_attr( $gm_premium_edition ) . ' )'; ?></option>
		</select>
		<i class="controls-description"><?php echo esc_attr( $gm_choose_layout_tooltip ); ?></i>
	</div>
	<div id="ux_div_image_browser_layout" style="display: none;">
		<div class="row">
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_image_browser_layout_image_browser_title ); ?> :
						<span class="required" aria-required="true">*</span>
					</label>
					<div class= "input-icon right">
						<input type="text" class="form-control custom-input-medium input-inline" name="ux_txt_width" id="ux_txt_width" value="800" maxlength="4" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" onblur="set_thumbnail_dimension_in_shortcode_gallery_master(this,<?php echo intval( $image_dimensions[0] ); ?>, '<?php echo esc_attr( $gm_shortcode_image_dimensions_exceed_msg ); ?>');" placeholder="<?php echo esc_attr( $gm_max_width_placeholder ); ?>">
						<input type="text" class="form-control custom-input-medium input-inline" name="ux_txt_height" id="ux_txt_height" value="500" maxlength="4" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);"  onblur="set_thumbnail_dimension_in_shortcode_gallery_master(this,<?php echo intval( $image_dimensions[1] ); ?>, '<?php echo esc_attr( $gm_shortcode_image_dimensions_exceed_msg ); ?>');" placeholder="<?php echo esc_attr( $gm_max_height_placeholder ); ?>">
					</div>
					<i class="controls-description"><?php echo esc_attr( $gm_image_browser_layout_image_browser_tooltip ); ?></i>
				</div>
			</div>
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_button_text ); ?> :
						<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
					</label>
					<select name="ux_ddl_button_text" id="ux_ddl_button_text" class="form-control" >
						<option value="text"><?php echo esc_attr( $gm_text ); ?></option>
						<option value="arrow"><?php echo esc_attr( $gm_page_navigation_arrow ); ?></option>
					</select>
					<i class="controls-description"><?php echo esc_attr( $gm_page_navigation_button_text_tooltip ); ?></i>
				</div>
			</div>
		</div>
	</div>
	<div id="ux_div_justified_layout" style="display: none;">
		<div class="form-group">
			<label class="control-label">
				<?php echo esc_attr( $gm_justified_grid_shortcode_row_height ); ?> :
				<span class="required" aria-required="true">*</span>
			</label>
			<div class="input-icon right">
				<input type="text" class="form-control input-inline" name="ux_txt_row_height" id="ux_txt_row_height" placeholder="<?php echo esc_attr( $gm_justified_grid_shortcode_row_height ); ?>"  maxlength="3" onkeypress="digits_with_dot_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" onblur="default_value_gallery_master('#ux_txt_row_height', 150);" value="150">
			</div>
			<i class="controls-description"><?php echo esc_attr( $gm_justified_grid_shortcode_row_height_tooltip ); ?></i>
		</div>
	</div>
	<div id="ux_div_blog_style_layout" style="display: none;">
		<div class="form-group">
			<label class="control-label">
				<?php echo esc_attr( $gm_blog_style_layout_blog_width_title ); ?> :
				<span class="required" aria-required="true">*</span>
			</label>
			<input type="text" class="form-control" name="ux_txt_blog_style_thumbnail_width" id="ux_txt_blog_style_thumbnail_width" value="500" maxlength="4" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" onblur="set_thumbnail_dimension_in_shortcode(this,<?php echo intval( $image_dimensions[0] ); ?>, '<?php echo esc_attr( $gm_shortcode_blog_width_exceed_msg ); ?>');" placeholder="<?php echo esc_attr( $gm_max_width_placeholder ); ?>">
			<i class="controls-description"><?php echo esc_attr( $gm_blog_style_layout_blog_width_tooltip ); ?></i>
		</div>
	</div>
	<div id="ux_div_sldeshow_layout" style="display: none;">
		<div class="row">
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_slideshow_layout_shortcode_slideshow_width ); ?> :
						<span class="required" aria-required="true">*</span>
					</label>
					<div class="input-icon right">
						<input type="text" class="form-control input-inline" name="ux_txt_slideshow_width" id="ux_txt_slideshow_width" placeholder="<?php echo esc_attr( $gm_width_placeholder ); ?>" onblur="set_thumbnail_dimension_in_shortcode(this,<?php echo intval( $image_dimensions[0] ); ?>, '<?php echo esc_attr( $gm_shortcode_slideshow_width_exceed_msg ); ?>');" maxlength="4" onkeypress="digits_with_dot_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" value="800">
					</div>
					<i class="controls-description"><?php echo esc_attr( $gm_slideshow_layout_shortcode_slideshow_tooltip ); ?></i>
				</div>
			</div>
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_slideshow_layout_slideshow_flimstrips_title ); ?> :
						<span class="required" aria-required="true">*</span>
					</label>
					<select name="ux_ddl_filmstrips" id="ux_ddl_filmstrips" class="form-control" >
						<option value="show"><?php echo esc_attr( $gm_show ); ?></option>
						<option value="hide"><?php echo esc_attr( $gm_hide ); ?></option>
					</select>
					<i class="controls-description"><?php echo esc_attr( $gm_display_control_tooltip ); ?></i>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_slideshow_layout_control_button_title ); ?> :
						<span class="required" aria-required="true">*</span>
					</label>
					<select name="ux_ddl_control_button" id="ux_ddl_control_button" class="form-control" >
						<option value="show"><?php echo esc_attr( $gm_show ); ?></option>
						<option value="hide"><?php echo esc_attr( $gm_hide ); ?></option>
					</select>
					<i class="controls-description"><?php echo esc_attr( $gm_display_control_tooltip ); ?></i>
				</div>
			</div>
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_autoplay_title ); ?> :
						<span class="required" aria-required="true">*</span>
					</label>
					<select id="ux_ddl_autoplay" name="ux_ddl_autoplay" class="form-control" >
						<option value="yes" selected><?php echo esc_attr( $gm_yes ); ?></option>
						<option value="no"><?php echo esc_attr( $gm_no ); ?></option>
					</select>
					<i class="controls-description"><?php echo esc_attr( $gm_autoplay_tooltip ); ?></i>
				</div>
			</div>
		</div>
		<div id="ux_div_time_interval">
			<div class="form-group">
				<label class="control-label">
					<?php echo esc_attr( $gm_time_interval_title ); ?> :
					<span class="required" aria-required="true">*</span>
				</label>
				<input type="text" class="form-control" name="ux_txt_time_interval" id="ux_txt_time_interval" value="5" maxlength="3" onkeypress="only_digits_gallery_master(event);" onblur="default_value_gallery_master('#ux_txt_time_interval', 5);" onfocus="paste_prevent_gallery_master(this.id);" placeholder="<?php echo esc_attr( $gm_time_interval_title ); ?>">
				<i class="controls-description"><?php echo esc_attr( $gm_time_interval_tooltip ); ?></i>
			</div>
		</div>
	</div>
	<div class="row">
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_alignment_title ); ?> :
						<span class="required" aria-required="true">*</span>
					</label>
					<div class="input-icon right">
						<select name="ux_ddl_alignment" id="ux_ddl_alignment" class="form-control" >
							<option value="left"><?php echo esc_attr( $gm_left ); ?></option>
							<option value="center"><?php echo esc_attr( $gm_center ); ?></option>
							<option value="right"><?php echo esc_attr( $gm_right ); ?></option>
						</select>
					</div>
					<i class="controls-description"><?php echo esc_attr( $gm_text_alignment_tooltip ); ?></i>
				</div>
			</div>
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_no_of_columns_title ); ?> :
						<span class="required" aria-required="true">*</span>
					</label>
					<input type="text" class="form-control" name="ux_txt_columns" id="ux_txt_columns" value="4" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" onblur="default_value_gallery_master('#ux_txt_columns', 4);" placeholder="<?php echo esc_attr( $gm_no_of_columns_tooltip ); ?>">
					<i class="controls-description"><?php echo esc_attr( $gm_no_of_columns_tooltip ); ?></i>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col-md-6" id="ux_div_lightbox_type">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_lightbox_type_title ); ?> :
						<span class="required" aria-required="true">*</span>
					</label>
					<div class="input-icon right">
						<select name="ux_ddl_lightbox_type" id="ux_ddl_lightbox_type" class="form-control" >
							<option value="no_lightbox"><?php echo esc_attr( $gm_no_light_box ); ?></option>
							<option selected="selected" value="lightcase" style="color:red;" disabled='disabled'><?php echo esc_attr( $gm_lightcase ) . ' ( ' . esc_attr( $gm_premium_edition ) . ' )'; ?></option>
							<option value="fancy_box" style="color:red;" disabled='disabled'><?php echo esc_attr( $gm_fancy_box ) . ' ( ' . esc_attr( $gm_premium_edition ) . ' )'; ?></option>
							<option value="color_box" style="color:red;" disabled='disabled'><?php echo esc_attr( $gm_color_box ) . ' ( ' . esc_attr( $gm_premium_edition ) . ' )'; ?></option>
							<option value="foo_box_free_edition" selected="selected"><?php echo class_exists( 'fooboxV2' ) ? esc_attr( $gm_foo_box_premium ) : esc_attr( $gm_foo_box_free_edition ); ?></option>
							<option value="nivo_lightbox" style="color:red;" disabled='disabled'><?php echo esc_attr( $gm_nivo_lightbox ) . ' ( ' . esc_attr( $gm_premium_edition ) . ' )'; ?></option>
						</select>
					</div>
					<i class="controls-description"><?php echo esc_attr( $gm_lightbox_type_tooltip ); ?></i>
				</div>
			</div>
			<div class="col-md-6" id="ux_div_page_navigation">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_page_navigation ); ?> :
						<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
					</label>
					<select name="ux_ddl_page_navigation" id="ux_ddl_page_navigation" class="form-control" onchange="show_hide_control_gallery_master('ux_ddl_page_navigation', 'ux_div_no_of_images');">
						<option value="disable"><?php echo esc_attr( $gm_disable ); ?></option>
						<option value="enable" disabled='disabled'><?php echo esc_attr( $gm_enable ); ?></option>
					</select>
					<i class="controls-description"><?php echo esc_attr( $gm_page_navigation_galleries_title ); ?></i>
				</div>
			</div>
		</div>
		<div class="form-group" id="ux_div_no_of_images" style="display:none;">
			<label class="control-label">
				<?php echo esc_attr( $gm_no_of_image_per_page_title ); ?> :
				<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
			</label>
			<input type="text" class="form-control" name="ux_txt_images_per_page" id="ux_txt_images_per_page" value="10" maxlength="3" onkeypress="only_digits_gallery_master(event);" onfocus="paste_prevent_gallery_master(this.id);" onblur="default_value_gallery_master('#ux_txt_images_per_page', 10);" placeholder="<?php echo esc_attr( $gm_no_of_image_per_page_placeholder ); ?>">
			<i class="controls-description"><?php echo esc_attr( $gm_no_of_image_per_page_tooltip ); ?></i>
		</div>
		<div class="row" id="ux_album_title_description_div">
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_album_title ); ?> :
						<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
					</label>
					<select id="ux_ddl_album_title" name="ux_ddl_album_title" class="form-control" >
						<option value="show"><?php echo esc_attr( $gm_show ); ?></option>
						<option value="hide"><?php echo esc_attr( $gm_hide ); ?></option>
					</select>
					<i class="controls-description"><?php echo esc_attr( $gm_display_control_tooltip ); ?></i>
				</div>
			</div>
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_album_description ); ?> :
						<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
					</label>
					<div class="input-icon right">
						<select name="ux_ddl_album_description" id="ux_ddl_album_description" class="form-control" >
							<option value="show"><?php echo esc_attr( $gm_show ); ?></option>
							<option value="hide"><?php echo esc_attr( $gm_hide ); ?></option>
						</select>
					</div>
					<i class="controls-description"><?php echo esc_attr( $gm_display_control_tooltip ); ?></i>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_gallery_title ); ?> :
						<span class="required" aria-required="true">*</span>
					</label>
					<select id="ux_ddl_gallery_title" name="ux_ddl_gallery_title" class="form-control" >
						<option value="show"><?php echo esc_attr( $gm_show ); ?></option>
						<option value="hide"><?php echo esc_attr( $gm_hide ); ?></option>
					</select>
					<i class="controls-description"><?php echo esc_attr( $gm_display_control_tooltip ); ?></i>
				</div>
			</div>
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_gallery_description_title ); ?> :
						<span class="required" aria-required="true">*</span>
					</label>
					<div class="input-icon right">
						<select name="ux_ddl_gallery_description" id="ux_ddl_gallery_description" class="form-control" >
							<option value="show"><?php echo esc_attr( $gm_show ); ?></option>
							<option value="hide"><?php echo esc_attr( $gm_hide ); ?></option>
						</select>
					</div>
					<i class="controls-description"><?php echo esc_attr( $gm_display_control_tooltip ); ?></i>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_thumbnail_title ); ?> :
						<span class="required" aria-required="true">*</span>
					</label>
					<select id="ux_ddl_thumbnail_title" name="ux_ddl_thumbnail_title" class="form-control" >
						<option value="show"><?php echo esc_attr( $gm_show ); ?></option>
						<option value="hide"><?php echo esc_attr( $gm_hide ); ?></option>
					</select>
					<i class="controls-description"><?php echo esc_attr( $gm_display_control_tooltip ); ?></i>
				</div>
			</div>
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_thumbnail_description_title ); ?> :
						<span class="required" aria-required="true">*</span>
					</label>
					<div class="input-icon right">
						<select name="ux_ddl_thumbnail_description" id="ux_ddl_thumbnail_description" class="form-control" >
							<option value="show"><?php echo esc_attr( $gm_show ); ?></option>
							<option value="hide"><?php echo esc_attr( $gm_hide ); ?></option>
						</select>
					</div>
					<i class="controls-description"><?php echo esc_attr( $gm_display_control_tooltip ); ?></i>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_sort_images_title ); ?> :
						<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
					</label>
					<select name="ux_ddl_sort_image_by" id="ux_ddl_sort_image_by" class="form-control" >
						<option value="image_title" disabled='disabled'><?php echo esc_attr( $gm_title ); ?></option>
						<option value="upload_date" disabled='disabled'><?php echo esc_attr( $gm_date ); ?></option>
						<option value="image_name" disabled='disabled'><?php echo esc_attr( $gm_filename ); ?></option>
						<option value="file_type" disabled='disabled'><?php echo esc_attr( $gm_type ); ?></option>
						<option value="sort_order" selected="selected"><?php echo esc_attr( $gm_custom_order ); ?></option>
						<option value="random_order" disabled='disabled'><?php echo esc_attr( $gm_random_order ); ?></option>
					</select>
					<i class="controls-description"><?php echo esc_attr( $gm_sort_images_tooltip ); ?></i>
				</div>
			</div>
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_order_by_title ); ?> :
						<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
					</label>
					<select name="ux_ddl_order_images" id="ux_ddl_order_images" class="form-control" >
						<option value="sort_asc"><?php echo esc_attr( $gm_ascending ); ?></option>
						<option value="sort_desc" disabled='disabled'><?php echo esc_attr( $gm_descending ); ?></option>
					</select>
					<i class="controls-description"><?php echo esc_attr( $gm_order_by_tooltip ); ?></i>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_global_option_lazy_load_title ); ?> :
						<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
					</label>
					<div class="input-icon right">
						<select name="ux_ddl_lazy_load" id="ux_ddl_lazy_load" class="form-control" >
							<option value="disable"><?php echo esc_attr( $gm_disable ); ?></option>
							<option value="enable" disabled='disabled'><?php echo esc_attr( $gm_enable ); ?></option>
						</select>
					</div>
					<i class="controls-description"><?php echo esc_attr( $gm_display_control_tooltip ); ?></i>
				</div>
			</div>
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $gm_filters ); ?> :
						<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
					</label>
					<div class="input-icon right">
						<select name="ux_ddl_filters" id="ux_ddl_filters" class="form-control" >
							<option value="disable"><?php echo esc_attr( $gm_disable ); ?></option>
							<option value="enable" disabled='disabled'><?php echo esc_attr( $gm_enable ); ?></option>
						</select>
					</div>
					<i class="controls-description"><?php echo esc_attr( $gm_display_control_tooltip ); ?></i>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $global_option_order_by ); ?> :
						<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
					</label>
					<div class="input-icon right">
						<select name="ux_ddl_order_by" id="ux_ddl_order_by" class="form-control" >
							<option value="disable"><?php echo esc_attr( $gm_disable ); ?></option>
							<option value="enable" disabled='disabled'><?php echo esc_attr( $gm_enable ); ?></option>
						</select>
					</div>
					<i class="controls-description"><?php echo esc_attr( $gm_global_option_order_by_tooltip ); ?></i>
				</div>
			</div>
			<div class="col-md-6">
				<div class="form-group">
					<label class="control-label">
						<?php echo esc_attr( $global_option_search_box ); ?> :
						<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
					</label>
					<div class="input-icon right">
						<select name="ux_ddl_search_box" id="ux_ddl_search_box" class="form-control" >
							<option value="disable"><?php echo esc_attr( $gm_disable ); ?></option>
							<option value="enable" disabled='disabled'><?php echo esc_attr( $gm_enable ); ?></option>
						</select>
					</div>
					<i class="controls-description"><?php echo esc_attr( $gm_global_option_search_box_tooltip ); ?></i>
				</div>
			</div>
		</div>
		<div id="ux_div_special_effects">
			<div class="row">
				<div class="col-md-6">
					<div class="form-group">
						<label class="control-label">
							<?php echo esc_attr( $gm_animation_effect_title ); ?> :
							<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
						</label>
						<select id="ux_ddl_animation_effect" name="ux_ddl_animation_effect" class="form-control" >
							<option value="none"><?php echo esc_attr( $gm_none ); ?></option>
							<optgroup label="<?php echo esc_attr( $gm_magic_effect ); ?>">
								<option value="twisterInDown" disabled='disabled'><?php echo esc_attr( $gm_twister_in_down ); ?></option>
								<option value="twisterInUp" disabled='disabled'><?php echo esc_attr( $gm_twister_in_up ); ?></option>
								<option value="swap" disabled='disabled'><?php echo esc_attr( $gm_swap ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_bling ); ?>">
								<option value="puffIn" disabled='disabled'><?php echo esc_attr( $gm_puff_in ); ?></option>
								<option value="vanishIn" disabled='disabled'><?php echo esc_attr( $gm_vanish_in ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_static_effect ); ?>">
								<option value="openDownLeftReturn" disabled='disabled'><?php echo esc_attr( $gm_open_down_left_return ); ?></option>
								<option value="openDownRightReturn" disabled='disabled'><?php echo esc_attr( $gm_open_down_right_return ); ?></option>
								<option value="openUpLeftReturn" disabled='disabled'><?php echo esc_attr( $gm_open_up_left_return ); ?></option>
								<option value="openUpRightReturn" disabled='disabled'><?php echo esc_attr( $gm_open_up_right_return ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_perspective ); ?>">
								<option value="perspectiveDownReturn" disabled='disabled'><?php echo esc_attr( $gm_perspective_down_return ); ?></option>
								<option value="perspectiveUpReturn" disabled='disabled'><?php echo esc_attr( $gm_perspective_up_return ); ?></option>
								<option value="perspectiveLeftReturn" disabled='disabled'><?php echo esc_attr( $gm_perspective_left_return ); ?></option>
								<option value="perspectiveRightReturn" disabled='disabled'><?php echo esc_attr( $gm_perspective_right_return ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_slide ); ?>">
								<option value="slideDownReturn" disabled='disabled'><?php echo esc_attr( $gm_slide_down_return ); ?></option>
								<option value="slideUpReturn" disabled='disabled'><?php echo esc_attr( $gm_slide_up_return ); ?></option>
								<option value="slideLeftReturn" disabled='disabled'><?php echo esc_attr( $gm_slide_left_return ); ?></option>
								<option value="slideRightReturn" disabled='disabled'><?php echo esc_attr( $gm_slide_right_return ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_math ); ?>">
								<option value="swashIn" disabled='disabled'><?php echo esc_attr( $gm_swash_in ); ?></option>
								<option value="foolishIn" disabled='disabled'><?php echo esc_attr( $gm_foolish_in ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_tin ); ?>">
								<option value="tinRightIn" disabled='disabled'><?php echo esc_attr( $gm_tin_right_in ); ?></option>
								<option value="tinLeftIn" disabled='disabled'><?php echo esc_attr( $gm_tin_left_in ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_boing ); ?>">
								<option value="boingInUp" disabled='disabled'><?php echo esc_attr( $gm_boing_in_up ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_on_the_space ); ?>">
								<option value="spaceInUp" disabled='disabled'><?php echo esc_attr( $gm_space_in_up ); ?></option>
								<option value="spaceInRight" disabled='disabled'><?php echo esc_attr( $gm_space_in_right ); ?></option>
								<option value="spaceInDown" disabled='disabled'><?php echo esc_attr( $gm_space_in_down ); ?></option>
								<option value="spaceInLeft" disabled='disabled'><?php echo esc_attr( $gm_space_in_left ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_attention_seekers ); ?>">
								<option value="bounce" disabled='disabled'><?php echo esc_attr( $gm_bounce ); ?></option>
								<option value="flash" disabled='disabled'><?php echo esc_attr( $gm_flash ); ?></option>
								<option value="pulse" disabled='disabled'><?php echo esc_attr( $gm_pulse ); ?></option>
								<option value="rubberBand" disabled='disabled'><?php echo esc_attr( $gm_rubber_band ); ?></option>
								<option value="shake" disabled='disabled'><?php echo esc_attr( $gm_shake ); ?></option>
								<option value="swing" disabled='disabled'><?php echo esc_attr( $gm_swing ); ?></option>
								<option value="tada" disabled='disabled'><?php echo esc_attr( $gm_tada ); ?></option>
								<option value="wobble" disabled='disabled'><?php echo esc_attr( $gm_wobble ); ?></option>
								<option value="jello" disabled='disabled'><?php echo esc_attr( $gm_jello ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_bouncing_entrances ); ?>">
								<option value="bounceIn" disabled='disabled'><?php echo esc_attr( $gm_bounce_in ); ?></option>
								<option value="bounceInDown" disabled='disabled'><?php echo esc_attr( $gm_bounce_in_down ); ?></option>
								<option value="bounceInLeft" disabled='disabled'><?php echo esc_attr( $gm_bounce_in_left ); ?></option>
								<option value="bounceInRight" disabled='disabled'><?php echo esc_attr( $gm_bounce_in_right ); ?></option>
								<option value="bounceInUp" disabled='disabled'><?php echo esc_attr( $gm_bounce_in_up ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_fading_entrances ); ?>">
								<option value="fadeIn" selected="selected"><?php echo esc_attr( $gm_fade_in ); ?></option>
								<option value="fadeInDown" disabled='disabled'><?php echo esc_attr( $gm_fade_in_down ); ?></option>
								<option value="fadeInLeft" disabled='disabled'><?php echo esc_attr( $gm_fade_in_left ); ?></option>
								<option value="fadeInLeftBig" disabled='disabled'><?php echo esc_attr( $gm_fade_in_left_big ); ?></option>
								<option value="fadeInRight" disabled='disabled'><?php echo esc_attr( $gm_fade_in_right_big ); ?></option>
								<option value="fadeInRightBig" disabled='disabled'><?php echo esc_attr( $gm_fade_in_right_big ); ?></option>
								<option value="fadeInUp" disabled='disabled'><?php echo esc_attr( $gm_fade_in_up ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_flippers ); ?>">
								<option value="flip" disabled='disabled'><?php echo esc_attr( $gm_flip ); ?></option>
								<option value="flipInX" disabled='disabled'><?php echo esc_attr( $gm_flip_in_x ); ?></option>
								<option value="flipInY" disabled='disabled'><?php echo esc_attr( $gm_flip_in_y ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_light_speed_in ); ?>">
								<option value="lightSpeedIn" disabled='disabled'><?php echo esc_attr( $gm_light_speed_in ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_rotating_entrances ); ?>">
								<option value="rotateIn" disabled='disabled'><?php echo esc_attr( $gm_rotate_in ); ?></option>
								<option value="rotateInDownLeft" disabled='disabled'><?php echo esc_attr( $gm_rotate_in_down_left ); ?></option>
								<option value="rotateInDownRight" disabled='disabled'><?php echo esc_attr( $gm_rotate_in_down_right ); ?></option>
								<option value="rotateInUpLeft" disabled='disabled'><?php echo esc_attr( $gm_rotate_in_up_left ); ?></option>
								<option value="rotateInUpRight" disabled='disabled'><?php echo esc_attr( $gm_rotate_in_up_right ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_sliding_entrances ); ?>">
								<option value="slideInUp" disabled='disabled'><?php echo esc_attr( $gm_slide_in_up ); ?></option>
								<option value="slideInDown" disabled='disabled'><?php echo esc_attr( $gm_slide_in_down ); ?></option>
								<option value="slideInLeft" disabled='disabled'><?php echo esc_attr( $gm_slide_in_left ); ?></option>
								<option value="slideInRight" disabled='disabled'><?php echo esc_attr( $gm_slide_in_right ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_zoom_entrances ); ?>">
								<option value="zoomIn" disabled='disabled'><?php echo esc_attr( $gm_zoom_in ); ?></option>
								<option value="zoomInDown" disabled='disabled'><?php echo esc_attr( $gm_zoom_in_down ); ?></option>
								<option value="zoomInLeft" disabled='disabled'><?php echo esc_attr( $gm_zoom_in_left ); ?></option>
								<option value="zoomInRight" disabled='disabled'><?php echo esc_attr( $gm_zoom_in_right ); ?></option>
								<option value="zoomInUp" disabled='disabled'><?php echo esc_attr( $gm_zoom_in_up ); ?></option>
							</optgroup>
							<optgroup label="<?php echo esc_attr( $gm_specials ); ?>">
								<option value="rollIn" disabled='disabled'><?php echo esc_attr( $gm_roll_in ); ?></option>
							</optgroup>
						</select>
						<i class="controls-description"><?php echo esc_attr( $gm_animation_effect_tooltip ); ?></i>
					</div>
				</div>
				<div class="col-md-6">
					<div class="form-group">
						<label class="control-label">
							<?php echo esc_attr( $gm_special_effect_title ); ?> :
							<span class="required" aria-required="true">* ( <?php echo esc_attr( $gm_premium_edition ); ?> )</span>
						</label>
						<div class="input-icon right">
							<select id="ux_ddl_special_effects" name="ux_ddl_special_effects" class="form-control" >
								<option value="none"><?php echo esc_attr( $gm_none ); ?></option>
								<option value="blur" disabled='disabled'><?php echo esc_attr( $gm_blur ); ?></option>
								<option value="sepia" disabled='disabled'><?php echo esc_attr( $gm_sepia ); ?></option>
								<option value="brightness" disabled='disabled'><?php echo esc_attr( $gm_brightness ); ?></option>
								<option value="contrast" disabled='disabled'><?php echo esc_attr( $gm_contrast ); ?></option>
								<option value="invert" disabled='disabled'><?php echo esc_attr( $gm_invert ); ?></option>
								<option value="saturate" disabled='disabled'><?php echo esc_attr( $gm_saturate ); ?></option>
								<option value="grayscale" disabled='disabled'><?php echo esc_attr( $gm_grayscale ); ?></option>
								<option value="hue-rotate" disabled='disabled'><?php echo esc_attr( $gm_hue_rotate ); ?></option>
							</select>
						</div>
						<i class="controls-description"><?php echo esc_attr( $gm_special_effect_tooltip ); ?></i>
					</div>
				</div>
			</div>
		</div>
<div class="line-separator"></div>
<input type="button" class="btn vivid-green" name="ux_btn_generate_shortcode" id="ux_btn_generate_shortcode" value="Add Shortcode" onclick="add_shortcode_block_gallery_master()">
</div>
<script>
function only_digits_gallery_master(event) {
	if (event.which !== 8 && event.which !== 0 && (event.which < 48 || event.which > 57)) {
		event.preventDefault();
	}
}
function shortcode_source_type_control_gallery_master(control_id, gallery_id, album_id, album_control_id)
{
	var title = jQuery("#" + control_id).val();
	switch (title) {
		case "gallery":
			jQuery("#" + gallery_id).css("display", "block");
			jQuery("#" + album_id).css("display", "none");
			jQuery("#" + album_control_id).css("display", "none");
			jQuery("#ux_div_album_type").css("display", "none");
			break;
		case "album":
			jQuery("#" + album_id).css("display", "block");
			jQuery("#" + gallery_id).css("display", "none");
			jQuery("#" + album_control_id).css("display", "block");
			jQuery("#ux_div_album_type").css("display", "block");
			break;
		default:
			jQuery("#" + gallery_id).css("display", "none");
			jQuery("#" + album_id).css("display", "none");
			jQuery("#" + album_control_id).css("display", "none");
			jQuery("#ux_div_album_type").css("display", "none");
			break;
	}
}
function add_shortcode_block_gallery_master(){
	var shortcode_content = '';
	var choose_type = jQuery("#ux_ddl_choose_type").val();
	var choose_gallery = jQuery("#ux_ddl_choose_gallery").val();
	var choose_album = jQuery("#ux_ddl_choose_album").val();
	var albums_type = jQuery("#ux_ddl_choose_album_type").val();
	var layout_type = jQuery("#ux_ddl_layout_type").val();
	if (choose_type === "gallery" && choose_gallery === "")
	{
		alert(<?php echo wp_json_encode( __( 'Please choose at least one Gallery to Proceed!', 'gallery-master' ) ); ?>);
	} else if (choose_type === "album" || ( layout_type != "thumbnail_layout" && layout_type != "masonary_layout" ) )
	{
		alert(<?php echo wp_json_encode( __( 'This feature is available only in Premium Editions! Kindly Purchase to unlock it!', 'gallery-master' ) ); ?>);
	} else
	{
		var source_id = choose_type === "gallery" ? choose_gallery : choose_album;
		var sort_images_by = jQuery("#ux_ddl_sort_image_by").val();
		var order_images_by = jQuery("#ux_ddl_order_images").val();
		var gallery_title = jQuery("#ux_ddl_gallery_title").val();
		var gallery_description = jQuery("#ux_ddl_gallery_description").val();
		var thumbnail_title = jQuery("#ux_ddl_thumbnail_title").val();
		var thumbnail_description = jQuery("#ux_ddl_thumbnail_description").val();
		var animation_effects = jQuery("#ux_ddl_animation_effect").val();
		var special_effects = jQuery("#ux_ddl_special_effects").val();
		var filters = jQuery("#ux_ddl_filters").val();
		var lazy_load = jQuery("#ux_ddl_lazy_load").val();
		var search_box = jQuery("#ux_ddl_search_box").val();
		var order_by = jQuery("#ux_ddl_order_by").val();
		var gallery_master_album_description = jQuery("#ux_ddl_album_description").val();
		var gallery_master_album_sort_albums = jQuery("#ux_ddl_sort_albums_by").val();
		var gallery_master_album_title = jQuery("#ux_ddl_album_title").val();
		var album_type = choose_type === "album" ? "album_type=\"" + albums_type + "\" " : "";
		var album_title = choose_type === "album" ? "album_title=\"" + gallery_master_album_title + "\" " : "";
		var album_description = choose_type === "album" ? "album_description=\"" + gallery_master_album_description + "\" " : "";
		var album_order = choose_type === "album" ? "sort_albums_by=\"" + gallery_master_album_sort_albums + "\" " : "";
		var gallery_master_album_order_albums = jQuery("#ux_ddl_order_albums").val();
		var album_order_by = choose_type === "album" ? "order_albums_by=\"" + gallery_master_album_order_albums + "\" " : "";
		switch (layout_type) {
			case "thumbnail_layout":
				var thumbnail_alignment = jQuery("#ux_ddl_alignment").val();
				var images_per_page = jQuery("#ux_txt_images_per_page").val();
				var page_navigation = jQuery("#ux_ddl_page_navigation").val();
				var images_per_page_layout = jQuery("#ux_ddl_page_navigation").val() === "enable" ? "images_per_page=\"" + images_per_page + "\" " : "";
				var columns = jQuery("#ux_txt_columns").val();
				var lightbox_type = jQuery("#ux_ddl_lightbox_type").val();
				var shortcode_content = "[gallery_master source_type=\"" + choose_type + "\" id=\"" + source_id + "\" layout_type=\"thumbnail_layout\" " + album_type + "alignment=\"" + thumbnail_alignment +
				"\" lightbox_type=\"" + lightbox_type + "\" order_images_by=\"" + order_images_by + "\" sort_images_by=\"" + sort_images_by + "\" " + album_title + album_description + album_order + album_order_by + "gallery_title=\"" + gallery_title +
				"\" gallery_description=\"" + gallery_description + "\" thumbnail_title=\"" + thumbnail_title +
				"\" thumbnail_description=\"" + thumbnail_description + "\" filters=\"" + filters + "\" lazy_load=\"" + lazy_load +
				"\" search_box=\"" + search_box + "\" order_by=\"" + order_by + "\" columns=\"" + columns +
				"\" page_navigation=\"" + page_navigation + "\" " + images_per_page_layout + "animation_effects=\"" + animation_effects + "\" " + "special_effects=\"" + special_effects + "\"][/gallery_master]";
				break;
			case "masonary_layout":
				var thumbnail_alignment = jQuery("#ux_ddl_alignment").val();
				var images_per_page = jQuery("#ux_txt_images_per_page").val();
				var page_navigation = jQuery("#ux_ddl_page_navigation").val();
				var images_per_page_layout = jQuery("#ux_ddl_page_navigation").val() === "enable" ? "images_per_page=\"" + images_per_page + "\" " : "";
				var columns = jQuery("#ux_txt_columns").val();
				var lightbox_type = jQuery("#ux_ddl_lightbox_type").val();
				var shortcode_content = "[gallery_master source_type=\"" + choose_type + "\" id=\"" + source_id + "\" layout_type=\"masonry_layout\" " + album_type +
				" alignment=\"" + thumbnail_alignment + "\" lightbox_type=\"" + lightbox_type +
				"\" order_images_by=\"" + order_images_by + "\" sort_images_by=\"" + sort_images_by +
				"\" " + album_title + album_description + album_order + album_order_by + "gallery_title=\"" + gallery_title +
				"\" gallery_description=\"" + gallery_description + "\" thumbnail_title=\"" + thumbnail_title +
				"\" thumbnail_description=\"" + thumbnail_description + "\" filters=\"" + filters +
				"\" lazy_load=\"" + lazy_load + "\" search_box=\"" + search_box +
				"\" order_by=\"" + order_by + "\" columns=\"" + columns + "\" page_navigation=\"" + page_navigation +
				"\" " + images_per_page_layout + " animation_effects=\"" + animation_effects + "\" " + "special_effects=\"" + special_effects + "\"][/gallery_master]";
				break;
			}
			let block = wp.blocks.createBlock( 'core/paragraph', { content: shortcode_content } );
			wp.data.dispatch( 'core/editor' ).insertBlocks( block );
	}
}
function show_hide_layout_changes_gallery_master() {
	var title = jQuery("#ux_ddl_layout_type").val();
	switch (title) {
		case "thumbnail_layout":
			jQuery("#ux_div_sldeshow_layout").css("display", "none");
			jQuery("#ux_div_image_browser_layout").css("display", "none");
			jQuery("#ux_div_justified_layout").css("display", "none");
			jQuery("#ux_div_blog_style_layout").css("display", "none");
			jQuery("#ux_div_lightbox_type").css("display", "block");
			jQuery( "#ux_div_page_navigation" ).removeClass( "col-md-12" );
			jQuery( "#ux_div_page_navigation" ).addClass( "col-md-6" );
			break;
		case "masonary_layout":
			jQuery("#ux_div_sldeshow_layout").css("display", "none");
			jQuery("#ux_div_image_browser_layout").css("display", "none");
			jQuery("#ux_div_justified_layout").css("display", "none");
			jQuery("#ux_div_blog_style_layout").css("display", "none");
			jQuery("#ux_div_lightbox_type").css("display", "block");
			jQuery( "#ux_div_page_navigation" ).removeClass( "col-md-12" );
			jQuery( "#ux_div_page_navigation" ).addClass( "col-md-6" );
			break;
		case "slideshow_layout":
			jQuery("#ux_div_sldeshow_layout").css("display", "block");
			jQuery("#ux_div_image_browser_layout").css("display", "none");
			jQuery("#ux_div_justified_layout").css("display", "none");
			jQuery("#ux_div_blog_style_layout").css("display", "none");
			jQuery("#ux_div_lightbox_type").css("display", "none");
			jQuery( "#ux_div_page_navigation" ).removeClass( "col-md-6" );
			jQuery( "#ux_div_page_navigation" ).addClass( "col-md-12" );
			break;
		case "image_browser_layout":
			jQuery("#ux_div_image_browser_layout").css("display", "block");
			jQuery("#ux_div_justified_layout").css("display", "none");
			jQuery("#ux_div_blog_style_layout").css("display", "none");
			jQuery("#ux_div_sldeshow_layout").css("display", "none");
			jQuery("#ux_div_lightbox_type").css("display", "none");
			jQuery( "#ux_div_page_navigation" ).removeClass( "col-md-6" );
			jQuery( "#ux_div_page_navigation" ).addClass( "col-md-12" );

			break;
		case "justified_grid_layout":
			jQuery("#ux_div_justified_layout").css("display", "block");
			jQuery("#ux_div_blog_style_layout").css("display", "none");
			jQuery("#ux_div_image_browser_layout").css("display", "none");
			jQuery("#ux_div_sldeshow_layout").css("display", "none");
			jQuery("#ux_div_lightbox_type").css("display", "block");
			jQuery( "#ux_div_page_navigation" ).removeClass( "col-md-12" );
			jQuery( "#ux_div_page_navigation" ).addClass( "col-md-6" );
			break;
		case "blog_style_layout":
			jQuery("#ux_div_blog_style_layout").css("display", "block");
			jQuery("#ux_div_justified_layout").css("display", "none");
			jQuery("#ux_div_image_browser_layout").css("display", "none");
			jQuery("#ux_div_sldeshow_layout").css("display", "none");
			jQuery("#ux_div_lightbox_type").css("display", "block");
			jQuery( "#ux_div_page_navigation" ).removeClass( "col-md-12" );
			jQuery( "#ux_div_page_navigation" ).addClass( "col-md-6" );
			break;
	}
}
function paste_prevent_gallery_master(control_id) {
	jQuery("#" + control_id).on("paste", function (e) {
		e.preventDefault();
	});
}
function only_digits_gallery_master(event) {
	if (event.which !== 8 && event.which !== 0 && (event.which < 48 || event.which > 57)) {
		event.preventDefault();
	}
}
function set_thumbnail_dimension_in_shortcode_gallery_master(control, image_dimension, message) {
	jQuery(control).val() === "" || jQuery(control).val() === 0 ? jQuery(control).val(image_dimension) : "";
	if (parseInt(jQuery(control).val()) > parseInt(image_dimension)) {
			alert(message);
			jQuery(control).val(image_dimension);
	}
}
function set_thumbnail_dimension_in_shortcode(control, image_dimension, message) {
	jQuery(control).val() === "" || jQuery(control).val() === 0 ? jQuery(control).val(image_dimension) : "";
	if (parseInt(jQuery(control).val()) > parseInt(image_dimension)) {
		var shortCutFunction = jQuery("#toastTypeGroup_error input:checked").val();
		$toast = toastr[shortCutFunction](message);
		jQuery(control).val(image_dimension);
	}
}
function digits_with_dot_gallery_master(event) {
	if (event.which === 8 || event.keyCode === 37 || event.keyCode === 39 || event.keyCode === 46 || event.keyCode === 9 || event.keyCode === 110) {
		return true;
	} else if (event.which !== 46 && (event.which < 48 || event.which > 57)) {
		event.preventDefault();
	}
}
function default_value_gallery_master(id, value) {
	if (jQuery(id).val() === "") {
		jQuery(id).val(value);
	}
}
function show_hide_control_gallery_master(control_id, div_id) {
	var title = jQuery("#" + control_id).val();
	switch (title) {
		case "true":
			jQuery("#" + div_id).css("display", "block");
			break;
		case "show":
		case "enable":
			jQuery("#" + div_id).css("display", "block");
			break;
		case "hide":
		case "disable":
			jQuery("#" + div_id).css("display", "none");
			break;
		default:
			jQuery("#" + div_id).css("display", "none");
			break;
	}
}
jQuery(document).ready(function(){
	shortcode_source_type_control_gallery_master("ux_ddl_choose_type", "ux_div_gallery", "ux_div_album", "ux_album_title_description_div");
});
</script>
