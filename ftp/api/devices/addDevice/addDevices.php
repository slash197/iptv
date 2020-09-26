<?php
require_once('../../db-connection.php');
require_once('../../helpers.php');

class Devices{

    public function addDevice(){ 
        $userid=$_POST['userid'];
        $password=$_POST['password'];
		

        
        $user=checkuser($userid,$password);

        if($user){
            // check if uuid and model already exist 
            $rslt=check_already_exist($user->id,$_POST['uuid'],$_POST['model']);
            if($rslt){ // if exist  
                // update the valid time------
                $data=array('valid'=>strtotime('+2 day'),
						  'last_used'=>time()
						   );
                $result=update('customer_to_devices',$data,$_POST['uuid']);
                if($result){
                    $return['status'] = 'success';
                    $return['code'] = 201;
                    $return['message'] = "Device Updated Successfully";
                    echo json_encode($return); 
                }
            }else{
                // get devices 
                $devices=get_devices($user->id);
                // check number of devices added to that customer
                if($devices->num_rows<$user->devices_allowed){
                    $data=array('customer_id'=>$user->id,
                                'uuid'=>$_POST['uuid'],
                                'model'=>$_POST['model'],
                                'type'=>isset($_POST['type']) ? $_POST['type'] : "",
                                'city'=>isset($_POST['city']) ? $_POST['city'] : "",
                                'state'=>isset($_POST['state']) ? $_POST['state'] : "",
                                'country'=>isset($_POST['country']) ? $_POST['country'] : "",
                                'reseller_id'=>isset($_POST['reseller_id']) ? $_POST['reseller_id'] : "0",
                                'ip'=>ipAddress(),
								'first_used'=>time(),
								'last_used'=>time(),
								 'valid'=>strtotime('+2 day')
                                );
                    // insert into customer_to_devices
                    $result=insert('customer_to_devices',$data);
                    if($result){
                        $return['status'] = 'success';
                        $return['code'] = 202;
                        $return['message'] = "Device Added Successfully";
                        echo json_encode($return);
                    }
                }else{
                    $rslt_expire=check_if_any_expired_devices($user->id);
                    if($rslt_expire->num_rows){
                        // delete expired devices 
                        while($row=mysqli_fetch_assoc($rslt_expire)){
                            $data=array('id'=>$row['id']);
                            $result=delete_device('customer_to_devices',$data);
                            delete_device('customer_to_devices',$data);
                        }
                        // replace 
                        $data=array('customer_id'=>$user->id,
                                'uuid'=>$_POST['uuid'],
                                'model'=>$_POST['model'],
                                'type'=>isset($_POST['type']) ? $_POST['type'] : "",
                                'city'=>isset($_POST['city']) ? $_POST['city'] : "",
                                'state'=>isset($_POST['state']) ? $_POST['state'] : "",
                                'country'=>isset($_POST['country']) ? $_POST['country'] : "",
                                'reseller_id'=>isset($_POST['reseller_id']) ? $_POST['reseller_id'] : "0",
                                'ip'=>ipAddress(),
								'first_used'=>time(),
								'last_used'=>time(),
                                'valid'=>strtotime('+2 day')
                                );
                        // insert into customer_to_devices
                        $result=insert('customer_to_devices',$data);
                        if($result){
                            $return['status'] = 'success';
                            $return['code'] = 203;
                            $return['message'] = "Device Added Successfully";
                            echo json_encode($return);
                        }
                    }else{
                        $error['status'] = 'error';
                        $error['code'] = -205;
                      //  $error['message'] = "Exceed the number of allowed devices";
                        echo json_encode($error);
                    }
                }
            }
        }else{
            $error['status'] = 'error';
            $error['code'] = -209;
            //$error['message'] = "Invalid user credentials";
            echo json_encode($error);
        }
    }
}
?>