String.prototype.hashCode = function () {
	var hash = 0, i, chr;
	if ( this.length === 0 ) {
		return hash;
	}
	for ( i = 0; i < this.length; i ++ ) {
		chr = this.charCodeAt( i );
		hash = (
			       (
				       hash << 5
			       ) - hash
		       ) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};

function woe_make_json_var( obj ) {
	return encodeURIComponent( woe_make_json( obj ) );
}

function woe_make_json( obj ) {
	return JSON.stringify( obj.serializeJSON() );
}

function woe_change_filename_ext() {
	if ( jQuery( '#export_filename' ).length ) {
		var filename = jQuery( '#export_filename input' ).val();
		var ext = output_format.toLowerCase();
		if ( ext == 'xls' && ! jQuery( '#format_xls_use_xls_format' ).prop( 'checked' ) ) //fix for XLSX
		{
			ext = 'xlsx';
		}

		var file = filename.replace( /^(.*)\..+$/, "$1." + ext );
		if ( file.indexOf( "." ) == - 1 )  //no dots??
		{
			file = file + "." + ext;
		}
		jQuery( '#export_filename input' ).val( file );
		woe_show_summary_report( output_format );
	}
}

function woe_show_summary_report( ext ) {
	if ( woe_is_flat_format( ext ) ) {
		jQuery( '#summary_report_by_products' ).show();
		jQuery( '#summary_report_by_customers' ).show();
	} else {
		jQuery( '#summary_report_by_products' ).hide();
		jQuery( '#summary_report_by_customers' ).hide();
		jQuery( '#summary_setup_fields' ).hide();
		jQuery( '#summary_report_by_products_checkbox' ).prop( 'checked', false ).trigger( 'change' );
	}
}

//for warning
function woe_setup_alert_date_filter() {
	default_date_filter_color = jQuery( "#my-date-filter" ).css( 'color' );
	woe_try_color_date_filter();
	jQuery( '#from_date' ).change( function () {
		woe_try_color_date_filter();
	} );
	jQuery( '#to_date' ).change( function () {
		woe_try_color_date_filter();
	} );
}

function woe_is_flat_format( format ) {
	return (
		settings_form.flat_formats.indexOf( format ) > - 1
	);
}

function woe_reset_date_filter_for_cron() {
	if ( mode == 'cron' ) {
		jQuery( "#from_date" ).val( "" );
		jQuery( "#to_date" ).val( "" );
		woe_try_color_date_filter();
	}
}

function woe_try_color_date_filter() {

	var color = default_date_filter_color;

	if ( jQuery( "#from_date" ).val() || jQuery( "#to_date" ).val() ) {
		color = 'red';
	}

	jQuery( "#my-date-filter" ).css( 'color', color );
}

function woe_show_error_message( text ) {
	if ( ! text ) {
		text = "Please, open section 'Misc Settings' and \n mark checkbox 'Enable debug output' \n to see exact error message";
	}
	alert( text );
}

function woe_init_image_uploaders() {

	var custom_uploader;

	jQuery( '.image-upload-button' ).click( function ( e ) {
		e.preventDefault();
		if ( custom_uploader ) {
			custom_uploader.open();
			return;
		}

		custom_uploader = wp.media.frames.file_frame = wp.media( {
			title: 'Choose Image',
			button: {
				text: 'Choose Image'
			},
			multiple: false
		} );

		var self = this;
		custom_uploader.on( 'select', function () {
			attachment = custom_uploader.state().get( 'selection' ).first().toJSON();
			jQuery( self ).siblings( 'input[type="hidden"].source_url' ).val( attachment.url );
			jQuery( self ).siblings( 'input[type="hidden"].source_id' ).val( attachment.id );
			jQuery( self ).siblings( 'img' ).attr( 'src', attachment.url ).removeClass( 'hidden' );
			jQuery( self ).siblings( '.image-clear-button' ).removeClass( 'hidden' );
		} );

		custom_uploader.open();
	} );

	jQuery( '.image-clear-button' ).click( function ( e ) {
		jQuery( this ).siblings( 'input[type="hidden"]' ).val( '' );
		jQuery( this ).siblings( 'img' ).attr( 'src', '' ).addClass( 'hidden' );
		jQuery( this ).addClass( 'hidden' );
	} );

	return custom_uploader;
}

var woe_form_submitting = false;

function woe_set_form_submitting() {
	woe_form_submitting = true;
}
window.onload = function () {

	var form = jQuery( '#export_job_settings' );
	var on_load_form_data;

	setTimeout(function () {
	    on_load_form_data = form.serialize();
	}, 1500);

	var woe_is_dirty = function ( on_load_form_data ) {
		return on_load_form_data.hashCode() !== form.serialize().hashCode()
	};

	window.addEventListener( "beforeunload", function ( e ) {
		var clicked_el = e.target.activeElement;

		if ( clicked_el.id === 'copy-to-profiles' ) {
			woe_set_form_submitting();
		}
		
		if ( woe_is_dirty( on_load_form_data ) && ! woe_form_submitting ) {
			(
				e || window.event
			).returnValue = false; //Gecko + IE
			return false; //Gecko + Webkit, Safari, Chrome etc.
		} else {
			return undefined;
		}
	} );
}

jQuery( document ).ready( function ( $ ) {

	function woe_disable_input_by_id( current_elem, element_id ) {
		var $disabled = $( '#' + element_id );
			( current_elem.checked === true )
				? $disabled.attr( 'disabled', true )
				: $disabled.removeAttr( 'disabled' );
	}

	$( '.my-hide-next' ).click( function () {

		$( this ).next().toggleClass('hide');

		var is_shown = ! $( this ).next().is( ':hidden' );

		$( this ).find( 'span' )
		         .toggleClass( 'ui-icon-triangle-1-n', is_shown )
		         .toggleClass( 'ui-icon-triangle-1-s', ! is_shown );
	} );

	$( '#date_format_block select' ).on( 'change', function () {
		var value = $( this ).val();
		if ( value == 'custom' ) {
			$( '#custom_date_format_block' ).show();
		} else {
			$( '#custom_date_format_block' ).hide();
			$( 'input[name="settings[date_format]"]' ).val( value );
		}
	} );

	$( '#time_format_block select' ).on( 'change', function () {
		var value = $( this ).val();
		if ( value == 'custom' ) {
			$( '#custom_time_format_block' ).show();
		} else {
			$( '#custom_time_format_block' ).hide();
			$( 'input[name="settings[time_format]"]' ).val( value );
		}
	} );

	$( 'input[type="checkbox"][name="settings[custom_php]"]' ).on( 'change', function () {
		$( 'div#custom_php_code_textarea' ).toggle( $( this ).is( ':checked' ) );
	} );

	$( '#woe_format_disabler' ).on( 'change', function() {
		woe_disable_input_by_id( this, 'woe_format_disabled' );
	} ).trigger( 'change' );

	$( '#woe_format_tsv_disabler').on( 'change', function() {
		woe_disable_input_by_id( this, 'woe_format_tsv_disabled' );
	} ).trigger( 'change' );

    if (typeof settings_form.settings.show_date_time_picker_for_date_range !== 'undefined' && settings_form.settings.show_date_time_picker_for_date_range) {
        if ( typeof woe_init_datetime_picker !== 'undefined' ) {
            woe_init_datetime_picker($("#from_date"), {'hours': "00", 'minutes': "00", 'seconds': "00"});
            woe_init_datetime_picker($("#to_date"), {'hours': "23", 'minutes': "59", 'seconds': "59"});
        }
    } else {
        jQuery('.date').datepicker({
            dateFormat: 'yy-mm-dd',
            constrainInput: false
        });
    }

	if ( mode == settings_form.EXPORT_SCHEDULE ) {
		woe_setup_alert_date_filter();
	}

	//for XLSX
	$( '#format_xls_use_xls_format' ).click( function () {
		woe_change_filename_ext();
	} );

	woe_show_summary_report( output_format );

	if ( ! summary_mode_by_products ) {
		jQuery( '#summary_setup_fields' ).hide();
	}

	woe_init_image_uploaders();

	// this line must be last , we don't have any errors
	jQuery( '#JS_error_onload' ).hide();

} );