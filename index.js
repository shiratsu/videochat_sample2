// index.js
var Hapi = require('hapi');
var fs = require('fs');
var sqlite = require('./db.js');
var db = sqlite.init('./chat_db');
var server = new Hapi.Server();
server.connection({
  'host': 'localhost',
  'port': 3000
});
// console.log(process.env.ACCOUNT_SID);
// console.log(process.env.AUTH_TOKEN);
var socketio = require("socket.io");
var io = socketio(server.listener);
// var twilio = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

// Serve static assets
server.route({
  method: 'GET',
  path: '/{path*}',
  handler: {
    directory: { path: './public', listing: false, index: true }
  }
});

var store = {};

// Start the server
server.start(function () {
  console.log('Server running at:', server.info.uri);
});

io.on('connection', function(socket){
  console.log("connection");
  socket.on('join', function(room){

    // room情報をチェック
    checkRoomData(db,room,socket,io,db);
    // console.log("count:"+cnt);
    //
    //
  });

  socket.on('token', function(token){
    // twilio.broadcast.tokens.create(function(err, response){
    //   if(err){
    //     console.log(err);
    //   }else{
    //     socket.emit('token', response);
    //   }
    // });
    console.log('token');
    console.log(token);
    console.log(token.id);
    // socket.to(token.id).emit('token', '');
    socket.emit('token', '');
  });

  socket.on('candidate', function(candidate){
    console.log('candidate');

    var cand = candidate.data.split(' ');
    console.log(cand);
    console.log('-------------');
    console.log(cand[7]);
    console.log(cand[10]);
    console.log(cand[11]);
    console.log('-------------');
    if (cand[7] === 'relay' && cand[10] === 'rport' && cand[11] === '0') {
        console.log("yes chrome to firefox");
        cand[11] = '9';
    }
    socket.broadcast.to(candidate.id).emit('candidate', candidate.data);
  });

  socket.on('offer', function(offer){
    console.log('offer');
    console.log(offer.id);
    socket.broadcast.to(offer.id).emit('offer', offer.data);
  });

  socket.on('binary', function(object){
    console.log('binary');

    let nowdatetime = formatDate(new Date(),'YYYYMMDDhhmmssSSS');
      fs.writeFile("/tmp/"+nowdatetime+".webm", object.data,  "binary",function(err) {
          if(err) {
              console.log(err);
          } else {
              console.log("The file was saved!");
          }
      });
  });

  socket.on('answer', function(answer){
    console.log('answer');
    socket.broadcast.to(answer.id).emit('answer', answer.data);
  });
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

/**
 * [checkRoomData description]
 * @param  {[type]} db          [description]
 * @param  {[type]} paramRoomid [description]
 * @param  {[type]} socket [description]
 * @param  {[type]} io [description]
 * @param  {[type]} db [description]
 */
function checkRoomData(db,paramRoomid,socket,io,db){

  let sql = `SELECT count(1) as cnt
           FROM roomid
           WHERE roomid  = ?`;
  let roomid = paramRoomid;

  console.log("roomid:"+roomid);
  console.log("paramRoomid:"+paramRoomid);
  db.get(sql, [roomid], (err, row) => {
    if (err) {
      return console.error(err.message);
    }
    console.log(row);
    console.log(row.cnt);
    setJoinResult(roomid,row.cnt,socket,io,db);
  });

}

/**
 * [setRoomData description]
 * @param {[type]} db     [description]
 * @param {[type]} roomid [description]
 */
function setRoomData(db,roomid){
  let sql = `insert into roomid values(?)`;

  db.serialize(function () {

    db.run('insert into roomid values ($i)',
      {
        $i: roomid
      }
    );
    // ↓でもOK
    // db.run('insert or ignore into demo_table (id, name) values (?, ?)', [param.id, param.name]);
  });
}

/**
 * [setJoinResult description]
 * @param {[type]} roomid [description]
 * @param {[type]} cnt    [description]
 * @param {[type]} soecket     [description]
 * @param {[type]} io     [description]
 * @param {[type]} db     [description]
 */
function setJoinResult(room,cnt,socket,io,db){

  let clients = io.sockets.adapter.rooms[room];
  let numClients = (typeof clients !== 'undefined') ? clients.length : 0;
  console.log("join");

  if(cnt == 0){
    if(numClients == 0){
      console.log("room1:"+room);
      socket.join(room);

    }else if(numClients == 1){
      socket.join(room);
      console.log("room2:"+room);
      socket.emit('ready', room);
      socket.broadcast.to(room).emit('ready', room);
      console.log("ready");
      setRoomData(db,room);
    }else{
      console.log("full");
      socket.emit('full', room);
    }
  }else{
    socket.emit('ng', room);
  }
}
