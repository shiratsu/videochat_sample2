// app.js
'use strict';

// Put variables in global scope to make them available to the browser console.
var constraints = window.constraints = {
  audio: false,
  video: true
};
let stun_turn_config = {"iceServers":[
    {"urls": "stun:localhost:3478","username":"hiratsuka", "credential":"test"},
    {"urls":"stun:localhost:3478?transport=udp", "username":"hiratsuka", "credential":"test"},
    {"urls":"turn:localhost:3478?transport=tcp", "username":"hiratsuka", "credential":"test"}
  ]};

// let stun_turn_config = {"iceServers":[
//     ]};

// let stun_turn_config = {"iceServers":[{urls: "stun:global.stun.twilio.com:3478?transport=udp" }
//     ]};

var VideoChat = {
  socket: io(),

  onMediaStream: function(stream){

    VideoChat.localVideo.volume = 0;
    VideoChat.localStream = stream;
    VideoChat.videoButton.setAttribute('disabled', 'disabled');
    VideoChat.callButton.removeAttribute('disabled');
    VideoChat.recordButton.removeAttribute('disabled');

    if ('srcObject' in VideoChat.localVideo) {
       VideoChat.localVideo.srcObject = stream;
    }
    else {
       var streamUrl = window.URL.createObjectURL(stream)
       VideoChat.localVideo.src = streamUrl;
    }
    console.log("onMediaStream");
    VideoChat.socket.emit('join', 'test');
    VideoChat.socket.on('ready', VideoChat.readyToCall);
    VideoChat.socket.on('offer', VideoChat.onOffer);

  },

  onOffer: function(offer){
    console.log('Got an offer')
    console.log(offer);

    VideoChat.socket.on('token', VideoChat.onToken(VideoChat.createAnswer(offer)));
    VideoChat.socket.emit('token');

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

    VideoChat.peerConnection = new RTCPeerConnection({
      iceServers: stun_turn_config
    });

    VideoChat.socket.on('token', VideoChat.onToken(VideoChat.createOffer));
    VideoChat.socket.emit('token');

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
          VideoChat.socket.emit('answer', JSON.stringify(answer));
        },
        function(err){
          console.log(err);
        }
      );
    }
  },

  onToken: function(callback){
    return function(token){
      VideoChat.peerConnection = new RTCPeerConnection({
        iceServers: stun_turn_config
      });
      VideoChat.peerConnection.addStream(VideoChat.localStream);
      VideoChat.peerConnection.onicecandidate = VideoChat.onIceCandidate;
      VideoChat.peerConnection.onaddstream = VideoChat.onAddStream;
      VideoChat.socket.on('candidate', VideoChat.onCandidate);
      VideoChat.socket.on('answer', VideoChat.onAnswer);
      callback();

    }
  },

  createOffer: function(){
    VideoChat.peerConnection.createOffer(
      function(offer){
        VideoChat.peerConnection.setLocalDescription(offer);
        VideoChat.socket.emit('offer', JSON.stringify(offer));
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
      VideoChat.socket.emit('candidate', JSON.stringify(event.candidate));
    }
  },

  onAddStream: function(event){
    console.log('onAddStream');
    VideoChat.remoteVideo = document.getElementById('remote-video');
    VideoChat.remoteVideo.src = window.URL.createObjectURL(event.stream);
  },

  noMediaStream: function(){
    console.log("No media stream for us.");
    // Sad trombone.
  }
};

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

  pauseVideo(VideoChat.localVideo);
  pauseVideo(VideoChat.remoteVideo);

  stopLocalStream(VideoChat.localStream);
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
  
}


// VideoChat.videoButton.addEventListener(
//   'click',
//   navigator.mediaDevices.getUserMedia(constraints).
//       then(VideoChat.onMediaStream).catch(VideoChat.noMediaStream),
//   false
// );

// app.js
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
