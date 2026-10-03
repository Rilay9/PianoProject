"""X1: the session token as a route parameter on the Score and drill routes (`?session=`).

Spliced as text; the edit checks its own marker so a rerun changes nothing.
"""
import pathlib

path = pathlib.Path('app/src/router.ts')
text = path.read_text(encoding='utf-8')
MARK = "X1: the activity instance of today"


def once(old: str, new: str) -> None:
    global text
    if text.count(old) != 1:
        raise SystemExit(f'expected one occurrence of: {old[:80]!r}, found {text.count(old)}')
    text = text.replace(old, new)


if MARK in text:
    print('router.ts: already spliced')
    raise SystemExit(0)

once(
    "const OFFER_TOKEN_PATTERN = /^[0-9a-z]{6,32}$/;\n",
    "const OFFER_TOKEN_PATTERN = /^[0-9a-z]{6,32}$/;\n\n"
    "/** A session activity's token (X1, `ui/sessionRunner.newActivityToken`): the offer token's form. */\n"
    "const SESSION_TOKEN_PATTERN = OFFER_TOKEN_PATTERN;\n",
)
once(
    "  /** Free play (`04` §2b), addressed as `#/play`. */\n  play?: boolean;\n}\n",
    "  /** Free play (`04` §2b), addressed as `#/play`. */\n  play?: boolean;\n"
    "  /**\n"
    "   * `#/score/<id>?session=<token>`, `#/drill/<id>?session=<token>` — " + MARK + "'s session this\n"
    "   * screen runs (`data/sessionRun.ts`): the screen reports its lifecycle to the runner under this token, and\n"
    "   * its closing action becomes the transition to the next activity. In the hash so a reload, a back gesture\n"
    "   * or a closed app reopens the same activity; a malformed token is dropped and the screen is an ordinary\n"
    "   * one. The runner refuses every write whose token is not the current activity's.\n"
    "   */\n"
    "  session?: string;\n}\n",
)
once(
    "  if (query) {\n    const value = new URLSearchParams(query).get('for');\n",
    "  // The session activity's token (X1): the offer token's form, or nothing.\n"
    "  const wantedSession = params?.get('session');\n"
    "  const session = wantedSession !== null && wantedSession !== undefined && SESSION_TOKEN_PATTERN.test(wantedSession) ? wantedSession : undefined;\n"
    "  if (query) {\n    const value = new URLSearchParams(query).get('for');\n",
)
once(
    "      ...(scoreIntent === undefined ? {} : { scoreIntent }),\n      ...(seed === undefined ? {} : { seed }),\n    };\n  }\n",
    "      ...(scoreIntent === undefined ? {} : { scoreIntent }),\n      ...(seed === undefined ? {} : { seed }),\n      ...(session === undefined ? {} : { session }),\n    };\n  }\n",
)
once(
    "    return { tab: DEFAULT_TAB, drill: id, ...(scoreRung === undefined ? {} : { drillRung: scoreRung }) };\n",
    "    return { tab: DEFAULT_TAB, drill: id, ...(scoreRung === undefined ? {} : { drillRung: scoreRung }), ...(session === undefined ? {} : { session }) };\n",
)
once(
    "      ...(route.seed === undefined ? [] : [`seed=${String(route.seed >>> 0)}`]),\n    ];\n",
    "      ...(route.seed === undefined ? [] : [`seed=${String(route.seed >>> 0)}`]),\n      ...(route.session === undefined ? [] : [`session=${route.session}`]),\n    ];\n",
)
once(
    "    const base = `#/drill/${encodeURIComponent(route.drill)}`;\n    return route.drillRung === undefined ? base : `${base}?rung=${encodeURIComponent(route.drillRung)}`;\n",
    "    const base = `#/drill/${encodeURIComponent(route.drill)}`;\n"
    "    const drillFlags = [\n"
    "      ...(route.drillRung === undefined ? [] : [`rung=${encodeURIComponent(route.drillRung)}`]),\n"
    "      ...(route.session === undefined ? [] : [`session=${route.session}`]),\n"
    "    ];\n"
    "    return drillFlags.length > 0 ? `${base}?${drillFlags.join('&')}` : base;\n",
)
once(
    "      /** Opened from Today's transfer offer for this skill (D4), naming that offer's instance (D4a). */\n      intent?: { intent: 'transfer'; skill: string; offer?: string };\n    } = {},\n",
    "      /** Opened from Today's transfer offer for this skill (D4), naming that offer's instance (D4a). */\n      intent?: { intent: 'transfer'; skill: string; offer?: string };\n"
    "      /** The session activity this run is (X1): its token. */\n      session?: string;\n    } = {},\n",
)
once(
    "      ...(options.seed === undefined ? {} : { seed: options.seed }),\n    };\n    this.win.location.hash = routeToHash(route);\n",
    "      ...(options.seed === undefined ? {} : { seed: options.seed }),\n      ...(options.session === undefined ? {} : { session: options.session }),\n    };\n    this.win.location.hash = routeToHash(route);\n",
)
once(
    "  navigateDrill(itemId: string, options: { rung?: string } = {}): void {\n    const route: Route = {\n      tab: this.current.tab,\n      drill: itemId,\n      ...(options.rung === undefined ? {} : { drillRung: options.rung }),\n    };\n",
    "  navigateDrill(itemId: string, options: { rung?: string; session?: string } = {}): void {\n    const route: Route = {\n      tab: this.current.tab,\n      drill: itemId,\n      ...(options.rung === undefined ? {} : { drillRung: options.rung }),\n      ...(options.session === undefined ? {} : { session: options.session }),\n    };\n",
)
once(
    "      // The rung that judges the drill is part of which run it is (C5).\n      route.drillRung === this.current.drillRung\n    ) {\n",
    "      // The rung that judges the drill is part of which run it is (C5).\n      route.drillRung === this.current.drillRung &&\n"
    "      // The session activity a run is, for the same reason (X1).\n      route.session === this.current.session\n    ) {\n",
)
path.write_text(text, encoding='utf-8', newline='\r\n')
print('router.ts: session token spliced')
