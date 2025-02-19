<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class WOE_Formatter_Storage_Row {
	/**
	 * @var int
	 */
	protected $key;

	/**
	 * @var array
	 */
	protected $data;

	/**
	 * @var array<string, mixed>
	 */
	protected $meta;

	public function __construct() {
		$this->key  = 0;
		$this->data = array();
		$this->meta = array();
	}

	/**
	 * @param int|string $key
	 */
	public function setKey( $key ) {
		if ( is_int( $key ) || is_string( $key ) ) { //summary customers use string keys
			$this->key = $key;
		}
	}

	/**
	 * @param array $data
	 */
	public function setData( $data ) {
		if ( is_array( $data ) ) {
			$this->data = $data;
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
	 * @return int
	 */
	public function getKey() {
		return $this->key;
	}

	/**
	 * @return array
	 */
	public function getData() {
		return $this->data;
	}
	
	/**
	 * @param string
	 *
	 * @return mixed|null
	 */
	public function getDataItem( $key ) {
		return is_string( $key ) && isset( $this->data[ $key ] ) ? $this->data[ $key ] : null;
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