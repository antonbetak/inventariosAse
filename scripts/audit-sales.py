"""Read-only sales audit. Writes commercial detail exclusively below private/.
Independent XML/formula evaluation, not the importer's cached-value arithmetic.
"""
import ast
import hashlib
import json
import re
import sys
import zipfile
from decimal import Decimal
from pathlib import Path
from xml.etree import ElementTree as ET

source = Path(sys.argv[1])
target = Path(sys.argv[2])
if 'private' not in target.resolve().parts:
    raise SystemExit('Audit output must remain in private/.')
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(source) as archive:
    strings = [''.join(c.itertext()) for c in ET.fromstring(archive.read('xl/sharedStrings.xml')).findall('m:si', ns)]
    cells = {}
    for c in ET.fromstring(archive.read('xl/worksheets/sheet3.xml')).findall('.//m:c', ns):
        value, formula = c.find('m:v', ns), c.find('m:f', ns)
        if value is not None:
            cells[c.get('r')] = {'value': strings[int(value.text)] if c.get('t') == 's' else value.text, 'formula': formula.text if formula is not None else None}

def arithmetic(node):
    if isinstance(node, ast.Expression): return arithmetic(node.body)
    if isinstance(node, ast.Constant): return Decimal(str(node.value))
    if isinstance(node, ast.BinOp):
        a, b = arithmetic(node.left), arithmetic(node.right)
        if isinstance(node.op, ast.Add): return a+b
        if isinstance(node.op, ast.Mult): return a*b
        if isinstance(node.op, ast.Sub): return a-b
        if isinstance(node.op, ast.Div): return a/b
    raise ValueError('Unsupported source formula')

def evaluate(address, stack=()):
    if address in stack: raise ValueError('Circular source formula')
    cell = cells[address]
    formula = cell['formula']
    if formula is None: return Decimal(cell['value'])
    def expand(match):
        col, first, last = match.group(1), int(match.group(2)), int(match.group(3))
        return '+'.join(f'{col}{r}' for r in range(first, last+1))
    formula = re.sub(r'([A-Z]+)(\d+):\1(\d+)', expand, formula)
    formula = formula.replace('SUM(', '(').replace(',', '+')
    formula = re.sub(r'\b[A-Z]+\d+\b', lambda m: str(evaluate(m.group(), stack+(address,))), formula)
    result = arithmetic(ast.parse(formula, mode='eval'))
    assert result == Decimal(cell['value']), f'Cached formula mismatch at {address}'
    return result

rows = []
for r in (8, 9, 10):
    prices = set()
    for month, qcol, vcol in zip(range(1, 7), ('B','D','F','H','J','L'), ('C','E','G','I','K','M')):
        units = evaluate(f'{qcol}{r}')
        revenue = evaluate(f'{vcol}{r}')
        price = revenue/units
        prices.add(price)
        rows.append({'producto': cells[f'A{r}']['value'], 'mes': month, 'unidades': str(units), 'precio': str(price), 'ingreso': str(revenue), 'celdas': [f'{qcol}{r}', f'{vcol}{r}'], 'formula': cells[f'{vcol}{r}']['formula']})
    assert len(prices) == 1, 'Prices vary within semester; reconciliation required'
for col in ('C','E','G','I','K','M'):
    assert evaluate(f'{col}12') == sum(evaluate(f'{col}{r}') for r in (8,9,10))
assert evaluate('N12') == sum(Decimal(row['ingreso']) for row in rows)
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps({'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'hoja':'Hoja3', 'periodo':'enero-junio 2026', 'rows': rows, 'total': str(evaluate('N12'))}, ensure_ascii=False, indent=2))
print('PASS: 18 product-month rows, 6 monthly subtotals and semester total independently reconciled; private detail saved.')
