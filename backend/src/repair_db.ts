import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'local_db.json');

if (fs.existsSync(DB_FILE)) {
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  let changed = false;

  console.log(`[Repair] Scanning ${db.projects.length} projects and ${db.keywords.length} keywords...`);

  db.projects.forEach((p: any) => {
    if (!p.status) { p.status = 'active'; changed = true; }
    if (!p.schedule) { p.schedule = 'instant'; changed = true; }
    if (p.lastCheck === undefined) { p.lastCheck = 0; changed = true; }
    if (!p.targetRegion) { p.targetRegion = 'au'; changed = true; }
    if (!p.businessName) { p.businessName = p.name || p.url.split('.')[0]; changed = true; }
  });

  db.keywords.forEach((k: any) => {
    if (!k.status) { k.status = 'active'; changed = true; }
    // Forced extraction
    const text = k.text.toLowerCase();
    if (!k.location || k.location === '') {
      if (text.includes('sydney')) { k.location = 'Sydney'; changed = true; }
      else if (text.includes('melbourne')) { k.location = 'Melbourne'; changed = true; }
      else if (text.includes('canberra')) { k.location = 'Canberra'; changed = true; }
      else if (text.includes('wollongong')) { k.location = 'Wollongong'; changed = true; }
      else if (text.includes('newcastle')) { k.location = 'Newcastle'; changed = true; }
      else if (text.includes('australia')) { k.location = 'Australia'; changed = true; }
    }
  });

  if (changed) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    console.log('✅ Database repaired successfully with City Extraction!');
  } else {
    console.log('ℹ️ No repair needed (all fields already present).');
  }
} else {
  console.log('❌ local_db.json not found.');
}
