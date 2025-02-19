<?php
/**
 * This File displays Gallery Master Widget Form.
 *
 * @author  Tech Banker
 * @package gallery-master/user-views/includes
 * @version  2.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // exit if accessed directly.
}
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
		<div style="width:100%;margin-top:5px; border-spacing:0;clear:both;">
			<div style="margin-bottom:10px;margin-top:10px;">
			<label title="Shortcode"><?php echo esc_attr( $gm_shortcode ); ?> : <span>(<a href="admin.php?page=gm_shortcodes" target="_blank"><?php echo esc_attr( $gm_add_shortcode ); ?></a>)</span></label>
			<textarea rows="5" cols="4" style="width:100%;margin-top:5px; border-spacing:0;clear:both;" id='<?php echo esc_attr( $this->get_field_id( 'ux_txt_gallery_master_shortcode' ) ); ?>' name='<?php echo esc_attr( $this->get_field_name( 'ux_txt_gallery_master_shortcode' ) ); ?>' placeholder="<?php echo esc_attr( $gm_shortcode_placeholder ); ?>"><?php echo isset( $instance['shortcode'] ) ? esc_attr( $instance['shortcode'] ) : ''; ?></textarea>
		</div>
	</div>
		<?php
	}
}
