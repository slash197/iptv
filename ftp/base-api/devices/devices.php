<?php
/**
 * @class Customer
 * @author  Sunil Dongol <sunil.dongol@gmail.com>
 */

require_once('../../db-connection.php');
require_once('../../helpers.php');

class Devices{
  
    public function getDevices(){
        $username=$_GET['userid'];
        $password=$_GET['password'];

        $user=checkuser($username,$password);
        $devices=array();
        if($user){
           $result = get_devices($user->id) ;
           while ($device=mysqli_fetch_object($result)){
                array_push($devices,array('resellerId'=>$device->reseller_id,
                                   'valid'=>$device->valid,
                                   'city'=>$device->city,
                                   'state'=>$device->state,
                                   'country'=>$device->country,
                                   'ip'=>$device->ip,
                                   'type'=>$device->type,
                                   'model'=>$device->model,
                                   'uuid'=>$device->uuid)
                        );
            }
            echo json_encode(array('devices'=>$devices));
        }else{
            $error['status'] = 'failed';
           //$error['code'] = -2;
           // $error['message'] = "Invalid user credentials";
            echo json_encode($error);
        }
    }

    public function addDevice(){
        $userid=$_GET['userid'];
        $password=$_GET['password'];

        $user=checkuser($userid,$password);
        if($user){
            // check how many devices have been added to that customer.
            $result=get_devices($user->id);
            if($result->num_rows<3){
                $data=array('customer_id'=>$user->id,
                            'uuid'=>$_GET['uuid'],
                            'model'=>$_GET['model'],
                            'type'=>isset($_GET['type']) ? $_GET['type'] : "",
                            'city'=>isset($_GET['city']) ? $_GET['city'] : "",
                            'state'=>isset($_GET['state']) ? $_GET['state'] : "",
                            'country'=>isset($_GET['country']) ? $_GET['country'] : "",
                            'reseller_id'=>isset($_GET['reseller_id']) ? $_GET['reseller_id'] : "0",
                            'ip'=>isset($_GET['ip']) ? $_GET['ip'] : "",
                            'valid'=>isset($_GET['valid']) ? $_GET['valid'] : "0",
                            );
                // insert into customer_to_devices
                $result=insert('customer_to_devices',$data);
                if($result){
                    $return['status'] = 'success';
                    $return['code'] = 200;
                    $return['message'] = "Device successfully added";
                    echo json_encode($return);
                }else{
                    $error['status'] = 'error';
                    $error['code'] = 500;
                    $error['message'] = "Couldn't add device";
                    echo json_encode($error);
                }
            }else{
                $error['status'] = 'error';
                $error['code'] = 25;
                $error['message'] = "Customer exceeds the number of devices added i;e 3.";
                echo json_encode($error);
            }
        }else{
            $error['status'] = 'error';
            $error['code'] = -2;
            $error['message'] = "Invalid user credentials";
            echo json_encode($error);
        }
    }

    public function logoutDevice(){
        $userid=$_GET['userid'];
        $password=$_GET['password'];

        $user=checkuser($userid,$password);
        if($user){
            $data=array('uuid'=>$_GET['uuid']);
            $result=delete_device('customer_to_devices',$data);
            if($result){
                $return['status'] = 'success';
                $return['code'] = 200;
                $return['message'] = "Device successfully logout";
                echo json_encode($return);
            }else{
                $error['status'] = 'error';
                $error['code'] = 500;
                $error['message'] = "Couldn't logout device";
                echo json_encode($error);
            }
        }else{
            $error['status'] = 'error';
            $error['code'] = -2;
            $error['message'] = "Invalid user credentials";
            echo json_encode($error);
        }
    }
}
?>