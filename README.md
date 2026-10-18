# 나은 논술 준비 ✍️

성균관대(언어형) · 고려대(인문계열) **경영 논술** 준비용 웹앱입니다.
휴대폰·PC 어디서나 열어 보고, 손글씨 답안을 사진으로 찍어 AI 평가까지 받을 수 있습니다.

## 🌐 바로 보기 (GitHub Pages)
> 배포 후 주소: **https://knuekim91.github.io/nonsul-prep/**

## 구성
- **홈** — 두 대학 개요·인재상·실전 루틴
- **출제경향** — 대학별 기출 분석·핵심 출제 축·연도별 흐름
- **예상문제** — 경영 · 올해 시사 · AI 인문 연계 10세트(대학/주제 필터). 각 문항 **제시문·자료 전문** 수록, **시험지 PDF 다운로드**(`pdf/<문항ID>.pdf`, 전체본 `pdf/all.pdf`)
- **모범답안** — 기출 기반 연습용 예시 답안 + 해설
- **공부전략** — 공통/대학별 전략 + 4주 로드맵(체크 저장)
- **요약본** — 반복 주제 핵심 개념·배경지식
- **답안평가** — 문항 선택 → ‘평가 프롬프트’ 복사 → Claude에 사진과 함께 올리면 채점
- **원고지** — 700/800/1000/1600자 인쇄(실전 손글씨 연습)

## 답안 평가 방법 (사진 → Claude)
1. ‘원고지’ 탭에서 원고지를 인쇄해 **손글씨**로 답안 작성
2. 휴대폰으로 **밝고 반듯하게 촬영**
3. ‘답안평가’ 탭에서 문항 선택 후 **‘평가 프롬프트 복사’**
4. **Claude 대화창에 프롬프트 + 원고지 사진을 함께** 업로드
5. Claude가 손글씨를 전사(轉寫)한 뒤 채점 기준에 따라 평가·첨삭

## 콘텐츠 수정 방법
모든 학습 내용은 [`js/content.js`](js/content.js) 한 파일에 들어 있습니다.
예상문제·전략·요약 등을 추가/수정한 뒤 커밋·푸시하면 사이트에 바로 반영됩니다.

## 문제지 PDF 다시 만들기
예상문제를 추가/수정한 뒤 PDF도 갱신하려면(한글 폰트: 맑은 고딕, 라이브러리: `pip install reportlab`):
```bash
# 1) content.js에서 데이터 추출
node -e "global.window={};require('./js/content.js');require('fs').writeFileSync('tools/qdata.json',JSON.stringify({universities:window.DATA.universities,questions:window.DATA.questions}))"
# 2) PDF 생성 (pdf/ 폴더에 문항ID.pdf + all.pdf)
python tools/gen_pdf.py tools/qdata.json pdf
```

## 로컬에서 보기
```bash
cd nonsul-prep
python -m http.server 8000
# 브라우저에서 http://127.0.0.1:8000
```

---
※ 예상문제·모범답안은 학습용으로 재구성한 것이며 실제 출제·공식 답안과 다릅니다.
시험 일정·형식·모집단위별 응시 영역은 각 대학 **모집요강**에서 반드시 확인하세요.
