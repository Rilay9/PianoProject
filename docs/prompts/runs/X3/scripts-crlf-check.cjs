// Whether the two lessonClaimsAboutApp checks that fail here fail on line endings alone: each
// searches an untouched file for text joined by "\n", and this checkout writes "\r\n".
const fs = require('fs');
const path = require('path');
const app = path.resolve(__dirname, '..', '..', '..', '..', '..', 'app');
const score = fs.readFileSync(path.join(app, 'src/ui/screens/ScoreScreen.ts'), 'utf8');
const css = fs.readFileSync(path.join(app, 'src/style.css'), 'utf8');
console.log('ScoreScreen.ts, the LF form found:', score.includes("menuRow(\n    'Rhythm only'"), '| the CRLF form found:', score.includes("menuRow(\r\n    'Rhythm only'"));
console.log('style.css, the LF form found:', css.includes('.score-stage--blind {\n  visibility: hidden;\n}'), '| the CRLF form found:', css.includes('.score-stage--blind {\r\n  visibility: hidden;\r\n}'));
