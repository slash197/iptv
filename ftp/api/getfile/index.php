<?php
/**
 * @index 
 * @author  Sunil Dongol <sunil.dongol@gmail.com>
 */

require_once('getfile.php');

$cust = new Getfile($_GET['CI']);
$cust->validate();

?>