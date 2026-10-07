OLD = r"""const masked = xml.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>/g, (hidden) => ' '.repeat(hidden.length));"""
NEW = r"""const masked = xml;"""
