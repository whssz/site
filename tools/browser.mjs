import {brotliDecompressSync} from 'node:zlib';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {tmpdir} from 'node:os';
export async function browserOptions(){
 if(process.env.CHROMIUM_PATH)return {executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']};
 if(process.platform!=='linux'||process.arch!=='x64')return {args:['--disable-dev-shm-usage']};
 const bundle=(await import('@sparticuz/chromium')).default;
 const libDir=join(tmpdir(),'la-pizzaria-chromium-libs');
 if(!existsSync(join(libDir,'lib/libnss3.so'))){
   const require=createRequire(import.meta.url);const bin=join(dirname(require.resolve('@sparticuz/chromium')),'../bin/al2023.tar.br');mkdirSync(libDir,{recursive:true});execFileSync('tar',['-xf','-','-C',libDir],{input:brotliDecompressSync(readFileSync(bin))});
 }
 return {executablePath:await bundle.executablePath(),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],env:{...process.env,LD_LIBRARY_PATH:join(libDir,'lib')+':'+(process.env.LD_LIBRARY_PATH||'')}};
}
