const sqlite3 = require('sqlite3').default || require('sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, '..', 'dev.db');
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(AdClick)", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("AdClick Columns:");
    rows.forEach(row => console.log(`- ${row.name} (${row.type})`));
    
    db.all("PRAGMA table_info(SessionEvent)", (err, rows2) => {
        if (err) {
            console.log("SessionEvent table NOT FOUND");
        } else {
            console.log("\nSessionEvent Columns:");
            rows2.forEach(row => console.log(`- ${row.name} (${row.type})`));
        }
        db.close();
    });
});
