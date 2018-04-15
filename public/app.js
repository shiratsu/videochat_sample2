// app.js
'use strict';

// Put variables in global scope to make them available to the browser console.
var constraints = window.constraints = {
  audio: false,
  video: true
};


var VideoChat = {
  socket: io(),

  onMediaStream: function(stream){

    VideoChat.localVideo.volume = 0;
    VideoChat.localStream = stream;
    VideoChat.videoButton.setAttribute('disabled', 'disabled');

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
  },

  readyToCall: function(event){
    console.log("readyToCall");
    VideoChat.callButton.removeAttribute('disabled');
  },

  startCall: function(event){
    console.log("startCall");
    console.log("Things are going as planned!");

    VideoChat.peerConnection = new RTCPeerConnection({
      iceServers: [{urls: "stun:global.stun.twilio.com:3478?transport=udp" }]
    });

    VideoChat.socket.on('token', VideoChat.onToken(VideoChat.createOffer));
    VideoChat.socket.emit('token');
  },

  createAnswer: function(offer){
    return function(){
      rtcOffer = new RTCSessionDescription(JSON.parse(offer));
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
        iceServers: token.iceServers
      });

      VideoChat.peerConnection.onicecandidate = VideoChat.onIceCandidate;
      VideoChat.socket.on('candidate', VideoChat.onCandidate);
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
    rtcCandidate = new RTCIceCandidate(JSON.parse(candidate));
    VideoChat.peerConnection.addIceCandidate(rtcCandidate);
  },

  onIceCandidate: function(event){
    if(event.candidate){
      console.log('Generated candidate!');
      VideoChat.socket.emit('candidate', JSON.stringify(event.candidate));
    }
  },

  noMediaStream: function(){
    console.log("No media stream for us.");
    // Sad trombone.
  }
};

VideoChat.videoButton = document.getElementById('get-video');
VideoChat.localVideo = document.getElementById('local-video');
VideoChat.remoteVideo = document.getElementById('remote-video');
// function startVideo(){
//   navigator.mediaDevices.getUserMedia(constraints).
//     then(VideoChat.onMediaStream).catch(VideoChat.noMediaStream);
// }


// VideoChat.videoButton.addEventListener(
//   'click',
//   navigator.mediaDevices.getUserMedia(constraints).
//       then(VideoChat.onMediaStream).catch(VideoChat.noMediaStream),
//   false
// );

// app.js
VideoChat.callButton = document.getElementById('call');

VideoChat.callButton.addEventListener(
  'click',
  VideoChat.startCall,
  false
);

navigator.mediaDevices.getUserMedia(constraints).
    then(VideoChat.onMediaStream).catch(VideoChat.noMediaStream);
