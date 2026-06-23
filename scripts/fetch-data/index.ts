import { execSync } from 'child_process';
import path from 'path';

const run = (script: string) =>
  execSync(`npx tsx ${path.join(__dirname, script)}`, { stdio: 'inherit' });

run('fetch-ddragon.ts');
run('fetch-augments.ts');
run('fetch-arena.ts');
