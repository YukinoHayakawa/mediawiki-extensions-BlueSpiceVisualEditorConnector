bs.util.registerNamespace( 'bs.vec.ui' );

bs.vec.ui.TextDirectionStyle = function() {
	bs.vec.ui.TextDirectionStyle.super.apply( this );
	this.section = bs.vec.ui.TableStyle.static.SECTION_CELL;
};

OO.inheritClass( bs.vec.ui.TextDirectionStyle , bs.vec.ui.TableStyle );

bs.vec.ui.TextDirectionStyle.prototype.getAttribute = function() {
	return 'writing-mode';
};

bs.vec.ui.TextDirectionStyle.prototype.getUnit = function() {
	return bs.vec.ui.TableStyle.static.UNIT_NONE;
};

bs.vec.ui.TextDirectionStyle.prototype.getTool = function() {
	return {
		widget: bs.vec.ui.widget.TextDirectionwidget,
		displaySection: bs.vec.ui.TableStyle.static.TYPE_QUICK
	};
};

bs.vec.ui.TextDirectionStyle.prototype.executeAction = function( subject, args ) {
	var value = args.hasOwnProperty( 'textDirection' ) ? args.textDirection : null;
	if ( value === null ) {
		delete( subject.node.element.textDirection );
	} else {
		subject.node.element.textDirection = 'vertical-rl';
	}
	return subject;
};

bs.vec.ui.TextDirectionStyle.prototype.getModelProperty = function() {
	return 'textDirection';
};

bs.vec.registry.TableStyle.register( "textDirection", new bs.vec.ui.TextDirectionStyle() );