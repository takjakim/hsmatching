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
  // student_grades 테이블 확인
  const { data: grades, error: gradesError } = await supabase
    .from('student_grades')
    .select('*')
    .limit(5);

  console.log('=== student_grades 테이블 ===');
  if (gradesError) {
    console.log('Error:', gradesError.message);
  } else {
    console.log(`${grades?.length || 0}개 레코드`);
    if (grades && grades.length > 0) {
      console.log('샘플:', grades[0]);
    }
  }

  // students 테이블 확인
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('student_id, name, department')
    .limit(5);

  console.log('\n=== students 테이블 ===');
  if (studentsError) {
    console.log('Error:', studentsError.message);
  } else {
    console.log(`${students?.length || 0}개 레코드`);
    students?.forEach(s => console.log(`- ${s.student_id}: ${s.name} (${s.department})`));
  }
}

main();
