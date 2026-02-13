// MYiCap SSO 데이터 수신 API (Vercel Serverless Function)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const SSO_KEY = 'MJU_ineast';

function decrypt(encryptedBase64: string): string {
  // Prepare 16-byte key (pad with 0x00)
  const keyBuffer = Buffer.alloc(16, 0);
  const keyBytes = Buffer.from(SSO_KEY, 'utf-8');
  keyBytes.copy(keyBuffer, 0, 0, Math.min(keyBytes.length, 16));

  // IV is same as key
  const iv = keyBuffer;

  // Base64 decode → AES decrypt
  const encrypted = Buffer.from(encryptedBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-128-cbc', keyBuffer, iv);
  let decrypted = decipher.update(encrypted, undefined, 'utf-8');
  decrypted += decipher.final('utf-8');

  return decrypted;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse body - Vercel automatically handles both JSON and form-encoded
    const {
      membernum,
      membername,
      departcode,
      departname,
      majorcode,
      majorname
    } = req.body;

    // Validate required fields
    if (!membernum || !membername || !departcode || !departname) {
      console.error('Missing required SSO fields:', { membernum, membername, departcode, departname });
      return res.redirect(302, '/mju?error=missing_fields');
    }

    // Decrypt each field
    const decryptedData: Record<string, string> = {};

    try {
      decryptedData.membernum = decrypt(membernum);
      decryptedData.membername = decrypt(membername);
      decryptedData.departcode = decrypt(departcode);
      decryptedData.departname = decrypt(departname);

      // Optional fields
      if (majorcode) {
        decryptedData.majorcode = decrypt(majorcode);
      }
      if (majorname) {
        decryptedData.majorname = decrypt(majorname);
      }
    } catch (decryptError) {
      console.error('Decryption error:', decryptError);
      return res.redirect(302, '/mju?error=invalid_token');
    }

    // Build redirect URL with query params
    const params = new URLSearchParams({
      sso: '1',
      membernum: decryptedData.membernum,
      membername: decryptedData.membername,
      departcode: decryptedData.departcode,
      departname: decryptedData.departname,
    });

    if (decryptedData.majorcode) {
      params.append('majorcode', decryptedData.majorcode);
    }
    if (decryptedData.majorname) {
      params.append('majorname', decryptedData.majorname);
    }

    const redirectUrl = `/mju?${params.toString()}`;

    console.log('SSO login successful:', {
      membernum: decryptedData.membernum,
      membername: decryptedData.membername,
      departname: decryptedData.departname
    });

    return res.redirect(302, redirectUrl);
  } catch (error: any) {
    console.error('Error processing SSO data:', error);
    return res.redirect(302, '/mju?error=server_error');
  }
}
