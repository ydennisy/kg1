import 'dotenv/config';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import figlet from 'figlet';
import { Command } from 'commander';
import { add } from './add';
import { search } from './search';
import { chat } from './chat';

const log = console.log;

log(figlet.textSync('KG1'));

const program = new Command();

program.description('A CLI app for interacting with the KG1 backend.');

program.command('add [raw]').action(async (raw) => {
  if (raw) {
    await add(raw);
  } else {
    const tmpFile = path.join(os.tmpdir(), 'tmp.md');
    fs.writeFileSync(tmpFile, '');

    const ed = /^win/.test(process.platform) ? 'notepad' : 'vim';
    const ps = spawn(ed, [tmpFile], { stdio: 'inherit' });

    ps.on('exit', async (code, _) => {
      if (code === 0) {
        const raw = fs.readFileSync(tmpFile, 'utf-8');
        if (raw) {
          await add(raw);
        }
        fs.unlinkSync(tmpFile);
      }
    });
  }
});

program.command('search <query>').action(async (query) => await search(query));

program.command('chat <query>').action(async (query) => await chat(query));

program.parse(process.argv);
