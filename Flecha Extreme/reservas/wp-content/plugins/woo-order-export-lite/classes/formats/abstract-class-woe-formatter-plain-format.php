<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

require_once 'trait-woe-plain-format.php';

abstract class WOE_Formatter_Plain_Format extends WOE_Formatter {
	use WOE_Order_Export_Plain_Format;
	private $duplicate_settings = array();
	protected $summary_report_products;
	protected $summary_report_customers;
	protected $rows;
	var $encoding;

	protected $summary_processing = false;

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
		parent::__construct( $mode, $filename, $settings, $format, $labels, $field_formats, $date_format, $offset );
		$this->duplicate_settings = $this->settings['global_job_settings']['duplicated_fields_settings'];
		$this->summary_report_products  = $this->settings['global_job_settings']['summary_report_by_products'];
		$this->summary_report_customers = $this->settings['global_job_settings']['summary_report_by_customers'];
		if ( $this->summary_report_products ) {
			self::check_create_session();
			$this->field_formats["order"] = isset($this->field_formats["products"]) ? $this->field_formats["products"] : array() ;// Products at top level!
		}

		if ( $this->summary_report_customers ) {
			self::check_create_session();
		}

		$this->summary_processing = false; //true only when we finish order scan
		$this->encoding  = isset( $this->settings['encoding'] ) ? $this->settings['encoding'] : '';
		if ( isset( $this->settings['add_utf8_bom'] ) && $this->settings['add_utf8_bom'] ) {
			$this->encoding = "UTF-8";
		}
	}
	
	// calculate max columns based on order items
	public function adjust_duplicated_fields_settings( $order_ids, $make_mode = '', $settings = array() ) {
		if( $this->duplicate_settings['products']['repeat'] == 'columns' AND $this->duplicate_settings['products']['max_cols'] == 0 ) {
			if( isset( $make_mode ) && $make_mode == 'partial' && isset( $settings['max_line_items'] ) ) {
				$this->duplicate_settings['products']['max_cols'] = $settings['max_line_items'];
			} else {
				$this->duplicate_settings['products']['max_cols'] = WC_Order_Export_Data_Extractor::get_max_order_items( "line_item", $order_ids );
			}
		}
		if( $this->duplicate_settings['coupons']['repeat'] == 'columns' AND $this->duplicate_settings['coupons']['max_cols'] == 0 ) {
			if( isset( $make_mode ) && $make_mode == 'partial' && isset( $settings['max_coupons'] ) ) {
				$this->duplicate_settings['coupons']['max_cols'] = $settings['max_coupons'];
			} else {
				$this->duplicate_settings['coupons']['max_cols'] = WC_Order_Export_Data_Extractor::get_max_order_items( "coupon", $order_ids );
			}
		}
	}

	public function output( $rec ) {
		//don't output orders in summary mode!
		if ( $this->summary_report_products AND ! $this->summary_processing ) {
			$this->try_fill_summary_report_products_fields( $rec );

			return array();
		}

		if ( $this->summary_report_customers AND ! $this->summary_processing ) {
			$this->try_fill_summary_report_customers_fields( $rec, WC_Order_Export_Engine::$order_id );

			return array();
		}

		$rec = parent::output( $rec );
		if ( $this->summary_processing ) {
			return array( $rec ); // need array for plain format iterators
		}

		return apply_filters( 'woe_fetch_order_data', $this->maybe_multiple_fields( $rec ) );
	}

	protected function maybe_multiple_fields( $rec ) {
		//get modes 
		$products_repeat = $this->duplicate_settings['products']['repeat'];
		$coupons_repeat  = $this->duplicate_settings['coupons']['repeat'];

		$tmp_rec = array();
		foreach ( $this->labels['order']->get_labels() as $label_data ) {
			$original_key = $label_data['key'];
			$key          = $label_data['parent_key'] ? $label_data['parent_key'] : $original_key;

			$tmp_rec[ $original_key ] = isset( $rec[ $key ] ) ? $rec[ $key ] : "";
		}
		$rec = $tmp_rec;


		//simpleast 
		if ( $products_repeat == 'inside_one_cell' ) {
			$rec = $this->merge_nested_rows_to_one_record( $rec, 'products' );
		}
		if ( $coupons_repeat == 'inside_one_cell' ) {
			$rec = $this->merge_nested_rows_to_one_record( $rec, 'coupons' );
		}

		//more complex 
		$repeat_as_cols = array();
		if ( $products_repeat == 'columns' ) {
			$repeat_as_cols[] = 'products';
		}
		if ( $coupons_repeat == 'columns' ) {
			$repeat_as_cols[] = 'coupons';
		}
		if ( $repeat_as_cols ) {
			$rec = $this->add_nested_rows_as_columns( $rec, $repeat_as_cols );
		}

		//we still have one records at this point!
		if ( $products_repeat == 'rows' || $coupons_repeat == 'rows' ) {
			$new_rows = $this->try_multi_rows( $rec );
			//var_dump($new_rows ); die();
		} else {
			$new_rows = array( $rec );
		}

		foreach ( $new_rows as $index => &$row ) {
			if ( isset( $row['products'] ) ) {
				unset( $row['products'] );
			}
			if ( isset( $row['coupons'] ) ) {
				unset( $row['coupons'] );
			}
			if ( isset( $row['line_number'] ) && $index > 0 ) {
				$row['line_number'] = $this->counter_value;
				foreach( $row as $k=>$v ) {
					if( preg_match("#^line_number_\d+$#",$k) )
						$row[$k] = $row['line_number'];
				}
				$this->counter_value ++;
			}

//			json for complex structures, don't encode nested products&coupons
			foreach ( $row as $key => &$val ) {
				if ( is_array( $val ) ) {
					$val = json_encode( $val );
				}
			}
		}

		return ( $new_rows );
	}


	protected function make_header( $data = '' ) {
		$header             = array();
		$repeat['products'] = $this->duplicate_settings['products']['repeat'];
		$repeat['coupons']  = $this->duplicate_settings['coupons']['repeat'];

		$item_rows_start_from_new_line = ( $this->format == 'csv' && $this->settings['global_job_settings']['format_csv_item_rows_start_from_new_line'] ||
											$this->format == 'tsv' && $this->settings['global_job_settings']['format_tsv_item_rows_start_from_new_line'] );

		if ( $this->summary_report_products ) {
			return $this->make_summary_products_header( $data );
		}

		if ( $this->summary_report_customers ) {
			return $this->make_summary_customers_header( $data );
		}

		$group_fields       = array(
			'products' => array(),
			'coupons'  => array(),
		);
		$current_group_type = "";

		foreach ( $this->labels['order']->to_Array() as $field => $label ) {
			//should ignore start of 1st product/coupon section
			if ( $field == 'products' OR $field == 'coupons' ) {
				continue;
			}

			$prev_group_type = $current_group_type;
			$added_to_group  = false;

			if ( preg_match( '/^plain_(products|coupons)_.+/', $field, $matches ) ) {
				if ( $item_rows_start_from_new_line ) {
					continue;
				}
				$type               = $matches[1];
				$current_group_type = $type;
				if ( 'columns' == $repeat[ $type ] ) {
					$group_fields[ $type ][] = $field;
					$added_to_group          = true;
				}
			} else {
				$current_group_type = 'order';
			}

			// previously we get product/coupon fields?
			if ( $prev_group_type !== $current_group_type AND ! empty( $group_fields[ $prev_group_type ] ) ) {
				$this->multiplicate_header( $header, $prev_group_type, $group_fields[ $prev_group_type ] );
				$group_fields[ $prev_group_type ] = array();
			}

			if ( ! $added_to_group ) {
				// TODO create filter
				$header[] = $label;

			}
		}

		//have groups at the end ?
		foreach ( $group_fields as $group_type => $fields ) {
			if ( ! empty( $fields ) ) {
				$this->multiplicate_header( $header, $group_type, $fields );
			}
		}

		do_action( 'woe_make_header_custom_formatter', $this->labels );// BUG: wrong hook

		return $header;
	}

	private function multiplicate_header( &$header, $type, $grouped_headers ) {
		$multiply_fields = array();
		$this->multiplicate_fields( $multiply_fields, $type, array(), $grouped_headers );
		foreach ( array_keys( $multiply_fields ) as $multiply_field ) {
			if ( preg_match( '/^plain_' . $type . '_(.+)_(\d+)/', $multiply_field, $matches ) ) {
				$segment_field = $matches[1];
				$index         = $matches[2];
				$header_tmp    = $this->labels[ $type ]->$segment_field;

				$header[] = apply_filters( 'woe_add_csv_headers', $header_tmp['label'] . ' #' . $index,
					$multiply_field );
			}
		}

	}

	//Summary report started here!

	private static function check_create_session() {
		if ( ! session_id() ) {
			@session_start();
		}
	}

	protected function make_summary_products_header( $data = '' ) {
		$header = array();
		self::check_create_session();
		$_SESSION['woe_summary_products'] = array();

		if( empty($this->labels['products']) ) // error , no product fields?!
			return array(); 
			
		foreach ( $this->labels['products']->get_labels() as $label_data ) {
			$field_header = $label_data['label'];
			$key          = $label_data['key'];

			$field_header = apply_filters( 'woe_add_csv_headers', $field_header, $key );
			if ( ! preg_match( '#^(line_|qty)#', $label_data['key'] ) ) {
				$header[] = $field_header;
			} else {
				unset( $this->labels['products']->$key );
			}
		}

		return apply_filters( 'woe_summary_products_headers', $header );
	}

	private function try_fill_summary_report_products_fields( $row ) {
		$order = false;

		foreach ( self::get_array_from_array( $row, 'products' ) as $item_id => $item ) {
			$product_item = new WC_Order_Item_Product( $item_id );
			$product      = $product_item->get_product();
			$item_meta = get_metadata( 'order_item', $item_id );
			if ( ! $order ) {
				$order = new WC_Order( $product_item->get_order_id() );
			}
			
			if( $product )
				$key = $product->get_id();
			elseif( isset($item_meta['_variation_id'][0]) )
				$key = $item_meta['_variation_id'][0] ? $item_meta['_variation_id'][0] : $item_meta['_product_id'][0];
			else
				$key = $item_id;
			$key = apply_filters( "woe_summary_products_adjust_key", $key, $product, $product_item, $order, $item );

			//add new product 
			if ( ! isset( $_SESSION['woe_summary_products'][ $key ] ) ) {
				$new_row = array();
				foreach ( $this->labels['products']->get_labels() as $label_data ) {
					$original_key = $label_data['key'];
					if ( preg_match( '#^(line_|qty)#', $original_key ) )//skip item values!
					{
						continue;
					}
					$field_key = $label_data['parent_key'] ? $label_data['parent_key'] : $original_key;
					if ( preg_match( '#^summary_report_total_#', $field_key ) ) {
						$new_row[ $original_key ] = 0;
					}//total fields
					else {
						$value = $item[ $field_key ];
						if ( $this->mode == 'preview' && ! empty( $this->image_format_fields ) && $this->field_format_is( $field_key, $this->image_format_fields ) ) {
							$value = $this->make_img_html_from_path(
								$value,
								$this->settings['row_images_width'] * 5,
								$this->settings['row_images_height'] * 5
							);
							$value = $value ? $value : "";
						}

						$new_row[ $original_key ] = $value;
					}  // already calculated
				}
				$new_row                                  = apply_filters( 'woe_summary_column_keys',
					$new_row );// legacy hook
				$new_row                                  = apply_filters( "woe_summary_products_prepare_product",
					$new_row, $key, $product, $product_item, $order,$item );
				$_SESSION['woe_summary_products'][ $key ] = $new_row;
			}

			//increase totals 
			if ( isset( $_SESSION['woe_summary_products'][ $key ]['summary_report_total_qty'] ) ) {
				$_SESSION['woe_summary_products'][ $key ]['summary_report_total_qty'] += $product_item->get_quantity();
			}
			
			if ( isset( $_SESSION['woe_summary_products'][ $key ]['summary_report_total_weight'] ) AND $product ) { // only if product exists! 
				$_SESSION['woe_summary_products'][ $key ]['summary_report_total_weight'] += $product_item->get_quantity() * (float)$product->get_weight();
			}

			if ( isset( $_SESSION['woe_summary_products'][ $key ]['summary_report_total_amount'] ) ) {
				$total                                                                   = method_exists( $product_item,
					'get_total' ) ? $product_item->get_total() : $product_item['line_total'];
				$_SESSION['woe_summary_products'][ $key ]['summary_report_total_amount'] += wc_round_tax_total( $total );
			}

			if ( isset( $_SESSION['woe_summary_products'][ $key ]['summary_report_total_discount'] ) ) {
				$total = $product_item->get_subtotal() - $product_item->get_total();
				$_SESSION['woe_summary_products'][ $key ]['summary_report_total_discount'] += wc_round_tax_total( $total );
			}

			if ( isset( $_SESSION['woe_summary_products'][ $key ]['summary_report_total_refund_count'] ) ) {
				$_SESSION['woe_summary_products'][ $key ]['summary_report_total_refund_count'] += abs( $order->get_qty_refunded_for_item($item_id) );
			}

			if ( isset( $_SESSION['woe_summary_products'][ $key ]['summary_report_total_refund_amount'] ) ) {
				$total = $order->get_total_refunded_for_item($item_id);
				$_SESSION['woe_summary_products'][ $key ]['summary_report_total_refund_amount'] += wc_round_tax_total( $total );
			}

			do_action( "woe_summary_products_add_item", $key, $product_item, $order, $item );
		}
		do_action( "woe_summary_products_added_order", $order );

		//no lines for order!
		return array();
	}

	protected function try_apply_summary_report_fields() {
		if ( $this->summary_report_products ) {
			$this->summary_processing = true;

			//sort by name 
			$first_row = reset( $_SESSION['woe_summary_products'] );
			if ( isset( $first_row['name'] ) ) {
				uasort( $_SESSION['woe_summary_products'], function ( $a, $b ) {
					return strcmp( $a['name'], $b['name'] );
				} );
			}

			do_action( 'woe_summary_before_output' );
			if ( $this->mode == 'preview' ) {
				if ( empty( $this->rows ) ) // no headers!
				{
					$this->rows = array();
				}
				$this->rows += $_SESSION['woe_summary_products'];
				// reset non-numerical indexes -- 0 will be bold in preview
				$this->rows = array_values($this->rows);
			} else {
				foreach ( $_SESSION['woe_summary_products'] as $item ) {
					$this->output( $item );
				}
			}
		}

		if ( $this->summary_report_customers ) {
			$this->summary_processing = true;

			//sort by name
			$first_row = reset( $_SESSION['woe_summary_customers'] );
			if ( isset( $first_row['name'] ) ) {
				uasort( $_SESSION['woe_summary_customers'], function ( $a, $b ) {
					return strcmp( $a['name'], $b['name'] );
				} );
			}

			do_action( 'woe_summary_before_output' );
			if ( $this->mode == 'preview' ) {
				if ( empty( $this->rows ) ) // no headers!
				{
					$this->rows = array();
				}
				$this->rows += $_SESSION['woe_summary_customers'];
				// reset non-numerical indexes -- 0 will be bold in preview
				$this->rows = array_values($this->rows);
			} else {
				foreach ( $_SESSION['woe_summary_customers'] as $item ) {
					$this->output( $item );
				}
			}
		}
	}

	protected function make_summary_customers_header( $data = '' ) {
		$header = array();
		self::check_create_session();
		$_SESSION['woe_summary_customers'] = array();

		if( empty($this->labels['order']) ) // error , no product fields?!
			return array();

		$allowed_fields = WC_Order_Export_Data_Extractor_UI::get_order_fields(
		    $this->settings['global_job_settings']['format'],
		    array('user', 'billing', 'shipping')
		);

		foreach ( $this->labels['order']->get_labels() as $label_data ) {
			$field_header = $label_data['label'];
			$key          = $label_data['key'];

			$field_header = apply_filters( 'woe_add_csv_headers', $field_header, $key );
			if ( isset($allowed_fields[$key]) || 
				preg_match( '^\\AUSER_.+^', $key ) || 
				preg_match( '^\\A_billing_.+^', $key ) ||
				preg_match( '^\\A_shipping_.+^', $key ) ||
				preg_match( '^\\Astatic_field.+^', $key ) ) {
				$header[] = $field_header;
			} else {
				unset( $this->labels['order']->$key ); //here added filed is deleted
			}
		}

		return apply_filters( 'woe_summary_customers_headers', $header );
	}

	private function try_fill_summary_report_customers_fields( $row, $order_id ) {

		$order = new WC_Order( $order_id );

		$key = $order->get_billing_email();
		$key = apply_filters( "woe_summary_customers_adjust_key", $key, $order );

		$allowed_fields = WC_Order_Export_Data_Extractor_UI::get_order_fields(
		    $this->settings['global_job_settings']['format'],
		    array('user', 'billing', 'shipping')
		);

		//add new product
		if ( ! isset( $_SESSION['woe_summary_customers'][ $key ] ) ) {
			$new_row = array();
			foreach ( $this->labels['order']->get_labels() as $label_data ) {
				$original_key = $label_data['key'];
				if ( ! isset( $allowed_fields[$original_key] ) && 
				! preg_match( '^\\AUSER_.+^', $original_key ) && 
				! preg_match( '^\\A_billing_.+^', $original_key ) &&
				! preg_match( '^\\A_shipping_.+^', $original_key) &&
				! preg_match( '^\\Astatic_field.+^', $original_key ) ) {
				    continue;
				}
				$field_key = $label_data['parent_key'] ? $label_data['parent_key'] : $original_key;
				if ( preg_match( '#^summary_report_total_#', $field_key ) ) {
					$new_row[ $original_key ] = 0;
				}//total fields
				else {
					$value = $row[ $field_key ];
					if ( $this->mode == 'preview' && ! empty( $this->image_format_fields ) && $this->field_format_is( $field_key, $this->image_format_fields ) ) {
						$value = $this->make_img_html_from_path(
							$value,
							$this->settings['row_images_width'] * 5,
							$this->settings['row_images_height'] * 5
						);
						$value = $value ? $value : "";
					}

					$new_row[ $original_key ] = $value;
				}  // already calculated
			}
			$new_row                                  = apply_filters( 'woe_summary_column_keys',
				$new_row );// legacy hook
			$new_row                                  = apply_filters( "woe_summary_customers_prepare_row",
				$new_row, $key, $order );
			$_SESSION['woe_summary_customers'][ $key ] = $new_row;
		}

		//increase totals
		if ( isset( $_SESSION['woe_summary_customers'][ $key ]['summary_report_total_count'] ) ) {
			$_SESSION['woe_summary_customers'][ $key ]['summary_report_total_count']++;
		}
		
		if ( isset( $_SESSION['woe_summary_customers'][ $key ]['summary_report_total_count_items'] ) ) {
			$_SESSION['woe_summary_customers'][ $key ]['summary_report_total_count_items'] += $order->get_item_count();
		}
		
		if ( isset( $_SESSION['woe_summary_customers'][ $key ]['summary_report_total_count_items_exported'] ) ) {
			if( empty( WC_Order_Export_Engine::$extractor_options['include_products']) ) {
				$_SESSION['woe_summary_customers'][ $key ]['summary_report_total_count_items_exported'] += $order->get_item_count(); // can add all items
			} else {
				$export_only_products = WC_Order_Export_Engine::$extractor_options['include_products'];
				$exported_items = 0;
				foreach ( $order->get_items( 'line_item') as $item ) {
					if ( $export_only_products AND
						! in_array( $item['product_id'], $export_only_products ) AND // not  product
						( ! $item['variation_id'] OR ! in_array( $item['variation_id'],
								$export_only_products ) )  // not variation
					) {
						continue;
					}				
					//OK, item was exported 
					$exported_items += $item->get_quantity();
				}
				$_SESSION['woe_summary_customers'][ $key ]['summary_report_total_count_items_exported'] += $exported_items; 
			}	
		}

		if ( isset( $_SESSION['woe_summary_customers'][ $key ]['summary_report_total_sum_items_exported'] ) ) {
			if( empty( WC_Order_Export_Engine::$extractor_options['include_products']) ) {
				$export_only_products = false;
			} else {
				$export_only_products = WC_Order_Export_Engine::$extractor_options['include_products'];
			}
			$exported_items_total = 0;
			foreach ( $order->get_items( 'line_item') as $item ) {
				if ( $export_only_products AND
					! in_array( $item['product_id'], $export_only_products ) AND // not  product
					( ! $item['variation_id'] OR ! in_array( $item['variation_id'],
							$export_only_products ) )  // not variation
				) {
					continue;
				}				
				//OK, item was exported 
				$exported_items_total += wc_round_tax_total($item->get_total());
			}
			$_SESSION['woe_summary_customers'][ $key ]['summary_report_total_sum_items_exported'] += $exported_items_total; 	
		}

		if ( isset( $_SESSION['woe_summary_customers'][ $key ]['summary_report_total_amount'] ) ) {
			$_SESSION['woe_summary_customers'][ $key ]['summary_report_total_amount'] += wc_round_tax_total( $order->get_total() );
		}

		if ( isset( $_SESSION['woe_summary_customers'][ $key ]['summary_report_total_amount_paid'] ) ) {
			$_SESSION['woe_summary_customers'][ $key ]['summary_report_total_amount_paid'] += $order->is_paid() ? wc_round_tax_total( $order->get_total() ) : 0;
		}

		if ( isset( $_SESSION['woe_summary_customers'][ $key ]['summary_report_total_shipping'] ) ) {
			$_SESSION['woe_summary_customers'][ $key ]['summary_report_total_shipping'] += wc_round_tax_total( $order->get_shipping_total() );
		}
		
		if ( isset( $_SESSION['woe_summary_customers'][ $key ]['summary_report_total_discount'] ) ) {
			$_SESSION['woe_summary_customers'][ $key ]['summary_report_total_discount'] += wc_round_tax_total( $order->get_discount_total() );
		}

		if ( isset( $_SESSION['woe_summary_customers'][ $key ]['summary_report_total_refund_count'] ) ) {
			$_SESSION['woe_summary_customers'][ $key ]['summary_report_total_refund_count'] += $order->get_status() == 'wc-refunded' ? 1 : 0;
		}

		if ( isset( $_SESSION['woe_summary_customers'][ $key ]['summary_report_total_refund_amount'] ) ) {
			$_SESSION['woe_summary_customers'][ $key ]['summary_report_total_refund_amount'] += wc_round_tax_total( $order->get_total_refunded() );
		}

		if( isset( $_SESSION['woe_summary_customers'][ $key ]['summary_report_total_tax_amount'] ) ) {
			$_SESSION['woe_summary_customers'][ $key ]['summary_report_total_tax_amount'] += wc_round_tax_total( $order->get_total_tax() );
		}

		if ( isset( $_SESSION['woe_summary_customers'][ $key ]['summary_report_total_fee_amount'] ) ) {
			$fees = 0;

			if ( method_exists( $order, 'get_total_fees' ) ) {
				$fees = $order->get_total_fees();
			} else if ( method_exists( $order, 'calculate_fees' ) ) {
				$fees = $order->calculate_fees();
			}

			$_SESSION['woe_summary_customers'][ $key ]['summary_report_total_fee_amount'] += wc_round_tax_total( $fees );
		}

		do_action( "woe_summary_customers_add_item", $key, $order, $row );

		//no lines for order!
		return array();
	}

	protected function field_format_is( $field, $format_fields ) {
		if ( in_array( $field, $format_fields, true ) ) {
			return true;
		}
		if ( preg_match( '#^(.+?)_\d+$#', $field, $duplicated_field ) ) {
			return in_array( $duplicated_field[1], $format_fields );
		}

		return false;
	}

	protected function get_tmp_data_transient_name() {
		return 'woe_tmp_data_' . $this->filename;
	}

	public function get_duplicate_settings() {
		return $this->duplicate_settings;
	}

	protected function make_img_html_from_path( $path, $width = null, $height = null, $clickable = false ) {
		$uploads_dir = wp_upload_dir();

		if ( $this->mode === 'preview' ) {
			$width = 75;
			$height = 75;
		}

		if ( ! $uploads_dir || ! isset( $uploads_dir['basedir'], $uploads_dir['baseurl'] ) ) {
			return false;
		}
		$hwstring = image_hwstring( $width, $height );

		$attr        = array();
		$src = str_replace( $uploads_dir['basedir'], $uploads_dir['baseurl'], $path );
		if ( ! $src ) {
			$src = wc_placeholder_img_src();
		}
		$attr['src'] = $src;
		
		$attr        = array_map( 'esc_attr', $attr );

		$html = rtrim( "<img $hwstring" );
		foreach ( $attr as $name => $value ) {
			$html .= " $name=" . '"' . $value . '"';
		}
		$html .= ' />';

		if ( $clickable ) {
			$html = "<a href='$src'>$html</a>";
		}

		return $html;
	}

	public function insertRowAndSave($row)
    {
        if ( $row instanceof WOE_Formatter_Storage_Row ) {
            if ($this->summary_report_products) {
                $this->saveSummaryProductsData($row);
            } elseif ($this->summary_report_customers) {
                $this->saveSummaryCustomersData($row);
            } else {
				$this->storage->insertRowAndSave($row);
			}
        }
    }

	/**
	 * @param WOE_Formatter_Storage_Row $rowObj
	 */
	protected function saveSummaryProductsData( $rowObj ) { //this summary method works with storage (for xls/pdf)
		if(!$this instanceof WOE_Formatter_PDF && !$this instanceof WOE_Formatter_Xls) {
			return;
		}
		$order = false;
		$row = $rowObj->getData();

		foreach ( self::get_array_from_array( $row, 'products' ) as $item_id => $item ) {
			$product_item = new WC_Order_Item_Product( $item_id );
			$product      = $product_item->get_product();
			$item_meta = get_metadata( 'order_item', $item_id );
			if ( ! $order ) {
				$order = new WC_Order( $product_item->get_order_id() );
			}
			
			if( $product )
				$key = $product->get_id();
			elseif( isset($item_meta['_variation_id'][0]) )
				$key = $item_meta['_variation_id'][0] ? $item_meta['_variation_id'][0] : $item_meta['_product_id'][0];
			else
				$key = $item_id;
			$key = apply_filters( "woe_summary_products_adjust_key", $key, $product, $product_item, $order, $item );

			//add new product 
			if ( ! $this->storage->getRow($key) ) {
				$new_row = array();
				foreach ( $this->labels['products']->get_labels() as $label_data ) {
					$original_key = $label_data['key'];
					if ( preg_match( '#^(line_|qty)#', $original_key ) )//skip item values!
					{
						continue;
					}
					$field_key = $label_data['parent_key'] ? $label_data['parent_key'] : $original_key;
					if ( preg_match( '#^summary_report_total_#', $field_key ) ) {
						$new_row[ $original_key ] = 0;
					}//total fields
					else {
						$value = $item[ $field_key ];
						$new_row[ $original_key ] = $value;
					}  // already calculated
				}
				$new_row                                  = apply_filters( 'woe_summary_column_keys',
					$new_row );// legacy hook
				$new_row                                  = apply_filters( "woe_summary_products_prepare_product",
					$new_row, $key, $product, $product_item, $order,$item );
				$newRowObj = new WOE_Formatter_Storage_Row();
				$newRowObj->setData($new_row);
				$newRowObj->setMeta($rowObj->getMeta());
				$newRowObj->setKey($key);
				$this->storage->setRow($newRowObj);
			}
			$storageRowObj = $this->storage->getRow($key);
			$storageData = $storageRowObj->getData();

			//increase totals 
			if ( isset( $storageData['summary_report_total_qty'] ) ) {
				$storageData['summary_report_total_qty'] += $product_item->get_quantity();
			}
			
			if ( isset( $storageData['summary_report_total_weight'] ) AND $product ) { // only if product exists! 
				$storageData['summary_report_total_weight'] += $product_item->get_quantity() * (float)$product->get_weight();
			}

			if ( isset( $storageData['summary_report_total_amount'] ) ) {
				$total                                                                   = method_exists( $product_item,
					'get_total' ) ? $product_item->get_total() : $product_item['line_total'];
				$storageData['summary_report_total_amount'] += wc_round_tax_total( $total );
			}

			if ( isset( $storageData['summary_report_total_discount'] ) ) {
				$total = $product_item->get_subtotal() - $product_item->get_total();
				$storageData['summary_report_total_discount'] += wc_round_tax_total( $total );
			}

			if ( isset( $storageData['summary_report_total_refund_count'] ) ) {
				$storageData['summary_report_total_refund_count'] += abs( $order->get_qty_refunded_for_item($item_id) );
			}

			if ( isset( $storageData['summary_report_total_refund_amount'] ) ) {
				$total = $order->get_total_refunded_for_item($item_id);
				$storageData['summary_report_total_refund_amount'] += wc_round_tax_total( $total );
			}

			$storageRowObj->setData($storageData);
			$this->storage->setRow($storageRowObj);

			do_action( "woe_summary_products_add_item", $key, $product_item, $order, $item );
		}
		do_action( "woe_summary_products_added_order", $order );
	}

	protected function saveSummaryCustomersData( $rowObj ) { //this summary method works with storage (for xls/pdf)
		if(!$this instanceof WOE_Formatter_PDF && !$this instanceof WOE_Formatter_Xls) {
			return;
		}
		$order_id = $rowObj->getMetaItem('order_id');
		$order = new WC_Order( $order_id );
		$row = $rowObj->getData();

		$key = $order->get_billing_email();
		$key = apply_filters( "woe_summary_customers_adjust_key", $key, $order );

		$allowed_fields = WC_Order_Export_Data_Extractor_UI::get_order_fields(
		    $this->settings['global_job_settings']['format'],
		    array('user', 'billing', 'shipping')
		);

		//add new product
		if ( ! $this->storage->getRow($key) ) {
			$new_row = array();
			foreach ( $this->labels['order']->get_labels() as $label_data ) {
				$original_key = $label_data['key'];
				if ( ! isset( $allowed_fields[$original_key] ) && 
				! preg_match( '^\\AUSER_.+^', $original_key ) && 
				! preg_match( '^\\A_billing_.+^', $original_key ) &&
				! preg_match( '^\\A_shipping_.+^', $original_key) &&
				! preg_match( '^\\Astatic_field.+^', $original_key ) ) {
				    continue;
				}
				$field_key = $label_data['parent_key'] ? $label_data['parent_key'] : $original_key;
				if ( preg_match( '#^summary_report_total_#', $field_key ) ) {
					$new_row[ $original_key ] = 0;
				}//total fields
				else {
					$value = $row[ $field_key ];
					$new_row[ $original_key ] = $value;
				}  // already calculated
			}
			$new_row                                  = apply_filters( 'woe_summary_column_keys',
				$new_row );// legacy hook
			$new_row                                  = apply_filters( "woe_summary_customers_prepare_row",
				$new_row, $key, $order );
			$newRowObj = new WOE_Formatter_Storage_Row();
			$newRowObj->setData($new_row);
			$newRowObj->setMeta($rowObj->getMeta());
			$newRowObj->setKey($key);
			$this->storage->setRow($newRowObj);
		}
		$storageRowObj = $this->storage->getRow($key);
		$storageData = $storageRowObj->getData();

		//increase totals
		if ( isset( $storageData['summary_report_total_count'] ) ) {
			$storageData['summary_report_total_count']++;
		}
		
		if ( isset( $storageData['summary_report_total_count_items'] ) ) {
			$storageData['summary_report_total_count_items'] += $order->get_item_count();
		}
		
		if ( isset( $storageData['summary_report_total_count_items_exported'] ) ) {
			if( empty( WC_Order_Export_Engine::$extractor_options['include_products']) ) {
				$storageData['summary_report_total_count_items_exported'] += $order->get_item_count(); // can add all items
			} else {
				$export_only_products = WC_Order_Export_Engine::$extractor_options['include_products'];
				$exported_items = 0;
				foreach ( $order->get_items( 'line_item') as $item ) {
					if ( $export_only_products AND
						! in_array( $item['product_id'], $export_only_products ) AND // not  product
						( ! $item['variation_id'] OR ! in_array( $item['variation_id'],
								$export_only_products ) )  // not variation
					) {
						continue;
					}				
					//OK, item was exported 
					$exported_items += $item->get_quantity();
				}
				$storageData['summary_report_total_count_items_exported'] += $exported_items; 
			}	
		}

		if ( isset( $storageData['summary_report_total_amount'] ) ) {
			$storageData['summary_report_total_amount'] += wc_round_tax_total( $order->get_total() );
		}

		if ( isset( $storageData['summary_report_total_amount_paid'] ) ) {
			$storageData['summary_report_total_amount_paid'] += $order->is_paid() ? wc_round_tax_total( $order->get_total() ) : 0;
		}

		if ( isset( $storageData['summary_report_total_shipping'] ) ) {
			$storageData['summary_report_total_shipping'] += wc_round_tax_total( $order->get_shipping_total() );
		}
		
		if ( isset( $storageData['summary_report_total_discount'] ) ) {
			$storageData['summary_report_total_discount'] += wc_round_tax_total( $order->get_discount_total() );
		}

		if ( isset( $storageData['summary_report_total_refund_count'] ) ) {
			$storageData['summary_report_total_refund_count'] += $order->get_status() == 'wc-refunded' ? 1 : 0;
		}

		if ( isset( $storageData['summary_report_total_refund_amount'] ) ) {
			$storageData['summary_report_total_refund_amount'] += wc_round_tax_total( $order->get_total_refunded() );
		}

		if( isset( $storageData['summary_report_total_tax_amount'] ) ) {
			$storageData['summary_report_total_tax_amount'] += wc_round_tax_total( $order->get_total_tax() );
		}

		if ( isset( $storageData['summary_report_total_fee_amount'] ) ) {
			$fees = 0;

			if ( method_exists( $order, 'get_total_fees' ) ) {
				$fees = $order->get_total_fees();
			} else if ( method_exists( $order, 'calculate_fees' ) ) {
				$fees = $order->calculate_fees();
			}

			$storageData['summary_report_total_fee_amount'] += wc_round_tax_total( $fees );
		}

		$storageRowObj->setData($storageData);
		$this->storage->setRow($storageRowObj);

		do_action( "woe_summary_customers_add_item", $key, $order, $row );
	}

	protected function extractRowForHeaderProcess($rows) {
		$row = reset($rows);
		if ($this->summary_report_products) {
			$products_row = self::get_array_from_array($row, 'products');
			$product_row = reset($products_row);
			$product_labels = $this->labels['products']->get_labels();
			$row = array_filter($product_row, function($field_key) use ($product_labels) {
				foreach ( $product_labels as $label_data ) {
					$label_key = $label_data['parent_key'] ? $label_data['parent_key'] : $label_data['key'];
					if ( $field_key == $label_key ) {
						return true;
					}
				}
				return false;
			}, ARRAY_FILTER_USE_KEY);
			return $row;
		}
		if ($this->summary_report_customers) {
			$allowed_fields = WC_Order_Export_Data_Extractor_UI::get_order_fields(
				$this->format,
				array('user', 'billing', 'shipping')
			);
			$order_lables = $this->labels['order']->get_labels();
			$row = array_filter($row, function($field_key) use ($allowed_fields, $order_lables) {
				foreach ( $order_lables as $label_data ) {
					$label_key = $label_data['parent_key'] ? $label_data['parent_key'] : $label_data['key'];
					$original_key = $label_data['key'];
					if ( $field_key == $label_key &&
					(isset( $allowed_fields[$original_key] ) || 
					preg_match( '^\\AUSER_.+^', $original_key ) || 
					preg_match( '^\\A_billing_.+^', $original_key ) ||
					preg_match( '^\\A_shipping_.+^', $original_key) ||
					preg_match( '^\\Astatic_field.+^', $original_key )) ) {
						return true;
					}
				}
				return false;
			}, ARRAY_FILTER_USE_KEY);
			return $row;
		}
		return $row;
	}

	protected function applyOutputRowFilter($row) {
		if ( $this->has_output_filter ) {
			$row = apply_filters( "woe_{$this->format}_output_filter", $row, $this );
		}
		return $row;
	}
}