import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync(new URL('../design/practice-tools.html',import.meta.url),'utf8');
writeFileSync(new URL('../js/practice-template.mjs',import.meta.url),'// Generated from design/practice-tools.html. Edit the design source.\nexport const PRACTICE_TEMPLATE = '+JSON.stringify(source)+';\n');
