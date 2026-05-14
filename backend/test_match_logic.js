
const cleanTarget = (url) => {
  try {
    return url.toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '') 
      .split('/')[0]
      .split('?')[0]
      .trim();
  } catch {
    return (url || '').toLowerCase().trim();
  }
};

const testTarget = "abbagroup.com.au";
const googleLink = "https://www.abbagroup.com.au/business-for-sale/listing/business-brokers-australia/";

const cleaned = cleanTarget(testTarget);
console.log(`Target: ${testTarget} -> Cleaned: ${cleaned}`);
console.log(`Link: ${googleLink}`);
console.log(`Match Result: ${googleLink.toLowerCase().includes(cleaned)}`);

if (googleLink.toLowerCase().includes(cleaned)) {
  console.log("✅ MATCH SUCCESSFUL!");
} else {
  console.log("❌ MATCH FAILED!");
}
