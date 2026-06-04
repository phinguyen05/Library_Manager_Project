const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/sinhvien -> Lấy danh sách sinh viên
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM SinhVien');
    return res.status(200).json({
      success: true,
      data: rows,
      message: 'Lấy danh sách sinh viên thành công.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy danh sách sinh viên: ' + error.message
    });
  }
});

// POST /api/sinhvien -> Thêm sinh viên mới
router.post('/', async (req, res) => {
  const { mssv, ho_ten, lop, email, so_dien_thoai } = req.body;

  // Validation
  if (!mssv || !ho_ten || !lop || !email || !so_dien_thoai) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp đầy đủ thông tin: mssv, ho_ten, lop, email, so_dien_thoai.'
    });
  }

  try {
    // Kiểm tra trùng mssv
    const [mssvExists] = await pool.query('SELECT 1 FROM SinhVien WHERE mssv = ?', [mssv]);
    if (mssvExists.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Mã số sinh viên (mssv) đã tồn tại trong hệ thống.'
      });
    }

    // Kiểm tra trùng email
    const [emailExists] = await pool.query('SELECT 1 FROM SinhVien WHERE email = ?', [email]);
    if (emailExists.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Địa chỉ email đã tồn tại trong hệ thống.'
      });
    }

    const query = 'INSERT INTO SinhVien (mssv, ho_ten, lop, email, so_dien_thoai) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.query(query, [mssv, ho_ten, lop, email, so_dien_thoai]);

    return res.status(201).json({
      success: true,
      data: {
        ma_sv: result.insertId,
        mssv,
        ho_ten,
        lop,
        email,
        so_dien_thoai
      },
      message: 'Thêm sinh viên mới thành công.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi thêm sinh viên mới: ' + error.message
    });
  }
});

module.exports = router;
