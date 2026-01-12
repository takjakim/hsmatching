// 검사 결과 코드 목록 조회 API (Vercel Serverless Function)
import type { VercelRequest, VercelResponse } from '@vercel/node';
// Supabase 사용 시
import { getResultCodeList } from '../../lib/supabase';
// Vercel Postgres 사용 시 (주석 처리)
// import { getResultCodeList } from '../../lib/db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = parseInt((req.query.limit as string) || '100');

    const codes = await getResultCodeList(limit);

    return res.status(200).json({
      success: true,
      data: codes
    });
  } catch (error: any) {
    console.error('Error getting code list:', error);
    return res.status(500).json({
      error: error.message || 'Failed to get code list'
    });
  }
}
