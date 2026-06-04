-- =====================================================================
-- HỆ THỐNG QUẢN LÝ THƯ VIỆN TRƯỜNG HỌC (SCHOOL LIBRARY MANAGEMENT SYSTEM)
-- MÔN HỌC: CÔNG NGHỆ PHẦN MỀM (SOFTWARE ENGINEERING)
-- FILE: database/sample_data.sql
-- MÔ TẢ: Thêm dữ liệu mẫu (5 bản ghi cho mỗi bảng) để kiểm tra hệ thống
-- =====================================================================

USE `library_db`;

-- Tắt kiểm tra khóa ngoại tạm thời để tránh lỗi khi chèn dữ liệu
SET FOREIGN_KEY_CHECKS = 0;

-- Xóa sạch dữ liệu cũ trước khi chèn
TRUNCATE TABLE `ChiTietPhieuMuon`;
TRUNCATE TABLE `PhieuMuon`;
TRUNCATE TABLE `Sach`;
TRUNCATE TABLE `TheLoai`;
TRUNCATE TABLE `SinhVien`;

-- Bật lại kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;

-- 1. CHÈN DỮ LIỆU MẪU CHO BẢNG SinhVien (5 sinh viên)
INSERT INTO `SinhVien` (`ma_sv`, `mssv`, `ho_ten`, `lop`, `email`, `so_dien_thoai`) VALUES
(1, 'B21DCCN001', 'Nguyễn Văn Anh', 'D21CQCN01-B', 'nguyenvananh@student.edu.vn', '0912345678'),
(2, 'B21DCCN002', 'Trần Thị Bình', 'D21CQCN02-B', 'tranthibinh@student.edu.vn', '0987654321'),
(3, 'B22CQCN003', 'Lê Hoàng Cường', 'D22CQCN03-A', 'lehoangcuong@student.edu.vn', '0905123456'),
(4, 'B20CQVT004', 'Phạm Minh Duy', 'D20CQVT01-B', 'phamminhduy@student.edu.vn', '0934567890'),
(5, 'B22CQAT005', 'Hoàng Anh Em', 'D22CQAT02-C', 'hoanganhem@student.edu.vn', '0945678901');

-- 2. CHÈN DỮ LIỆU MẪU CHO BẢNG TheLoai (5 thể loại)
INSERT INTO `TheLoai` (`ma_the_loai`, `ten_the_loai`) VALUES
(1, 'Công nghệ thông tin'),
(2, 'Kinh tế & Quản trị'),
(3, 'Ngoại ngữ & Ngôn ngữ'),
(4, 'Khoa học tự nhiên'),
(5, 'Văn học & Nghệ thuật');

-- 3. CHÈN DỮ LIỆU MẪU CHO BẢNG Sach (5 cuốn sách)
INSERT INTO `Sach` (`ma_sach`, `ten_sach`, `tac_gia`, `ma_the_loai`, `so_luong_ton`) VALUES
(1, 'Lập trình hướng đối tượng với C++', 'Nguyễn Văn Giáp', 1, 15),
(2, 'Nguyên lý kinh tế vĩ mô', 'Paul Samuelson', 2, 8),
(3, 'Tiếng Anh giao tiếp nơi công sở', 'Oxford Press', 3, 12),
(4, 'Vật lý đại cương', 'Lương Duyên Bình', 4, 5),
(5, 'Đất rừng phương Nam', 'Đoàn Giỏi', 5, 20);

-- 4. CHÈN DỮ LIỆU MẪU CHO BẢNG PhieuMuon (5 phiếu mượn)
INSERT INTO `PhieuMuon` (`ma_phieu_muon`, `ma_sv`, `ngay_muon`, `trang_thai`) VALUES
(1, 1, '2026-05-10', 'Da Tra'),
(2, 2, '2026-05-15', 'Chua Tra'),
(3, 3, '2026-05-20', 'Chua Tra'),
(4, 4, '2026-05-25', 'Da Tra'),
(5, 5, '2026-06-01', 'Chua Tra');

-- 5. CHÈN DỮ LIỆU MẪU CHO BẢNG ChiTietPhieuMuon (5+ chi tiết phiếu mượn tương ứng)
INSERT INTO `ChiTietPhieuMuon` (`ma_phieu_muon`, `ma_sach`, `so_luong`, `ngay_tra`) VALUES
(1, 1, 1, '2026-05-17'), -- Phiếu 1 mượn sách CNTT và đã trả đúng hạn ngày 17/5
(1, 3, 1, '2026-05-17'), -- Phiếu 1 mượn thêm sách tiếng Anh và đã trả
(2, 2, 1, NULL),         -- Phiếu 2 mượn sách Kinh tế, chưa trả (ngay_tra là NULL)
(3, 1, 1, NULL),         -- Phiếu 3 mượn sách CNTT, chưa trả
(3, 4, 2, NULL),         -- Phiếu 3 mượn thêm 2 cuốn Vật lý, chưa trả (tổng cộng mượn 3 cuốn)
(4, 5, 1, '2026-06-03'), -- Phiếu 4 mượn sách Văn học và đã trả ngày 03/06
(5, 3, 1, NULL);         -- Phiếu 5 mượn sách tiếng Anh, chưa trả
