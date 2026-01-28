// 파일럿 설문 결과 저장 API (Vercel Serverless Function)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { savePilotResult } from '../../lib/supabase';

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
    const {
      code,
      rawAnswers,
      email,
      valueScores,
      careerDecision,
      selfEfficacy,
      preferences,
      deviceInfo
    } = req.body;

    if (!code || !rawAnswers) {
      return res.status(400).json({
        error: 'Code and rawAnswers are required'
      });
    }

    await savePilotResult(code, rawAnswers, {
      email,
      valueScores,
      careerDecision,
      selfEfficacy,
      preferences,
      deviceInfo
    });

    return res.status(200).json({
      success: true,
      code,
      message: 'Pilot result saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving pilot result:', error);
    return res.status(500).json({
      error: error.message || 'Failed to save pilot result'
    });
  }
}
