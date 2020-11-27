<?php

namespace BlueSpice\VisualEditorConnector\Api;

use ApiVisualEditor;
use ApiBase;
use BlueSpice\ExtensionAttributeBasedRegistry;
use BlueSpice\VisualEditorConnector\IPostProcessor;
use BlueSpice\VisualEditorConnector\IPreProcessor;
use MediaWiki\MediaWikiServices;
use Title;
use WikitextContent;
use BlueSpice\VisualEditorConnector\Api\Format\RestbaseMock as RestbaseMockFormat;

class RestbaseMock extends ApiVisualEditor {

	/**
	 *
	 * @param \ApiMain $main
	 * @param string $name
	 */
	public function __construct( \ApiMain $main, $name ) {
		$config = MediaWikiServices::getInstance()->getConfigFactory()->makeConfig( 'visualeditor' );
		parent::__construct( $main, $name, $config );
	}

	/**
	 *
	 */
	public function execute() {
		$this->serviceClient->mount( '/restbase/', $this->getVRSObject() );
		$path = $this->getParameter( 'path' );

		if ( strpos( $path, 'v1/transform/wikitext/to/html/' ) === 0 ) {
			$pageName = preg_replace( '#^v1/transform/wikitext/to/html/(.*?)/\d*?$#', '$1', $path );
			$this->mockWikiTextToHtml( $pageName );
		}
		if ( strpos( $path, 'v1/page/html/' ) === 0 ) {
			/**
			 * Explanation of RegEx or why do we need to extract pageName
			 * between v1/page/html/ and [?>]redirect=false
			 * The issue goes from pages with dots (.) in the title
			 * WebRequest.php:1062 runs IEUrlExtension::areServerVarsBad()
			 * which is looking for file extension in path (.php for example)
			 * but page title also contains a dot so IEUrlExtension::findIE6Extension()
			 * returns wrong extension
			 * The strangest string manipulations happen in IEUrlExtension::fixUrlForIE6
			 * especially, replacing `?` chars with `%3E` (>)
			 * As the result we get url with `>` chars instead of `?`
			 *
			 * [?>] - is important
			 */
			$pageName = preg_replace( '#^v1/page/html/(.*?)([?>]redirect=false)$#is', '$1', $path );

			$this->mockGetPageHtml( $pageName );
		}
	}

	/**
	 *
	 * @return array
	 */
	public function getAllowedParams() {
		return [
			'path' => [
				ApiBase::PARAM_REQUIRED => true,
			],
			'wikitext' => [
				ApiBase::PARAM_TYPE => 'string',
				ApiBase::PARAM_REQUIRED => false
			]
		];
	}

	private function mockWikiTextToHtml( $pageName ) {
		$wikitext = $this->getParameter( 'wikitext' );

		$this->executePreProcessors( $pageName, $wikitext );
		$html = $this->requestRestbase(
			'POST',
			'transform/wikitext/to/html/' . urlencode( $pageName ),
			[
				'wikitext' => $wikitext
			]
		);
		$this->executePostProcessors( $pageName, $html );
		$result = $this->getResult();
		$result->addValue( null, 'html', $html );
	}

	private function mockGetPageHtml( $pageName ) {
		$revision = $this->revisionFromPageName( $pageName );
		if ( $revision === null ) {
			return;
		}

		$result = $this->getResult();

		$title = \Title::newFromID( $revision->getPageId() );
		if ( !$title->userCan( 'read' ) ) {
			return;
		}

		$content = $revision->getContent( 'main' );

		if ( $content instanceof WikitextContent ) {
			$rawWikiText = $content->getNativeData();
			$this->executePreProcessors( $pageName, $rawWikiText );

			$html = $this->requestRestbase(
				'POST',
				'transform/wikitext/to/html/' . urlencode( $title->getPrefixedDBkey() ),
				[
					'wikitext' => $rawWikiText
				]
			);

			$this->executePostProcessors( $pageName, $html );
			$result->addValue( null, 'html', $html );
		}
	}

	/**
	 * @param string $pageName
	 * @return \MediaWiki\Storage\RevisionRecord|null
	 */
	protected function revisionFromPageName( $pageName ) {
		$pageNameParts = explode( '>', $pageName, 2 );
		$pageName = array_shift( $pageNameParts );

		$pageNameParts = explode( "/", $pageName );

		$title = null;
		$oldId = 0;
		if ( count( $pageNameParts ) === 1 ) {
			$title = \Title::newFromText( $pageNameParts[0] );
		} else {
			$hasOldId = $this->hasOldId( $pageNameParts );
			if ( $hasOldId ) {
				$oldId = array_pop( $pageNameParts );
				$title = \Title::newFromText( implode( '/', $pageNameParts ) );
			} else {
				$title = \Title::newFromText( implode( '/', $pageNameParts ) );
			}
		}

		if ( $title instanceof Title === false || $title->exists() === false ) {
			return null;
		}

		$revId = $oldId ?: $title->getLatestRevID();

		return \MediaWiki\MediaWikiServices::getInstance()->getRevisionStore()->getRevisionById(
			$revId
		);
	}

	/**
	 * Checks if path contains oldid param for given page
	 *
	 * @param array $parts
	 * @return bool
	 */
	protected function hasOldId( $parts ) {
		$oldId = array_pop( $parts );
		if ( !is_numeric( $oldId ) ) {
			return false;
		}
		$oldId = intval( $oldId );
		$title = \Title::newFromText( implode( '/', $parts ) );

		if ( !$title instanceof \Title || !$title->exists() ) {
			return false;
		}

		$revision = MediaWikiServices::getInstance()->getRevisionStore()->getRevisionById(
			$oldId
		);

		if ( $revision === null ) {
			return false;
		}

		if ( $revision->getPageId() === $title->getArticleID() ) {
			return true;
		}

		return false;
	}

	/**
	 *
	 * @return RestbaseMockFormat
	 */
	public function getCustomPrinter() {
		return new RestbaseMockFormat( $this->getMain() );
	}

	/**
	 * @param string $pageName
	 * @param string &$content
	 */
	private function executePostProcessors( $pageName, &$content ) {
		foreach ( $this->getPostProcessors() as $processor ) {
			$content = $processor->process( $pageName, $content );
		}
	}

	/**
	 *
	 * @return IPostProcessor[]
	 */
	private function getPostProcessors() {
		$registry = new ExtensionAttributeBasedRegistry(
			'BlueSpiceVisualEditorConnectorPostProcessors'
		);

		$processors = [];
		foreach ( $registry->getAllKeys() as $key ) {
			$factoryCallback = $registry->getValue( $key );
			if ( !is_callable( $factoryCallback ) ) {
				continue;
			}
			$processor = call_user_func( $factoryCallback );
			if ( !$processor instanceof IPostProcessor ) {
				continue;
			}
			$processors[] = $processor;
		}
		return $processors;
	}

	/**
	 * @param string $pageName
	 * @param string &$wikitext
	 */
	private function executePreProcessors( $pageName, &$wikitext ) {
		foreach ( $this->getPreProcessors() as $processor ) {
			$wikitext = $processor->process( $pageName, $wikitext );
		}
	}

	/**
	 *
	 * @return IPreProcessor[]
	 */
	private function getPreProcessors() {
		$registry = new ExtensionAttributeBasedRegistry(
			'BlueSpiceVisualEditorConnectorPreProcessors'
		);

		$processors = [];
		foreach ( $registry->getAllKeys() as $key ) {
			$factoryCallback = $registry->getValue( $key );
			if ( !is_callable( $factoryCallback ) ) {
				continue;
			}
			$processor = call_user_func( $factoryCallback );
			if ( !$processor instanceof IPreProcessor ) {
				continue;
			}
			$processors[] = $processor;
		}
		return $processors;
	}

}
