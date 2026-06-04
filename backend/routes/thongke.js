const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET /api/thongke/top-sach -> Lấy top 5 sách được mượn nhiều nhất
router.get("/top-sach", async (req, res) => {
  try {
    const query = `
      SELECT 
        s.ma_sach, 
        s.ten_sach, 
        s.tac_gia, 
        t.ten_the_loai, 
        SUM(ct.so_luong) AS tong_luong_muon
      FROM ChiTietPhieuMuon ct
      JOIN Sach s ON ct.ma_sach = s.ma_sach
      JOIN TheLoai t ON s.ma_the_loai = t.ma_the_loai
      GROUP BY s.ma_sach, s.ten_sach, s.tac_gia, t.ten_the_loai
      ORDER BY tong_luong_muon DESC
      LIMIT 5
    `;
    const [rows] = await pool.query(query);
    return res.status(200).json({
      success: true,
      data: rows,
      message: "Lấy top 5 sách mượn nhiều nhất thành công.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi lấy top sách mượn nhiều nhất: " + error.message,
    });
  }
});

module.exports = router;
