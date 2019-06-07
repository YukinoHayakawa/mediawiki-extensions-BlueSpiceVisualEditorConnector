<?php

namespace BlueSpice\VisualEditorConnector\SaferEdit\EnvironmentChecker;

use BlueSpice\SaferEdit\EnvironmentChecker\Base;

class VEEdit extends Base {

	public function isEditMode( &$result ) {
		$veAction = $this->context->getRequest()->getText( 'veaction', '' );

		if ( $veAction !== '' && $this->userCanEdit() ) {
			$result = true;
			return false;
		}
		return true;
	}

	public function shouldShowWarning( &$result ) {
		$isEdit = false;
		$this->isEditMode( $isEdit );
		if ( $isEdit ) {
			$result = false;
			return false;
		}
		return true;
	}
}
