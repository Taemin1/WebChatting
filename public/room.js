const socket = io();
const videoContainer = document.getElementById('video-container');
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessageButton');
const chatMessages = document.getElementById('chatMessages');
const toggleCamera = document.getElementById('toggleCamera');
const toggleMic = document.getElementById('toggleMic');

const roomId = new URLSearchParams(window.location.search).get('roomId');
const userId = localStorage.getItem('userId') || 'Guest'; // Replace with real user ID
let localStream;
let peers = {};

// 미디어 장치 설정
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localStream = stream;
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoElement.muted = true;

    const userLabel = document.createElement('div');
    userLabel.textContent = userId;

    const videoWrapper = document.createElement('div');
    videoWrapper.appendChild(videoElement);
    videoWrapper.appendChild(userLabel);

    videoContainer.appendChild(videoWrapper);

    socket.emit('joinRoom', roomId, userId);

    socket.on('userJoined', ({ userId: remoteUserId, id: socketId }) => {
      const peer = new SimplePeer({ initiator: true, stream });
      peers[socketId] = peer;

      peer.on('signal', (signalData) => {
        socket.emit('signal', { roomId, signalData, userId });
      });

      peer.on('stream', (remoteStream) => {
        addRemoteStream(remoteStream, remoteUserId);
      });
    });

    socket.on('signal', ({ signalData, userId: remoteUserId, id: socketId }) => {
      const peer = peers[socketId] || new SimplePeer({ initiator: false, stream });
      peers[socketId] = peer;

      peer.signal(signalData);

      peer.on('stream', (remoteStream) => {
        addRemoteStream(remoteStream, remoteUserId);
      });
    });

    socket.on('userLeft', ({ id }) => {
      if (peers[id]) {
        peers[id].destroy();
        delete peers[id];
      }
    });
  })
  .catch((err) => console.error('Error accessing media devices:', err));

// 채팅 메시지 전송
sendMessageButton.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit('message', { roomId, message, userId });
    messageInput.value = '';
  }
});

// 채팅 메시지 수신
socket.on('message', ({ userId, message, timestamp }) => {
  const li = document.createElement('li');
  li.textContent = `[${timestamp}] ${userId}: ${message}`;
  chatMessages.appendChild(li);
});

// 카메라 및 마이크 토글
toggleCamera.addEventListener('click', () => {
  const videoTrack = localStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
});

toggleMic.addEventListener('click', () => {
  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
});

// 원격 스트림 추가
function addRemoteStream(stream, userId) {
  const videoElement = document.createElement('video');
  videoElement.srcObject = stream;
  videoElement.autoplay = true;

  const userLabel = document.createElement('div');
  userLabel.textContent = userId;

  const videoWrapper = document.createElement('div');
  videoWrapper.appendChild(videoElement);
  videoWrapper.appendChild(userLabel);

  videoContainer.appendChild(videoWrapper);
}
