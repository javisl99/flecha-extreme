<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

class WOE_Formatter_Storage_Csv implements WOE_Formatter_Storage {
	/**
	 * @var array<int, WOE_Formatter_Storage_Column>
	 */
	protected $header;

	/**
	 * @var array<int, WOE_Formatter_Storage_Row>
	 */
	protected $rowsBuffer;

	protected $delimiter = ',';
	protected $enclosure = '"';

	protected $filename;

	/**
	 * @var resource|null
	 */
	protected $handle;

	public function __construct($filename) {
		$this->header     = array();
		$this->rowsBuffer = array();
		$this->filename = $filename;
	}

	public function insertRowAndSave( $row ) {
		if ( $row instanceof WOE_Formatter_Storage_Row ) {
			if ( ! $this->handle ) {
				$this->handle = fopen( $this->filename, 'a' );
			}
			$data = array_map( 'serialize', array( $row->getKey(), $row->getMeta(), $row->getData() ) );
			fputcsv( $this->handle, $data, $this->delimiter, $this->enclosure );
		}
	}

	public function getRow( $key ) {
		$row = null;

		foreach ( $this->rowsBuffer as $tmpRow ) {
			if ( $tmpRow->getKey() === $key ) {
				$row = $tmpRow;
				break;
			}
		}

		return $row;
	}

	public function getRawRows() {
		$result = array();

		foreach ( $this->rowsBuffer as $row ) {
			$result[ $row->getKey() ] = $row->getData();
		}

		return $result;
	}

	public function saveHeader() {
		$this->handle = fopen( $this->filename, 'w' );

		if ( ! $this->handle ) {
			return;
		}

		$rawHeader = array();
		foreach ( $this->header as $column ) {
			$rawHeader[] = serialize( array( $column->getKey(), $column->getMeta() ) );
		}
		fputcsv( $this->handle, $rawHeader, $this->delimiter, $this->enclosure );
	}

	public function forceSave() {
		$handle = fopen( $this->filename, 'w' );

		if ( ! $handle ) {
			return;
		}

		$rawHeader = array();
		foreach ( $this->header as $column ) {
			$rawHeader[] = serialize( array( $column->getKey(), $column->getMeta() ) );
		}
		fputcsv( $handle, $rawHeader, $this->delimiter, $this->enclosure );

		foreach ( $this->rowsBuffer as $row ) {
			$data = array_map( 'serialize', array( $row->getKey(), $row->getMeta(), $row->getData() ) );
			fputcsv( $handle, $data, $this->delimiter, $this->enclosure );
		}

		fclose( $handle );
	}

	/**
	 * @param string $filename
	 */
	public function loadFull() {
		$handle = fopen( $this->filename, 'a+' );

		if ( ! $handle ) {
			return;
		}

		$header = fgetcsv( $handle, 0, $this->delimiter, $this->enclosure );
		if ( ! $header ) {
			return;
		}

		$this->header = array();
		foreach ( $header as $rawItem ) {
			$item   = unserialize($rawItem );
			$column = new WOE_Formatter_Storage_Column();
			$column->setKey( $item[0] );
			$column->setMeta( $item[1] );
			$this->header[] = $column;
		}

		$this->rowsBuffer = array();
		while ( $rawRow = fgetcsv( $handle, 0, $this->delimiter, $this->enclosure ) ) {
			$row    = array_map( 'unserialize', $rawRow );
			$rowObj = new WOE_Formatter_Storage_Row();
			$rowObj->setKey( $row[0] );
			$rowObj->setMeta( $row[1] );
			$rowObj->setData( $row[2] );
			$this->rowsBuffer[] = $rowObj;
		}

		fclose( $handle );
	}

	public function load() {
		if ( ! file_exists( $this->filename ) ) {
			return;
		}

		$handle = fopen( $this->filename, 'a+' );

		if ( ! $handle ) {
			return;
		}

		$header = fgetcsv( $handle, 0, $this->delimiter, $this->enclosure );
		if ( ! $header ) {
			return;
		}

		$this->header = array();
		foreach ( $header as $rawItem ) {
			$item   = unserialize( $rawItem );
			$column = new WOE_Formatter_Storage_Column();
			$column->setKey( $item[0] );
			$column->setMeta( $item[1] );
			$this->header[] = $column;
		}

		fclose( $handle );
	}

	/**
	 * @param string $filename
	 */
	public function save() {
		if(empty($this->rowsBuffer)) {
			return;
		}
		if ( ! file_exists( $this->filename ) ) {
			$this->forceSave();

			return;
		}

		$handle = fopen( $this->filename, 'a' );

		if ( ! $handle ) {
			return;
		}

		foreach ( $this->rowsBuffer as $row ) {
			$data = array_map( 'serialize', array( $row->getKey(), $row->getMeta(), $row->getData() ) );
			fputcsv( $handle, $data, $this->delimiter, $this->enclosure );
		}

		fclose( $handle );
	}
	
	public function sortRowsByColumn($field) {
		return $this->sortRows( function($a,$b) use($field){ 
				return strcmp($a->getDataItem($field),$b->getDataItem($field)); 
		} );
	}
	
	public function sortRows($callback) {
		usort($this->rowsBuffer,$callback);
	}

	public function insertColumn( $column ) {
		if ( $column instanceof WOE_Formatter_Storage_Column ) {
			$this->header[] = $column;
		}
	}

	public function getColumns() {
		return $this->header;
	}

	/**
	 * @param string $filename
	 *
	 * @return bool
	 */
	public function initRowIterator() {
		if ( ! file_exists( $this->filename ) ) {
			return false;
		}

		$handle = fopen( $this->filename, 'a+' );

		if ( ! $handle ) {
			return false;
		}

		$header = fgetcsv( $handle, 0, $this->delimiter, $this->enclosure );
		if ( ! $header ) {
			return false;
		}

		$this->header = array();
		foreach ( $header as $rawItem ) {
			$item   = unserialize( $rawItem );
			$column = new WOE_Formatter_Storage_Column();
			$column->setKey( $item[0] );
			$column->setMeta( $item[1] );
			$this->header[] = $column;
		}

		$this->handle = $handle;

		return true;
	}

	/**
	 * @return WOE_Formatter_Storage_Row|null
	 */
	public function getNextRow() {
		if ( ! $this->handle ) {
			return null;
		}

		$rawRow = fgetcsv( $this->handle, 0, $this->delimiter, $this->enclosure );

		if ( ! $rawRow ) {
			return null;
		}

		$row    = array_map( 'unserialize', $rawRow );
		$rowObj = new WOE_Formatter_Storage_Row();
		$rowObj->setKey( $row[0] );
		$rowObj->setMeta( $row[1] );
		$rowObj->setData( $row[2] );

		return $rowObj;
	}

	public function close() {
		if( $this->handle ) {
			fclose( $this->handle );
			$this->handle = null;
		}
	}

	public function processDataForPreview($rows)
	{
		return $rows;
	}

    public function delete() {
        return unlink($this->filename);
    }
}