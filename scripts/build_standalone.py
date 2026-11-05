"""Regenerate demo.html from the English template and English lesson JSON.

No external Python packages or network access are needed.
"""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
template = (root / 'scripts/standalone_template.html').read_text(encoding='utf-8')
cards = json.loads((root / 'src/data/englishCards.json').read_text(encoding='utf-8'))
initial = [
    'living-bali', 'first-meeting', 'down-for-that', 'agree-error',
    'looking-forward', 'cafe-story', 'lived-thailand', 'about-to-call',
    'as-soon-as', 'no-worries',
]
assert cards, 'The lesson deck must not be empty.'
assert len({c['id'] for c in cards}) == len(cards), 'Card IDs must be unique.'
assert template.count('__DECK_JSON__') == 1
assert all(any(c['id'] == id for c in cards) for id in initial)
data = json.dumps({'cards': cards, 'initial': initial}, ensure_ascii=False, separators=(',', ':'))
# Prevent accidental closing of a <script> tag if a future card includes HTML-like text.
data = data.replace('</script', '<\\/script')
output = template.replace('__DECK_JSON__', data)
(root / 'demo.html').write_text(output, encoding='utf-8')
print(f'Updated demo.html with the {len(cards)} English cards.')
