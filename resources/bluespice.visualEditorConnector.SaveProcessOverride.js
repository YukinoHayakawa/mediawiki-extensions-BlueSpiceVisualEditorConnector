mw.hook( 've.activationComplete' ).add( function () {
	if ( !mw.config.get( 'bsVECSimpleSaveProcess' ) ) {
		// Not enabled
		return;
	}
	if( OO.ui.isMobile() || $( window ).width() < 500 ) {
		// Since there is no hover and no space in mobile
		// do not change the process
		return;
	}
	// Disable click action
	ve.init.target.toolbarSaveButton.off( 'click' );


	var isOpen = false, autoClosed = false, dialog, $frame, $button, closeBlocked= false, bounds, overrideCss= {
		top: 0,
		left: 0,
		margin: 0,
		transition: 'none',
		position: 'absolute'
	};
	ve.init.target.toolbarSaveButton.$element.on( 'mouseenter click', function( e ) {
		var isDisabled = ve.init.target.toolbarSaveButton.isDisabled();
		if ( isOpen || isDisabled ) {
			return;
		}
		// Get the save button
		$button = $( e.currentTarget );
		ve.init.target.toolbarSaveButton.setDisabled( true );
		bounds = $button[0].getBoundingClientRect();

		// Initialize the save dialog
		ve.init.target.showSaveDialog();
		dialog = ve.init.target.saveDialog;
		startTrackingMouse();

		$frame = dialog.$element.find( '.oo-ui-window-frame' );
		positionDialog( $button );

		dialog.connect( ve.init.target, {
			swapPanelComplete: switchToOther,
			approve: positionDialog
		} );

		// Re-enable the button when the dialog closes
		dialog.on ( 'close', function() {
			ve.init.target.toolbarSaveButton.setDisabled( false );
			isOpen = false;
		} );

		$frame.on( 'mouseenter', function() {
			stopTrackingMouse();
		} );
		// Close dialog once the mouse leaves it
		$frame.on( 'mouseleave', function() {
			if ( !isOpen ) {
				return;
			}
			closeDialog();
		} );

		// Add a anchor pointer
		if ( $frame.find( '#bs-vec-save-dialog-anchor' ).length === 0 ) {
			$frame.prepend( $( '<div>' )
				.attr( 'id', 'bs-vec-save-dialog-anchor' )
				.css( {
					'margin-left': '400px',
					'margin-top': '-10px',
					height: 0,
					width: 0,
					'border-left': '10px solid transparent',
					'border-right': '10px solid transparent',
					'border-bottom': '10px solid rgb(162, 169, 177)'
				} ) );
		}

		isOpen = true;
	} );

	function startTrackingMouse() {
		$( window ).on( 'mousemove', trackMouse );
	}

	function stopTrackingMouse() {
		$( window ).off( 'mousemove', trackMouse );
	}

	function trackMouse( e ) {
		if ( !isInBounds( e.clientX, e.clientY ) ) {
			return closeDialog();
		}
	}

	function closeDialog() {
		stopTrackingMouse();
		if( !closeBlocked ) {
			ve.init.target.saveDialog.close();
		}
	}

	function positionDialog() {
		var offset = $button.offset();

		$frame.addClass( 'bs-vec-save-dialog' );
		$frame.css( overrideCss );
		$frame.offset( {
			// By calculating diff between current button offset
			// and scroll offset we get it's relative position
			top: offset.top - window.scrollY + $button.outerHeight() + 10,
			left: offset.left - 500 + $button.outerWidth()
		} );
		$frame.css( 'position', 'absolute' );
		// Remove the white overlay
		$frame.parents( '.oo-ui-dialog' ).css( 'background-color', 'transparent' );
		blockClose( false );
	}

	function blockClose( block )  {
		closeBlocked = block;
	}

	function switchToOther( panel ) {
		if ( [ 'review', 'preview', 'resolve' ].indexOf( panel ) !== -1 ) {
			blockClose( true );
			$frame.offset( { top: 0, left: 0 } );
			dialog.setSize( 'full' );
		}
	}

	function isInBounds( x, y ) {
		var bottom = bounds.bottom + 50; // Buffer to enable user to get to the dialog
		return ( bounds.top <= y && bottom >= y && bounds.left <= x && bounds.right >= x );
	}

	$( '.ve-ui-overlay' ).on( 'click', function( e ) {
		if ( $( e.target ).hasClass( 've-ui-mwSaveDialog' ) ) {
			closeDialog();
		}
	} );
});