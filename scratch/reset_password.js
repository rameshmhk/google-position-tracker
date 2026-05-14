const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'local_db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const saltRounds = 10;
const plainPassword = 'admin123';

bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
    if (err) {
        console.error(err);
        return;
    }
    
    // Update test@test.com
    const user = db.users.find(u => u.email === 'test@test.com');
    if (user) {
        user.password = hash;
        user.isVerified = true;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        console.log('Password updated for test@test.com to: admin123');
    } else {
        console.log('User test@test.com not found');
    }
});
