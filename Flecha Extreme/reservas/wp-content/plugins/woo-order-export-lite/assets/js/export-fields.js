function woe_create_selected_fields( old_output_format, format, format_changed ) {

	var $old_format_order_fields = jQuery( "#order_fields" ).clone();

	woe_create_unselected_fields( old_output_format, format, format_changed, $old_format_order_fields );

	//jQuery( '#export_job_settings' ).prepend( jQuery( "#fields_control_products" ) );
	//jQuery( '#export_job_settings' ).prepend( jQuery( "#fields_control_coupons" ) );

	jQuery( "#fields .fields-control-block" ).addClass( 'hidden' );
	jQuery( "#order_fields" ).addClass( 'non_flat_height' );

	/*
	Clone elements for using in create_modal_fields ($old_format_order_fields) and
	before insert fields in 'order_fields' element ($old_format_modal_content) for
	able to migrate checkbox values from pop up to 'order_fields' element and vice versa
	*/

	var html = '';
	var fields_control_block_elements = [];

	if ( woe_is_flat_format( format ) ) {
		fields_control_block_elements.push( woe_make_repeat_options( 'products' ) );
		fields_control_block_elements.push( woe_make_repeat_options( 'coupons' ) );
	}

	jQuery.each( window['selected_order_fields'], function ( i, value ) {

		var index = value.key;
		var colname = value.colname;

		colname = woe_escape_str( colname );
		value.label = woe_escape_str( value.label );
		index = woe_escape_str( index );
		value.value = woe_escape_str( value.value );

		if ( format_changed ) {
			if ( woe_is_flat_format( format ) ) {
				colname = value.label;
			} else if ( woe_is_xml_format( format ) ) {
				colname = woe_to_xml_tags( index );
			} else {
				colname = index;
			}
		}

		if ( index == 'products' || index == 'coupons' ) {

			var row = '';

			jQuery( "#fields_control .segment_" + index ).remove();

			if ( ! woe_is_flat_format( format ) ) {
				// TODO fix segment names for product and coupon fields
				row = '<li class="mapping_row segment_' + value.segment + 's' + ' flat-' + index + '-group" style="display: none">\
                            <div class="mapping_col_1" style="width: 10px">\
                                    <input type=hidden name="orders[][segment]"  value="' + value.segment + '">\
                                    <input type=hidden name="orders[][key]"  value="' + index + '">\
                                    <input type=hidden name="orders[][label]"  value="' + value.label + '">\
                                    <input type=hidden name="orders[][format]"  value="' + value.format + '">\
                            </div>\
                            <div class="mapping_col_2">' + value.label + '</div>\
                            <div class="mapping_col_3">';
				row += '<div class="segment_' + index + '">';
				row += '<input class="mapping_fieldname" type=input name="orders[][colname]" value="' + colname + '">';
				row += '</div>';
				row += '</div>';
				row += '<ul id="sortable_' + index + '">' + woe_create_group_fields( format, index, format_changed, old_output_format, $old_format_order_fields ) + '</ul>';
				row += '</li>';
			} else {
				row = '<div class="hide flat-' + index + '-group">';
				row += '<input type=hidden name="orders[][segment]"  value="' + value.segment + '">';
				row += '<input type=hidden name="orders[][key]"  value="' + index + '">';
				row += '<input class="mapping_fieldname" type=hidden name="orders[][colname]" value="' + colname + '">';
				row += '<input type=hidden name="orders[][label]"  value="' + value.label + '">';
				row += '<input type=hidden name="orders[][format]"  value="' + value.format + '"></div>';

			}

		}
		else {

			if ( ! woe_is_flat_format( format ) && (
					value.segment === "products" || value.segment === "coupons"
				) ) {
				return true;
			}

			var value_part = ''
			var label_part = '';
			var delete_btn = '<div class="mapping_col_3 mapping_row-delete_field_block"><a href="" class="mapping_row-delete_field"><span class="dashicons dashicons-trash"></span></a></div>';
			var label_prefix = '';
			var index_api = index;

			if ( index.indexOf( 'static_field' ) >= 0 ) {
				value_part = '<div class="mapping_col_3"><input class="mapping_fieldname" type=input name="orders[][value]" value="' + value.value + '"></div>';
			}

			// label prefix for products and coupons
			if ( woe_is_flat_format( format ) ) {
				if ( value.segment === 'products' ) {
					label_prefix = '[P] ';
					index_api = index_api.replace( "plain_products_", "" );
				}
				if ( value.segment === 'coupons' ) {
					label_prefix = '[C] ';
					index_api = index_api.replace( "plain_coupons_", "" );
				}
			}
			var row = '<li class="mapping_row segment_' + value.segment + '">\
                            <div class="mapping_col_1" style="width: 10px">\
                                    <input type=hidden name="orders[][segment]"  value="' + value.segment + '">\
                                    <input type=hidden name="orders[][key]"  value="' + index + '">\
                                    <input type=hidden name="orders[][label]"  value="' + value.label + '">\
                                    <input type=hidden name="orders[][format]"  value="' + value.format + '">\
                            </div>\
                            <div class="mapping_col_2" title="' + index_api + '">' + '<span class="field-prefix">' + label_prefix + '</span>' + value.label + label_part + '</div>\
                            <div class="mapping_col_3"><input class="mapping_fieldname" type=input name="orders[][colname]" value="' + colname + '"></div> ' + value_part + delete_btn + '\
                        </li>\
                        ';
		}

		html += row;

	} );

	jQuery( "#order_fields" ).html( html );

	if ( ! jQuery( "#fields .fields-control-block" ).html() ) {
		fields_control_block_elements.forEach( function ( currentValue ) {
			jQuery( "#fields .fields-control-block" ).append( currentValue );
		} );
	}

	if ( fields_control_block_elements.length > 0 ) {
		jQuery( "#fields .fields-control-block" ).removeClass( 'hidden' );
		jQuery( "#order_fields" ).removeClass( 'non_flat_height' );
	}

	woe_add_bind_for_custom_fields( 'products', output_format, jQuery( "#order_fields" ) );
	woe_add_bind_for_custom_fields( 'product_items', output_format, jQuery( "#order_fields" ) );
	woe_add_bind_for_custom_fields( 'coupons', output_format, jQuery( "#order_fields" ) );

	jQuery( "#sortable_products" ).sortable();
	jQuery( "#sortable_coupons" ).sortable();

	woe_check_sortable_groups();

	woe_moving_products_and_coupons_group_blocks_to_first_item( output_format );
}

function woe_create_group_fields( format, index_p, format_changed ) {

	var html = '';

	jQuery.each( window['selected_order_' + index_p + '_fields'], function ( i, value ) {

		var index = value.key;
		var colname = value.colname;

		colname = woe_escape_str( colname );
		value.label = woe_escape_str( value.label );
		index = woe_escape_str( index );
		value.value = woe_escape_str( value.value );

		if ( format_changed ) {
			if ( woe_is_flat_format( format ) ) {
				colname = value.label;
			} else {
				colname = index.replace( 'plain_' + index_p + '_', '' );
				if ( woe_is_xml_format( format ) ) {
					colname = woe_to_xml_tags( colname );
				}
			}
		}

		var value_part = '';
		var label_part = '';
		var delete_btn = '<div class="mapping_col_3 mapping_row-delete_field_block"><a href="#" class="mapping_row-delete_field"><span class="dashicons dashicons-trash"></span></a></div>';

		if ( index.indexOf( 'static_field' ) >= 0 ) {
			value_part = '<div class="mapping_col_3"><input class="mapping_fieldname" type=input name="' + index_p + '[][value]" value="' + value.value + '"></div>';
		}

		var row = '<li class="mapping_row segment_' + index_p + '">\
                    <div class="mapping_col_1" style="width: 10px">\
                        <input type=hidden name="' + index_p + '[][label]"  value="' + value.label + '">\
                        <input type=hidden name="' + index_p + '[][key]"  value="' + index + '">\
                        <input type=hidden name="' + index_p + '[][segment]"  value="' + index_p + '">\
                        <input type=hidden name="' + index_p + '[][format]"  value="' + value.format + '">\
                    </div>\
                    <div class="mapping_col_2" title="' + index + '">' + value.label + label_part + '</div>\
                    <div class="mapping_col_3"><input class="mapping_fieldname" type=input name="' + index_p + '[][colname]" value="' + colname + '"></div> ' + value_part + delete_btn + '\
            </li>\
            ';

		html += row;

	} );

	return html;
}

function woe_moving_products_and_coupons_group_blocks_to_first_item( format ) {

	if ( woe_is_flat_format( format ) ) {

		var first_products_field = jQuery( '#order_fields [value*="plain_products_"]' ).first().closest( 'li' );
		var first_coupons_field = jQuery( '#order_fields [value*="plain_coupons_"]' ).first().closest( 'li' );

		if ( first_products_field.length ) {
			var products_group_block = jQuery( '#order_fields .flat-products-group' ).clone();
			jQuery( '#order_fields .flat-products-group' ).remove();
			first_products_field.before( products_group_block );
		}

		if ( first_coupons_field.length ) {
			var coupons_group_block = jQuery( '#order_fields .flat-coupons-group' ).clone();
			jQuery( '#order_fields .flat-coupons-group' ).remove();
			first_coupons_field.before( coupons_group_block );
		}

		return;
	}

	var first_products_field = jQuery( '#order_fields [name="products[][key]"]' ).first().closest( 'li' );

	if ( ! jQuery( '#sortable_products > li' ).length && first_products_field.length ) {
		var products_group_block = jQuery( '#order_fields .flat-products-group' ).clone();
		jQuery( '#order_fields .flat-products-group' ).remove();
		first_products_field.before( products_group_block );
	}

	var first_coupons_field = jQuery( '#order_fields [name="coupons[][key]"]' ).first().closest( 'li' );

	if ( ! jQuery( '#sortable_coupons > li' ).length && first_coupons_field.length ) {
		var coupons_group_block = jQuery( '#order_fields .flat-coupons-group' ).clone();
		jQuery( '#order_fields .flat-coupons-group' ).remove();
		first_coupons_field.before( coupons_group_block );
	}
}

function woe_synch_selected_fields( old_format, new_format ) {

	var settings = jQuery( '#export_job_settings' ).serializeJSON();

	if ( woe_is_flat_format( old_format ) && woe_is_flat_format( new_format ) ) {
		window['selected_order_fields'] = settings.orders || [];
		window['selected_order_products_fields'] = [];
		window['selected_order_coupons_fields'] = [];
		return;
	}

	if ( ! woe_is_flat_format( old_format ) && ! woe_is_flat_format( new_format ) ) {
		window['selected_order_fields'] = settings.orders || [];
		window['selected_order_products_fields'] = settings.products || [];
		window['selected_order_coupons_fields'] = settings.coupons || [];
		return;
	}

	if ( woe_is_flat_format( old_format ) && ! woe_is_flat_format( new_format ) ) {

		var products = [];
		var coupons = [];
		var orders = [];

		(
			settings.orders || []
		).forEach( function ( item ) {

			if ( item.key.indexOf( 'plain_products' ) > - 1 ) {
				item.key = item.key.replace( 'plain_products_', '' );
				products.push( item );
				return true;
			}

			if ( item.key.indexOf( 'plain_coupons' ) > - 1 ) {
				item.key = item.key.replace( 'plain_coupons_', '' );
				coupons.push( item );
				return true;
			}

			orders.push( item );
		} );

		window['selected_order_fields'] = orders;
		window['selected_order_products_fields'] = products;
		window['selected_order_coupons_fields'] = coupons;

		return;
	}

	if ( ! woe_is_flat_format( old_format ) && woe_is_flat_format( new_format ) ) {

		var products = [];
		var coupons = [];
		var orders = [];

		(
			settings.products || []
		).forEach( function ( item ) {
			item.key = 'plain_products_' + item.key;
			products.push( item );
		} );

		(
			settings.coupons || []
		).forEach( function ( item ) {
			item.key = 'plain_coupons_' + item.key;
			coupons.push( item );
		} );

		(
			settings.orders || []
		).forEach( function ( item ) {

			orders.push( item );

			if ( item.key === 'products' ) {
				orders = orders.concat( products );
			}

			if ( item.key === 'coupons' ) {
				orders = orders.concat( coupons );
			}
		} );

		window['selected_order_fields'] = orders;
		window['selected_order_products_fields'] = [];
		window['selected_order_coupons_fields'] = [];

		return;
	}

}

function woe_create_unselected_fields( old_output_format, format, format_changed, old_format_order_fields ) {

	var $unselected_fields_list = jQuery( '#unselected_fields_list' );

	var $unselected_segment_id = '%s_unselected_segment';

	var active_segment_id = $unselected_fields_list.find( '.section.active' ).attr( 'id' );

	$unselected_fields_list.html( "" );
	$unselected_fields_list.append( woe_make_segments( $unselected_segment_id ) );

	if ( active_segment_id ) {
		jQuery( '#unselected_fields_list #' + active_segment_id ).addClass( 'active' );
	}

	jQuery.each( window['all_fields'], function ( segment, fields ) {
		
			fields.forEach( function ( value ) {

				var $unselected_field_segment = jQuery( '#' + woe_sprintf( $unselected_segment_id, segment ) );
				var index = value.key;

				$unselected_field_segment.append(
					woe_make_unselected_field( index, value, format, format_changed, segment )
				);

				woe_activate_draggable_field(
					$unselected_field_segment.find( '.segment_field' ),
					segment,
					format
				);
			} )

	} );
}

function woe_make_segments( $segment_id ) {

	var $segments_list = jQuery( '<ul></ul>' );

	jQuery.each( window['order_segments'], function ( index, label ) {
		var $segment = jQuery( '<div id="' + woe_sprintf( $segment_id, index ) + '" class="section settings-segment"></div>' )
		$segments_list.append( $segment );
	} );

	return $segments_list;
}

function woe_sprintf( format ) {
	for ( var i = 1; i < arguments.length; i ++ ) {
		format = format.replace( /%s/, arguments[i] );
	}
	return format;
}

function woe_make_unselected_field( $index, $field_data, $format, $format_changed, $segment ) {
    if ( $segment === 'product_items' ) {
        $segment = 'products';
    }

	var label_part = '';
	var label_prefix = '';
	var value_part = '';

	var $mapping_col_1 = jQuery( '<div class="mapping_col_1" style="width: 10px"></div>' );

	var $mapping_col_2 = jQuery( '<div class="mapping_col_2" title="' + woe_escape_str( $index ) + '"></div>' );
	var $mapping_col_3 = jQuery( '<div class="mapping_col_3"></div>' );

	var colname = woe_escape_str( $field_data.colname );

	var _index = $index;

	if ( woe_is_flat_format( $format ) && ['products', 'coupons'].indexOf( $segment ) > - 1 ) {
		_index = 'plain_' + $segment + '_' + $index;
	}

	if ( $format_changed ) {
		if ( woe_is_flat_format( $format ) ) {
			colname = $field_data.label;
		} else {

			colname = $index;

			if ( woe_is_xml_format( $format ) ) {
				colname = woe_to_xml_tags( colname );
			}
		}
	}

	if ( ! woe_is_flat_format( $format ) && ['products', 'coupons'].indexOf( $segment ) > - 1 ) {

		$mapping_col_1
			.append( woe_make_input( 'hidden', null, $segment + '[][label]', $field_data.label, false ) )
			.append( woe_make_input( 'hidden', null, $segment + '[][format]', $field_data.format, false ) )
			.append( woe_make_input( 'hidden', null, $segment + '[][segment]', $segment, false ) )
			.append( woe_make_input( 'hidden', null, $segment + '[][key]', $index, false ) );

		$mapping_col_3.append( woe_make_input( 'input', 'mapping_fieldname', $segment + '[][colname]', colname ) );

		if ( $index.indexOf( 'static_field' ) >= 0 ) {
			value_part = '<div class="mapping_col_3 custom-field-value"><input class="mapping_fieldname" type=input name="' + $segment + '[][value]" value="' + $field_data.value + '"></div>';
		}

	} else {

		if ( $segment === 'products' ) {
			label_prefix = '[P] '
		}

		if ( $segment === 'coupons' ) {
			label_prefix = '[C] '
		}

		$mapping_col_1
			.append( woe_make_input( 'hidden', null, 'orders[][segment]', $segment, false ) )
			.append( woe_make_input( 'hidden', null, 'orders[][key]', _index, false ) )
			.append( woe_make_input( 'hidden', null, 'orders[][label]', $field_data.label, false ) )
			.append( woe_make_input( 'hidden', null, 'orders[][format]', $field_data.format, false ) );

		$mapping_col_3.append( woe_make_input( 'input', 'mapping_fieldname', 'orders[][colname]', colname ) );

		if ( $index.indexOf( 'static_field' ) >= 0 ) {
			value_part = '<div class="mapping_col_3 custom-field-value"><input class="mapping_fieldname" type=input name="' + 'orders[][value]" value="' + $field_data.value + '"></div>';
		}

	}
	var delete_btn = '<div class="mapping_col_3 mapping_row-delete_field_block"><a href="#" class="mapping_row-delete_field"><span class="dashicons dashicons-trash"></span></a></div>';

	$mapping_col_2.append( '<span class="field-prefix">' + label_prefix + '</span>' + $field_data.label + label_part );

	if ( $index.charAt( 0 ) === '_' || $index.substr( 0, 3 ) === 'pa_' || ! $field_data.default || $index.indexOf( 'static_field' ) > - 1 ) {
		$mapping_col_2.append( '<a href="#" onclick="return woe_remove_custom_field(this);" class="mapping_row-delete_custom_field" style="float: right;"><span class="ui-icon ui-icon-trash"></span></a>' );
	}

	var $field = jQuery( '<li class="mapping_row segment_field segment_' + $segment + '"></li>' );

	$field
		.append( $mapping_col_1 )
		.append( $mapping_col_2 )
		.append( $mapping_col_3 )
		.append( value_part )
		.append( delete_btn );

	$field.find( 'input' ).prop( 'disabled', 'disabled' );
	if($index.match(/summary_report_.+/))
		if((!jQuery('#summary_report_by_products_checkbox').is(":checked") && $segment == 'products') ||
		(!jQuery('#summary_report_by_customers_checkbox').is(":checked") && $segment == 'user'))
			$field.hide();
	return $field;
}

function woe_activate_draggable_field( el, segment, format ) {
    if ( segment === 'product_items' ) {
        segment = 'products';
    }

	var no_flat_sortable_selector = '#manage_fields #order_fields #sortable_' + segment;
	var flat_sortable_selector = '#manage_fields #order_fields';
	var sortable_products_selector = '';
	if(!woe_is_flat_format())
		sortable_products_selector = '#sortable_products';

	el.draggable( {
		connectToSortable: [no_flat_sortable_selector, flat_sortable_selector, sortable_products_selector].join( ',' ),
		helper: "clone",
		revert: "invalid",
		start: function ( event, ui ) {
			jQuery( ui.helper[0] ).removeClass( 'blink' );
		},
		stop: function ( event, ui ) {
			el.removeClass( 'blink' );

			var moved_to_sortable = jQuery( ui.helper[0] ).closest( flat_sortable_selector ).length;
			var move_to_sortable_group = jQuery( ui.helper[0] ).closest( no_flat_sortable_selector ).length;

			if ( ! moved_to_sortable ) {
				return;
			}

			woe_moving_products_and_coupons_group_blocks_to_first_item( format );

			// change static field key index to prevent fields with identical keys
            var tmp_prefix = '';
            if ( woe_is_flat_format( format ) && ['products', 'coupons'].indexOf( segment ) > - 1 ) {
                tmp_prefix = 'plain_' + segment + '_';
            }
			if ( jQuery( ui.helper[0] ).find( 'input[value*="' + tmp_prefix + 'static_field"]' ).length > 0 ) {
				var suffix = 0;
				jQuery( '#order_fields input[value*="' + tmp_prefix + 'static_field_"]' ).each( function () {

					var match = jQuery( this ).attr( 'value' ).match( /.*static_field_(\d+)/ );

					if ( ! match ) {
						return true;
					}

					var n = parseInt( match[1] );

					if ( n > suffix ) {
						suffix = n;
					}
				} );

				var field_key = tmp_prefix + 'static_field_' + (suffix + 1);

                if ( ! woe_is_flat_format( format ) && ['products', 'coupons'].indexOf( segment ) > - 1 ) {
                    jQuery( ui.helper[0] ).find( 'input[name="' + segment + '[][key]"]' ).first().val( field_key );
                } else {
                    jQuery( ui.helper[0] ).find( 'input[name="orders[][key]"]' ).first().val( field_key );
                }
			}
			// end change static field key

			var moving_copy_original_el = jQuery( ui.helper[0] );

			moving_copy_original_el
				.attr( 'style', '' )
				.addClass( 'ui-draggabled' )
				.removeClass( 'segment_field' )
				.find( 'input' ).prop( 'disabled', false );

			if (!woe_is_flat_format(format) && ['products', 'coupons'].indexOf(segment) === - 1 && moving_copy_original_el.closest('#sortable_products').length) {
			    var field_key = moving_copy_original_el.find('input[name="orders[][key]"]').val();
			    moving_copy_original_el.find('input[name="orders[][key]"]').val('orders__' + field_key);
			}

			if ( woe_is_flat_format( format ) || move_to_sortable_group || [
				                                                               'products',
				                                                               'coupons'
			                                                               ].indexOf( segment ) === - 1 ) {
				return;
			}

			jQuery( no_flat_sortable_selector ).append( moving_copy_original_el.clone() );

			moving_copy_original_el.remove();

			woe_check_sortable_groups();
		},
	} );

}

function woe_check_sortable_groups() {
	jQuery( '#sortable_products' ).closest( '.mapping_row' ).toggle( ! ! jQuery( '#sortable_products li' ).length );
	jQuery( '#sortable_coupons' ).closest( '.mapping_row' ).toggle( ! ! jQuery( '#sortable_coupons li' ).length );
}

//for XML labels
function woe_to_xml_tags( str ) {
	var arr = str.split( /_/ );
	for ( var i = 0, l = arr.length; i < l; i ++ ) {
		arr[i] = arr[i].substr( 0, 1 ).toUpperCase() + (
			arr[i].length > 1 ? arr[i].substr( 1 ).toLowerCase() : ""
		);
	}
	return arr.join( "_" );
}

function woe_make_repeat_options( index ) {

	var repeat_select = jQuery( '<select name="duplicated_fields_settings[' + index + '][repeat]"></select>' );
	var repeat_options_html = {};

	jQuery.each( localize_settings_form.repeats, function ( key, currentValue ) {
		repeat_select.append( '<option value="' + key + '">' + currentValue + '</option>' );
		repeat_options_html[key] = [];
	} );

	var duplicate_settings = window.duplicated_fields_settings[index] || {};
	var repeat_value = (
		typeof(
			duplicate_settings.repeat
		) !== 'undefined'
	) ? duplicate_settings.repeat : "rows";
	repeat_select.val( repeat_value );

	// rows options
	if ( index === 'products' ) {
		var populate_check_on = duplicate_settings.populate_other_columns === '1' ? 'checked' : '';
		var populate_check_off = duplicate_settings.populate_other_columns === '1' ? '' : 'checked';
		var populate_check_html = '<div class="">' +
		                          '<label>' + localize_settings_form.js_tpl_popup.fill_order_columns_label + '</label>' +
		                          '<label>' +
		                          '<input type=radio name="duplicated_fields_settings[' + index + '][populate_other_columns]" value=1 ' + populate_check_on + ' >' +
		                          localize_settings_form.js_tpl_popup.for_all_rows_label + '</label>' +
		                          '<label>' +
		                          '<input type=radio name="duplicated_fields_settings[' + index + '][populate_other_columns]" value=0 ' + populate_check_off + ' >' +
		                          localize_settings_form.js_tpl_popup.for_first_row_only_label + '</label>' +
		                          '</div>';
		repeat_options_html['rows'].push( populate_check_html );
	}

	// columns options
	var max_cols = (
		typeof(
			duplicate_settings.max_cols
		) !== 'undefined'
	) ? duplicate_settings.max_cols : "10";

	var max_cols_html = '<div class="">' +
	                    '<label>' + localize_settings_form.js_tpl_popup.add + '</label>' +
	                    '<input type=text size=2 name="duplicated_fields_settings[' + index + '][max_cols]" value="' + max_cols + '"> ' +
	                    '<label>' + localize_settings_form.repeats.columns + '</label>' +
	                    '</div>';

	var grouping_by_product_check = duplicate_settings.group_by === 'product' ? 'checked' : '';
	var group_by_item_check_html = '<div class="">' +
	                               '<input type="hidden" name="duplicated_fields_settings[' + index + '][group_by]" value="as_independent_columns" >' +
	                               '<input type="checkbox" name="duplicated_fields_settings[' + index + '][group_by]" value="product" ' + grouping_by_product_check + '>' +
	                               '<label>' + localize_settings_form.js_tpl_popup.grouping_by[index] + '</label>' +
	                               '</div>';
	repeat_options_html['columns'].push( max_cols_html );
	repeat_options_html['columns'].push( group_by_item_check_html );

	// inside one cell options
	var line_delimiter = (
		typeof(
			duplicate_settings.line_delimiter
		) !== 'undefined'
	) ? duplicate_settings.line_delimiter : '\\n';
	var line_delimiter_html = '<div class="">' +
	                          '<label>' + localize_settings_form.js_tpl_popup.split_values_by +
	                          '<input class="input-delimiter" type=text size=1 name="duplicated_fields_settings[' + index + '][line_delimiter]" value="' + line_delimiter + '">' +
	                          '</label>' +
	                          '</div>';
	repeat_options_html['inside_one_cell'].push( line_delimiter_html );

	var popup_options = jQuery( '<div class=""></div>' );
	popup_options.append( jQuery( '<div class="segment-header segment-header_flex-styles">' + '<label>' + localize_settings_form.js_tpl_popup.add + ' ' + index + ' ' + localize_settings_form.js_tpl_popup.as + '</label>' + '</div>' ).append( repeat_select ) );

	jQuery.each( repeat_options_html, function ( key, currentValue ) {
		popup_options.append( jQuery( '<div class="display_as duplicate_' + key + '_options"></div>' ).append( currentValue ) );
	} );

	popup_options.append( "<hr>" );

	repeat_select.off( 'change' ).on( 'change', function () {
		jQuery( this ).parent().siblings( '.display_as' ).removeClass( 'active' );
		jQuery( this ).parent().siblings( '.duplicate_' + this.value + '_options' ).addClass( 'active' );
	} ).trigger( 'change' );

	return popup_options;
}

function woe_remove_custom_field( item ) {
	jQuery( item ).parent().parent().remove();
	return false;
}

function woe_make_input( $type, $classes, $name, $field_data, $is_checked ) {

	var $input = jQuery( '<input>' );

	$input.prop( 'type', $type );

	if ( $classes && jQuery.isArray( $classes ) ) {
		$input.addClass( $classes.join( ' ' ) );
	}

	$input.prop( 'name', $name );
	$input.attr( 'value', $field_data );

	if ( $is_checked ) {
		$input.prop( 'checked', 'checked' );
	}

	return $input;
}

function woe_is_xml_format( format ) {
	return (
		settings_form.xml_formats.indexOf( format ) > - 1
	);
}

function woe_add_bind_for_custom_fields( prefix, output_format, $to ) {
	jQuery( '#button_custom_field_' + prefix + '' ).off();
	jQuery( '#button_custom_field_' + prefix + '' ).click( function () {
		var colname = jQuery( '#colname_custom_field_' + prefix + '' ).val();
		var value = jQuery( '#value_custom_field_' + prefix + '' ).val();
		var format_field = jQuery( '#format_custom_field_' + prefix + '' ).val();
		if ( ! colname ) {
			alert( export_messages.empty_column_name );
			jQuery( '#colname_custom_field_' + prefix + '' ).focus();
			return false
		}
		if ( ! value && 'products' !== prefix ) {
			alert( export_messages.empty_value );
			jQuery( '#value_custom_field_' + prefix + '' ).focus();
			return false
		}

		jQuery( '#colname_custom_field_' + prefix + '' ).val( "" );

		jQuery( '#value_custom_field_' + prefix + '' ).val( "" );
		jQuery( '#format_custom_field_' + prefix + '' ).val( "" );

		var segment = jQuery( '.segment_choice.active' ).attr( 'data-segment' );

		woe_add_custom_field( jQuery( "#" + segment + '_unselected_segment' ), prefix, output_format, colname, value, segment, format_field );

		jQuery( this ).siblings( '.button-cancel' ).trigger( 'click' );

		return false;
	} );

	jQuery( '#button_custom_meta_' + prefix + '' ).off();
	jQuery( '#button_custom_meta_' + prefix + '' ).click( function () {
		var prefix_items = 'order_items',
			original_prefix = prefix,
			prefix_items_select = jQuery( '#select_custom_meta_' + prefix_items + '' ),
			prefix_product_select = jQuery( '#select_custom_meta_' + prefix + '' ),
			prefix_product_text = jQuery( '#text_custom_meta_' + prefix + '' ),
			prefix_items_text = jQuery( '#text_custom_meta_' + prefix_items + '' );

		var type = (
			prefix_items_select.val() ||
			prefix_product_select.val() ||
			prefix_product_text.val() ||
			prefix_items_text.val()
		) ? 'meta' : 'taxonomies';

		if ( 'meta' === type ) {
			original_prefix = prefix_product_select.val() || prefix_product_text.val() ? prefix : prefix_items;
		} else {
			original_prefix = prefix;
		}
		type = type + '_' + original_prefix;
		var label = jQuery( '#select_custom_' + type + '' ).val();
		var colname = jQuery( '#colname_custom_meta_' + prefix + '' ).val();
		var field_format = jQuery( '#format_custom_meta_' + prefix + '' ).val();

		if ( ! label ) //try custom text
		{
			label = jQuery( '#text_custom_' + type ).val();
		}

		if ( ! label ) {
			if(prefix == 'products') {
				alert( export_messages.empty_meta_key_and_taxonomy );
			}
			else if(prefix == 'product_items') {
				alert( export_messages.empty_item_field );
			}
			else {
				alert( export_messages.empty_meta_key );
			}
			return false
		}
		if ( colname == undefined || colname == '' ) {
			colname = label;
		}
		if ( ! colname ) {
			alert( export_messages.empty_column_name );
			return false
		}

		var segment = jQuery( '.segment_choice.active' ).attr( 'data-segment' );

		woe_add_custom_meta( jQuery( "#" + segment + '_unselected_segment' ), prefix, output_format, label, colname, segment, field_format );

		jQuery( this ).siblings( '.button-cancel' ).trigger( 'click' );

		jQuery( '#select_custom_' + type + '' ).val( "" );
		jQuery( '#colname_custom_meta_' + prefix + '' ).val( "" );
		jQuery( '#format_custom_meta_' + prefix + '' ).val( "" );
		return false;
	} );

	jQuery( '#button_custom_calculated_' + prefix + '' ).off();
	jQuery( '#button_custom_calculated_' + prefix + '' ).click( function () {
		var metakey = jQuery( '#metakey_custom_calculated_' + prefix + '' ).val();
		var label = jQuery( '#label_custom_calculated_' + prefix + '' ).val();
		var format_field = jQuery( '#format_custom_calculated_' + prefix + '' ).val();
		if ( ! metakey ) {
			alert( export_messages.empty_column_name );
			jQuery( '#metakey_custom_calculated_' + prefix + '' ).focus();
			return false
		}
		if ( ! label && 'products' !== prefix ) {
			alert( export_messages.empty_value );
			jQuery( '#label_custom_calculated_' + prefix + '' ).focus();
			return false
		}

		jQuery( '#metakey_custom_calculated_' + prefix + '' ).val( "" );

		jQuery( '#label_custom_calculated_' + prefix + '' ).val( "" );
		jQuery( '#format_custom_calculated_' + prefix + '' ).val( "" );

		var segment = jQuery( '.segment_choice.active' ).attr( 'data-segment' );

		woe_add_custom_meta( jQuery( "#" + segment + '_unselected_segment' ), prefix, output_format, metakey, label, segment, format_field );

		jQuery( this ).siblings( '.button-cancel' ).trigger( 'click' );

		return false;
	} );
}

function woe_add_custom_field( to, index_p, format, colname, value, segment, format_field ) {

    if ( segment === 'product_items' ) {
        segment = 'products';
    }

    if ( index_p === 'product_items' ) {
        index_p = 'products';
    }

	value = woe_escape_str( value );
	colname = woe_escape_str( colname );

	if ( woe_is_flat_format( format ) ) {
		_index = 'plain_' + index_p + '_';
		_index_p = 'orders[]';
	} else {
		_index = '';
		_index_p = index_p + '[]';
	}

	var label_prefix = '';

	if ( woe_is_flat_format( format ) ) {

		if ( segment === 'products' ) {
			label_prefix = '[P] '
		}

		if ( segment === 'coupons' ) {
			label_prefix = '[C] '
		}
	}

	var suffix = 0;

	jQuery( '#unselected_fields input[value*="static_field_"]' ).each( function () {

		var match = jQuery( this ).attr( 'value' ).match( /static_field_(\d+)/ );

		if ( ! match ) {
			return true;
		}

		var n = parseInt( match[1] );

		if ( n > suffix ) {
			suffix = n;
		}
	} );

	var field_key = 'static_field_' + (
	                suffix + 1
	);

	var delete_btn = '<div class="mapping_col_3 mapping_row-delete_field_block"><a href="#" class="mapping_row-delete_field"><span class="dashicons dashicons-trash"></span></a></div>';

//    console.log( to, index_p, format, colname, value );
	var row = jQuery( '<li class="mapping_row segment_field segment_' + segment + '">\
                    <div class="mapping_col_1" style="width: 10px">\
                            <input class="mapping_fieldname" type=hidden name="' + _index_p + '[segment]" value="' + (
		segment ? segment : 'misc'
	) + '">\
                            <input class="mapping_fieldname" type=hidden name="' + _index_p + '[key]" value="' + _index + field_key + '">\
                            <input class="mapping_fieldname" type=hidden name="' + _index_p + '[label]" value="' + colname + '">\
                            <input class="mapping_fieldname" type=hidden name="' + _index_p + '[format]" value="' + format_field + '">\
                    </div>\
                    <div class="mapping_col_2" title="' + field_key + '">' + '<span class="field-prefix">' + label_prefix + '</span>' + colname + '<a href="#" onclick="return woe_remove_custom_field(this);" class="mapping_row-delete_custom_field" style="float: right;"><span class="ui-icon ui-icon-trash"></span></a></div>\
                    <div class="mapping_col_3"><input class="mapping_fieldname" type=input name="' + _index_p + '[colname]" value="' + colname + '"></div>\
                    <div class="mapping_col_3 custom-field-value"><input class="mapping_fieldname" type=input name="' + _index_p + '[value]" value="' + value + '"></div>' + delete_btn + '\
            </li>\
                        ' );

	row.find( 'input' ).prop( 'disabled', 'disabled' );

	to.prepend( row );

	woe_activate_draggable_field(
		to.find( '.segment_field' ).first(),
		segment,
		format
	);

	to.find( '.segment_field' ).first().addClass( 'blink' );

	var field = {
		key: field_key,
		colname: colname,
		'default': 0,
		label: colname,
		format: 'string',
		value: value,
	};

	window.all_fields[segment].unshift( field );
}

function woe_add_custom_meta( to, index_p, format, label, colname, segment, format_field ) {

    if ( segment === 'product_items' ) {
        segment = 'products';
    }

    if ( index_p === 'product_items' ) {
        index_p = 'products';
    }

	label = woe_escape_str( label );
	colname = woe_escape_str( colname );

	if ( woe_is_flat_format( format ) ) {
		_index = 'plain_' + index_p + '_' + label;
		_index_p = 'orders[]';
	} else {
		_index = label;
		_index_p = index_p + '[]';
	}

	var label_prefix = '';

	if ( woe_is_flat_format( format ) ) {

		if ( segment === 'products' ) {
			label_prefix = '[P] '
		}

		if ( segment === 'coupons' ) {
			label_prefix = '[C] '
		}
	}

	var delete_btn = '<div class="mapping_col_3 mapping_row-delete_field_block"><a href="#" class="mapping_row-delete_field"><span class="dashicons dashicons-trash"></span></a></div>';

	var row = jQuery( '<li class="mapping_row segment_field segment_' + segment + '">\
        <div class="mapping_col_1" style="width: 10px">\
                <input class="mapping_fieldname" type=hidden name="' + _index_p + '[segment]" value="' + (
		segment ? segment : 'misc'
	) + '">\
                <input class="mapping_fieldname" type=hidden name="' + _index_p + '[key]" value="' + _index + '">\
                <input class="mapping_fieldname" type=hidden name="' + _index_p + '[label]" value="' + label + '">\
                <input class="mapping_fieldname" type=hidden name="' + _index_p + '[format]" value="' + format_field + '">\
        </div>\
        <div class="mapping_col_2" title="' + label + '">' + '<span class="field-prefix">' + label_prefix + '</span>' + label + '<a href="#" onclick="return woe_remove_custom_field(this);" class="mapping_row-delete_custom_field" style="float: right;"><span class="ui-icon ui-icon-trash"></span></a></div>\
        <div class="mapping_col_3"><input class="mapping_fieldname" type=input name="' + _index_p + '[colname]" value="' + colname + '"></div>' + delete_btn + '\
</li>\
                        ' );

	row.find( 'input' ).prop( 'disabled', 'disabled' );

	to.prepend( row );

	woe_activate_draggable_field(
		to.find( '.segment_field' ).first(),
		segment,
		format
	);

	to.find( '.segment_field' ).first().addClass( 'blink' );

	var field = {
		key: label,
		colname: colname,
		'default': 0,
		label: label,
		segment: segment,
		format: 'string',
		value: 'undefined',
	};

	window.all_fields[segment].unshift( field );
}

function woe_reset_field_contorls() {

    jQuery( '.tab-actions-forms .segment-form' ).removeClass( 'active' ).find( 'input,select' ).val( '' )

    jQuery( '.tab-actions-forms .segment-form select' ).each(function () {
	if (jQuery(this).find('option[selected]')) {
	    jQuery(this).val(jQuery(this).find('option[selected]').attr('value'));
	}
    });
}

function woe_escape_str( str ) {

	var entityMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': '&quot;',
		"'": '&#39;',
		"/": '&#x2F;'
	};

	jQuery.each( entityMap, function ( key, value ) {
		str = String( str ).replace( value, key );
	} );

	return String( str ).replace( /[&<>"'\/]/g, function ( s ) {
		return entityMap[s];
	} );
}

jQuery( document ).ready( function ( $ ) {

	$( '#clear_selected_fields' ).click( function () {
		if ( confirm( localize_settings_form.remove_all_fields_confirm ) ) {
			if ( $( '#order_fields .mapping_row-delete_field' ).length > 0 ) {
				$( '#order_fields .mapping_row-delete_field' ).click();
			}
		}
	} );

	$( '.segment_choice' ).click( function () {

		var segment = $( this ).data( 'segment' );
	
		$('.tab-actions-buttons').hide();

		if ($('.tab-actions-buttons.' + segment + '-actions-buttons').length) {
		    $('.tab-actions-buttons.' + segment + '-actions-buttons').show();
		} else {
		    $('.tab-actions-buttons.default-actions').show();
		}

		$( '.segment_choice' ).removeClass( 'active' );
		$( this ).addClass( 'active' );

		$( '.settings-segment' ).removeClass( 'active' );
		$( '#' + $( this ).data( 'segment' ) + '_unselected_segment' ).addClass( 'active' );

		$( '.woe_segment_tips' ).removeClass( 'active' );
		$( '#woe_tips_' + $( this ).data( 'segment' ) ).addClass( 'active' );

		$('.add-calculated').hide();
		if(jQuery.inArray(segment, ["common", "products", "product_items"]) >= 0) {
			$('.add-calculated').show();
		}

		window.location.href = $( this ).attr( 'href' );

		woe_reset_field_contorls();
	} );


	setTimeout(function () {
	    woe_create_selected_fields( null, output_format, false );
	    if ( summary_mode_by_products ) {
		$( '.segment_choice[href="#segment=products"]' ).click()
	    } else if ( summary_mode_by_customers ) {
			    $( '.segment_choice[href="#segment=user"]' ).click()
		    } else if ( window.location.hash.indexOf( 'segment' ) !== - 1 ) {
		$( '.segment_choice[href="' + window.location.hash + '"]' ).click()
	    } else {
			    $( '.segment_choice' ).first().click();
		    }
	}, 1000);

	jQuery( '#adjust-fields-btn' ).click( function () {
	    jQuery( '#fields' ).toggle();
	    jQuery( '#fields_control' ).toggle();
	    return false;
	} );

	setTimeout( function () {

	    jQuery( "#sort_products" ).sortable()/*.disableSelection()*/;
	    jQuery( "#sort_coupons" ).sortable()/*.disableSelection()*/;

	    jQuery( "#order_fields" ).sortable( {
		    scroll: true,
		    scrollSensitivity: 100,
		    scrollSpeed: 100,
		    stop: function ( event, ui ) {
			    woe_moving_products_and_coupons_group_blocks_to_first_item( jQuery( '.output_format:checked' ).val() );
		    }
	    } );
	}, 0);

	jQuery( '.field_section' ).click( function () {

		var section = jQuery( this ).val();
		var checked = jQuery( this ).is( ':checked' );

		jQuery( '.segment_' + section ).each( function ( index ) {
			if ( checked ) {
				jQuery( this ).show();
				//jQuery(this).find('input:checkbox:first').attr('checked', true);
			}
			else {
				jQuery( this ).hide();
				jQuery( this ).find( 'input:checkbox:first' ).attr( 'checked', false );
			}
		} );

	} );

	jQuery( '#order_fields' ).on( 'click', '.mapping_row-delete_field', function () {

		$( this ).closest( '.mapping_row' ).remove();

		woe_check_sortable_groups();

		return false;
	} );

	jQuery( '.tab-controls .tab-actions-buttons .add-meta' ).on( 'click', function () {

		jQuery( '.tab-actions-forms .segment-form' ).removeClass( 'active' );

		if ( jQuery( '.tab-actions-forms .div_meta.segment-form.' +
		             jQuery( '#unselected_fields .segment_choice.active' ).attr( 'data-segment' ) + '-segment'
			).length ) {
			jQuery( '.tab-actions-forms .div_meta.segment-form.' +
			        jQuery( '#unselected_fields .segment_choice.active' ).attr( 'data-segment' ) + '-segment'
			).addClass( 'active' );
		} else {
			jQuery( '.tab-actions-forms .div_meta.segment-form.all-segments' ).addClass( 'active' );
		}

		return false;
	} );

	jQuery( '.tab-controls .tab-actions-buttons .add-custom' ).on( 'click', function () {

		jQuery( '.tab-actions-forms .segment-form' ).removeClass( 'active' );

		if ( jQuery( '.tab-actions-forms .div_custom.segment-form.' +
		             jQuery( '#unselected_fields .segment_choice.active' ).attr( 'data-segment' ) + '-segment'
			).length ) {
			jQuery( '.tab-actions-forms .div_custom.segment-form.' +
			        jQuery( '#unselected_fields .segment_choice.active' ).attr( 'data-segment' ) + '-segment'
			).addClass( 'active' );
		} else {
			jQuery( '.tab-actions-forms .div_custom.segment-form.all-segments' ).addClass( 'active' );
		}

		return false;
	} );

	jQuery( '.tab-controls .tab-actions-buttons .add-calculated' ).on( 'click', function () {

		jQuery( '.tab-actions-forms .segment-form' ).removeClass( 'active' );

		if ( jQuery( '.tab-actions-forms .div_calculated.segment-form.' +
		        jQuery( '#unselected_fields .segment_choice.active' ).attr( 'data-segment' ) + '-segment'
			).length ) {
			jQuery( '.tab-actions-forms .div_calculated.segment-form.' +
			        jQuery( '#unselected_fields .segment_choice.active' ).attr( 'data-segment' ) + '-segment'
			).addClass( 'active' );
		} else {
			jQuery( '.tab-actions-forms .div_calculated.segment-form.all-segments' ).addClass( 'active' );
		}

		return false;
	} );

	jQuery( '.tab-controls .button-cancel' ).on( 'click', function () {

		jQuery( this ).closest( '.segment-form' )
		              .removeClass( 'active' )
		              .find( 'input,select' ).val( '' );

		jQuery( this ).closest( '.segment-form' ).find( 'select' ).each(function () {
		    if (jQuery(this).find('option[selected]')) {
			jQuery(this).val(jQuery(this).find('option[selected]').attr('value'));
		    }
		});

		return false;
	} );

	jQuery( '.button_cancel' ).click( function () {
		woe_reset_field_contorls();
		return false;
	} );

	jQuery( '#button_custom_field' ).click( function () {

		var colname = jQuery( '#colname_custom_field' ).val();
		var value = jQuery( '#value_custom_field' ).val();
		var format_field = jQuery( '#format_custom_field' ).val();
		if ( ! colname ) {
			alert( export_messages.empty_column_name );
			jQuery( '#colname_custom_field' ).focus();
			return false
		}

		var segment = jQuery( '.segment_choice.active' ).attr( 'data-segment' );

		woe_add_custom_field( jQuery( "#" + segment + '_unselected_segment' ), 'orders', output_format, colname, value, segment, format_field );

		woe_reset_field_contorls();

		jQuery( this ).siblings( '.button-cancel' ).trigger( 'click' );

		return false;
	} );

	jQuery( '#button_custom_meta' ).click( function () {

		var label = jQuery( '#select_custom_meta_order' ).val();
		var colname = jQuery( '#colname_custom_meta' ).val();
		var format_field = jQuery( '#format_custom_meta' ).val();
		if ( ! label ) //try custom text
		{
			label = jQuery( '#text_custom_meta_order' ).val();
		}
		;
		if ( ! label ) {
			alert( export_messages.empty_meta_key );
			jQuery( '#select_custom_meta_order' ).focus();
			return false
		}
		if ( ! colname ) {
			alert( export_messages.empty_column_name );
			jQuery( '#colname_custom_meta' ).focus();
			return false
		}

		var segment = jQuery( '.segment_choice.active' ).attr( 'data-segment' );

		woe_add_custom_meta( jQuery( "#" + segment + '_unselected_segment' ), 'orders', output_format, label, colname, segment, format_field );

		woe_reset_field_contorls();

		jQuery( this ).siblings( '.button-cancel' ).trigger( 'click' );

		return false;
	} );

    jQuery('#button_custom_meta_users').click(function () {
        var label = jQuery('#select_custom_meta_user').val();
        var colname = jQuery('#colname_custom_meta_user').val();
        var format_field = jQuery('#format_custom_meta').val();
        if (!label) {
            //try custom text
            label = jQuery('#text_custom_meta_user').val();
        }
        if (!label) {
            alert(export_messages.empty_meta_key);
            jQuery('#select_custom_meta_user').focus();
            return false
        }
        if (!colname) {
            alert(export_messages.empty_column_name);
            jQuery('#colname_custom_meta_user').focus();
            return false
        }

        var segment = jQuery('.segment_choice.active').attr('data-segment');

        woe_add_custom_meta(jQuery("#" + segment + '_unselected_segment'), 'orders', output_format, label, colname, segment, format_field);

        woe_reset_field_contorls();

        jQuery(this).siblings('.button-cancel').trigger('click');

        return false;
    });

	jQuery( '#button_custom_calculated' ).click( function () {
		var metakey = jQuery( '#metakey_custom_calculated' ).val();
		var label = jQuery( '#label_custom_calculated' ).val();
		var format_field = jQuery( '#format_custom_calculated' ).val();
		if ( ! metakey ) {
			alert( export_messages.empty_meta_key );
			jQuery( '#metakey_custom_calculated' ).focus();
			return false
		}
		if ( ! label ) {
			alert( export_messages.empty_column_name );
			jQuery( '#label_custom_calculated' ).focus();
			return false
		}

		var segment = jQuery( '.segment_choice.active' ).attr( 'data-segment' );

		woe_add_custom_meta( jQuery( "#" + segment + '_unselected_segment' ), 'orders', output_format, metakey, label, segment, format_field );

		woe_reset_field_contorls();

		jQuery( this ).siblings( '.button-cancel' ).trigger( 'click' );

		return false;
	} );

	jQuery( '.tab-controls .other_items-actions-buttons .add-fee' ).on( 'click', function () {
	    jQuery( '.tab-actions-forms .segment-form' ).removeClass( 'active' );
	    jQuery( '.tab-actions-forms .segment-form.other-items-add-fee-form' ).addClass( 'active' );
	    return false;
	} );

	jQuery( '.other-items-add-fee-form #button_other_items_add_fee_field' ).on( 'click', function () {

	    var segment = jQuery( '.segment_choice.active' ).attr( 'data-segment' );

	    var label	= jQuery( '#select_fee_items' ).val();
	    var colname = jQuery( '#colname_fee_item_other_items' ).val();

	    if ( ! label ) {
		alert( export_messages.empty_meta_key );
		jQuery( '#select_fee_items' ).focus();
		return false
	    }

	    if ( ! colname ) {
		alert( export_messages.empty_column_name );
		jQuery( '#colname_fee_item_other_items' ).focus();
		return false
	    }

	    var format_field = jQuery( '#format_fee_item_other_items' ).val();

	    woe_add_custom_meta(jQuery("#" + segment + '_unselected_segment'), 'orders', output_format, label, colname, segment, format_field);

	    jQuery( this ).siblings( '.button-cancel' ).trigger( 'click' );

	    return false;
	} );

	function load_order_fee_items() {

	    jQuery.post(
		ajaxurl,
		{
		    action: 'order_exporter',
		    method: 'get_used_order_fee_items',
		    woe_nonce: settings_form.woe_nonce,
		    tab: settings_form.woe_active_tab,
		},
		function ( response ) {
		    if ( response ) {
			var options = '';
			jQuery.each( response, function ( index, value ) {
				options += '<option value="' + woe_escape_str( value ) + '">' + value.replace('FEE_', '') + '</option>';
			} );
			jQuery( '#select_fee_items' ).html( options );
		    }
		},
		'json'
	    );
	}

	setTimeout( function () {
	    load_order_fee_items();
	}, 0);

	jQuery( '.tab-controls .other_items-actions-buttons .add-shipping' ).on( 'click', function () {
	    jQuery( '.tab-actions-forms .segment-form' ).removeClass( 'active' );
	    jQuery( '.tab-actions-forms .segment-form.other-items-add-shipping-form' ).addClass( 'active' );
	    return false;
	} );

	jQuery( '.other-items-add-shipping-form #button_other_items_add_shipping_field' ).on( 'click', function () {

	    var segment = jQuery( '.segment_choice.active' ).attr( 'data-segment' );

	    var label	= jQuery( '#select_shipping_items' ).val();
	    var colname = jQuery( '#colname_shipping_item_other_items' ).val();

	    if ( ! label ) {
		alert( export_messages.empty_meta_key );
		jQuery( '#select_shipping_items' ).focus();
		return false
	    }

	    if ( ! colname ) {
		alert( export_messages.empty_column_name );
		jQuery( '#colname_shipping_item_other_items' ).focus();
		return false
	    }

	    var format_field = jQuery( '#format_shipping_item_other_items' ).val();

	    woe_add_custom_meta(jQuery("#" + segment + '_unselected_segment'), 'orders', output_format, label, colname, segment, format_field);

	    jQuery( this ).siblings( '.button-cancel' ).trigger( 'click' );

	    return false;
	} );

	function load_order_shipping_items() {

	    jQuery.post(
		ajaxurl,
		{
		    action: 'order_exporter',
		    method: 'get_used_order_shipping_items',
		    woe_nonce: settings_form.woe_nonce,
		    tab: settings_form.woe_active_tab,
		},
		function ( response ) {
		    if ( response ) {
			var options = '';
			jQuery.each( response, function ( index, value ) {
				options += '<option value="' + woe_escape_str( value ) + '">' + value.replace('SHIPPING_', '') + '</option>';
			} );
			jQuery( '#select_shipping_items' ).html( options );
		    }
		},
		'json'
	    );
	}

	setTimeout( function () {
	    load_order_shipping_items();
	}, 0);

	jQuery( '.tab-controls .other_items-actions-buttons .add-tax' ).on( 'click', function () {
	    jQuery( '.tab-actions-forms .segment-form' ).removeClass( 'active' );
	    jQuery( '.tab-actions-forms .segment-form.other-items-add-tax-form' ).addClass( 'active' );
	    return false;
	} );

	jQuery( '.other-items-add-tax-form #button_other_items_add_tax_field' ).on( 'click', function () {

	    var segment = jQuery( '.segment_choice.active' ).attr( 'data-segment' );

	    var label	= jQuery( '#select_tax_items' ).val();
	    var colname = jQuery( '#colname_tax_item_other_items' ).val();

	    if ( ! label ) {
		alert( export_messages.empty_meta_key );
		jQuery( '#select_tax_items' ).focus();
		return false
	    }

	    if ( ! colname ) {
		alert( export_messages.empty_column_name );
		jQuery( '#colname_tax_item_other_items' ).focus();
		return false
	    }

	    var format_field = jQuery( '#format_tax_item_other_items' ).val();

	    woe_add_custom_meta(jQuery("#" + segment + '_unselected_segment'), 'orders', output_format, label, colname, segment, format_field);

	    jQuery( this ).siblings( '.button-cancel' ).trigger( 'click' );

	    return false;
	} );

	function load_order_tax_items() {

	    jQuery.post(
		ajaxurl,
		{
		    action: 'order_exporter',
		    method: 'get_used_order_tax_items',
		    woe_nonce: settings_form.woe_nonce,
		    tab: settings_form.woe_active_tab,
		},
		function ( response ) {
		    if ( response ) {
			var options = '';
			jQuery.each( response, function ( index, value ) {
				options += '<option value="' + woe_escape_str( value ) + '">' + value.replace('TAX_', '') + '</option>';
			} );
			jQuery( '#select_tax_items' ).html( options );
		    }
		},
		'json'
	    );
	}

	setTimeout( function () {
	    load_order_tax_items();
	}, 0);

	///*CUSTOM FIELDS BINDS

	jQuery( 'input[name=custom_meta_order_mode]' ).change( function () {

        var fill_custom_meta_fields = function (source) {
			jQuery.each(source, function (index, value) {
				var options = '<option></option>';
				jQuery.each(value, function (meta_id, meta_label) {
					options += '<option value="' + woe_escape_str(meta_label) + '">' + meta_label + '</option>';
				});
				jQuery('#select_custom_meta_' + index).html(options);
			});
		};

		if (!jQuery(this).prop('checked')) {
            fill_custom_meta_fields(window.order_custom_meta_fields);
		} else {
			var json = woe_make_json_var(jQuery('#export_job_settings'));
			var data = "json=" + json + "&action=order_exporter&method=get_used_custom_order_meta&woe_nonce=" + settings_form.woe_nonce + '&tab=' + settings_form.woe_active_tab;

			jQuery.post(ajaxurl, data, function (response) {
				if (response) {
                    fill_custom_meta_fields(response);
				}
			}, 'json');
		}
	} );

	jQuery( 'input[name=custom_meta_products_mode]' ).change( function () {
		jQuery( '#select_custom_meta_products' ).prop( "disabled", true );
		if ( ! jQuery( this ).is( ':checked' ) ) {
			var options = '<option></option>';
			jQuery.each( window.order_products_custom_meta_fields, function ( index, value ) {
				options += '<option value="' + woe_escape_str( value ) + '">' + value + '</option>';
			} );
			jQuery( '#select_custom_meta_products' ).html( options );
			jQuery( '#select_custom_meta_products' ).prop( "disabled", false );
		}
		else {
//            jQuery('#modal-manage-products').html(jQuery('#TB_ajaxContent').html());
			//var data = jQuery( '#export_job_settings' ).serialize(),
			var data = 'json=' + woe_make_json_var( jQuery( '#export_job_settings' ) ),
				data_products = data + "&action=order_exporter&method=get_used_custom_products_meta&mode=" + mode + "&id=" + job_id + '&woe_nonce=' + settings_form.woe_nonce + '&tab=' + settings_form.woe_active_tab;

			jQuery.post( ajaxurl, data_products, function ( response ) {
				if ( response ) {
					var options = '<option></option>';
					jQuery.each( response, function ( index, value ) {
						options += '<option value="' + woe_escape_str( value ) + '">' + value + '</option>';
					} );
					jQuery( '#select_custom_meta_products' ).html( options );
					jQuery( '#select_custom_meta_products' ).prop( "disabled", false );
				}
			}, 'json' );
//            jQuery('#modal-manage-products').html('');
		}
	} );

	jQuery( 'input[name=custom_meta_product_items_mode]' ).change( function () {
		jQuery( '#select_custom_meta_order_items' ).prop( "disabled", true );
		if ( ! jQuery( this ).is( ':checked' ) ) {
			options = '<option></option>';
			jQuery.each( window.order_order_item_custom_meta_fields, function ( index, value ) {
				options += '<option value="' + woe_escape_str( value ) + '">' + value + '</option>';
			} );
			jQuery( '#select_custom_meta_order_items' ).html( options );
			jQuery( '#select_custom_meta_order_items' ).prop( "disabled", false );
		}
		else {
//            jQuery('#modal-manage-products').html(jQuery('#TB_ajaxContent').html());
			//var data = jQuery( '#export_job_settings' ).serialize(),
			var data = 'json=' + woe_make_json_var( jQuery( '#export_job_settings' ) ),
			data_order_items = data + "&action=order_exporter&method=get_used_custom_order_items_meta&mode=" + mode + "&id=" + job_id + '&woe_nonce=' + settings_form.woe_nonce + '&tab=' + settings_form.woe_active_tab;

			jQuery.post( ajaxurl, data_order_items, function ( response ) {
				if ( response ) {
					var options = '<option></option>';
					jQuery.each( response, function ( index, value ) {
						options += '<option value="' + woe_escape_str( value ) + '">' + value + '</option>';
					} );
					jQuery( '#select_custom_meta_order_items' ).html( options );
					jQuery( '#select_custom_meta_order_items' ).prop( "disabled", false );
				}
			}, 'json' );
//            jQuery('#modal-manage-products').html('');
		}
	} );

	setTimeout( function () {
	    jQuery( 'input[name=custom_meta_products_mode]' ).trigger( 'change' );
	}, 0);
	setTimeout( function () {
	    jQuery( 'input[name=custom_meta_product_items_mode]' ).trigger( 'change' );
	}, 0);

	jQuery( 'input[name=custom_meta_coupons_mode]' ).change( function () {

		if ( jQuery( this ).val() == 'all' ) {
			var options = '<option></option>';
			jQuery.each( window.order_coupons_custom_meta_fields, function ( index, value ) {
				options += '<option value="' + woe_escape_str( value ) + '">' + value + '</option>';
			} );
			jQuery( '#select_custom_meta_coupons' ).html( options );
		}
		else {
			var data = jQuery( '#export_job_settings' ).serialize()
			data = data + "&action=order_exporter&method=get_used_custom_coupons_meta&woe_nonce=" + settings_form.woe_nonce + '&tab=' + settings_form.woe_active_tab;

			jQuery.post( ajaxurl, data, function ( response ) {
				if ( response ) {
					var options = '<option></option>';
					jQuery.each( response, function ( index, value ) {
						options += '<option value="' + woe_escape_str( value ) + '">' + value + '</option>';
					} );
					jQuery( '#select_custom_meta_coupons' ).html( options );
				}
			}, 'json' );
		}
	} );

	/////////////END CUSTOM FIELDS BINDS

	jQuery( '.output_format' ).click( function () {

		var new_format = jQuery( this ).val();
		jQuery( '#my-format .my-icon-triangle' ).removeClass( 'ui-icon-triangle-1-n' );
		jQuery( '#my-format .my-icon-triangle' ).addClass( 'ui-icon-triangle-1-s' );

		if ( new_format != output_format ) {
			jQuery( this ).next().removeClass( 'ui-icon-triangle-1-s' );
			jQuery( this ).next().addClass( 'ui-icon-triangle-1-n' );
			jQuery( '#' + output_format + '_options' ).hide();
			jQuery( '#' + new_format + '_options' ).show();
			var format_type_changed = ! (
				woe_is_flat_format( new_format ) && woe_is_flat_format( output_format )
			);
			old_output_format = output_format;
			output_format = new_format;
			woe_synch_selected_fields( old_output_format, output_format );
			woe_create_selected_fields( old_output_format, output_format, format_type_changed );
			jQuery( '.field_section' ).prop( 'checked', true );
			jQuery( '#output_preview, #output_preview_csv' ).hide();
//				jQuery( '#fields' ).hide();
//				jQuery( '#fields_control' ).hide();
			woe_change_filename_ext();
		}
		else {
			if ( ! jQuery( '#' + new_format + '_options' ).is( ':hidden' ) ) {
				jQuery( '#' + new_format + '_options' ).hide();
			}
			else {
				if ( jQuery( '#' + new_format + '_options' ).is( ':hidden' ) ) {
					jQuery( '#' + new_format + '_options' ).show();
					jQuery( this ).next().removeClass( 'ui-icon-triangle-1-s' );
					jQuery( this ).next().addClass( 'ui-icon-triangle-1-n' );
				}
			}
		}

		woe_check_sortable_groups();
	} );

	jQuery( '#summary_report_by_products_checkbox' ).add('#summary_report_by_customers_checkbox').change( function( e ) {
		if ( jQuery( '#summary_report_by_products_checkbox' ).is( ":checked" ) || jQuery( '#summary_report_by_customers_checkbox' ).is( ":checked" ) ) {
			jQuery('#woe_common_tips').hide();
		} else {
			jQuery('#woe_common_tips').show();
		}
	} );

	//logic for setup link
	jQuery( "#summary_report_by_products_checkbox" ).change( function ( e, action ) {

		var summary_report_fields = [];
		summary_report_fields.push( $( '#products_unselected_segment input[value="plain_products_summary_report_total_qty"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#products_unselected_segment input[value="plain_products_summary_report_total_amount"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#products_unselected_segment input[value="plain_products_summary_report_total_weight"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#products_unselected_segment input[value="plain_products_summary_report_total_discount"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#products_unselected_segment input[value="plain_products_summary_report_total_refund_count"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#products_unselected_segment input[value="plain_products_summary_report_total_refund_amount"]' ).parents( 'li' ) );

		jQuery( '#manage_fields' ).toggleClass( 'summary-products-report', ! ! jQuery( this ).prop( 'checked' ) );

		$('#summary_report_by_customers_checkbox').prop( 'disabled', !!jQuery( this ).prop( 'checked' ) );

		$( '#unselected_fields .segment_choice' ).removeClass( 'active' );
		$( '#unselected_fields_list .settings-segment' ).removeClass( 'active' );

		if ( jQuery( this ).prop( 'checked' ) ) {

			var segment = 'products';

			// hide product fields starts with 'line' and 'qty'
			// $( '#products_unselected_segment input, #order_fields input' ).map( function () {
			// 	var matches = $( this ).attr( 'value' ).match( /plain_products_(line|qty).*/ );
			// 	if ( matches ) {
			// 		$( this ).closest( '.mapping_row' ).hide();
			// 	}
			// } );

			if ( 'onstart' !== action ) {
				// purge summary report fields before insert
				$( '#order_fields input[value="plain_products_summary_report_total_qty"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields input[value="plain_products_summary_report_total_amount"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields input[value="plain_products_summary_report_total_weight"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields input[value="plain_products_summary_report_total_discount"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields input[value="plain_products_summary_report_total_refund_count"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields input[value="plain_products_summary_report_total_refund_amount"]' ).closest( '.mapping_row' ).remove();

				// insert summary report fields
				jQuery.each( summary_report_fields, function ( i, value ) {
					$( value ).show();
					var $field_to_copy = $( value ).clone();
					$field_to_copy
						.attr( 'style', '' )
						.addClass( 'ui-draggabled' )
						.removeClass( 'segment_field' )
						.find( 'input' ).prop( 'disabled', false );

					jQuery( '#manage_fields #order_fields' ).append( $field_to_copy );
				} );
			}

		} else {
			var segment = window.location.hash.replace( '#segment=', '' );

			// show product fields starts with 'line' and 'qty'
			$( '#products_unselected_segment input, #order_fields input' ).map( function () {
				var $value = $( this ).attr( 'value' );
				if ( typeof $value === 'undefined' ) {
					return;
				}

				if ( $value.match( /plain_products_(line|qty).*/ ) ) {
					$( this ).closest( '.mapping_row' ).show();
				}
			} );

			// purge summary report fields
			$( '#order_fields input[value="plain_products_summary_report_total_qty"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields input[value="plain_products_summary_report_total_amount"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields input[value="plain_products_summary_report_total_weight"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields input[value="plain_products_summary_report_total_discount"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields input[value="plain_products_summary_report_total_refund_count"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields input[value="plain_products_summary_report_total_refund_amount"]' ).closest( '.mapping_row' ).remove();

			jQuery.each( summary_report_fields, function ( i, value ) {
				$( value ).hide();
			} );
		}

		$( '#unselected_fields .segment_choice[data-segment="' + segment + '"]' ).addClass( 'active' );
		$( '#unselected_fields_list .settings-segment#' + segment + '_unselected_segment' ).addClass( 'active' );

	} );

	//logic for setup link
	jQuery( "#summary_report_by_customers_checkbox" ).change( function ( e, action ) {

		var summary_report_fields = [];

		summary_report_fields.push( $( '#user_unselected_segment input[value="summary_report_total_count"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#user_unselected_segment input[value="summary_report_total_count_items"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#user_unselected_segment input[value="summary_report_total_count_items_exported"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#user_unselected_segment input[value="summary_report_total_sum_items_exported"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#user_unselected_segment input[value="summary_report_total_amount"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#user_unselected_segment input[value="summary_report_total_amount_paid"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#user_unselected_segment input[value="summary_report_total_shipping"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#user_unselected_segment input[value="summary_report_total_discount"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#user_unselected_segment input[value="summary_report_total_refund_count"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#user_unselected_segment input[value="summary_report_total_refund_amount"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#user_unselected_segment input[value="summary_report_total_tax_amount"]' ).parents( 'li' ) );
		summary_report_fields.push( $( '#user_unselected_segment input[value="summary_report_total_fee_amount"]' ).parents( 'li' ) );

		jQuery( '#manage_fields' ).toggleClass( 'summary-customers-report', ! ! jQuery( this ).prop( 'checked' ) );

		$('#summary_report_by_products_checkbox').prop( 'disabled', !!jQuery( this ).prop( 'checked' ) );

		$( '#unselected_fields .segment_choice' ).removeClass( 'active' );
		$( '#unselected_fields_list .settings-segment' ).removeClass( 'active' );

		if ( jQuery( this ).prop( 'checked' ) ) {

			var segment = 'user';

			if ( 'onstart' !== action ) {
				// purge summary report fields before insert
				$( '#order_fields .segment_user input[value="summary_report_total_count"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields .segment_user input[value="summary_report_total_count_items"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields .segment_user input[value="summary_report_total_count_items_exported"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields .segment_user input[value="summary_report_total_sum_items_exported"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields .segment_user input[value="summary_report_total_amount"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields .segment_user input[value="summary_report_total_amount_paid"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields .segment_user input[value="summary_report_total_shipping"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields .segment_user input[value="summary_report_total_discount"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields .segment_user input[value="summary_report_total_refund_count"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields .segment_user input[value="summary_report_total_refund_amount"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields .segment_user input[value="summary_report_total_tax_amount"]' ).closest( '.mapping_row' ).remove();
				$( '#order_fields .segment_user input[value="summary_report_total_fee_amount"]' ).closest( '.mapping_row' ).remove();

				// insert summary report fields
				jQuery.each( summary_report_fields, function ( i, value ) {
					$( value ).show();
					var $field_to_copy = $( value ).clone();
					$field_to_copy
						.attr( 'style', '' )
						.addClass( 'ui-draggabled' )
						.removeClass( 'segment_field' )
						.find( 'input' ).prop( 'disabled', false );

					jQuery( '#manage_fields #order_fields' ).append( $field_to_copy );
				} );
			}

			$( '#unselected_fields .segment_choice[data-segment="' + segment + '"]' ).addClass( 'active' );
			$( '#unselected_fields_list .settings-segment#' + segment + '_unselected_segment' ).addClass( 'active' );

		} else {
			var segment = window.location.hash.replace( '#segment=', '' );

			// purge summary report fields
			$( '#order_fields .segment_user input[value="summary_report_total_count"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields .segment_user input[value="summary_report_total_count_items"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields .segment_user input[value="summary_report_total_count_items_exported"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields .segment_user input[value="summary_report_total_sum_items_exported"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields .segment_user input[value="summary_report_total_amount"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields .segment_user input[value="summary_report_total_amount_paid"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields .segment_user input[value="summary_report_total_shipping"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields .segment_user input[value="summary_report_total_discount"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields .segment_user input[value="summary_report_total_refund_count"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields .segment_user input[value="summary_report_total_refund_amount"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields .segment_user input[value="summary_report_total_tax_amount"]' ).closest( '.mapping_row' ).remove();
			$( '#order_fields .segment_user input[value="summary_report_total_fee_amount"]' ).closest( '.mapping_row' ).remove();

			jQuery.each( summary_report_fields, function ( i, value ) {
				$( value ).hide();
			} );
		}

		$( '#unselected_fields .segment_choice[data-segment="' + segment + '"]' ).addClass( 'active' );
		$( '#unselected_fields_list .settings-segment#' + segment + '_unselected_segment' ).addClass( 'active' );

	} );

	setTimeout( function () {
		jQuery( "#summary_report_by_products_checkbox" ).trigger( 'change', 'onstart' );
	}, 1 )

	setTimeout( function () {
		jQuery( "#summary_report_by_customers_checkbox" ).trigger( 'change', 'onstart' );
	}, 1 )

} );