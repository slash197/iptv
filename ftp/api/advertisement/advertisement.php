<?php
/**
 * @class Advertisement
 * @author  Sunil Dongol <sunil.dongol@gmail.com>
 */

require_once('../../db-connection.php');
require_once('../../helpers.php');

class Advertisement{
    public function __construct(){
       
    }
    //endpoint url
    //http://gomiddleware.com/api/advertisement/gethomescreenadvertisementduo?orientation=vertical&userId=16061807&resellerId=0&deviceModel=_WebTV&cmsService=gomiddleware&crmService=gomiddlewareTV&city=Richmond&state=Victoria&country=Australia
    public function displayBanners(){
        global $db;
        $orientation=$_GET['orientation'];
        $userId=$_GET['userId'];
        $resellerId=$_GET['resellerId'];
        $deviceModel=$_GET['deviceModel'];
        $city=$_GET['city'];
        $state=$_GET['state'];
        $countryname=$_GET['country'];

        //get country id from country name 
        $country=getCountry($countryname);
        if($country){
            //get two random banners according to country 
            $sql="SELECT * FROM advertisement 
                  WHERE IF(exclude_country='yes', id NOT IN 
                    (SELECT advertisement_id FROM advertisements_exclude_include_countries
                    WHERE country_id='$country->id' AND exclude=1), 
                   id IN(SELECT advertisement_id FROM advertisements_exclude_include_countries
                    WHERE country_id='$country->id' AND include=1)
                  )
                  AND type='banner'
                  AND gui_position='$orientation'
                  AND ( NOW() BETWEEN date_start AND date_end) 
                  ORDER BY RAND()
                  LIMIT 2";  // 14 Australia 

            $result = $db->query($sql);
            $output=array();
            $i=1;
           
            if(@$result->num_rows>0){
                while($row = $result->fetch_array())
                {
                    $rows[] = $row;
                }
                foreach ($rows as $row) {
                    if($i==2){
                        $output1=array(
                                  "url$i"=>$row['image'],  // banner image url 
                                  "campaignemail$i"=>($row['make_clickable']==1) ? $row['campaign_email'] : "",
                                  "campaigntext$i"=>($row['make_clickable']==1) ? $row['campaign_email_text'] : "",
                                  "campaignstream$i"=>($row['make_clickable']==1) ? $row['stream_url'] : "",
                                  "campaignbackdrop$i"=>($row['make_clickable']==1) ? $row['backdrop']: "",  
                                  "campaignenabled$i"=> $row['make_clickable'], 
                                  "campaignid$i"=>(int)$row['id']
                            ); 
                        $output=array_merge($output,$output1);
                    }else{
                        $output1=array(
                                  "url"=>$row['image'], // banner image url 
                                  "campaignemail"=> ($row['make_clickable']==1) ? $row['campaign_email'] : "",
                                  "campaigntext"=> ($row['make_clickable']==1) ? $row['campaign_email_text'] : "",
                                  "campaignstream"=> ($row['make_clickable']==1) ? $row['stream_url'] : "",
                                  "campaignbackdrop"=> ($row['make_clickable']==1) ? $row['backdrop']: "",  
                                  "campaignenabled"=> $row['make_clickable'],
                                  "campaignid"=> (int)$row['id']
                            );
                        $output=array_merge($output,$output1);
                    }
                    $i++;
                }
            }
            else{
                $error['status'] = 'error';
                $error['code'] = -5;
                $error['message'] ='No banners could be found';
                $output= $error;
            }
        }else{
            $error['status'] = 'error';
            $error['code'] = -6;
            $error['message'] ='User Country could not be found';
            $output= $error;
        }
        echo json_encode($output);
    }

    //endpoint url 
    // api/advertisement/getstreamadvertisement?contentName=Sony&contentType=channel&contentId=34&userId=11&resellerId=0&deviceModel=_WebTV&cmsService=gomiddleware&crmService=gomiddlewareTV&city=Melbourne&state=Victoria&country=Australia
   
	
	
 public function displayPrerollTickerOverlay(){
        global $db;
        $contentName=$_GET['contentName'];
        $contentType=$_GET['contentType'];
        $contentId=$_GET['contentId'];
        $userId=$_GET['userId'];
        $resellerId=$_GET['resellerId'];
        $deviceModel=$_GET['deviceModel'];
        $cmsService=$_GET['cmsService'];
        $crmService=$_GET['crmService'];
        $city=$_GET['city'];
        $state=$_GET['state'];
        $countryname=$_GET['country'];

        //get country id from country name 
        $country=getCountry($countryname);
       // $preroll=array();
        $ticker=array();
        $overlay=array();

        if($country){ 

            if($contentType=="channel"){
              $sql="SELECT a.* FROM advertisement a 
                    JOIN advertisement_video_to_channels avc 
                    on a.id=avc.advertisement_id 
                    WHERE IF(exclude_country='yes', a.id NOT IN 
                      (SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND exclude=1), 
                     a.id IN(SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND include=1)
                    )
                    AND a.type='preroll'
                    AND ( NOW() BETWEEN a.date_start AND a.date_end) 
                    AND avc.channel_id=$contentId
                    ORDER BY RAND()
                    LIMIT 1";  
            }elseif($contentType=="serie"){
              $sql="SELECT a.* FROM advertisement a 
                    JOIN advertisement_video_to_series avs 
                    on a.id=avs.advertisement_id 
                    WHERE IF(exclude_country='yes', a.id NOT IN 
                      (SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND exclude=1), 
                     a.id IN(SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND include=1)
                    )
                    AND a.type='preroll'
                    AND ( NOW() BETWEEN a.date_start AND a.date_end) 
                    AND avs.channel_id=$contentId
                    ORDER BY RAND()
                    LIMIT 1";  
            }elseif($contentType=="movie"){
               $sql="SELECT a.* FROM advertisement a 
                    JOIN advertisement_video_to_movies avm 
                    on a.id=avm.advertisement_id 
                    WHERE IF(exclude_country='yes', a.id NOT IN 
                      (SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND exclude=1), 
                     a.id IN(SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND include=1)
                    )
                    AND a.type='preroll'
                    AND ( NOW() BETWEEN a.date_start AND a.date_end) 
                    AND avm.channel_id=$contentId
                    ORDER BY RAND()
                    LIMIT 1"; 
            }           
            $result = $db->query($sql);
            if($result->num_rows>0){
                while($row = $result->fetch_array())
                {
                    $rows[] = $row;
                }
                foreach ($rows as $row) {
					$preroll=array('url'=>$row['url'],
					//$preroll=array('url'=>"//commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
						 'showtime'=>(int)($row['length']));
                }
            }

            //get one random ticker according to country 
            if($contentType=="channel"){
                $sql="SELECT a.* FROM advertisement a 
                    JOIN advertisement_video_to_channels avc 
                    on a.id=avc.advertisement_id 
                    WHERE IF(exclude_country='yes', a.id NOT IN 
                      (SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND exclude=1), 
                     a.id IN(SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND include=1)
                    )
                    AND a.type='ticker'
                    AND ( NOW() BETWEEN a.date_start AND a.date_end) 
                    AND avc.channel_id=$contentId
                    ORDER BY RAND()
                    LIMIT 1";  
            }elseif($contentType=="serie"){
              $sql="SELECT a.* FROM advertisement a 
                    JOIN advertisement_video_to_series avs 
                    on a.id=avs.advertisement_id 
                    WHERE IF(exclude_country='yes', a.id NOT IN 
                      (SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND exclude=1), 
                     a.id IN(SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND include=1)
                    )
                    AND a.type='ticker'
                    AND ( NOW() BETWEEN a.date_start AND a.date_end) 
                    AND avs.channel_id=$contentId
                    ORDER BY RAND()
                    LIMIT 1";  
            }elseif($contentType=="movie"){
               $sql="SELECT a.* FROM advertisement a 
                    JOIN advertisement_video_to_movies avm 
                    on a.id=avm.advertisement_id 
                    WHERE IF(exclude_country='yes', a.id NOT IN 
                      (SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND exclude=1), 
                     a.id IN(SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND include=1)
                    )
                    AND a.type='ticker'
                    AND ( NOW() BETWEEN a.date_start AND a.date_end) 
                    AND avm.channel_id=$contentId
                    ORDER BY RAND()
                    LIMIT 1"; 
            }     
            $result = $db->query($sql);
            if($result->num_rows>0){
                while($row = $result->fetch_array())
                {
                    $rows[] = $row;
                }
                foreach ($rows as $row) {
                  $ticker=array('text'=>$row['text'],
                                'showtime'=> (int)$row['show_time']);
                }
            }

            //get one random ticker according to country 
            if($contentType=="channel"){
              $sql="SELECT a.* FROM advertisement a 
                    JOIN advertisement_video_to_channels avc 
                    on a.id=avc.advertisement_id 
                    WHERE IF(exclude_country='yes', a.id NOT IN 
                      (SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND exclude=1), 
                     a.id IN(SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND include=1)
                    )
                    AND a.type='overlay'
                    AND ( NOW() BETWEEN a.date_start AND a.date_end) 
                    AND avc.channel_id=$contentId
                    ORDER BY RAND()
                    LIMIT 1";  
            }elseif($contentType=="serie"){
              $sql="SELECT a.* FROM advertisement a 
                    JOIN advertisement_video_to_series avs 
                    on a.id=avs.advertisement_id 
                    WHERE IF(exclude_country='yes', a.id NOT IN 
                      (SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND exclude=1), 
                     a.id IN(SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND include=1)
                    )
                    AND a.type='overlay'
                    AND ( NOW() BETWEEN a.date_start AND a.date_end) 
                    AND avs.channel_id=$contentId
                    ORDER BY RAND()
                    LIMIT 1";  
            }elseif($contentType=="movie"){
               $sql="SELECT a.* FROM advertisement a 
                    JOIN advertisement_video_to_movies avm 
                    on a.id=avm.advertisement_id 
                    WHERE IF(exclude_country='yes', a.id NOT IN 
                      (SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND exclude=1), 
                     a.id IN(SELECT advertisement_id FROM advertisements_exclude_include_countries
                      WHERE country_id='$country->id' AND include=1)
                    )
                    AND a.type='overlay'
                    AND ( NOW() BETWEEN a.date_start AND a.date_end) 
                    AND avm.channel_id=$contentId
                    ORDER BY RAND()
                    LIMIT 1"; 
            }     
            $result = $db->query($sql);
            if($result->num_rows>0){
                while($row = $result->fetch_array())
                {
                    $rows[] = $row;
                }
                foreach ($rows as $row) {
                  $overlay=array('type'=>"vertical",
                                 'url'=>$row['image'],
                                 'showtime'=>(int)$row['show_time']);
                }
            }

            echo json_encode(array('servertime'=>date('Y-m-d H:i:s',time()),
                               'preroll'=> $preroll ? array($preroll): array(),
								'ticker'=>$ticker ? array($ticker): array(),
								 'overlay'=>  $overlay ? array($overlay):array()
								   )
								   //'preroll'=>array($preroll),
                                  //'ticker'=>array($ticker),
                                  //'overlay'=>array($overlay))
            );
        }else{
            $error['status'] = 'error';
            $error['code'] = -6;
            $error['message'] ='User Country could not be found';
            echo json_encode($error);
        }
    }
}
?>