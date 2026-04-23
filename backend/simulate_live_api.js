import fs from 'fs';
import path from 'path';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const DB_PATH = path.join(process.cwd(), 'local_db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

const testUser = db.users.find(u => u.name === "Test User");
const project = db.projects.find(p => p.name === "Adam Dental" && p.userId === testUser.id);

if (!project) {
  console.log("Project not found!");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-prod';
const token = jwt.sign({ id: testUser.id, email: testUser.email, name: testUser.name }, JWT_SECRET, { expiresIn: '7d' });

console.log(`Triggering LIVE SERVER API for Project: ${project.name} (${project.id})`);
console.log(`Simulating Dashboard Click... (POST /api/check-project/${project.id})`);

axios.post(`http://localhost:5000/api/check-project/${project.id}`, {}, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(res => {
  console.log("=== API SUCCESS ===");
  console.log(`Keywords checked: ${res.data.count}`);
  
  // Show new DB state
  const updatedDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const updatedKw = updatedDb.keywords.filter(k => k.projectId === project.id);
  console.log("\n=== REAL-TIME RANKINGS SAVED BY SERVER ===");
  updatedKw.forEach(k => {
     console.log(`✅ "${k.text}" (${k.location}) -> Organic #${k.organic}, Maps #${k.maps}`);
  });
}).catch(err => {
  console.error("ERROR:");
  console.error(err.response ? err.response.data : err.message);
});
