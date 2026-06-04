const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/sach -> Lấy danh sách sách kèm tên thể loại (JOIN TheLoai)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT s.ma_sach, s.ten_sach, s.tac_gia, s.ma_the_loai, s.so_luong_ton, t.ten_the_loai 
      FROM Sach s 
      JOIN TheLoai t ON s.ma_the_loai = t.ma_the_loai
    `;
    const [rows] = await pool.query(query);
    return res.status(200).json({
      success: true,
      data: rows,
      message: 'Lấy danh sách sách thành công.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách sách: ' + error.message
    });
  }
});

// POST /api/sach -> Thêm sách mới
router.post('/', async (req, res) => {
  const { ten_sach, tac_gia, ma_the_loai, so_luong_ton } = req.body;

  // Validation
  if (!ten_sach || !tac_gia || ma_the_loai === undefined || so_luong_ton === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng điền đầy đủ thông tin: ten_sach, tac_gia, ma_the_loai, so_luong_ton.'
    });
  }

  if (so_luong_ton < 0) {
    return res.status(400).json({
      success: false,
      message: 'Số lượng tồn kho phải lớn hơn hoặc bằng 0.'
    });
  }

  try {
    // Kiểm tra thể loại tồn tại
    const [theLoaiExists] = await pool.query('SELECT 1 FROM TheLoai WHERE ma_the_loai = ?', [ma_the_loai]);
    if (theLoaiExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mã thể loại không tồn tại.'
      });
    }

    const query = 'INSERT INTO Sach (ten_sach, tac_gia, ma_the_loai, so_luong_ton) VALUES (?, ?, ?, ?)';
    const [result] = await pool.query(query, [ten_sach, tac_gia, ma_the_loai, so_luong_ton]);

    return res.status(201).json({
      success: true,
      data: {
        ma_sach: result.insertId,
        ten_sach,
        tac_gia,
        ma_the_loai,
        so_luong_ton
      },
      message: 'Thêm sách mới thành công.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi thêm sách mới: ' + error.message
    });
  }
});

// PUT /api/sach/:id -> Cập nhật thông tin sách
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { ten_sach, tac_gia, ma_the_loai, so_luong_ton } = req.body;

  // Validation
  if (!ten_sach || !tac_gia || ma_the_loai === undefined || so_luong_ton === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp đầy đủ thông tin để cập nhật.'
    });
  }

  if (so_luong_ton < 0) {
    return res.status(400).json({
      success: false,
      message: 'Số lượng tồn kho phải lớn hơn hoặc bằng 0.'
    });
  }

  try {
    // Kiểm tra thể loại tồn tại
    const [theLoaiExists] = await pool.query('SELECT 1 FROM TheLoai WHERE ma_the_loai = ?', [ma_the_loai]);
    if (theLoaiExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mã thể loại không tồn tại.'
      });
    }

    // Kiểm tra sách tồn tại
    const [sachExists] = await pool.query('SELECT 1 FROM Sach WHERE ma_sach = ?', [id]);
    if (sachExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách cần cập nhật.'
      });
    }

    const query = 'UPDATE Sach SET ten_sach = ?, tac_gia = ?, ma_the_loai = ?, so_luong_ton = ? WHERE ma_sach = ?';
    await pool.query(query, [ten_sach, tac_gia, ma_the_loai, so_luong_ton, id]);

    return res.status(200).json({
      success: true,
      data: {
        ma_sach: parseInt(id),
        ten_sach,
        tac_gia,
        ma_the_loai,
        so_luong_ton
      },
      message: 'Cập nhật thông tin sách thành công.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật thông tin sách: ' + error.message
    });
  }
});

// DELETE /api/sach/:id -> Xóa sách (kiểm tra không còn phiếu mượn chưa trả)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Kiểm tra xem sách có tồn tại không
    const [sachExists] = await pool.query('SELECT 1 FROM Sach WHERE ma_sach = ?', [id]);
    if (sachExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sách cần xóa không tồn tại.'
      });
    }

    // 2. Kiểm tra xem sách có phiếu mượn nào chưa trả không (ngay_tra IS NULL)
    const [activeBorrows] = await pool.query(
      'SELECT COUNT(*) AS count FROM ChiTietPhieuMuon WHERE ma_sach = ? AND ngay_tra IS NULL',
      [id]
    );

    if (activeBorrows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa sách vì đang có sinh viên mượn và chưa trả.'
      });
    }

    // 3. Tiến hành xóa sách. Nếu bị dính lỗi ràng buộc khóa ngoại (RESTRICT) với phiếu cũ đã trả:
    try {
      await pool.query('DELETE FROM Sach WHERE ma_sach = ?', [id]);
      return res.status(200).json({
        success: true,
        message: 'Xóa sách thành công.'
      });
    } catch (dbError) {
      // Bắt lỗi ràng buộc khóa ngoại (ví dụ: ER_ROW_IS_REFERENCED_2)
      if (dbError.code === 'ER_ROW_IS_REFERENCED_2' || dbError.code === 'ER_ROW_IS_REFERENCED') {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa sách vì đã có lịch sử phiếu mượn liên quan lưu trữ trong hệ thống.'
        });
      }
      throw dbError; // Quăng tiếp lỗi khác ra ngoài
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xóa sách: ' + error.message
    });
  }
});

module.exports = router;
