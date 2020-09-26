<?php
//error_reporting(E_ALL);
//ini_set('display_errors', 1);
/**
 * @class Base
 * @ start from base server and redirect to project file
 */

require_once('../db-connection.php');
require_once('../helpers.php');

class Base
{
    private $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function validate()
    {
        $CI = $this->data;
        $CI = decrypt($CI, 2);
        parse_str($CI, $output);
        $api = $output['api'];
        $username = $output['id'];
        $password = $output['pin'];


        if (is_numeric($username) and is_numeric($password)) {
            // check id and pin is numeric
            $user = checkuser($username, $password);

            if ($user) {
                if ($api == 'account') {
                    // get product id details
                    $product = get_product($user->id);
                    // get productlocation
                    $location = get_product_location($product->id);
                    $return_array = array(
                         'products' => array('productid' => $product->id,
                         'productname' => $product->name,
                         'productlocation' => $location->url
                        )
                    );
                    $final_json_output = json_encode($return_array, JSON_UNESCAPED_SLASHES);
                    $final['CID'] = encrypt($final_json_output, 2);
                    echo json_encode($final, JSON_UNESCAPED_SLASHES);
                }

            } else {
                $error['status'] = 'error';
                $error['code'] = -2;
                $error['message'] = "Invalid user data";
                echo json_encode($error);
            }

        } else {
            $error['status'] = 'error';
            $error['code'] = -3;
            $error['message'] = 'Invalid Code | Invalid user credentials';
            echo json_encode($error);
        }
    }
}

?>