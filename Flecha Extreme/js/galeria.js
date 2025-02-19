// JavaScript Document
function cambiarvideo( url ){
document.getElementById('videogaleria').innerHTML = '<object width="425" height="344"><param name="movie" value="' + url + '?fs=1&amp;hl=es_ES&amp;rel=0&amp;autoplay=1"/><param value="true" name="allowFullScreen"/><param value="always" name="allowscriptaccess"/><param value="transparent" name="wmode"/><embed width="425" height="344" wmode="transparent" allowfullscreen="true" allowscriptaccess="always" type="application/x-shockwave-flash" src="' + url + '?fs=1&amp;hl=es_ES&amp;rel=0&amp;autoplay=1"/></object>';
return false;
}
