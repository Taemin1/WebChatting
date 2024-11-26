const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const connectDB = require('./mongoose/db.js');
const User = require('./mongoose/schemas/user.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 5000;
const SECRET_KEY = 'your_secret_key';

let rooms = []; // 방 목록 저장

// MongoDB 연결
connectDB();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: '토큰이 유효하지 않습니다.' });
    req.user = user;
    next();
  });
};

// 로그인 라우트
app.post('/login', async (req, res) => {
  const { id, password } = req.body;
  try {
    const user = await User.findOne({ id, password });
    if (user) {
      const token = jwt.sign({ id: user.id, name: user.name }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ success: true, message: '로그인 성공', redirectTo: '/home.html', token });
    } else {
      res.status(401).json({ success: false, message: 'ID 또는 비밀번호가 일치하지 않습니다.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// 회원가입 라우트
app.post('/register', async (req, res) => {
  const { id, password, name } = req.body;
  try {
    const existingUser = await User.findOne({ id });
    if (existingUser) {
      res.status(400).json({ success: false, message: '이미 사용 중인 ID입니다.' });
    } else {
      const newUser = new User({ id, password, name });
      await newUser.save();
      res.json({ success: true, message: '회원가입 성공', redirectTo: '/login.html' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

app.get('/', (req, res) => {
  res.redirect('login.html');
})
// 홈 라우트
app.get('/home', authenticateToken, (req, res) => {
  res.json({ success: true, id: req.user.id, name: req.user.name });
});

// 방 목록 및 방 생성
io.on('connection', (socket) => {
  console.log(`사용자 연결됨: ${socket.id}`);

  // 방 목록 전송
  socket.on('getRooms', () => {
    socket.emit('updateRooms', rooms);
  });

  // 방 생성
  socket.on('createRoom', (roomTitle) => {
    const newRoom = { title: roomTitle, users: 0, maxUsers: 3, id: rooms.length + 1 };
    rooms.push(newRoom);
    socket.emit('roomCreated', newRoom.id);
    io.emit('updateRooms', rooms); // 모든 사용자에게 방 목록 업데이트
  });

  // 방 입장
  socket.on('joinRoom', (roomId, userId) => {
    socket.join(roomId);
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      room.users += 1;
      io.to(roomId).emit('userJoined', { userId, id: socket.id });
    }
  });

  // WebRTC 신호 처리
  socket.on('signal', ({ roomId, signalData, userId }) => {
    socket.to(roomId).emit('signal', { signalData, userId, id: socket.id });
  });

  // 채팅 메시지 전송
  socket.on('message', ({ roomId, message, userId }) => {
    const timestamp = new Date().toLocaleTimeString();
    io.to(roomId).emit('message', { userId, message, timestamp });
  });

  // 사용자 연결 해제 처리
  socket.on('disconnecting', () => {
    const joinedRooms = Array.from(socket.rooms).filter((room) => room !== socket.id);
    joinedRooms.forEach((roomId) => {
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        room.users -= 1;
        if (room.users === 0) {
          rooms = rooms.filter((r) => r.id !== room.id); // 빈 방 삭제
        }
      }
    });
    io.emit('updateRooms', rooms); // 모든 사용자에게 방 목록 업데이트
  });

  socket.on('disconnect', () => {
    console.log(`사용자 연결 해제: ${socket.id}`);
  });
});

// 서버 시작
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
