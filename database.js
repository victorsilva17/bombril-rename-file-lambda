require('dotenv').config()
const mysql = require('mysql');

const con = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.DB_USER,
  password: process.env.PASSWORD,
  database: process.env.DB_NAME
});

exports.connect = () => new Promise((resolve, reject) => {
  con.connect(function (err) {
    if (err) { reject(null), console.log(err) }
    else resolve(con)
  });
})

exports.select = (renamed, table, con) => new Promise((resolve, reject) => {
  try {
    con.query(`SELECT * FROM ${table} WHERE renamed='${renamed}'`, function (err, result) {
      if (err) throw reject(err);
      resolve(result)
    });
  } catch (err) {
    console.log('Erro Database', err)
    reject(err)
  }
})

exports.delete = (id, table, con) => new Promise((resolve, reject) => {
  try {
    con.query(`DELETE FROM ${table} WHERE id=${id}`, function (err, result) {
      if (err) throw reject(err);
      resolve(result)
    });
  } catch (err) {
    console.log('Erro Database', err)
    reject(err)
  }
})

exports.insert = (originalName, renamed, table, con) => new Promise((resolve, reject) => {
  try {
    con.query(`INSERT INTO ${table} (originalName, renamed) VALUES ('${originalName}', '${renamed}')`,
      function (err, result) {
        if (err) throw reject(err);
        resolve(result)
      });
  } catch (err) {
    console.log('Erro Database', err)
    reject(err)
  }
})

exports.update = (id, renamed, table, con) => new Promise((resolve, reject) => {
  try {
    con.query(`UPDATE ${table} SET renamed='${renamed}' WHERE id=${id}`,
      function (err, result) {
        if (err) throw reject(err);
        resolve(result)
      });
  } catch (err) {
    console.log('Database error:', err)
    reject(err)
  }
})

