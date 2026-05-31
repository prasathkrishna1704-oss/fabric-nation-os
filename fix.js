const Database = require('better-sqlite3');
const db = new Database('./dev.db');
try {
  db.exec('ALTER TABLE products ADD COLUMN fabric_type TEXT;');
} catch (e) { console.log(e.message) }
try {
  db.exec('ALTER TABLE products ADD COLUMN color TEXT;');
} catch (e) { console.log(e.message) }
try {
  db.exec('ALTER TABLE products ADD COLUMN gsm TEXT;');
} catch (e) { console.log(e.message) }
console.log('Columns added successfully');
