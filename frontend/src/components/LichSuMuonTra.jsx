import React, { useState, useEffect } from 'react';
import { getPhieuMuon, traSach } from '../services/api';

const LichSuMuonTra = () => {
  const [phieuMuonList, setPhieuMuonList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); // For return button

  const fetchPhieuMuon = async () => {
    setLoading(true);
    try {
      const res = await getPhieuMuon();
      if (res.success) {
        setPhieuMuonList(res.data);
      } else {
        console.error(res.message);
        setErrorMsg(res.message || 'Lỗi khi tải lịch sử phiếu mượn.');
      }
    } catch (error) {
      console.error('Error fetching borrow history:', error);
      setErrorMsg('Lỗi kết nối tới máy chủ khi tải lịch sử.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhieuMuon();
  }, []);

  const getStatusBadge = (pm) => {
    if (pm.trang_thai === 'Da Tra') {
      const fineText = pm.tien_phat > 0 ? ` (Phạt: ${pm.tien_phat.toLocaleString('vi-VN')}đ)` : '';
      return <span className="badge badge-success">Đã trả{fineText}</span>;
    }

    if (pm.so_ngay_muon > 14) {
      const fineEstimate = (pm.so_ngay_muon - 14) * 5000;
      return <span className="badge badge-warning">Quá hạn ({fineEstimate.toLocaleString('vi-VN')}đ)</span>;
    }

    return <span className="badge badge-danger">Chưa trả</span>;
  };

  const handleReturnBook = async (maPhieuMuon) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xác nhận trả toàn bộ sách trong phiếu mượn #${maPhieuMuon} này không?`)) {
      return;
    }

    setIsProcessing(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await traSach(maPhieuMuon);
      if (res.success) {
        const { so_ngay_muon, so_ngay_qua_han, tien_phat } = res.data;
        let info = `Phiếu mượn #${maPhieuMuon} đã được trả sách thành công!`;
        if (tien_phat > 0) {
          info += `\n- Số ngày mượn: ${so_ngay_muon} ngày.\n- Số ngày quá hạn: ${so_ngay_qua_han} ngày.\n- Tiền phạt: ${tien_phat.toLocaleString('vi-VN')}đ.`;
        } else {
          info += ` (Trả đúng hạn trong vòng ${so_ngay_muon} ngày).`;
        }
        alert(info);
        setSuccessMsg(`Phiếu mượn #${maPhieuMuon} đã trả thành công.`);
        fetchPhieuMuon(); // Refresh list
      } else {
        setErrorMsg(res.message || 'Trả sách thất bại.');
      }
    } catch (error) {
      setErrorMsg('Lỗi kết nối tới máy chủ khi trả sách: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container">
      <h2>📋 Lịch Sử Mượn Trả Sách</h2>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Đang tải lịch sử mượn trả...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Sinh viên</th>
                <th>Ngày mượn</th>
                <th>Danh sách sách</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {phieuMuonList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">Không có phiếu mượn nào trong lịch sử.</td>
                </tr>
              ) : (
                phieuMuonList.map(pm => (
                  <tr key={pm.ma_phieu_muon}>
                    <td><strong>#{pm.ma_phieu_muon}</strong></td>
                    <td>{pm.ho_ten_sinh_vien} ({pm.mssv})</td>
                    <td>{new Date(pm.ngay_muon).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <span className="book-list-display">
                        {pm.danh_sach_sach || 'Không có sách'}
                      </span>
                    </td>
                    <td>{getStatusBadge(pm)}</td>
                    <td>
                      {pm.trang_thai === 'Chua Tra' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleReturnBook(pm.ma_phieu_muon)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Đang xử lý...' : '✅ Trả sách'}
                        </button>
                      )}
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

export default LichSuMuonTra;
