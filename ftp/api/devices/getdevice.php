<?php
/**
 * @index 
 * @author  Sunil Dongol <sunil.dongol@gmail.com>
 */

require_once('devices.php');

$device = new Devices();

$device->getDevices();

?>