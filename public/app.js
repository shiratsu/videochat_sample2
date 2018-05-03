// app.js
'use strict';

// Put variables in global scope to make them available to the browser console.
var constraints = window.constraints = {
  audio: true,
  video: true
};
let stun_turn_config = {"iceServers":[
    {"urls": "stun:localhost:9999"},
    // {"urls":"stun:localhost:3478?transport=udp", "username":"username1", "credential":"test"},
    // {"urls":'stun:stun.l.google.com:19302'},
    {"urls":"turn:localhost:9999?transport=udp", "username":"username1", "credential":"test"}

    // {"urls": "stun:indival-stun-turn.tk:3478"},
    // {"urls": "stun:indival-stun-turn.tk:443"},
    // {"urls":"turn:indival-stun-turn.tk:443?transport=tcp", "username":"hiratsuka", "credential":"test"},
    // {"urls":"turn:indival-stun-turn.tk:3478?transport=udp", "username":"hiratsuka", "credential":"test"}
  ]};

//変数argはオブジェクトですよ
var arg = new Object;

// 変数pairにURLの?の後ろを&で区切ったものを配列にして代入
var pair=location.search.substring(1).split('&');
    // location.search.substring(1)は、URLから最初の1文字 (?記号) を除いた文字列を取得する
    // .split('&')は&で区切り配列に分割する
// for文でrairがある限りループさせる
for(var i=0;pair[i];i++) {

  // 変数kvにpairを=で区切り配列に分割する
  var kv = pair[i].split('=');// kvはkey-value

  // 最初に定義したオブジェクトargに連想配列として格納
  arg[kv[0]]=kv[1];  // kv[0]がkey,kv[1]がvalue

}

// let stun_turn_config = {"iceServers":[
//     ]};

// let stun_turn_config = {"iceServers":[{urls: "stun:global.stun.twilio.com:3478?transport=udp" }
//     ]};

var VideoChat = {
  socket: io(),
  // socket: io.connect('https://indival-labo.tk:3000'),

  onMediaStream: function(stream){

    VideoChat.localVideo.volume = 0;
    VideoChat.localStream = stream;
    VideoChat.videoButton.setAttribute('disabled', 'disabled');
    VideoChat.callButton.removeAttribute('disabled');
    VideoChat.recordButton.removeAttribute('disabled');
    VideoChat.stopButton.removeAttribute('disabled');

    setVideo(VideoChat.localVideo,stream);

    console.log("onMediaStream");
    console.log(VideoChat.roomid);
    VideoChat.socket.emit('join', VideoChat.roomid);
    VideoChat.socket.on('ready', VideoChat.readyToCall);
    VideoChat.socket.on('offer', VideoChat.onOffer);
    VideoChat.socket.on('full', VideoChat.onFull);
    VideoChat.socket.on('ng', VideoChat.onNG);

  },

  onFull: function(message){
    alert(message+"は満室のため現在入室出来ません。");
  },

  onNG: function(message){
    alert(message+"は満室のため現在入室出来ません。");
  },
  onOffer: function(offer){
    console.log('Got an offer')
    console.log(offer);

    VideoChat.socket.on('token', VideoChat.onToken(VideoChat.createAnswer(offer)));

    let message = makeParameter(VideoChat.roomid,'');

    VideoChat.socket.emit('token',message);

    // VideoChat.createAnswer(offer);
  },

  readyToCall: function(event){
    console.log("readyToCall");
    VideoChat.callButton.removeAttribute('disabled');
  },

  startCall: function(event){
    console.log("startCall");
    console.log("Things are going as planned!");

    VideoChat.hangupButton.removeAttribute('disabled');
    VideoChat.stopButton.removeAttribute('disabled');

    // VideoChat.peerConnection = new RTCPeerConnection({
    //   stun_turn_config
    // });

    VideoChat.peerConnection = null;

    try {
      VideoChat.peerConnection = new RTCPeerConnection(stun_turn_config);
      let message = makeParameter(VideoChat.roomid,'');

      VideoChat.socket.on('token', VideoChat.onToken(VideoChat.createOffer));
      VideoChat.socket.emit('token',message);

    } catch (e) {
      console.log("Failed to create PeerConnection, exception: " + e.message);
    }



    // VideoChat.peerConnection = new RTCPeerConnection({
    //   iceServers: stun_turn_config
    // });
    // VideoChat.peerConnection.addStream(VideoChat.localStream);
    // VideoChat.peerConnection.onicecandidate = VideoChat.onIceCandidate;
    // VideoChat.peerConnection.onaddstream = VideoChat.onAddStream;
    // VideoChat.socket.on('candidate', VideoChat.onCandidate);
    // VideoChat.socket.on('answer', VideoChat.onAnswer);
    //
    // VideoChat.createOffer();
  },

  createAnswer: function(offer){
    console.log("createAnswer");
    console.log(offer);
    return function(){
      var rtcOffer = new RTCSessionDescription(JSON.parse(offer));
      VideoChat.peerConnection.setRemoteDescription(rtcOffer);
      VideoChat.peerConnection.createAnswer(
        function(answer){
          VideoChat.peerConnection.setLocalDescription(answer);
          let message = makeParameter(VideoChat.roomid,JSON.stringify(answer));
          VideoChat.socket.emit('answer', message);
        },
        function(err){
          console.log(err);
        }
      );
    }
  },

  onToken: function(callback){
    console.log("onToken");
    return function(token){
      VideoChat.peerConnection = null;

      try {
        VideoChat.peerConnection = new RTCPeerConnection(stun_turn_config);
        VideoChat.peerConnection.addStream(VideoChat.localStream);
        VideoChat.peerConnection.onicecandidate = VideoChat.onIceCandidate;
        VideoChat.peerConnection.onaddstream = VideoChat.onAddStream;
        VideoChat.socket.on('candidate', VideoChat.onCandidate);
        VideoChat.socket.on('answer', VideoChat.onAnswer);
        callback();

      } catch (e) {
        console.log("Failed to create PeerConnection, exception: " + e.message);
      }


    }
  },

  createOffer: function(){
    console.log('createOffer');
    VideoChat.peerConnection.createOffer(
      function(offer){
        VideoChat.peerConnection.setLocalDescription(offer);
        let message = makeParameter(VideoChat.roomid,JSON.stringify(offer));
        console.log(VideoChat.roomid);
        VideoChat.socket.emit('offer', message);
      },
      function(err){
        console.log(err);
      }
    );
  },

  onCandidate: function(candidate){
    console.log('onCandidate');
    var rtcCandidate = new RTCIceCandidate(JSON.parse(candidate));
    VideoChat.peerConnection.addIceCandidate(rtcCandidate);
  },

  onAnswer: function(answer){
    console.log('onAnswer');
    var rtcAnswer = new RTCSessionDescription(JSON.parse(answer));
    VideoChat.peerConnection.setRemoteDescription(rtcAnswer);
  },

  onIceCandidate: function(event){
    console.log('onIceCandidate');
    if(event.candidate){
      console.log('Generated candidate!');
      let message = makeParameter(VideoChat.roomid,JSON.stringify(event.candidate));
      VideoChat.socket.emit('candidate', message);
    }
  },

  onAddStream: function(event){
    console.log('onAddStream');
    VideoChat.remoteVideo = document.getElementById('remote-video');
    setVideo(VideoChat.remoteVideo,event.stream);
  },

  noMediaStream: function(){
    console.log("No media stream for us.");
    // Sad trombone.
  }
};


VideoChat.socket.on('error', (error) => {
  // ...
  console.log("Error not connected:"+error);
  alert("シグナリングサーバに接続できません。");
});
VideoChat.socket.on('disconnect', (reason) => {
  // ...
  console.log("Error not connected:"+reason);
  alert("シグナリングサーバに接続できません。");
});
VideoChat.socket.on('reconnect_error', (error) => {
  // ...
  console.log("reconnect_error: not connected:"+error);
  alert("シグナリングサーバに接続できません。");
});
VideoChat.socket.on('reconnect_failed', () => {
  // ...
  console.log("reconnect_failed: not connected:");
  alert("シグナリングサーバに接続できません。");
});
VideoChat.socket.on('connect_timeout', (timeout) => {
  // ...
  console.log("connect_timeout: not connected:");
  alert("シグナリングサーバに接続できません。");
});

VideoChat.videoButton = document.getElementById('get-video');
VideoChat.localVideo = document.getElementById('local-video');
VideoChat.remoteVideo = document.getElementById('remote-video');

function startVideo(){
  console.log("startVideo");
  navigator.mediaDevices.getUserMedia(constraints).
    then(VideoChat.onMediaStream).catch(VideoChat.noMediaStream);
}

function stopVideo(){
  console.log("stopVideo");

  stopRecord(VideoChat.localStream);

  pauseVideo(VideoChat.localVideo);
  pauseVideo(VideoChat.remoteVideo);

  stopLocalStream(VideoChat.localStream);
}

function setVideo(element,stream){

  if ('srcObject' in element) {
     element.srcObject = stream;
  }
  else {
     var streamUrl = window.URL.createObjectURL(stream)
     element.src = streamUrl;
  }
}

function hangup(){
  VideoChat.peerConnection.close();
  VideoChat.peerConnection = null;
  pauseVideo(VideoChat.remoteVideo);
}

function pauseVideo(element) {
  element.pause();
  if ('srcObject' in element) {
    element.srcObject = null;
  }
  else {
    if (element.src && (element.src !== '') ) {
      window.URL.revokeObjectURL(element.src);
    }
    element.src = '';
  }
}

function stopLocalStream(stream) {
  let tracks = stream.getTracks();
  if (! tracks) {
    console.warn('NO tracks');
    return;
  }
  for (let track of tracks) {
    track.stop();
  }
}

function startRecord(){
  console.log("start record");
    VideoChat.recorder = new MediaRecorder(VideoChat.localStream);
    VideoChat.recorder.ondataavailable = function(evt) {
        // 録画が終了したタイミングで呼び出される
        console.log("send data");
        let videoBlob = new Blob([evt.data], { type: evt.data.type });
        let message = makeParameter(VideoChat.roomid,videoBlob);
        VideoChat.socket.emit('binary',message);
    }

    // 録画開始
    VideoChat.recorder.start();
}

function stopRecord(){
  console.log("stop record");
  if(VideoChat.recorder == null){
    return;
  }
  VideoChat.recorder.stop();
}

function makeParameter(roomid,message){
  let sendData = {id:roomid,data:message};
  return sendData;
}

// app.js
VideoChat.roomid = arg.roomid;
VideoChat.callButton = document.getElementById('call');
VideoChat.hangupButton = document.getElementById('hangup');
VideoChat.stopButton = document.getElementById('stop-video');
VideoChat.recordButton = document.getElementById('record');

VideoChat.callButton.addEventListener(
  'click',
  VideoChat.startCall,
  false
);



// navigator.mediaDevices.getUserMedia(constraints).
//     then(VideoChat.onMediaStream).catch(VideoChat.noMediaStream);
