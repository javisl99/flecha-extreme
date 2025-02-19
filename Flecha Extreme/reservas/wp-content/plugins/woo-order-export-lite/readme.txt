=== Advanced Order Export For WooCommerce ===
Contributors: algolplus
Donate link: https://paypal.me/ipprokaev/0usd
Tags: woocommerce,export,order,xls,csv,xml,woo export lite,export orders,orders export,csv export,xml export,xls export,tsv
Requires PHP: 5.4.0
Requires at least: 4.7
Tested up to: 5.8
Stable tag: 3.2.2
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Export orders from WooCommerce with ease ( Excel/CSV/TSV/XML/JSON supported )

== Description ==
This plugin helps you to **easily** export WooCommerce order data. 

Export any custom field assigned to orders/products/coupons is easy and you can select from various formats to export the data in such as CSV, XLS, XML and JSON.

= Features =

* **select** the fields to export
* **rename** labels
* **reorder** columns 
* export WooCommerce **custom fields** or terms for products/orders
* mark your WooCommerce orders and run "Export as..." a **bulk operation**.
* apply **powerful filters** and much more

= Export Includes =

* order data
* summary order details (# of items, discounts, taxes etc…)
* customer details (both shipping and billing)
* product attributes
* coupon details
* XLS, CSV, TSV, PDF, HTML, XML and JSON formats

= Use this plugin to export orders for =

* sending order data to 3rd part drop shippers
* updating your accounting system
* analysing your order data


Have an idea or feature request?
Please create a topic in the "Support" section with any ideas or suggestions for new features.

> Pro Version

> Are you looking to have your WooCommerce products drop shipped from a third party? Our plugin can help you export your orders to CSV/XML/etc and send them to your drop shipper. You can even automate this process with [Pro version](https://algolplus.com/plugins/downloads/advanced-order-export-for-woocommerce-pro/) .



== Installation ==

= Automatic Installation =
Go to WordPress dashboard, click  Plugins / Add New  , type 'order export lite' and hit Enter.
Install and activate plugin, visit WooCommerce > Export Orders.

= Manual Installation =
[Please, visit the link and follow the instructions](http://codex.wordpress.org/Managing_Plugins#Manual_Plugin_Installation)

== Frequently Asked Questions ==

Please, review [user guide](https://docs.algolplus.com/order-export-docs/) at first.

Check [some snippets](https://algolplus.com/plugins/snippets-plugins/) for popular plugins or review  [this page](https://algolplus.com/plugins/code-samples/) to study how to extend the plugin.

Still need help? Create ticket in [helpdesk system](https://algolplus.freshdesk.com). Don't forget to attach your settings or some screenshots. It will significantly reduce reply time :)

= I want to add a product attribute to the export  =
Check screenshot #5! You should open section "Set up fields", open section "Product order items"(right column), click button "Add field", select field in 1st dropdown, type column title and press button "Confirm".

= Same order was exported many times =
You should open section "Set up fields to export" and set "Fill order columns for" to  "1st row only". The plugin repeats common information for each order item (by default).

= I see only GREEN fields in section "Set up fields"  =
Please, unmark checkbox "Summary Report By Products" (it's below date range)

= Red text flashes at bottom during page loading = 
It's a normal situation. The plugin hides this warning on successful load. 

= I can't filter/export custom attribute for Simple Product =
I'm sorry, but it's impossible. You should add this attribute to Products>Attributes at first and use "Filter by Product Taxonomies".

= How can I add a Gravity Forms field to export? =
Open order, look at items and remember meta name.
Visit WooCommerce>Export Orders,
open section "Set up fields", open section "Product order items"(at right), click button "Add field",
select SAME name in second dropdown (screenshot #5)

= Plugin produces unreadable XLS file =
The theme or another plugin outputs some lines. Usually, there are extra empty lines at the end of functions.php(in active theme).

= I can't export Excel file (blank message or error 500) =
Please, increase "memory_limit" upto 256M or ask hosting support to do it.

= When exporting .csv containing european special characters , I want to open this csv in Excel without extra actions =
You  should open tab "CSV" and set up ISO-8859-1 as codepage.

= Preview shows wrong values,  I use Summary mode =
This button processes only first 5 orders by default, so you should run the export to see correct values.

= Is it compatible with "WooCommerce Custom Orders Table" plugin (by Liquid Web) ? =
No, as we provide a lot of filters which can not be implemented using WooCommerce classes. So we use direct access to database/tables.

= Can I request any new feature ? =
Yes, you can email a request to aprokaev@gmail.com. We intensively develop this plugin.

== Screenshots ==

1. Default view after installation.  Just click 'Express Export' to get results.
2. Filter orders by many parameters, not only by order date or status.
3. Select the fields to export, rename labels, reorder columns.
4. Button Preview works for all formats.
5. Add custom field or taxonomy as new column to export.
6. Select orders to export and use "bulk action".

== Changelog ==

= 3.2.2 - 2021-12-14 =
* Fixed bug - PHP8 compatibility issues (deprecation warnings for XLS format)
* Fixed bug - blank row was added after every 1000 rows (XLS format)
* Fixed bug - money cells were empty if value = 0 (XLS format)
* Fixed bug - products were not sorted by Name in summary mode
* Fixed bug - some files were not deleted in folder /tmp

= 3.2.1 - 2021-11-11 =
* Fixed critical bug - option "Format numbers" broke XLS format

= 3.2.0 - 2021-11-09 =
* Speeded up XLS export
* Added option "Remove emojis" (XLS format)
* Added option "Remove line breaks" (CSV format)
* Added field "Total volume"
* New button "Add calculated field" in section "Setup Fields"
* Fixed bug - photo missed in product search
* Fixed bug - can't filter items if item has "&" in name
* Fixed bug - PHP warnings for deleted taxonomy
* Fixed bug - long links broke PDF cells
* Fixed bug - ignored capability "export_woocommerce_orders"

= 3.1.9 - 2021-06-22 =
* New field "Sum of Items (Exported)" for mode "Summary Report By Customers"
* Added extra operators for filter by item meta
* Correctly export description of variation
* Correctly show alias for deleted role
* Fixed bug - fatal error if variation was deleted
* Fixed bug - unixtimestamp exported as number (not date) to Excel
* Fixed bug - option "Export only matched product items" didn't work if order has variations of same product
* Fixed bug - TAX fields (added via >Setup Fields>Other items) ignored shipping amount 

= 3.1.8 - 2021-02-22 =
* Fixed XSS vulnerability
* Screen >WooCommerce>Orders can be sorted by column "Export Status"
* New field "Order subtotal + Cart tax amount"
* New field "Shipping Zone" 
* Added operators "IS SET" and "NOT SET" for item meta filters
* Added option "Don't encode unicode chars" to section "JSON "
* Fixed bug - some compatibility issues with PHP 7.4
* Fixed bug - correctly support Loco Translate
* Fixed bug - weight was rounded for XLS format

= 3.1.7 - 2020-12-09 =
* New field "Summary Report Total Weight"
* Added option to round "Item Tax Rate" (Misc Settings)
* Added option "Force enclosure for all values" (CSV format)
* Use billing email to calculate field "Customer Total Orders" for guests
* The plugin supports capability "export_woocommerce_orders"
* Fixed bug - PDF text didn't fit to cell by column width
* Fixed bug - field "Non variation attributes" showed wrong values for existing taxonomies

= 3.1.6 - 2020-09-21 =
* New product fields "Item Cost (inc. tax)", "Stock Status", "Stock Quantity", "Non variation attributes"
* New customer field "Customer Total Spent"
* Added option "Add links to images" (HTML format)
* Fixed bug - duplicates were shown in "Summary by products" mode
* Fixed bug - field "Coupon Discount Amount" was empty
* Fixed bug - fatal PHP error "Call to undefined method get_duplicate_settings()"
 
= 3.1.5 - 2020-08-24 =
* Compatible with PHP 7.4
* Added option "Format output" (XML format)
* Added option "Don't break order lines by 2 pages" (PDF format)
* Added option "Add links to images" (PDF format)
* Added option "Try to convert serialized values" (Misc Settings)
* Added fields "Summary Report Total Fee Amount", "Summary Report Total Tax Amount"
* Fixed bug - 'wc doing it wrong' notice (direct access to product parent property)
* Fixed bug - option "Change order status" worked only for button "Export w/o progress"
* Fixed bug - option "Add products as " = "0 columns" incorrectly worked for button "Export"
* Fixed bug - field "Embedded Product Image" showed parent image for variation
* Fixed bug - mode "Summary Report By Products" incorrectly worked with variations
* Fixed bug - custom and static fields were empty in "Summary by customers" mode
* Fixed bug - draft products were visible in autocomplete
* Fixed bug - button "Import" was shown as disabled at tab "Tools"
* New hooks for PDF format

= 3.1.4 - 2020-04-15 =
* Prevent XSS attack (CVE-2020-11727). Thank Jack Misiura​ for reporting this vulnerability!

= 3.1.3 - 2020-03-24 =
* Fixed CRITICAL bug - export via "Bulk actions" (at screen >WooCommerce>Orders) works incorrectly

= 3.1.2 - 2020-03-16 =
* Added filter by order IDs (not order numbers!)
* Added checkbox "Export only matched product items" to section "Filter by item and metadata"
* Added checkbox "Shipping fields use billing details (if shipping address is empty)" to section "Misc Settings"
* Added fields "Item Cost Before Discount", "Item Discount Tax" to section "Product order items"
* Renamed field "Product Variation" to "Order Item Metadata"
* Added some tooltips to sections inside "Set up fields"
* Support tag {order_number} in filename
* Fixed UI bugs for Firefox
* Fixed bug - Preview was wrong if CSV format used non-UTF8 codepage
* Fixed bug - some warnings in JS console
* Fixed bug - Safari added .csv to any filename when we use TSV format
* Fixed bug - wrong filters applied when user selected orders and exported them via bulk action
* New hooks for product custom fields

= 3.1.1 - 2019-11-18 =
* Field "Embedded product image" is exported by "Summary by product" mode (XLS/PDF/HTML formats)
* Added checkbox to export item rows with a new line (TAB format)
* Fixed incompatibility with "Advanced Custom Fields" plugin
* Fixed bug - product static fields were empty sometimes
* Fixed bug - adding fields worked incorrectly at tab "Product items"
* Fixed bug - fields "Categories" and "Full names for categories" were empty for variable products

= 3.1.0 - 2019-11-11 =
* Speeded up page loading and button "Preview"
* Added filter "Products SKU" to section "Filter by product"
* Added options for JSON format
* Added vertical align for cells (PDF format)
* New tabs "Product items", "Product totals" in section "Setup fields"
* Order fields can be dragged to section "Products" (JSON/XML formats)
* Added product field "SKU(parent)"
* Added fields "Total Shipping","Total Discount","Total Items" for "Summary by customers" mode
* Support "0" as max # of product columns (calculated based on exported orders)
* Deleted products are exported by "Summary by products" mode 
* Fixed UI bugs for summary mode
* New hooks for PDF format
* Fixed bug - sorting (by order fields) conflicted with filtering by order custom fields

= 3.0.3 - 2019-08-29 =
* Fixed CRITICAL bug - export wrong data if user added customer field "First Order Date" or "Last Order Date"
* Fixed bug - customer fields "First Order Date" or "Last Order Date" were empty for guests
* Fixed bug - wrong height for cells (PDF format only)

= 3.0.2 - 2019-08-20 =
* Added "Summary by customers" report 
* Format PDF supports UTF8 chars
* Added filter "Exclude products" to section "Filter by product"
* New tab "Other items" (in section "Setup fields")  allows to export tax/fee/shipping
* Fixed bug - XLS export stops at wrong dates
* Fixed bug - button "ESC" doesn't abort export (Safari only)

= 3.0.1 - 2019-07-22 =
* Added product field "Product Name (main)" to export name of variable product (not name of variation!)
* Added summary product fields to export discounts and refunds
* Fixed bug - bulk exporting from orders page didn't work if you set date range filter at page "Export Now"
* Fixed bug - it was impossible to add custom field at tab "User"
* Fixed bug - filter "User roles" applied incorrectly
* Fixed bug - filter "Item meta" showed wrong results if you tried to filter by different meta keys

= 3.0.0 - 2019-07-03 =
* New format - **HTML**
* Added order field "Link to edit order" (useful for HTML format)
* Added product field "Embedded Product Image" (works for XLS and PDF formats only!)
* Added order fields (for customer) -  "First Order Date", "Last Order Date"
* Added 'Hide unused' for order/product/coupon fields (dropdowns filtered by matching orders)
* Allow to sort orders by any custom field
* Fixed bug - fields with prefix "USER_" were shown for all tabs in section "Setup fields" 
* Fixed bug - the plugin exported all orders by default (including cancelled and refunded) 
* Fixed bug - bulk export didn't sort orders
* Fixed bug - incompatibility with some coupon plugins
* Fixed bug - tab "Tools" didn't show error if JSON is not valid
* Removed a lot of outdated code

= 2.1.1 - 2019-02-14 =
* Fixed critical bug - new version damages CSV and TSV parameters, so "Bulk action" doesn't work

= 2.1.0 - 2019-02-06 =
* New format - **PDF**
* Fixed some vulnerabilities
* Added button "Reset settings"
* Section "Setup fields" works on phone/tablet
* New XLS option to avoid formatting - "Force general format for all cells"
* Fixed bug - fields "Summary Report Total xxxx" stayed at bottom
* Fixed bug - "Summary report" was not sorted by item name
* Fixed bug - fields reset when  user switches between flat formats
* Fixed bug - field "full categories" was empty for variations
* Tested for jQuery 3.0+

= 2.0.1 - 2018-11-14 =
* Fixed bug - "total weight" and "count of unique products" were empty
* Fixed bug - message "wrong Select2 loaded"
* Fixed bug - UI issues after switching formats (CSV-XML-CSV)
* Shows some instructions if user gets popup with empty error message
* Shows warning if XML can not be built (PHP extension is not installed)

= 2.0.0 - 2018-10-24 =
* It's a **major update**. Backup settings (tab "Tools") before upgrading
* New section "Set up fields to export"  - simplify UI, format fields, allow duplicates
* Compatible with Woocommerce 3.5

= 1.5.6 - 2018-08-30 =
* Added filter by user custom fields
* Added order fields "Count of exported items", "User Website"
* Added product fields "Product Id", "Variation Id", "Order Line Subtotal Tax"
* Multiple custom fields with same title are exported as list (for order)
* Format Shipping/Billing fields as string (Excel only)
* Fixed compatibility issue with WP Redis cache
* Fixed bug - "Progressbar" shows error message correctly
* Fixed bug - "Progressbar" doesn't miss  orders  if both "Mark exported" and "Export unmarked only" are ON
* Reduced memory footprint (options are not autoloaded)

= 1.5.5 - 2018-06-08 =
* Added filter by item name
* Added filter by item metadata
* Added operators <,>,>=,<= for order and product custom fields
* Updated filter by shipping method (adapted for WooCommerce 3.4)
* Fixed bug in filter by product taxonomies 
* Allow to enter time in date range filter (after date)
* Show sections "Filter by order" and "Filter by coupon" as opened if some checkboxes are ON in these sections
* Added order field "Total Orders For Customer"
* Splited product field "Name" to "Item Name" and "Product Name" (to export current product name)
* Automatically scroll section "Setup Fields" to bottom after adding new field
* Export multiple values from same item meta
* Added new hooks for summary reports
* Prevent csv injection (we add space if cell value starts with =,+,-,@). Thank Bhushan Patil for finding this vulnerability!

= 1.5.4 - 2018-04-25 =
* Prompting to save changes if user modifies settings
* Product fields and order item fields were separated in popup "Setup fields"
* Allow to filter by raw shipping methods (not assigned to shipping zones)
* Record time of last export for the order (option "mark exported orders" must be ON)
* Added order fields "Line number", "Order Subtotal - Cart Discount"
* Added product field "Full names for categories"
* Added operators "Is set", "Not is set" for custom fields
* Added option "Enable debug output" to section "Misc Settings"
* Added option "Cleanup phone" to section "Misc Settings"
* Tags {from_date} and {to_date} can be used in filename 
* Fixed bug in UI  if order item meta has many values

= 1.5.3 - 2018-02-12 =
* The plugin is compatible with WooCommerce 3.3.1 
* Supports complex structures (arrays,objects) in the fields, export it as JSON string
* Shows "download link" for iPad/iPhone
* Added product field "Product URL"
* Fixed bug for Excel dates

= 1.5.2 - 2018-01-22 =
* Fixed dangerous bug for field "Order Line (w/o tax)" (tax was subtracted TWICE)
* Setup fields added for "Summary Report By Products"
* Corrected formats for Excel dates
* Added CSV option  "Convert line breaks to literals"
* Added order fields "City, State, Zip", "Date of first refund"
* Added product fields "Item ID", "Item Tax Rate", "Item Discount Amount", "Order Line Total (include tax)"
* Added more filters for UI
* Fixed bug for forms having huge number of fields
* Fixed bug for Excel builder 
* Fixed bug during import
* Fixed bug during bulk actions

= 1.5.1 - 2017-11-24 =
* The plugin is translated via translate.wordpress.org, so it requires WordPress 4.6+
* Added "Summary Report By Products"
* Added option "Format numbers ( WC decimal separator )" in "Misc Settings"
* Bulk actions work stable now ( WordPress 4.7+ required )
* Fixed bug at tab "Tools ( export/import procedure )
* Many messages were untranslatable in UI
* Optimized for shops having huge number of customers

= 1.5.0 - 2017-10-27 =
* Allow sort orders by "Created Date", "Modified Date"
* Added combined fields "Billing Address 1&2", "Shipping Address 1&2"
* Added checkboxes "Mark exported orders" and "Export unmarked orders only" to section "Filter By Order"
* Added section "custom php" in "Misc Settings" ( requires capability "edit_themes"! )
* Added option "Export refund notes as Customer Note" in "Misc Settings"
* Added text field for custom date format
* Added settings for JSON format
* The plugin is PHP7 compatible 
* Added headers "WC requires at least", "WC tested up to" for WooCommerce version check
* Optimized for shops having huge number of products

= 1.4.5 - 2017-09-06 =
* Fixed activation error for PHP less than 7.0

= 1.4.4 - 2017-09-04 =
* Fixed critical bug , headers were missed

= 1.4.3 - 2017-09-01 =
* User can select which date use ( created/modified/paid/completed )  in filter "Date Range"
* User can add new value to filters ( type text and press Enter )
* Added filter "Any Coupon Used"
* Added field  "Date Paid"
* Added checkbox to export all comments ( including system messages )
* Added checkbox to strip tags in product description/variation
* Added checkbox to export item rows at new line ( for CSV format )
* Tweak UI ( tooltips, reduce sections )
* Sorted values in all dropdowns 
* Fixed bug - Don't export draft order
* Fixed bug - Don't create file during estimation
* Plugin code partially refactored

= 1.4.2 - 2017-07-13 =
* Fixed critical bug in deactivation procedure

= 1.4.1 - 2017-07-12 =
* German translation was added. Thanks to contributor!
* Added filter "Billing locations"
* Added new format TSV (tab separated values)
* Added self closing tags for XML
* Added option to skip refunded items
* Import/export works with single profile
* Force string format for  some Excel columns ( customer note, phone number,..)
* Fixed some bugs for refunds
* Fixed bug for export via bulk actions 

= 1.4.0 - 2017-06-02 =
* Fixed bug for field "Customer order note"
* Fixed bug for filter by product category
* Tested for WordPress 4.8
* Added new product fields "Description" and "Short Description"
* Added logger for backgound tasks (for WooCommerce 3.0+)
* Added a lot of hooks 
* New tab "Order Change" to export single order immediately (Pro)

= 1.3.1 - 2017-05-12 =
* Optimized for big shops (tested with 10,000+ orders)
* Export refunds
* Export deleted products
* Added new filter "Product custom fields"
* Added new product field "Product Variation"
* Added new coupon fields "Type","Amount", "Discount Amount + Tax"
* Tweaked default settings
* Menu uses capability "view_woocommerce_reports"

= 1.3.0 - 2017-04-11 =
* The plugin is compatible with WooCommerce 3.0
* Display warning message if user interface fails to load
* Update Select2.js to fix some user interface problems
* Fixed fields "Order Tax" and "Subtotal" (uses WooCommerce functions to format it)

= 1.2.7 - 2017-03-17 =
* Portuguese and French translations were added. Thanks to contributors!
* Added new field "Order amount without tax"
* Added new product field "Quantity (- Refund)"
* Added tab "Help"
* Added some UI hooks
* Fixed bug in filter by Taxonomies
* Fixed bug in filter by Shipping Methods (disabled for WooCommerce  earlier than  2.6)
* Fixed field "State Full Name" (html entities removed)
* Skip **deleted products** during export
* Removed word "hack" from PHPExcel source

= 1.2.6 - 2017-02-02 =
* Added new filter "Filter by coupons"
* Added new filter "Shipping methods" to section "Filter by shipping"
* Added "refund" fields for items/taxes/shipping
* Simple products can be filtered by attributes using "Product Taxonomies"
* Fixed bug in filtering by products ( it checked first X products only)
* Fixed bug for filename in bulk actions
* Kill extra lines in generated files if the theme or another plugin outputs something at top
* XLS format doesn't require module "php-zip" now

= 1.2.5 - 2016-12-21 =
* Button "Preview" displays estimation (# of orders in exported file)
* User can change number of orders in "Preview"
* Orders can be sorted by "Order Id" in descending/ascending direction
* Added column "Image Url" for products (featured image)
* Fixed bug, **the plugin exported deleted orders!**
* Fixed bug, autocomplete displayed deleted products in filter "Product"
* Fixed bug, filter "category" and filter "Attribute" work together for variations
* Fixed bug, import settings didn't work correcty
* Suppress useless warning if the plugin can't create file in system "/tmp" folder
* New filters/hooks for products/coupons/vendors
* New filters/hooks for XLS format
* Russian/Chinise translations were updated

= 1.2.4 - 2016-11-15 =
* Added new filter "Item Metadata" to section "Filter by product"
* Added Chinese language. I’d like to thank user [7o599](https://wordpress.org/support/users/7o599/) 
* Added new tab "Tools" with section "export/import settings"
* Added button to hide non-selected fields
* XML format supports custom structures (some hooks were added too)
* Fixed bug for taxonomies (we export attribute Name instead of slug now)
* Fixed bug for XLS  without header line
* Fixed bug with pagination after export (bulk action)
* Fixed bug in action "Hide unused" for products
* Fixed bug for shops having huge number of users
* Fixed bug for "&" inside XML 

= 1.2.3 - 2016-10-21 =
* Added usermeta fields to section "Add field"
* "Press ESC to cancel export" added to progressbar 
* Added column "State Name"
* Added columns "Shipping Method", "Payment Method" (abbreviations)
* Format CSV can be exported without quotes around values
* Added checkbox to skip suborders
* Bulk export recoded to be compatible with servers behind a Load Balancer
* Skip root xml if it's empty
* New filters/hooks for CSV/XML formats
* [Code samples](https://algolplus.com/plugins/code-samples/)  added to documentation

= 1.2.2 - 2016-09-28 =
* Added column "Product Shipping Class"
* Added column "Download Url"
* Added column "Item Seller"
* Fixed bug in field "Line w/o tax" (if price doesn't include tax)
* Fixed bug in XML format  (for PHP7)
* A lot of new filters/hooks added

= 1.2.1 - 2016-08-12 =
* New filter by Payment Method
* New filter by Vendor( product creator)
* New field "Order Notes"
* Button "Export w/o progressbar" (added for servers behind a Load Balancer)
* Fixed bug if order was filtered by variable product

= 1.2.0 - 2016-07-11 =
* Support both XLS and XLSX
* Solved problem with filters ("Outdated Select2.js" warning)
* Added date/time format
* Comparison operators for custom fields & product attributes( + LIKE operator)
* Codepage for CSV file
* Preview displays 3 records
* Fixed bug for "Item cost"
* Refreshed language files 
 
= 1.1.13 - 2016-06-18 =
* Possibility to "Delete" fields (except default!)
* Added 'Hide unused' for order/product/coupon fields (dropdowns filtered by matching orders)
* Auto width for Excel format
* Export attributes which are not used in variations
* Support single/double quotes in column name
* Added  MAX # of columns ( if we export products as columns)

= 1.1.12 - 2016-05-25 =
* Added filter by users/roles
* Added filename for downloaded file
* Export refund amount
* Xls supports RTL

= 1.1.11 - 2016-04-27 =
* Added filter by custom fields (for order)
* Coded fallback if the plugin can't create files in folder "/tmp"
* Added new hooks/filters

= 1.1.10 - 2016-03-30 =
* "Filter by product" allows to export only filtered products
* Fixed bug for meta fields with spaces in title
* Fixed bug for XML/JSON fields ( unable to rename )
* Added new hooks/filters
* Added extra UI alerts
* Added tab "Profiles" (Pro version)

= 1.1.9 - 2016-03-14 =
* Disable Object Cache during export
* Added fields : Line Subtotal, Order Subtotal, Order Total Tax

= 1.1.8 - 2016-03-07 =
* Added link to PRO version
* Fixed few minor bugs

= 1.1.7 - 2016-02-18 =
* Added options "prepend/append raw XML"
* Added column "Item#" for Products
* Fixed custom fields for Products

= 1.1.6 - 2016-02-04 =
* Added column "Total weight" (to support Royal Mails DMO)
* Display progressbar errors during export

= 1.1.5 - 2016-01-21 =
* Fixed another bug for product custom fields

= 1.1.4 - 2016-01-13 =
* Added custom css to our pages only

= 1.1.3 - 2015-12-18 =
* Ability to export selected orders only
* Fixed bug for product custom fields
* Fixed progressbar freeze

= 1.1.2 - 2015-11-11 =
* Fixed path for temporary files
* Export coupon description

= 1.1.1 - 2015-10-27 =
* Export products taxonomies

= 1.1.0 - 2015-10-06 =
* Order exported records by ID
* Corrected extension for xlsx files
* Fixed bug for "Set up fields"

= 1.0.6 - 2015-09-28 =
* Attribute filter shows attribute values.
* Shipping filter shows values too.

= 1.0.5 - 2015-09-09  =
* Filter by product taxonomies

= 1.0.4 - 2015-09-04 =
* Export to XLS

= 1.0.3 =
* Partially support outdated Select2 (some plugins still use version 3.5.x)
* Fixed problem with empty file( preview was fine)

= 1.0.2 - 2015-08-25 =
* Added Progress bar
* Added new csv option "Populate other columns if products exported as rows"

= 1.0.1 - 2015-08-11 =
* Added Russian language


= 1.0.0 - 2015-08-10  =
* First release.