import React, { useState, useEffect } from 'react';
import { getSinhVien, getSach, taoPhieuMuon } from '../services/api';

const TaoPhieuMuon = () => {
  const [sinhVienList, setSinhVienList] = useState([]);
  const [sachList, setSachList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedSv, setSelectedSv] = useState('');
  const [selectedSachIds, setSelectedSachIds] = useState([]);
  
  // Feedback states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [svRes, sachRes] = await Promise.all([getSinhVien(), getSach()]);
        if (svRes.success) setSinhVienList(svRes.data);
        if (sachRes.success) setSachList(sachRes.data);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        setErrorMsg('Lỗi tải dữ liệu từ server.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCheckboxChange = (maSach) => {
    setSelectedSachIds(prev => {
      if (prev.includes(maSach)) {
        return prev.filter(id => id !== maSach);
      } else {
        return [...prev, maSach];
      }
    });
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedSv) {
      setErrorMsg('Vui lòng chọn một sinh viên.');
      return;
    }

    if (selectedSachIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một cuốn sách để mượn.');
      return;
    }

    if (selectedSachIds.length > 5) {
      setErrorMsg('Mỗi sinh viên không được mượn quá 5 cuốn sách cùng lúc.');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        ma_sv: parseInt(selectedSv),
        danh_sach_sach: selectedSachIds
      };

      const res = await taoPhieuMuon(body);
      if (res.success) {
        setSuccessMsg(`Tạo phiếu mượn thành công! Số phiếu: #${res.data.ma_phieu_muon}`);
        setSelectedSachIds([]); // Reset selected books
        setSelectedSv(''); // Reset selected student
        
        // Refresh book list to update stock amounts
        const sachRes = await getSach();
        if (sachRes.success) setSachList(sachRes.data);
      } else {
        setErrorMsg(res.message || 'Tạo phiếu mượn thất bại.');
      }
    } catch (error) {
      setErrorMsg('Lỗi kết nối tới máy chủ: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const showWarning = selectedSachIds.length > 5;

  return (
    <div className="container">
      <h2>➕ Tạo Phiếu Mượn Sách Mới</h2>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
      {showWarning && (
        <div className="alert alert-danger font-bold">
          ⚠️ CẢNH BÁO: Bạn đã chọn {selectedSachIds.length} cuốn sách. Sinh viên không được phép mượn quá 5 cuốn cùng lúc!
        </div>
      )}

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Đang chuẩn bị danh sách sinh viên và sách...</p>
        </div>
      ) : (
        <form onSubmit={handleCreateTicket} className="borrow-form">
          <div className="form-group-block">
            <label htmlFor="student-select" className="block-label">1. Chọn sinh viên mượn sách:</label>
            <select
              id="student-select"
              value={selectedSv}
              onChange={(e) => setSelectedSv(e.target.value)}
              className="form-control select-student"
              required
            >
              <option value="">-- Chọn sinh viên --</option>
              {sinhVienList.map(sv => (
                <option key={sv.ma_sv} value={sv.ma_sv}>
                  {sv.ho_ten} ({sv.mssv}) - Lớp: {sv.lop}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group-block mt-2">
            <label className="block-label">2. Chọn các cuốn sách muốn mượn (Tối đa 5 cuốn):</label>
            <div className="books-checkbox-grid">
              {sachList.map(sach => {
                const isOutOfStock = sach.so_luong_ton === 0;
                const isChecked = selectedSachIds.includes(sach.ma_sach);

                return (
                  <div 
                    key={sach.ma_sach} 
                    className={`book-checkbox-card ${isOutOfStock ? 'out-of-stock' : ''} ${isChecked ? 'checked' : ''}`}
                  >
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(sach.ma_sach)}
                        disabled={isOutOfStock}
                      />
                      <div className="book-info">
                        <span className={`book-title ${isOutOfStock ? 'text-strikethrough' : ''}`}>
                          {sach.ten_sach}
                        </span>
                        <span className="book-meta">
                          Tác giả: {sach.tac_gia} | Thể loại: {sach.ten_the_loai}
                        </span>
                        <span className={`stock-info ${isOutOfStock ? 'text-red' : 'text-green'}`}>
                          Tồn kho: {sach.so_luong_ton} cuốn {isOutOfStock && '(Hết sách)'}
                        </span>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-actions mt-2">
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={submitting || showWarning}
            >
              {submitting ? 'Đang tạo phiếu...' : '➕ Tạo phiếu mượn sách'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TaoPhieuMuon;
