<?php

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * Ajax communication
 */
class EADateTime
{

    /**
     * @param string $format
     * @return string
     */
    function convert_to_moment_format($format)
    {
        $escaped = array();
        $local = $format;

        // replace escape string \ with [] around
        while (true) {
            $index = strpos($local,'\\');

            if ($index === false) break;

            $currentPos = '!' . count($escaped) . '!';
            $escaped[$currentPos] = "[{$local[$index+1]}]";

            $local = substr($local, 0, $index) . $currentPos . substr($local, ($index+2));
        }

        $replacements = array(
            'd' => 'DD',
            'D' => 'ddd',
            'j' => 'D',
            'l' => 'dddd',
            'N' => 'E',
            'S' => 'o',
            'w' => 'e',
            'z' => 'DDD',
            'W' => 'W',
            'F' => 'MMMM',
            'm' => 'MM',
            'M' => 'MMM',
            'n' => 'M',
            't' => '', // no equivalent
            'L' => '', // no equivalent
            'o' => 'YYYY',
            'Y' => 'YYYY',
            'y' => 'YY',
            'a' => 'a',
            'A' => 'A',
            'B' => '', // no equivalent
            'g' => 'h',
            'G' => 'H',
            'h' => 'hh',
            'H' => 'HH',
            'i' => 'mm',
            's' => 'ss',
            'u' => 'SSS',
            'e' => 'zz', // deprecated since version 1.6.0 of moment.js
            'I' => '', // no equivalent
            'O' => '', // no equivalent
            'P' => '', // no equivalent
            'T' => '', // no equivalent
            'Z' => '', // no equivalent
            'c' => '', // no equivalent
            'r' => '', // no equivalent
            'U' => 'X',
        );

        $momentFormat = strtr($local, $replacements);
        $momentFormatWithEscaped = strtr($momentFormat, $escaped);
        return $momentFormatWithEscaped;
    }

    /**
     * Default DateTime format
     *
     * @return string
     */
    public function default_format()
    {
        return 'Y-m-d H:i';
    }
}
