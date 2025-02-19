
<?php
$nombre = $_POST['nombre'];
$apellidos = $_POST['apellidos'];
$telefono = $_POST['telefono'];
$email = $_POST['email'];
$mensaje = $_POST['comentarios'];
$para = 'contacto@flechaextreme.com';
$titulo = 'Formulario Flecha Extreme';
$header = 'From: ' . $email;
$msjCorreo = "Nombre: $nombre\n Apellidos: $apellidos\n Telefono: $telefono\n E-Mail: $email\n Mensaje:\n $mensaje";

if ($_POST['submit']) {
if (mail($para, $titulo, $msjCorreo, $header)) {
echo "<script language='javascript'>
alert('Mensaje enviado, muchas gracias.');
window.location.href = 'http://www.flechaextreme.com';
</script>";
} else {
echo 'Falló el envio';
}
}
?>