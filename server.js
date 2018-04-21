const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

app.get(`/`, (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});
app.get(`/app.js`, (req, res) => {
  res.sendFile(__dirname + '/public/app.js');
});
app.get(`/socket.io.js`, (req, res) => {
  res.sendFile(__dirname + '/public/socket.io.js');
});
app.get(`/adapter.js`, (req, res) => {
  res.sendFile(__dirname + '/public/adapter.js');
});

io.on('connection', (socket) => {
  console.log('a user connected');

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
    // twilio.tokens.create(function(err, response){
    //   if(err){
    //     console.log(err);
    //   }else{
    //     socket.emit('token', response);
    //   }
    // });
    socket.broadcast.emit('token', '');
  });

  socket.on('candidate', function(candidate){
    console.log('candidate');
    socket.broadcast.emit('candidate', candidate);
  });

  socket.on('offer', function(offer){
    console.log('offer');
    socket.broadcast.emit('offer', offer);
  });

  socket.on('binary', function(videoBlob){
    console.log('binary');

    let nowdatetime = formatDate(new Date(),'YYYYMMDDhhmmssSSS');
      fs.writeFile("/tmp/"+nowdatetime+".webm", videoBlob,  "binary",function(err) {
          if(err) {
              console.log(err);
          } else {
              console.log("The file was saved!");
          }
      });
  });

  socket.on('answer', function(answer){
    console.log('answer');
    socket.broadcast.emit('answer', answer);
  });
});

http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

/**
 * 日付をフォーマットする
 * @param  {Date}   date     日付
 * @param  {String} [format] フォーマット
 * @return {String}          フォーマット済み日付
 */
var formatDate = function (date, format) {
  if (!format) format = 'YYYY-MM-DD hh:mm:ss.SSS';
  format = format.replace(/YYYY/g, date.getFullYear());
  format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
  format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
  format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
  format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
  format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
  if (format.match(/S/g)) {
    var milliSeconds = ('00' + date.getMilliseconds()).slice(-3);
    var length = format.match(/S/g).length;
    for (var i = 0; i < length; i++) format = format.replace(/S/, milliSeconds.substring(i, i + 1));
  }
  return format;
};
