<div class="ea-phone-field-group">

    <select name="ea-phone-country-code-part" data-default="<%- item.default_value %>" class="ea-phone-country-code-part custom-field dummy form-control" <% if (item.required == "1") { %>data-rule-required="true" data-msg-required="<%= _.escape(settings['trans.field-required']) %>"<% } %>>
        <?php require __DIR__ . '/phone.list.tpl.php';?>
    </select>
    <input type="text" name="ea-phone-number-part" maxlength="499" class="ea-phone-number-part custom-field dummy form-control" placeholder="<%= _.escape(item.mixed) %>" <% if (item.required == "1") { %>data-rule-required="true" data-msg-required="<%= _.escape(settings['trans.field-required']) %>"<% } %>><br>
    <input type="hidden" name="<%= _.escape(item.slug) %>" data-prop="<%= _.escape(item.slug) %>" class="custom-field full-value" >
</div>
