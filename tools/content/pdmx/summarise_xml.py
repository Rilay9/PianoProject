import xml.etree.ElementTree as ET
STEP_DUR = {"whole": "w", "half": "h", "quarter": "q", "eighth": "8", "16th": "16", "32nd": "32", "64th": "64", "breve": "br"}


def summarise(xml_bytes, meta):
    root = ET.fromstring(xml_bytes)
    for el in root.iter():
        if isinstance(el.tag, str) and "}" in el.tag:
            el.tag = el.tag.split("}", 1)[1]
    lines = [f"CID {meta['cid']}", f"title: {meta['title']} | song_name: {meta['song_name']}",
             f"composer: {meta['composer_name']} | artist: {meta['artist_name']}",
             f"csv: tracks={meta['track_programs']} bars={meta['bars']} license={meta['license']}"]
    names = {sp.get("id"): (sp.findtext("part-name") or "").strip() for sp in root.iter("score-part")}
    for p in root.findall("part"):
        pid = p.get("id")
        measures = p.findall("measure")
        lines.append(f"\n=== part {pid} '{names.get(pid, '')}' measures={len(measures)} ===")
        divisions = 1
        for m in measures:
            head = []
            for a in m.findall("attributes"):
                if a.findtext("divisions"):
                    divisions = int(float(a.findtext("divisions")))
                if a.findtext("staves"):
                    head.append(f"staves={a.findtext('staves')}")
                for k in a.findall("key"):
                    head.append(f"key fifths={k.findtext('fifths')} {k.findtext('mode') or ''}".strip())
                for t in a.findall("time"):
                    head.append(f"time {t.findtext('beats')}/{t.findtext('beat-type')}")
                for cl in a.findall("clef"):
                    head.append(f"clef{cl.get('number') or ''}={cl.findtext('sign')}{cl.findtext('line') or ''}")
            for d in m.findall("direction"):
                for w in d.iter("words"):
                    if (w.text or "").strip():
                        head.append(f'"{w.text.strip()}"')
                snd = d.find("sound")
                if snd is not None and snd.get("tempo"):
                    head.append(f"tempo={snd.get('tempo')}")
                for dyn in d.iter("dynamics"):
                    head.append("dyn=" + "".join(ch.tag for ch in dyn))
            for b in m.findall("barline"):
                rep = b.find("repeat")
                end = b.find("ending")
                if rep is not None:
                    head.append(f"repeat-{rep.get('direction')}")
                if end is not None:
                    head.append(f"ending{end.get('number')}-{end.get('type')}")
            # events by staff/voice
            streams = {}
            for n in m.findall("note"):
                if n.find("grace") is not None:
                    tok_grace = True
                else:
                    tok_grace = False
                staff = n.findtext("staff") or "1"
                voice = n.findtext("voice") or "1"
                if n.find("rest") is not None:
                    tok = "r"
                else:
                    pt = n.find("pitch")
                    if pt is None:
                        tok = "x"
                    else:
                        alt = pt.findtext("alter")
                        acc = {"1": "#", "-1": "b", "2": "##", "-2": "bb"}.get((alt or "").split(".")[0], "")
                        tok = f"{pt.findtext('step')}{acc}{pt.findtext('octave')}"
                typ = STEP_DUR.get(n.findtext("type") or "", "")
                if not typ:
                    dur = n.findtext("duration")
                    typ = f"d{int(dur)/divisions:g}" if dur else "?"
                typ += "." * len(n.findall("dot"))
                tm = n.find("time-modification")
                if tm is not None:
                    typ += f"({tm.findtext('actual-notes')}:{tm.findtext('normal-notes')})"
                tok += ":" + typ
                if n.find("tie[@type='start']") is not None:
                    tok += "~"
                arts = [a.tag for a in n.iter() if a.tag in ("staccato", "accent", "strong-accent", "tenuto", "fermata")]
                if arts:
                    tok += "[" + ",".join(arts) + "]"
                if tok_grace:
                    tok = "g" + tok
                lst = streams.setdefault((staff, voice), [])
                if n.find("chord") is not None and lst:
                    lst[-1] += "+" + tok.split(":")[0]
                else:
                    lst.append(tok)
            num = m.get("number")
            body = " | ".join(f"s{s}v{v}: " + " ".join(toks) for (s, v), toks in sorted(streams.items()))
            lines.append(f"m{num}" + (f" [{'; '.join(head)}]" if head else "") + "  " + body)
    return "\n".join(lines)


