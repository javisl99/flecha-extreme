=== Easy Appointments ===
Contributors: loncar
Donate link: https://easy-appointments.net/
Tags: appointment, appointments, Booking, calendar, plugin, reservation, reservations, wp appointment, reservation plugin, reservations, schedule
Requires at least: 3.7
Tested up to: 5.6
Requires PHP: 5.3
Stable tag: 3.2.4
License: GPLv2
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Add Booking system to your WordPress site and manage Appointments with ease. Extremely flexible time management and custom email notifications.

== Description ==
Add Booking Appointments system to your WordPress site and manage Appointments with ease. Extremely flexible time management. Multiple location, services and workers. Email notifications.

Can be used for : <strong>Lawyers</strong>, <strong>Salons</strong>, <strong>Mechanic</strong>, <strong>Cleaning services</strong>, <strong>Doctors</strong>, <strong>Spas</strong>, <strong>Personal trainers </strong>, <strong>Private Lessons</strong>, <strong>Escape rooms</strong> etc,

= Live Demo =
<a href="https://easy-appointments.net/responsive-single-column-layout/">**Responsive Appointment form**</a><br>
<a href="https://easy-appointments.net/responsive-two-columns/">**Responsive Appointment form - two column layout**</a><br>
<a href="https://easy-appointments.net/full-calendar/">**Full calendar NEW**</a><br>
<a href="https://easy-appointments.net/demo-standard-single-column-layout/">**Standard Appointment form**</a><br>

= Doc =
<a href="https://easy-appointments.net/documentation/">Documentation</a>

= Features =

* Multiple **Locations**
* Multiple **Services**
* Multiple **Workers**
    - Create dedicated calendar for one location / service / worker
* Create time slots by connecting location – service – worker and date/time
    - Multiple time slots
    - Fine granular option for creating even most complex time table
    - **Bulk connections builder**
* **Extremely flexible time table**
* **Email notifications :**
    - Send email notification to customer on creation and update of appointment
    - Send email notification to predefined list of admin users
    - Send email notification to employee
    - Custom content and subject
    - Custom admin email
    - Confirm booking via link provided inside email
    - Cancel booking via link provided inside email
    - HTML content via WYSIWYG editor
    - Custom emails for different status of appointments : pending, reservation, canceled, confirmed
    - Include any information from booking inside email content even from custom fields
* **Single Column Responsive Bootstrap Layout** for Appointment form
* **Two Column Responsive Bootstrap layout**
* **Custom form fields :**
    - **Create your own custom form fields in a few clicks**
    - textarea
    - select
    - input
    - Make fields required
    - Drag and drop order
    - Google reCAPTCHA v2
    - **NEW** use current logged in user data sa default value for custom field.
* **Internationalization** - support for translations (you can create your own translation <a href="https://easy-appointments.net/documentation/#translate">>> tutorial <<</a>)
    - German translation (thanks to Matthias)
    - Romanian translation (thanks to Vlad)
    - Polish translation (thanks to <a href="mailto:maciej@bauza.pl" target="_blank">Maciej Bauza</a>)
    - Finnish translation thanks to Maija
    - Portuguese translation thanks to Antonio
    - Portuguese Brazil translation thanks to seniweb
    -
* Labels
    - Hide price
    - Add custom currency
    - Set currency before/after price
    - Custom style
* Localization of **datepicker for 77 different languages** (day of week, months)
* Reports
    - Time table overview
    - **Export to CSV (for Calc, Excel...)**

= Need even more like Google Calendar, iCalendar, WooCommerce or Twilio SMS support? =
There is extension plugin that you can buy and add to your Easy Appointments plugin :

* Google Calendar with 2 way sync
* iCalendar
* Twilio SMS notifications
* WooCommerce integration
* PayPal integration

For more info follow the link for <a href="https://easy-appointments.net/#extension">Extension plugin</a>

= HomePage =
<a href="https://easy-appointments.net/">easy-appointments.net</a>

== Installation ==

= Install process is quite simple : =

– After getting plugin ZIP file log onto WP admin page.
– Open Plugins >> Add new.
– Click on “Upload plugin” beside top heading.
– Drag and drop plugin zip file.

There is a really good non-official step-by-step video tutorial on https://www.youtube.com/watch?v=H7Hj4jfMDik

= Shorcode =
In order to have Appointments form in your Page or Post insert following shortcode
<code>
[ea_standard]
</code>

For **NEW** bootstrap version :
<code>
[ea_bootstrap]
</code>

Options :

width : default value 400px
scroll_off : default value off
layout_cols : default value 1

example : [ea_bootstrap width="800px" scroll_off="true" layout_cols="2"]

== Frequently Asked Questions ==

= How to set custom cron task for clearing reserved slots =
Create cron task on your host that have this link : `wget -q -O - <STIE_URL>/?_ea-action=clear_reservations > /dev/null 2>&1` . This will delete all reservations older than 6min.

= How to translate labels = 

Form labels can change in settings page but if you want to translate rest of it you need to create translation file. Here is video tutorial for that : <a href="https://www.youtube.com/watch?v=yOnta9_Ysno"> Screencast </a>

= How to hide service / location / worker in front end part of form? =

To do this you must create one location / worker or service and set Name that starts with underscore. For example : *_dummy*, *_location*...

= In admin panel all pages from plugin are blank? =

You have probably turned on option in PHP called asp_tags, you need to turn it off in order to plugin work properly.

= I can't edit or delete any settings? =

Your hosting is probably blocking HTTP PUT and DELETE method. You must mark option called 'Compatibility mode' in settings.

= How to set multiple slots for one combination of location, service, worker? =

To add more slots per (location, service, worker) combination just clone the existing one. For two slots you need to
have that connection twice.

= How to insert Easy Appointments widget on Page/Post? =

Place following shortcode into your Page/Post content:

<code>
[ea_standard]
</code>
OR
<code>
[ea_bootstrap]
</code>

For bootstrap there are options :
width : default value 400px
scroll_off : default value off
layout_cols : default value 1

Example :
`[ea_bootstrap width="800px" scroll_off="true" layout_cols="2"]`

= How to set form in two columns? =

You can set bootstrap form in two columns with `layout_cols` option. Example :

<code>
[ea_bootstrap width="800px" scroll_off="true" layout_cols="2"]
</code>

= How to create calendar only for one worker / service / location =
If you want to have separate calendars base on worker for example. You can do that by setting default worker inside short code.
`[ea_bootstrap worker="1"]`
Value is worker #id number. Examples :

`[ea_bootstrap worker="1"]`
`[ea_bootstrap worker="1" location="1"]`
`[ea_bootstrap worker="1" location="1" service="1"]`

Note: you can have only one calendar on one page.

== Screenshots ==

1. Responsive front end shortcode `[ea_bootstrap]` - part1
2. Responsive front end shortcode `[ea_bootstrap]` - part2
3. Responsive front end two column `[ea_bootstrap layout_cols="2"]` - part1
4. Responsive front end two column `[ea_bootstrap layout_cols="2"]` - part2
5. Standard front end form for Appointment `[ea_standard]`
6. Full Calendar short code
7. Admin panel - Appointments list
8. Admin panel - Settings Location. Define your Locations
9. Admin panel - Settings Services. Define your Services
10. Admin panel - Settings Workers. Define your Workers
11. Admin panel - Settings Connection. Set single combination for location, service, worker
12. Admin panel - Settings - Bulk connection creation
13. Admin panel - Settings - Customize General
14. Admin panel - Settings - Customize - Email notifications / templates
15. Admin panel - Settings - Customize - Custom labels
16. Admin panel - Settings - Customize - Date & Time format
17. Admin panel - Settings - Customize - Custom fields
18. Admin panel - Settings - Customize - Google Captcha
19. Admin panel - Settings - Customize - Custom styles and redirects
20. Admin panel - Settings - Customize - GDPR
21. Admin panel - Settings - Customize - Money format
22. Admin panel - Tools page
23. Admin panel - Report
24. Admin panel - Report - Time table overview
25. Admin panel - Report - Export page

== Changelog ==

= 3.2.4 (2021-01-19) =
* Added values for cancel and confirm links to FullCalendar event template

= 3.2.3 (2021-01-10) =
* Added Id column to Locations, Services and Workers admin page

= 3.2.2 (2021-01-04) =
* Fixed issue with editing services and missing values in form

= 3.2.1 (2020-12-28) =
* Compatibility with older WP versions (before 5)

= 3.2.0 (2020-12-27) =
* Admin - new settings pages for Locations, Workers and Services
* Updated translations
* Fixed issue with error warning on cron execution

= 3.1.4 (2020-12-08) =
* Translation files updated

= 3.1.3 (2020-12-07) =
* Fixed issues with masked field when you are not logged in.

= 3.1.2 (2020-12-04) =
* Added new field type - Masked input field. Now you can create your own format of input field. Useful for area code, phone numbers etc.

= 3.1.1 (2020-11-29) =
* Fixed issue with missing image resources on vacation screen

= 3.1.0 (2020-11-29) =
* Added Vacation settings in Admin panel. Now you can select vacation days for employees that will be block on `ea_bootstrap` shortcode.

= 3.0.15 (2020-11-22) =
* Added option for fullcalendar shortcode to select current logged employee `worker="logged"`
* Improved Service/Location/Worker accessibility via tab key
* Improved styles

= 3.0.14 (2020-11-03) =
* Fixed issue with `captcha` warning message

= 3.0.13 (2020-10-30) =
* Fixed issue with Worker and Location mixed in form

= 3.0.12 (2020-10-29) =
* Fixed Security issues with endpoints

= 3.0.11 (2020-10-23) =
* Fixed issue with PHP NOTICE message on Appointment creation
* Improvements regarding invalid date on Appointments overview

= 3.0.10 (2020-10-21) =
* Admin appointments page now can be navigate via Tab key (edit, clone, delete appointment)

= 3.0.9 (2020-10-20) =
* Fixed issue with label above field that was not working in [ea_bootstrap]
* Fixed issue with German translation and span element

= 3.0.8 (2020-10-16) =
* Fixed small issues JS errors on customers form
* Custom styles are now applied to FullCalendar shortcode as well

= 3.0.7 (2020-10-06) =
* Added GDPR options that auto remove customers data older then 6 months
* Settings improvement
* Block empty start time save for Appointments in Admin Panel

= 3.0.6 (2020-09-27) =
* Small Style improvements

= 3.0.5 (2020-09-21) =
* Added option for custom default label for Select field in [ea_bootstrap] shortcode called `select_placeholder`. Default value is '-'

= 3.0.4 (2020-08-23) =
* Added option for labels above fields for [ea_bootstrap] shortcode
* Added action to delete customers data older then 6 months (gdpr section)

= 3.0.3 (2020-08-08) =
* Added clear log button on EA Settings > Tools page
* Added attribute option for FullCalendar shortcode
* Added Reservation as short term status to default status list
* Added Swedish translation files (thanks to Daniel Moqvist)

= 3.0.2 (2020-07-29) =
* Added `block_days` and `block_days_tooltip` attr for bootstrap shortcode. Now you can add array of days that you want to block on customers form.

= 3.0.1 (2020-07-28) =
* Fixed issue on bootstrap form with `initialCall` error inside console that prevented bookings

= 3.0.0 (2020-07-26) =
* Added template engine for Event preview in FullCalendar short-code. Now you have custom preview and add complex logic like IF-ELSE based on event data, current language etc
* PHP Requirements are now 5.3+!

= 2.14.3 (2020-07-13) =
* Added option for Header customization on full calendar view for month, week, day
* Improvements regarding `fancy-select` issue

= 2.14.2 (2020-07-08) =
* Fixed issue with duplicated custom fields when you re-activate plugin
* Fixed issue when there is `fancy-select` active on page

= 2.14.1 (2020-06-14) =
* Added translatable title to email links prompt page introduced in 2.14
* Updated translation files

= 2.14.0 (2020-06-13) =
* Added option for additional user prompt when using links from email such as ` #link_confirm#, #link_cancel#`. By using this option you will prevent unwanted actions from Mail servers that wants to check every link inside emial.
* Fixed and updated labels and translations

= 2.13.7 (2020-06-08) =
* Fixed small issue introduced in previous release

= 2.13.6 (2020-06-08) =
* Added `Created` column for CSV export
* Improved bootstrap version of form

= 2.13.5 (2020-06-02) =
* Fixed issue with auto select option on bootstrap calendar shortcode

= 2.13.4 (2020-05-24) =
* Added shortcode option to prevent date auto select day when calendar is first step (`ea_bootstrap`)
* Added shortcode option for button label customization for full calendar (`ea_full_calendar`)

= 2.13.3 (2020-05-17) =
* Added new option for FullCalendar shortcode (`time_format`, `display_event_end`)
* Added option to hide price in select field in customers form (shortcode ea_standard ea_bootdstrap)
* Updated Italian translation (thanks to Massimo)

= 2.13.2 (2020-04-28) =
* Fixed issue with Phone field and pre selected country code

= 2.13.1 (2020-04-27) =
* Fixed issue with warning message when user is not logged in.

= 2.13.0 (2020-04-26) =
* NEW - Use current logged in user data sa default value for custom field. Available for bootstrap version of shortcode.

= 2.12.3 (2020-03-28) =
* Fixed issue with missing text field placeholder value in form

= 2.12.2 (2020-03-18) =
* Fixed issue with missing custom form label in templates after save action

= 2.12.1 (2020-03-01) =
* Fixed issue with custom form fields and unicode labels.

= 2.12.0 (2020-02-13) =
* Updated dependencies regarding PHP warning message.

= 2.11.2 (2020-02-12) =
* Fixed issue with missing EMAIL field when editing appointment inside Admin part.

= 2.11.1 (2020-02-06) =
* Removed leading zeros between Country Code and Phone number in customer form when submitted.

= 2.11.0 (2020-01-28) =
* Improved styles for calendar on customers form (bootstrap shortcode)
* Added default country code option for PHONE field type in custom form fields

= 2.10.2 (2020-01-12) =
* Added option for removing line breaks from shortcode template. Prevents wpautop

= 2.10.1 (2020-01-07) =
* Small Fix for connections slot number

= 2.10.0 (2020-01-05) =
* Added option for slot count on connection level. Now you don't need to have same connections to increase number of slots, just alter that value on connection level
* Now you can override booking overview template inside you theme under (`theme-folder/easy-appointments/booking.overview.tpl.php`)
* Added option for making FullCalendar shortcode public
* Added confirm popup for deleting appointments
* Small style improvements

= 2.9.2 (2019-12-23) =
* Fixed issue with mail error that prevented sending confirmed message to user
* Added new email template options for image and media

= 2.9.1 (2019-12-14) =
* Fixed issue with time in customers mail

= 2.9.0 (2019-12-13) =
* Improvements regarding date time formatting inside email notifications. Fixed issue with different time in appointment and mail.

= 2.8.2 (2019-12-04) =
* Improvements regarding confirm and cancel link in notification emails

= 2.8.1 (2019-11-25) =
* Added additional filters and events

= 2.8.0 (2019-11-18) =
* Added support for blocking times before/after appointments. Now you can set blocking time after/before appointment. For example if you are doing some cleaning or need to travel to next appointment etc.
* Improved responsive design for FullCalendar short code

= 2.7.1 (2019-10-28) =
* Additional improvement to full calendar short code. If Location, Worker or Service id is not defined it will show all.

= 2.7.0 (2019-10-27) =
* Short code for full calendar

= 2.6.0 (2019-10-01) =
* Added sorting option on Appointments page in admin panel. Now you can sort by Id, Date&Time and Creation time both Asc and Desc.

= 2.5.9 (2019-09-29) =
* Improved mail content - wrapped under html tags if there is none

= 2.5.8 (2019-08-28) =
* Remove Google reCaptcha after booking

= 2.5.7 (2019-08-12) =
* New style for Reports pages
* FullCalendar improvements

= 2.5.6 (2019-08-04) =
* Fixed issue with wrong time date format on FR localization
* Preparation for FullCalendar widget for Workers

= 2.5.5 (2019-06-26) =
* Fixed issue with selecting time slots that are not connected.

= 2.5.4 (2019-06-23) =
* Small improvements on how free slots are calculated
* Translation template update

= 2.5.3 (2019-06-19) =
* New icons and design improvements

= 2.5.2 (2019-06-17) =
* Improved Styles in Admin section
* Escaped mail address input fields inside Admin customize page
* Added CURL support for Google Captcha

= 2.5.1 (2019-06-11) =
* Style and JS cache buster based on plugin version
* Fixed issue with custom fields

= 2.5.0 (2019-06-09) =
* New design for EA Settings Customize page.

= 2.4.4 (2019-06-03) =
* Added custom redirect based on selected Service. Now user can be redirected to a page based by service after booking.

= 2.4.3 (2019-05-16) =
* Fixed bug with API endpoint registration

= 2.4.2 (2019-05-12) =
* New custom field type *email* . Now you can add multiple email fields to customers form for booking appointments. Notification emails will be sent to all of those addresses.

= 2.4.1 (2019-05-05) =
* New short code for full calendar widget - ALFA

= 2.4.0 (2019-03-06) =
* Added option for Google reCAPTCHA v2 in customers form

= 2.3.12 (2019-02-04) =
* Fixed issue with missing Meta Field value (for example like transaction id value)

= 2.3.11 (2019-01-14) =
* Added option for showing week number inside Customers DatePicker ( `show_week="1"` )

= 2.3.10 (2019-01-09) =
* Improved style of bootstrap customers form (shortcode `ea_bootstrap`)

= 2.3.9 (2018-11-26) =
* Fixed issue with Export to CSV and wrong data in column
* Added new field type for custom form fields ( Phone ) field - only for Bootstrap version shortcode ATM
* Added Greek Translation thanks to Perry

= 2.3.8 (2018-10-25) =
* Update translation
* Added template tags for `Cancel` and `Confirm` URL
* Style improvements

= 2.3.7 (2018-08-26) =
* Added options for Sorting Location, Services and Workers for both customers form and Admin section

= 2.3.6 (2018-08-12) =
* Added Placeholder option for Custom Input fields

= 2.3.5 (2018-07-29) =
* Translation update
* Localization for DateTime in Overview section
* Added additional filters for customers email template

= 2.3.4 (2018-07-06) =
* Translation update
* Added option to turn off customers form auto population from previous Appointments data

= 2.3.3 (2018-06-11) =
* Fixed issue with split time for services and time selection in form
* Mail templates with escaped fields
* Improved bot detection for mail links for confirm and cancel appointments

= 2.3.2 (2018-06-02) =
* Fixed styles and word wrap for GDPR link text
* Added minDate and maxDate for calendar on customers form. Now you can set time span that can be selected for appointment.

= 2.3.1 (2018-05-22) =
* EU GDPR - checkbox and admin section with customize option such as label, error message, link to page with content

= 2.3.0 (2018-05-12) =
* Fixed issue with Events Calendar plugin that prevent activation of EasyAppointments

= 2.2.4 (2018-04-18) =
* Fixed issue with missing settings notification on user form even if settings are fine

= 2.2.3 (2018-04-17) =
* Fixed issue with slot step and case when price is hidden in customers form

= 2.2.2 (2018-04-16) =
* Fixed issue with selecting time slot

= 2.2.1 (2018-04-15) =
* Fixed issue with slot step value

= 2.2.0 (2018-04-15) =
* NEW - Custom slot step for customers
* Added additional callback filters
* Style improvements
* Additional check for bots on confirm/cancel appointment via email link

= 2.1.4 (2018-03-18) =
* Added option for nonce in customers form

= 2.1.3 (2018-03-11) =
* Fixed issue with custom fields and html tags in it
* Fixed issue with cyrillic labels and custom fields

= 2.1.2 (2018-03-07) =
* Added bot/crawler check for mail confirm/cancel link action

= 2.1.1 (2018-03-06) =
* Fix for custom styles that was not displaying

= 2.1.0 (2018-03-04) =
* Added option for custom columns and order in CSV export for excel
* Fixed small issues

= 2.0.1 (2018-02-18) =
* Issue with PHP ASP tags turned on - message notification
* Fixed issue with missing connection inside settings

= 2.0.0 (2018-01-31) =
* Fixed issue with wrong columns in exported CSV
* Added support for Events that are more then one day long (backend)

= 1.12.7 (2018-01-21) =
* Improved error notifications inside customers form
* New translations (BR & SK)

= 1.12.6 (2018-01-14) =
* Added additional filter for mail attachments

= 1.12.5 (2018-01-05) =
* Fixed issue with loading options on Settings Customize page

= 1.12.4 (2017-12-03) =
* Added option for auto populate filed from url params that match custom fields.

= 1.12.3 (2017-11-14) =
* Fixed issue with custom fields that were not visible on settings page
* Improved predefined values for bootstrap shortcode. Now only possible combinations are presented to the customers

= 1.12.2 (2017-11-4) =
* Fixed issue with WordPress 4.8.3 and options that didn't load on customers form (location, services and workers)

= 1.12.1 (2017-11-3) =
* Fixed issue with missing Connections page and not loading the services
* Fixed issue with bulk creation of Connections

= 1.12.0 (2017-10-16) =
* Security fix in admin panel - now only user with `manage_options` capability can see Settings and Report page in menu and alter settings regarding EasyAppointments. Settings values are escaped preventing users to add malicious values. (big thank you goes to Ricardo Sanchez for this one)

= 1.11.7 (2017-10-05) =
* Moved CDN files to local folder inside plugin
* Fixed issue with email template editor that was auto-fixing local urls

= 1.11.6 (2017-10-01) =
* Additional callbacks (when customer make appointment, new appointment created)
* New short-code attribute for showing remaining slots. Example `[ea_bootstrap show_remaining_slots="1"]` or `[ea_standard show_remaining_slots="1"]`

= 1.11.5 (2017-08-27) =
* Improved Location/Service/Worker filter selection on Appointments page in admin section.
* Admin Appointments page has new sort by name for Locations, Services and Workers
* Updated German translation (thanks to Joerg)
* Fixed style issue with white space between field on some sites
* Fixed issue with unwanted scroll on page load

= 1.11.4 (2017-08-14) =
* Fixed small issue with formatting

= 1.11.3 (2017-08-13) =
* Improved Date/Time formatting on Appointments page in admin section
* Improved Location/Service/Worker selection on Appointments page in admin section. Now user can only select valid combination of Location, Service and Worker.

= 1.11.2 (2017-08-04) =
* Fixed issue with removed default editor so now customize page can work even if tinyMCE is turned off for the whole site.

= 1.11.1 (2017-07-30) =
* Added additional filter `ea_can_make_reservation` callback

= 1.11.0 (2017-07-22) =
* Added support for custom field translations via PO/MO translation files
* Fixed issue with empty Customize tab in settings
* Fixed smaller issues

= 1.10.6 (2017-07-20) =
* New - Custom admin notification emails. Now you can create custom mail template for Admin users

= 1.10.5 (2017-07-16) =
* Tools - Added test email section
* Fixed translation on settings page
* Smaller improvement

= 1.10.4 (2017-07-09) =
* Improved error handling in customers form
* Added additional name for email custom field ("e-mail") that will be used for sending the email
* Fixed issue with email notification for the customers

= 1.10.3 (2017-06-12) =
* Added HTML source editor for email notifications
* Fixed issue with service and currency within select field
* libs update - Fixed collision with `The Events Calendar`

= 1.10.2 (2017-05-28) =
* Fixed issue with datetime format on front end overview (typo)
* Fixed issue with missing localStorage on loading form data for customers

= 1.10.1 (2017-05-21) =
* Added new custom event on Appointment creation so you can connect tracking code like GoogleAnalytics etc

= 1.10.0 =
* Added *Bulk* connection creation. Now it's possible to create multiple connections with one click
* Added currency position option (before price)
* Added short code options for default selected date in customers form calendar
* Added Arabian translation (thanks to Abdulwahab)

= 1.9.28 =
* Fixed bug with missing submit button inside standard form

= 1.9.27 =
* Fixed issue with custom fields that sometimes didn't show up after opening customize page inside settings
* Added aditional filters

= 1.9.26 =
* Fixed bug with latest release

= 1.9.25 =
* Fixed conflict with Polylang plugin

= 1.9.24 =
* improvement of ajax calls from front end form

= 1.9.23 =
* Fix for form overlay
* Added validation for settings
* Fix for auto focus to next field
* Small improvements
* Hungarian translation thanks to Tibor

= 1.9.22 =
* Fix for empty customize settings page

= 1.9.21 =
* Fix for fatal error on PHP 5.2

= 1.9.20 =
* RTL - switched places in booking overview for label and value
* Now admin email is also send if the Appointment has been changed in backend and option **Send email notification** marked
* Better Accessibility - key navigation for selecting time on customer form

= 1.9.19 =
* Small css improvement
* Right-To-Left option improvement

= 1.9.18 =
* Version bump

= 1.9.17 =
* Fix - Date/Time formatting on Overview section based on General settings. Using MomentJS
* Additional filters

= 1.9.16 =
* NEW - Right-To-Left option for bootstrap version of form
* French translation thanks to Philippe

= 1.9.15 =
* Removed slashes from custom form fields value

= 1.9.14 =
* Portuguese translation thanks to Antonio
* Minor bug fix

= 1.9.13 =
* Finnish translation thanks to Maija

= 1.9.12 =
* Start of week now depends of General Settings for the front end form. If you want to override that but not change settings use short code attribute `start_of_week`.

= 1.9.11 =
* Small bug fixes
* Fixed issue with possible double booking on front end
* Price as decimal number

= 1.9.10 =
* Bug fix: connection clone option didn't copy "date to" value

= 1.9.9 =
* Small change on email links

= 1.9.8 =
* Improved loading of select options in front end
* Default data

= 1.9.7 =
* WYSIWYG Editor for email notifications - clear undo/redo list after selecting status email
* Change in selecting time from connections. Now it will include both start date and end date in calculation.

= 1.9.6 =
* Responsive layout for Appointments Admin page

= 1.9.5 =
* New options - send admin email to employee (worker)
* WYSIWYG editor for email notifications

= 1.9.4 =
* Max length on input / textarea filed
* Bug fix - error log

= 1.9.3 =
* Bug fix - Report page wasn't visible in some cases
* Settings > Tools - New error log list view

= 1.9.2 =
* Bug fix - refreshing bootstrap calendar
* Bug fix - selecting services on frontend

= 1.9.1 =
* Customers form store values between appointments
* Speed improvements
* Fix issue with empty customize apge

= 1.9.0 =
* New core architecture
* Polish translation (thanks to Maciej Bauza)

= 1.8.17 =
* Improved DateTime format in email notifications
* Improved styles for Bootstrap form on small resolutions
* Update of German translation (thanks to Matthias)

= 1.8.16 =
* Standard short code - added scroll_off option from bootstrap version
* Admin notification email - added links for confirm and cancel appointment
* Fix - issue with PHP version 5.2
* Fix - localization script prevent from loading Reports page

= 1.8.15 =
* Fix - issue with form validation that was blocking submit
* Fix - issue with confirm / cancel links
* Email tag #location# is now #location_location# due to name conflict

= 1.8.14 =
* Support for bootstrap short code - create dedicated calendar for single Location / Service / Worker
* Clone button inside Appointments page - now you can clone existing appointments
* New option for default status of newly created appointment by visitor. If you want to place it under confirmed right away

= 1.8.13 =
* Added new email tags : #service_duration#, #service_price#, #worker_email#, #worker_phone#, #location_address#, #location#

= 1.8.12 =
* Fix for editing appointment for non EN translations
* Added new option for making appointment at end of form subbmition if you want to avoid making reservation at selecting date/time

= 1.8.11 =
* New quick filter on appointments page - filter out appointments for this month, week, day
* Improved links for cancel and confirm appointment
* Sending mails to admin for cancel and confirm appointments

= 1.8.10 =
* Fixed issue with non translateble email error notification for frontend form
* Add new pot file for translations. In previous version there was missing translations for confirm and cancel link message from email.
* Fixed issue with double email
* Fixed issue with missing email notifications after hitting confirm or cancel link from email

= 1.8.9 =
* Fixed bug with making last reservation on current day that blocks other slots for that day
* Email notification for confirm link action
* Separate cron capability for deleting reservation that are not completed. See FAQ for details

= 1.8.8 =
* New option for user email notification: Link for confirm and cancel appointment
* NL translation thanks to Renate

= 1.8.7 =
* Fixed - all slots seems to be busy when translation has been used (not english version). If you had this problem plase edit all connections and reselect days in week/
* Fixed - HTTPS problem on front end, now JS files use same protocol as current page.
* Added translation for status in email notifications


= 1.8.6 =
* Fixed - Autoselect for Appointments
* Fixed - Admin notification email for time (00:00)
* Spanish and Galician translations - thanks to Kike

= 1.8.5 =
* Bug fix - unistall

= 1.8.4 =
* Fix for double click on edited row
* Autoselect for Appointments
* New translation file thanks to Vlad and Matthias (RO and DE)
* Fix autoloader for PHP <5.3
* Small fixes

= 1.8.3 =
* Block time now works for all day not only for current day
* Overview report default selection if there is only one option
* Autoloader, supports only PHP 5.3 or greater

= 1.8.2 =
* Fixed bugs with big phone numbers
* Formating date/time field in admin notifications

= 1.8.1 =
* New option for max number of reservations by one visitor during one day before alert is shown.
* Formating of date/time fields in notification emails. It is using site settings for that (*Settings > General*)
* Small fixes for two column layout form

= 1.8.0 =
* New report - Export data
* Time window for making appointment. You can block user from creating appointment just before that Appointment time. For example set that visitor must be two hours before actual time of appointment.
* Customization of subject for visitor notification email
* Auto delete of reservation that are not completed (this is done on every hour)

= 1.7.1 =
* Bug fix for start day of week. This is now depend on **Calendar localization**
* New option to turn off css files from being included in front-end form
* New option for redirect after creating appointment (2 second timeout before redirect)

= 1.7.0 =
* New option for subject of email admin notification
* New option for "Send form" email notifications
* Unistall script. Now after uninstall database tables of plugin will be removed
* Bug fix for extended time for appointment after editing in admin panel

= 1.6.0 =
* Fix issue with activating the plugin and error output
* UTF8 email encoding
* Option for turning of Location/Services/Worker by setting dummy records. Set name that starts with underscore (for example :*_dummy*).

= 1.5.2 = 
* Compatibility mode for hostings that are blocking PUT and DELETE methods

= 1.5.1 =
* Fix bug with sending email notification
* Fix bug with filtering appointments in Admin panel
* New options for worker, before free slots are calculated only for current service type. Now you can calculate free slots for all services for that worker

= 1.5.0 = 
* Custom form fields
* Fix bug with new year and date selection in calendar
* Fix issue with wrong time after creating appointment in admin panel

= 1.4.1 = 
* Fix bug with status change and email notification in admin panel

= 1.4.0 =
* Calendar in bootstrap form now shows the free days and days with out free slots
* Improved scroll to after cancel option
* Fix bug with clone button in settings/connection

= 1.3.0 =
* New options for cancel button and scroll
* I agree option for form

= 1.2.11 =
* Fix install

= 1.2.10 =
* Fix bug with fresh install and customize page of settings

= 1.2.9 =
* Fix for bug on editing location/service/worker that delete connection.
* New option is customize tab : custom css field
* Minor css improvement

= 1.2.8 =
* Option for sending user email after completing the form on frontend

= 1.2.7 = 
* Fix bug with Media item in menu
* Ajax spinner
* Added rows class attributes for overview on bootstrap form

= 1.2.6 =
* Bootstrap widget improvement: scroll_off option, two column layout, custom width value.

= 1.2.5 =
* Fix bootstrap issue that change style on whole page
* New tags for email notification
* Improved style of new appointment notification

= 1.2.4 =
* Localization of datepicker for 77 different languages
* Fix issue with phone that starts with 0

= 1.2.3 =
* Fix translations issue, not including mo files
* Fix bug with db update in 1.2.2 version

= 1.2.2 = 
* Fix timezone issue for current day
* Fix translations issue
* Price field in booking overview
* Database changes (force reference integrity)

= 1.2.1 =
* Included label translation functions
* Fix : init scroll

= 1.2.0 =
* New shortcode for bootstrap version of frontend form `[ea_bootstrap]`

= 1.1.1 =
* Fix : select all days in a week
* Improved styles

= 1.1 =
* Improved styles and overview form
* Translations : done message
* Notification to custom email on pending appointment
* Fix scroll for date/time change

= 1.0 =
* First release

== Upgrade Notice ==

= 1.8.3 =
* Autoloader, supports only PHP 5.3 or greater!

= 1.6.0 =
* Please update if you are experiencing problems with AJAX naming collision

= 1.5.2 =
* If you can't edit or delete items on settings page please update this version. After update mark Compatibility mode option in settings.

= 1.5.1 = 
* Please update to new version, there are bugs on 1.5 with email notifications.

= 1.5.0 =
* Please check if there are all fields with appointments

= 1.4.1 =
* Please update plugin to fix bug with email notifications on status change

= 1.4.0 =
* Calendar in bootstrap form now shows the free days and days with out free slots
* Improved scroll to after cancel option
* Fix bug with clone button in settings/connection

= 1.3.0 =
* New options

= 1.2.11 =
* Fix install

= 1.2.10 = 
* If you have fresh install of 1.2.9 (not upgrade from previous versions), there is problem with customize page of settings. This version have fix for it.

= 1.2.9 =
* * Fix for bug on editing location/service/worker that delete connection

= 1.2.8 =
* Option for sending user email after completing the form on frontend

= 1.2.7 = 
* Fix bug with Media menu item that is missing

= 1.2.6 =
* Bootstrap widget improvement: scroll_off option, two column layout, custom width value.

= 1.2.5 =
* Please check bootstrap widget if you using it. There has been changes on style part.

= 1.2.4 =
* Localization of datepicker for 77 different languages
* Fix issue with phone that starts with 0

= 1.2.3 =
* Fix translation issue with mo files. In order to use localization, place *.mo files into languages dir inside plugin dir.
* Fix bug with db update in 1.2.2 version.

= 1.2.2 =
* Please take upgrade with great care. There has been database changes regarding reference integrity of data. So upgrade will remove appointments/connections that don't have some key value (location, worker, service).

= 1.2.1 = 
* Fixed init scroll

= 1.2.0 =
* New Responsive layout shortcode.


== Feature requests ==

This is list of all features that will be added at some point of time :

* Multi select slots (select more than one slot at time)
* Whole day selection (for example if you are renting something on daily basis)
* County field in Location along with improved dropdown selection

