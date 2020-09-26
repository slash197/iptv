<?php

require_once('base.php');

$cust = new Base($_GET['CI']);
$cust->validate();

?>