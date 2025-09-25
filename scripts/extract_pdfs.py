import sys, os
from pathlib import Path
from PyPDF2 import PdfReader
from pdfminer.high_level import extract_text

root = Path('Item AND effect and Battle logic info')
outputs = []
for pdf in root.glob('*.pdf'):
    out_txt = pdf.with_suffix('.extracted.txt')
    text = ''
    # Try PyPDF2 first
    try:
        reader = PdfReader(str(pdf))
        text = '\n'.join(page.extract_text() or '' for page in reader.pages)
    except Exception as e:
        text = ''
    # Fallback to pdfminer if empty or too short
    if not text or len(text.strip()) < 50:
        try:
            text = extract_text(str(pdf))
        except Exception:
            pass
    if not text:
        text = '[Could not extract text]'
    out_txt.write_text(text, encoding='utf-8')
    outputs.append((pdf.name, out_txt.name, len(text)))
print('EXTRACTED:')
for name, out, l in outputs:
    print(f' - {name} -> {out} ({l} chars)')
