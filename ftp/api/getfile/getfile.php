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
    private $data;
    public function __construct($data){
        $this->data = $data;
    }

    public function validate(){



        $CI = $this->data;
        $CI = decrypt($CI, 2);
        parse_str($CI, $output);

        $api=$output['api'];
        $username= $output['id'];
        $password= $output['pin'];

        $user=checkuser($username,$password);
        if($user){
            if ($api == 'account'){
                // get product details
                $product=get_product($user->id);
                // get productlocation
                $location=get_product_location($product->id);
                // get total extra channel packages
                $channel_packages=get_channel_packages($user->id);
                // get total extra Movie Stores
                $movie_stores=get_movie_stores($user->id);
                // get total extra Series Stores
                $series_stores=get_series_stores($user->id);
                // get music categories
                $music_categories=get_music_categories($user->id);
                // get total extra Music packages
                $return_array=array('account'=>array('date_expired'=>date('Y-m-d',strtotime($user->subscription_expire)),
                    'datetime_expired'=>$user->subscription_expire,
                    'reseller_id'=>$user->reseller_id),
                    'customer'=>array('walletbalance'=>$user->walletbalance,
                        'currency'=>$user->currency),
                    'products'=>array('productid'=>$product->id,
                        'productname'=>$product->name,
                        'productlocation'=>$location->url,
                        'ChannelPackages'=>$channel_packages,
                        'MovieStores'=>$movie_stores,
                        'MusicPackages'=>$music_categories,
                        'SeriesStores'=>$series_stores
                    ),
                    'payperview'=>array('movies'=>array(),
                        'seasons'=>array(),
                        'albums'=>array(),
                        'channels'=>array()
                    ),
                    'storage'=>array('total'=>0,
                        'used'=>0.0
                    ),
                    'recordings'=>array()
                );
              //  echo json_encode($return_array);
				 $final_json_output = json_encode($return_array, JSON_UNESCAPED_SLASHES);
                    $final['CID'] = encrypt($final_json_output, 2);
                    echo json_encode($final, JSON_UNESCAPED_SLASHES);
            }

            elseif ($api == 'product_location'){
                //  $token = tokenGenerate($username,$password,$ipAddress,strtotime('+2 day'));
                header("Location: //".$output['product_path']."?token=".$output['token']);
                //header("Location: //".$output['product_path']."?token=".$token);
            }

        }else{
            $error['status'] = 'error';
            $error['code'] = -2;
            $error['message'] = "Invalid user";
            echo json_encode($error);
        }
    }
}
?>