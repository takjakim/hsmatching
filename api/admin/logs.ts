// 관리자 로그 조회 API (Vercel Serverless Function)
import type { VercelRequest, VercelResponse } from '@vercel/node';
// Supabase 사용 시
import { getAllTestResults } from '../../lib/supabase';
// Vercel Postgres 사용 시 (주석 처리)
// import { getAllTestResults } from '../../lib/db';

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

  // TODO: 관리자 인증 추가
  // const isAdmin = await checkAdminAuth(req);
  // if (!isAdmin) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  try {
    const limit = parseInt((req.query.limit as string) || '1000');

    const results = await getAllTestResults(limit);

    return res.status(200).json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error: any) {
    console.error('Error getting admin logs:', error);
    return res.status(500).json({
      error: error.message || 'Failed to get logs'
    });
  }
}
