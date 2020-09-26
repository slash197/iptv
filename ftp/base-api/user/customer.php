<?php
/**
 * @class Customer
 * @author  Sunil Dongol <sunil.dongol@gmail.com>
 */

require_once('../db-connection.php');
require_once('../helpers.php');

class Customer{
    private $encrypted_key;
    public function __construct($uri_key){
        $this->encrypted_key= $uri_key;
    }

    public function validate(){
        $first2Character='JP';
        $key = hex2bin("5ad87aa3275ec183426d439f66398b94"); //from database

        $CI = $this->encrypted_key;
        $CI= str_replace(' ','+',$CI);

        // remove first 2 character
        if ( substr($CI, 0, 2) == $first2Character){
            $CI=substr($CI,  2);
            $CI = decrypt($CI, $key);

			parse_str($CI,$output);
            $username= $output['id']; 
            $password= $output['pin'];
			
                        
            if(is_numeric($username) and is_numeric($password)){  // check id and pis is numeric to add secur1ty 
                //extract customer id and password and check if they are valid and custommer is allowed
                
                //todo  api to get with ip timezone and other info sample is below
                
                // check user exist 
                // if exist return user's detail else error 
                $user=checkuser($username,$password);
				
                if($user){
					$random_code = substr(md5(uniqid(mt_rand(), true)) , 0, 8);
					$final['CID']= 'JP'.encrypt($random_code, $key);
                    echo json_encode($final, JSON_UNESCAPED_SLASHES);
					
					
					/*
                   $json_return['timezone']='GMT+10';
                    $json_return['city']=$user->city;
                    $json_return['country']=$user->country;
                    $json_return['ua']= $_SERVER['HTTP_USER_AGENT'];
                    //$json_return['time']=time();
					$json_return['time'] = round(microtime(true) * 1000);

                    if(isset($_SERVER["HTTP_CF_CONNECTING_IP"])){
                        //If it does, assume that PHP app is behind Cloudflare.
                        $ipAddress = $_SERVER["HTTP_CF_CONNECTING_IP"];
                    } else{
                        //Otherwise, use REMOTE_ADDR.
                        $ipAddress = $_SERVER['REMOTE_ADDR'];
                    }

                   $json_return['ip']=$ipAddress;
					
					$json_return['EC']="_MKDSJ6I94cpGAzjdu3By5UY6uMybHTleIcJ0qz1dkroVfKKnPRU0r7mVNGoJCYb";
					$json_return['AK']="ak_MKDSJ6I94cpGAzjdu3By5UY6uMybHTleIcJ0qz1dkroVfKKnPRU0r7mVNGoJCYb";
					$json_return['FL']="fl_MKDSJ6I94cpGAzjdu3By5UY6uMybHTleIcJ0qz1dkroVfKKnPRU0r7mVNGoJCYb";
					$json_return['OT']="ot_MKDSJ6I94cpGAzjdu3By5UY6uMybHTleIcJ0qz1dkroVfKKnPRU0r7mVNGoJCYb";
                 
                    $final_json_output = json_encode($json_return, JSON_UNESCAPED_SLASHES);
                   $final['CID']= 'JP'.encrypt($final_json_output, $key);
					// $final['CID']= 'JPll82oOL6aG5BDDYqDclFng==';
                    echo json_encode($final, JSON_UNESCAPED_SLASHES);*/
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