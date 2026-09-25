from pathlib import Path

base = Path(__file__).resolve().parent
files = [base / 'js' / 'admin-menu.js', base / 'js' / 'menu-dynamic.js']
text = ''.join(path.read_text(encoding='utf-8') for path in files)
print('OK' if 'No/Low Alcohol' in text else 'MISSING')
raise SystemExit(0 if 'No/Low Alcohol' in text else 1)
