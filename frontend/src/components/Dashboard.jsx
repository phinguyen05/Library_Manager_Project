import React, { useState, useEffect } from 'react';
import { getTopSach } from '../services/api';

const Dashboard = () => {
  const [topSach, setTopSach] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchTopSach = async () => {
      setLoading(true);
      try {
        const res = await getTopSach();
        if (res.success) {
          setTopSach(res.data);
        } else {
          console.error(res.message);
          setErrorMsg(res.message || 'Lỗi khi tải dữ liệu thống kê.');
        }
      } catch (error) {
        console.error('Error fetching top books:', error);
        setErrorMsg('Lỗi kết nối tới máy chủ khi tải thống kê.');
      } finally {
        setLoading(false);
      }
    };
    fetchTopSach();
  }, []);

  return (
    <div className="container">
      <h2>📊 Dashboard Thống kê</h2>

      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu thống kê...</p>
        </div>
      ) : (
        <div className="dashboard-section">
          <h3>Top 5 Sách được mượn nhiều nhất</h3>
          {topSach.length === 0 ? (
            <p className="text-center">Không có dữ liệu thống kê sách mượn.</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Hạng</th>
                    <th>Tên sách</th>
                    <th>Tác giả</th>
                    <th>Thể loại</th>
                    <th>Tổng lượt mượn</th>
                  </tr>
                </thead>
                <tbody>
                  {topSach.map((sach, index) => (
                    <tr key={sach.ma_sach}>
                      <td><strong>{index + 1}</strong></td>
                      <td className="text-bold">{sach.ten_sach}</td>
                      <td>{sach.tac_gia}</td>
                      <td><span className="genre-pill">{sach.ten_the_loai}</span></td>
                      <td>{sach.tong_luong_muon} lần</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Có thể thêm các biểu đồ khác ở đây */}
    </div>
  );
};

export default Dashboard;
