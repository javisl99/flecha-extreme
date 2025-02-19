<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

include_once 'abstract-class-woe-formatter-plain-format.php';

if ( ! class_exists( 'PHPExcel' ) ) {
	include_once dirname( __FILE__ ) . '/../PHPExcel.php';
}

class WOE_Formatter_Xls extends WOE_Formatter_Plain_Format {
	const CHUNK_SIZE = 1000;

	private $string_format_force = false;
	private $string_format_fields;
	private $date_format_fields;

	/**
	 * @var WOE_Formatter_Storage
	 */
	protected $storage;

	public function __construct(
		$mode,
		$filename,
		$settings,
		$format,
		$labels,
		$field_formats,
		$date_format,
		$offset
	) {
		$settings['enclosure'] = '"';
		$settings['linebreak'] = '\r\n';
		$settings['delimiter'] = ',';
		$settings['encoding']  = 'UTF-8';

		parent::__construct( $mode, $filename, $settings, $format, $labels, $field_formats, $date_format, $offset );

		$this->string_format_force = apply_filters( "woe_{$format}_string_format_force", false );

		$field_formats = $this->field_formats['order']; // overwrite! probably modified by parent

		if ( $this->settings['force_general_format'] ) {
			foreach ( array( "string", "date", "money", "number" ) as $type ) {
				add_filter( "woe_xls_{$type}_format_fields", function ( $fields ) {
					return array();
				} );
			}
		}

		$this->string_format_fields = isset( $field_formats['string'] ) ? $field_formats['string'] : array();
		$this->string_format_fields = apply_filters( "woe_{$format}_string_format_fields",
			$this->string_format_fields );
		
		$this->date_format_fields = isset( $field_formats['date'] ) ? $field_formats['date'] : array();
		$this->date_format_fields = apply_filters( "woe_{$format}_date_format_fields", $this->date_format_fields );

		$this->money_format_fields = isset( $field_formats['money'] ) ? $field_formats['money'] : array();
		$this->money_format_fields = apply_filters( "woe_{$format}_money_format_fields", $this->money_format_fields );

		$this->number_format_fields = isset( $field_formats['number'] ) ? $field_formats['number'] : array();
		$this->number_format_fields = apply_filters( "woe_{$format}_number_format_fields", $this->number_format_fields );

		$this->image_format_fields = isset( $field_formats['image'] ) ? $field_formats['image'] : array();
		$this->image_format_fields = apply_filters( "woe_{$format}_image_format_fields", $this->image_format_fields );

		$this->link_format_fields = isset( $field_formats['link'] ) ? $field_formats['link'] : array();
		$this->link_format_fields = apply_filters( "woe_{$format}_link_format_fields", $this->link_format_fields );
		
		if ( $mode != 'preview' ) {
			// Excel uses another format!	
			$this->date_format   = apply_filters( 'woe_xls_date_format', $this->convert_php_date_format( $date_format ) );
			$this->money_format  = apply_filters( 'woe_xls_money_format', PHPExcel_Style_NumberFormat::FORMAT_NUMBER_00 );
			$this->number_format = apply_filters( 'woe_xls_number_format', PHPExcel_Style_NumberFormat::FORMAT_NUMBER );
			// Excel will format!
			$this->auto_format_dates             = false;
			$this->format_number_fields_original = $this->format_number_fields;
			$this->format_number_fields          = false;

			if (!$this->summary_report_products && !$this->summary_report_customers) {
				$storage_filename = str_replace( '.csv', '', $filename ) . ".storage";
				$this->storage = new WOE_Formatter_Storage_Csv($storage_filename);
				$this->storage->load();
			}
		}
		if ($this->summary_report_products || $this->summary_report_customers) {
			$summaryKey = $this->summary_report_products ? WOE_Formatter_Storage_Summary_Session::SUMMARY_PRODUCTS_KEY :
				WOE_Formatter_Storage_Summary_Session::SUMMARY_CUSTOMERS_KEY;
			$this->storage =  new WOE_Formatter_Storage_Summary_Session($summaryKey);
			$this->storage->load();
		}
	}

	public function start( $data = '' ) {
		parent::start();

		if ( $this->mode == 'preview' ) {
			$data = $this->make_header( $data );
			$data = apply_filters( "woe_{$this->format}_header_filter", $data );

			$this->rows[] = $data;
		}
	}

    protected function remove_emojis_from_array( &$data ) {
        $data = array_map( array( $this, 'remove_emojis_callback' ), $data );
    }

    protected function remove_emojis_callback( $value ) {
        return trim(preg_replace('/[\x{1F3F4}](?:\x{E0067}\x{E0062}\x{E0077}\x{E006C}\x{E0073}\x{E007F})|[\x{1F3F4}](?:\x{E0067}\x{E0062}\x{E0073}\x{E0063}\x{E0074}\x{E007F})|[\x{1F3F4}](?:\x{E0067}\x{E0062}\x{E0065}\x{E006E}\x{E0067}\x{E007F})|[\x{1F3F4}](?:\x{200D}\x{2620}\x{FE0F})|[\x{1F3F3}](?:\x{FE0F}\x{200D}\x{1F308})|[\x{0023}\x{002A}\x{0030}\x{0031}\x{0032}\x{0033}\x{0034}\x{0035}\x{0036}\x{0037}\x{0038}\x{0039}](?:\x{FE0F}\x{20E3})|[\x{1F415}](?:\x{200D}\x{1F9BA})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F467}\x{200D}\x{1F467})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F467}\x{200D}\x{1F466})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F467})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F466}\x{200D}\x{1F466})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F466})|[\x{1F468}](?:\x{200D}\x{1F468}\x{200D}\x{1F467}\x{200D}\x{1F467})|[\x{1F468}](?:\x{200D}\x{1F468}\x{200D}\x{1F466}\x{200D}\x{1F466})|[\x{1F468}](?:\x{200D}\x{1F468}\x{200D}\x{1F467}\x{200D}\x{1F466})|[\x{1F468}](?:\x{200D}\x{1F468}\x{200D}\x{1F467})|[\x{1F468}](?:\x{200D}\x{1F468}\x{200D}\x{1F466})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F469}\x{200D}\x{1F467}\x{200D}\x{1F467})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F469}\x{200D}\x{1F466}\x{200D}\x{1F466})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F469}\x{200D}\x{1F467}\x{200D}\x{1F466})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F469}\x{200D}\x{1F467})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F469}\x{200D}\x{1F466})|[\x{1F469}](?:\x{200D}\x{2764}\x{FE0F}\x{200D}\x{1F469})|[\x{1F469}\x{1F468}](?:\x{200D}\x{2764}\x{FE0F}\x{200D}\x{1F468})|[\x{1F469}](?:\x{200D}\x{2764}\x{FE0F}\x{200D}\x{1F48B}\x{200D}\x{1F469})|[\x{1F469}\x{1F468}](?:\x{200D}\x{2764}\x{FE0F}\x{200D}\x{1F48B}\x{200D}\x{1F468})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F9BD})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F9BC})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F9AF})|[\x{1F575}\x{1F3CC}\x{26F9}\x{1F3CB}](?:\x{FE0F}\x{200D}\x{2640}\x{FE0F})|[\x{1F575}\x{1F3CC}\x{26F9}\x{1F3CB}](?:\x{FE0F}\x{200D}\x{2642}\x{FE0F})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F692})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F680})|[\x{1F468}\x{1F469}](?:\x{200D}\x{2708}\x{FE0F})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F3A8})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F3A4})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F4BB})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F52C})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F4BC})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F3ED})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F527})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F373})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F33E})|[\x{1F468}\x{1F469}](?:\x{200D}\x{2696}\x{FE0F})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F3EB})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F393})|[\x{1F468}\x{1F469}](?:\x{200D}\x{2695}\x{FE0F})|[\x{1F471}\x{1F64D}\x{1F64E}\x{1F645}\x{1F646}\x{1F481}\x{1F64B}\x{1F9CF}\x{1F647}\x{1F926}\x{1F937}\x{1F46E}\x{1F482}\x{1F477}\x{1F473}\x{1F9B8}\x{1F9B9}\x{1F9D9}\x{1F9DA}\x{1F9DB}\x{1F9DC}\x{1F9DD}\x{1F9DE}\x{1F9DF}\x{1F486}\x{1F487}\x{1F6B6}\x{1F9CD}\x{1F9CE}\x{1F3C3}\x{1F46F}\x{1F9D6}\x{1F9D7}\x{1F3C4}\x{1F6A3}\x{1F3CA}\x{1F6B4}\x{1F6B5}\x{1F938}\x{1F93C}\x{1F93D}\x{1F93E}\x{1F939}\x{1F9D8}](?:\x{200D}\x{2640}\x{FE0F})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F9B2})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F9B3})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F9B1})|[\x{1F468}\x{1F469}](?:\x{200D}\x{1F9B0})|[\x{1F471}\x{1F64D}\x{1F64E}\x{1F645}\x{1F646}\x{1F481}\x{1F64B}\x{1F9CF}\x{1F647}\x{1F926}\x{1F937}\x{1F46E}\x{1F482}\x{1F477}\x{1F473}\x{1F9B8}\x{1F9B9}\x{1F9D9}\x{1F9DA}\x{1F9DB}\x{1F9DC}\x{1F9DD}\x{1F9DE}\x{1F9DF}\x{1F486}\x{1F487}\x{1F6B6}\x{1F9CD}\x{1F9CE}\x{1F3C3}\x{1F46F}\x{1F9D6}\x{1F9D7}\x{1F3C4}\x{1F6A3}\x{1F3CA}\x{1F6B4}\x{1F6B5}\x{1F938}\x{1F93C}\x{1F93D}\x{1F93E}\x{1F939}\x{1F9D8}](?:\x{200D}\x{2642}\x{FE0F})|[\x{1F441}](?:\x{FE0F}\x{200D}\x{1F5E8}\x{FE0F})|[\x{1F1E6}\x{1F1E7}\x{1F1E8}\x{1F1E9}\x{1F1F0}\x{1F1F2}\x{1F1F3}\x{1F1F8}\x{1F1F9}\x{1F1FA}](?:\x{1F1FF})|[\x{1F1E7}\x{1F1E8}\x{1F1EC}\x{1F1F0}\x{1F1F1}\x{1F1F2}\x{1F1F5}\x{1F1F8}\x{1F1FA}](?:\x{1F1FE})|[\x{1F1E6}\x{1F1E8}\x{1F1F2}\x{1F1F8}](?:\x{1F1FD})|[\x{1F1E6}\x{1F1E7}\x{1F1E8}\x{1F1EC}\x{1F1F0}\x{1F1F2}\x{1F1F5}\x{1F1F7}\x{1F1F9}\x{1F1FF}](?:\x{1F1FC})|[\x{1F1E7}\x{1F1E8}\x{1F1F1}\x{1F1F2}\x{1F1F8}\x{1F1F9}](?:\x{1F1FB})|[\x{1F1E6}\x{1F1E8}\x{1F1EA}\x{1F1EC}\x{1F1ED}\x{1F1F1}\x{1F1F2}\x{1F1F3}\x{1F1F7}\x{1F1FB}](?:\x{1F1FA})|[\x{1F1E6}\x{1F1E7}\x{1F1EA}\x{1F1EC}\x{1F1ED}\x{1F1EE}\x{1F1F1}\x{1F1F2}\x{1F1F5}\x{1F1F8}\x{1F1F9}\x{1F1FE}](?:\x{1F1F9})|[\x{1F1E6}\x{1F1E7}\x{1F1EA}\x{1F1EC}\x{1F1EE}\x{1F1F1}\x{1F1F2}\x{1F1F5}\x{1F1F7}\x{1F1F8}\x{1F1FA}\x{1F1FC}](?:\x{1F1F8})|[\x{1F1E6}\x{1F1E7}\x{1F1E8}\x{1F1EA}\x{1F1EB}\x{1F1EC}\x{1F1ED}\x{1F1EE}\x{1F1F0}\x{1F1F1}\x{1F1F2}\x{1F1F3}\x{1F1F5}\x{1F1F8}\x{1F1F9}](?:\x{1F1F7})|[\x{1F1E6}\x{1F1E7}\x{1F1EC}\x{1F1EE}\x{1F1F2}](?:\x{1F1F6})|[\x{1F1E8}\x{1F1EC}\x{1F1EF}\x{1F1F0}\x{1F1F2}\x{1F1F3}](?:\x{1F1F5})|[\x{1F1E6}\x{1F1E7}\x{1F1E8}\x{1F1E9}\x{1F1EB}\x{1F1EE}\x{1F1EF}\x{1F1F2}\x{1F1F3}\x{1F1F7}\x{1F1F8}\x{1F1F9}](?:\x{1F1F4})|[\x{1F1E7}\x{1F1E8}\x{1F1EC}\x{1F1ED}\x{1F1EE}\x{1F1F0}\x{1F1F2}\x{1F1F5}\x{1F1F8}\x{1F1F9}\x{1F1FA}\x{1F1FB}](?:\x{1F1F3})|[\x{1F1E6}\x{1F1E7}\x{1F1E8}\x{1F1E9}\x{1F1EB}\x{1F1EC}\x{1F1ED}\x{1F1EE}\x{1F1EF}\x{1F1F0}\x{1F1F2}\x{1F1F4}\x{1F1F5}\x{1F1F8}\x{1F1F9}\x{1F1FA}\x{1F1FF}](?:\x{1F1F2})|[\x{1F1E6}\x{1F1E7}\x{1F1E8}\x{1F1EC}\x{1F1EE}\x{1F1F2}\x{1F1F3}\x{1F1F5}\x{1F1F8}\x{1F1F9}](?:\x{1F1F1})|[\x{1F1E8}\x{1F1E9}\x{1F1EB}\x{1F1ED}\x{1F1F1}\x{1F1F2}\x{1F1F5}\x{1F1F8}\x{1F1F9}\x{1F1FD}](?:\x{1F1F0})|[\x{1F1E7}\x{1F1E9}\x{1F1EB}\x{1F1F8}\x{1F1F9}](?:\x{1F1EF})|[\x{1F1E6}\x{1F1E7}\x{1F1E8}\x{1F1EB}\x{1F1EC}\x{1F1F0}\x{1F1F1}\x{1F1F3}\x{1F1F8}\x{1F1FB}](?:\x{1F1EE})|[\x{1F1E7}\x{1F1E8}\x{1F1EA}\x{1F1EC}\x{1F1F0}\x{1F1F2}\x{1F1F5}\x{1F1F8}\x{1F1F9}](?:\x{1F1ED})|[\x{1F1E6}\x{1F1E7}\x{1F1E8}\x{1F1E9}\x{1F1EA}\x{1F1EC}\x{1F1F0}\x{1F1F2}\x{1F1F3}\x{1F1F5}\x{1F1F8}\x{1F1F9}\x{1F1FA}\x{1F1FB}](?:\x{1F1EC})|[\x{1F1E6}\x{1F1E7}\x{1F1E8}\x{1F1EC}\x{1F1F2}\x{1F1F3}\x{1F1F5}\x{1F1F9}\x{1F1FC}](?:\x{1F1EB})|[\x{1F1E6}\x{1F1E7}\x{1F1E9}\x{1F1EA}\x{1F1EC}\x{1F1EE}\x{1F1EF}\x{1F1F0}\x{1F1F2}\x{1F1F3}\x{1F1F5}\x{1F1F7}\x{1F1F8}\x{1F1FB}\x{1F1FE}](?:\x{1F1EA})|[\x{1F1E6}\x{1F1E7}\x{1F1E8}\x{1F1EC}\x{1F1EE}\x{1F1F2}\x{1F1F8}\x{1F1F9}](?:\x{1F1E9})|[\x{1F1E6}\x{1F1E8}\x{1F1EA}\x{1F1EE}\x{1F1F1}\x{1F1F2}\x{1F1F3}\x{1F1F8}\x{1F1F9}\x{1F1FB}](?:\x{1F1E8})|[\x{1F1E7}\x{1F1EC}\x{1F1F1}\x{1F1F8}](?:\x{1F1E7})|[\x{1F1E7}\x{1F1E8}\x{1F1EA}\x{1F1EC}\x{1F1F1}\x{1F1F2}\x{1F1F3}\x{1F1F5}\x{1F1F6}\x{1F1F8}\x{1F1F9}\x{1F1FA}\x{1F1FB}\x{1F1FF}](?:\x{1F1E6})|[\x{00A9}\x{00AE}\x{203C}\x{2049}\x{2122}\x{2139}\x{2194}-\x{2199}\x{21A9}-\x{21AA}\x{231A}-\x{231B}\x{2328}\x{23CF}\x{23E9}-\x{23F3}\x{23F8}-\x{23FA}\x{24C2}\x{25AA}-\x{25AB}\x{25B6}\x{25C0}\x{25FB}-\x{25FE}\x{2600}-\x{2604}\x{260E}\x{2611}\x{2614}-\x{2615}\x{2618}\x{261D}\x{2620}\x{2622}-\x{2623}\x{2626}\x{262A}\x{262E}-\x{262F}\x{2638}-\x{263A}\x{2640}\x{2642}\x{2648}-\x{2653}\x{265F}-\x{2660}\x{2663}\x{2665}-\x{2666}\x{2668}\x{267B}\x{267E}-\x{267F}\x{2692}-\x{2697}\x{2699}\x{269B}-\x{269C}\x{26A0}-\x{26A1}\x{26AA}-\x{26AB}\x{26B0}-\x{26B1}\x{26BD}-\x{26BE}\x{26C4}-\x{26C5}\x{26C8}\x{26CE}-\x{26CF}\x{26D1}\x{26D3}-\x{26D4}\x{26E9}-\x{26EA}\x{26F0}-\x{26F5}\x{26F7}-\x{26FA}\x{26FD}\x{2702}\x{2705}\x{2708}-\x{270D}\x{270F}\x{2712}\x{2714}\x{2716}\x{271D}\x{2721}\x{2728}\x{2733}-\x{2734}\x{2744}\x{2747}\x{274C}\x{274E}\x{2753}-\x{2755}\x{2757}\x{2763}-\x{2764}\x{2795}-\x{2797}\x{27A1}\x{27B0}\x{27BF}\x{2934}-\x{2935}\x{2B05}-\x{2B07}\x{2B1B}-\x{2B1C}\x{2B50}\x{2B55}\x{3030}\x{303D}\x{3297}\x{3299}\x{1F004}\x{1F0CF}\x{1F170}-\x{1F171}\x{1F17E}-\x{1F17F}\x{1F18E}\x{1F191}-\x{1F19A}\x{1F201}-\x{1F202}\x{1F21A}\x{1F22F}\x{1F232}-\x{1F23A}\x{1F250}-\x{1F251}\x{1F300}-\x{1F321}\x{1F324}-\x{1F393}\x{1F396}-\x{1F397}\x{1F399}-\x{1F39B}\x{1F39E}-\x{1F3F0}\x{1F3F3}-\x{1F3F5}\x{1F3F7}-\x{1F3FA}\x{1F400}-\x{1F4FD}\x{1F4FF}-\x{1F53D}\x{1F549}-\x{1F54E}\x{1F550}-\x{1F567}\x{1F56F}-\x{1F570}\x{1F573}-\x{1F57A}\x{1F587}\x{1F58A}-\x{1F58D}\x{1F590}\x{1F595}-\x{1F596}\x{1F5A4}-\x{1F5A5}\x{1F5A8}\x{1F5B1}-\x{1F5B2}\x{1F5BC}\x{1F5C2}-\x{1F5C4}\x{1F5D1}-\x{1F5D3}\x{1F5DC}-\x{1F5DE}\x{1F5E1}\x{1F5E3}\x{1F5E8}\x{1F5EF}\x{1F5F3}\x{1F5FA}-\x{1F64F}\x{1F680}-\x{1F6C5}\x{1F6CB}-\x{1F6D2}\x{1F6D5}\x{1F6E0}-\x{1F6E5}\x{1F6E9}\x{1F6EB}-\x{1F6EC}\x{1F6F0}\x{1F6F3}-\x{1F6FA}\x{1F7E0}-\x{1F7EB}\x{1F90D}-\x{1F93A}\x{1F93C}-\x{1F945}\x{1F947}-\x{1F971}\x{1F973}-\x{1F976}\x{1F97A}-\x{1F9A2}\x{1F9A5}-\x{1F9AA}\x{1F9AE}-\x{1F9CA}\x{1F9CD}-\x{1F9FF}\x{1FA70}-\x{1FA73}\x{1FA78}-\x{1FA7A}\x{1FA80}-\x{1FA82}\x{1FA90}-\x{1FA95}]/u',"", $value));
    }

	public function output( $rec ) {
		//$rows = parent::output( $rec ); //we can't change parent because of html
		$is_summary_mode = $this->summary_report_products || $this->summary_report_customers;

		//was taken from parent::output()
		$rec = WOE_Formatter::output( $rec );
		if ($is_summary_mode) {
			$rows = array($rec);
		} else {
			$rows = apply_filters( 'woe_fetch_order_data', $this->maybe_multiple_fields( $rec ) );
		}

        if ($this->settings['remove_emojis']) {
            foreach ($rows as &$row) {
                $this->remove_emojis_from_array($row);
            }
        }

		if ( $this->mode !== 'preview' || $is_summary_mode ) {
			if ( ! $this->storage->getColumns() ) {
				$tmpLabels = $this->make_header( "" ); //it filters labels
				$tmpRow = $this->extractRowForHeaderProcess($rows);

				$tmpLabels = apply_filters( "woe_xls_header_filter", $tmpLabels );

				foreach ( array_keys( $tmpRow ) as $index => $key ) {
					$column = new WOE_Formatter_Storage_Column();
					$column->setKey( $key );
					if ( $this->field_format_is( $key, $this->image_format_fields ) ) {
						$column->setMetaItem( "image", true );
					}
					if ( $this->field_format_is( $key, $this->link_format_fields ) ) {
						$column->setMetaItem( "link", true );
					}
					if ( $this->field_format_is( $key, $this->string_format_fields ) ) {
						$column->setMetaItem( "string", true );
					}
					if ( $this->field_format_is( $key, $this->date_format_fields ) ) {
						$column->setMetaItem( "date", true );
					}
					if ( $this->field_format_is( $key, $this->number_format_fields ) ) {
						$column->setMetaItem( "number", true );
					}
					if( $this->field_format_is( $key, $this->money_format_fields ) ) {
						$column->setMetaItem( "money", true );
					}
					if ( isset( $tmpLabels[ $index ] ) ) {
						$column->setMetaItem( "label", $tmpLabels[ $index ] );
					}
					$this->storage->insertColumn( $column );
				}

				$this->storage->saveHeader();
			}

			foreach ( $rows as $row ) {
				if (!$row = $this->applyOutputRowFilter($row)) {
					continue;
				}
				$rowObj = new WOE_Formatter_Storage_Row();
				$rowObj->setData($row);
				$rowObj->setMetaItem("order_id", (int)WC_Order_Export_Engine::$order_id);
				$this->insertRowAndSave($rowObj);
			}
		} else {
			foreach($rows as $row) {
				if (!$row = $this->applyOutputRowFilter($row)) {
					continue;
				}
				$this->rows[] = $row;
			}
		}

		return $rows;
	}

	public function finish_partial()
	{
		parent::finish_partial();
		$this->storage->close();
	}

	public function finish() {
		if ( $this->mode === 'preview' ) {
			if($this->summary_report_products || $this->summary_report_customers) {
				$this->rows = $this->storage->processDataForPreview($this->rows);
			}
			$this->rows = apply_filters( "woe_{$this->format}_preview_rows", $this->rows );

			$image_preview_multiply = 5;
			$max_columns = 0;

			fwrite( $this->handle, '<table>' );
			if ( $this->settings['display_column_names'] && count( $this->rows ) < 2 || count( $this->rows ) < 1 ) {
				$this->rows[] = array( '<td colspan=10><b>' . __( 'No results', 'woo-order-export-lite' ) . '</b></td>' );
			}
			$image_preview_multiply = 5;
			$max_columns = 0;
			foreach ( $this->rows as $num => &$row ) {
				$row = array_map( "nl2br", $row );
				foreach ( $row as $column => &$cell ) {
					if ( $this->field_format_is( $column, $this->image_format_fields ) ) {
						$html = $this->make_img_html_from_path(
							$cell,
							$this->settings['row_images_width'] * $image_preview_multiply,
							$this->settings['row_images_height'] * $image_preview_multiply
						);
						$cell = $html ? $html : "";
					}
				}

				$max_columns = max( $max_columns, count( $row ) );

				//adds extra space for RTL
				if ( $this->settings['direction_rtl'] ) {
					while ( count( $row ) < $max_columns ) {
						$row[] = '';
					}
					$row = array_reverse( $row );
				}

				if ( $num == 0 AND ! empty( $this->settings['display_column_names'] ) ) {
					fwrite( $this->handle,
						'<tr style="font-weight:bold"><td>' . join( '</td><td>', $row ) . "</td><tr>\n" );
				} else {
					fwrite( $this->handle, '<tr><td>' . join( '</td><td>', $row ) . "</td><tr>\n" );
				}
			}
			fwrite( $this->handle, '</table>' );
		}

		parent::finish();

		if ( $this->mode != 'preview' ) {
			$this->storage->close(); // //if it's full export, storage hasn't been closed
			
			if ( has_filter( 'woe_storage_sort_by_field') ) {
				$this->storage->loadFull();
				$this->storage->sortRowsByColumn( apply_filters( 'woe_storage_sort_by_field',"plain_products_name") );
				$this->storage->forceSave();
				$this->storage->close();
			}

			//more memory for XLS?
			ini_set( 'memory_limit', '512M' );
			//fallback to PCLZip
			if ( ! class_exists( 'ZipArchive' ) ) {
				PHPExcel_Settings::setZipClass( PHPExcel_Settings::PCLZIP );
			}
			
			$this->objPHPExcel = new PHPExcel();

			$this->objPHPExcel->setActiveSheetIndex( 0 );

			$sheet = $this->objPHPExcel->getActiveSheet();

			do_action( 'woe_xls_PHPExcel_setup', $this->objPHPExcel, $this->settings );

			$this->last_row = $sheet->getHighestRow();

			//fix bug,  row=1  if we have 0 records
			if ( $this->last_row == 1 AND $sheet->getHighestColumn() == "A" ) {
				$this->last_row = 0;
			}

			$this->storage->initRowIterator();
			$row = array();
			foreach ($this->storage->getColumns() as $column) {
				if ($label = $column->getMetaItem("label")) {
					$row[] = $label;
				}
			}

			if ( ! empty( $this->settings['display_column_names'] ) AND $row ) {
				$row  = apply_filters( "woe_xls_header_filter_final", $row );
				$this->last_row ++;
				foreach ( $row as $pos => $text ) {
					$sheet->setCellValueByColumnAndRow( $pos, $this->last_row, $text );
				}

				//make first bold
				$last_column = $sheet->getHighestDataColumn();
				$sheet->getStyle( "A1:" . $last_column . "1" )->getFont()->setBold( true );

				//freeze
				$sheet->freezePane( 'A2' );
			}

			//rename Sheet1
			if ( empty( $this->settings['sheet_name'] ) ) {
				$this->settings['sheet_name'] = __( 'Orders', 'woo-order-export-lite' );
			}
			$sheet_name = WC_Order_Export_Engine::make_filename( $this->settings['sheet_name'] );
			$sheet->setTitle( $sheet_name );

			// right-to-left worksheet?
			if ( $this->settings['direction_rtl'] ) {
				$sheet->setRightToLeft( true );
			}

			do_action( 'woe_xls_print_header', $this->objPHPExcel, $this );

			$imageColumns = array();
			foreach ( $this->storage->getColumns() as $columnIndex => $column ) {
				$columnLetter = PHPExcel_Cell::stringFromColumnIndex($columnIndex);
				$numberFormat = $sheet->getStyle("$columnLetter:$columnLetter")->getNumberFormat();

				if ( $column->getMetaItem("image") === true ) {
					$imageColumns[] = $columnIndex;
				}
				if ( $this->string_format_force OR $column->getMetaItem("string") === true ) {
					$numberFormat->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_TEXT);
				} elseif ( $this->format_number_fields_original AND $column->getMetaItem("money") ) { // MONEY
					$numberFormat->setFormatCode( $this->money_format );
				} elseif ( $this->format_number_fields_original AND $column->getMetaItem("number") ) { // NUMBER
					$numberFormat->setFormatCode( $this->number_format );
				} elseif ( $column->getMetaItem("date") ) {// DATE!
					$numberFormat->setFormatCode( $this->date_format );
				} elseif ( $column->getMetaItem("link") ) {
					$numberFormat->setFormatCode( PHPExcel_Style_NumberFormat::FORMAT_TEXT );
				}
			}

			$rows = array();
			while( $rowObj = $this->storage->getNextRow() ) {
				$row = $rowObj->getData();
				$row[] = $rowObj->getMetaItem('order_id');
				$rows[] = $row;
				if( count( $rows ) == self::CHUNK_SIZE ) {
					$this->fromArray( $sheet, $rows, NULL, 'A' . ($this->last_row + 1), true );
					$rows = array();
				}
			}
			if( count( $rows ) ) { //last chunk
				$this->fromArray( $sheet, $rows, NULL, 'A' . ($this->last_row + 1), true );
			}

			if ( $this->settings['auto_width'] ) {
				try {
					$cellIterator = $sheet->getRowIterator()->current()->getCellIterator();
					$cellIterator->setIterateOnlyExistingCells( true );
					foreach ( $cellIterator as $cell ) {
						$sheet->getColumnDimension( $cell->getColumn() )->setAutoSize( true );
					}
					$sheet->calculateColumnWidths();
				} catch ( Exception $e ) {
					//do nothing here , adjustment failed gracefully
				}
			}

			$start_row = $this->settings['display_column_names'] ? 2 : 1;

			foreach ( $imageColumns as $column_index ) {
				$columnIterator = $sheet->getColumnIterator()
										->seek(PHPExcel_Cell::stringFromColumnIndex($column_index))
										->current()
										->getCellIterator($start_row);

				$columnIterator->setIterateOnlyExistingCells( true );
				foreach ( $columnIterator as $cell ) {
					/**
					 * @var PHPExcel_Cell $cell
					 */

					$value = $cell->getValue();

					$objDrawing = new PHPExcel_Worksheet_Drawing();    //create object for Worksheet drawing

					if ( wc_is_valid_url( $value ) ) {
						$url  = $value;
						$path = get_temp_dir() . '/' . md5( $url ); //Path to signature .jpg file

						if ( ! file_exists( $path ) ) {
							$ch = curl_init( $url );
							$fp = fopen( $path, 'wb' );
							curl_setopt( $ch, CURLOPT_FILE, $fp );
							curl_setopt( $ch, CURLOPT_HEADER, 0 );
							curl_exec( $ch );
							curl_close( $ch );
							fclose( $fp );
						}
					} else {
						$path = $value;
					}

					if ( file_exists( $path ) ) {
						$objDrawing->setPath( $path );
						$objDrawing->setCoordinates( $cell->getCoordinate() );        //set image to cell
						$row              = $cell->getRow();
						$col              = $cell->getColumn();
						$row_image_width  = $this->settings['row_images_width'];
						$row_image_height = $this->settings['row_images_height'];


						$sheet->getColumnDimension( $col )->setWidth( $row_image_width );
						$sheet->getRowDimension( $row )->setRowHeight( $row_image_height );

						$objDrawing->setResizeProportional( false ); // ignore proportional
						$objDrawing->setWidth( $row_image_width );                 //set width, height
						$objDrawing->setHeight( $row_image_height );

						$objDrawing->setWorksheet( $sheet );  //save
						$cell->setValue("");
					}
				}
			}

			do_action( 'woe_xls_print_footer', $this->objPHPExcel, $this );
			$objWriter = PHPExcel_IOFactory::createWriter( $this->objPHPExcel,
				$this->settings['use_xls_format'] ? 'Excel5' : 'Excel2007' );
			$objWriter->save( $this->filename );

			$this->storage->close();
            $this->storage->delete();
		}
	}

	public function convert_php_date_format( $date_format ) {
		$replacements = array(
			//Day
			'd' => 'dd',
			'D' => 'ddd',
			'j' => 'd',
			'l' => 'dddd',
			//Month
			'F' => 'mmmm',
			'm' => 'mm',
			'M' => 'mmm',
			'n' => 'm',
			//Year
			'Y' => 'yyyy',
			'y' => 'yy',
			// Time
			'A' => 'am/pm',
			'a' => 'am/pm',
			'G' => 'hh',
			'g' => 'h',//1-12
			'H' => 'hh',
			'h' => 'h',//1-12
			'i' => 'mm',
			's' => 'ss',
		);

		return strtr( $date_format, $replacements );
	}

	public function fromArray($sheet, $source = null, $nullValue = null, $startCell = 'A1', $strictNullComparison = false)
    {
        if (is_array($source)) {
            //    Convert a 1-D array to 2-D (for ease of looping)
            if (!is_array(end($source))) {
                $source = array($source);
            }

            // start coordinate
            list ($startColumn, $startRow) = PHPExcel_Cell::coordinateFromString($startCell);

            $stored_columns = $this->storage->getColumns();
            // Loop through $source
            foreach ($source as $rowData) {
                $currentColumn = $startColumn;

				WC_Order_Export_Engine::$order_id = array_pop( $rowData );
				
                foreach ($rowData as $cellValue) {
                
					$columnIndex = PHPExcel_Cell::columnIndexFromString( $currentColumn ) - 1;

					if( isset($stored_columns[$columnIndex]) )
						$column = $stored_columns[$columnIndex];
					else {	
						$column = new WOE_Formatter_Storage_Column();
						$column->setKey( "unnamed_".$columnIndex);
					}	

					if ( $column->getMetaItem("date") === true ) {
						if ( $cellValue ) {
							if ( empty( $this->settings['global_job_settings']['time_format'] ) ) { // must remove time!
								if ( WOE_Formatter::is_valid_time_stamp( $cellValue ) ) {
									$cellValue = date( "Y-m-d", $cellValue );
								} else {
									$cellValue = date( "Y-m-d", strtotime( $cellValue ) );
								}
							}
							try {
								$cellValue = PHPExcel_Shared_Date::PHPToExcel( new DateTime( $cellValue ) );
							} catch (Exception $e) {}
						}
					}
                    if ($strictNullComparison) {
                        if ($cellValue !== $nullValue) {
                            // Set cell value
							if ( $this->string_format_force OR $column->getMetaItem("string") OR
							$column->getMetaItem("link") ) {
								$sheet->getCell($currentColumn . $startRow)->setValueExplicit($cellValue);
							} else {
                            	$sheet->getCell($currentColumn . $startRow)->setValue($cellValue);
							}
                        }
                    } else {
                        if ($cellValue != $nullValue) {
                            // Set cell value
                            if ( $this->string_format_force OR $column->getMetaItem("string") OR
							$column->getMetaItem("link") ) {
								$sheet->getCell($currentColumn . $startRow)->setValueExplicit($cellValue);
							} else {
                            	$sheet->getCell($currentColumn . $startRow)->setValue($cellValue);
							}
                        }
                    }
					do_action( "woe_xls_format_cell", $this, $column->getKey(), $cellValue, $rowData, $columnIndex );
                    ++$currentColumn;
                }
                ++$startRow;
				++$this->last_row;
            }
        } else {
            throw new PHPExcel_Exception("Parameter \$source should be an array.");
        }
        return $this;
    }
}
