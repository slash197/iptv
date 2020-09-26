<?php
/**
 * @index 
 * @author  Sunil Dongol <sunil.dongol@gmail.com>
 */

require_once('getdevices.php');

$device = new Devices();

$device->getDevices();

?>