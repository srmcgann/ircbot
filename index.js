const net = require('net');
const { exec, spawn, fork } = require('child_process');
const readline = require('readline');

const nick = 'actest'

var config = {
  servers: [
    { host: 'irc.mzima.net',
      nick,
      port: 6667,
      pass: 'chrome57253',
      userCommand: `USER ~${nick} 0 * :accuracy bot\r\n`,
      channels: [
        //{ name: '#art',         log: '' },
        { name: '#birdnest',    log: '' },
        { name: '#coders',      log: '' },
        { name: '#coordinates', log: '' },
        { name: '#asm',         log: '' },
        { name: '#demoscene',   log: '' },
        { name: '#graphics',    log: '' },
        { name: '#HRL',         log: '' },
        { name: '#metal',       log: '' },
        { name: '#accuracy',    log: '' },
        { name: '#specdev',     log: '' },
        { name: '#status',      log: '' },
      ],
      joined: false,
      client: null,
    },
    { host: 'irc.psychz.net',
      nick,
      port: 6667,
      pass: 'chrome57253',
      userCommand: `USER ${nick} 0 * :accuracy bot\r\n`,
      channels: [
        { name: '#art',         log: '' },
        { name: '#coordinates', log: '' },
        { name: '#accuracy',    log: '' },
        { name: '#casual',    log: '' },
        { name: '#chataholics',    log: '' },
        { name: '#c++',    log: '' },
        { name: '#philalethia',    log: '' },
        { name: '#sprit',    log: '' },
        { name: '#occult',    log: '' },
        { name: '#esoteric',    log: '' },
        { name: '#allnitecafe',    log: '' },
      ],
      joined: false,
      client: null,
    },
    { host: 'irc.rizon.net',
      nick,
      port: 6667,
      pass: 'chrome57253',
      userCommand: `USER ~${nick} 0 * :accuracy bot\r\n`,
      channels: [
        { name: '#8chan',        log: '' },
        { name: '#art',          log: '' },
        { name: '#chatfriendly', log: '' },
        { name: '#freespeech',   log: '' },
        { name: '#coordinates',  log: '' },
        { name: '#accuracy',     log: '' },
        { name: '#psychology',   log: '' },
        { name: '#uk',           log: '' },
        { name: '#music',        log: '' },
      ],
      joined: false,
      client: null,
    },
  ],
}




//////////// games and tools /////////////

var mashword=[]

function Dweet(str, chan, sender, client){
  var executable = 'php'
  var script = 'dweet.php'
  var code = str
  var child = spawn(executable, [script, code])
  child.stdout.on('data', data => {
    if(data.length>3){
      client.write(`PRIVMSG ${chan} :${sender}, your demo link -> https://textfile.root.sx/d/${data}\r\n`)
    }
  })
  child.stderr.on('data', data => {
    client.write(`PRIVMSG ${chan} :${sender}, ruh roh, error -> data\r\n`)
  })
}

function getNewMash(str, chan, client){
  let meta = ''
  let scrambleLength = typeof mashword[chan] !== 'undefined' ? mashword[chan].scrambleLength : ''
  console.log(str)
  if((+str)>1 && (+str)<=10){
    scrambleLength = ' '+str
    meta = '    (the scramble length has been set to' + scrambleLength + ")"
  }
  exec('php masher.php newmash' + scrambleLength, (error, stdout, stderr) => {
    let v=stdout.split("\n")
    mashword[chan] = {answer: v[0].trim(), scramble: v[1], scrambleLength}
    client.write('PRIVMSG ' + chan + ' :a new scramble is served!  ->  ' + v[1] + meta + "\r\n")
    console.log('PRIVMSG ' + chan + ' :a new scramble is served!  ->  ' + v[1] + meta + "\r\n")
  })
}

function wordcombos (letters) {
  let result
  if (letters.length <= 1) {
    result = letters
  } else {
    result = []
    for (let i = 0; i < letters.length; ++i) {
      let firstword = letters[i]
      let remainingletters = []
      for (let j = 0; j < letters.length; ++j) {
        if ( i != j ) remainingletters.push(letters[j])
      }
      let combos = wordcombos(remainingletters)
      for (let j = 0; j < combos.length; ++j) {
        result.push(firstword + combos[j])
      }
    }
  }
  return result
}

function checkMash(str, chan, chatter, client){
  console.log('------ checking mash --------')
  let answer = mashword[chan].answer.toUpperCase().split('')
  let guess = str.trim().toUpperCase()//.split('')
  let wc = wordcombos(answer)
  if(guess.length !== answer.join('').length || (wc.indexOf(guess)===-1)){
    client.write('PRIVMSG ' + chan + ' :Oops! you\'re not using the correct letters!  current scramble  ->  ' + mashword[chan].scramble + "\r\n");
    console.log('PRIVMSG ' + chan + ' :Oops! you\'re not using the correct letters!  current scramble  ->  ' + mashword[chan].scramble + "\r\n");
  } else {
    if(guess == answer.join('')){
      exec('php incrscore.php ' + chatter, (error, stdout, stderr) => {
        let score = stdout
        client.write('PRIVMSG ' + chan + ' :\u000352,1C\u000353,1O\u000354,1R\u000356,1R\u000357,1E\u000358,1C\u000360,1T\u000361,1!\u0003    "' + guess + '"    \u000356,1 ' + chatter + ' score: ' + score + " \u0003 \r\n")
        console.log('PRIVMSG ' + chan + ' :\u000352,1C\u000353,1O\u000354,1R\u000356,1R\u000357,1E\u000358,1C\u000360,1T\u000361,1!\u0003    "' + guess + '"    \u000356,1 ' + chatter + ' score: ' + score + " \u0003 \r\n")
        getNewMash('', chan, client)
      })
    }
    //('PRIVMSG ' + chan + ' : ' + guess + ' ' + answer.join('') + ' ' + wc[0] + ' ' + wc.indexOf(guess) + ' ' + wc[wc.indexOf(guess)] + "\r\n")
  }
}

function wordmash(msg, chan, chatter, client){
  if(Object.keys(mashword).length && typeof mashword[chan] !== 'undefined' && mashword[chan].scramble.length){
    var str = msg && msg.split(' ').length > 1 ? msg.split(' ')[1] : ''
    switch(str.toUpperCase()){
      case 'STOP':
        //serverRaw('PRIVMSG ' + chan + ' :' + 'scramble stopped... ' + "\r\n")
        client.write('PRIVMSG ' + chan + ' :' + 'scramble stopped... ' + "\r\n")
        console.log('PRIVMSG ' + chan + ' :' + 'scramble stopped... ' + "\r\n")
        mashword[chan] = {answer: '', scramble: '', scrambleLength: mashword[chan].scrambleLength}
      break
      case 'RESET':
        let l
        getNewMash((l=str.split(' '))[l.length-1], chan, client)
      break
      case 'HINT':
        client.write('PRIVMSG ' + chan + ' :' + "the current answer is: " + mashword[chan].answer.split('').map((v,i,a)=>i<=a.length/2?'*':v).join('') + "\r\n");
        console.log('PRIVMSG ' + chan + ' :' + "the current answer is: " + mashword[chan].answer.split('').map((v,i,a)=>i<=a.length/2?'*':v).join('') + "\r\n");
      break
      default:
        if(str.length<1 || !str){
          client.write('PRIVMSG ' + chan + ' :' + "the current scramble is: " + mashword[chan].scramble + "\r\n");
          console.log('PRIVMSG ' + chan + ' :' + "the current scramble is: " + mashword[chan].scramble + "\r\n");
        }else{
          checkMash(str, chan, chatter, client)
        }
      break
    }
  }else{
    getNewMash(str, chan, client)
  }
}

const anagrams = (msg, chan, chatter, client) => {
  var str = `php anagrams.php ${msg} ` + ('_').repeat(msg.length)
  exec(str, (error, stdout, stderr) => {
    //let v=stdout.split("\n")
    console.log(stdout)
    client.write(`PRIVMSG ${chan} :anagrams for "${msg}" ->  ${stdout}\r\n`)
  })
}


//////////////////////////////////////////


const ConnectToIRCNetwork = server => {
  var network  = server.host
  var port     = server.port
  var nick     = server.nick
  var channels = server.channels
  var client   = server.client = net.createConnection(port, network, () => {
    console.log('connected to server!');
  });

  client.on('data', (data) => {

    var stage
    data.toString().split("\n").forEach(txt => {
      console.log(txt);

      if(txt.split(' :').length > 1 &&
         (
         txt.split(' :')[1].indexOf(' up your hostname (cached)') !== -1 ||
         txt.split(' :')[1].indexOf('Please wait while we process your connection.') !== -1 ||
         txt.split(' :')[1].indexOf(' up your hostname...') !== -1
         )){
        stage = 'USER'
      }

      if(txt.indexOf('PING :') === 0) {
        stage = 'PING'
        var pong = txt.split(':')[1]
      }

      if(txt.split(':').length > 2 &&
         txt.split(':')[1].indexOf(' PRIVMSG ') == -1 &&
         (txt.indexOf(':End of ') !== -1 &&
          txt.indexOf('MOTD command') !== -1)) {
        console.log("   ----> detected MOTD, attempting channel join\r\m")
        stage = 'JOIN'
      }

      var commands = []
      if(txt.split(' ').length > 3 &&
         txt.split(' ')[1] === 'PRIVMSG') {
        var message = txt.split(` PRIVMSG `)[1].split(' :')[1]
        var sender = txt.split(':')[1].split('!')[0]
        if(typeof sender != 'undefined'){
          var channel = txt.split(' ')[2]
          var chnl = channels.filter(chnl => chnl.name.toLowerCase() == channel.toLowerCase())
          console.log('---message received')
          console.log('message :', message)
          console.log('sender :', sender)
          console.log('channel :', channel)
          console.log('matched channel count :', chnl.length)
          if(chnl.length){
            stage = 'PRIVMSG'
            chnl = chnl[0]
            //chnl.log += `${message}`
            message = message.replaceAll("\r", "").replaceAll("\n", "")
            commands = message.trim().toLowerCase().split(' ').filter(v=>v.length>3 && v[0] == '!').map(v=>{
              var ret = v.split('')
              ret.shift()
              var command = ret.join('')
              
              
              // '!' commands, e.g. "!scramble"
              // pre-execution
              switch(command){
                case 'anagrams': case 'anagram':
                  if(message.trim().split(' ').length>1){
                    var an = message.trim().split(' ')[1]
                    anagrams(an, channel, sender, client)
                  }else{
                    client.write(`PRIVMSG ${channel} :${sender}, you need to supply a word, e.g. !anagram trees\r\n`);
                  }
                break

                case 'dweet':
                  console.log('preparing')
                  if(message.trim().split(' ').length>1){
                    var code = message.trim().split(' ').filter((v,i)=>i).join(' ')
                    Dweet(code, channel, sender, client)
                  }
                break

                case 'scramble':
                    var scram = '.scramble ' + (message.trim().split(' ').length>1 ?
                    message.trim().split(' ')[1] : '')
                    wordmash(scram, channel, sender, client)
                break
                case 'hint':
                  wordmash('.scramble hint', channel, sender, client)
                break
              }
              
              return command
            })
          }
        }
      }


      switch(stage){
        case 'USER':
          console.log("sending USER command\r\n")
          //client.write(`\r\n`);
          client.write(`NICK ${nick}\r\n`);
          client.write(server.userCommand);
        break
        case 'PRIVMSG':
          if(commands.length){
            var cmd = commands[0].trim()
            console.log('processing command: ', cmd, cmd.length)

            switch(cmd){
              case 'joke':
                exec('curl https://icanhazdadjoke.com/', (error, stdout, stderr) => {
                  var joke = stdout
                  client.write(`PRIVMSG ${channel} :${sender}, have you heard this one? -> "${joke}"\r\n`);
                });
              break
            }
          }
        break
        case 'JOIN':
          var list = []
          channels.forEach(chnl => list.push(chnl.name))
          list = list.join(',')
          console.log("joining channels...\r\n", list)
          client.write(`JOIN ${list}\r\n`);
          server.joined = true
        break
        case 'PING':
          console.log("sending pong\r\n")
          client.write(`PONG ${pong}\r\n`);
        break
      }
    })
    //client.end();
  });
  client.on('end', () => {
    console.log('disconnected from server');
  });
}

config.servers.forEach(server => ConnectToIRCNetwork(server) )
