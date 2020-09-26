<?php

require_once('../../db-connection.php');
require_once('../../helpers.php');

class Devices{
  
    public function getDevices(){
		// ********.  collection_key = crm.cms     *****  document_key = id.password
	
		
		$document_key=explode('.', $_POST['document_key']);
		
			
        $username= $document_key[0];
        $password= $document_key[1];

	//	echo "id-->".$username."</br>";
	//	echo "pwd-->".$password;
		
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
}
?>