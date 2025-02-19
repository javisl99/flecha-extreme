<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

include_once 'abstract-class-woe-formatter-sv.php';

class WOE_Formatter_Csv extends WOE_Formatter_sv {
	public function __construct(
		$mode,
		$filename,
		$settings,
		$format,
		$labels,
		$field_formats,
		$date_format,
		$offset
	) {
		parent::__construct( $mode, $filename, $settings, $format, $labels, $field_formats, $date_format, $offset );
		//we just set filter!
		if ( ! empty( $this->settings['force_quotes'] ) ) {
			add_filter('woe_csv_custom_output_func',function ($custom_output,$handle,$data,$delimiter,$linebreak,$enclosure,$is_header) {
				foreach($data as $k=>$v) 
					$data[$k] =  $enclosure . str_replace($enclosure, $enclosure . $enclosure, $v) . $enclosure;
				fwrite($handle, join($delimiter, $data). $linebreak  );
				return true;  //stop default fputcsv!
			}, 10, 7);
		}

	}

    protected function remove_linebreaks_from_array( &$data ) {
        $data = array_map( array( $this, 'remove_linebreaks_callback' ), $data );
    }
	
	protected function delete_linebreaks_from_array( &$data ) {
		$data = array_map( array( $this, 'delete_linebreaks_callback' ), $data );
	}

    protected function remove_linebreaks_callback( $value ) {
        return preg_replace( "/([\r,\n])+/", " ", $value);
    }

	protected function delete_linebreaks_callback( $value ) {
		// show linebreaks as literals
		$value = str_replace( "\n", '\n', $value );
		$value = str_replace( "\r", '\r', $value );

		return $value;
	}

	protected function prepare_array( &$arr ) {
		if ( ! empty( $this->settings['delete_linebreaks'] ) ) {
			$this->delete_linebreaks_from_array( $arr );
		}
        if ( ! empty( $this->settings['remove_linebreaks'] ) ) {
            $this->remove_linebreaks_from_array( $arr );
        }
		parent::prepare_array( $arr );
	}

}