const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbURI = 'mongodb://localhost:27017/HW2_db'; // 로컬 DB
    await mongoose.connect(dbURI);
    console.log('MongoDB에 연결되었습니다.');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1); // 연결 실패 시 프로세스 종료
  }
};

module.exports = connectDB;
