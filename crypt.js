import crypto from 'crypto';

const generated_key = crypto.randomBytes(32).toString('base64');
const generated_iv = crypto.randomBytes(16).toString('base64');

console.log('key', generated_key);
console.log('iv', generated_iv);

const key = Buffer.from(
  'x9DUVaHJIKKviEwMueyHaEcTJ8t/rP0pnDzWiMZwoik=',
  'base64',
);
const iv = Buffer.from('pI2ZMmUgMESbFRSmr/U79A==', 'base64');

function encryptWpId(wpId) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(wpId, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function decryptWpId(encryptedWpId) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedWpId, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Пример использования
const wpId = '123214123';
const encrypted = encryptWpId(wpId);
const decrypted = decryptWpId(encrypted);

console.log('Encrypted:', encrypted);
console.log('Decrypted:', decrypted);
