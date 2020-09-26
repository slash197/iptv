<?php

//http://gui.3iptv.com/api/youtube/getvideo.php?videoid=FSGL0T9EgFs
include "YouTubeDownloader.php";
include "Browser.php";
include "Parser.php";
include "SignatureDecoder.php";
	
use YouTube\Browser;
use YouTube\YouTubeDownloader;
use YouTube\Parser;
use YouTube\SignatureDecoder;


$yt = new YouTubeDownloader();

$id = $_GET["videoid"];

//$links = $yt->getDownloadLinks($id);
$links = $yt->getDownloadLinks("FSGL0T9EgFs");
//$links = $yt->getDownloadLinks("https://www.youtube.com/watch?v=FSGL0T9EgFs");


for ($row = 0; $row < count($links); $row++) {
  echo "<p><b>Row number $row</b></p>";
  echo "<ul>";
 // for ($col = 0; $col < 3; $col++) {
    echo "<li>".$links[$row]["url"]."</li>";
	echo "<li>".$links[$row]["itag"]."</li>";
	
//	if ($links[$row]["itag"]== 37){
//	$finalurl= $links[$row]["url"];
//		break;
//	}
//	elseif ($links[$row]["itag"]== 22){
//	$finalurl= $links[$row]["url"];
//		break;
//	} 
//	elseif ($links[$row]["itag"]== 18){
//	$finalurl= $links[$row]["url"];
//			} 
	
	
	
	echo "<li>".$links[$row]["format"]."</li>";
 // }
  echo "</ul>";
}


if ( array_search(22, array_column($links, 'itag'))){
$final_url= $links[array_search(22, array_column($links, 'itag'))]["url"];
}
elseif ( array_search(84, array_column($links, 'itag'))){
$final_url= $links[array_search(84, array_column($links, 'itag'))]["url"];
}
elseif ( array_search(83, array_column($links, 'itag'))){
$final_url= $links[array_search(83, array_column($links, 'itag'))]["url"];
}
elseif ( array_search(59, array_column($links, 'itag'))){
$final_url= $links[array_search(59, array_column($links, 'itag'))]["url"];
}
elseif ( array_search(78, array_column($links, 'itag'))){
$final_url= $links[array_search(78, array_column($links, 'itag'))]["url"];
}
elseif ( array_search(96, array_column($links, 'itag'))){
$final_url= $links[array_search(96, array_column($links, 'itag'))]["url"];
}
elseif ( array_search(95, array_column($links, 'itag'))){
$final_url= $links[array_search(95, array_column($links, 'itag'))]["url"];
}
elseif ( array_search(94, array_column($links, 'itag'))){
$final_url= $links[array_search(94, array_column($links, 'itag'))]["url"];
}
elseif ( array_search(18, array_column($links, 'itag'))){
$final_url= $links[array_search(18, array_column($links, 'itag'))]["url"];
}

echo "</br>Final_url: ".$final_url."</h1></br>"; 
//echo $final_url;

var_dump($links);

//header("Location:".$links);
