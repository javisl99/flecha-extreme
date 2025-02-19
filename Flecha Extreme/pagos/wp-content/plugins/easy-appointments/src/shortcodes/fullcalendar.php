<?php

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * Class EAFullCalendar
 */
class EAFullCalendar
{

    /**
     * @var EAOptions
     */
    protected $options;

    /**
     * @var EADBModels
     */
    protected $models;

    /**
     * @var EADateTime
     */
    protected $datetime;

    /**
     * @var EALogic
     */
    protected $logic;

    /**
     * @param EADBModels $models
     * @param $logic
     * @param EAOptions $options
     * @param $datetime
     */
    function __construct($models, $logic, $options, $datetime)
    {
        $this->options  = $options;
        $this->models   = $models;
        $this->datetime = $datetime;
        $this->logic = $logic;
    }

    public function init()
    {
        // register JS
         add_action('wp_enqueue_scripts', array($this, 'init_scripts'));
        // add_action( 'admin_enqueue_scripts', array( $this, 'init' ) );

        // add shortcode standard
        add_shortcode('ea_full_calendar', array($this, 'ea_full_calendar'));

        // allow public access for FullCalendar
        $is_public = $this->options->get_option_value('fullcalendar.public', '0');

        if (!empty($is_public)) {
            add_filter('ea_calendar_public_access', function() { return true; });
        }
    }

    public function init_scripts()
    {
        // bootstrap script
        wp_register_script(
            'ea-full-calendar',
            EA_PLUGIN_URL . 'js/libs/fullcalendar/fullcalendar.min.js',
            array('jquery', 'ea-momentjs', 'wp-api', 'thickbox'),
            '2.0.0',
            true
        );

        wp_register_style(
            'ea-full-calendar-style',
            EA_PLUGIN_URL . 'js/libs/fullcalendar/fullcalendar.css'
        );

        // admin style
        wp_register_style(
            'ea-full-calendar-custom-css',
            EA_PLUGIN_URL . 'css/full-calendar.css'
        );
    }

    /**
     * Shortcode def for Full Calendar
     *
     * @param $atts
     * @return string
     */
    public function ea_full_calendar($atts)
    {
        $code_params = shortcode_atts(array(
            'location'             => null,
            'service'              => null,
            'worker'               => null,
            'start_of_week'        => get_option('start_of_week', 0),
            'rtl'                  => '0',
            'default_date'         => date('Y-m-d'),
            'min_date'             => null,
            'max_date'             => null,
            'time_format'          => 'h(:mm)t',
            'display_event_end'    => '0',
            'show_remaining_slots' => '0',
            'show_week'            => '0',
            'title_field'          => 'name',
            'default_view'         => 'month', // basicWeek, basicDay, agendaDay, agendaWeek
            'views'                => 'month,basicWeek,basicDay',
            'day_names_short'      => 'Sun,Mon,Tue,Wed,Thu,Fri,Sat',
            'day_names'            => 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'month_names_short'    => 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',
            'month_names'          => 'January,February,March,April,May,June,July,August,September,October,November,December',
            'button_labels'        => 'today,month,week,day,list',
            'month_header_format'  => 'MMM YYYY',
            'week_header_format'   => 'MMM DD, YYYY',
            'day_header_format'    => 'MMM DD, YYYY',
            'column_header_format' => null,
        ), $atts);

        // scripts that are going to be used
        wp_enqueue_script('underscore');
        wp_enqueue_script('ea-validator');
        wp_enqueue_script('ea-full-calendar');

        // add thickbox styles
        wp_enqueue_style('thickbox.css', includes_url('/js/thickbox/thickbox.css'), null, '1.0');

        wp_enqueue_style('ea-full-calendar-style');
        wp_enqueue_style('ea-full-calendar-custom-css');

        $customCss = $this->options->get_option_value('custom.css', '');
        // add custom CSS
        wp_add_inline_style( 'ea-full-calendar-custom-css', $customCss );

        $id = uniqid();

        $show_week_numbers = $code_params['show_week'] === '1' ? 'true' : 'false';
        $is_rtl = $code_params['rtl'] === '1' ? 'true' : 'false';

        /**
         * Convert string: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat' to string
         * "['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" etc
         */
        $day_names_short = $this->convert_csv_to_js_array_of_strings($code_params['day_names_short']);
        $day_names = $this->convert_csv_to_js_array_of_strings($code_params['day_names']);
        $month_names_short = $this->convert_csv_to_js_array_of_strings($code_params['month_names_short']);
        $month_names = $this->convert_csv_to_js_array_of_strings($code_params['month_names']);
        $button_labels = explode(',', $code_params['button_labels']);

        // set it as optional
        $location_param = $code_params['location'] !== null ? "location: '{$code_params['location']}'," : '';
        $service_param = $code_params['service'] !== null ? "service: '{$code_params['service']}'," : '';
        $worker_param = $code_params['worker'] !== null ? "worker: '{$code_params['worker']}'," : '';

        $display_end_time = $code_params['display_event_end'] ? 'true' : 'false';

        $event_click_link = '';

        // event link
        if (!empty($this->options->get_option_value('fullcalendar.event.show'))) {
            $event_click_link = <<<EOT
        element.addClass('thickbox');
        element.addClass('ea-full-calendar-dialog-event');
        element.attr('href', wpApiSettings.root + 'easy-appointments/v1/appointment/' + event.id + '?hash=' + event.hash + '&_wpnonce=' + wpApiSettings.nonce + '&width=100%&height=100%');
        element.attr('title', '#' + event.id + ' - ' + event.title);
EOT;
        }

        $column_header_format = '';

        if ($code_params['column_header_format'] !== null) {
            $column_header_format = "columnHeaderFormat: '{$code_params['column_header_format']}',";
        }

        $script = <<<EOT
  jQuery(document).ready(function() {
  
    jQuery('#ea-calendar-color-map-{$id}').find('.status').hover(
        function(event) {
            var el = jQuery(event.target);
            var classSelector = '.' + el.data('class');
            jQuery('#ea-full-calendar-{$id}').find('.fc-event:not(' + classSelector + ')').animate({ opacity: 1/2 }, 200);
        },
    function(event){
        jQuery('#ea-full-calendar-{$id}').find('.fc-event').animate({ opacity: 1 }, 100);
    });

    jQuery('#ea-full-calendar-{$id}').fullCalendar({
      header: {
        left: 'prev,next today',
        center: 'title',
        right: '{$code_params['views']}'
      },
      dayNamesShort: {$day_names_short},
      dayNames: {$day_names},
      monthNamesShort: {$month_names_short},
      monthNames: {$month_names},
      buttonText: {
        today: '{$button_labels[0]}',
        month: '{$button_labels[1]}',
        week:  '{$button_labels[2]}',
        day:   '{$button_labels[3]}',
        list:  '{$button_labels[4]}'
      },
      views: {
        month: {
          titleFormat: '{$code_params['month_header_format']}',
        },
        week: {
          titleFormat: '{$code_params['week_header_format']}',
        },
        day: {
          titleFormat: '{$code_params['day_header_format']}',
        }
      },
      isRTL: {$is_rtl},
      defaultView: '{$code_params['default_view']}',
      showNonCurrentDates: false,
      timeFormat: '{$code_params['time_format']}',
      {$column_header_format}
      displayEventEnd: {$display_end_time},
      weekNumbers: {$show_week_numbers},
      firstDay: {$code_params['start_of_week']},
      defaultDate: '{$code_params['default_date']}',
      navLinks: true, // can click day/week names to navigate views
      editable: false,
      eventLimit: true, // allow "more" link when too many events
      events: {
        url: wpApiSettings.root + 'easy-appointments/v1/appointments',
        type: 'GET',
        data: {
          _wpnonce: wpApiSettings.nonce, 
          {$location_param}
          {$service_param}
          {$worker_param}
          title_field: '{$code_params['title_field']}',
        },
        error: function() {
          alert('there was an error while fetching events!');
        },
        textColor: 'white' // a non-ajax option
      },
      eventClick: function(calEvent, jsEvent, view) {
        // console.log(calEvent, jsEvent, view);
      },
      eventRender: function(event, element) {
        var statusMapping = {
          canceled: 'graffit',
          confirmed: 'darkgreen',
          pending: 'grape',
          reserved: 'darkblue'
        }
 
        element.addClass(statusMapping[event.status]);
        {$event_click_link}
      }
    });
  });
EOT;

        wp_add_inline_script( 'ea-full-calendar', $script);

        $statuses = $this->logic->getStatus();
        $status_label = __('Status', 'easy-appointments');

        // html and status legend
        $html = <<<EOT
<div id="ea-full-calendar-{$id}"></div>
<div class="fc">
    <div id="ea-calendar-color-map-{$id}" class="ea-calendar-color-map fc-view-container">
        <div>{$status_label}</div>
        <div data-class="grape" class="fc-event status grape">{$statuses['pending']}</div>
        <div data-class="darkgreen" class="fc-event status darkgreen">{$statuses['confirmed']}</div>
        <div data-class="darkblue" class="fc-event status darkblue">{$statuses['reservation']}</div>
        <div data-class="graffit" class="fc-event status graffit">{$statuses['canceled']}</div>
    </div>
</div>
EOT;

        return $html;
    }

    /**
     * Formatting JS values for Calendar
     *
     * @param $arrayString
     * @return string
     */
    protected function convert_csv_to_js_array_of_strings($arrayString)
    {
        $raw_array = explode(',', $arrayString);

        $wrapped_array = array_map(function($element) {
            return "'{$element}'";
        }, $raw_array);

        return '[' . implode(',', $wrapped_array) . ']';
    }
}