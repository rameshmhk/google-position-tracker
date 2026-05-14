const cleanWebsiteUrl = (url) => {
  if (!url) return '';
  return url
    .trim()
    .replace(/^https?:\/\//i, '') // Case-insensitive protocol removal
    .replace(/^www\./i, '')      // Case-insensitive www. removal
    .replace(/\/+$/, '');         // Remove trailing slashes
};

const testCases = [
  'https://rankinganywhere.com/',
  'http://www.rankinganywhere.com',
  'www.rankinganywhere.com/',
  'rankinganywhere.com.au',
  'https://www.google.co.uk/',
];

console.log('Testing cleanWebsiteUrl:');
testCases.forEach(tc => {
  console.log(`Original: "${tc}" -> Cleaned: "${cleanWebsiteUrl(tc)}"`);
});
