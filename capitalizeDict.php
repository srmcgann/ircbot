<?
$hdlIn = fopen('./words.out', 'r');
$hdlOut = fopen('./words_cap.out', 'w');
echo "converting dictionary...";
while($line = strToUpper(fgets($hdlIn))){
  echo '.';
  //echo $line;
  fputs($hdlOut, $line);
}
echo "\n\ndone.\n\n";
?>
