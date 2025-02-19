<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class WOE_Formatter_Storage_Column {
	/**
	 * @var string
	 */
	protected $key;

	/**
	 * @var array<string, mixed>
	 */
	protected $meta;

	public function __construct() {
		$this->key  = "";
		$this->meta = array();
	}

	/**
	 * @param string $key
	 */
	public function setKey( $key ) {
		if ( is_string( $key ) ) {
			$this->key = $key;
		}
	}

	/**
	 * @param array $meta
	 */
	public function setMeta( $meta ) {
		if ( is_array( $meta ) ) {
			$this->meta = array();

			foreach ( $meta as $key => $item ) {
				if ( is_string( $key ) ) {
					$this->meta[ $key ] = $item;
				}
			}
		}
	}

	/**
	 * @param string $key
	 * @param mixed $value
	 */
	public function setMetaItem( $key, $value ) {
		if ( is_string( $key ) ) {
			$this->meta[ $key ] = $value;
		}
	}

	/**
	 * @return string
	 */
	public function getKey() {
		return $this->key;
	}

	/**
	 * @return array<int, mixed>
	 */
	public function getMeta() {
		return $this->meta;
	}

	/**
	 * @param string
	 *
	 * @return mixed|null
	 */
	public function getMetaItem( $key ) {
		return is_string( $key ) && isset( $this->meta[ $key ] ) ? $this->meta[ $key ] : null;
	}
}