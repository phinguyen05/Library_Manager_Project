const mysql = require("mysql2/promise");

// Cấu hình kết nối MySQL pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "library_db",
  charset: "utf8mb4", // Thêm dòng này để thiết lập charset
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Đặt tên charset cho mỗi kết nối mới
pool.on("connection", (connection) => {
  connection.query("SET NAMES \'utf8mb4\'");
});

module.exports = pool;
