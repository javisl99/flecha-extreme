<?php
class WC_Order_Export_Order_Product_Fields {
	var $item_id;
	var $item;
	var $item_meta;
	var $product;
	var $product_id;
	var $product_fields_with_tags;
	var $order;
	var $post;
	var $line_id;
	var $static_vals;
	var $options;
	var $woe_order;

	/**
	 * @var int
	 */
	public $parent_product_id;

	public function __construct($item, $item_meta, $product, 
	$order, $post, $line_id, $static_vals, $options, $woe_order) {
		$this->item = $item;
		$this->product = $product;
		$this->order = $order;
		$this->post = $post;
		$this->line_id = $line_id;
		$this->static_vals = $static_vals;
		$this->options = $options;
		$this->woe_order = $woe_order;
		$this->item_id = $item->get_id();
		$this->item_meta = $item_meta;
		$this->variation_id = $this->item->get_variation_id() ? $this->item->get_variation_id() : $this->item->get_product_id();
		$this->product_id = $this->item->get_product_id();
		$this->product_fields_with_tags = array( 'product_variation', 'post_content', 'post_excerpt' );

		if( $product ) {
			$this->parent_product_id = method_exists( $product,
				'get_parent_id' ) ? $product->get_parent_id() : ( isset( $product->parent ) ? $product->parent->id : 0 );
		}
	}

	private static function get_product_category_full( $product_id ) {
		$full_names = array();
		if ( ! $product_id ) {
			return '';
		}
		$prod_terms = get_the_terms( $product_id, 'product_cat' );
		if ( ! $prod_terms ) {
			return '';
		}

		foreach ( $prod_terms as $prod_term ) {
			$parts                                  = array( $prod_term->name );
			$product_parent_categories_all_hierachy = get_ancestors( $prod_term->term_id, 'product_cat' );
			foreach ( $product_parent_categories_all_hierachy as $id ) {
				$parent  = get_term( $id );
				$parts[] = $parent->name;
			}
			$full_names[] = join( WC_Order_Export_Data_Extractor::$export_subcategories_separator, array_reverse( $parts ) );
		}

		return join( WC_Order_Export_Data_Extractor::$export_line_categories_separator, $full_names );
	}

	public function get($field) {
		if(isset($this->woe_order) && strpos( $field, 'orders__' ) !== false) {
		    $_field = substr( $field, 8 );
		    $field_value = $this->woe_order->get_one_field($_field);
		}
		else if ( strpos( $field, '__' ) !== false && $taxonomies = wc_get_product_terms( $this->item['product_id'],
						substr( $field, 2 ), array( 'fields' => 'names' ) )
				) {
					$field_value = implode( ', ', $taxonomies );
		} else if ( $field == 'product_shipping_class' ) {
			$taxonomies = array();
			if ( ! empty( $this->item['variation_id'] ) )// try get from variation at first!
			{
				$taxonomies = wc_get_product_terms( $this->item['variation_id'], $field,
					array( 'fields' => 'names' ) );
			}
			if ( ! $taxonomies ) {
				$taxonomies = wc_get_product_terms( $this->item['product_id'], $field, array( 'fields' => 'names' ) );
			}
			//done	
			$field_value = implode( ', ', $taxonomies );
		} elseif ( $field == 'line_total_plus_tax' ) {
			$field_value = $this->item_meta["_line_total"][0] + $this->item_meta["_line_tax"][0];
		} elseif ( $field == 'line_subtotal_tax' ) {
			$field_value = $this->item_meta["_line_subtotal_tax"][0];
		} elseif ( $field == 'name' ) {
			$field_value = $this->item["name"];
		} elseif ( $field == 'product_name' ) {
			$field_value = $this->product ? $this->product->get_name() : '';
		} elseif ( $field == 'product_name_main' ) {
			$field_value = $this->product ? $this->product->get_title() : '';
		} elseif ( $field == 'product_variation' ) {
			$field_value = WC_Order_Export_Data_Extractor::get_product_variation( $this->item, $this->order, $this->item_id, $this->product );
		} elseif ( $field == 'seller' ) {
			$field_value = '';
			if ( $this->post ) {
				$user          = get_userdata( $this->post->post_author );
				$field_value = ! empty( $user->display_name ) ? $user->display_name : '';
			}
		} elseif ( $field == 'post_content' ) {
			$field_value = $this->product ? $this->product->get_description() : "";
			if( !$field_value )
				$field_value = $this->post ? $this->post->post_content : ''; //try read directly from main post
		} elseif ( $field == 'post_excerpt' ) {
			$field_value = $this->post ? $this->post->post_excerpt : '';// still read from main post
		} elseif ( $field == 'embedded_product_image' ) {
			$field_value = "";
			$attachment_id = null;

			if ( $this->product_id ) {
				$attachment_id = get_post_thumbnail_id( $this->product->get_id() );
			}

			if ( ! $attachment_id && $this->parent_product_id ) {
				$attachment_id = get_post_thumbnail_id( $this->parent_product_id );
			}

			if ( ! $attachment_id ) {
				$attachment_id = get_option( 'woocommerce_placeholder_image', 0 );
			}

			/**
			 * do not use method listed below
			 * - @see wp_get_attachment_metadata()
			 *      $imagedata = wp_get_attachment_metadata( $attachment_id );
			 *      $file = get_attached_file( $attachment_id );
			 *      sometimes wp_get_attachment_metadata() is empty!
			 * - @see wp_get_attachment_url()
			 *      do not have 'size' argument
			 * - @see get_attached_file()
			 *      $path = get_attached_file( get_post_thumbnail_id( $post->ID );
			 *      This code was used in the first implementation.
			 */
			if ( $image = wp_get_attachment_image_src( $attachment_id, 'woocommerce_thumbnail' ) ) {
				if ( ( $thumbfile = str_replace( wp_get_upload_dir()['baseurl'], wp_get_upload_dir()['basedir'], $image[0] ) ) && file_exists( $thumbfile ) ) {
					$field_value = $thumbfile;
				}
			}
		} elseif ( $field == 'type' ) {
			$field_value = '';
			if ( $this->product ) {
				$field_value = is_object( $this->product ) && method_exists( $this->product,
					'get_type' ) ? $this->product->get_type() : $this->product->product_type;
			}
		} elseif ( $field == 'tags' ) {
			$terms         = get_the_terms( $this->product_id, 'product_tag' );
			$arr = array();
			if ( $terms ) {
				foreach ( $terms as $term ) {
					$arr[] = $term->name;
				}
			}
			$field_value = join( ",", $arr );
		} elseif ( $field == 'category' ) {
			$terms         = get_the_terms( $this->product_id, 'product_cat' );
			$arr = array();
			if ( $terms ) {
				foreach ( $terms as $term ) {
					$arr[] = $term->name;
				}
			}
			$field_value = join( ",", $arr );// hierarhy ???
		} elseif ( $field == 'line_no_tax' ) {
			$field_value = $this->item_meta["_line_total"][0];
			//item refund
		} elseif ( $field == 'line_total_refunded' ) {
			$field_value = $this->order->get_total_refunded_for_item( $this->item_id );
		} elseif ( $field == 'line_total_minus_refund' ) {
			$field_value = $this->item_meta["_line_total"][0] - $this->order->get_total_refunded_for_item( $this->item_id );
		} elseif ( $field == 'qty_minus_refund' ) {
			$field_value = $this->item_meta["_qty"][0] + $this->order->get_qty_refunded_for_item( $this->item_id ); // Yes we add negative! qty
			//tax refund
		} elseif ( $field == 'line_tax_refunded' ) {
			$field_value = WC_Order_Export_Data_Extractor::get_order_item_taxes_refund( $this->order, $this->item_id );
		} elseif ( $field == 'line_tax_minus_refund' ) {
			$field_value = $this->item_meta["_line_tax"][0] - WC_Order_Export_Data_Extractor::get_order_item_taxes_refund( $this->order, $this->item_id );
		} elseif ( $field == 'line_id' ) {
			$field_value = $this->line_id;
		} elseif ( $field == 'item_id' ) {
			$field_value = $this->item_id;
		} elseif ( $field == 'item_price' ) {
			$field_value = $this->order->get_item_total( $this->item, false, true ); // YES we have to calc item price
		} elseif ( $field == 'item_price_inc_tax' ) {
			$field_value = $this->order->get_item_total( $this->item, true, true ); // YES we have to calc item price
		} elseif ( $field == 'item_price_before_discount' ) {
			$field_value = $this->order->get_item_subtotal( $this->item );
		} elseif ( $field == 'discount_amount' ) {
			$field_value = $this->get_item_discount();
		} elseif ( $field == 'tax_rate' ) {
			if ( method_exists( $this->item, "get_subtotal" ) ) {
				$subtotal_amount = $this->item->get_subtotal();
				$subtotal_tax    = $this->item->get_subtotal_tax();
			} else {
				$subtotal_amount = $this->item['line_subtotal'];
				$subtotal_tax    = $this->item['line_subtotal_tax'];
			}
			$field_value = ( $subtotal_amount <> 0 ) ? round( 100 * $subtotal_tax / $subtotal_amount, apply_filters('woe_tax_rate_rounding_precision', 2) ) : 0;
		} elseif ( $field == 'product_url' ) {
			$field_value = get_permalink( $this->product_id );
		} elseif ( $field == 'sku' ) {
			$field_value = is_object( $this->product ) && method_exists( $this->product,
				'get_' . $field ) ? $this->product->{'get_' . $field}() : get_post_meta( $this->variation_id, '_' . $field,
				true );
		}
		elseif ( $field == 'sku_parent' ) {
			$field_value = '';
			if( $this->product ) {
				if ( $this->product->is_type( 'variation' ) && $this->parent_product_id ) {
					if ( $parent = wc_get_product( $this->parent_product_id ) ) {
						$field_value = $parent->get_sku();
					}
				}
				else 
					$field_value = $this->product->get_sku();
			}	
		} elseif ( $field == 'download_url' ) {
			$field_value = '';
			if ( $this->product AND $this->product->is_downloadable() ) {
				$files = get_post_meta( $this->product->get_id(), '_downloadable_files', true );
				$links = array();
				if ( $files ) {
					foreach ( $files as $file ) {
						$links[] = $file['file'];
					}
				}
				$field_value = implode( "\n", $links );
			}
		} elseif ( $field == 'item_discount_tax' ) {
			$field_value = $this->get_item_discount() * $this->get_item_tax_rate()/100;
		} elseif ( $field == 'item_discount_amount_and_tax' ) {
			$item_discount = $this->get_item_discount();
			$item_tax_rate = $this->get_item_tax_rate();
			$field_value   = $item_discount * ( 1 + $item_tax_rate / 100 );
		} elseif ( $field == 'item_download_url' ) {
			$field_value = '';
			if ( $this->product AND $this->product->is_downloadable() ) {
				$files = $this->item->get_item_downloads();
				$links = array();
				if ( $files ) {
					foreach ( $files as $file ) {
						$links[] = $file['download_url'];
					}
				}
				$field_value = implode( "\n", $links );
			}
		} elseif ( $field == 'image_url' ) {
			// make full url, wp_get_attachment_image_src can return false
			$images_src    = ( is_object( $this->product ) AND $this->product->get_image_id() ) ? wp_get_attachment_image_src( $this->product->get_image_id(),
				'full' ) : false;
			$field_value = is_array( $images_src ) ? current( $images_src ) : '';
		} elseif ( $field == 'full_category_names' ) {
			$field_value = self::get_product_category_full( $this->product_id );
		} elseif ( $field == 'non_variation_product_attributes' ) {
			$attributes = array();
			if ( $this->product ) {
				foreach ( $this->product->get_attributes() as $attribute ) {
					/** @var WC_Product_Attribute $attribute */
					if ( $attribute instanceof WC_Product_Attribute && ! $attribute->get_variation() ) {
						if ( $attribute->get_taxonomy() ) {
							$taxObject = $attribute->get_taxonomy_object();
							if ( isset( $taxObject, $taxObject->attribute_label ) ) {
								$label = $taxObject->attribute_label;
							} else {
								$label = $attribute->get_name();
							}
							$attributes[] = $label . " - " . join( ",", array_column( $attribute->get_terms(), 'name' ) );
						} else {
							$attributes[] = $attribute->get_name() . " - " . join( ",", $attribute->get_options() );
						}
					}
				}
			}

			$field_value = join( PHP_EOL, $attributes );
		} elseif ( isset( $this->static_vals[ $field ] ) ) {
			$field_value = $this->static_vals[ $field ];
		} elseif ( isset( $this->item_meta[ $field ] ) ) {    //meta from order
			$field_value = join( WC_Order_Export_Data_Extractor::$export_itemmeta_values_separator, $this->item_meta[ $field ] );
		} elseif ( isset( $this->item_meta[ "_" . $field ] ) ) {// or hidden field
			$field_value = join( WC_Order_Export_Data_Extractor::$export_itemmeta_values_separator, $this->item_meta[ "_" . $field ] );
		} elseif ( isset( $this->item['item_meta'][ $field ] ) ) {  // meta from item line
			$field_value = join( WC_Order_Export_Data_Extractor::$export_itemmeta_values_separator, $this->item['item_meta'][ $field ] );
		} elseif ( isset( $this->item['item_meta'][ "_" . $field ] ) ) { // or hidden field
			$field_value = join( WC_Order_Export_Data_Extractor::$export_itemmeta_values_separator,
				$this->item['item_meta'][ "_" . $field ] );
		}
		else {
		
			$field_value = '';
			if ( ! empty( $this->item['variation_id'] ) ) {  //1. read from variation 
				$field_value = get_post_meta( $this->variation_id, $field, true );
			}
			if ( $field_value == '' ) {  //2. read from product 
				$field_value = get_post_meta( $this->product_id, $field, true );
			}
			if ( $field_value === '' AND is_object( $this->product ) && method_exists( $this->product,'get_' . $field )  )  //3. try method
			{
				$field_value = $this->product->{'get_' . $field}();
			}
			if ( $field_value === '' AND empty( $this->item['variation_id'] ) ) // 4. try get attribute for !variaton
			{
				$field_value = $this->product ? $this->product->get_attribute( $field ) : '';
			}
			if ( $field_value === '' AND !empty( $this->item['variation_id'] ) AND $this->product) // 6. try get attribute for variaton
			{
				$field_value = $this->product->get_attribute( $field );
				if ( $field_value === '' and $this->parent_product_id ) {
					if ( $parent = wc_get_product( $this->parent_product_id ) ) {
						$field_value = $parent->get_attribute( $field );
					}
				}
			}
			if ( $field_value === '' ) {  //5. read from product/variation hidden field
				$field_value = get_post_meta( $this->variation_id, "_" . $field, true );
			}
		}

		if ( $this->options['strip_tags_product_fields'] AND in_array( $field, $this->product_fields_with_tags ) ) {
			$field_value = strip_tags( $field_value );
		}
		if ( isset( $field_value ) ) {
			$field_value = apply_filters( "woe_get_order_product_value_{$field}", $field_value, $this->order,
				$this->item, $this->product, $this->item_meta );
//					$row[ $field ] = apply_filters( "woe_get_order_product_{$format}_value_{$field}", $row[ $field ],
//						$order, $item, $product, $item_meta );
		}
		return $field_value;
	}

	private function get_item_discount() {
		if ( method_exists( $this->item, "get_subtotal" ) ) {
			$item_discount   = wc_format_decimal( $this->item->get_subtotal() - $this->item->get_total(), '');
		} else {
			$item_discount   = $this->item['line_subtotal'] - $this->item['line_total'];
		}
		return $item_discount;
	}
	private function get_item_tax_rate() {
		if ( method_exists( $this->item, "get_subtotal" ) ) {
			$subtotal_amount = $this->item->get_subtotal();
			$subtotal_tax    = $this->item->get_subtotal_tax();
		} else {
			$subtotal_amount = $this->item['line_subtotal'];
			$subtotal_tax    = $this->item['line_subtotal_tax'];
		}
		return ( $subtotal_amount <> 0 ) ? round( 100 * $subtotal_tax / $subtotal_amount, apply_filters('woe_tax_rate_rounding_precision', 2) ) : 0; 
	}
}