
const webpush = require('web-push');
const fs = require('fs');
const keys = webpush.generateVAPIDKeys();
fs.writeFileSync('vapid.json', JSON.stringify(keys, null, 2));
console.log('Keys saved to vapid.json');
