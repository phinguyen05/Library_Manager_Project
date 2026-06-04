const BASE = 'http://localhost:3000/api'

export const getSach = () => fetch(BASE + '/sach').then(r => r.json())
export const getSinhVien = () => fetch(BASE + '/sinhvien').then(r => r.json())
export const getPhieuMuon = () => fetch(BASE + '/phieu-muon').then(r => r.json())
export const getTopSach = () => fetch(BASE + '/thongke/top-sach').then(r => r.json())

export const taoPhieuMuon = (body) => fetch(BASE + '/phieu-muon', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
}).then(r => r.json())

export const traSach = (id) => fetch(BASE + '/phieu-muon/' + id + '/tra', {
  method: 'PUT'
}).then(r => r.json())

export const themSach = (body) => fetch(BASE + '/sach', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
}).then(r => r.json())
