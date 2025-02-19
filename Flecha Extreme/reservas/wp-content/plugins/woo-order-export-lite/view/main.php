<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}
?>
<?php if ( isset( $_REQUEST['save'] ) ): ?>
    <div class="update-nag"
         style="color: #008000; border-left: 4px solid green; display: block; width: 70%;"><?php _e( 'Settings saved',
			'woo-order-export-lite' ) ?></div>
<?php endif; ?>
<h2 class="nav-tab-wrapper" id="tabs">
	<?php foreach ( $tabs as $tab_key => $tab ): ?>
        <a class="nav-tab <?php echo $active_tab == $tab_key ? 'nav-tab-active' : '' ?>"
           href="<?php echo admin_url( 'admin.php?page=wc-order-export&tab=' . $tab_key ) ?>">
			<?php echo $tab->get_title() ?>
        </a>
	<?php endforeach; ?>
</h2>

<script>
	var ajaxurl = "<?php echo $ajaxurl ?>"
	var woe_nonce = "<?php echo wp_create_nonce( 'woe_nonce' ) ?>"
	var woe_active_tab = "<?php echo $active_tab ?>"
</script>