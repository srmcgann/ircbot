const net = require('net');
const { exec, spawn, fork } = require('child_process');
const readline = require('readline');

var config = {
  servers: [
    { host: 'irc.mzima.net',
      port: 6667,
      nick: 'accuracy',
      channels: [
        { name: '#art',         log: '' },
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
    { host: 'irc.rizon.net',
      port: 6667,
      nick: 'accuracy',
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
         txt.indexOf(':End of /MOTD command') !== -1) {
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
            commands = message.toLowerCase().split(' ').filter(v=>v.length>3 && v[0] == '!').map(v=>{
              var ret = v.split('')
              ret.shift()
              return ret.join('')
            })
          }
        }
      }


      switch(stage){
        case 'USER':
          console.log("sending USER command\r\n")
          client.write(`NICK ${nick}\r\n`);
          client.write(`USER ~${nick} 0 * :accuracy bot\r\n`);
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
