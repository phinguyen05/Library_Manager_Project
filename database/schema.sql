-- =====================================================================
-- HỆ THỐNG QUẢN LÝ THƯ VIỆN TRƯỜNG HỌC (SCHOOL LIBRARY MANAGEMENT SYSTEM)
-- MÔN HỌC: CÔNG NGHỆ PHẦN MỀM (SOFTWARE ENGINEERING)
-- FILE: database/schema.sql
-- =====================================================================

-- Tạo Database nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS `library_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `library_db`;

-- Xóa các bảng cũ nếu tồn tại (để reset lại database khi cần) theo đúng thứ tự ràng buộc khóa ngoại
DROP TABLE IF EXISTS `ChiTietPhieuMuon`;
DROP TABLE IF EXISTS `PhieuMuon`;
DROP TABLE IF EXISTS `Sach`;
DROP TABLE IF EXISTS `TheLoai`;
DROP TABLE IF EXISTS `SinhVien`;

-- 1. BẢNG SinhVien (Sinh viên)
-- Lưu thông tin cá nhân của các sinh viên mượn sách.
CREATE TABLE `SinhVien` (
    `ma_sv` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã sinh viên (Khóa chính tự tăng)',
    `mssv` VARCHAR(20) NOT NULL UNIQUE COMMENT 'Mã số sinh viên thực tế (Không trùng lặp, ví dụ: B21DCCN001)',
    `ho_ten` VARCHAR(100) NOT NULL COMMENT 'Họ và tên đầy đủ của sinh viên',
    `lop` VARCHAR(50) NOT NULL COMMENT 'Lớp học hiện tại của sinh viên (ví dụ: D21CQCN01-B)',
    `email` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Địa chỉ thư điện tử (Không được trùng lặp)',
    `so_dien_thoai` VARCHAR(15) NOT NULL COMMENT 'Số điện thoại liên lạc của sinh viên'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu trữ thông tin sinh viên';

-- 2. BẢNG TheLoai (Thể loại sách)
-- Tách riêng để đạt chuẩn hóa 3NF, tránh dư thừa dữ liệu tên thể loại sách.
CREATE TABLE `TheLoai` (
    `ma_the_loai` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã thể loại (Khóa chính tự tăng)',
    `ten_the_loai` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên thể loại sách (ví dụ: Giáo trình, Công nghệ thông tin, Kinh tế...)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu trữ thể loại sách';

-- 3. BẢNG Sach (Sách)
-- Quản lý thông tin sách trong thư viện, liên kết với bảng Thể loại và áp dụng ràng buộc số lượng tồn.
CREATE TABLE `Sach` (
    `ma_sach` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã sách (Khóa chính tự tăng)',
    `ten_sach` VARCHAR(255) NOT NULL COMMENT 'Tên của cuốn sách',
    `tac_gia` VARCHAR(150) NOT NULL COMMENT 'Họ tên tác giả hoặc nhóm tác giả',
    `ma_the_loai` INT NOT NULL COMMENT 'Mã thể loại (Khóa ngoại tham chiếu tới bảng TheLoai)',
    `so_luong_ton` INT NOT NULL DEFAULT 0 COMMENT 'Số lượng sách thực tế còn tồn trong kho',
    CONSTRAINT `chk_sach_so_luong_ton` CHECK (`so_luong_ton` >= 0), -- Đảm bảo số lượng tồn kho không bao giờ âm (< 0)
    CONSTRAINT `fk_sach_the_loai` FOREIGN KEY (`ma_the_loai`) 
        REFERENCES `TheLoai` (`ma_the_loai`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu trữ thông tin chi tiết các đầu sách';

-- 4. BẢNG PhieuMuon (Phiếu mượn)
-- Quản lý thông tin chung của giao dịch mượn sách. Trạng thái phiếu được cập nhật khi mượn/trả.
CREATE TABLE `PhieuMuon` (
    `ma_phieu_muon` INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã phiếu mượn (Khóa chính tự tăng)',
    `ma_sv` INT NOT NULL COMMENT 'Mã sinh viên mượn sách (Khóa ngoại tham chiếu tới bảng SinhVien)',
    `ngay_muon` DATE NOT NULL COMMENT 'Ngày lập phiếu mượn sách',
    `trang_thai` VARCHAR(50) NOT NULL DEFAULT 'Chua Tra' COMMENT 'Trạng thái phiếu mượn (Chua Tra, Da Tra)',
    CONSTRAINT `chk_phieu_muon_trang_thai` CHECK (`trang_thai` IN ('Chua Tra', 'Da Tra')), -- Ràng buộc các trạng thái hợp lệ
    CONSTRAINT `fk_phieu_muon_sinh_vien` FOREIGN KEY (`ma_sv`) 
        REFERENCES `SinhVien` (`ma_sv`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng lưu trữ thông tin các phiếu mượn sách';

-- 5. BẢNG ChiTietPhieuMuon (Chi tiết phiếu mượn)
-- Bảng trung gian giải quyết quan hệ nhiều-nhiều (N-N) giữa PhieuMuon và Sach.
CREATE TABLE `ChiTietPhieuMuon` (
    `ma_phieu_muon` INT NOT NULL COMMENT 'Mã phiếu mượn (Khóa ngoại tham chiếu PhieuMuon, một phần của Khóa chính)',
    `ma_sach` INT NOT NULL COMMENT 'Mã sách được mượn (Khóa ngoại tham chiếu Sach, một phần của Khóa chính)',
    `so_luong` INT NOT NULL DEFAULT 1 COMMENT 'Số lượng cuốn sách mượn đối với đầu sách này trong phiếu mượn này',
    `ngay_tra` DATE DEFAULT NULL COMMENT 'Ngày sinh viên thực tế trả sách (NULL nếu chưa trả)',
    PRIMARY KEY (`ma_phieu_muon`, `ma_sach`), -- Khóa chính phức hợp gồm (ma_phieu_muon, ma_sach)
    CONSTRAINT `chk_ctpm_so_luong` CHECK (`so_luong` > 0), -- Đảm bảo số lượng mượn lớn hơn 0
    CONSTRAINT `fk_ctpm_phieu_muon` FOREIGN KEY (`ma_phieu_muon`) 
        REFERENCES `PhieuMuon` (`ma_phieu_muon`) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_ctpm_sach` FOREIGN KEY (`ma_sach`) 
        REFERENCES `Sach` (`ma_sach`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng trung gian lưu chi tiết sách được mượn trong mỗi phiếu mượn';
