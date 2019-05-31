bs.util.registerNamespace( 'bs.vec.ui' );

bs.vec.ui.CellBackgroundStyle = function() {
	bs.vec.ui.RowHeightStyle.super.apply( this );
	this.section = bs.vec.ui.TableStyle.static.SECTION_CELL;
};

OO.inheritClass( bs.vec.ui.CellBackgroundStyle , bs.vec.ui.TableStyle );

bs.vec.ui.CellBackgroundStyle.prototype.getAttribute = function() {
	return 'background-color';
};

bs.vec.ui.CellBackgroundStyle.prototype.getUnit = function() {
	return bs.vec.ui.TableStyle.static.UNIT_NONE;
};

bs.vec.ui.CellBackgroundStyle.prototype.decorate = function ( $element ) {
	if ( this.value.hasOwnProperty( 'colorCode' ) ) {
		return $element.css( this.getAttribute(), this.value.colorCode );
	} else if ( this.value.hasOwnProperty( 'colorClass' ) ) {
		return $element.addClass( this.value.colorClass );
	}
};

bs.vec.ui.CellBackgroundStyle.prototype.getTool = function() {
	return {
		widget: bs.vec.ui.widget.CellBackgroundWidget,
		displaySection: bs.vec.ui.TableStyle.static.TYPE_QUICK
	};
};

/**
 * This is called when command related to this tableStyle is executed
 * context: bs.vec.ui.TableAction
 *
 * @param array args
 */
bs.vec.ui.CellBackgroundStyle.prototype.executeAction = function( subject, args ) {
	if ( !args.hasOwnProperty( 'value' ) ) {
		return;
	}
	var	data = {};

	if ( args.value.hasOwnProperty( 'code' ) ) {
		data = { colorCode:args.value.code };
	} else if ( args.value.hasOwnProperty( 'class' ) ) {
		data = { colorClass: args.value.class };
	}
	if ( !data ) {
		return;
	}

	subject.node.element.cellBackgroundColor = data;
	return subject;
};

bs.vec.ui.CellBackgroundStyle.prototype.getModelProperty = function() {
	return 'cellBackgroundColor';
};

bs.vec.ui.CellBackgroundStyle.prototype.toDataElement = function( section, domElement, result ) {
	var style, styleParser, classes;
	if ( !this.applies( section ) ) {
		return;
	}
	style = domElement.getAttribute( 'style' );
	if ( !style ) {
		return;
	}
	styleParser = new bs.vec.util.StyleAttributeParser( style );
	if ( styleParser.getValueForAttr( this.getAttribute() ) ) {
		result.cellBackgroundStyle = {
			colorCode: styleParser.getValueForAttr( this.getAttribute() )
		};
		return;
	}
	classes = this.getAttribute( 'class' );
	if ( !classes ) {
		return;
	}
	classes = classes.split( ' ' );
	if ( classes.length === 0 || classes.length > 1 ) {
		return;
	}
	// Problem here is that we don't if the class assigned to the td
	// actually comes from color picker
	result.cellBackgroundStyle = {
		colorClass: classes[0]
	};
};

bs.vec.ui.CellBackgroundStyle.prototype.toDomElements = function( section, dataElement, domElement, attributes ) {
	var value;

	if ( !this.applies( section ) ) {
		return;
	}

	if ( !dataElement.hasOwnProperty( 'cellBackgroundColor' ) ) {
		return;
	}
	value = dataElement.cellBackgroundColor;
	if ( value.hasOwnProperty( 'colorCode' ) ) {
		domElement.setAttribute( 'style', this.getAttribute() + ':' + value.colorCode );
	} else if ( value.hasOwnProperty( 'colorClass' ) ) {
		domElement.setAttribute( 'class', value.colorClass );
	}
};

bs.vec.registry.TableStyle.register( "cellBackgroundColor", new bs.vec.ui.CellBackgroundStyle() );
