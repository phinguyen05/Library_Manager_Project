import React, { useState } from 'react';
import DanhSachSach from './components/DanhSachSach';
import TaoPhieuMuon from './components/TaoPhieuMuon';
import LichSuMuonTra from './components/LichSuMuonTra';
import Dashboard from './components/Dashboard';

const App = () => {
  const [activeTab, setActiveTab] = useState('danhSachSach');

  const renderContent = () => {
    switch (activeTab) {
      case 'danhSachSach':
        return <DanhSachSach />;
      case 'taoPhieuMuon':
        return <TaoPhieuMuon />;
      case 'lichSuMuonTra':
        return <LichSuMuonTra />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return <DanhSachSach />;
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>HỆ THỐNG QUẢN LÝ THƯ VIỆN TRƯỜNG HỌC</h1>
        <nav className="navbar">
          <button 
            className={`nav-item ${activeTab === 'danhSachSach' ? 'active' : ''}`}
            onClick={() => setActiveTab('danhSachSach')}
          >
            📚 Danh sách sách
          </button>
          <button 
            className={`nav-item ${activeTab === 'taoPhieuMuon' ? 'active' : ''}`}
            onClick={() => setActiveTab('taoPhieuMuon')}
          >
            ➕ Tạo phiếu mượn
          </button>
          <button 
            className={`nav-item ${activeTab === 'lichSuMuonTra' ? 'active' : ''}`}
            onClick={() => setActiveTab('lichSuMuonTra')}
          >
            📋 Lịch sử mượn trả
          </button>
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
        </nav>
      </header>
      <main className="app-main">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
