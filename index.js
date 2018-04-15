// index.js
var Hapi = require('hapi');
var server = new Hapi.Server()
server.connection({
  'host': 'localhost',
  'port': 3000
});
// console.log(process.env.ACCOUNT_SID);
// console.log(process.env.AUTH_TOKEN);
var socketio = require("socket.io");
var io = socketio(server.listener);
var twilio = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

// Serve static assets
server.route({
  method: 'GET',
  path: '/{path*}',
  handler: {
    directory: { path: './public', listing: false, index: true }
  }
});

// Start the server
server.start(function () {
  console.log('Server running at:', server.info.uri);
});

io.on('connection', function(socket){
  socket.on('join', function(room){
    console.log("join");
    console.log(room);
    let clients = io.sockets.adapter.rooms[room];
    let numClients = (typeof clients !== 'undefined') ? clients.length : 0;
    console.log(clients);
    console.log(numClients);
    if(numClients == 0){
      socket.join(room);
    }else if(numClients == 1){
      socket.join(room);
      socket.emit('ready', room);
      socket.broadcast.emit('ready', room);
      console.log("ready");
    }else{
      console.log("full");
      socket.emit('full', room);
    }
  });

  socket.on('token', function(){
    twilio.tokens.create(function(err, response){
      if(err){
        console.log(err);
      }else{
        socket.emit('token', response);
      }
    });
  });

  socket.on('candidate', function(candidate){
    socket.broadcast.emit('candidate', candidate);
  });

  socket.on('offer', function(offer){
    socket.broadcast.emit('offer', offer);
  });

  socket.on('answer', function(answer){
    socket.broadcast.emit('answer', answer);
  });
});
