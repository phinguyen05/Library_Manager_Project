const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/phieu-muon -> Lấy lịch sử phiếu mượn (JOIN SinhVien, GROUP_CONCAT danh sách sách, tính ngày mượn & tiền phạt)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        pm.ma_phieu_muon, 
        pm.ma_sv, 
        sv.ho_ten AS ho_ten_sinh_vien, 
        sv.mssv, 
        pm.ngay_muon, 
        pm.trang_thai,
        GROUP_CONCAT(CONCAT(s.ten_sach, ' (x', ct.so_luong, ')') SEPARATOR ', ') AS danh_sach_sach,
        MAX(DATEDIFF(IFNULL(ct.ngay_tra, CURDATE()), pm.ngay_muon)) AS so_ngay_muon,
        IF(MAX(DATEDIFF(IFNULL(ct.ngay_tra, CURDATE()), pm.ngay_muon)) > 14, 
           (MAX(DATEDIFF(IFNULL(ct.ngay_tra, CURDATE()), pm.ngay_muon)) - 14) * 5000, 
           0) AS tien_phat
      FROM PhieuMuon pm
      JOIN SinhVien sv ON pm.ma_sv = sv.ma_sv
      LEFT JOIN ChiTietPhieuMuon ct ON pm.ma_phieu_muon = ct.ma_phieu_muon
      LEFT JOIN Sach s ON ct.ma_sach = s.ma_sach
      GROUP BY pm.ma_phieu_muon
      ORDER BY pm.ngay_muon DESC, pm.ma_phieu_muon DESC
    `;
    const [rows] = await pool.query(query);
    return res.status(200).json({
      success: true,
      data: rows,
      message: 'Lấy lịch sử phiếu mượn thành công.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy lịch sử phiếu mượn: ' + error.message
    });
  }
});

// POST /api/phieu-muon -> Tạo phiếu mượn mới
router.post('/', async (req, res) => {
  const { ma_sv, danh_sach_sach } = req.body;

  // 1. Nhận body và validation cơ bản
  if (!ma_sv || !danh_sach_sach || !Array.isArray(danh_sach_sach) || danh_sach_sach.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp mã sinh viên (ma_sv) và danh sách mã sách (danh_sach_sach: [ma_sach1, ma_sach2, ...]).'
    });
  }

  // Khởi động kết nối transaction
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 2. Kiểm tra sinh viên tồn tại
    const [svRows] = await connection.query('SELECT ma_sv, ho_ten FROM SinhVien WHERE ma_sv = ?', [ma_sv]);
    if (svRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: `Sinh viên có mã ${ma_sv} không tồn tại trong hệ thống.`
      });
    }

    // 3. Gom nhóm sách mượn để đếm số lượng mượn thực tế trong yêu cầu hiện tại
    const bookRequestMap = {};
    for (const bookId of danh_sach_sach) {
      if (!bookId) continue;
      bookRequestMap[bookId] = (bookRequestMap[bookId] || 0) + 1;
    }

    const uniqueBookIds = Object.keys(bookRequestMap).map(Number);
    if (uniqueBookIds.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Danh sách sách mượn không hợp lệ.'
      });
    }

    // Tính tổng số sách yêu cầu mượn trong phiếu này
    let totalRequestedBooks = 0;
    for (const bid of uniqueBookIds) {
      totalRequestedBooks += bookRequestMap[bid];
    }

    // 4. Kiểm tra sinh viên chưa có quá 5 cuốn đang mượn
    const countQuery = `
      SELECT IFNULL(SUM(ct.so_luong), 0) AS total_borrowed
      FROM ChiTietPhieuMuon ct
      JOIN PhieuMuon pm ON ct.ma_phieu_muon = pm.ma_phieu_muon
      WHERE pm.ma_sv = ? AND ct.ngay_tra IS NULL
    `;
    const [borrowedCountRows] = await connection.query(countQuery, [ma_sv]);
    const currentBorrowed = parseInt(borrowedCountRows[0].total_borrowed);

    if (currentBorrowed + totalRequestedBooks > 5) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Sinh viên đã mượn ${currentBorrowed} cuốn chưa trả. Thêm ${totalRequestedBooks} cuốn yêu cầu sẽ vượt quá giới hạn tối đa 5 cuốn cùng lúc.`
      });
    }

    // 5. Kiểm tra từng sách còn so_luong_ton > yêu cầu
    const bookCheckQuery = 'SELECT ma_sach, ten_sach, so_luong_ton FROM Sach WHERE ma_sach IN (?) FOR UPDATE';
    const [bookRows] = await connection.query(bookCheckQuery, [uniqueBookIds]);

    if (bookRows.length !== uniqueBookIds.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Một hoặc nhiều mã sách trong danh sách không tồn tại.'
      });
    }

    // Xác thực số lượng tồn kho từng cuốn
    for (const book of bookRows) {
      const requiredQty = bookRequestMap[book.ma_sach];
      if (book.so_luong_ton < requiredQty) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Sách "${book.ten_sach}" (ID: ${book.ma_sach}) đã hết hoặc không đủ trong kho.`
        });
      }
    }

    // 6. Thực hiện nghiệp vụ (Transaction)
    const insertPMQuery = 'INSERT INTO PhieuMuon (ma_sv, ngay_muon, trang_thai) VALUES (?, CURDATE(), ?)';
    const [pmResult] = await connection.query(insertPMQuery, [ma_sv, 'Chua Tra']);
    const newPhieuMuonId = pmResult.insertId;

    for (const bookId of uniqueBookIds) {
      const qtyToBorrow = bookRequestMap[bookId];

      const insertCTPMQuery = 'INSERT INTO ChiTietPhieuMuon (ma_phieu_muon, ma_sach, so_luong, ngay_tra) VALUES (?, ?, ?, NULL)';
      await connection.query(insertCTPMQuery, [newPhieuMuonId, bookId, qtyToBorrow]);

      const updateStockQuery = 'UPDATE Sach SET so_luong_ton = so_luong_ton - ? WHERE ma_sach = ?';
      await connection.query(updateStockQuery, [qtyToBorrow, bookId]);
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      data: {
        ma_phieu_muon: newPhieuMuonId,
        ma_sv,
        ngay_muon: new Date().toISOString().split('T')[0],
        trang_thai: 'Chua Tra',
        danh_sach_sach: bookRequestMap
      },
      message: 'Tạo phiếu mượn sách thành công.'
    });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra trong quá trình mượn sách: ' + error.message
    });
  } finally {
    connection.release();
  }
});

// PUT /api/phieu-muon/:id/tra -> Trả sách toàn bộ trong phiếu mượn (Tính tiền phạt nâng cao)
router.put('/:id/tra', async (req, res) => {
  const { id } = req.params;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Kiểm tra phiếu mượn tồn tại và xem thông tin ngày mượn, trạng thái
    const [pmRows] = await connection.query(
      'SELECT ma_phieu_muon, trang_thai, ngay_muon FROM PhieuMuon WHERE ma_phieu_muon = ? FOR UPDATE',
      [id]
    );

    if (pmRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Phiếu mượn không tồn tại.'
      });
    }

    if (pmRows[0].trang_thai === 'Da Tra') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Phiếu mượn này đã được hoàn trả hoàn toàn trước đó.'
      });
    }

    // 2. Lấy thông tin các đầu sách chưa trả
    const [ctRows] = await connection.query(
      'SELECT ma_sach, so_luong FROM ChiTietPhieuMuon WHERE ma_phieu_muon = ? AND ngay_tra IS NULL FOR UPDATE',
      [id]
    );

    if (ctRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy sách nào chưa trả trong phiếu mượn này.'
      });
    }

    // 3. Tính tiền phạt nâng cao
    // Tính số ngày chênh lệch giữa ngày mượn và ngày hiện tại
    const ngayMuon = new Date(pmRows[0].ngay_muon);
    const ngayHienTai = new Date();
    
    // Đưa về cùng giờ 00:00:00 để tính chính xác ngày
    ngayMuon.setHours(0,0,0,0);
    ngayHienTai.setHours(0,0,0,0);

    const timeDiff = ngayHienTai.getTime() - ngayMuon.getTime();
    const so_ngay_muon = Math.floor(timeDiff / (1000 * 3600 * 24));
    const so_ngay_qua_han = so_ngay_muon > 14 ? so_ngay_muon - 14 : 0;
    const tien_phat = so_ngay_qua_han * 5000;

    // 4. Cập nhật trạng thái phiếu mượn thành 'Da Tra'
    const updatePMQuery = "UPDATE PhieuMuon SET trang_thai = 'Da Tra' WHERE ma_phieu_muon = ?";
    await connection.query(updatePMQuery, [id]);

    // 5. Cập nhật ngày trả thực tế trong ChiTietPhieuMuon
    const updateCTPMQuery = 'UPDATE ChiTietPhieuMuon SET ngay_tra = CURDATE() WHERE ma_phieu_muon = ? AND ngay_tra IS NULL';
    await connection.query(updateCTPMQuery, [id]);

    // 6. Hoàn trả số lượng tồn kho cho sách
    for (const detail of ctRows) {
      const updateStockQuery = 'UPDATE Sach SET so_luong_ton = so_luong_ton + ? WHERE ma_sach = ?';
      await connection.query(updateStockQuery, [detail.so_luong, detail.ma_sach]);
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      data: {
        ma_phieu_muon: parseInt(id),
        so_ngay_muon,
        so_ngay_qua_han,
        tien_phat
      },
      message: 'Trả toàn bộ sách trong phiếu mượn thành công.'
    });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi trả sách: ' + error.message
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
