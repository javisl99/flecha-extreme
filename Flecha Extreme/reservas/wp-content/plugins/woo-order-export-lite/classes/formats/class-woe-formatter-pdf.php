<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

include_once 'abstract-class-woe-formatter-plain-format.php';

if ( ! class_exists( 'WOE_PDF_MC_Table' ) ) {
	include_once dirname( __FILE__ ) . '/../FPDF/class-woe-pdf-mc-table.php';
}

/**
 * Class WOE_Formatter_PDF
 *
 * Using CSV formatter as basis. Works like CSV (even creates csv file) but after finish,
 * fetches data from file and paste them to PDF as table
 */
class WOE_Formatter_PDF extends WOE_Formatter_Plain_Format {
	/** @var $pdf WOE_PDF_MC_Table */
	protected $pdf;

	private $orientation = 'P';
	private $page_size = 'A4';
	private $font_size = 5;
	private $repeat_header = false;

	/**
	 * @var WOE_Formatter_Storage
	 */
	protected $storage;

	public function __construct( $mode, $filename, $settings, $format, $labels, $field_formats, $date_format, $offset ) {

		$settings['enclosure'] = '"';
		$settings['linebreak'] = '\r\n';
		$settings['delimiter'] = ',';
		$settings['encoding']  = 'UTF-8';

		$this->orientation   = ! empty( $settings['orientation'] ) ? $settings['orientation'] : 'P';
		$this->page_size     = ! empty( $settings['page_size'] ) ? $settings['page_size'] : 'A4';
		$this->font_size     = ! empty( $settings['font_size'] ) ? $settings['font_size'] : 5;
		$this->repeat_header = ! empty( $settings['repeat_header'] );

		$this->image_format_fields = array();
		if ( isset( $field_formats['order']['image'] ) ) {
			$this->image_format_fields = array_merge( $this->image_format_fields, $field_formats['order']['image'] );
		}
		if ( isset( $field_formats['products']['image'] ) ) {
			$this->image_format_fields = array_merge( $this->image_format_fields, $field_formats['products']['image'] );
		}

		$this->image_format_fields = apply_filters( "woe_{$format}_image_format_fields", $this->image_format_fields );

		$this->link_format_fields = array();
		if ( isset( $field_formats['order']['link'] ) ) {
			$this->link_format_fields = array_merge( $this->link_format_fields, $field_formats['order']['link'] );
		}
		if ( isset( $field_formats['products']['link'] ) ) {
			$this->link_format_fields = array_merge( $this->link_format_fields, $field_formats['products']['link'] );
		}
		if( ! empty( $settings['direction_rtl'] ) ) {
			foreach( $labels as $section => $section_labels ) {
				$labels[$section]->set_labels( array_reverse( $section_labels->get_labels() ) );
			}
		}

		$this->link_format_fields = apply_filters( "woe_{$format}_link_format_fields", $this->link_format_fields );

		parent::__construct( $mode, $filename, $settings, $format, $labels, $field_formats, $date_format, $offset );

		if ( $this->mode != 'preview' && !$this->summary_report_products && !$this->summary_report_customers ) {
			$storage_filename = str_replace( '.csv', '', $filename ) . ".storage";
			$this->storage = new WOE_Formatter_Storage_Csv($storage_filename);
			$this->storage->load();
		}
		if ($this->summary_report_products || $this->summary_report_customers) {
			$summaryKey = $this->summary_report_products ? WOE_Formatter_Storage_Summary_Session::SUMMARY_PRODUCTS_KEY :
				WOE_Formatter_Storage_Summary_Session::SUMMARY_CUSTOMERS_KEY;
			$this->storage =  new WOE_Formatter_Storage_Summary_Session($summaryKey);
			$this->storage->load();
		}
	}

	public function start( $data = '' ) {
		parent::start();

		if ( $this->mode == 'preview' ) {	
			$data = $this->make_header( $data );
			$data = apply_filters( "woe_{$this->format}_header_filter", $data );

			$this->rows[] = $data;
		}
	}

	public function output( $rec ) {
		//$rows = parent::output( $rec ); //we can't change parent because of html
		$is_summary_mode = $this->summary_report_products || $this->summary_report_customers;

		//was taken from parent::output()
		$rec = WOE_Formatter::output( $rec );
		if ($is_summary_mode) {
			$rows = array($rec);
		} else {
			$rows = apply_filters( 'woe_fetch_order_data', $this->maybe_multiple_fields( $rec ) );
		}

		if ( $this->mode !== 'preview' || $is_summary_mode  ) {
			if ( ! $this->storage->getColumns() ) {
				$tmpLabels = $this->make_header( "" ); //it filters labels
				$tmpRow = $this->extractRowForHeaderProcess($rows);
				$tmpLabels = apply_filters( "woe_{$this->format}_header_filter", $tmpLabels );

				foreach ( array_keys( $tmpRow ) as $index => $key ) {
					$column = new WOE_Formatter_Storage_Column();
					$column->setKey( $key );
					if ( $this->field_format_is( $key, $this->image_format_fields ) ) {
						$column->setMetaItem( "image", true );
					}
					if ( $this->field_format_is( $key, $this->link_format_fields ) ) {
						$column->setMetaItem( "link", true );
					}
					if ( isset( $tmpLabels[ $index ] ) ) {
						$column->setMetaItem( "label", $tmpLabels[ $index ] );
					}
					$this->storage->insertColumn( $column );
				}

				$this->storage->saveHeader();
			}

			foreach ( $rows as $row ) {
				if (!$row = $this->applyOutputRowFilter($row)) {
					continue;
				}
				$rowObj = new WOE_Formatter_Storage_Row();
				$rowObj->setData($row);
				$rowObj->setMetaItem("order_id", (int)WC_Order_Export_Engine::$order_id);
				$this->insertRowAndSave($rowObj);
			}
		} else {
			foreach ( $rows as $row ) {
				if (!$row = $this->applyOutputRowFilter($row)) {
					continue;
				}
				$this->rows[] = $row;
			}
		}

		return $rows;
	}

	public function finish_partial() {
		parent::finish_partial();
		$this->storage->close();
	}

	public function finish() {
		if ( $this->mode === 'preview' ) {
			if($this->summary_report_products || $this->summary_report_customers) {
				$this->rows = $this->storage->processDataForPreview($this->rows);
			}
			$this->rows = apply_filters( "woe_{$this->format}_preview_rows", $this->rows );

			$image_preview_multiply = 5;

			fwrite( $this->handle, '<table>' );
			if ( $this->settings['display_column_names'] && count( $this->rows ) < 2 || count( $this->rows ) < 1 ) {
				$this->rows[] = array( '<td colspan=10><b>' . __( 'No results', 'woo-order-export-lite' ) . '</b></td>' );
			}

			foreach ( $this->rows as $row_index => $row ) {
				if ( empty( $this->settings['display_column_names'] ) && $row_index === 0 ) {
					continue;
				}
				foreach ( $row as $column => &$cell ) {
					if ( $this->field_format_is( $column, $this->image_format_fields ) ) {
						$html = $this->make_img_html_from_path(
							$cell,
							$this->settings['row_images_width'] * $image_preview_multiply,
							$this->settings['row_images_height'] * $image_preview_multiply );
						
							$cell = $html ? $html : "";
					}
				}

				if ( $row_index == 0 AND ! empty( $this->settings['display_column_names'] ) ) {
					fwrite( $this->handle,
						'<tr style="font-weight:bold"><td>' . join( '</td><td>', $row ) . "</td><tr>\n" );
				} else {
					fwrite( $this->handle, '<tr><td>' . join( '</td><td>', $row ) . "</td><tr>\n" );
				}
			}
			fwrite( $this->handle, '</table>' );
		}

		parent::finish();

		if ( $this->mode != 'preview' ) {
			$this->storage->close(); //if it's full export, storage hasn't been closed

			if ( apply_filters( 'woe_pdf_output', false, $this->settings, str_replace( '.csv', '.pdf', $this->filename ) ) ) {
			    return;
			}
			
			if ( has_filter( 'woe_storage_sort_by_field') ) {
				$this->storage->loadFull();
				$this->storage->sortRowsByColumn( apply_filters( 'woe_storage_sort_by_field',"plain_products_name") );
				$this->storage->forceSave();
				$this->storage->close();
			}
			
			$this->pdf = new WOE_PDF_MC_Table( $this->orientation, 'mm', $this->page_size );

			$this->storage->initRowIterator();
			$row = array();

			$solid_width = array();
			$imageColumns = array();
			$linkColumns = array();
			foreach ( $this->storage->getColumns() as $pos => $column ) {
				if ( $column->getMetaItem("image") === true ) {
					$solid_width[ $pos ] = $this->settings['row_images_width'];
					$imageColumns[] = $column->getKey();
				}

				if ( $column->getMetaItem("link") === true ) {
					$linkColumns[] = $column->getKey();
				}
			}

			if ( apply_filters('woe_formatter_pdf_use_external_font', false) ) {
				$this->pdf = apply_filters('woe_formatter_pdf_apply_external_font', $this->pdf);
			} else {
				$this->pdf->setFontPath(  dirname( __FILE__ ) . '/../FPDF/font/');

				$this->pdf->AddFont( 'OpenSans', "", "OpenSans-Regular.ttf"  );
				$this->pdf->AddFont( 'OpenSans', "B", "OpenSans-Bold.ttf"  );

				$this->pdf->SetFont( 'OpenSans', '', $this->font_size );
			}

			$this->pdf->SetFillColor( null );

			$pdf_props = apply_filters( 'woe_formatter_pdf_properties', array(
				'header'       => array(
					'title'      => $this->settings['header_text'],
					'style'      => 'B',
					'size'       => $this->font_size,
					'text_color' => $this->hex2RGB( $this->settings['page_header_text_color'] ),
					'logo'       => array(
						'source' => $this->settings['logo_source_id'] ? get_attached_file( $this->settings['logo_source_id'], true ) : $this->settings['logo_source'],
						'width'  => $this->settings['logo_width'],
						'height' => $this->settings['logo_height'],
						'align'  => $this->settings['logo_align'],
					),
				),
				'table'        => array(
					'stretch'      => ! $this->settings['fit_page_width'],
					'column_width' => explode( ",", $this->settings['cols_width'] ),
					'solid_width'  => $solid_width,
					'border_style'  => 'DF',
				),
				'table_header' => array(
					'size'             => $this->font_size,
					'repeat'           => $this->repeat_header,
					'text_color'       => $this->hex2RGB( $this->settings['table_header_text_color'] ),
					'background_color' => $this->hex2RGB( $this->settings['table_header_background_color'] ),
				),
				'table_row'    => array(
					'size'             => $this->font_size,
					'text_color'       => $this->hex2RGB( $this->settings['table_row_text_color'] ),
					'background_color' => $this->hex2RGB( $this->settings['table_row_background_color'] ),
					'image_height'     => $this->settings['row_images_height'],
				),
				'footer'       => array(
					'title'      => $this->settings['footer_text'],
					'style'      => 'B',
					'size'       => $this->font_size,
					'text_color' => $this->hex2RGB( $this->settings['page_footer_text_color'] ),
					'pagination' => $this->settings['pagination'],
				),
			), $this->settings );

			$this->pdf->setProperties( $pdf_props );
			$this->pdf->setHorizontalAligns( explode( ",", $this->settings['cols_align'] ) );
			$this->pdf->setVerticalAlign( $this->settings['cols_vertical_align'] );
			do_action("woe_pdf_started", $this->pdf, $this);

			$this->pdf->AliasNbPages();
			$this->pdf->AddPage();

			foreach ( $this->storage->getColumns() as $column ) {
				$row[] = $column->getMetaItem( "label" );
			}
			$row          = apply_filters( 'woe_row_before_format_pdf', $row );

			if ( ! empty( $this->settings['display_column_names'] ) ) {
				$row  = apply_filters( 'woe_pdf_prepare_header', $row );
				if( $row ) {
					$this->pdf->addTableHeader( $row );
					do_action("woe_pdf_below_header", $this->pdf, $this);
				}	
			}

			$pageBreakOrderLines = wc_string_to_bool( $this->settings['row_dont_page_break_order_lines'] );

			// both are only for option 'row_dont_page_break_order_lines'
			$orderRows = array();
			$orderId = null;

			while ( $rowObj = $this->storage->getNextRow() ) {
				$row = $rowObj->getData();

				foreach ( $row as $key => &$item ) {
					if ( in_array($key, $imageColumns) ) {
						$source = $item;
						$item = array(
							'type'   => 'image',
							'value' => $source,
						);

						if ( ! empty( $this->settings['row_images_add_link'] ) ) {
							$item['link'] = str_replace( wp_get_upload_dir()['basedir'], wp_get_upload_dir()['baseurl'], $source );
						}
					}

					if ( in_array($key, $linkColumns) ) {
						$source = $item;

						// fetch "href" attribute from "a" tag if existing
						if ( preg_match( '/<a\s+(?:[^>]*?\s+)?href=(["\'])(.*?)\1/', $source, $matches ) ) {
							if ( isset( $matches[2] ) ) {
								$source = html_entity_decode( $matches[2] );
							}
						}

						$item = array(
							'type' => 'link',
							'link' => $source,
						);
					}
				}

				$currentOrderId = $rowObj->getMetaItem( "order_id" ); // always pop! even $pageBreakOrderLines is false
				$orderId        = ! $orderId ? $currentOrderId : $orderId;
				$row            = array_values( $row ); // really important to do this

				$row        = apply_filters( 'woe_pdf_prepare_row', $row );
				$row_style  = apply_filters( "woe_pdf_before_print_row", null, $row, $this->pdf, $this );
				$row_height = apply_filters( "woe_pdf_row_height", null, $row, $this->pdf, $this );

				if ( $pageBreakOrderLines ) {
					if ( $orderId !== $currentOrderId ) {
						$rows = array_map( function ( $orderRow ) {
							return $orderRow[0];
						}, $orderRows );

						$heights = array_map( function ( $orderRow ) {
							return $orderRow[2];
						}, $orderRows );
						if ( ! $this->pdf->isEnoughSpace( $rows, $heights ) OR apply_filters("woe_pdf_page_break_before_each_order", false,$orderId) ) {
							$this->pdf->addPageBreak();
						}

						foreach ( $orderRows as $orderRow ) {
							$this->pdf->addRow( $orderRow[0], null, $orderRow[2], $orderRow[1] );
						}

						$orderRows = array();
						$orderId   = $currentOrderId;
					}

					$orderRows[] = array( $row, $row_style, $row_height );
				} else {
					$this->pdf->addRow( $row, null, $row_height, $row_style );
				}
			}

			if ( count( $orderRows ) ) {
				$rows = array_map( function ( $orderRow ) {
					return $orderRow[0];
				}, $orderRows );

				$heights = array_map( function ( $orderRow ) {
					return $orderRow[2];
				}, $orderRows );
				if ( ! $this->pdf->isEnoughSpace( $rows, $heights ) OR apply_filters("woe_pdf_page_break_before_each_order", false, $orderId) ) {
					$this->pdf->addPageBreak();
				}

				foreach ( $orderRows as $orderRow ) {
					$this->pdf->addRow( $orderRow[0], null, $orderRow[2], $orderRow[1] );
				}
			}
			do_action("woe_pdf_finished", $this->pdf, $this);
			$this->pdf->output_to_destination( 'f', $this->filename );

			$this->storage->close();
            $this->storage->delete();
		}
	}

	/**
	 * Convert a hexa decimal color code to its RGB equivalent
	 *
	 * @param string $hexStr (hexadecimal color value)
	 *
	 * @return array|boolean Returns False if invalid hex color value
	 */
	private function hex2RGB( $hexStr ) {
		$hexStr   = preg_replace( "/[^0-9A-Fa-f]/", '', $hexStr ); // Gets a proper hex string
		$rgbArray = array();
		if ( strlen( $hexStr ) == 6 ) { //If a proper hex code, convert using bitwise operation. No overhead... faster
			$colorVal    = hexdec( $hexStr );
			$rgbArray[0] = 0xFF & ( $colorVal >> 0x10 );
			$rgbArray[1] = 0xFF & ( $colorVal >> 0x8 );
			$rgbArray[2] = 0xFF & $colorVal;
		} elseif ( strlen( $hexStr ) == 3 ) { //if shorthand notation, need some string manipulations
			$rgbArray[0] = hexdec( str_repeat( substr( $hexStr, 0, 1 ), 2 ) );
			$rgbArray[1] = hexdec( str_repeat( substr( $hexStr, 1, 1 ), 2 ) );
			$rgbArray[2] = hexdec( str_repeat( substr( $hexStr, 2, 1 ), 2 ) );
		} else {
			return false; //Invalid hex color code
		}

		return $rgbArray; // returns the rgb string or the associative array
	}


}