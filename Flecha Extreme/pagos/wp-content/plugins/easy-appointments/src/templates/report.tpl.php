<script type="text/template" id="ea-report-main">
    <div class="report-container">
        <div id="tab-header" style="padding-top: 20px; padding-bottom: 20px">
            <div class="report-items">
                <div class="report-item time-table report-card" data-report="overview">
                    <i class="icon icon-timetable"></i>
                    <span class="rep-title"><?php _e('Time table', 'easy-appointments'); ?></span>
                    <span class="rep-description"><?php _e('Have Calendar overview of all bookings and free slots. ','easy-appointments'); ?></span>
                </div>
                <div class="report-item money" style="display: none;">
                    <i class="icon icon-money-2"></i>
                    <span class="rep-title"><?php _e('Money', 'easy-appointments'); ?></span>
                    <span class="rep-description">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sed est id ipsum elementum dapibus.</span>
                </div>
                <div class="report-item export report-card" data-report="excel">
                    <i class="icon icon-export"></i>
                    <span class="rep-title"><?php _e('Export', 'easy-appointments'); ?></span>
                    <span class="rep-description"><?php _e('Export data in Excel CSV format for selected time period.', 'easy-appointments'); ?></span>
                </div>
            </div>
            <div class="back-section" style="display: none;">
                <button class="button-primary go-back" style="padding-left: 10px"><span style="padding-top: 4px;" class="dashicons dashicons-arrow-left-alt2"></span> <?php _e('Back to Reports', 'easy-appointments'); ?></button>
            </div>
        </div>
        <div id="report-content" class="report-content">
        </div>
    </div>
</script>

<!-- template for overview report -->
<script type="text/template" id="ea-report-overview">
    <div class="filter-select">
        <div>
            <div class="form-item">
                <label htmlFor=""><?php _e('Location', 'easy-appointments'); ?> :</label>
                <select name="location" id="overview-location" class="field">
                    <option value="">-</option>
                    <% _.each(cache.Locations,function(item,key,list){ %>
                    <option value="<%= item.id %>"><%= item.name %></option>
                    <% });%>
                </select>
            </div>
            <div class="form-item">
                <label htmlFor=""><?php _e('Service', 'easy-appointments'); ?> :</label>
                <select name="service" id="overview-service" class="field">
                    <option value="">-</option>
                    <% _.each(cache.Services,function(item,key,list){ %>
                    <option value="<%= item.id %>"><%= item.name %></option>
                    <% });%>
                </select>
            </div>
            <div class="form-item">
                <label htmlFor=""><?php _e('Worker', 'easy-appointments'); ?> :</label>
                <select name="worker" id="overview-worker" class="field">
                    <option value="">-</option>
                    <% _.each(cache.Workers,function(item,key,list){ %>
                    <option value="<%= item.id %>"><%= item.name %></option>
                    <% });%>
                </select>
            </div>
            <span>&nbsp&nbsp;</span>
            <button class="refresh button-primary"><?php _e('Refresh', 'easy-appointments'); ?></button>
            <br><br>
        </div>
    </div>
    <div name="month" class="datepicker overview-month" id="overview-month" />
    <br>
    <div id="overview-data" class="overview-data"></div>
</script>

<!-- Template for export report -->
<script type="text/template" id="ea-report-excel">
    <div>
        <div class="custom-cols-block">
            <div class="form-item">
                <label for=""><?php _e('Fields', 'easy-appointments'); ?></label>
                <div class="field">
                    <a id="ea-export-customize-columns-toggle" href="#"><?php _e('Click to customize columns for export', 'easy-appointments'); ?></a>
                    <div id="ea-export-customize-columns" style="display: none;">
                        <p>Columns: <b><?php echo implode(', ', $this->models->get_all_tags_for_template()); ?></b></p>
                        <?php _e('Place fields separate by , for example: id,name,email', 'easy-appointments'); ?>
                        <p><input id="ea-export-custom-columns" type="text" style="" value="<?php echo get_option('ea_excel_columns', ''); ?>"/></p>
                        <button id="ea-export-save-custom-columns" class="btn button-primary"><?php _e('Save settings', 'easy-appointments'); ?></button>
                    </div>
                </div>
            </div>
        </div>
        <form id="ea-export-form" class="ea-export-form" action="<%= export_link %>" method="get">
            <input type="hidden" name="action" value="ea_export">
            <div class="form-item">
                <label for=""><?php _e('From', 'easy-appointments'); ?></label>
                <input class="ea-datepicker field" type="text" name="ea-export-from" autocomplete="off">
            </div>
            <div class="form-item">
                <label for=""><?php _e('To', 'easy-appointments'); ?></label>
                <input class="ea-datepicker field" type="text" name="ea-export-to" autocomplete="off">
            </div>
            <p><?php _e('Export data to CSV, can be imported to MS Excel, OpenOffice Calc... ', 'easy-appointments'); ?></p>
            <button class="eadownloadcsv button-primary"><?php _e('Export data', 'easy-appointments'); ?></button>
        </form>
    </div>
</script>