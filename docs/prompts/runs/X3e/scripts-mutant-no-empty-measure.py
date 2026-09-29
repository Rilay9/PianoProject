OLD = r"""${measures.map((measure) => `<measure${measure.attributes}>${measure.parts.get(key) ?? ''}</measure>`).join('')}"""
NEW = r"""${measures.filter((measure) => measure.parts.has(key)).map((measure) => `<measure${measure.attributes}>${measure.parts.get(key) ?? ''}</measure>`).join('')}"""
