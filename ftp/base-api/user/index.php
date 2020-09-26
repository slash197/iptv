<?php
/**
 * @index 
 * @author  Sunil Dongol <sunil.dongol@gmail.com>
 */

require_once('customer.php');

$cust = new Customer($_GET['CI']);
$cust->validate();

?>