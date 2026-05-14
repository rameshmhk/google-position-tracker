const bcrypt = require('./backend/node_modules/bcrypt');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'local_db.json');
let db = { users: [] };

if (fs.existsSync(dbPath)) {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

const saltRounds = 10;
const plainPassword = 'admin123';
const email = 'admin@local.com';

bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
    if (err) {
        console.error(err);
        return;
    }
    
    // Remove if exists
    db.users = db.users.filter(u => u.email !== email);
    
    db.users.push({
        id: Date.now().toString(),
        name: 'Local Admin',
        email: email,
        password: hash,
        isVerified: true,
        createdAt: new Date().toISOString()
    });
    
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log('Local Admin created!');
    console.log('Email: ' + email);
    console.log('Password: ' + plainPassword);
});
