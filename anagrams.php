<?
  set_time_limit ( 600 );
  $dict = fopen('words_cap.out', 'r');
  $dictlines = [];
  $maxlength = 8;
  $flushBuffers = false;
  $list = [];  // $list is only involved if buffers are not flushed.
  
  while($dictlines[] = fgets($dict));


  function wordcombos ($letters) {
    if ( count($letters) <= 1 ) {
      $result = $letters;
    } else {
      $result = array();
      for ( $i = 0; $i < count($letters); ++$i ) {
        $firstword = $letters[$i];
        $remainingletters = array();
        for ( $j = 0; $j < count($letters); ++$j ) {
          if ( $i <> $j ) $remainingletters[] = $letters[$j];
        }
        $combos = wordcombos($remainingletters);
        for ( $j = 0; $j < count($combos); ++$j ) {
          $result[] = $firstword . $combos[$j];
        }
      }

    }
    return $result;
  }

  function check($word){
    global $dictlines, $list, $flushBuffers;
    foreach($dictlines as $line){
      if($line == $word){
        if($flushBuffers){
          echo strtolower($line);
          flush();
          @ob_flush();
        }else{
          $list[] = str_replace("\n", "", $line);
        }
        return true;
      }
    }
    return false;
  }

  $alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  if(
    isset($_GET['letters']) && strlen($_GET['letters']) &&
    isset($_GET['exclude']) && strlen($_GET['exclude']) &&
    isset($_GET['placement']) && strlen($_GET['placement'])
  ){
    $letters = isset($_GET['letters']) ? ($_GET['letters']=='_'?'':strtoupper(strtoupper($_GET['letters']))) : '';
    $placement = isset($_GET['placement']) ? strtoupper($_GET['placement']) : '';
    $exclude = isset($_GET['exclude']) ? strtoupper($_GET['exclude']) : '';
  } else {
    $letters = isset($argv[1]) ? ($argv[1]=='_'?'':strtoupper($argv[1])) : '';
    $placement = isset($argv[2]) ? strtoupper($argv[2]): '';
    $exclude = isset($argv[3]) ? strtoupper($argv[3]): '';
  }
  $length = strlen($placement);
  if(!$length || !$placement || strlen($placement) != $length || $length > $maxlength){
    echo '[false]';
    die();
  }

  $s=[];
  $ct=0;
  for($i=0;$i<$length;++$i){
    if($placement[$i] == '_') $ct++;
  }
  if(strlen($letters) > $ct){
    echo '[false]';
    die();
  }
  $nct=$ct-strlen($letters);
  for($i=0;$i<$nct;++$i){
    $s[]=0;
  }

  $gen = [];

  function recurse(&$s, $d){
    global $maxlength;
    if($d < $maxlength){
      if(sizeof($s) > $d){
        $s[sizeof($s)-($d+1)]++;
        if($s[sizeof($s)-($d+1)]==26){
          $s[sizeof($s)-($d+1)]=0;
          recurse($s, $d+1);
        }
      }
    }
  }

  do{
    $good=true;
    $a='';
    for($i=0;$i<sizeof($s);++$i){
      $a.=$alphabet[$s[$i]];
      if($s[$i]!==25) $good=false;
    }
    $exc=false;
    for($i=0;$i<strlen($exclude);++$i){
      if(strpos($a,$exclude[$i])!==false) $exc=true;
    }
    if(!$exc) $gen[]=$a . $letters;
    recurse($s, 0);
  }while(!$good);
  
  $possibilities=[];
  for($i=0;$i<sizeof($gen);++$i){
    $unknown = $gen[$i];
    $uniqueCombos=array_values(array_unique(wordcombos(str_split($unknown))));
    for($j=0;$j<sizeof($uniqueCombos);++$j){
      $possibilities[]=$uniqueCombos[$j];
    }
  }
  $possibilities=array_values(array_unique($possibilities));
  for($i=0;$i<sizeof($possibilities);++$i){
    $ct=0;
    $test='';
    for($j=0; $j < $length; $j++){
      if($placement[$j] != '_'){
        $test.=$placement[$j];
      } else {
        $test.=$possibilities[$i][$ct];
        $ct++;
      }
    }
    check($test . "\n");
  }
  if(!$flushBuffers){
    echo implode(', ', $list);
  }
?>
