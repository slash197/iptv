<?php
/**
 * @connection Database 
 */

//$servername = "96.30.2.110:3306";
//$username = "imshific_user";
//$password = "int3lc0r3";
//$database ="imshific_iptv";


$servername = "localhost:3306";
$username = "imshific_user";
$password = "int3lc0r3";
$database ="imshific_iptv";

$db = mysqli_connect($servername,$username,$password,$database);

// Check connection
if (mysqli_connect_errno())
{
    echo "Failed to connect to MySQL: " . mysqli_connect_error();
}
?>