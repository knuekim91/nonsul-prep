# -*- coding: utf-8 -*-
"""성균관대 언어논술 '줄글(줄노트)' 연습 답안지 A4 PDF 생성.
출력: pdf/skku-answer-sheet.pdf
실전 연습용이며 성균관대 공식 답안지가 아니라 양식을 재현한 것임.
"""
import os, sys
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib import colors

OUT = sys.argv[1] if len(sys.argv) > 1 else "pdf/skku-answer-sheet.pdf"
os.makedirs(os.path.dirname(OUT) or ".", exist_ok=True)

pdfmetrics.registerFont(TTFont("Malgun", r"C:/Windows/Fonts/malgun.ttf"))
pdfmetrics.registerFont(TTFont("MalgunBd", r"C:/Windows/Fonts/malgunbd.ttf"))

PAGE_W, PAGE_H = A4
MARGIN = 45
INK = colors.HexColor("#1a1d21")
GRAY = colors.HexColor("#6b7280")
LINE = colors.HexColor("#9aa3ad")
FAINT = colors.HexColor("#c7ccd3")
LINE_GAP = 30          # 줄 간격(pt)
BOTTOM = 62            # 하단 여백(각주 공간)

PAGES = [
    ("문제 1", "요약형", "40점", "권장 30~35분 · 16~18줄 내외"),
    ("문제 2", "평가-설명형", "40점", "권장 35~40분 · 16~18줄 내외"),
    ("문제 3", "논술-논증형", "20점", "권장 20~25분 · 13~14줄 내외"),
    ("자유 연습", "문항: ____________________", "", "원하는 기출/예상문제로 연습"),
]


def draw_page(c, pno, ptype, score, guide, page_label):
    x0, x1 = MARGIN, PAGE_W - MARGIN

    # 제목
    c.setFillColor(INK)
    c.setFont("MalgunBd", 15)
    c.drawString(x0, PAGE_H - 54, "2026학년도 성균관대 언어논술 · 연습 답안지")
    c.setFont("Malgun", 9.5)
    c.setFillColor(GRAY)
    c.drawString(x0, PAGE_H - 70, "줄글(줄노트) 형식 — 네모칸 원고지가 아닌 가로줄 답안지입니다.")

    # 인적사항 박스
    box_top = PAGE_H - 84
    box_h = 40
    box_bot = box_top - box_h
    c.setStrokeColor(LINE); c.setLineWidth(0.6)
    c.rect(x0, box_bot, x1 - x0, box_h, stroke=1, fill=0)
    # 세로 구분선 (수험번호 | 성명 | 날짜)
    w = x1 - x0
    v1 = x0 + w * 0.45
    v2 = x0 + w * 0.72
    c.line(v1, box_bot, v1, box_top)
    c.line(v2, box_bot, v2, box_top)
    c.setFont("Malgun", 9); c.setFillColor(GRAY)
    c.drawString(x0 + 8, box_top - 13, "수험번호")
    c.drawString(v1 + 8, box_top - 13, "성명")
    c.drawString(v2 + 8, box_top - 13, "날짜")
    c.setFillColor(FAINT); c.setFont("Malgun", 11)
    c.drawString(x0 + 8, box_bot + 10, "□ □ □ □ □ □")

    # 문제 헤더
    head_y = box_bot - 24
    c.setFillColor(INK); c.setFont("MalgunBd", 12.5)
    label = "【 %s 】 %s" % (pno, ptype)
    if score:
        label += " · " + score
    c.drawString(x0, head_y, label)
    c.setFillColor(GRAY); c.setFont("Malgun", 9.5)
    c.drawRightString(x1, head_y, guide)
    # 헤더 밑줄
    c.setStrokeColor(INK); c.setLineWidth(1.0)
    c.line(x0, head_y - 7, x1, head_y - 7)

    # 가로 줄 (답안 영역)
    y = head_y - 7 - LINE_GAP
    c.setStrokeColor(LINE); c.setLineWidth(0.5)
    n = 0
    while y > BOTTOM:
        c.line(x0, y, x1, y)
        y -= LINE_GAP
        n += 1

    # 각주
    c.setFillColor(GRAY); c.setFont("Malgun", 8)
    c.drawString(x0, 40, "검은색 필기구만 사용 · 수정은 두 줄 긋기(수정액·테이프 금지) · 지정 영역 내 작성")
    c.drawRightString(x1, 40, page_label)
    c.setFillColor(FAINT); c.setFont("Malgun", 7.5)
    c.drawString(x0, 28, "실전 연습용 · 성균관대 공식 답안지가 아니라 양식을 재현한 것입니다.")


def main():
    c = canvas.Canvas(OUT, pagesize=A4)
    total = len(PAGES)
    for i, (pno, ptype, score, guide) in enumerate(PAGES, 1):
        draw_page(c, pno, ptype, score, guide, "%d / %d" % (i, total))
        c.showPage()
    c.save()
    print("saved", OUT, "(%d pages)" % total)


if __name__ == "__main__":
    main()
