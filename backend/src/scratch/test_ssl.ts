
import https from 'https';

const getSSLInfo = (domain) => {
  return new Promise((resolve) => {
    const options = {
      hostname: domain,
      port: 443,
      method: 'GET',
      rejectUnauthorized: false,
      timeout: 5000
    };

    console.log(`Checking SSL for ${domain}...`);
    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();
      console.log(`Success! Cert found: ${cert && Object.keys(cert).length > 0}`);
      resolve({ valid: cert && Object.keys(cert).length > 0 });
    });

    req.on('error', (err) => {
        console.log(`Error: ${err.message}`);
        resolve({ valid: false });
    });
    req.on('timeout', () => {
      console.log('Timeout!');
      req.destroy();
      resolve({ valid: false });
    });
    req.end();
  });
};

getSSLInfo('rankinganywhere.com');
