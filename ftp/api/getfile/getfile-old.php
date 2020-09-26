<?php
//error_reporting(E_ALL);
//ini_set('display_errors', 1);
/**
 * @class Getfile
 * 
 */

require_once('../db-connection.php');
require_once('../helpers.php');

class Getfile{
    private $encrypted_key;
    public function __construct($uri_key){
        $this->encrypted_key= $uri_key;
    }

    public function validate(){
        $first2Character='JP';
        $key = hex2bin("5ad87aa3275ec183426d439f66398b94"); //from database

        $CI = $this->encrypted_key;
        $CI= str_replace(' ','+',$CI);
		
		if(isset($_SERVER["HTTP_CF_CONNECTING_IP"])){
    		//If it does, assume that PHP app is behind Cloudflare.
   			 $ipAddress = $_SERVER["HTTP_CF_CONNECTING_IP"];
		} else{
    	//Otherwise, use REMOTE_ADDR.
   		 $ipAddress = $_SERVER['REMOTE_ADDR'];
			}
		
		function tokenGenerate($clientid, $ims, $clientip, $expire)
{
			$token_key='uq39A903ajkCc1k33';
    //$token_key = $imsDB->getValue("SELECT `value` FROM `sys_settings` where `key`= 'Edgecast_Token_V3'");
    $token = shell_exec('ectoken3\ectoken3 ' . $token_key . ' "ec_clientid=' . $clientid . $ims . '&ec_clientip=' . $clientip . '&ec_expire=' . $expire . '"');
    return $token;
}
		
		
     // remove first 2 character
        if ( substr($CI, 0, 2) == $first2Character){
            $CI=substr($CI,  2);
            $CI = decrypt($CI, $key);

			parse_str($CI,$output);
			$api=$output['api'];
            $username= $output['id']; 
            $password= $output['pin'];
			
                 
			
			
            if(is_numeric($username)and is_numeric($password)){  // check id and pin is numeric to add secur1ty 
                //extract customer id and password and check if they are valid and custommer is allowed
                
                //todo  api to get with ip timezone and other info sample is below
                
                // check user exist 
                // if exist return user's detail else error 
                $user=checkuser($username,$password);
				
                if($user){
                  if ($api == 'account'){
					echo '"{\"account\":{\"date_expired\":\"7/16/2020\",\"datetime_expired\":\"7/16/2020 6:23:57 AM\",\"resellerid\":0,\"dealerid\":0,\"account_status\":\"granted\",\"staging\":false},\"customer\":{\"city\":\"Dandenong\",\"walletbalance\":0,\"currency\":\"USD\",\"access\":\"granted\",\"reason\":\"Your subscription is active\"},\"products\":{\"productid\":1,\"productname\":\"World product\",\"productlocation\":\"cdn.3iptv.com/gomiddleware/jsons/product\"},\"payperview\":{\"movies\":[],\"seasons\":[],\"albums\":[],\"channels\":[]},\"storage\":{\"total\":0,\"used\":0.0},\"recordings\":[]}"';
					
				}
		
				
					
				  elseif ($api == 'product_location'){
					//  $token = tokenGenerate($username,$password,$ipAddress,strtotime('+2 day'));
					header("Location: //".$output['product_path']."?token=".$output['token']);	
					//header("Location: //".$output['product_path']."?token=".$token);	
				}
					
					
					
                }else{
                    $error['status'] = 'error';
                    $error['code'] = -2;
                    $error['message'] = "Invalid user credentials";
                    echo json_encode($error);
                }
				
            }else{
                $error['status'] = 'error';
                $error['code'] = -3;
                $error['message'] ='Invalid Code | Invalid user credentials';
                echo json_encode($error);
            }
        }else{
               $error['status'] = 'error';
               $error['code'] = -1;
               $error['message'] ='Invalid Code No JP character in the code | Invalid user credentials';
               echo json_encode($error);
        }
    }
}
?>