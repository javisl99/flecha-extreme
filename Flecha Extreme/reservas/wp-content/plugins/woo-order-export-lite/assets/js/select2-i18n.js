jQuery.fn.extend( {
	select2_i18n: function ( $attrs, ajax_method, is_default ) {

		if ( typeof $attrs !== 'object' ) {
			$attrs = {};
		}

		var default_params = {language: script_data.select2_locale};

		if ( is_default ) {

			var select2_wo_dropdown_opts = {
				containerCssClass: 'without-dropdown',
				dropdownCssClass: 'without-dropdown',
			};

			Object.assign( default_params, select2_wo_dropdown_opts );
		}

		if ( ajax_method ) {

			let minimumInputLength = 3;

			if ( script_data.show_all_items_in_filters && ( ajax_method === 'get_categories' || ajax_method === 'get_products') ) {
				minimumInputLength = 0;
			}

			var select2_ajax = {
				ajax: {
					url: ajaxurl,
					dataType: 'json',
					delay: 250,
					data: function ( params ) {
						return {
							q: params.term ? params.term : "", // search term
							page: params.page,
							method: ajax_method,
							action: "order_exporter",
							tab: script_data.active_tab,
						};
					},
					processResults: function ( data, page ) {
						return {
							results: data
						};
					},
					cache: true
				},
				escapeMarkup: function ( markup ) {
					return markup;
				}, // let our custom formatter work
				minimumInputLength: minimumInputLength,
				templateResult: function ( item ) {

					var markup = '<div class="weo_clearfix">' +
					             '<div>';

					if ( typeof item.photo_url !== "undefined" ) {
						markup += '<img src="' + item.photo_url + '" style="width: 20%;float:left;" />';
					}

					markup += '<div style="width:75%;float:left;  padding: 5px;">' + item.text + '</div>' +
					          '</div>' +
					          '</div><div style="clear:both"></div>';

					return markup;
				},
				templateSelection: function ( item ) {
					return item.text;
				},
			};

			Object.assign( default_params, select2_ajax );
		}

		$attrs = Object.assign( default_params, $attrs );

		jQuery( this ).select2( $attrs );
	},
} );

jQuery( document ).ready( function ( $ ) {

	try {

		$( '.select2-i18n' ).each( function () {

			var width = $( this ).attr( 'data-select2-i18n-width' );

			$( this ).select2_i18n(
				width ? {width: + width} : {},
				$( this ).attr( 'data-select2-i18n-ajax-method' ),
				$( this ).attr( 'data-select2-i18n-default' )
			);
		} );
	}
	catch ( err ) {
		console.log( err.message );
		jQuery( '#select2_warning' ).show();
	}

} );