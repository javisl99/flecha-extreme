jQuery(document).ready(function($) {
	$( '#the-list #gallery-master-plugin-disable-link' ).click(function(e) {
		e.preventDefault();

		var reason = $( '#gallery-master-feedback-content .gallery-master-reason' ),
			deactivateLink = $( this ).attr( 'href' );

	    $( "#gallery-master-feedback-content" ).dialog({
	    	title: 'Quick Feedback Form',
	    	dialogClass: 'gallery-master-feedback-form',
	      	resizable: false,
	      	minWidth: 430,
	      	minHeight: 300,
	      	modal: true,
	      	buttons: {
	      		'go' : {
		        	text: 'Continue',
        			icons: { primary: "dashicons dashicons-update" },
		        	id: 'gallery-master-feedback-dialog-continue',
					class: 'button',
		        	click: function() {
		        		var dialog = $(this),
		        			go = $('#gallery-master-feedback-dialog-continue'),
		          			form = dialog.find('form').serializeArray(),
							result = {};
						$.each( form, function() {
							if ( '' !== this.value )
						    	result[ this.name ] = this.value;
						});
							if ( ! jQuery.isEmptyObject( result ) ) {
								result.action = 'post_user_feedback_gallery_master';
							    $.ajax({
							        url: post_feedback.admin_ajax,
							        type: 'POST',
							        data: result,
							        error: function(){},
							        success: function(msg){},
							        beforeSend: function() {
							        	go.addClass('gallery-master-ajax-progress');
							        },
							        complete: function() {
							        	go.removeClass('gallery-master-ajax-progress');
							            dialog.dialog( "close" );
							            location.href = deactivateLink;
							        }
							    });
							}
					},
				},
	      		'cancel' : {
		        	text: 'Cancel',
		        	id: 'gallery-master-feedback-cancel',
		        	class: 'button button-primary',
		        	click: function() {
		          		$( this ).dialog( "close" );
		        	}
	      		},
	      		'skip' : {
		        	text: 'Skip',
		        	id: 'gallery-master-feedback-dialog-skip',
		        	click: function() {
		          		$( this ).dialog( "close" );
		          		location.href = deactivateLink;
		        	}
	      		},
	      	}
	    });
	});
});
