<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class WC_Order_Export_Main_Settings {

	public static function get_settings() {

		$settings = array(
			'default_tab'                          => 'export',
			'cron_tasks_active'                    => true,
			'show_export_status_column'            => '1',
			'show_export_actions_in_bulk'          => '1',
			'show_export_in_status_change_job'     => '0',
			'autocomplete_products_max'            => '10',
			'show_all_items_in_filters'            => false,
			'apply_filters_to_bulk_actions'        => false,
			'ajax_orders_per_step'                 => '30',
			'limit_button_test'                    => '1',
			'cron_key'                             => null,
			'ipn_url'                              => '',

			'notify_failed_jobs'		       => 0,
			'notify_failed_jobs_email_subject'     => '',
			'notify_failed_jobs_email_recipients'  => '',

			'zapier_api_key'                       => '12345678',
			'zapier_file_timeout'                  => 60,
			'show_date_time_picker_for_date_range' => false,
			'display_profiles_export_date_range'   => false,
			'show_destination_in_profile'          => false,
			'display_html_report_in_browser'       => false,
			'default_date_range_for_export_now'    => '',
			'default_html_css'		       => '',
		);

		return apply_filters( 'woe_get_main_settings', $settings );
	}

}
