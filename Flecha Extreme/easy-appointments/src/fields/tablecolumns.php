<?php

class EATableColumns
{
    public function __construct()
    {
    }

    /**
     * @param string $table_name
     * @return array
     */
    public function get_columns($table_name) {

        $columns = array(
            'ea_appointments' => array(
                'id',
                'location',
                'service',
                'worker',
                'name',
                'email',
                'phone',
                'date',
                'start',
                'end',
                'end_date',
                'description',
                'status',
                'user',
                'created',
                'price',
                'ip',
                'session'
            ),
            'ea_connections' => array(
                'id',
                'group_id',
                'location',
                'service',
                'worker',
                'slot_count',
                'day_of_week',
                'time_from',
                'time_to',
                'day_from',
                'day_to',
                'is_working'
            ),
            'ea_meta_fields' => array(
                'id',
                'type',
                'slug',
                'label',
                'mixed',
                'default_value',
                'visible',
                'required',
                'validation',
                'position'
            ),
            'ea_locations' => array(
                'id',
                'name',
                'address',
                'location',
                'cord'
            ),
            'ea_services' => array(
                'id',
                'name',
                'duration',
                'slot_step',
                'block_before',
                'block_after',
                'price'
            ),
            'ea_options' => array(
                'id',
                'ea_key',
                'ea_value',
                'type'
            ),
            'ea_staff' => array(
                'id',
                'name',
                'description',
                'email',
                'phone'
            ),
            'ea_fields' => array()
        );


        return $columns[$table_name];
    }

    public function validate_next_step($next) {
        $options = array(
            'location',
            'service',
            'worker',
            'stuff',
        );

        if (in_array($next, $options)) {
            return $next;
        }

        return $options[0];
    }

    /**
     * @param string $table_name
     * @param array $params
     */
    public function clear_data($table_name, &$params) {
        $columns = $this->get_columns($table_name);

        if (empty($columns)) {
            return;
        }

        foreach ($params as $key => $param) {
            if (!in_array($key, $columns)) {
                unset($params[$key]);
            }
        }
    }

    public static function clear_settings_data_frontend($ea_settings) {
        $white_list = array(
            'MetaFields',
            'advance.redirect',
            'block.time',
            'block_days',
            'block_days_tooltip',
            'cal_auto_select',
            'cancel.scroll',
            'captcha.site-key',
            'check',
            'compatibility.mode',
            'css.off',
            'currency.before',
            'date_format',
            'datepicker',
            'default_date',
            'default_datetime_format',
            'form.label.above',
            'gdpr.label',
            'gdpr.link',
            'gdpr.message',
            'gdpr.on',
            'layout_cols',
            'max.appointments',
            'max_date',
            'min_date',
            'order.locations-by',
            'order.services-by',
            'order.workers-by',
            'pre.reservation',
            'price.hide',
            'price.hide.service',
            'rtl',
            'save_form_content',
            'scroll_off',
            'show.iagree',
            'show_remaining_slots',
            'show_week',
            'sort.locations-by',
            'sort.services-by',
            'sort.workers-by',
            'start_of_week',
            'submit.redirect',
            'time_format',
            'trans.ajax-call-not-available',
            'trans.booking-overview',
            'trans.cancel',
            'trans.comment',
            'trans.currency',
            'trans.date-time',
            'trans.done_message',
            'trans.email',
            'trans.error-email',
            'trans.error-name',
            'trans.error-phone',
            'trans.field-iagree',
            'trans.field-required',
            'trans.fields',
            'trans.iagree',
            'trans.internal-error',
            'trans.location',
            'trans.name',
            'trans.nonce-expired',
            'trans.overview-message',
            'trans.personal-informations',
            'trans.phone',
            'trans.please-select-new-date',
            'trans.price',
            'trans.service',
            'trans.slot-not-selectable',
            'trans.submit',
            'trans.worker',
            'width',
            'form.label.above',
            'form_class',
        );

        foreach ($ea_settings as $key => $value) {
            if (!in_array($key, $white_list)) {
                unset($ea_settings[$key]);
            }
        }

        return $ea_settings;
    }
}