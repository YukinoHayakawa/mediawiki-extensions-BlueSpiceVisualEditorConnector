bs.util.registerNamespace( 'bs.vec.dm' );

bs.vec.dm.TableCellNode = function() {
	bs.vec.dm.TableCellNode.super.apply( this, arguments );
};

/* Inheritance */

OO.inheritClass( bs.vec.dm.TableCellNode, ve.dm.TableCellNode );

/* Static Methods */

bs.vec.dm.TableCellNode.static.toDataElement = function ( domElements ) {
	var attributes = {}, result = {};

	ve.dm.TableCellableNode.static.setAttributes( attributes, domElements );
	this.runTableStyles( 'toDataElement', [ domElements[0], result ] );

	result = $.extend( result, {
		type: this.name,
		attributes: attributes
	} );
	return result;
};

bs.vec.dm.TableCellNode.static.toDomElements = function ( dataElement, doc ) {
	var tag = dataElement.attributes && dataElement.attributes.style === 'header' ? 'th' : 'td',
		domElement = doc.createElement( tag ),
		attributes = dataElement.attributes;

	ve.dm.TableCellableNode.static.applyAttributes( attributes, domElement );
	this.runTableStyles( 'toDomElements', [ dataElement, domElement, attributes ] );

	return [ domElement ];
};

bs.vec.dm.TableCellNode.static.runTableStyles = function( func, params ) {
	var registry = bs.vec.registry.TableStyle.registry,
		tableStyleKey;

	for( tableStyleKey in registry ) {
		if ( !registry.hasOwnProperty( tableStyleKey ) ) {
			continue;
		}
		registry[tableStyleKey][func]( 'cell', ...params );
	}
};
