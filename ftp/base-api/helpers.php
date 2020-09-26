<?php 
/**
 * @functions helpers
 */

function get_product($userid){
	global $db;
	$sql="SELECT p.* FROM products p
		  JOIN customers c on p.id=c.product_id
	      WHERE c.id='$userid'";
	$result  = $db->query($sql);

	if($result->num_rows>0)
		return mysqli_fetch_object($result);
	else
		return false;
}

function get_product_location($product_id){
	global $db;
	$sql="SELECT p.*, sli.url FROM products p
		  JOIN server_location_items sli on p.server_id=sli.server_id
	      WHERE p.id='$product_id' AND sli.name='product_location'";
	$result  = $db->query($sql);

	if($result->num_rows>0)
		return mysqli_fetch_object($result);
	else
		return false;
}

function get_channel_packages($user_id){
	global $db;
	$sql="SELECT channel_package_id FROM customer_to_channel_packages
	      WHERE customer_id='$user_id'";
	$result  = $db->query($sql);
	$ids=array();
	while ($row=mysqli_fetch_object($result)){
		$ids[]=$row->channel_package_id;
	}

	return $ids;

}

function get_movie_stores($user_id){
	global $db;
	$sql="SELECT movie_store_id FROM customer_to_movie_stores
	      WHERE customer_id='$user_id'";
	$result  = $db->query($sql);
	$ids=array();
	while ($row=mysqli_fetch_object($result)){
		$ids[]=$row->movie_store_id;
	}

	return $ids;
}

function get_series_stores($user_id){
	global $db;
	$sql="SELECT series_store_id FROM customer_to_series_stores
	      WHERE customer_id='$user_id'";
	$result  = $db->query($sql);
	$ids=array();
	while ($row=mysqli_fetch_object($result)){
		$ids[]=$row->series_store_id;
	}

	return $ids;
}

function get_music_categories($user_id){
	global $db;
	$sql="SELECT music_category_id FROM customer_to_music_categories
	      WHERE customer_id='$user_id'";
	$result  = $db->query($sql);
	$ids=array();
	while ($row=mysqli_fetch_object($result)){
		$ids[]=$row->music_category_id;
	}

	return $ids;
}

function ipAddress() {
	if(isset($_SERVER["HTTP_CF_CONNECTING_IP"])){
            //If it does, assume that PHP app is behind Cloudflare.
            $ipAddress = $_SERVER["HTTP_CF_CONNECTING_IP"];
        } else{
            //Otherwise, use REMOTE_ADDR.
            $ipAddress = $_SERVER['REMOTE_ADDR'];
        }
	return $ipAddress;
}

function checkuser($username, $password){
	global $db;
	$password = base64_encode($password);

	$sql="SELECT c.*,ct.name city,co.name country FROM customers c
		  JOIN cities ct on c.billing_city=ct.id
		  JOIN countries co on c.billing_country=co.id
	      WHERE c.username='$username' AND c.password='$password'";
	$result = $db->query($sql);
	if($result->num_rows>0)
		return mysqli_fetch_object($result);
		else
			return false;
}


function check_already_exist($customer_id,$uuid, $model){
	global $db;
	$sql="SELECT * FROM customer_to_devices 
	      WHERE uuid='".$uuid."' AND model='".$model."' AND customer_id='$customer_id'";
	$result  = $db->query($sql);

	if($result->num_rows>0)
		return true;
	else
		return false;
}

function get_devices($userid){
	global $db;
	$sql="SELECT cd.* FROM customer_to_devices cd
		  LEFT JOIN customers c on c.id=cd.customer_id
	      WHERE cd.customer_id='$userid'";
	return $result  = $db->query($sql);
}


function check_if_any_expired_devices($userid){
	global $db;
	
	$sql="SELECT * FROM customer_to_devices 
	      WHERE customer_id='$userid' AND valid <= '".time()."' LIMIT 1";
	
	$result  = $db->query($sql);
	return $result;
}


function insert($table,$data){
	global $db;
	$fields  = implode(',', array_keys($data));
    $values  = implode("','", array_values($data));
    $values = "'".$values."'";
    $sql = "INSERT INTO ".$table."(".$fields.") Values "."(".$values.")";
	$result = $db->query($sql);
	if($result){
    	return true;
	} else {
    	return false;
	}
}

function update($table,$data,$uuid){
	global $db;
    $set_statement="";
    foreach ($data as $key => $value) {
    	 $set_statement.=$key ."='". $value."',";
    }

    $sql = "UPDATE ".$table." SET ".rtrim($set_statement,',')." WHERE uuid='".$uuid."'";
	$result = $db->query($sql);
	if($result){
    	return true;
	} else {
    	return false;
	}
}

function delete_device($table,$data_array){
	global $db;
	$field  = implode(',', array_keys($data_array));
    $value  = implode(",", array_values($data_array));
	$sql = "Delete from ". $table. " where ". $field ."='".$value."'";
	$result = $db->query($sql);
	if($result){
    	return true;
	} else {
    	return false;
	}
}

function get_aes_encrypt_key(){
	global $db;
	$sql="SELECT value FROM settings
		  WHERE slug='aes_encrypt_key'";
	$result  = $db->query($sql);
	$row=mysqli_fetch_object($result);
	return hex2bin($row->value); 
}

function encrypt($data, $add_character){ 
	if ($add_character){
		$random_code = substr(md5(uniqid(mt_rand(), true)) , 0, $add_character);
	}
    $key = get_aes_encrypt_key();
	 $data= str_replace(' ','+',$data);
  return $random_code . base64_encode(openssl_encrypt($data, 'AES-128-ECB', $key, $options = OPENSSL_RAW_DATA, $iv = ''));
}

function decrypt($data, $remove_character){  
	if ($remove_character){
		$data=substr($data,  $remove_character);
	}
   $key = get_aes_encrypt_key();
   $data= str_replace(' ','+',$data);
	return openssl_decrypt(base64_decode($data), 'AES-128-ECB', $key, $options = OPENSSL_RAW_DATA, $iv = '');
}


function getCountry($countryname){
	global $db;
	
	$sql="SELECT id FROM countries
	      WHERE name='$countryname'";
	$result = $db->query($sql);
	if($result->num_rows>0)
		return mysqli_fetch_object($result);
		else
			return false;
}

function uploadToServer($filename,$localFilePath,$remoteFilePath){
	// FTP server details
	$ftp_host   = 'ftp.ams.9662C.etacdn.net';
	$ftp_username = 'vissionent+3iptv@gmail.com';
	$ftp_password = '12k-skkw-2WEE_MAS';

	// open an FTP connection
	$conn_id = ftp_connect($ftp_host) or die("Couldn't connect to $ftp_host");

	// login to FTP server
	$ftp_login = ftp_login($conn_id, $ftp_username, $ftp_password);

	// local & server file path
	$remoteFilePath = '/gomiddleware/'. $remoteFilePath.'/'.$filename;
	
	//move_uploaded_file ($filename , $localFilePath);
	// try to upload file
	if(ftp_put($conn_id, $remoteFilePath, $localFilePath, FTP_BINARY)){
	   // echo "File transfer successful - $localFilePath";
	}else{
	    //echo "There was an error while uploading $localFilePath";
	}
	// close the connection
	ftp_close($conn_id);
}
?>