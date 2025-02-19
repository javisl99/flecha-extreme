<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}
?>
<br>
<div class="tabs-content">
	<?php
	//settings for form
	$show = array(
		'date_filter'         => true,
		'export_button'       => true,
		'export_button_plain' => true,
	);
	$tab->render_template( 'settings-form', array(
		'mode'    => WC_Order_Export_Manage::EXPORT_NOW,
		'id'      => 0,
		'ajaxurl' => $ajaxurl,
		'show'    => $show,
	) );
	?>
</div>