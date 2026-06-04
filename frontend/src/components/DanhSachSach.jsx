import React, { useState, useEffect } from 'react';
import { getSach, themSach } from '../services/api';

const DanhSachSach = () => {
  const [sachList, setSachList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [tenSach, setTenSach] = useState('');
  const [tacGia, setTacGia] = useState('');
  const [maTheLoai, setMaTheLoai] = useState('1');
  const [soLuongTon, setSoLuongTon] = useState('5');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSach = async () => {
    setLoading(true);
    try {
      const res = await getSach();
      if (res.success) {
        setSachList(res.data);
      } else {
        console.error(res.message);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSach();
  }, []);

  const handleAddBook = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!tenSach || !tacGia || !soLuongTon) {
      setErrorMsg('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    try {
      const body = {
        ten_sach: tenSach,
        tac_gia: tacGia,
        ma_the_loai: parseInt(maTheLoai),
        so_luong_ton: parseInt(soLuongTon)
      };

      const res = await themSach(body);
      if (res.success) {
        setSuccessMsg('Thêm sách mới thành công!');
        // Reset form
        setTenSach('');
        setTacGia('');
        setMaTheLoai('1');
        setSoLuongTon('5');
        setShowAddForm(false);
        // Refresh list
        fetchSach();
      } else {
        setErrorMsg(res.message || 'Thêm sách thất bại.');
      }
    } catch (error) {
      setErrorMsg('Lỗi kết nối tới máy chủ: ' + error.message);
    }
  };

  // Filter client-side
  const filteredSach = sachList.filter(sach => {
    const term = searchTerm.toLowerCase();
    const matchName = sach.ten_sach.toLowerCase().includes(term);
    const matchGenre = sach.ten_the_loai.toLowerCase().includes(term);
    return matchName || matchGenre;
  });

  const getStockBadgeClass = (qty) => {
    if (qty === 0) return 'badge-danger'; // đỏ
    if (qty <= 3) return 'badge-warning'; // vàng
    return 'badge-success'; // xanh lá
  };

  return (
    <div className="container">
      <div className="header-actions">
        <h2>📚 Danh mục Sách Thư viện</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '❌ Hủy thêm sách' : '➕ Thêm sách mới'}
        </button>
      </div>

      {showAddForm && (
        <form className="add-form inline-form" onSubmit={handleAddBook}>
          <h3>Thêm sách mới</h3>
          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
          {successMsg && <div className="alert alert-success">{successMsg}</div>}
          
          <div className="form-row">
            <div className="form-group">
              <label>Tên sách:</label>
              <input 
                type="text" 
                value={tenSach} 
                onChange={(e) => setTenSach(e.target.value)} 
                placeholder="Nhập tên sách..." 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Tác giả:</label>
              <input 
                type="text" 
                value={tacGia} 
                onChange={(e) => setTacGia(e.target.value)} 
                placeholder="Nhập tên tác giả..." 
                required 
              />
            </div>

            <div className="form-group">
              <label>Thể loại:</label>
              <select value={maTheLoai} onChange={(e) => setMaTheLoai(e.target.value)}>
                <option value="1">Công nghệ thông tin</option>
                <option value="2">Kinh tế & Quản trị</option>
                <option value="3">Ngoại ngữ & Ngôn ngữ</option>
                <option value="4">Khoa học tự nhiên</option>
                <option value="5">Văn học & Nghệ thuật</option>
              </select>
            </div>

            <div className="form-group">
              <label>Số lượng tồn:</label>
              <input 
                type="number" 
                min="0"
                value={soLuongTon} 
                onChange={(e) => setSoLuongTon(e.target.value)} 
                required 
              />
            </div>
          </div>
          <button type="submit" className="btn btn-success mt-1">Lưu sách</button>
        </form>
      )}

      <div className="search-box">
        <input 
          type="text" 
          placeholder="🔍 Tìm kiếm theo tên sách hoặc thể loại..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Đang tải danh mục sách...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên sách</th>
                <th>Tác giả</th>
                <th>Thể loại</th>
                <th>Số lượng tồn</th>
              </tr>
            </thead>
            <tbody>
              {filteredSach.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">Không tìm thấy cuốn sách nào khớp với từ khóa tìm kiếm.</td>
                </tr>
              ) : (
                filteredSach.map(sach => (
                  <tr key={sach.ma_sach}>
                    <td><strong>#{sach.ma_sach}</strong></td>
                    <td className="text-bold">{sach.ten_sach}</td>
                    <td>{sach.tac_gia}</td>
                    <td><span className="genre-pill">{sach.ten_the_loai}</span></td>
                    <td>
                      <span className={`badge ${getStockBadgeClass(sach.so_luong_ton)}`}>
                        {sach.so_luong_ton} {sach.so_luong_ton === 0 ? '(Hết hàng)' : 'cuốn'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DanhSachSach;
