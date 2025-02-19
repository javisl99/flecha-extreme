<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

interface WOE_Formatter_Storage {
	/**
	 * @param WOE_Formatter_Storage_Column $column
	 */
	public function insertColumn( $column );


	/**
	 * @return array<int, WOE_Formatter_Storage_Column>
	 */
	public function getColumns();

	/**
	 * @param WOE_Formatter_Storage_Row $row
	 */
	public function insertRowAndSave( $row );

	public function saveHeader();

	public function load();

	/**
	 * @return WOE_Formatter_Storage_Row
	 */
	public function getNextRow();

	public function initRowIterator();

	public function close();

    public function delete();

	/**
	 * @param array $rows
	 * @return array
	 */
	public function processDataForPreview($rows);
}