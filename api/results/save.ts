// 검사 결과 저장 API (Vercel Serverless Function)
import type { VercelRequest, VercelResponse } from '@vercel/node';
// Supabase 사용 시
import { saveTestResult } from '../../lib/supabase';
// Vercel Postgres 사용 시 (주석 처리)
// import { saveTestResult } from '../../lib/db';

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
    const { code, result, deviceInfo } = req.body;

    if (!code || !result) {
      return res.status(400).json({
        error: 'Code and result are required'
      });
    }

    await saveTestResult(code, result, deviceInfo);

    return res.status(200).json({
      success: true,
      code,
      message: 'Result saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving result:', error);
    return res.status(500).json({
      error: error.message || 'Failed to save result'
    });
  }
}
