"""Validate the personal English lesson deck and embedded standalone copy."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
cards = json.loads((root / 'src/data/englishCards.json').read_text(encoding='utf-8'))
demo = (root / 'demo.html').read_text(encoding='utf-8')
match = re.search(r'<script id="deck-data" type="application/json">(.*?)</script>', demo, re.S)
assert match, 'The standalone deck was not embedded.'
embedded = json.loads(match.group(1))
assert cards == embedded['cards'], 'Standalone and React deck do not match.'
assert cards, 'The lesson deck must not be empty.'
assert len({c['id'] for c in cards}) == len(cards), 'Card IDs must be unique.'
assert set(embedded['initial']).issubset({c['id'] for c in cards})

VALID_KINDS = {'translate','quiz','gap','error','idiom','story','contrast','listen'}
for card in cards:
    assert card['kind'] in VALID_KINDS, card['id']
    assert card['question'].strip() and card['explanation'].strip(), card['id']
    if 'options' in card:
        assert len(card['options']) == 3 and len(set(card['options'])) == 3, card['id']
        assert 0 <= card['correctIndex'] <= 2, card['id']
    else:
        assert card['answer'].strip(), card['id']
    for field in ('question','answer','explanation','detail','context','character','topic','lesson'):
        value = card.get(field,'')
        assert not re.search(r'\b(?:depuis|pourquoi|comment|aujourd.hui|demain|hier|réponse|exercice|préposition|choisis|traduction|vous|nous)\b',value,re.I), (card['id'],field,value)

assert '<html lang="en">' in demo
assert 'class="lesson-pill"' not in demo
assert 'class="sup-label"' not in demo
print(f'PASS: {len(cards)} English cards, synced standalone demo, minimal card headers.')
