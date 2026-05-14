const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'dev.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run('DELETE FROM AdClick WHERE id LIKE "seed-%"', function(err) {
        if (err) {
            console.error('Error deleting seed data:', err.message);
        } else {
            console.log(`Successfully deleted ${this.changes} seed records.`);
        }
    });

    db.run('DELETE FROM SessionEvent WHERE clickId LIKE "seed-%"', function(err) {
        if (err) {
            console.error('Error deleting seed events:', err.message);
        } else {
            console.log(`Successfully deleted ${this.changes} seed event records.`);
        }
    });
});

db.close();
