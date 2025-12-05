const net = require('net');
const { exec, spawn, fork } = require('child_process');
const readline = require('readline');


var client, joined = false
var IRCHost = 'irc.rizon.net'
var IRCPort = 6667
var nick = 'accuracy0'
var channels = [
  {
    name: '#accuracy',
    log: '',
  },
  {
    name: '#accuracy2',
    log: '',
  },
  {
    name: '#accuracy3',
    log: '',
  },
  {
    name: '#accuracy4',
    log: '',
  },
  {
    name: '#accuracy5',
    log: '',
  },
]

const ConnectToIRCNetwork = (network = IRCHost, port = IRCPort) => {
  client = net.createConnection(port, network, () => {
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
          //console.log(`replying to ${sender}: ${sender}, i hear -> "${message}"`)
          //client.write(`PRIVMSG ${channel} :${sender}, i hear -> "${message}"\r\n`);
        break
        case 'JOIN':
          var list = []
          channels.forEach(chnl => list.push(chnl.name))
          list = list.join(',')
          console.log("joining channels...\r\n", list)
          client.write(`JOIN ${list}\r\n`);
          joined = true
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
ConnectToIRCNetwork()

/*
// Create a TCP server
const server = net.createServer((socket) => {
  console.log('Client connected');
  
  // Set encoding to utf8 so we receive strings instead of Buffer objects
  socket.setEncoding('utf8');
  
  // Handle data from client
  socket.on('data', (data) => {
    console.log(data);
    
    // Echo the data back to the client
    socket.write(`Echo: ${data}`);
  });
  
  // Handle client disconnection
  socket.on('end', () => {
    console.log('Client disconnected');
  });
  
  // Handle errors
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
  
  // Send a welcome message to the client
  socket.write('Welcome to the TCP server!\r\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', (line) => {
    socket.write(line + "\r\n");
  });

});

// Start the server and listen on port 8080
server.listen(8080, () => {
  console.log('TCP Server running on port 8080');
});
*/