jQuery( document ).ready( function ( $ ) {
	function woe_open_filter( object_id, verify_checkboxes ) {

		verify_checkboxes = verify_checkboxes || 0;

		var f = false;
		$( '#' + object_id + ' ul' ).each( function ( index ) {
			if ( $( this ).find( 'li:not(:first)' ).length ) {
				f = true;
			}
		} );

		$( '#' + object_id + ' textarea' ).each( function ( index ) {
			if ( $( this ).val() ) {
				f = true;
			}
		} );

		// show checkboxes for order and coupon section  ?
		if ( f || verify_checkboxes && $( '#' + object_id + " input[type='checkbox']:checked" ).length ) {
			$( '#' + object_id ).prev().click();
		}
	}

	setTimeout( function () {
	    //PRODUCT ATTRIBUTES BEGIN
	    jQuery( '#attributes' ).on( 'change', function () {

		    jQuery( '#select_attributes' ).attr( 'disabled', 'disabled' );

		    var data = {
			    attr: jQuery( this ).val(),
			    method: "get_products_attributes_values",
			    action: "order_exporter",
			    woe_nonce: settings_form.woe_nonce,
			    tab: settings_form.woe_active_tab,
			    woe_order_post_type: woe_order_post_type,
		    };

		    var val_op = jQuery( '#attributes_compare' ).val();

		    jQuery( '#text_attributes' ).val( '' );

		    jQuery.post( ajaxurl, data, function ( response ) {

			    jQuery( '#select_attributes--select2 select' ).select2( 'destroy' );

			    jQuery( '#select_attributes, #select_attributes--select2' ).remove();

			    if ( response ) {
				    var options = '';
				    jQuery.each( response, function ( index, value ) {
					    options += '<option>' + value + '</option>';
				    } );
				    var $select = jQuery( '<div id="select_attributes--select2" style="margin-top: 0px;margin-right: 6px; vertical-align: top;'
							  + 'display: ' + (
								  (
									  'LIKE' === val_op
								  ) ? 'none' : 'inline-block'
							  ) + ';">'
							  + '<select id="select_attributes">' + options + '</select></div>' );
				    $select.insertBefore( jQuery( '#add_attributes' ) )
				    $select.find( 'select' ).select2_i18n( {tags: true} );
			    }
			    else {
				    jQuery( '<input type="text" id="select_attributes" style="margin-right: 8px;">' ).insertBefore( jQuery( '#add_attributes' ) );
			    }
		    }, 'json' );

	    } ).trigger( 'change' );
	}, 0);

	jQuery( '#add_attributes' ).on( 'click', function () {

		var val = ! jQuery( "#select_attributes" ).is( ':disabled' ) ? jQuery( "#select_attributes" ).val() : jQuery( "#text_attributes" ).val();
		var val2 = jQuery( '#attributes' ).val();
		var val_op = jQuery( '#attributes_compare' ).val();
		if ( val != null && val2 != null && val.length && val2.length ) {
			val = val2 + ' ' + val_op + ' ' + val;

			var f = true;
			jQuery( '#attributes_check' ).next().find( 'ul li' ).each( function () {
				if ( jQuery( this ).attr( 'title' ) == val ) {
					f = false;
				}
			} );

			if ( f ) {

				jQuery( '#attributes_check' ).append( '<option selected="selected" value="' + val + '">' + val + '</option>' );
				jQuery( '#attributes_check' ).select2_i18n( {}, '', true );

				jQuery( '#attributes_check option' ).each( function () {
					jQuery( '#attributes_check option[value=\"' + jQuery( this ).val() + '\"]:not(:last)' ).remove();
				} );

				jQuery( "input#select_attributes" ).val( '' );
			}
		}

		return false;
	} );

	jQuery( '#attributes_compare' ).on( 'change', function () {
		var val_op = jQuery( '#attributes_compare' ).val();
		if ( 'LIKE' === val_op ) {
			jQuery( "#select_attributes" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
			jQuery( "#select_attributes--select2" ).hide();
			jQuery( "#text_attributes" ).css( 'display', 'inline' ).attr( 'disabled', false );
		}
		else {
			jQuery( "#select_attributes" ).css( 'display', 'inline-block' ).attr( 'disabled', false );
			jQuery( "#select_attributes--select2" ).css( 'display', 'inline' );
			jQuery( "#text_attributes" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
		}
	} );
	//PRODUCT ATTRIBUTES END

	jQuery( '#itemmeta' ).on( 'change', function () {

		var selected64 = jQuery( this ).find( ":selected" ).data( "base64" );

		jQuery( '#select_itemmeta' ).attr( 'disabled', 'disabled' );

		var data = {
			'item': window.atob( selected64 ),
			method: "get_products_itemmeta_values",
			action: "order_exporter",
			woe_nonce: settings_form.woe_nonce,
			tab: settings_form.woe_active_tab,
			woe_order_post_type: woe_order_post_type,
		};

		var val_op = jQuery( '#itemmeta_compare' ).val();

		jQuery( '#text_itemmeta' ).val( '' );

		jQuery.post( ajaxurl, data, function ( response ) {
			jQuery( '#select_itemmeta--select2 select' ).select2( 'destroy' );
			jQuery( '#select_itemmeta, #select_itemmeta--select2' ).remove();
			if ( response ) {
				var options = '';
				jQuery.each( response, function ( index, value ) {
					options += '<option>' + value + '</option>';
				} );
				var $select = jQuery( '<div id="select_itemmeta--select2" style="margin-top: 0px;margin-right: 6px; vertical-align: top;'
				                      + 'display: ' + (
					                      (
						                      'LIKE' === val_op
					                      ) ? 'none' : 'inline-block'
				                      ) + ';">'
				                      + '<select id="select_itemmeta">' + options + '</select></div>' );
				$select.insertBefore( jQuery( '#add_itemmeta' ) )
				$select.find( 'select' ).select2_i18n( {tags: true} );
			}
			else {
				jQuery( '<input type="text" id="select_itemmeta" style="margin-right: 8px;">' ).insertBefore( jQuery( '#add_itemmeta' ) );
			}
		}, 'json' );
	} );

	setTimeout( function () {
	    if ( jQuery( '#itemmeta option' ).length > 0 ) {
		    jQuery( '#itemmeta' ).trigger( 'change' );
	    }
	}, 0);

	jQuery( '#add_itemmeta' ).on( 'click', function () {

		var val = ! jQuery( "#select_itemmeta" ).is( ':disabled' ) ? jQuery( "#select_itemmeta" ).val() : jQuery( "#text_itemmeta" ).val();
		var selected64 = jQuery( '#itemmeta' ).find( ":selected" ).data( "base64" );
		var val2 = window.atob( selected64 ).replace( /&/g, '&amp;' );
		var val_op = jQuery( '#itemmeta_compare' ).val();
		if ( val != null && val2 != null && val.length && val2.length ) {
			val = val2 + ' ' + val_op + ' ' + val;

			var f = true;
			jQuery( '#itemmeta_check' ).next().find( 'ul li' ).each( function () {
				if ( jQuery( this ).attr( 'title' ) == val ) {
					f = false;
				}
			} );

			if ( f ) {

				jQuery( '#itemmeta_check' ).append( '<option selected="selected" value="' + val + '">' + val + '</option>' );
				jQuery( '#itemmeta_check' ).select2_i18n( {}, '', true );

				jQuery( '#itemmeta_check option' ).each( function () {
					jQuery( '#itemmeta_check option[value=\"' + jQuery( this ).val() + '\"]:not(:last)' ).remove(); // jQuerySelectorEscape ?
				} );

				jQuery( "input#select_itemmeta" ).val( '' );
			}
		}

		return false;
	} );

	jQuery( '#itemmeta_compare' ).on( 'change', function () {
		var val_op = jQuery( '#itemmeta_compare' ).val();
		if ( 'LIKE' === val_op ) {
			jQuery( "#select_itemmeta" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
			jQuery( "#select_itemmeta--select2" ).hide();
			jQuery( "#text_itemmeta" ).css( 'display', 'inline' ).attr( 'disabled', false );
		}
		else {
			jQuery( "#select_itemmeta" ).css( 'display', 'inline-block' ).attr( 'disabled', false );
			jQuery( "#select_itemmeta--select2" ).css( 'display', 'inline' );
			jQuery( "#text_itemmeta" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
		}
	} );

    jQuery( '#item_name_compare' ).on( 'change', function () {
        var val_op = jQuery( '#item_name_compare' ).val();
        if ( 'LIKE' === val_op ) {
            jQuery( "#text_item_names" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
            jQuery( "#text_item_names--select2" ).hide();
            jQuery( "#text_order_item_name" ).css( 'display', 'inline' ).attr( 'disabled', false );
        }
        else {
            jQuery( "#text_item_names" ).css( 'display', 'inline-block' ).attr( 'disabled', false );
            jQuery( "#text_item_names--select2" ).css( 'display', 'inline' );
            jQuery( "#text_order_item_name" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
        }
    } );

    jQuery( '#item_metadata_compare' ).on( 'change', function () {
        var val_op = jQuery( '#item_metadata_compare' ).val();
        if ( 'LIKE' === val_op ) {
            jQuery( "#text_item_metadata" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
            jQuery( "#text_item_metadata--select2" ).hide();
            jQuery( "#text_order_itemmetadata" ).css( 'display', 'inline' ).attr( 'disabled', false );
        } 
		else if ( 'NOT SET' === val_op || 'IS SET' === val_op ) {
			jQuery( "#text_item_metadata" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' ).val( ' ' );
            jQuery( "#text_item_metadata--select2" ).hide();
            jQuery( "#text_order_itemmetadata" ).css( 'display', 'none' ).attr( 'disabled', false ).val( ' ' );
		}
        else {
            jQuery( "#text_item_metadata" ).css( 'display', 'inline-block' ).attr( 'disabled', false );
            jQuery( "#text_item_metadata--select2" ).css( 'display', 'inline' );
            jQuery( "#text_order_itemmetadata" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
        }
    } );

	setTimeout( function () {
	    //PRODUCT TAXONOMIES BEGIN
	    jQuery( '#taxonomies' ).on( 'change', function () {

		    jQuery( '#select_taxonomies' ).attr( 'disabled', 'disabled' );
		    var data = {
			    'tax': jQuery( this ).val(),
			    method: "get_products_taxonomies_values",
			    action: "order_exporter",
			    woe_nonce: settings_form.woe_nonce,
			    tab: settings_form.woe_active_tab,
			    woe_order_post_type: woe_order_post_type,
		    };

		    var val_op = jQuery( '#taxonomies_compare' ).val();

		    jQuery.post( ajaxurl, data, function ( response ) {
			    jQuery( '#select_taxonomies--select2 select' ).select2( 'destroy' );
			    jQuery( '#select_taxonomies, #select_taxonomies--select2' ).remove();
			    if ( response ) {
				    var options = '';
				    jQuery.each( response, function ( index, value ) {
					    options += '<option>' + value + '</option>';
				    } );
				    var $select = jQuery( '<div id="select_taxonomies--select2" style="margin-top: 0px;margin-right: 6px; vertical-align: top;'
				     + 'display: ' + (
								  (
									  'NOT SET' === val_op || 'IS SET' === val_op
								  ) ? 'none' : 'inline-block'
							  ) + ';">'
							  + '<select id="select_taxonomies">' + options + '</select></div>' );

				    $select.insertBefore( jQuery( '#add_taxonomies' ) )
				    $select.find( 'select' ).select2_i18n( {tags: true} );
			    }
			    else {
				    jQuery( '<input type="text" id="select_taxonomies" style="margin-right: 8px;">' ).insertBefore( jQuery( '#add_taxonomies' ) );
			    }

			    jQuery( '#taxonomies_compare' ).trigger( 'change' );
		    }, 'json' );
	    } ).trigger( 'change' );
	}, 0);


	jQuery( '#add_taxonomies' ).on( 'click', function () {

		var val = ! jQuery( "#select_taxonomies" ).is( ':disabled' ) ? jQuery( "#select_taxonomies" ).val() : jQuery( "#text_taxonomies" ).val();
		var val2 = jQuery( '#taxonomies' ).val();
		var val_op = jQuery( '#taxonomies_compare' ).val();
		if ( val != null && val2 != null && val.length && val2.length ) {
			val = val2 + ' ' + val_op + ' ' + val;

			var f = true;
			jQuery( '#taxonomies_check' ).next().find( 'ul li' ).each( function () {
				if ( jQuery( this ).attr( 'title' ) == val ) {
					f = false;
				}
			} );

			if ( f ) {

				jQuery( '#taxonomies_check' ).append( '<option selected="selected" value="' + val + '">' + val + '</option>' );
				jQuery( '#taxonomies_check' ).select2_i18n( {}, '', true );

				jQuery( '#taxonomies_check option' ).each( function () {
					jQuery( '#taxonomies_check option[value=\"' + jQuery( this ).val() + '\"]:not(:last)' ).remove();
				} );

				jQuery( "input#select_taxonomies" ).val( '' );
			}
		}

		return false;
	} );

	jQuery( '#taxonomies_compare' ).on( 'change', function () {
		var val_op = jQuery( '#taxonomies_compare' ).val();
		if ( 'LIKE' === val_op ) {
			jQuery( "#select_taxonomies" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
			jQuery( "#text_taxonomies" ).css( 'display', 'inline' ).attr( 'disabled', false );
		}
		else if ( 'NOT SET' === val_op || 'IS SET' === val_op ) {
			jQuery( "#select_taxonomies" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' ).val( ' ' );
			jQuery( "#select_taxonomies--select2" ).hide();
			jQuery( "#text_taxonomies" ).css( 'display', 'none' ).attr( 'disabled', false ).val( ' ' );
		}
		else {
			jQuery( "#select_taxonomies" ).css( 'display', 'inline-block' ).attr( 'disabled', false );
			jQuery( "#select_taxonomies--select2" ).css( 'display', 'inline' );
			jQuery( "#text_taxonomies" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
		}
	} );
	//PRODUCT TAXONOMIES END

	setTimeout( function () {
	    // for filter by PRODUCT custom fields
	    jQuery( '#product_custom_fields' ).change( function () {

		    jQuery( '#select_product_custom_fields' ).attr( 'disabled', 'disabled' );
		    var data = {
			    'cf_name': jQuery( this ).val(),
			    method: "get_product_custom_fields_values",
			    action: "order_exporter",
			    woe_nonce: settings_form.woe_nonce,
			    tab: settings_form.woe_active_tab,
			    woe_order_post_type: woe_order_post_type,
		    };

		    var val_op = jQuery( '#product_custom_fields_compare' ).val();
		    jQuery( '#text_product_custom_fields' ).val( '' );

		    jQuery.post( ajaxurl, data, function ( response ) {
			    jQuery( '#select_product_custom_fields--select2 select' ).select2( 'destroy' );
			    jQuery( '#select_product_custom_fields, #select_product_custom_fields--select2' ).remove();
			    if ( response ) {
				    var options = '';
				    jQuery.each( response, function ( index, value ) {
					    options += '<option>' + value + '</option>';
				    } );
				    var $select = jQuery( '<div id="select_product_custom_fields--select2" style="margin-top: 0px;margin-right: 6px; vertical-align: top;'
							  + 'display: ' + (
								  (
									  'LIKE' === val_op || 'NOT SET' === val_op || 'IS SET' === val_op
								  ) ? 'none' : 'inline-block'
							  ) + ';">'
							  + '<select id="select_product_custom_fields">' + options + '</select></div>' );
				    $select.insertBefore( jQuery( '#add_product_custom_fields' ) )
				    $select.find( 'select' ).select2_i18n( {tags: true} );
			    }
			    else {
				    jQuery( '<input type="text" id="select_product_custom_fields" style="margin-right: 8px;">' ).insertBefore( jQuery( '#add_product_custom_fields' ) );
			    }
			    jQuery( '#product_custom_fields_compare' ).trigger( 'change' );
		    }, 'json' );
	    } ).trigger( 'change' );
	}, 0);

	jQuery( '#add_product_custom_fields' ).click( function () {

		var val = ! jQuery( "#select_product_custom_fields" ).is( ':disabled' ) ? jQuery( "#select_product_custom_fields" ).val() : jQuery( "#text_product_custom_fields" ).val();
		var val2 = jQuery( '#product_custom_fields' ).val();
		var val_op = jQuery( '#product_custom_fields_compare' ).val();
		if ( val != null && val2 != null && val.length && val2.length ) {
			val = val2 + ' ' + val_op + ' ' + val;

			var f = true;
			jQuery( '#product_custom_fields_check' ).next().find( 'ul li' ).each( function () {
				if ( jQuery( this ).attr( 'title' ) == val ) {
					f = false;
				}
			} );

			if ( f ) {

				jQuery( '#product_custom_fields_check' ).append( '<option selected="selected" value="' + val + '">' + val + '</option>' );
				jQuery( '#product_custom_fields_check' ).select2_i18n( {}, '', true );

				jQuery( '#product_custom_fields_check option' ).each( function () {
					jQuery( '#product_custom_fields_check option[value=\"' + jQuery( this ).val() + '\"]:not(:last)' ).remove();
				} );

				jQuery( "input#select_product_custom_fields" ).val( '' );
			}
		}

		return false;
	} );

	jQuery( '#product_custom_fields_compare' ).change( function () {
		var val_op = jQuery( '#product_custom_fields_compare' ).val();
		if ( 'LIKE' === val_op ) {
			jQuery( "#select_product_custom_fields" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
			jQuery( "#select_product_custom_fields--select2" ).hide();
			jQuery( "#text_product_custom_fields" ).css( 'display', 'inline' ).attr( 'disabled', false );
		}
		else if ( 'NOT SET' === val_op || 'IS SET' === val_op ) {
			jQuery( "#select_product_custom_fields" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' ).val( ' ' );
			jQuery( "#select_product_custom_fields--select2" ).hide();
			jQuery( "#text_product_custom_fields" ).css( 'display', 'none' ).attr( 'disabled', false ).val( ' ' );
		}
		else {
			jQuery( "#select_product_custom_fields" ).css( 'display', 'inline-block' ).attr( 'disabled', false );
			jQuery( "#select_product_custom_fields--select2" ).css( 'display', 'inline' );
			jQuery( "#text_product_custom_fields" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
		}
	} );
	//end of change

	setTimeout( function () {
	    // SHIPPING LOCATIONS
	    jQuery( '#shipping_locations' ).change( function () {

		    jQuery( '#text_shipping_locations' ).attr( 'disabled', 'disabled' );
		    var data = {
			    'item': jQuery( this ).val(),
			    method: "get_order_shipping_values",
			    action: "order_exporter",
			    woe_nonce: settings_form.woe_nonce,
			    tab: settings_form.woe_active_tab,
			    woe_order_post_type: woe_order_post_type,
		    };

		    jQuery.post( ajaxurl, data, function ( response ) {
			    jQuery( '#text_shipping_locations--select2 select' ).select2( 'destroy' );
			    jQuery( '#text_shipping_locations, #text_shipping_locations--select2' ).remove();
			    if ( response ) {
				    var options = '';
				    jQuery.each( response, function ( index, value ) {
					    options += '<option>' + value + '</option>';
				    } );

				    var $select = jQuery( '<div id="text_shipping_locations--select2" style="margin-top: 0px;margin-right: 6px; vertical-align: top; display: inline-block;"><select id="text_shipping_locations">' + options + '</select></div>' );
				    $select.insertBefore( jQuery( '#add_shipping_locations' ) )
				    $select.find( 'select' ).select2_i18n( {tags: true} );
			    }
			    else {
				    jQuery( '<input type="text" id="text_shipping_locations" style="margin-right: 8px;">' ).insertBefore( jQuery( '#add_shipping_locations' ) );
			    }
		    }, 'json' );
	    } ).trigger( 'change' );
	}, 0);

	jQuery( '#add_shipping_locations' ).click( function () {

		var val = jQuery( "#text_shipping_locations" ).val();
		var val2 = jQuery( '#shipping_locations' ).val();
		var val_op = jQuery( '#shipping_compare' ).val();
		if ( val != null && val2 != null && val.length && val2.length ) {
			val = val2 + val_op + val;

			var f = true;
			jQuery( '#shipping_locations_check' ).next().find( 'ul li' ).each( function () {
				if ( jQuery( this ).attr( 'title' ) == val ) {
					f = false;
				}
			} );

			if ( f ) {

				jQuery( '#shipping_locations_check' ).append( '<option selected="selected" value="' + val + '">' + val + '</option>' );
				jQuery( '#shipping_locations_check' ).select2_i18n( {}, '', true );

				jQuery( '#shipping_locations_check option' ).each( function () {
					jQuery( '#shipping_locations_check option[value=\"' + jQuery( this ).val() + '\"]:not(:last)' ).remove();
				} );

				jQuery( "input#text_shipping_locations" ).val( '' );
			}
		}
		return false;
	} );

	setTimeout( function () {
	    // BILLING LOCATIONS
	    jQuery( '#billing_locations' ).change( function () {

		    jQuery( '#text_billing_locations' ).attr( 'disabled', 'disabled' );
		    var data = {
			    'item': jQuery( this ).val(),
			    method: "get_order_billing_values",
			    action: "order_exporter",
			    woe_nonce: settings_form.woe_nonce,
			    tab: settings_form.woe_active_tab,
			    woe_order_post_type: woe_order_post_type,
		    };

		    jQuery.post( ajaxurl, data, function ( response ) {
			    jQuery( '#text_billing_locations--select2 select' ).select2( 'destroy' );
			    jQuery( '#text_billing_locations, #text_billing_locations--select2' ).remove();
			    if ( response ) {
				    var options = '';
				    jQuery.each( response, function ( index, value ) {
					    options += '<option>' + value + '</option>';
				    } );
				    var $select = jQuery( '<div id="text_billing_locations--select2" style="margin-top: 0px;margin-right: 6px; vertical-align: top; display: inline-block;">'
							  + '<select id="text_billing_locations">' + options + '</select></div>' );
				    $select.insertBefore( jQuery( '#add_billing_locations' ) )
				    $select.find( 'select' ).select2_i18n( {tags: true} );
			    }
			    else {
				    jQuery( '<input type="text" id="text_billing_locations" style="margin-right: 8px;">' ).insertBefore( jQuery( '#add_billing_locations' ) );
			    }
		    }, 'json' );
	    } ).trigger( 'change' );
	}, 0);

	jQuery( '#add_billing_locations' ).click( function () {

		var val = jQuery( "#text_billing_locations" ).val();
		var val2 = jQuery( '#billing_locations' ).val();
		var val_op = jQuery( '#billing_compare' ).val();
		if ( val != null && val2 != null && val.length && val2.length ) {
			val = val2 + val_op + val;

			var f = true;
			jQuery( '#billing_locations_check' ).next().find( 'ul li' ).each( function () {
				if ( jQuery( this ).attr( 'title' ) == val ) {
					f = false;
				}
			} );

			if ( f ) {

				jQuery( '#billing_locations_check' ).append( '<option selected="selected" value="' + val + '">' + val + '</option>' );
				jQuery( '#billing_locations_check' ).select2_i18n( {}, '', true );

				jQuery( '#billing_locations_check option' ).each( function () {
					jQuery( '#billing_locations_check option[value=\"' + jQuery( this ).val() + '\"]:not(:last)' ).remove();
				} );

				jQuery( "input#text_billing_locations" ).val( '' );
			}
		}
		return false;
	} )

	setTimeout( function () {
	    // ITEM NAMES
	    jQuery( '#item_names' ).change( function () {
	    var val_op = jQuery( '#item_name_compare' ).val();
	    jQuery( '#text_order_item_name' ).val( '' );
		    jQuery( '#text_item_names' ).attr( 'disabled', 'disabled' );
		    var data = {
			    'item_type': jQuery( this ).val(),
			    method: "get_order_item_names",
			    action: "order_exporter",
			    woe_nonce: settings_form.woe_nonce,
			    tab: settings_form.woe_active_tab,
			    woe_order_post_type: woe_order_post_type,
		    };

		    jQuery.post( ajaxurl, data, function ( response ) {
			    jQuery( '#text_item_names--select2 select' ).select2( 'destroy' );
			    jQuery( '#text_item_names, #text_item_names--select2' ).remove();
			    if ( response ) {
				    var options = '';
				    jQuery.each( response, function ( index, value ) {
					    options += '<option>' + value + '</option>';
				    } );

				    var $select = jQuery( '<div id="text_item_names--select2" style="margin-top: 0px;margin-right: 6px; vertical-align: top; '
			+ 'display: '+ (
			    (
				'LIKE' === val_op || 'NOT SET' === val_op || 'IS SET' === val_op
			    ) ? 'none' : 'inline-block'
			) + ';"><select id="text_item_names">' + options + '</select></div>' );
				    $select.insertBefore( jQuery( '#add_item_names' ) );
				    $select.find( 'select' ).select2_i18n( {tags: true} );

				    if ( 'LIKE' === val_op || 'NOT SET' === val_op || 'IS SET' === val_op ) {
			jQuery( '#text_item_names' ).attr( 'disabled', 'disabled' );
		    }
			    }
			    else {
				    jQuery( '<input type="text" id="text_item_names" style="margin-right: 8px;">' ).insertBefore( jQuery( '#add_item_names' ) );
			    }
		    }, 'json' );
	    } ).trigger( 'change' );
	}, 0);

	jQuery( '#add_item_names' ).click( function () {
        var val = ! jQuery( "#text_item_names" ).is( ':disabled' ) ? jQuery( "#text_item_names" ).val() : jQuery( "#text_order_item_name" ).val();
		var val2 = jQuery( '#item_names' ).val();
		var val_op = jQuery( '#item_name_compare' ).val();
		if ( val != null && val2 != null && val.length && val2.length ) {
			val = val2 + ' ' + val_op + ' ' + val;

			var f = true;
			jQuery( '#item_names_check' ).next().find( 'ul li' ).each( function () {
				if ( jQuery( this ).attr( 'title' ) == val ) {
					f = false;
				}
			} );

			if ( f ) {

				jQuery( '#item_names_check' ).append( '<option selected="selected" value="' + val + '">' + val + '</option>' );
				jQuery( '#item_names_check' ).select2_i18n( {}, '', true );

				jQuery( '#item_names_check option' ).each( function () {
					jQuery( '#item_names_check option[value=\"' + jQuery( this ).val() + '\"]:not(:last)' ).remove();
				} );

				jQuery( "input#text_item_names" ).val( '' );
			}
		}
		return false;
	} );

	setTimeout( function () {
	    // ITEM METADATA
	    jQuery( '#item_metadata' ).change( function () {
	    var val_op = jQuery( '#item_metadata_compare' ).val();
	    jQuery( '#text_order_itemmetadata' ).val( '' );
		    jQuery( '#text_item_metadata' ).attr( 'disabled', 'disabled' );
		    var data = {
			    'meta_key': jQuery( this ).val(),
			    method: "get_order_item_meta_key_values",
			    action: "order_exporter",
			    woe_nonce: settings_form.woe_nonce,
			    tab: settings_form.woe_active_tab,
			    woe_order_post_type: woe_order_post_type,
		    };

		    jQuery.post( ajaxurl, data, function ( response ) {
			    jQuery( '#text_item_metadata--select2 select' ).select2( 'destroy' );
			    jQuery( '#text_item_metadata, #text_item_metadata--select2' ).remove();
			    if ( response ) {
				    var options = '';
				    jQuery.each( response, function ( index, value ) {
					    options += '<option>' + value + '</option>';
				    } );
				    var $select = jQuery( '<div id="text_item_metadata--select2" style="margin-top: 0px;margin-right: 6px; vertical-align: top; '
			+ 'display: '+ (
			    (
				'LIKE' === val_op || 'NOT SET' === val_op || 'IS SET' === val_op
			    ) ? 'none' : 'inline-block'
			) + ';"><select id="text_item_metadata">' + options + '</select></div>' );
				    $select.insertBefore( jQuery( '#add_item_metadata' ) );
				    $select.find( 'select' ).select2_i18n( {tags: true} );

		    if ( 'LIKE' === val_op || 'NOT SET' === val_op || 'IS SET' === val_op ) {
			jQuery( '#text_item_metadata' ).attr( 'disabled', 'disabled' );
		    }
			    }
			    else {
				    jQuery( '<input type="text" id="text_item_metadata" style="margin-right: 8px;">' ).insertBefore( jQuery( '#add_item_metadata' ) );
			    }
				jQuery( '#item_metadata_compare' ).trigger( 'change' );
		    }, 'json' );
	    } ).trigger( 'change' );
	}, 0);

	jQuery( '#add_item_metadata' ).click( function () {
        var val = ! jQuery( "#text_item_metadata" ).is( ':disabled' ) ? jQuery( "#text_item_metadata" ).val() : jQuery( "#text_order_itemmetadata" ).val();
		var val2 = jQuery( '#item_metadata' ).val();
		var val_op = jQuery( '#item_metadata_compare' ).val();
		if ( val != null && val2 != null && val.length && val2.length ) {
			val = val2 + ' ' + val_op + ' ' + val;

			var f = true;
			jQuery( '#item_metadata_check' ).next().find( 'ul li' ).each( function () {
				if ( jQuery( this ).attr( 'title' ) == val ) {
					f = false;
				}
			} );

			if ( f ) {

				jQuery( '#item_metadata_check' ).append( '<option selected="selected" value="' + val + '">' + val + '</option>' );
				jQuery( '#item_metadata_check' ).select2_i18n( {}, '', true );

				jQuery( '#item_metadata_check option' ).each( function () {
					jQuery( '#item_metadata_check option[value=\"' + jQuery( this ).val() + '\"]:not(:last)' ).remove();
				} );

				jQuery( "input#text_item_metadata" ).val( '' );
			}
		}
		return false;
	} );

	setTimeout( function () {
	    // for filter by ORDER custom fields
	    jQuery( '#user_custom_fields' ).change( function () {

		    jQuery( '#select_user_custom_fields' ).attr( 'disabled', 'disabled' );
		    var data = {
			    'cf_name': jQuery( this ).val(),
			    method: "get_user_custom_fields_values",
			    action: "order_exporter",
			    woe_nonce: settings_form.woe_nonce,
			    tab: settings_form.woe_active_tab,
			    woe_order_post_type: woe_order_post_type,
		    };
		    var val_op = jQuery( '#select_user_custom_fields' ).val();
		    jQuery( '#text_user_custom_fields' ).val( '' );
		    jQuery.post( ajaxurl, data, function ( response ) {
			    jQuery( '#select_user_custom_fields' ).remove();
			    jQuery( '#select_user_custom_fields--select2 select' ).select2( 'destroy' );
			    jQuery( '#select_user_custom_fields, #select_user_custom_fields--select2' ).remove();
			    if ( response ) {
				    var options = '<option>' + export_messages.empty + '</option>';
				    jQuery.each( response, function ( index, value ) {
					    options += '<option>' + value + '</option>';
				    } );
				    var $select = jQuery( '<div id="select_user_custom_fields--select2" style="margin-top: 0px;margin-right: 6px; vertical-align: top;'
							  + 'display: ' + (
								  (
									  'LIKE' === val_op || 'NOT SET' === val_op || 'IS SET' === val_op
								  ) ? 'none' : 'inline-block'
							  ) + ';">'
							  + '<select id="select_user_custom_fields">' + options + '</select></div>' );
				    $select.insertBefore( jQuery( '#add_user_custom_fields' ) )
				    $select.find( 'select' ).select2_i18n( {tags: true} );
			    }
			    else {
				    jQuery( '<input type="text" id="select_user_custom_fields" style="margin-right: 8px;">' ).insertBefore(
					    jQuery( '#add_user_custom_fields' ) );
			    }
		    }, 'json' );
	    } ).trigger( 'change' );
	}, 0);

	jQuery( '#add_user_custom_fields' ).click( function () {

		var val = ! jQuery( "#select_user_custom_fields" ).is( ':disabled' ) ? jQuery(
			"#select_user_custom_fields" ).val() : jQuery( "#text_user_custom_fields" ).val();
		var val2 = jQuery( '#user_custom_fields' ).val();
		var val_op = jQuery( '#user_custom_fields_compare' ).val();
		if ( val != null && val2 != null && val.length && val2.length ) {
			var result = val2 + ' ' + val_op + ' ' + val;

			var f = true;
			jQuery( '#user_custom_fields_check' ).next().find( 'ul li' ).each( function () {
				if ( jQuery( this ).attr( 'title' ) == val ) {
					f = false;
				}
			} );

			if ( f ) {
				if ( export_messages.empty === val ) {
					result = val2 + ' ' + val_op + ' empty';
					jQuery(
						'#user_custom_fields_check' ).append( '<option selected="selected" value="' + result + '">' + result + '</option>' );
				} else {
					jQuery(
						'#user_custom_fields_check' ).append( '<option selected="selected" value="' + result + '">' + result + '</option>' );
				}

				jQuery( '#user_custom_fields_check' ).select2_i18n();

				jQuery( '#user_custom_fields_check option' ).each( function () {
					jQuery( '#user_custom_fields_check option[value=\"' + jQuery( this ).val() + '\"]:not(:last)' ).remove();
				} );

				jQuery( "input#select_user_custom_fields" ).val( '' );
			}
		}
		return false;
	} );

	jQuery( '#user_custom_fields_compare' ).change( function () {
		var val_op = jQuery( '#user_custom_fields_compare' ).val();
		if ( 'LIKE' === val_op ) {
			jQuery( "#select_user_custom_fields" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
			jQuery( "#select_user_custom_fields--select2" ).hide();
			jQuery( "#text_user_custom_fields" ).css( 'display', 'inline' ).attr( 'disabled', false );
		}
		else if ( 'NOT SET' === val_op || 'IS SET' === val_op ) {
			jQuery( "#select_user_custom_fields" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' ).val( ' ' );
			jQuery( "#select_user_custom_fields--select2" ).hide();
			jQuery( "#text_user_custom_fields" ).css( 'display', 'none' ).attr( 'disabled', false ).val( ' ' );
		}
		else {
			jQuery( "#select_user_custom_fields" ).css( 'display', 'inline-block' ).attr( 'disabled', false );
			jQuery( '#select_user_custom_fields--select2' ).css( 'display', 'inline' );
			jQuery( "#text_user_custom_fields" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
		}
	} );

	setTimeout( function () {
	    // for filter by ORDER custom fields
	    jQuery( '#custom_fields' ).change( function () {

		    jQuery( '#select_custom_fields' ).attr( 'disabled', 'disabled' );

		    var data = {
			    'cf_name': jQuery( this ).val(),
			    method: "get_order_custom_fields_values",
			    action: "order_exporter",
			    woe_nonce: settings_form.woe_nonce,
			    tab: settings_form.woe_active_tab,
			    woe_order_post_type: woe_order_post_type,
		    };

		    var val_op = jQuery( '#custom_fields_compare' ).val();
		    jQuery( '#text_custom_fields' ).val( '' );
		    jQuery.post( ajaxurl, data, function ( response ) {
			    jQuery( '#select_custom_fields' ).remove();
			    jQuery( '#select_custom_fields--select2 select' ).select2( 'destroy' );
			    jQuery( '#select_custom_fields, #select_custom_fields--select2' ).remove();
			    if ( response ) {
				    var options = '<option>' + export_messages.empty + '</option>';
				    jQuery.each( response, function ( index, value ) {
					    options += '<option>' + value + '</option>';
				    } );
				    var $select = jQuery( '<div id="select_custom_fields--select2" style="margin-top: 0px;margin-right: 6px; vertical-align: top;'
							  + 'display: ' + (
								  (
									  'LIKE' === val_op || 'NOT SET' === val_op || 'IS SET' === val_op
								  ) ? 'none' : 'inline-block'
							  ) + ';">'
							  + '<select id="select_custom_fields">' + options + '</select></div>' );
				    $select.insertBefore( jQuery( '#add_custom_fields' ) )
				    $select.find( 'select' ).select2_i18n( {tags: true} );
			    }
			    else {
				    jQuery( '<input type="text" id="select_custom_fields" style="margin-right: 8px;">' ).insertBefore( jQuery( '#add_custom_fields' ) );
			    }
			    jQuery( '#custom_fields_compare' ).trigger( 'change' );
		    }, 'json' );
	    } ).trigger( 'change' );
	}, 0);

	jQuery( '#add_custom_fields' ).click( function () {

		var val = ! jQuery( "#select_custom_fields" ).is( ':disabled' ) ? jQuery( "#select_custom_fields" ).val() : jQuery( "#text_custom_fields" ).val();
		var val2 = jQuery( '#custom_fields' ).val();
		var val_op = jQuery( '#custom_fields_compare' ).val();
		if ( val != null && val2 != null && val.length && val2.length ) {
			var result = val2 + ' ' + val_op + ' ' + val;

			var f = true;
			jQuery( '#custom_fields_check' ).next().find( 'ul li' ).each( function () {
				if ( jQuery( this ).attr( 'title' ) == val ) {
					f = false;
				}
			} );

			if ( f ) {
				if ( export_messages.empty === val ) {
					result = val2 + ' ' + val_op + ' empty';
					jQuery( '#custom_fields_check' ).append( '<option selected="selected" value="' + result + '">' + result + '</option>' );
				} else {
					jQuery( '#custom_fields_check' ).append( '<option selected="selected" value="' + result + '">' + result + '</option>' );
				}

				jQuery( '#custom_fields_check' ).select2_i18n();

				jQuery( '#custom_fields_check option' ).each( function () {
					jQuery( '#custom_fields_check option[value=\"' + jQuery( this ).val() + '\"]:not(:last)' ).remove();
				} );

				jQuery( "input#select_custom_fields" ).val( '' );
			}
		}

		return false;
	} );

	jQuery( '#custom_fields_compare' ).change( function () {
		var val_op = jQuery( '#custom_fields_compare' ).val();
		if ( 'LIKE' === val_op ) {
			jQuery( "#select_custom_fields" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
			jQuery( "#select_custom_fields--select2" ).hide();
			jQuery( "#text_custom_fields" ).css( 'display', 'inline' ).attr( 'disabled', false );
		}
		else if ( 'NOT SET' === val_op || 'IS SET' === val_op ) {
			jQuery( "#select_custom_fields" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' ).val( ' ' );
			jQuery( "#select_custom_fields--select2" ).hide();
			jQuery( "#text_custom_fields" ).css( 'display', 'none' ).attr( 'disabled', false ).val( ' ' );
		}
		else {
			jQuery( "#select_custom_fields" ).css( 'display', 'inline-block' ).attr( 'disabled', false );
			jQuery( '#select_custom_fields--select2' ).css( 'display', 'inline' );
			jQuery( "#text_custom_fields" ).css( 'display', 'none' ).attr( 'disabled', 'disabled' );
		}
	} );
	//end of change


	setTimeout( function () {
	    woe_open_filter( 'my-order', 1 );
	}, 0);

	setTimeout( function () {
	    woe_open_filter( 'my-products' );
	}, 0);

	setTimeout( function () {
	    woe_open_filter( 'my-shipping' );
	}, 0);

	setTimeout( function () {
	    woe_open_filter( 'my-users' );
	}, 0);

	setTimeout( function () {
	    woe_open_filter( 'my-coupons', 1 );
	}, 0);

	setTimeout( function () {
	    woe_open_filter( 'my-billing' );
	}, 0);

	setTimeout( function () {
	    woe_open_filter( 'my-items-meta' );
	}, 0);

} );