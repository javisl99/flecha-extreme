<script type="text/template" id="ea-settings-main">
<?php 
	get_current_screen()->render_screen_meta();
?>
	<div class="wrap">
		<ul id="tab-header">
			<li>
				<a href="#connection/">
					<i class="icon-connections"></i>
					<?php _e('Connections', 'easy-appointments');?>
				</a>
			</li>
			<li>
				<a href="#custumize/">
					<i class="icon-customize"></i>
					<?php _e('Customize', 'easy-appointments');?>
				</a>
			</li>
			<li>
				<a href="#tools/">
					<i class="icon-tools" aria-hidden="true"></i>
					<?php _e('Tools', 'easy-appointments');?>
				</a>
			</li>
		</ul>
		<div id="tab-content">
		</div>
	</div>
</script>

<!-- Connections -->
<script type="text/template" id="ea-tpl-connections-table">
<div>
	<h2>
		<a href="#" class="add-new-h2 add-new">
			<i class="fa fa-plus"></i>
			<?php _e('Add New Connection', 'easy-appointments'); ?>
		</a>
		<a href="#" class="add-new-h2 add-new-bulk">
			<i class="fa fa-plus"></i>
			<?php _e('Bulk Add New Connections', 'easy-appointments'); ?>
		</a>
		<a href="#" class="add-new-h2 refresh-list">
			<i class="fa fa-refresh"></i>
			<?php _e('Refresh', 'easy-appointments'); ?>
		</a>
		<span id="status-msg" class="status"></span>
	</h2>
	<table class="wp-list-table widefat fixed">
		<thead>
		<tr>
			<th colspan="4" class="manage-column column-title">Id / <?php _e('Location', 'easy-appointments'); ?>
				/ <?php _e('Service', 'easy-appointments'); ?> / <?php _e('Worker', 'easy-appointments'); ?></th>
			<th colspan="2" class="manage-column column-title"><?php _e('Days of week', 'easy-appointments'); ?></th>
			<th colspan="2" class="manage-column column-title">
				<?php _e('Time', 'easy-appointments'); ?>
			</th>
			<th colspan="2" class="manage-column column-title">
				<?php _e('Date', 'easy-appointments'); ?>
			</th>
			<th class="manage-column column-title"><?php _e('Is working', 'easy-appointments'); ?></th>
			<th class="manage-column column-title column-15"><?php _e('Actions', 'easy-appointments'); ?></th>
		</tr>
		</thead>
		<tbody id="ea-connections">

		</tbody>
	</table>
	<div id="bulk-connections-builder" style="display: none;">
		<div id="bulk-connections-builder-content" style="width: 100%;"></div>
	</div>
</div>
</script>

<script type="text/template" id="ea-tpl-connection-row">
	<td colspan="4" class="table-row-td">
		#<%= row.id %>
		<br>
		<p> 
			<strong>
				<%= (row.location == 0) ? '-' : _.escape( _.findWhereSafe(locations, row.location, 'name' )) %>
			</strong>
		</p>
		<p>
			<strong>
				<%= (row.service == 0) ? '-' : _.escape( _.findWhereSafe(services, row.service, 'name' )) %>
			</strong>
		</p>
		<p>
			<strong>
				<%= (row.worker == 0) ? '-' : _.escape( _.findWhereSafe(workers, row.worker, 'name' )) %>
			</strong>
		</p>
        <p>
            <strong><?php _e('Number of slots','easy-appointments');?>: <%= row.slot_count %></strong>
        </p>
	</td>
	<% var weekdays = {
			"Monday" : "<?php _e('Monday','easy-appointments');?>",
			"Tuesday": "<?php _e('Tuesday','easy-appointments');?>",
			"Wednesday": "<?php _e('Wednesday','easy-appointments');?>",
			"Thursday": "<?php _e('Thursday','easy-appointments');?>",
			"Friday": "<?php _e('Friday','easy-appointments');?>",
			"Saturday": "<?php _e('Saturday','easy-appointments');?>",
			"Sunday": "<?php _e('Sunday','easy-appointments');?>"
		}; %>
	<td colspan="2">
		<% _.each(row.day_of_week, function(item,key,list) { %>
		<span><%= weekdays[item] %></span><br>
		<% }); %>
	</td>
	<td colspan="2">
		<p class="label-up"><?php _e('Starts at','easy-appointments');?> :</p>
		<strong><%= row.time_from %></strong><br>
		<p class="label-up"><?php _e('ends at','easy-appointments');?> :</p>
		<strong><%= row.time_to %></strong>
	</td>
	<td colspan="2">
		<p class="label-up"><?php _e('Active from','easy-appointments');?> :</p>
		<strong><%= row.day_from %></strong><br>
		<p class="label-up"><?php _e('to','easy-appointments');?> :</p>
		<strong><%= row.day_to %></strong>
	</td>
	<td>
		<strong>
			<% if(row.is_working == 0) { %>
				<?php _e('No','easy-appointments');?>
			<% } else { %>
				<?php _e('Yes','easy-appointments');?>
			<% } %>
		</strong>
	</td>
	<td class="action-center">
		<button class="button btn-edit"><?php _e('Edit','easy-appointments');?></button><br>
		<button class="button btn-del"><?php _e('Delete','easy-appointments');?></button><br>
		<button class="button btn-clone"><?php _e('Clone','easy-appointments');?></button><br>
	</td>
</script>

<script type="text/template" id="ea-tpl-connection-row-edit">
	<td colspan="4">
		#<%= row.id %><br>
		<select data-prop="location">
			<option value=""> -- <?php _e('Location','easy-appointments');?> -- </option>
	<% _.each(locations,function(item,key,list){
		if(item.id == row.location) { %>
			<option value="<%= item.id %>" selected="selected"><%= _.escape( item.name ) %></option>
	<% } else { %>
			<option value="<%= item.id %>"><%= _.escape( item.name ) %></option>
	<% }
		});%>
		</select>
		<br>
		<select data-prop="service">
			<option value=""> -- <?php _e('Service','easy-appointments');?> -- </option>
	<% _.each(services,function(item,key,list){
		// create variables
		if(item.id == row.service) { %>
			<option value="<%= item.id %>" selected="selected"><%= _.escape( item.name ) %></option>
	<% } else { %>
			<option value="<%= item.id %>"><%= _.escape( item.name ) %></option>
	<% }
		});%>
		</select>
		<br>
		<select data-prop="worker">
			<option value=""> -- <?php _e('Worker','easy-appointments');?> -- </option>
	<% _.each(workers,function(item,key,list){
		  // create variables
		if(item.id == row.worker) { %>
			<option value="<%= item.id %>" selected="selected"><%= _.escape( item.name ) %></option>
	 <% } else { %>
			<option value="<%= item.id %>"><%= _.escape( item.name ) %></option>
	 <% }
		});%>
		</select>
        <br>
        <?php _e('Number of slots','easy-appointments');?>: <input type="number" data-prop="slot_count" min="1" class="slot-count" value="<%= row.slot_count %>">
	</td>
	<td colspan="2">
		<select data-prop="day_of_week" size="7" multiple>
	<% var weekdays = [
			{ id: "Monday", value: "Monday", name: "<?php _e('Monday','easy-appointments');?>"},
			{ id: "Tuesday", value: "Tuesday", name: "<?php _e('Tuesday','easy-appointments');?>"},
			{ id: "Wednesday", value: "Wednesday", name: "<?php _e('Wednesday','easy-appointments');?>"},
			{ id: "Thursday", value: "Thursday", name: "<?php _e('Thursday','easy-appointments');?>"},
			{ id: "Friday", value: "Friday", name: "<?php _e('Friday','easy-appointments');?>"},
			{ id: "Saturday", value: "Saturday", name: "<?php _e('Saturday','easy-appointments');?>"},
			{ id: "Sunday", value: "Sunday", name: "<?php _e('Sunday','easy-appointments');?>"}
		];
	  _.each(weekdays,function(item,key,list){
		// create variables
		if(_.indexOf(row.day_of_week, item.value) !== -1) { %>
			<option value="<%= item.value %>" selected="selected"><%= _.escape( item.name ) %></option>
	 <% } else { %>
			<option value="<%= item.value %>"><%= _.escape( item.name ) %></option>
	 <% }
	 });%>
		</select>
	</td>
	<td colspan="2">
		<strong><?php _e('Start', 'easy-appointments');?> :</strong><br>
		<input type="text" data-prop="time_from" class="time-from" value="<%= row.time_from %>"><br>
		<strong><?php _e('End', 'easy-appointments');?> :</strong><br>
		<input type="text" data-prop="time_to" class="time-to" value="<%= row.time_to %>">
	</td>
	<td colspan="2">
		<strong>&nbsp;</strong><br>
		<input type="text" data-prop="day_from" class="day-from" value="<%= row.day_from %>"><br>
		<strong>&nbsp;</strong><br>
		<input type="text" data-prop="day_to" class="day-to" value="<%= row.day_to %>">
	</td>
	<td>
		<select data-prop="is_working" name="">
			<% if(row.is_working == 0) { %>
			<option value="0" selected="selected"><?php _e('No', 'easy-appointments');?></option>
			<option value="1"><?php _e('Yes', 'easy-appointments');?></option>
			<% } else { %>
			<option value="0"><?php _e('No', 'easy-appointments');?></option>
			<option value="1" selected="selected"><?php _e('Yes', 'easy-appointments');?></option>
			<% } %>
		</select>
	</td>
	<td class="action-center">
		<button class="button button-primary btn-save"><?php _e('Save', 'easy-appointments');?></button>
		<button class="button btn-cancel"><?php _e('Cancel', 'easy-appointments');?></button>
	</td>
</script>

<script type="text/template" id="ea-tpl-connection-bulk">
	<div style="min-height: 380px; max-height: 380px;">
		<div class="step-1">
			<p class="bulk-text"><?php _e('Split groups', 'easy-appointments');?> <small>( <?php _e('each combination will be one connection', 'easy-appointments');?> )</small></p>
			<div class="bulk-row">
				<div class="bulk-field" style="width: 33%;">
					<label><?php _e('Locations','easy-appointments');?> :</label>
					<select data-prop="location" class="chosen-select" multiple>
						<% _.each(locations,function(item,key,list){ %>
						<option value="<%= item.id %>"><%= _.escape( item.name ) %></option>
						<% });%>
					</select>
				</div>
				<div class="bulk-field" style="width: 33%;">
					<label><?php _e('Services','easy-appointments');?> :</label>
					<select data-prop="service" class="chosen-select" multiple>
						<% _.each(services,function(item,key,list){ %>
						<option value="<%= item.id %>"><%= _.escape( item.name ) %></option>
						<% });%>
					</select>
				</div>
				<div class="bulk-field" style="width: 33%;">
					<label><?php _e('Workers','easy-appointments');?> :</label>
					<select data-prop="worker" class="chosen-select" multiple>
						<% _.each(workers,function(item,key,list){ %>
						<option value="<%= item.id %>"><%= _.escape( item.name ) %></option>
						<% });%>
					</select>
				</div>
			</div>
			<hr class="divider" />
			<p class="bulk-text"><?php _e('Shared values', 'easy-appointments');?> <small>( <?php _e('same for each combination', 'easy-appointments');?> )</small></p>
			<div class="bulk-row">
				<div class="bulk-field" style="width: 70%;">
					<label><?php _e('Days of week','easy-appointments');?></label>
					<select data-prop="day_of_week" size="7" multiple class="chosen-select">
						<% var weekdays = [
						{ id: "Monday", value: "Monday", name: "<?php _e('Monday','easy-appointments');?>"},
						{ id: "Tuesday", value: "Tuesday", name: "<?php _e('Tuesday','easy-appointments');?>"},
						{ id: "Wednesday", value: "Wednesday", name: "<?php _e('Wednesday','easy-appointments');?>"},
						{ id: "Thursday", value: "Thursday", name: "<?php _e('Thursday','easy-appointments');?>"},
						{ id: "Friday", value: "Friday", name: "<?php _e('Friday','easy-appointments');?>"},
						{ id: "Saturday", value: "Saturday", name: "<?php _e('Saturday','easy-appointments');?>"},
						{ id: "Sunday", value: "Sunday", name: "<?php _e('Sunday','easy-appointments');?>"}
						];
						_.each(weekdays,function(item,key,list){ %>
						<option value="<%= item.value %>"><%= _.escape( item.name ) %></option>
						<% });%>
					</select>
				</div>
				<div style="display: inline-flex; width: 30%;">
					<div class="bulk-field">
						<label><?php _e('Time from', 'easy-appointments');?> :</label>
						<input type="text" data-prop="time_from" class="time-from" value="<%= row.time_from %>"><br>

					</div>
					<div class="bulk-field">
						<label><?php _e('to', 'easy-appointments');?> :</label>
						<input type="text" data-prop="time_to" class="time-to" value="<%= row.time_to %>">
					</div>
				</div>
			</div>
			<div class="bulk-row">
				<div class="bulk-field" style="width: 15%;">
					<label><?php _e('Active from date', 'easy-appointments');?> :</label>
					<input type="text" data-prop="day_from" class="day-from" value="<%= row.day_from %>"><br>
				</div>
				<div class="bulk-field" style="width: 15%;">
					<label><?php _e('to date', 'easy-appointments');?> :</label>
					<input type="text" data-prop="day_to" class="day-to" value="<%= row.day_to %>">
				</div>
				<div class="bulk-field" style="width: 15%;">
					<label for=""><?php _e('Is Working', 'easy-appointments');?> :</label>
					<select data-prop="is_working" name="is_working">
						<% if(row.is_working == 0) { %>
						<option value="0" selected="selected"><?php _e('No', 'easy-appointments');?></option>
						<option value="1"><?php _e('Yes', 'easy-appointments');?></option>
						<% } else { %>
						<option value="0"><?php _e('No', 'easy-appointments');?></option>
						<option value="1" selected="selected"><?php _e('Yes', 'easy-appointments');?></option>
						<% } %>
					</select>
				</div>
			</div>
		</div>
		<div class="step-2" style="display: none; min-height: 380px; max-height: 380px; overflow-y: scroll;">
			<ul id="bulk-connections"></ul>
		</div>
	</div>
	<div class="bulk-footer">
		<button id="bulk-next" class="button-primary">Next</button>
		<button id="bulk-save" class="button-primary" disabled>Save connections ( <span id="bulk-connection-count">0</span> )</button>
	</div>
</script>

<script type="text/template" id="ea-tpl-single-bulk-connection">
    <li>
        <span class="bulk-value"><%= _.escape( _.findWhere(locations, {id:row.location}).name ) %></span>
        <span class="bulk-value"><%= _.escape( _.findWhere(services,  {id:row.service}).name ) %></span>
        <span class="bulk-value"><%= _.escape( _.findWhere(workers,   {id:row.worker}).name ) %></span>
        <span style="display: inline-block;"><button class="button bulk-connection-remove">Remove</button></span>
    </li>
</script>


<!--Customize -->
<script type="text/template" id="ea-tpl-custumize">
    <div class="wp-filter">
        <div class="custom-tab-view">
            <!-- TAB SECTION -->
            <div class="tab-selection">
                <div class="tabs-list">
                    <a data-tab="tab-connections" class="selected" href="#">
                        <span class="icon icon-general"></span><span class="text-label"><?php _e('General', 'easy-appointments'); ?></span>
                    </a>
                    <a data-tab="tab-mail" href="#">
                        <span class="icon icon-mail"></span><span class="text-label"><?php _e('Mail Notifications', 'easy-appointments'); ?></span>
                    </a>
                    <a data-tab="tab-full-calendar" href="#">
                      <span class="icon icon-fullcalendar"></span><span class="text-label"><?php _e('FullCalendar Shortcode', 'easy-appointments'); ?></span>
                    </a>
                    <a data-tab="tab-labels" href="#">
                        <span class="icon icon-label"></span><span class="text-label"><?php _e('Labels', 'easy-appointments'); ?></span>
                    </a>
                    <a data-tab="tab-date-time" href="#">
                        <span class="icon icon-datetime"></span><span class="text-label"><?php _e('Date & Time', 'easy-appointments'); ?></span>
                    </a>
                    <a data-tab="tab-fields" href="#">
                        <span class="icon icon-fields"></span><span class="text-label"><?php _e('Custom Form Fields', 'easy-appointments'); ?></span>
                    </a>
                    <a data-tab="tab-captcha" href="#">
                        <span class="icon icon-recaptcha"></span><span class="text-label"><?php _e('Google reCAPTCHA v2', 'easy-appointments'); ?></span>
                    </a>
                    <a data-tab="tab-form" href="#">
                        <span class="icon icon-redirect"></span><span class="text-label"><?php _e('Form Style & Redirect', 'easy-appointments'); ?></span>
                    </a>
                    <a data-tab="tab-gdpr" href="#">
                        <span class="icon icon-gdpr"></span><span class="text-label"><?php _e('GDPR', 'easy-appointments'); ?></span>
                    </a>
                    <a data-tab="tab-money" href="#">
                        <span class="icon icon-money"></span><span class="text-label"><?php _e('Money Format', 'easy-appointments'); ?></span>
                    </a>
                </div>
                <div class="button-wrap">
                    <button class="button button-primary btn-save-settings"><?php _e('Save', 'easy-appointments'); ?></button>
                </div>
            </div>

            <div id="tab-connections" class="form-section">
                <span class="separator vertical"></span>
                <div class="form-container" id="customize-general">
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Multiple work', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Mark this option if you want to calculate free worker slots only by current service and location. If it\'s not marked system will check if worker is working on any location and service at current time.', 'easy-appointments'); ?>"></span>
                        </div>
                        <div class="field-wrap">
                            <input class="field" data-key="multiple.work" name="multiple.work"
                                   type="checkbox" <% if (_.findWhere(settings,
                            {ea_key:'multiple.work'}).ea_value == "1") { %>checked<% } %>>
                        </div>
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Compatibility mode', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('If you can\'t EDIT or DELETE conecntion or any other settings, you should mark this option. NOTE: After saving this options you must refresh page!', 'easy-appointments'); ?>"></span>
                        </div>
                        <div class="field-wrap">
                            <input class="field" data-key="compatibility.mode"
                                   name="compatibility.mode" type="checkbox" <% if
                            (_.findWhere(settings, {ea_key:'compatibility.mode'}).ea_value == "1") {
                            %>checked<% } %>>
                        </div>
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Max number of appointments', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Number of appointments that one visitor can make reservation before limit alert is shown. Appointments are counted during one day.', 'easy-appointments'); ?>"></span>
                        </div>
                        <input class="field" data-key="max.appointments" name="max.appointments"
                               type="text"
                               value="<%= _.findWhere(settings, {ea_key:'max.appointments'}).ea_value %>">
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label><?php _e('Auto reservation', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Make reservation at moment user select date and time!', 'easy-appointments'); ?>"></span>
                        </div>
                        <div class="field-wrap">
                            <input class="field" data-key="pre.reservation" name="pre.reservation"
                                   type="checkbox" <% if (_.findWhere(settings,
                            {ea_key:'pre.reservation'}).ea_value == "1") { %>checked<% } %>>
                        </div>
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Turn nonce off', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('if you have issues with validation code that is expired in form you can turn off nonce but you are doing that on your own risk.', 'easy-appointments'); ?>"></span>
                        </div>
                        <div class="field-wrap">
                            <input class="field" data-key="nonce.off" name="nonce.off"
                                   type="checkbox" <% if (_.findWhere(settings,
                            {ea_key:'nonce.off'}).ea_value == "1") { %>checked<% } %>>
                        </div>
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Default status', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Default status of Appointment made by visitor.', 'easy-appointments'); ?>"></span>
                        </div>
                        <select id="ea-select-status" class="field" name="ea-select-status" data-key="default.status">
                            <option value="pending"
                            <% if (_.findWhere(settings, {ea_key:'default.status'}).ea_value ==
                            "pending") {
                            %>selected="selected"<% } %>><%= eaData.Status.pending %></option>
                            <option value="confirmed"
                            <% if (_.findWhere(settings, {ea_key:'default.status'}).ea_value ==
                            "confirmed") {
                            %>selected="selected"<% } %>><%= eaData.Status.confirmed %></option>
                            <option value="reservation"
                            <% if (_.findWhere(settings, {ea_key:'default.status'}).ea_value ==
                            "reservation") {
                            %>selected="selected"<% } %>><%= eaData.Status.reservation %></option>
                        </select>
                        <div id="ea-select-status-notification" style="display: none"><?php _e('Reservation status is short term, if you don\'t change it within 5 minutes it will be set to cancelled' , 'easy-appointments');?></div>
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Compress shortcode output (removes new lines from templates).', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('WordPress can add auto paragraph html element for each line break. This option prevents WP from doing that on EA shortcode.', 'easy-appointments'); ?>"></span>
                        </div>
                        <div class="field-wrap">
                            <input class="field" data-key="shortcode.compress"
                                   name="shortcode.compress" type="checkbox" <% if
                            (_.findWhere(settings, {ea_key:'shortcode.compress'}).ea_value == "1") {
                            %>checked<% } %>>
                        </div>
                    </div>
                </div>
            </div>

            <div id="tab-mail" class="form-section hidden">
                <span class="separator vertical"></span>
                <div class="form-container">
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Notifications', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('You can use this tags inside email content. Just place for example #id# inside mail template and that value will be replaced with value.', 'easy-appointments'); ?>"></span>
                        </div>
                        <table class='notifications form-table'>
                            <tbody>
                            <tr>
                                <td colspan="2">
                                    <p>
                                        <a class="mail-tab selected"
                                           data-textarea="#mail-pending"><?php _e('Pending', 'easy-appointments'); ?></a>
                                        <a class="mail-tab"
                                           data-textarea="#mail-reservation"><?php _e('Reservation', 'easy-appointments'); ?></a>
                                        <a class="mail-tab"
                                           data-textarea="#mail-canceled"><?php _e('Cancelled', 'easy-appointments'); ?></a>
                                        <a class="mail-tab"
                                           data-textarea="#mail-confirmed"><?php _e('Confirmed', 'easy-appointments'); ?></a>
                                        <a class="mail-tab"
                                           data-textarea="#mail-admin"><?php _e('Admin', 'easy-appointments'); ?></a>
                                    </p>
                                    <textarea id="mail-template" style="height: 150px;"
                                              name="mail-template"><%= _.findWhere(settings, {ea_key:'mail.pending'}).ea_value %></textarea>
                                </td>
                            </tr>
                            <tr style="display:none;">
                                <td>
                                    <textarea id="mail-pending" class="field"
                                              data-key="mail.pending"><%= _.findWhere(settings, {ea_key:'mail.pending'}).ea_value %></textarea>
                                </td>
                                <td>
                                    <textarea id="mail-reservation" class="field"
                                              data-key="mail.reservation"><%= _.findWhere(settings, {ea_key:'mail.reservation'}).ea_value %></textarea>
                                </td>
                            </tr>
                            <tr style="display:none;">
                                <td>
                                    <textarea id="mail-canceled" class="field"
                                              data-key="mail.canceled"><%= _.findWhere(settings, {ea_key:'mail.canceled'}).ea_value %></textarea>
                                </td>
                                <td>
                                    <textarea id="mail-confirmed" class="field"
                                              data-key="mail.confirmed"><%= _.findWhere(settings, {ea_key:'mail.confirmed'}).ea_value %></textarea>
                                </td>
                            </tr>
                            <tr style="display:none;">
                                <td colspan="2">
                                    <textarea id="mail-admin" class="field" data-key="mail.admin"><%= (_.findWhere(settings, {ea_key:'mail.admin'}) != null) ? _.findWhere(settings, {ea_key:'mail.admin'}).ea_value: '' %></textarea>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                        <div><small><?php _e('Available tags', 'easy-appointments'); ?>: #id#, #date#, #start#, #end#, #status#, #created#, #price#, #ip#, #link_confirm#, #link_cancel#, #url_confirm#, #url_cancel#, #service_name#, #service_duration#, #service_price#, #worker_name#, #worker_email#, #worker_phone#, #location_name#, #location_address#, #location_location#, <?php echo implode(', ', EADBModels::get_custom_fields_tags()); ?></small></div>
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for="mail.action.two_step"><?php _e('Two step action links in email', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Sometimes Mail servers can open links from email for inspection. That will trigger actions such as #link_confirm#, #link_cancel#. Mark this option if you want to have additional prompt for user action via links.', 'easy-appointments'); ?>"></span>
                        </div>
                        <div class="field-wrap">
                            <input class="field" data-key="mail.action.two_step" name="mail.action.two_step"
                                   type="checkbox" <% if (_.findWhere(settings,
                            {ea_key:'mail.action.two_step'}).ea_value == "1") { %>checked<% } %>>
                        </div>
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Pending notification emails', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Enter email adress that will receive new reservation notification. Separate multiple emails with , (comma)', 'easy-appointments'); ?>"></span>
                        </div>
                        <input class="field" data-key="pending.email" name="pending.email"
                               type="text"
                               value="<%= _.findWhere(settings, {ea_key:'pending.email'}).ea_value %>">
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Admin notification subject', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('You can use any tag that is available as in custom email notifications.', 'easy-appointments'); ?>"></span>
                        </div>
                        <input class="field" data-key="pending.subject.email"
                               name="pending.subject.email" type="text"
                               value="<%- _.findWhere(settings, {ea_key:'pending.subject.email'}).ea_value %>">
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Visitor notification subject', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('You can use any tag that is available as in custom email notifications.', 'easy-appointments'); ?>"></span>
                        </div>
                        <input class="field" data-key="pending.subject.visitor.email"
                               name="pending.subject.visitor.email" type="text"
                               value="<%- _.findWhere(settings, {ea_key:'pending.subject.visitor.email'}).ea_value %>">
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for="send.worker.email"><?php _e('Send email to worker', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Mark this option if you want to employee receive admin email after filing the form.', 'easy-appointments'); ?>"></span>
                        </div>
                        <div class="field-wrap">
                            <input class="field" data-key="send.worker.email"
                                   name="send.worker.email" type="checkbox" <% if
                            (_.findWhere(settings, {ea_key:'send.worker.email'}).ea_value == "1") {
                            %>checked<% } %>>
                        </div>
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for="send.user.email"><?php _e('Send email to user', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Mark this option if you want to user receive email after filing the form.', 'easy-appointments'); ?>"></span>
                        </div>
                        <div class="field-wrap">
                            <input class="field" data-key="send.user.email" name="send.user.email"
                                   type="checkbox" <% if (_.findWhere(settings,
                            {ea_key:'send.user.email'}).ea_value == "1") { %>checked<% } %>>
                        </div>
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Send from', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Send from email adress (Example: Name &lt;name@domain.com&gt;). Leave blank to use default address.', 'easy-appointments'); ?>"></span>
                        </div>
                        <input class="field" data-key="send.from.email" name="send.from.email"
                               type="text"
                               value="<%- _.findWhere(settings, {ea_key:'send.from.email'}).ea_value %>">
                    </div>
                </div>
            </div>

            <div id="tab-full-calendar" class="form-section hidden">
              <span class="separator vertical"></span>
              <div class="form-container">
                  <div class="form-item">
                      <div class="label-with-tooltip">
                          <label for=""><?php _e('Allow public access to FullCalendar shortcode', 'easy-appointments'); ?></label>
                          <span class="tooltip tooltip-right"
                                data-tooltip="<?php _e('By default only logged in users can see data in FullCalendar. Mark this option if you want to allow public access for all.', 'easy-appointments'); ?>"></span>
                      </div>
                      <div class="field-wrap">
                          <input class="field" data-key="fullcalendar.public"
                                 name="fullcalendar.public" type="checkbox" <% if
                          (_.findWhere(settings, {ea_key:'fullcalendar.public'}).ea_value == "1") {
                          %>checked<% } %>>
                      </div>
                  </div>
                  <div class="form-item">
                      <div class="label-with-tooltip">
                          <label for=""><?php _e('Show event content in popup', 'easy-appointments'); ?></label>
                          <span class="tooltip tooltip-right"
                                data-tooltip="<?php _e('Popup dialog for event content.', 'easy-appointments'); ?>"></span>
                      </div>
                      <div class="field-wrap">
                          <input class="field" data-key="fullcalendar.event.show"
                                 name="fullcalendar.event.show" type="checkbox" <% if
                          (_.findWhere(settings, {ea_key:'fullcalendar.event.show'}).ea_value == "1") {
                          %>checked<% } %>>
                      </div>
                  </div>
                  <div class="form-item">
                      <div class="label-with-tooltip">
                          <label for=""><?php _e('Event content in popup', 'easy-appointments'); ?></label>
                          <span class="tooltip tooltip-right"
                                data-tooltip="<?php _e('Event content when clicked on event', 'easy-appointments'); ?>"></span>
                      </div>
                      <textarea id="fullcalendar-event-template" class="field" name="fullcalendar.event.template" data-key="fullcalendar.event.template"><%- (_.findWhere(settings, {ea_key:'fullcalendar.event.template'})).ea_value %></textarea>
                      <small><?php _e('Example', 'easy-appointments'); ?> : (<a href="https://easy-appointments.net/documentation/templates/" target="_blank"><?php _e('Full documentation', 'easy-appointments');?></a>)</small>
                      <div style="display: inline-block"><code>{= event.location_name}</code><small> / </small><code>{= language}</code><small> / </small><code>{= link_confirm}</code></div>
                      <small><?php _e('To get all available options use', 'easy-appointments'); ?> :</small>
                      <code>{= __CONTEXT__ | raw}</code>
                  </div>
              </div>
            </div>

            <div id="tab-labels" class="form-section hidden">
                <span class="separator vertical"></span>
                <div class="form-container">
                    <div class="form-item">
                        <label for=""><?php _e('Service', 'easy-appointments'); ?></label>
                        <input class="field" data-key="trans.service" name="service" type="text"
                               value="<%= _.escape( _.findWhere(settings, {ea_key:'trans.service'}).ea_value ) %>">
                    </div>
                    <div class="form-item">
                        <label for=""><?php _e('Location', 'easy-appointments'); ?></label>
                        <input class="field" data-key="trans.location" name="location" type="text"
                               value="<%= _.escape( _.findWhere(settings, {ea_key:'trans.location'}).ea_value ) %>">
                    </div>
                    <div class="form-item">
                        <label for=""><?php _e('Worker', 'easy-appointments'); ?></label>
                        <input class="field" data-key="trans.worker" name="worker" type="text"
                               value="<%= _.escape( _.findWhere(settings, {ea_key:'trans.worker'}).ea_value ) %>">
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Done message', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Message that user receive after completing appointment', 'easy-appointments'); ?>"></span>
                        </div>
                        <input class="field" data-key="trans.done_message" name="done_message"
                               type="text"
                               value="<%= _.escape( _.findWhere(settings, {ea_key:'trans.done_message'}).ea_value ) %>">
                    </div>
                </div>
            </div>

            <div id="tab-date-time" class="form-section hidden">
                <span class="separator vertical"></span>
                <div class="form-container">
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Time format', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Notice : date/time formating for email notification are done by Settings > General.', 'easy-appointments', 'easy-appointments'); ?>"></span>
                        </div>
                        <select data-key="time_format" class="field" name="time_format">
                            <option value="00-24"
                            <% if (_.findWhere(settings, {ea_key:'time_format'}).ea_value ===
                            "00-24") {
                            %>selected="selected"<% } %>>00-24</option>
                            <option value="am-pm"
                            <% if (_.findWhere(settings, {ea_key:'time_format'}).ea_value ===
                            "am-pm") {
                            %>selected="selected"<% } %>>AM-PM</option>
                        </select>
                    </div>
                    <div class="form-item">
                        <label for=""><?php _e('Calendar localization', 'easy-appointments'); ?></label>
                        <select data-key="datepicker" class="field" name="datepicker">
                            <% var langs = [
                            'af','ar','ar-DZ','az','be','bg','bs','ca','cs','cy-GB','da','de','el','en','en-AU','en-GB','en-NZ','en-US','eo','es','et','eu','fa','fi','fo','fr','fr-CA','fr-CH','gl','he','hi','hr','hu','hy','id','is','it','it-CH','ja','ka','kk','km','ko','ky','lb','lt','lv','mk','ml','ms','nb','nl','nl-BE','nn','no','pl','pt','pt-BR','rm','ro','ru','sk','sl','sq','sr','sr-SR','sv','ta','th','tj','tr','uk','vi','zh-CN','zh-HK','zh-TW'
                            ];
                            _.each(langs,function(item,key,list){
                            if(_.findWhere(settings, {ea_key:'datepicker'}).ea_value === item) { %>
                            <option value="<%- item %>" selected="selected"><%- item %></option>
                            <% } else { %>
                            <option value="<%- item %>"><%- item %></option>
                            <% }
                            });%>
                        </select>
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Block time', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('(in minutes). Prevent visitor from making an appointment if there are less minutes than this.', 'easy-appointments'); ?>"></span>
                        </div>
                        <input class="field" data-key="block.time" name="block.time" type="text"
                               value="<%- _.findWhere(settings, {ea_key:'block.time'}).ea_value %>">
                    </div>
                </div>
            </div>

            <div id="tab-fields" class="form-section hidden">
                <span class="separator vertical"></span>
                <div class="form-container">
                    <div class="form-item">
                        <span class="pure-text">Create all fields that you need. Custom order them by drag and drop.</span>
                    </div>
                    <div class="form-item inline-fields">
                        <div class="form-item">
                            <label for="">Name</label>
                            <input type="text">
                        </div>
                        <div class="form-item">
                            <label for="">Type</label>
                            <select>
                                <option value="INPUT"><?php _e('Input', 'easy-appointments'); ?></option>
                                <option value="MASKED"><?php _e('Masked Input', 'easy-appointments'); ?></option>
                                <option value="SELECT"><?php _e('Select', 'easy-appointments'); ?></option>
                                <option value="TEXTAREA"><?php _e('Textarea', 'easy-appointments'); ?></option>
                                <option value="PHONE"><?php _e('Phone', 'easy-appointments'); ?></option>
                                <option value="EMAIL"><?php _e('Email', 'easy-appointments'); ?></option>
                            </select>
                        </div>
                        <button class="button button-primary btn-add-field button-field"><?php _e('Add', 'easy-appointments'); ?></button>
                    </div>
                    <div class="form-item">
                        <ul id="custom-fields"></ul>
                    </div>
                    <div class="form-item">
                        <span class="pure-text hint"><?php _e('* To use using the email notification for user there must be field named "email" or "e-mail" or field with type "email"', 'easy-appointments'); ?></span>
                    </div>
                </div>
            </div>

            <div id="tab-captcha" class="form-section hidden">
                <span class="separator vertical"></span>
                <div class="form-container">
                    <div class="form-item">
                        <label for=""><?php _e('Site key', 'easy-appointments'); ?></label>
                        <input style="width: 100%" class="field" data-key="captcha.site-key"
                               name="captcha.site-key" type="text"
                               value="<%- _.findWhere(settings, {ea_key:'captcha.site-key'}).ea_value %>">
                    </div>
                    <div class="form-item">
                        <span class="pure-text hint"><?php _e('* Google reCAPTCHA key can be generated via', 'easy-appointments'); ?> <a
                                    href="https://www.google.com/recaptcha/admin" target="_blank">LINK</a></span>
                    </div>
                    <div class="form-item">
                        <label for=""><?php _e('Secret key', 'easy-appointments'); ?></label>
                        <input style="width: 100%" class="field" data-key="captcha.secret-key"
                               name="captcha.secret-key" type="text"
                               value="<%- _.findWhere(settings, {ea_key:'captcha.secret-key'}).ea_value %>">
                    </div>
                    <div class="form-item">
                        <span class="pure-text hint"><?php _e('* If you want to use Captcha you must have auto reservation option turned off. If you don\'t want to use Captcha just leave fields empty.', 'easy-appointments'); ?></span>
                    </div>
                </div>
            </div>

            <div id="tab-form" class="form-section hidden">
                <span class="separator vertical"></span>
                <div class="form-container">
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Custom style', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Place here custom css styles. This will be included in both standard and bootstrap widget.', 'easy-appointments'); ?>"></span>
                        </div>
                        <textarea class="field" data-key="custom.css"><% if (typeof _.findWhere(settings, {ea_key:'custom.css'}) !== 'undefined') { %><%- (_.findWhere(settings, {ea_key:'custom.css'})).ea_value %><% } %></textarea>
                    </div>
                    <div class="form-item">
                        <label for="send.worker.email"><?php _e('Turn off css files', 'easy-appointments'); ?></label>
                        <div class="field-wrap">
                            <input class="field" data-key="css.off" name="css.off" type="checkbox"
                            <% if (_.findWhere(settings,
                            {ea_key:'css.off'}).ea_value == "1") { %>checked<% } %>>
                        </div>
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for="form.label.above"><?php _e('Form label style', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Show labels above or inline with fields option on [ea_bootstrap] shortcode.', 'easy-appointments'); ?>"></span>
                        </div>
                        <div>
                            <img data-value="0" class="form-label-option" title="inline" src="<?php echo plugin_dir_url( __DIR__ ) . '../img/label-inline.png';?>"/>
                            <img data-value="1" class="form-label-option" title="above" src="<?php echo plugin_dir_url( __DIR__ ) . '../img/label-above.png';?>"/>
                            <input class="field" type="hidden" name="form.label.above"
                                   data-key="form.label.above" value="<%- _.findWhere(settings,
                            {ea_key:'form.label.above'}).ea_value %>" />
                        </div>
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for="send.worker.email"><?php _e('I agree field', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('I agree option at the end of form. If this is marked user must confirm "I agree" checkbox.', 'easy-appointments'); ?>"></span>
                        </div>
                        <div class="field-wrap">
                            <input class="field" type="checkbox" name="show.iagree"
                                   data-key="show.iagree"<% if (typeof _.findWhere(settings,
                            {ea_key:'show.iagree'}) !== 'undefined' && _.findWhere(settings,
                            {ea_key:'show.iagree'}).ea_value == '1') { %>checked<% } %> />
                        </div>
                    </div>
                    <div class="form-item">
                        <label for=""><?php _e('After cancel go to', 'easy-appointments'); ?></label>
                        <select data-key="cancel.scroll" class="field" name="cancel.scroll">
                            <% var langs = [
                            'calendar', 'worker', 'service', 'location'
                            ];
                            _.each(langs,function(item,key,list){
                            if(typeof _.findWhere(settings, {ea_key:'cancel.scroll'}) !==
                            'undefined' &&
                            _.findWhere(settings, {ea_key:'cancel.scroll'}).ea_value === item) { %>
                            <option value="<%- item %>" selected="selected"><%- item %></option>
                            <% } else { %>
                            <option value="<%- item %>"><%- item %></option>
                            <% }
                            });%>
                        </select>
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Go to page', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('After a visitor creates an appointment on the front-end form. Leave blank to turn off redirect.', 'easy-appointments'); ?>"></span>
                        </div>
                        <input class="field" data-key="submit.redirect" name="submit.redirect"
                               type="text"
                               value="<%- _.findWhere(settings, {ea_key:'submit.redirect'}).ea_value %>">
                    </div>

                    <div class="form-item subgroup">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Advance Go to', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Add custom redirect based on service.', 'easy-appointments'); ?>"></span>
                        </div>
                    </div>
                    <div class="form-item">
                        <label for=""><?php _e('Service', 'easy-appointments'); ?></label>
                        <select id="redirect-service" class="field">
                            <% _.each(eaData.Services,function(item,key,list){ %>
                            <option value="<%= _.escape(item.id) %>"><%= _.escape(item.name) %></option>
                            <% });%>
                        </select>
                    </div>
                    <div class="form-item inline-fields">
                        <div class="form-item">
                            <label for=""><?php _e('Redirect to', 'easy-appointments'); ?></label>
                            <input id="redirect-url" name="redirect-url" type="text">
                        </div>
                        <button class="button button-primary btn-add-redirect button-field"><?php _e('Add advance redirect', 'easy-appointments'); ?></button>
                    </div>
                    <input type="hidden" id="advance-redirect" data-key="advance.redirect" class="field" name="advance.redirect" value="<%= _.escape(ea_settings['advance.redirect']) %>">
                    <div class="form-item">
                        <ul id="custom-redirect-list" class="list-form-item"></ul>
                    </div>
                </div>
            </div>

            <div id="tab-gdpr" class="form-section hidden">
                <span class="separator vertical"></span>
                <div class="form-container">
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for="send.worker.email"><?php _e('Turn on checkbox', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('GDPR section checkbox.', 'easy-appointments'); ?>"></span>
                        </div>
                        <div class="field-wrap">
                            <input class="field" type="checkbox" name="gdpr.on" data-key="gdpr.on"<%
                            if (typeof _.findWhere(settings, {ea_key:'gdpr.on'}) !== 'undefined' &&
                            _.findWhere(settings, {ea_key:'gdpr.on'}).ea_value == '1') { %>checked<%
                            } %> />
                        </div>
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Label', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Label next to checkbox.', 'easy-appointments'); ?>"></span>
                        </div>
                        <input class="field" data-key="gdpr.label" name="gdpr.label" type="text"
                               value="<%- _.findWhere(settings, {ea_key:'gdpr.label'}).ea_value %>">
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Page with GDPR content', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Link to page with GDPR content.', 'easy-appointments'); ?>"></span>
                        </div>
                        <input class="field" data-key="gdpr.link" name="gdpr.link" type="text"
                               value="<%- _.findWhere(settings, {ea_key:'gdpr.link'}).ea_value %>">
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Error message', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Message if user don\'t mark the GDPR checkbox.', 'easy-appointments'); ?>"></span>
                        </div>
                        <input class="field" data-key="gdpr.message" name="gdpr.message" type="text"
                               value="<%- _.findWhere(settings, {ea_key:'gdpr.message'}).ea_value %>">
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for=""><?php _e('Clear customer data older then 6 months', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('This action will remove custom form field values older then 6 months. After that appointments older then 6 months will not hold any customer related data.', 'easy-appointments'); ?>"></span>
                        </div>
                        <div class="field-wrap button">
                            <input class="field" type="checkbox" name="gdpr.auto_remove" style="margin-right: 10px;" data-key="gdpr.auto_remove"<%
                            if (typeof _.findWhere(settings, {ea_key:'gdpr.auto_remove'}) !== 'undefined' &&
                            _.findWhere(settings, {ea_key:'gdpr.auto_remove'}).ea_value == '1') { %>checked<%
                            } %> /> <?php _e('Auto remove data via Cron that runs once a day','easy-appointments');?><button class="button button-primary btn-gdpr-delete-data button-field" style="margin-left: 10px"><?php _e('Remove data now', 'easy-appointments'); ?></button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="tab-money" class="form-section hidden">
                <span class="separator vertical"></span>
                <div class="form-container">
                    <div class="form-item">
                        <label for=""><?php _e('Currency', 'easy-appointments'); ?></label>
                        <input class="field" data-key="trans.currency" name="currency" type="text"
                               value="<%- _.findWhere(settings, {ea_key:'trans.currency'}).ea_value %>">
                    </div>
                    <div class="form-item">
                        <label for="currency.before"><?php _e('Currency before price', 'easy-appointments'); ?></label>
                        <div class="field-wrap">
                            <input class="field" data-key="currency.before" name="currency.before"
                                   type="checkbox" <% if (_.findWhere(settings,
                            {ea_key:'currency.before'}).ea_value == "1") { %>checked<% } %>>
                        </div>
                    </div>
                    <div class="form-item">
                        <label for="price.hide.service"><?php _e('Hide price in service select', 'easy-appointments'); ?></label>
                        <div class="field-wrap">
                            <input class="field" data-key="price.hide.service" name="price.hide.service"
                                   type="checkbox" <% if (_.findWhere(settings,
                            {ea_key:'price.hide.service'}).ea_value == "1") { %>checked<% } %>>
                        </div>
                    </div>
                    <div class="form-item">
                        <div class="label-with-tooltip">
                            <label for="price.hide"><?php _e('Hide price', 'easy-appointments'); ?></label>
                            <span class="tooltip tooltip-right"
                                  data-tooltip="<?php _e('Hide price in whole customers form.', 'easy-appointments'); ?>"></span>
                        </div>
                        <div class="field-wrap">
                            <input class="field" data-key="price.hide" name="price.hide"
                                   type="checkbox" <% if (_.findWhere(settings,
                            {ea_key:'price.hide'}).ea_value == "1") { %>checked<% } %>>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <br><br>
    </div>
</script>

<script type="text/template" id="ea-tpl-custom-forms">
    <li data-name="<%= _.escape(item.label) %>" style="display: list-item;">
        <div class="menu-item-bar">
            <div class="menu-item-handle">
                <span class="item-title"><span class="menu-item-title"><%= _.escape(item.label) %></span> <span
                            class="is-submenu" style="display: none;">sub item</span></span>
                <span class="item-controls">
                <span class="item-type"><%= item.type %></span>
                    <a class="single-field-options"><i class="fa fa-chevron-down"></i></a>
                </span>
            </div>
        </div>
    </li>
</script>

<script type="text/template" id="ea-tpl-custom-form-options">
<div class="field-settings">
    <p>
        <label>Label</label><input type="text" class="field-label" name="field-label"
                                     value="<%= _.escape(item.label) %>">
    </p>

    <% if (item.type !== "PHONE" && item.type !== "SELECT" && item.type !== "MASKED") { %>
    <p>
        <label>Placeholder</label><input type="text" class="field-mixed" name="field-mixed"
                                           value="<%= _.escape(item.mixed) %>">
    </p>
    <% } %>

    <% if (item.type !== "PHONE" && item.type !== "SELECT" && item.type !== "MASKED") { %>
    <p>
        <label>Default value</label><input type="text" class="field-default_value" name="field-default_value"
                                         value="<%- item.default_value %>">
        <small>You can put values from logged in user (list of keys: <?php echo EAUserFieldMapper::all_field_keys(); ?>)</small>
    </p>
    <% } %>

    <% if (item.type === "PHONE") { %>
    <p>
        <label>Default value</label><select class="field-default_value" name="field-default_value"><?php require __DIR__ . '/phone.list.tpl.php';?></select>
    </p>
    <% } %>

    <% if (item.type === "MASKED") { %>
    <p>
        <label>Mask</label><input type="text" class="field-default_value" name="field-default_value" value="<%- item.default_value %>">
        <p><?php _e('Mask options', 'easy-appointments');?> : </p>
        <code>9 : numeric</code> , <code>a : alphabetical</code> , <code>* : alphanumeric</code>
        <p><?php _e('Example', 'easy-appointments');?> : </p>
        <code>(99) 9999[9]-9999</code> , <code>999-999-9999</code> , <code>aa-9{1,4}</code>
    </p>
    <% } %>

    <% if (item.type === "SELECT") { %>
    <p>
        <label>Options :</label>
    </p>
    <p>
    <ul class="select-options">
        <% _.each(item.options, function(element) { %>
        <li data-element="<%- element %>"><%= element %><a href="#" class="remove-select-option"><i
                        class="fa fa-trash-o"></i></a></li>
        <% }); %>
    </ul>
    </p>
    <p><input type="text"><a href="#" class="add-select-option">&nbsp;&nbsp;<i class="fa fa-plus"></i> Add option</a>
    </p>
    <% } %>
    <p>
        <label>Required :</label><input type="checkbox" class="required" name="required" <% if (item.required == "1") {
        %>checked<% } %>>
    </p>
    <p>
        <label>Visible :</label><input type="checkbox" class="visible" name="visible" <% if (item.visible == "1") {
        %>checked<% } %>>
    </p>
    <p><a href="#" class="deletion item-delete">Delete</a> | <a href="#" class="item-save">Apply</a></p>
</div>
</script>

<!-- TOOLS -->
<script type="text/template" id="ea-tpl-tools">
	<div class="wp-filter">
		<h2><?php _e('Test Email', 'easy-appointments');?></h2>
		<p><?php _e('Test if the mail service is working fine on this site by generating a test email that will be send to provided address.', 'easy-appointments');?></p>
		<table class="form-table form-table-translation">
			<tbody>
				<tr>
					<th class="row"><?php _e('To', 'easy-appointments');?></th>
					<td><input id="test-email-address" name="test-email-address" type="text" class="field" /> <span class="description"><?php _e('Email address', 'easy-appointments');?></span></td>
				</tr>
				<tr>
					<td>&nbsp;</td>
					<td></td>
				</tr>
				<tr>
					<td>&nbsp;</td>
					<td colspan>
						<button id="test-wp-mail" class="button button-primary"><?php _e('Send a Test Email', 'easy-appointments');?></button>
						<button id="test-mail" class="button button-primary"><?php _e('Send a Test Email (native)', 'easy-appointments');?></button>
					</td>
				</tr>
			</tbody>
		</table>
		<hr class="divider" />
		<h2><?php _e('Error log', 'easy-appointments'); ?></h2>
		<div style="text-align: center;">
			<textarea id="ea-error-log" style="font-family: monospace;width: 100%;min-height: 400px;"><?php _e('Loading...', 'easy-appointments'); ?></textarea>
		</div>
        <div><button id="ea-clear-log" class="button button-primary"><?php _e('Clear log', 'easy-appointments');?></button></div>
        <br/>
	</div>
</script>

<script type="text/template" id="ea-tpl-advance-redirect">
    <div style="min-height: 380px; max-height: 380px;">

    </div>
    <div class="bulk-footer">
        <button id="close-advance-redirect" class="button-primary" disabled>Close</button>
    </div>
</script>

<script type="text/template" id="ea-tpl-single-advance-redirect">
    <li>
        <span class="bulk-value"><%= _.escape( _.findWhere(locations, {id:row.location}).name ) %></span>
        <span class="bulk-value"><%= _.escape( _.findWhere(services,  {id:row.service}).name ) %></span>
        <span class="bulk-value"><%= _.escape( _.findWhere(workers,   {id:row.worker}).name ) %></span>
        <span style="display: inline-block;"><button class="button bulk-connection-remove">Remove</button></span>
    </li>
</script>

<!-- TOOLS LOG -->
<script type="text/template" id="ea-tpl-tools-log">------------ ERROR #<%- item.id %> ------------
TYPE: <%- item.error_type %>
ERRORS: <%= item.errors %>
ERRORS_DATA: <%= item.errors_data %>
---------- ERROR #<%- item.id %> END ----------

</script>