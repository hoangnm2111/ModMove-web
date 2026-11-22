# -*- coding: utf-8 -*-
"""Rebuild Section III (modules 1-5) of Report-3 with the redesigned UI frames.
Keeps the title block, Heading 1 and sections 6-7 of the v2 document unchanged."""
import os, sys, copy
from PIL import Image
import docx
from docx.shared import Pt, Emu, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from content import MODULES, INTRO_TITLE, INTRO_TEXT

SRC, OUT = sys.argv[1], sys.argv[2]
IMG = os.path.join(HERE, 'img')
d = docx.Document(SRC)
body = d.element.body

def find_par(pred):
    for el in body.iterchildren():
        if el.tag == qn('w:p'):
            p = docx.text.paragraph.Paragraph(el, d)
            if pred(p):
                return el
    raise SystemExit('anchor not found')

# --- 1. intro text ---
pars = d.paragraphs
for p in pars[:6]:
    if p.text.startswith('Section III'):
        p.runs[0].text = INTRO_TITLE
        for r in p.runs[1:]: r.text = ''
    elif p.text.startswith('This section replaces'):
        p.runs[0].text = INTRO_TEXT
        for r in p.runs[1:]: r.text = ''

# --- 2. remove old modules 1-5 ---
start = find_par(lambda p: p.style.name == 'Heading 2' and p.text.startswith('1. Customer'))
anchor = find_par(lambda p: p.style.name == 'Heading 2' and p.text.startswith('6. Background'))
el = start
while el is not anchor:
    nxt = el.getnext(); body.remove(el); el = nxt

# --- helpers producing the same formatting as v2 ---
def run_fmt(r, size=10.5, bold=False, italic=False, color=None):
    r.font.name = 'Arial'; r._element.rPr.rFonts.set(qn('w:eastAsia'), 'Arial'); r._element.rPr.rFonts.set(qn('w:cs'), 'Arial')
    r.font.size = Pt(size); r.font.bold = bold or None; r.font.italic = italic or None
    if color: r.font.color.rgb = RGBColor.from_string(color)

new_elements = []
def emit(el): new_elements.append(el)

def heading(text, level):
    p = d.add_paragraph()
    pPr = p._element.get_or_add_pPr(); ps = OxmlElement('w:pStyle'); ps.set(qn('w:val'), f'Heading{level}'); pPr.insert(0, ps)
    p.add_run(text); emit(p._element); return p

def para(text, label=None, after=120):
    p = d.add_paragraph(); p.paragraph_format.space_after = Pt(after / 20)
    if label: p.paragraph_format.keep_with_next = True
    if label:
        r = p.add_run(label); run_fmt(r, bold=True)
    r = p.add_run(text); run_fmt(r)
    emit(p._element); return p

def figure(key, caption):
    path = os.path.join(IMG, key + '.png')
    w, h = Image.open(path).size
    full = 5715000                      # same width as the v2 screenshots
    width = full if w >= 1200 else int(full * min(1.0, w / 1440 * 1.45))
    height = width * h / w
    max_h = 7700000                      # keep a figure on one A4 page
    if height > max_h: width = int(width * max_h / height)
    p = d.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6); p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    p.add_run().add_picture(path, width=Emu(width))
    docpr = p._element.find('.//' + qn('wp:docPr'))
    docpr.set('name', key); docpr.set('descr', caption); docpr.set('title', caption)
    emit(p._element)
    c = d.add_paragraph(); c.alignment = WD_ALIGN_PARAGRAPH.CENTER; c.paragraph_format.space_after = Pt(10)
    r = c.add_run(caption); run_fmt(r, size=9, italic=True, color='555555'); emit(c._element)

def cell_props(cell, width, header):
    tcPr = cell._tc.get_or_add_tcPr()
    tcW = tcPr.find(qn('w:tcW'))
    if tcW is None: tcW = OxmlElement('w:tcW'); tcPr.append(tcW)
    tcW.set(qn('w:type'), 'dxa'); tcW.set(qn('w:w'), str(width))
    b = OxmlElement('w:tcBorders')
    for side in ('top', 'left', 'bottom', 'right'):
        e = OxmlElement(f'w:{side}'); e.set(qn('w:val'), 'single'); e.set(qn('w:color'), 'BFBFBF'); e.set(qn('w:sz'), '4'); b.append(e)
    tcPr.append(b)
    if header:
        shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), 'D9E2F3'); shd.set(qn('w:color'), 'auto'); shd.set(qn('w:val'), 'clear'); tcPr.append(shd)
    mar = OxmlElement('w:tcMar')
    for side, v in (('top', 60), ('left', 100), ('bottom', 60), ('right', 100)):
        e = OxmlElement(f'w:{side}'); e.set(qn('w:type'), 'dxa'); e.set(qn('w:w'), str(v)); mar.append(e)
    tcPr.append(mar)

def field_table(rows):
    lab = d.add_paragraph(); lab.paragraph_format.space_before = Pt(4); lab.paragraph_format.space_after = Pt(4); lab.paragraph_format.keep_with_next = True
    run_fmt(lab.add_run('Field Description'), bold=True); emit(lab._element)
    t = d.add_table(rows=len(rows) + 1, cols=2)
    tblPr = t._tbl.tblPr
    tblW = tblPr.find(qn('w:tblW'))
    if tblW is None: tblW = OxmlElement('w:tblW'); tblPr.append(tblW)
    tblW.set(qn('w:type'), 'dxa'); tblW.set(qn('w:w'), '9026')
    borders = OxmlElement('w:tblBorders')
    for side in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        e = OxmlElement(f'w:{side}'); e.set(qn('w:val'), 'single'); e.set(qn('w:color'), 'auto'); e.set(qn('w:sz'), '4'); borders.append(e)
    tblW.addnext(borders)   # schema order: tblW, jc, tblCellSpacing, tblInd, tblBorders …
    grid = t._tbl.tblGrid
    for gc, w in zip(grid.findall(qn('w:gridCol')), (2700, 6326)): gc.set(qn('w:w'), str(w))
    trPr = t.rows[0]._tr.get_or_add_trPr(); hdr = OxmlElement('w:tblHeader'); trPr.append(hdr)
    data = [('Field Name', 'Description')] + rows
    for i, (a, b) in enumerate(data):
        for j, (txt, w) in enumerate(((a, 2700), (b, 6326))):
            cell = t.rows[i].cells[j]; cell_props(cell, w, i == 0)
            p = cell.paragraphs[0]; r = p.add_run(txt); run_fmt(r, size=9.5, bold=(i == 0))
    emit(t._tbl)

# --- 3. build new content ---
fig_count = 0
for h2, intro, screens in MODULES:
    heading(h2, 2)
    if intro: para(intro)
    for h3, desc, figs, rows in screens:
        heading(h3, 3)
        para(desc, label='Description: ')
        for key, cap in figs:
            figure(key, cap); fig_count += 1
        field_table(rows)

for el in new_elements:
    anchor.addprevious(el)

# drop image relationships no longer referenced (old v2 screenshots)
used = set(x.get(qn('r:embed')) for x in body.iter(qn('a:blip')))
part = d.part
dropped = 0
for rid, rel in list(part.rels.items()):
    if rel.reltype.endswith('/image') and rid not in used:
        part.drop_rel(rid); dropped += 1
print('dropped old images', dropped)
d.save(OUT)
print('figures', fig_count, 'elements', len(new_elements))
