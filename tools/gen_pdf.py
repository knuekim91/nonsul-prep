# -*- coding: utf-8 -*-
import json, os, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
    Spacer, Table, TableStyle, KeepTogether, PageBreak)
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.lib.utils import simpleSplit

QDATA = sys.argv[1]
OUTDIR = sys.argv[2]
os.makedirs(OUTDIR, exist_ok=True)

pdfmetrics.registerFont(TTFont("Malgun", r"C:/Windows/Fonts/malgun.ttf"))
pdfmetrics.registerFont(TTFont("MalgunBd", r"C:/Windows/Fonts/malgunbd.ttf"))
pdfmetrics.registerFontFamily("Malgun", normal="Malgun", bold="MalgunBd", italic="Malgun", boldItalic="MalgunBd")

UNIV = {"skku": ("성균관대학교", colors.HexColor("#1b5e20")),
        "korea": ("고려대학교", colors.HexColor("#8a1a2b"))}

def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

st_univ  = lambda c: ParagraphStyle("u", fontName="MalgunBd", fontSize=12, textColor=c, spaceAfter=2)
st_title = ParagraphStyle("t", fontName="MalgunBd", fontSize=16, leading=20, spaceAfter=3)
st_meta  = ParagraphStyle("m", fontName="Malgun", fontSize=9, textColor=colors.HexColor("#5c6670"), spaceAfter=2)
st_sec   = ParagraphStyle("s", fontName="MalgunBd", fontSize=11.5, textColor=colors.HexColor("#1a1d21"),
                          spaceBefore=10, spaceAfter=4)
st_body  = ParagraphStyle("b", fontName="Malgun", fontSize=10.3, leading=16, alignment=TA_JUSTIFY, spaceAfter=2)
st_prompt= ParagraphStyle("p", fontName="Malgun", fontSize=11, leading=17, backColor=colors.HexColor("#eef1f5"),
                          borderColor=colors.HexColor("#d4dae1"), borderWidth=0.6, borderPadding=7,
                          spaceBefore=4, spaceAfter=8, leftIndent=2, rightIndent=2)
st_note  = ParagraphStyle("n", fontName="Malgun", fontSize=8.6, textColor=colors.HexColor("#5c6670"),
                          leading=12, spaceBefore=3)
st_tcell = ParagraphStyle("tc", fontName="Malgun", fontSize=8.8, leading=12, alignment=TA_CENTER)
st_tcellL= ParagraphStyle("tcl", fontName="Malgun", fontSize=8.8, leading=12, alignment=TA_LEFT)
st_thead = ParagraphStyle("th", fontName="MalgunBd", fontSize=8.8, leading=12, alignment=TA_CENTER)

CONTENT_W = A4[0] - 40*mm

def make_table(m):
    head = m.get("head")
    rows = m.get("rows", [])
    data = []
    if head:
        data.append([Paragraph(esc(h), st_thead) for h in head])
    for r in rows:
        cells = []
        for ci, c in enumerate(r):
            cells.append(Paragraph(esc(c), st_tcellL if ci == 0 else st_tcell))
        data.append(cells)
    ncol = len(head) if head else (len(rows[0]) if rows else 1)
    first = CONTENT_W * (0.40 if ncol <= 3 else 0.34)
    rest = (CONTENT_W - first) / (ncol - 1) if ncol > 1 else CONTENT_W
    widths = [first] + [rest] * (ncol - 1)
    t = Table(data, colWidths=widths, hAlign="LEFT")
    ts = [("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#c9d0d8")),
          ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
          ("TOPPADDING",(0,0),(-1,-1),4), ("BOTTOMPADDING",(0,0),(-1,-1),4),
          ("BACKGROUND",(0,0),(-1,0), colors.HexColor("#eef1f5")) if head else ("TOPPADDING",(0,0),(0,0),4),
          ("BACKGROUND",(0,1 if head else 0),(0,-1), colors.HexColor("#f6f7f9"))]
    t.setStyle(TableStyle(ts))
    return t

def make_bars(m):
    items = m["items"]
    mx = m.get("max") or max(i["value"] for i in items)
    row_h = 16
    pad = 6
    w = CONTENT_W
    label_w = 70
    val_w = 38
    track_w = w - label_w - val_w - 12
    h = len(items) * row_h + pad*2
    d = Drawing(w, h)
    y = h - pad - row_h + 3
    for it in items:
        d.add(String(0, y+2, str(it["label"]), fontName="Malgun", fontSize=9,
                     fillColor=colors.HexColor("#5c6670")))
        d.add(Rect(label_w, y, track_w, 11, rx=3, ry=3, fillColor=colors.HexColor("#eef1f5"),
                   strokeColor=colors.HexColor("#d4dae1"), strokeWidth=0.5))
        bw = max(3, track_w * (it["value"]/mx))
        d.add(Rect(label_w, y, bw, 11, rx=3, ry=3, fillColor=colors.HexColor("#2f6fed"), strokeColor=None))
        d.add(String(w-2, y+2, str(it["value"]), fontName="MalgunBd", fontSize=9,
                     fillColor=colors.HexColor("#1a1d21"), textAnchor="end"))
        y -= row_h
    return d

def question_story(q):
    uname, ucol = UNIV[q["univ"]]
    story = []
    story.append(Paragraph("%s · %s" % (esc(uname), "인문계열 논술" if q["univ"]=="korea" else "언어형 논술"), st_univ(ucol)))
    story.append(Paragraph(esc(q["title"]), st_title))
    story.append(Paragraph("주제: %s &nbsp;|&nbsp; 분량: %s &nbsp;|&nbsp; 권장시간: %s" %
                           (esc(q["issue"]), esc(q["length"]), esc(q["time"])), st_meta))
    story.append(Table([[""]], colWidths=[CONTENT_W], rowHeights=[2],
                 style=TableStyle([("LINEBELOW",(0,0),(-1,-1),1,ucol)])))
    story.append(Spacer(1, 4))
    # 제시문
    if q.get("sources"):
        story.append(Paragraph("제시문", st_sec))
        for s in q["sources"]:
            story.append(Paragraph("<b>%s</b>&nbsp; %s" % (esc(s["label"]), esc(s["text"])), st_body))
            story.append(Spacer(1, 3))
    # 자료
    if q.get("materials"):
        story.append(Paragraph("자료", st_sec))
        for m in q["materials"]:
            flow = [Paragraph("<b>%s</b>" % esc(m.get("title","")), st_body)]
            if m["type"] == "table":
                flow.append(Spacer(1,3)); flow.append(make_table(m))
            elif m["type"] == "bars":
                flow.append(Spacer(1,3)); flow.append(make_bars(m))
            for n in m.get("notes", []):
                flow.append(Paragraph("※ " + esc(n), st_note))
            story.append(KeepTogether(flow))
            story.append(Spacer(1, 6))
    # 문항
    story.append(Paragraph("문항", st_sec))
    for p in q["prompts"]:
        story.append(Paragraph(esc(p), st_prompt))
    story.append(Spacer(1, 6))
    story.append(Paragraph("※ 본 문제의 제시문·자료는 실전 연습용으로 재구성한 창작이며, 실제 출제 지문·공식 자료가 아닙니다. "
                           "원고지에 손글씨로 작성한 뒤 사진을 찍어 평가받으세요.  (나은 논술 준비 · knuekim91.github.io/nonsul-prep)", st_note))
    return story

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Malgun", 8)
    canvas.setFillColor(colors.HexColor("#9aa5b1"))
    canvas.drawCentredString(A4[0]/2, 12*mm, "나은 논술 준비 — %d" % doc.page)
    canvas.restoreState()

def build(path, stories_with_breaks):
    doc = BaseDocTemplate(path, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm, topMargin=18*mm, bottomMargin=18*mm, title="나은 논술 문제지")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=footer)])
    doc.build(stories_with_breaks)

def main():
    with open(QDATA, encoding="utf-8") as f:
        data = json.load(f)
    qs = data["questions"]
    # 개별 PDF
    for q in qs:
        build(os.path.join(OUTDIR, q["id"] + ".pdf"), question_story(q))
    # 전체본
    allstory = []
    for i, q in enumerate(qs):
        allstory += question_story(q)
        if i != len(qs)-1:
            allstory.append(PageBreak())
    build(os.path.join(OUTDIR, "all.pdf"), allstory)
    print("generated %d + all.pdf" % len(qs))

if __name__ == "__main__":
    main()
