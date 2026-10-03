// The one layout mutant (M23): Today's row reason is made too big to fit beside the controls and let overflow.
// `node css-mutant.cjs apply` backs up and appends the rule; `node css-mutant.cjs restore` puts the file back and
// checks it by checksum.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const css = path.resolve(__dirname, '../../app/src/style.css');
const backup = path.resolve(__dirname, 'style.css.bak');
const md5 = (file) => crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
const RULE = '\n/* M23 (mutant) */\n#today-card .list-row.today-row .list-row__sub.today-row__reason { white-space: nowrap; overflow: visible; font-size: 1.6rem; }\n';

if (process.argv[2] === 'apply') {
  fs.copyFileSync(css, backup);
  fs.appendFileSync(css, RULE);
  console.log('applied; original md5', md5(backup));
} else if (process.argv[2] === 'restore') {
  const before = md5(backup);
  fs.copyFileSync(backup, css);
  console.log(md5(css) === before ? 'restored: identical by checksum' : 'RESTORE DIFFERS');
}
