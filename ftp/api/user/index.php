<?php


require_once('token_generate.php');

$cust = new Customer($_GET['CI']);
$cust->validate();

?>