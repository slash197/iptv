<?php
class Time{
     public function utime(){
		$microtime = round(microtime(true)*1000);
 		$json_return['status']="true";
		$json_return['time']=$microtime;
     echo json_encode($json_return, JSON_UNESCAPED_SLASHES);
	}
 }
?>