<?php

require_once('../../db-connection.php');
require_once('../../helpers.php');

class Devices{
	public function logoutDevice(){
        $userid=$_POST['userid'];
        $password=$_POST['password'];
        $user=checkuser($userid,$password);
		
 if($user){
            // check if uuid and model already exist 
            $rslt=check_already_exist($user->id,$_POST['uuid'],$_POST['model']);
            if($rslt){ // if exist  
                // update the valid time------
                $data=array('valid'=>time()
						 // 'last_used'=>time()
						   );
                $result=update('customer_to_devices',$data,$_POST['uuid']);
                if($result){
                    $return['status'] = 'success';
                    $return['code'] = 301;
                    $return['message'] = "Device successfully logout";
                    echo json_encode($return); 
            		}
				
				else{
                	$error['status'] = 'error';
                	$error['code'] = 500;
                	$error['message'] = "Couldn't logout device";
                	echo json_encode($error);
            		}
				}
 			}
	else{
            $error['status'] = 'error';
            $error['code'] = -2;
            $error['message'] = "Invalid user credentials";
            echo json_encode($error);
        }
	}
}
		
    
?>