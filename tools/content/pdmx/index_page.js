// The PDMX index page's behaviour. Embedded into index.html by index.py.
//
// Everything is client-side and synchronous over an array of arrays: 37,499
// rows filter in a few milliseconds, which is fast enough that there is no
// need for a worker, a virtual list or a framework. Only the *drawing* is
// capped — nobody reads past the first few hundred, and 37,499 table rows is a
// page that takes a second to scroll.

const DATA = JSON.parse(document.getElementById('data').textContent);
const F = Object.fromEntries(DATA.fields.map((name, i) => [name, i]));
const ROWS = DATA.rows;
const LIMIT = 400;

const picked = new Set();
let sortKey = F.rating;
let sortDown = true;

function fold(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Folded once, not once per keystroke: the search runs over every row on every
// input event, and normalising 37,499 strings each time is the difference
// between instant and sluggish.
const HAYSTACK = ROWS.map((r) => fold(`${r[F.title]} ${r[F.artist]} ${r[F.composer]}`));

function fillOptions(id, key) {
  const select = document.getElementById(id);
  const seen = [...new Set(ROWS.map((r) => r[key]))].filter(Boolean).sort();
  for (const value of seen) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
}
fillOptions('band', F.band);
fillOptions('bucket', F.bucket);

function matches() {
  const q = fold(document.getElementById('q').value.trim());
  const band = document.getElementById('band').value;
  const bucket = document.getElementById('bucket').value;
  const status = document.getElementById('status').value;
  const lo = parseFloat(document.getElementById('lo').value);
  const hi = parseFloat(document.getElementById('hi').value);
  const noLyrics = document.getElementById('nolyrics').checked;
  const rated = document.getElementById('rated').checked;

  const out = [];
  for (let i = 0; i < ROWS.length; i += 1) {
    const r = ROWS[i];
    if (q && !HAYSTACK[i].includes(q)) continue;
    if (band && r[F.band] !== band) continue;
    if (bucket && r[F.bucket] !== bucket) continue;
    if (status && r[F.status] !== status) continue;
    if (!Number.isNaN(lo) && r[F.level] < lo) continue;
    if (!Number.isNaN(hi) && r[F.level] > hi) continue;
    if (noLyrics && r[F.lyrics]) continue;
    // "Rated 4+" means four stars from at least five people: one enthusiastic
    // vote is not a rating, which is the same argument the selector's
    // Bayesian score makes.
    if (rated && !(r[F.rating] >= 4 && r[F.ratings] >= 5)) continue;
    out.push(r);
  }
  return out;
}

function cell(text, cls) {
  const td = document.createElement('td');
  if (cls) td.className = cls;
  td.textContent = text;
  return td;
}

function draw() {
  const found = matches();
  found.sort((a, b) => {
    const x = a[sortKey];
    const y = b[sortKey];
    const cmp = typeof x === 'string' ? x.localeCompare(y) : (x ?? 0) - (y ?? 0);
    return sortDown ? -cmp : cmp;
  });

  const body = document.getElementById('rows');
  body.replaceChildren();
  for (const r of found.slice(0, LIMIT)) {
    const tr = document.createElement('tr');

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = picked.has(r[F.cid]);
    box.addEventListener('change', () => {
      if (box.checked) picked.add(r[F.cid]);
      else picked.delete(r[F.cid]);
      document.getElementById('picked').textContent = `${picked.size} picked`;
    });
    const first = document.createElement('td');
    first.appendChild(box);
    tr.appendChild(first);

    const title = document.createElement('td');
    title.textContent = r[F.title] || r[F.cid];
    if (r[F.want]) title.appendChild(tag('wanted'));
    if (r[F.verifies]) title.appendChild(tag('Part F'));
    if (r[F.lyrics]) title.appendChild(tag('lyrics'));
    // The CSV mangled this one on the way in and the damage is lossy. The
    // MuseScore link is the only place the real title still exists.
    if (r[F.garbled]) title.appendChild(tag('title garbled'));
    tr.appendChild(title);

    const who = document.createElement('td');
    who.textContent = `${r[F.composer] || r[F.artist] || '—'} `;
    who.appendChild(tag(r[F.status], r[F.status]));
    tr.appendChild(who);

    tr.appendChild(cell(r[F.bucket]));
    tr.appendChild(cell(r[F.level].toFixed(1), 'num'));
    tr.appendChild(cell(String(r[F.bars]), 'num'));
    tr.appendChild(cell(r[F.ratings] ? `${r[F.rating].toFixed(1)} ×${r[F.ratings]}` : '—', 'num'));
    tr.appendChild(cell(r[F.views].toLocaleString(), 'num'));

    const link = document.createElement('td');
    if (r[F.museScore]) {
      const a = document.createElement('a');
      a.href = `https://musescore.com/score/${r[F.museScore]}`;
      a.textContent = 'MuseScore';
      a.target = '_blank';
      a.rel = 'noreferrer';
      link.appendChild(a);
    }
    tr.appendChild(link);
    body.appendChild(tr);
  }

  document.getElementById('count').textContent =
    found.length > LIMIT
      ? `${found.length.toLocaleString()} matched — showing the first ${LIMIT}`
      : `${found.length.toLocaleString()} matched`;
}

function tag(text, cls) {
  const span = document.createElement('span');
  span.className = `tag ${cls ?? ''}`.trim();
  span.textContent = text;
  return span;
}

for (const id of ['q', 'band', 'bucket', 'status', 'lo', 'hi', 'nolyrics', 'rated']) {
  document.getElementById(id).addEventListener('input', draw);
}

for (const th of document.querySelectorAll('th[data-k]')) {
  th.addEventListener('click', () => {
    const key = Number(th.dataset.k);
    sortDown = key === sortKey ? !sortDown : true;
    sortKey = key;
    draw();
  });
}

// The picked list is what feeds the rest of the pipeline:
//   py -3.11 tools\content\pdmx\extract.py --cid <paste>
document.getElementById('copy').addEventListener('click', async () => {
  const text = [...picked].join(' ');
  try {
    await navigator.clipboard.writeText(text);
    document.getElementById('picked').textContent = `${picked.size} copied`;
  } catch {
    // A file:// page often has no clipboard permission. Showing the text is
    // not a fallback anyone loves, but it is better than a button that does
    // nothing and says nothing.
    window.prompt('Copy these CIDs:', text);
  }
});

draw();
