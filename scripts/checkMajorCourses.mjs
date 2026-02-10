import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env');
  const envContent = readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      if ((value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1);
      }
      env[key.trim()] = value;
    }
  });
  return env;
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase
    .from('major_courses')
    .select('college, department, major, course_name')
    .limit(1000);

  if (error) {
    console.error('Error:', error);
    return;
  }

  // 유니크한 조합 추출
  const unique = new Map();
  data?.forEach(row => {
    const key = `${row.department}|${row.major || ''}`;
    if (!unique.has(key)) {
      unique.set(key, {
        college: row.college,
        department: row.department,
        major: row.major,
        count: 0
      });
    }
    unique.get(key).count++;
  });

  console.log('=== major_courses 테이블의 학과/전공 목록 ===\n');
  Array.from(unique.values())
    .sort((a, b) => a.college.localeCompare(b.college))
    .forEach(item => {
      console.log(`${item.college} > ${item.department} > ${item.major || '(없음)'} [${item.count}개 교과목]`);
    });
  console.log(`\n총 ${unique.size}개 학과/전공, ${data.length}개 교과목`);
}

main();
