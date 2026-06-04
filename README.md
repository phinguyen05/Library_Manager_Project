# Hệ thống Quản lý Thư viện Trường học (School Library Management System)

Đây là một dự án Full-stack mẫu được xây dựng cho môn học Công nghệ Phần mềm, bao gồm một Back-end API (Node.js + Express + MySQL) và một Front-end giao diện người dùng (React + Vite).

## Mục lục
- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Hướng dẫn cài đặt và chạy ứng dụng](#hướng-dẫn-cài-đặt-và-chạy-ứng-dụng)
  - [1. Thiết lập Database](#1-thiết-lập-database)
  - [2. Cài đặt và chạy Back-end](#2-cài-đặt-và-chạy-back-end)
  - [3. Cài đặt và chạy Front-end](#3-cài-đặt-và-chạy-front-end)
- [API Endpoints](#api-endpoints)

## Tính năng chính

*   **Quản lý Sách**: Xem danh sách sách, thêm sách mới, cập nhật thông tin sách, xóa sách (có kiểm tra ràng buộc nghiệp vụ).
*   **Quản lý Sinh viên**: Xem danh sách sinh viên, thêm sinh viên mới.
*   **Nghiệp vụ Mượn sách**: 
    *   Lập phiếu mượn mới cho sinh viên với danh sách nhiều cuốn sách.
    *   Tự động kiểm tra số lượng tồn kho.
    *   Kiểm tra giới hạn mượn (mỗi sinh viên không quá 5 cuốn cùng lúc).
    *   Sử dụng **Database Transaction** để đảm bảo tính toàn vẹn dữ liệu.
*   **Nghiệp vụ Trả sách**: 
    *   Cập nhật trạng thái phiếu mượn.
    *   Cộng lại số lượng tồn kho của sách.
    *   Sử dụng **Database Transaction**.
*   **Lịch sử Mượn trả**: Xem danh sách các phiếu mượn với thông tin chi tiết, trạng thái trực quan (Đã trả, Quá hạn, Chưa trả) và khả năng thực hiện trả sách.

## Công nghệ sử dụng

*   **Back-end**: Node.js (Express.js), MySQL (mysql2/promise)
*   **Front-end**: React.js (Vite), HTML, CSS thuần
*   **Database**: MySQL

## Cấu trúc thư mục

```
. (root project folder)
├── backend/
│   ├── app.js             # File chính khởi chạy Express app
│   ├── db.js              # Cấu hình kết nối MySQL pool
│   ├── package.json       # Dependencies và scripts cho backend
│   └── routes/            # Chứa các định nghĩa API routes
│       ├── sach.js        # API cho quản lý sách
│       ├── sinhvien.js    # API cho quản lý sinh viên
│       └── phieumuon.js   # API cho nghiệp vụ mượn/trả sách
├── database/
│   ├── schema.sql         # Định nghĩa cấu trúc database (CREATE TABLE)
│   └── sample_data.sql    # Dữ liệu mẫu cho database
└── frontend/
    ├── index.html         # File HTML chính
    ├── package.json       # Dependencies và scripts cho frontend
    ├── vite.config.js     # Cấu hình Vite
    └── src/               # Mã nguồn React
        ├── App.jsx        # Component chính, quản lý tab navigation
        ├── App.css        # CSS global cho ứng dụng
        ├── main.jsx       # Entry point của React app
        ├── components/    # Các components của ứng dụng
        │   ├── DanhSachSach.jsx     # Hiển thị danh sách sách và thêm sách inline
        │   ├── TaoPhieuMuon.jsx     # Form tạo phiếu mượn
        │   └── LichSuMuonTra.jsx    # Hiển thị lịch sử mượn trả
        └── services/
            └── api.js     # Các hàm gọi API tới backend
```

## Yêu cầu hệ thống

Để chạy ứng dụng này, bạn cần cài đặt các phần mềm sau trên máy tính của mình:

*   **Node.js** (phiên bản 18 trở lên): Bao gồm npm (Node Package Manager)
*   **MySQL Server**: Cơ sở dữ liệu quan hệ (ví dụ: XAMPP, WAMP, Docker MySQL container, hoặc MySQL Server cài đặt độc lập)

## Hướng dẫn cài đặt và chạy ứng dụng

Thực hiện các bước sau theo thứ tự:

### 1. Thiết lập Database

Trước tiên, bạn cần tạo cơ sở dữ liệu và nạp dữ liệu mẫu.

1.  Mở terminal hoặc MySQL client (ví dụ: MySQL Workbench, PhpMyAdmin).
2.  Đảm bảo MySQL Server đang chạy.
3.  Chạy các lệnh SQL sau để tạo database và bảng, sau đó nạp dữ liệu mẫu:
    ```bash
    # Chạy lệnh này từ thư mục gốc của project (nơi có folder database/)
    mysql -u root -p < database/schema.sql
    mysql -u root -p < database/sample_data.sql
    ```
    _Lưu ý: Nhập mật khẩu tài khoản `root` MySQL của bạn khi được yêu cầu. Nếu bạn sử dụng tài khoản MySQL khác, hãy thay `root` bằng username và thêm `-h <host_name>` nếu MySQL server không chạy trên localhost._

### 2. Cài đặt và chạy Back-end

1.  Mở một terminal mới.
2.  Di chuyển vào thư mục `backend`:
    ```bash
    cd backend
    ```
3.  Cài đặt các dependency:
    ```bash
    npm install
    ```
4.  Khởi chạy server Back-end (sẽ chạy trên `http://localhost:3000`):
    ```bash
    npm run dev
    ```
    _Back-end sẽ tự động restart khi có thay đổi code nhờ `nodemon`._

### 3. Cài đặt và chạy Front-end

1.  Mở một terminal **khác** (để Back-end vẫn đang chạy).
2.  Di chuyển vào thư mục `frontend`:
    ```bash
    cd frontend
    ```
3.  Cài đặt các dependency:
    ```bash
    npm install
    ```
4.  Khởi chạy ứng dụng Front-end (sẽ chạy trên `http://localhost:5173`):
    ```bash
    npm run dev
    ```
    _Ứng dụng Front-end sẽ tự động reload khi có thay đổi code._

Giờ bạn có thể mở trình duyệt và truy cập `http://localhost:5173` để trải nghiệm ứng dụng Quản lý Thư viện.

## API Endpoints

Các API được cung cấp bởi Back-end server (chạy tại `http://localhost:3000/api`):

### Sách (`/api/sach`)
*   `GET /api/sach`: Lấy tất cả sách kèm thông tin thể loại.
*   `POST /api/sach`: Thêm sách mới. Body: `{ ten_sach, tac_gia, ma_the_loai, so_luong_ton }`
*   `PUT /api/sach/:id`: Cập nhật sách. Body: `{ ten_sach, tac_gia, ma_the_loai, so_luong_ton }`
*   `DELETE /api/sach/:id`: Xóa sách (chỉ khi không có phiếu mượn chưa trả).

### Sinh viên (`/api/sinhvien`)
*   `GET /api/sinhvien`: Lấy tất cả sinh viên.
*   `POST /api/sinhvien`: Thêm sinh viên mới. Body: `{ mssv, ho_ten, lop, email, so_dien_thoai }`

### Phiếu mượn (`/api/phieu-muon`)
*   `GET /api/phieu-muon`: Lấy lịch sử phiếu mượn chi tiết.
*   `POST /api/phieu-muon`: Tạo phiếu mượn mới. Body: `{ ma_sv, danh_sach_sach: [ma_sach1, ma_sach2, ...] }`
*   `PUT /api/phieu-muon/:id/tra`: Trả toàn bộ sách trong một phiếu mượn. (Không cần body)
