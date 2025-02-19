<?php
class WC_Order_Export_Order_Fields {
	var $order;
	var $order_id;
	var $parent_order;
	var $order_status;
	var $order_meta;
	var $billing_country;
	var $shipping_country;
	var $billing_state;
	var $shipping_state;
	var $user;
	var $data;
	var $post;
	var $static_vals;
	var $options;
	var $export;

	public function __construct($order, $static_vals,
	$options, $export) {
		$this->static_vals = $static_vals;
		$this->options = $options;
		$this->export = $export;
		$this->order = $order;
		$this->order_id = method_exists( $this->order, 'get_id' ) ? $order->get_id() : $order->id;


		// get order meta
		$this->order_meta = array();
		if ( $order_post_meta = get_post_meta( $this->order_id ) ) {
			foreach ( $order_post_meta as $meta_key => $meta_values ) {
				if( apply_filters('woe_use_first_order_meta', false) )
					$this->order_meta[ $meta_key ] = array_shift( $meta_values );
				else
					$this->order_meta[ $meta_key ] = join( WC_Order_Export_Data_Extractor::$export_custom_fields_separator, $meta_values );
			}
		}

		

		// add fields for WC 3.0
		$billing_fields  = array( "billing_country", "billing_state" );
		$shipping_fields = array( "shipping_country", "shipping_state" );
		$fields_30       = array_merge( $billing_fields, $shipping_fields );
		foreach ( $fields_30 as $field_30 ) {
			$this->$field_30 = method_exists( $this->order,
				'get_' . $field_30 ) ? $this->order->{'get_' . $field_30}() : $this->order->$field_30;

		}

		$parent_order_id = method_exists( $this->order,
			'get_parent_id' ) ? $this->order->get_parent_id() : $this->order->post->post_parent;
		$this->parent_order    = $parent_order_id ? new WC_Order( $parent_order_id ) : false;
		$this->post            = method_exists( $this->order, 'get_id' ) ? get_post( $this->order->get_id() ) : $this->order->post;

		// correct meta for child orders
		if ( $parent_order_id ) {
			// overwrite child values for refunds
			$is_refund                  = ( $this->post->post_type == 'shop_order_refund' );
			$overwrite_child_order_meta = apply_filters( 'woe_overwrite_child_order_meta', $is_refund );

			if ( $parent_order_meta = get_post_meta( $parent_order_id ) ) {
				foreach ( $parent_order_meta as $meta_key => $meta_values ) {
					if ( $overwrite_child_order_meta OR ! isset( $this->order_meta[ $meta_key ] ) ) {
						$this->order_meta[ $meta_key ] = join( WC_Order_Export_Data_Extractor::$export_custom_fields_separator, $meta_values );
					}
				}
			}

			//refund rewrites it
			if ( $overwrite_child_order_meta ) {
				foreach ( $fields_30 as $field_30 ) {
					$this->$field_30 = method_exists( $this->parent_order,
						'get_' . $field_30 ) ? $this->parent_order->{'get_' . $field_30}() : $this->parent_order->$field_30;
				}
			}
			//refund status
			if ( $is_refund ) {
				$this->order_status = 'refunded';
			}
		}

		// extra WP_User
		$this->user = ! empty( $this->order_meta['_customer_user'] ) ? get_userdata( $this->order_meta['_customer_user'] ) : false;
		// setup missed fields for full addresses
		$optional_billing_fields = array( '_billing_address_1', '_billing_address_2', '_billing_first_name', '_billing_last_name', '_billing_city', '_billing_postcode', '_billing_country', '_billing_state' );
		$optional_shipping_fields = array( '_shipping_address_1', '_shipping_address_2', '_shipping_first_name', '_shipping_last_name', '_shipping_city', '_shipping_postcode', '_shipping_country', '_shipping_state' );
		$optional_fields = array_merge( $optional_billing_fields, $optional_shipping_fields );
		foreach ( $optional_fields as $optional_field ) {

			if ( ! isset( $this->order_meta[ $optional_field ] ) ) {
				$this->order_meta[ $optional_field ] = '';
			}
		}
		
		//method WC_Order::has_shipping_address checks only these 2 fields, so we have to add filter
		$has_shipping_address = false;
		$has_shipping_validate_keys = apply_filters( "woe_has_shipping_validate_keys", array( "_shipping_address_1", "_shipping_address_2" ) );
		foreach($has_shipping_validate_keys as $shippping_key ) {
			if( !empty($this->order_meta[$shippping_key]) )
				$has_shipping_address = true;
		}

		if ( $this->options['billing_details_for_shipping'] && !$has_shipping_address ) {
			$this->set_shipping_fields( $optional_shipping_fields );
		}

		$this->order_meta = apply_filters( 'woe_fetch_order_meta', $this->order_meta, $this->order_id );
		//$optional_billing_fields = array( 'billing_country', 'billing_state', '_billing_address_1', '_billing_address_2', '_billing_first_name', '_billing_last_name', '_billing_city', '_billing_postcode', '_billing_country', '_billing_state' );
	}

	public function set_shipping_fields( $shippings_fields ) {

	    foreach ( $shippings_fields as $shipping_field ) {

		$billing_field = str_replace( "shipping_", "billing_", $shipping_field );

		$this->order_meta[ $shipping_field ] = $this->order_meta[ $billing_field ];

		$_shipping_field = substr($shipping_field, 1);

		if (method_exists( $this->order, 'set_' . $_shipping_field )) {
		    $this->order->{ 'set_' . $_shipping_field }( $this->order_meta[ $billing_field ] );
		} else {
		    $this->order->$_shipping_field = $this->order_meta[ $billing_field ];
		}
	    }

	    $this->shipping_country = $this->billing_country;
	    $this->shipping_state   = $this->billing_state;
	}

	public function set_data($data) {
		$this->data = $data;
	}

	public function get_parent_order() {
		return $this->parent_order;
	}
	
	public function get_one_field($field) {
		$row = array( $field=>'');
		$row = $this->get($row, $field);
		return $row[$field];
	}

	public function get($row, $field) {
		global $wpdb;
		global $wp_roles;

		if ( substr( $field, 0, 5 ) == "USER_" ) { //user field
			$key = substr( $field, 5 );
			$row[$field] =  $this->user ? $this->user->get( $key ) : '';
		} elseif ( substr( $field, 0, 4 ) == "FEE_" ) {

			$key = substr( $field, 4 );

			$value = $wpdb->get_col( $wpdb->prepare(
			"SELECT
				itemmeta.meta_value
			FROM
				{$wpdb->prefix}woocommerce_order_items items
			INNER JOIN
				{$wpdb->prefix}woocommerce_order_itemmeta itemmeta
			ON
				items.order_item_id = itemmeta.order_item_id AND itemmeta.meta_key = '_fee_amount'
			WHERE
				items.order_id = %s AND items.order_item_type = 'fee' AND items.order_item_name = %s",
			$this->order_id,
			$key
			) );

			$row[$field] =  isset($value[0]) ? $value[0] : '';

		} elseif ( substr( $field, 0, 9 ) == "SHIPPING_" ) {

			$key = substr( $field, 9 );

			$value = $wpdb->get_col( $wpdb->prepare(
			"SELECT
				itemmeta.meta_value
			FROM
				{$wpdb->prefix}woocommerce_order_items items
			INNER JOIN
				{$wpdb->prefix}woocommerce_order_itemmeta itemmeta
			ON
				items.order_item_id = itemmeta.order_item_id AND itemmeta.meta_key = 'cost'
			WHERE
				items.order_id = %s AND items.order_item_type = 'shipping' AND items.order_item_name = %s",
			$this->order_id,
			$key
			) );

			$row[$field] =  isset($value[0]) ? $value[0] : '';

		} elseif ( substr( $field, 0, 4 ) == "TAX_" ) {

			$key = substr( $field, 4 );

			$value = $wpdb->get_col( $wpdb->prepare(
			"SELECT
				SUM(itemmeta.meta_value)
			FROM
				{$wpdb->prefix}woocommerce_order_items items
			INNER JOIN
				{$wpdb->prefix}woocommerce_order_itemmeta itemmeta
			ON
				items.order_item_id = itemmeta.order_item_id AND (itemmeta.meta_key = 'tax_amount' OR itemmeta.meta_key = 'shipping_tax_amount')
			WHERE
				items.order_id = %s AND items.order_item_type = 'tax' AND items.order_item_name = %s",
			$this->order_id,
			$key
			) );

			$row[$field] =  isset($value[0]) ? $value[0] : '';

		} elseif ( $field == 'order_id' ) {
			$row[$field] =  $this->order_id;
		} elseif ( $field == 'order_date' ) {
			$row[$field] =  ! method_exists( $this->order,
				"get_date_created" ) ? $this->order->order_date : ( $this->order->get_date_created() ? gmdate( 'Y-m-d H:i:s',
				$this->order->get_date_created()->getOffsetTimestamp() ) : '' );
        } elseif ( $field == 'orig_order_date' ) {
            $parent_id = $this->order->get_parent_id();
            if( $parent_id ) {
                $parent_order = wc_get_order($parent_id);
                $row[$field] = $parent_order->get_date_created()->format("Y-m-d H:i");
            }
        } elseif ( $field == 'modified_date' ) {
			$row[$field] = ! method_exists( $this->order,
				"get_date_modified" ) ? $this->order->modified_date : ( $this->order->get_date_modified() ? gmdate( 'Y-m-d H:i:s',
				$this->order->get_date_modified()->getOffsetTimestamp() ) : '' );
		} elseif ( $field == 'completed_date' ) {
			$row[$field] = ! method_exists( $this->order,
				"get_date_completed" ) ? $this->order->completed_date : ( $this->order->get_date_completed() ? gmdate( 'Y-m-d H:i:s',
				$this->order->get_date_completed()->getOffsetTimestamp() ) : '' );
		} elseif ( $field == 'paid_date' ) {
			$row[$field] = ! method_exists( $this->order,
				"get_date_paid" ) ? $this->order->paid_date : ( $this->order->get_date_paid() ? gmdate( 'Y-m-d H:i:s',
				$this->order->get_date_paid()->getOffsetTimestamp() ) : '' );
		} elseif ( $field == 'order_number' ) {
			$row[$field] = $this->parent_order ? $this->parent_order->get_order_number() : $this->order->get_order_number(); // use parent order number
		} elseif ( $field == 'order_subtotal' ) {
			$row[$field] = wc_round_tax_total( $this->order->get_subtotal() );
		} elseif ( $field == 'order_subtotal_plus_cart_tax' ) {
			$row[$field] = wc_round_tax_total( $this->order->get_subtotal() + $this->order->get_cart_tax() );
		} elseif ( $field == 'order_subtotal_minus_discount' ) {
			$row[$field] = $this->order->get_subtotal() - $this->order->get_total_discount();
		} elseif ( $field == 'order_subtotal_refunded' ) {
			$row[$field] = wc_round_tax_total( WC_Order_Export_Data_Extractor::get_order_subtotal_refunded( $this->order ) );
		} elseif ( $field == 'order_subtotal_minus_refund' ) {
			$row[$field] = wc_round_tax_total( $this->order->get_subtotal() - WC_Order_Export_Data_Extractor::get_order_subtotal_refunded( $this->order ) );
			//order total
		} elseif ( $field == 'order_total' ) {
			$row[$field] = $this->order->get_total();
		} elseif ( $field == 'order_total_no_tax' ) {
			$row[$field] = $this->order->get_total() - $this->order->get_total_tax();
		} elseif ( $field == 'order_refund' ) {
			$row[$field] = $this->order->get_total_refunded();
		} elseif ( $field == 'order_total_inc_refund' ) {
			$row[$field] = $this->order->get_total() - $this->order->get_total_refunded();
			//shipping
		} elseif ( $field == 'order_shipping' ) {
			$row[$field] = method_exists($this->order,"get_shipping_total") ? $this->order->get_shipping_total() : $this->order->get_total_shipping();
		} elseif ( $field == 'order_shipping_plus_tax' ) {
			$row[$field] = ( method_exists($this->order,"get_shipping_total") ? $this->order->get_shipping_total() : floatval( $this->order->get_total_shipping() ) ) + floatval( $this->order->get_shipping_tax() );
		} elseif ( $field == 'order_shipping_refunded' ) {
			$row[$field] = $this->order->get_total_shipping_refunded();
		} elseif ( $field == 'order_shipping_minus_refund' ) {
			$row[$field] = ( method_exists($this->order,"get_shipping_total") ? $this->order->get_shipping_total() : $this->order->get_total_shipping() ) - $this->order->get_total_shipping_refunded();
			//shipping tax
		} elseif ( $field == 'order_shipping_tax_refunded' ) {
			$row[$field] = WC_Order_Export_Data_Extractor::get_order_shipping_tax_refunded( $this->order_id );
		} elseif ( $field == 'order_shipping_tax_minus_refund' ) {
			$row[$field] = $this->order->get_shipping_tax() - WC_Order_Export_Data_Extractor::get_order_shipping_tax_refunded( $this->order_id );
			//order tax
		} elseif ( $field == 'order_tax' ) {
			$row[$field] = wc_round_tax_total( $this->order->get_cart_tax() );
		} elseif ( $field == 'order_total_fee' ) {
			$row[ $field ] = array_sum( array_map( function ( $item ) {
				return $item->get_total();
			}, $this->order->get_fees() ) );
		} elseif ( $field == 'order_total_tax' ) {
			$row[$field] = wc_round_tax_total( $this->order->get_total_tax() );
		} elseif ( $field == 'order_total_tax_refunded' ) {
			$row[$field] = wc_round_tax_total( $this->order->get_total_tax_refunded() );
		} elseif ( $field == 'order_total_tax_minus_refund' ) {
			$row[$field] = wc_round_tax_total( $this->order->get_total_tax() - $this->order->get_total_tax_refunded() );
		} elseif ( $field == 'order_status' ) {
			$status        = empty( $this->order_status ) ? $this->order->get_status() : $this->order_status;
			$status        = 'wc-' === substr( $status, 0, 3 ) ? substr( $status, 3 ) : $status;
			$row[$field] = isset( WC_Order_Export_Data_Extractor::$statuses[ 'wc-' . $status ] ) ? WC_Order_Export_Data_Extractor::$statuses[ 'wc-' . $status ] : $status;
		} elseif ( $field == 'user_login' OR $field == 'user_email' OR $field == 'user_url' ) {
			$row[$field] = $this->user ? $this->user->$field : "";
		} elseif ( $field == 'user_role' ) {
			$roles         = $wp_roles->roles;
			$row[$field] =  !isset( $this->user->roles[0] ) ? "" :  ( isset( $roles[ $this->user->roles[0] ] ) ? $roles[ $this->user->roles[0] ]['name'] : $this->user->roles[0] ); // take first role Name
		} elseif ( $field == 'customer_total_orders' ) {
			$row[$field] = ( isset( $this->user->ID ) ) ? wc_get_customer_order_count( $this->user->ID ) : WC_Order_Export_Data_Extractor::get_customer_order_count_by_email( $this->order_meta["_billing_email"] );
		} elseif ( $field == 'customer_total_spent' ) {
			$row[$field] = ( isset( $this->user->ID ) ) ? wc_get_customer_total_spent( $this->user->ID ) : WC_Order_Export_Data_Extractor::get_customer_total_spent_by_email( $this->order_meta["_billing_email"] );
		} elseif ( $field == 'customer_first_order_date' ) {
			$first_order = WC_Order_Export_Data_Extractor::get_customer_order( $this->user, $this->order_meta, 'first' );
			$row[$field] = $first_order ? ( $first_order->get_date_created() ? gmdate( 'Y-m-d H:i:s',
				$first_order->get_date_created()->getOffsetTimestamp() ) : '' ) : '';
		} elseif ( $field == 'customer_last_order_date' ) {
			$last_order = WC_Order_Export_Data_Extractor::get_customer_order( $this->user, $this->order_meta, 'last' );
			$row[$field] = $last_order? ( $last_order->get_date_created() ? gmdate( 'Y-m-d H:i:s',
				$last_order->get_date_created()->getOffsetTimestamp() ) : '' ) : '';
		} elseif ( $field == 'billing_address' ) {
			$row[$field] = join( ", ",
				array_filter( array( $this->order->get_billing_address_1(), $this->order->get_billing_address_2() ) ) );
		} elseif ( $field == 'shipping_address' ) {
			$row[$field] = join( ", ",
				array_filter( array(  $this->order->get_shipping_address_1(), $this->order->get_shipping_address_2() ) ) );
		} elseif ( $field == 'billing_full_name' ) {
			$row[$field] = trim( $this->order_meta["_billing_first_name"] . ' ' . $this->order_meta["_billing_last_name"] );
		} elseif ( $field == 'shipping_full_name' ) {
			$row[$field] = trim( $this->order_meta["_shipping_first_name"] . ' ' . $this->order_meta["_shipping_last_name"] );
		} elseif ( $field == 'billing_country_full' ) {
			$row[$field] = isset( WC_Order_Export_Data_Extractor::$countries[ $this->billing_country ] ) ? WC_Order_Export_Data_Extractor::$countries[ $this->billing_country ] : $this->billing_country;
		} elseif ( $field == 'shipping_country_full' ) {
			$row[$field] = isset( WC_Order_Export_Data_Extractor::$countries[ $this->shipping_country ] ) ? WC_Order_Export_Data_Extractor::$countries[ $this->shipping_country ] : $this->shipping_country;
		} elseif ( $field == 'billing_state_full' ) {
			$country_states = WC()->countries->get_states( $this->billing_country );
			$row[$field] = isset( $country_states[ $this->billing_state ] ) ? html_entity_decode( $country_states[ $this->billing_state ] ) : $this->billing_state;
		} elseif ( $field == 'shipping_state_full' ) {
			$country_states = WC()->countries->get_states( $this->shipping_country );
			$row[$field] = isset( $country_states[ $this->shipping_state ] ) ? html_entity_decode( $country_states[ $this->shipping_state ] ) : $this->shipping_state;
		} elseif ( $field == 'billing_citystatezip' ) {
			$row[$field] = WC_Order_Export_Data_Extractor::get_city_state_postcode_field_value( $this->order, 'billing' );
		} elseif ( $field == 'billing_citystatezip_us' ) {
			$row[$field] = WC_Order_Export_Data_Extractor::get_city_state_postcode_field_value( $this->order, 'billing', true );
		} elseif ( $field == 'shipping_citystatezip' ) {
			$row[$field] = WC_Order_Export_Data_Extractor::get_city_state_postcode_field_value( $this->order, 'shipping' );
		} elseif ( $field == 'shipping_citystatezip_us' ) {
			$row[$field] = WC_Order_Export_Data_Extractor::get_city_state_postcode_field_value( $this->order, 'shipping', true );
		} elseif ( $field == 'products' OR $field == 'coupons' ) {
			if ( isset( $this->data[ $field ] ) ) {
				$row[$field] = $this->data[ $field ];
			}
		} elseif ( $field == 'shipping_method_title' ) {
			$row[$field] = $this->order->get_shipping_method();
		} elseif ( $field == 'shipping_method' OR $field == 'shipping_method_only') {
			$shipping_methods = $this->order->get_items( 'shipping' );
			$shipping_method  = reset( $shipping_methods ); // take first entry
			if ( ! empty( $shipping_method ) ) {
				$row[$field] = $field == 'shipping_method_only' ? $shipping_method['method_id'] : $shipping_method['method_id'] . ':' . $shipping_method['instance_id'];
			}
		} elseif ( $field == 'shipping_zone' ) {
			$row[$field] = WC_Order_Export_Data_Extractor::get_shipping_zone($this->order);
		} elseif ( $field == 'coupons_used' ) {
			$row[$field] = count( $this->data['coupons'] );
		} elseif ( $field == 'total_weight_items' ) {
			$total_weight = 0;
			foreach ( $this->data['products'] as $product ) {
				$total_weight += (float) $product['qty'] * (float) $product['weight'];
			}
			$row[$field] = $total_weight;
		} elseif ( $field == 'count_total_items' ) {
			$row[$field] = $this->order->get_item_count();
		} elseif ( $field == 'count_exported_items' ) {
			$count = 0; // count only exported!
			if ( $this->export['products'] ) {
				foreach ( $this->data['products'] as $product ) {
					$count += $product['qty'];
				}
				$row[$field] = $count;
			}
		} elseif ( $field == 'count_unique_products' ) { // speed! replace with own counter ?
            $row[$field] = count( $this->data['products'] );
        } elseif ( $field == 'total_volume' ) {
            $value = 0;
            foreach ( $this->order->get_items() as $item ) {
                $product   = $item->get_product();
                if ( !$product )  continue;
                $value +=  $item->get_quantity() * $product->get_width() * $product->get_height() * $product->get_length();
            }
            $row[$field] = $value;
		} elseif ( $field == 'customer_note' ) {
			$notes = array( $this->post->post_excerpt );
			if ( $this->options['export_refund_notes'] ) {
				$refunds = $this->order->get_refunds();
				foreach ( $refunds as $refund ) {
					// added get_reason for WC 3.0
					$notes[] = method_exists( $refund,
						'get_reason' ) ? $refund->get_reason() : $refund->get_refund_reason();
				}
			}
			$row[$field] = implode( "\n", array_filter( $notes ) );
		} elseif ( $field == 'first_refund_date' ) {
			$value = '';
			foreach ( $this->order->get_refunds() as $refund ) {
				$value = ! method_exists( $refund,
					"get_date_created" ) ? $refund->date : ( $refund->get_date_created() ? gmdate( 'Y-m-d H:i:s',
					$refund->get_date_created()->getOffsetTimestamp() ) : '' );
				break;// take only first
			}
			$row[$field] = $value;
		} elseif ( isset( $this->static_vals['order'][ $field ] ) ) {
			$row[$field] = $this->static_vals['order'][ $field ];
		} elseif ( $field == 'order_notes' ) {
			remove_filter( 'comments_clauses', array( 'WC_Comments', 'exclude_order_comments' ), 10 );
			$args  = array(
				'post_id' => $this->order_id,
				'approve' => 'approve',
				'type'    => 'order_note',
			);
			$notes = get_comments( $args );
			add_filter( 'comments_clauses', array( 'WC_Comments', 'exclude_order_comments' ), 10, 1 );
			$comments = array();
			if ( $notes ) {
				foreach ( $notes as $note ) {
					if ( ! empty( $this->options['export_all_comments'] ) || $note->comment_author !== __( 'WooCommerce',
							'woocommerce' ) ) { // skip system notes by default
						$comments[] = apply_filters( 'woe_get_order_notes', $note->comment_content, $note, $this->order );
					}
				}
			}
			$row[$field] = implode( "\n", array_filter( $comments ) );
		} elseif ( $field == 'embedded_edit_order_link' ) {
			$row[$field] = sprintf(
				'<a href="%s" target="_blank">%s</a>',
				get_edit_post_link($this->order_id),
				__( 'Edit order', 'woo-order-export-lite' )
			);
		} elseif ( $field == 'order_currency' ) {
			$row[$field] = $this->order->get_currency();
		} elseif( method_exists( $this->order, 'get_' . $field ) ) {  // order_date...		
				if ( $this->post->post_type == 'shop_order_refund' AND $this->parent_order )
					$row[$field] = $this->parent_order->{'get_' . $field}(); //use main order details for refund
				else
					$row[$field] = $this->order->{'get_' . $field}();			
		} elseif ( isset( $this->order_meta[ $field ] ) ) {
			$field_data = array();
			do_action( 'woocommerce_order_export_add_field_data', $field_data, $this->order_meta[ $field ], $field );
			if ( empty( $field_data ) ) {
				$field_data[ $field ] = $this->order_meta[ $field ];
			}
			$row = array_merge( $row, $field_data );
		} elseif ( isset( $this->order_meta[ "_" . $field ] ) ) { // or hidden field
			$row[$field] = $this->order_meta[ "_" . $field ];
		} else { // order_date...
				$row[$field] = get_post_meta( $this->order_id, '_' . $field, true );
				//print_r($field."=".$label); echo "debug static!\n\n";
		}
		return $row;
		
	}
}