// sqlite3のDBを初期化

var sqlite3 = require('sqlite3');

module.exports.init = function (file) {
  return new sqlite3.Database(file);
};
