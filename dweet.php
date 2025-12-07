<?
//ini_set('display_errors', 1);
//ini_set('display_startup_errors', 1);
//error_reporting(E_ALL);
function decToAlpha($val){
    $alphabet="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    $ret="";
    while($val){
      $r=floor($val/62);
      $frac=$val/62-$r;
      $ind=(int)round($frac*62);
      $ret=$alphabet[$ind].$ret;
      $val=$r;
    }
    return $ret==""?"0":$ret;
  }

  function alphaToDec($val){
    $pow=0;
    $res=0;
    while($val!=""){
      $cur=$val[strlen($val)-1];
      $val=substr($val,0,strlen($val)-1);
      $mul=ord($cur)<58?$cur:ord($cur)-(ord($cur)>96?87:29);
      $res+=$mul*pow(62,$pow);
      $pow++;
    }
    return $res;
  }

  function genSlug($code){
    global $link;
    $code = mysqli_real_escape_string($link, $code);
    $sql = 'SELECT * FROM links WHERE code = "'.$code.'"';
    $res = mysqli_query($link, $sql);
    if(mysqli_num_rows($res)){
      $row = mysqli_fetch_assoc($res);
      $slug = $row['slug'];
    } else {
      do{
        $try = floor(rand()/getrandmax()*1e8);
        $sql = "SELECT id FROM links WHERE id = $try";
        $res = mysqli_query($link, $sql);
      }while(mysqli_num_rows($res));
      $slug = decToAlpha($try);
      $sql="INSERT INTO links (id, code, slug) VALUES($try, \"$code\", \"$slug\")";
      mysqli_query($link, $sql);
    }
    echo $slug;
  }
  require('dweet_db.php');
  $params = [];
  if (isset($argc)) {
    $mode=0;
    for ($i = 0; $i < $argc; $i++) {
      if($i) $params[] = $argv[$i];
    }
  } else {
    $mode=1;
    $args=explode("?", $_SERVER['REQUEST_URI']);
    array_shift($args);
    if(sizeof($args)) $params[]=implode('?', $args);
  }
  if(sizeof($params)<1){
    $data = json_decode(file_get_contents('php://input'));
    $params[0] = mysqli_real_escape_string($link, $data->{'link'});
    if(!$params[0]) die();
  }
  $code = trim($params[0]);
  echo genSlug($code);
?>


