<?php
/**
 * @class Customer
 */

require_once('../db-connection.php');
require_once('../helpers.php');



class Customer{
    private $data;
    public function __construct($uri_key){
        $this->data= $uri_key;
    }

    public function validate(){

        $CI = $this->data;
            $CI = decrypt($CI,2);

			parse_str($CI,$output);
            $username= $output['id']; 
            $password= $output['pin'];
			
                        
            if(is_numeric($username)and is_numeric($password)){  // check id and pis is numeric to add secur1ty 
               
				
                $user=checkuser($username,$password);
				
                if($user){
                 ///  $json_return['timezone']='GMT+10';
                 ///  $json_return['city']=$user->city;
                 ///   $json_return['country']=$user->country;
                ///    $json_return['ua']= $_SERVER['HTTP_USER_AGENT'];
				///	$json_return['time'] = round(microtime(true) * 1000);
                  $json_return['ip']=ipAddress();
					$json_return['EC']= ECtokenGenerate($username,$password,ipAddress(),strtotime('+2 day'));
					//$json_return['EC']="_MKDSJ6I94cpGAzjdu3By5UY6uMybHTleIcJ0qz1dkroVfKKnPRU0r7mVNGoJCYb";
					$json_return['AK'] = akamai_generate_token($username,$password,ipAddress(),strtotime('+2 day'));
					$json_return['FL']="fl_iousdfoisd";
					$json_return['OT']="ot_sdfoiow";
                 
                    $final_json_output = json_encode($json_return, JSON_UNESCAPED_SLASHES);
                  
					$final['CID']= encrypt($final_json_output, 2);
                    echo json_encode($final, JSON_UNESCAPED_SLASHES);
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
    
    }
}
?>