const express = require('express');
const cors = require('cors');

const sachRoutes = require('./routes/sach');
const sinhVienRoutes = require('./routes/sinhvien');
const phieuMuonRoutes = require('./routes/phieumuon');
const thongKeRoutes = require('./routes/thongke');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/sach', sachRoutes);
app.use('/api/sinhvien', sinhVienRoutes);
app.use('/api/phieu-muon', phieuMuonRoutes);
app.use('/api/thongke', thongKeRoutes);

// Route mặc định cho API check trạng thái
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chào mừng bạn đến với API Hệ thống quản lý thư viện trường học!'
  });
});

// Xử lý lỗi 404 cho các route không tồn tại
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API Endpoint không tồn tại.'
  });
});

// Xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Có lỗi hệ thống xảy ra: ' + err.message
  });
});

// Lắng nghe port 3000
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
