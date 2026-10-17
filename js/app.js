/* ===== 나은 논술 준비 — 앱 로직 ===== */
(function(){
  "use strict";
  var D = window.DATA;
  var UNIV = { skku:"성균관대", korea:"고려대" };

  /* ---- helpers ---- */
  function el(tag, attrs, children){
    var n = document.createElement(tag);
    if(attrs) for(var k in attrs){
      if(k==="class") n.className=attrs[k];
      else if(k==="html") n.innerHTML=attrs[k];
      else if(k.slice(0,2)==="on") n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    (children||[]).forEach(function(c){ if(c==null) return;
      n.appendChild(typeof c==="string"?document.createTextNode(c):c); });
    return n;
  }
  function esc(s){ return String(s).replace(/[&<>]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;"}[c];}); }
  var store = {
    get:function(k,d){ try{var v=localStorage.getItem("naeun_"+k);return v==null?d:JSON.parse(v);}catch(e){return d;} },
    set:function(k,v){ try{localStorage.setItem("naeun_"+k,JSON.stringify(v));}catch(e){} }
  };
  function toast(msg){
    var t=document.getElementById("_toast");
    if(!t){ t=el("div",{id:"_toast",class:"toast"}); document.body.appendChild(t); }
    t.textContent=msg; t.classList.add("show");
    clearTimeout(t._t); t._t=setTimeout(function(){t.classList.remove("show");},1600);
  }
  function copy(text){
    function done(){ toast("복사됐어요 ✓  Claude에 붙여넣으세요"); }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done, fallback);
    } else fallback();
    function fallback(){
      var ta=el("textarea",{}); ta.value=text; ta.style.position="fixed"; ta.style.opacity="0";
      document.body.appendChild(ta); ta.select();
      try{document.execCommand("copy");done();}catch(e){toast("복사 실패 — 길게 눌러 복사하세요");}
      document.body.removeChild(ta);
    }
  }
  function univBadge(u){ return el("span",{class:"badge "+u}, [UNIV[u]]); }

  /* ---- 자료(표/그래프) 렌더 & 텍스트화 ---- */
  function renderMaterial(m){
    var box=el("div",{class:"material"});
    if(m.title) box.appendChild(el("div",{class:"mat-title"},[m.title]));
    if(m.type==="table"){
      var t=el("table",{class:"data-table"});
      if(m.head){ var tr=el("tr",{}); m.head.forEach(function(h){tr.appendChild(el("th",{},[h]));}); t.appendChild(el("thead",{},[tr])); }
      var tb=el("tbody",{});
      (m.rows||[]).forEach(function(r){ var row=el("tr",{});
        r.forEach(function(c,ci){ row.appendChild(el(ci===0?"th":"td",{class:ci===0?"rowhead":""},[String(c)])); });
        tb.appendChild(row); });
      t.appendChild(tb); box.appendChild(t);
    } else if(m.type==="bars"){
      var vals=m.items.map(function(i){return i.value;});
      var max=m.max||Math.max.apply(null,vals);
      var wrap=el("div",{class:"bars"});
      m.items.forEach(function(it){
        var pct=Math.max(2,Math.round((it.value/max)*100));
        wrap.appendChild(el("div",{class:"bar-row"},[
          el("span",{class:"bar-label"},[it.label]),
          el("span",{class:"bar-track"},[el("span",{class:"bar-fill",style:"width:"+pct+"%"},[])]),
          el("span",{class:"bar-val"},[String(it.value)])
        ]));
      });
      box.appendChild(wrap);
    }
    (m.notes||[]).forEach(function(n){ box.appendChild(el("div",{class:"mat-note"},["※ "+n])); });
    return box;
  }
  function materialToText(m){
    var out=[]; if(m.title) out.push(m.title);
    if(m.type==="table"){
      if(m.head) out.push(m.head.join(" | "));
      (m.rows||[]).forEach(function(r){ out.push(r.join(" | ")); });
    } else if(m.type==="bars"){
      out.push(m.items.map(function(i){return i.label+" "+i.value;}).join(", ")+(m.unit?(" ("+m.unit+")"):""));
    }
    (m.notes||[]).forEach(function(n){ out.push("※ "+n); });
    return out.join("\n");
  }

  /* ---- theme ---- */
  (function(){
    var saved=store.get("theme",null);
    if(saved) document.documentElement.setAttribute("data-theme",saved);
    document.getElementById("themeBtn").addEventListener("click",function(){
      var cur=document.documentElement.getAttribute("data-theme");
      var sysDark=window.matchMedia&&window.matchMedia("(prefers-color-scheme:dark)").matches;
      var next = cur? (cur==="dark"?"light":"dark") : (sysDark?"light":"dark");
      document.documentElement.setAttribute("data-theme",next); store.set("theme",next);
    });
  })();

  /* ---- tabs / routing ---- */
  var TABS=[
    {id:"home",label:"홈"},
    {id:"trends",label:"출제경향"},
    {id:"questions",label:"예상문제"},
    {id:"answers",label:"모범답안"},
    {id:"strategy",label:"공부전략"},
    {id:"summary",label:"요약본"},
    {id:"eval",label:"답안평가"},
    {id:"paper",label:"원고지"}
  ];
  var tabsEl=document.getElementById("tabs");
  TABS.forEach(function(t){
    tabsEl.appendChild(el("button",{class:"tab",id:"tab-"+t.id,onclick:function(){go(t.id);}},[t.label]));
  });
  function go(id){
    TABS.forEach(function(t){ document.getElementById("tab-"+t.id).classList.toggle("active",t.id===id); });
    store.set("tab",id);
    var v=document.getElementById("view"); v.innerHTML="";
    (VIEWS[id]||VIEWS.home)(v);
    window.scrollTo(0,0); v.focus();
    if(location.hash.slice(1)!==id) history.replaceState(null,"","#"+id);
  }

  /* ================= VIEWS ================= */
  var VIEWS={};

  VIEWS.home=function(v){
    v.appendChild(el("h2",{class:"section"},["나은, 논술 준비 시작! ✍️"]));
    v.appendChild(el("p",{class:"lead"},["성균관대(언어형) · 고려대(인문계열) · 경영학과 중심 학습 공간"]));

    ["skku","korea"].forEach(function(key){
      var u=D.universities[key];
      v.appendChild(el("div",{class:"card"},[
        el("div",{class:"row"},[univBadge(key), el("span",{class:"badge soft"},[u.track])]),
        el("h3",{},[u.name]),
        el("div",{class:"block-label"},["인재상"]),
        el("ul",{class:"clean"}, u.인재상.map(function(x){return el("li",{},[x]);})),
        el("div",{class:"block-label"},["시험 형식"]),
        el("ul",{class:"clean"}, u.형식.slice(0,4).map(function(x){return el("li",{},[x]);})),
        el("div",{class:"note"},["💡 경영 연계: "+u.경영연계])
      ]));
    });

    v.appendChild(el("div",{class:"card"},[
      el("h3",{},["이렇게 쓰세요 (실전 루틴)"]),
      el("ol",{class:"clean"},[
        el("li",{},["‘예상문제’에서 오늘 풀 문항을 고른다."]),
        el("li",{},["‘원고지’를 인쇄해 손글씨로 시간 재며 쓴다(실전 대비)."]),
        el("li",{},["쓴 원고지를 휴대폰으로 찍는다."]),
        el("li",{},["‘답안평가’에서 그 문항의 ‘평가 프롬프트’를 복사한다."]),
        el("li",{},["Claude 대화창에 프롬프트 + 원고지 사진을 함께 올린다 → 평가 받기!"])
      ]),
      el("div",{class:"note"},["📷 사진은 글자가 잘 보이게 밝은 곳에서 반듯하게 찍어 주세요. Claude가 손글씨를 읽어 전사한 뒤 채점합니다."])
    ]));

    var qn=D.questions.length;
    v.appendChild(el("div",{class:"row",style:"margin-top:8px"},[
      el("button",{class:"btn primary",onclick:function(){go("questions");}},["예상문제 "+qn+"세트 보기 →"]),
      el("button",{class:"btn",onclick:function(){go("strategy");}},["4주 로드맵 →"])
    ]));
  };

  VIEWS.trends=function(v){
    v.appendChild(el("h2",{class:"section"},["기출 분석 · 출제경향"]));
    v.appendChild(el("p",{class:"lead"},["두 대학의 반복되는 ‘출제 축’을 먼저 외우면 어떤 지문이 나와도 길이 보입니다."]));
    ["skku","korea"].forEach(function(key){
      var t=D.trends[key];
      v.appendChild(el("div",{class:"card"},[
        el("div",{class:"row"},[univBadge(key)]),
        el("p",{},[t.summary]),
        el("div",{class:"block-label"},["핵심 출제 축"]),
        el("div",{class:"row"}, t.출제축.map(function(x){return el("span",{class:"badge cat"},[x]);})),
        el("div",{class:"block-label",style:"margin-top:10px"},["연도별 흐름"]),
        el("div",{class:"grid"}, t.byYear.map(function(y){
          return el("div",{class:"prompt-box"},[
            el("b",{},[y.year+" · "]), y.주제,
            el("div",{class:"muted",style:"font-size:13px;margin-top:4px"},["→ "+y.포인트])
          ]);
        }))
      ]));
    });
  };

  VIEWS.questions=function(v){
    v.appendChild(el("h2",{class:"section"},["예상문제"]));
    v.appendChild(el("p",{class:"lead"},["경영 · 올해 시사 · AI 인문 연계 문항. 대학/주제로 걸러 보세요. 문항마다 ‘평가 프롬프트 복사’ 가능."]));

    var fU=store.get("fU","all"), fC=store.get("fC","all");
    var cats=["경영","시사","AI인문"];
    var fU_row=el("div",{class:"filters"});
    [["all","전체"],["skku","성균관대"],["korea","고려대"]].forEach(function(o){
      fU_row.appendChild(el("button",{class:"chip"+(fU===o[0]?" on":""),onclick:function(){store.set("fU",o[0]);go("questions");}},[o[1]]));
    });
    var fC_row=el("div",{class:"filters"});
    [["all","전체주제"]].concat(cats.map(function(c){return [c,c];})).forEach(function(o){
      fC_row.appendChild(el("button",{class:"chip"+(fC===o[0]?" on":""),onclick:function(){store.set("fC",o[0]);go("questions");}},[o[1]]));
    });
    v.appendChild(fU_row); v.appendChild(fC_row);

    var done=store.get("qdone",{});
    var list=D.questions.filter(function(q){
      return (fU==="all"||q.univ===fU)&&(fC==="all"||q.category===fC);
    });
    v.appendChild(el("p",{class:"muted",style:"font-size:13px;margin:6px 0"},[list.length+"개 문항"]));

    list.forEach(function(q){
      var head=el("div",{class:"q-head"},[
        el("div",{},[
          el("div",{class:"row",style:"margin-bottom:5px"},[univBadge(q.univ), el("span",{class:"badge cat"},[q.category])]),
          el("div",{class:"q-title"},[q.title])
        ]),
        (function(){
          var cb=el("input",{type:"checkbox"}); cb.checked=!!done[q.id];
          cb.addEventListener("change",function(){ done[q.id]=cb.checked; store.set("qdone",done); });
          return el("label",{class:"check",title:"완료 표시",style:"padding:0"},[cb]);
        })()
      ]);
      var meta=el("div",{class:"kv"},[
        el("span",{html:"🗓 <b>"+esc(q.issue)+"</b>"}),
        el("span",{html:"✏️ 분량 <b>"+esc(q.length)+"</b>"}),
        el("span",{html:"⏱ <b>"+esc(q.time)+"</b>"})
      ]);

      var det=el("details",{},[el("summary",{},["📄 시험지 펼치기 (제시문 · 자료 · 문항)"])]);

      if(q.sources && q.sources.length){
        det.appendChild(el("div",{class:"block-label"},["제시문"]));
        q.sources.forEach(function(s){
          det.appendChild(el("div",{class:"source"},[
            el("span",{class:"source-label"},[s.label]),
            el("span",{},[" "+s.text])
          ]));
        });
      }
      if(q.materials && q.materials.length){
        det.appendChild(el("div",{class:"block-label"},["자료"]));
        q.materials.forEach(function(m){ det.appendChild(renderMaterial(m)); });
      }
      det.appendChild(el("div",{class:"block-label"},["문항"]));
      q.prompts.forEach(function(p,i){
        det.appendChild(el("div",{class:"prompt-box"},[p]));
        det.appendChild(el("div",{class:"row",style:"margin:6px 0 12px"},[
          el("button",{class:"btn primary",onclick:function(){copy(buildEvalPrompt(q,i));}},["📋 이 문항 평가 프롬프트 복사"]),
          el("button",{class:"btn ghost",onclick:function(){go("paper");}},["원고지 인쇄"])
        ]));
      });

      var hint=el("details",{class:"hint"},[el("summary",{},["💡 접근 가이드 보기 (먼저 스스로 써본 뒤 확인!)"])]);
      hint.appendChild(el("div",{class:"block-label"},["제시문 요지"]));
      hint.appendChild(el("ul",{class:"clean"}, q.passages.map(function(p){return el("li",{},[p]);})));
      hint.appendChild(el("div",{class:"block-label"},["출제 의도"]));
      hint.appendChild(el("p",{},[q.intent]));
      hint.appendChild(el("div",{class:"block-label"},["접근 팁"]));
      hint.appendChild(el("ul",{class:"clean"}, q.tips.map(function(x){return el("li",{},[x]);})));
      det.appendChild(hint);

      v.appendChild(el("div",{class:"card q"},[head, meta, det]));
    });
  };

  VIEWS.answers=function(v){
    v.appendChild(el("h2",{class:"section"},["모범답안 · 해설"]));
    v.appendChild(el("p",{class:"lead"},["기출 기반 연습용 예시. ‘구조와 전개’를 눈에 익히는 용도입니다(공식 답안 아님)."]));
    D.modelAnswers.forEach(function(m){
      v.appendChild(el("div",{class:"card"},[
        el("div",{class:"row"},[univBadge(m.univ), el("span",{class:"badge soft"},[m.source])]),
        el("div",{class:"block-label"},["문항"]),
        el("div",{class:"prompt-box"},[m.문제]),
        el("div",{class:"block-label"},["예시 답안"]),
        el("p",{style:"white-space:pre-wrap"},[m.답안]),
        el("div",{class:"block-label"},["해설"]),
        el("p",{},[m.해설]),
        el("div",{class:"block-label"},["이 답안이 잘한 점"]),
        el("div",{class:"row"}, m.포인트.map(function(x){return el("span",{class:"badge cat"},[x]);}))
      ]));
    });
  };

  VIEWS.strategy=function(v){
    v.appendChild(el("h2",{class:"section"},["대학별 공부 전략 · 4주 로드맵"]));
    v.appendChild(el("div",{class:"card"},[
      el("h3",{},["공통 원칙"]),
      el("ul",{class:"clean"}, D.strategy.common.map(function(x){return el("li",{},[x]);}))
    ]));
    v.appendChild(el("div",{class:"grid two"},[
      el("div",{class:"card"},[el("div",{class:"row"},[univBadge("skku")]),
        el("ul",{class:"clean"}, D.strategy.skku.map(function(x){return el("li",{},[x]);}))]),
      el("div",{class:"card"},[el("div",{class:"row"},[univBadge("korea")]),
        el("ul",{class:"clean"}, D.strategy.korea.map(function(x){return el("li",{},[x]);}))])
    ]));

    var checks=store.get("roadmap",{});
    var rm=el("div",{class:"card"},[el("h3",{},["4주 실전 로드맵 (체크하며 진행)"])]);
    D.strategy.roadmap.forEach(function(w,wi){
      var box=el("div",{class:"week"},[el("h4",{},[w.week+" — "+w.goal])]);
      w.todo.forEach(function(td,ti){
        var key=wi+"_"+ti;
        var cb=el("input",{type:"checkbox"}); cb.checked=!!checks[key];
        cb.addEventListener("change",function(){checks[key]=cb.checked;store.set("roadmap",checks);});
        box.appendChild(el("label",{class:"check"},[cb, el("span",{},[td])]));
      });
      rm.appendChild(box);
    });
    v.appendChild(rm);
  };

  VIEWS.summary=function(v){
    v.appendChild(el("h2",{class:"section"},["핵심 요약본 · 배경지식"]));
    v.appendChild(el("p",{class:"lead"},["논술에 반복되는 주제의 핵심 개념을 빠르게 복습하세요."]));
    v.appendChild(el("div",{class:"grid two"}, D.summaries.map(function(s){
      return el("div",{class:"card"},[
        el("h3",{},[s.topic]),
        el("p",{},[s.핵심]),
        el("div",{class:"block-label"},["핵심 개념"]),
        el("div",{class:"row"}, s.개념.map(function(x){return el("span",{class:"badge soft"},[x]);})),
        el("div",{class:"block-label"},["연결 이슈"]),
        el("div",{class:"row"}, s.배경.map(function(x){return el("span",{class:"badge cat"},[x]);}))
      ]);
    })));
  };

  VIEWS.eval=function(v){
    v.appendChild(el("h2",{class:"section"},["답안 평가 받기 (원고지 사진 → Claude)"]));
    v.appendChild(el("div",{class:"card"},[
      el("h3",{},["진행 방법"]),
      el("ol",{class:"steps"},[
        el("li",{},["원고지에 손글씨로 답안을 쓴다 (‘원고지’ 탭에서 인쇄)."]),
        el("li",{},["휴대폰으로 밝고 반듯하게 촬영한다."]),
        el("li",{},["아래에서 문항을 고르고 ‘평가 프롬프트 복사’를 누른다."]),
        el("li",{},["Claude 대화창에 붙여넣기 + 원고지 사진을 함께 올린다."]),
        el("li",{},["Claude가 손글씨를 읽어 전사한 뒤, 기준에 따라 채점·첨삭해 줍니다."])
      ])
    ]));

    var sel=el("select",{});
    sel.appendChild(el("option",{value:""},["— 등록된 예상문제에서 선택 —"]));
    D.questions.forEach(function(q){
      q.prompts.forEach(function(p,i){
        var label="["+UNIV[q.univ]+"] "+q.title+(q.prompts.length>1?" ("+(i+1)+"번 문항)":"");
        sel.appendChild(el("option",{value:q.id+"|"+i},[label]));
      });
    });

    var box=el("div",{class:"card"},[
      el("h3",{},["① 등록 문항으로 평가"]),
      sel,
      el("div",{class:"row",style:"margin-top:10px"},[
        el("button",{class:"btn primary",onclick:function(){
          if(!sel.value){toast("문항을 먼저 선택하세요");return;}
          var parts=sel.value.split("|"); var q=D.questions.filter(function(x){return x.id===parts[0];})[0];
          copy(buildEvalPrompt(q,parseInt(parts[1],10)));
        }},["📋 평가 프롬프트 복사"])
      ])
    ]);
    v.appendChild(box);

    // custom
    var uSel=el("select",{});
    [["korea","고려대 (인문계열)"],["skku","성균관대 (언어형)"]].forEach(function(o){
      uSel.appendChild(el("option",{value:o[0]},[o[1]]));
    });
    var ta=el("textarea",{rows:"4",placeholder:"예) [문제] ‘○○’라는 주장에 대해 제시문을 근거로 지지 또는 비판하시오. (700±50자)"});
    v.appendChild(el("div",{class:"card"},[
      el("h3",{},["② 직접 입력한 문항으로 평가"]),
      el("div",{class:"block-label"},["대학"]), uSel,
      el("div",{class:"block-label"},["문항 내용"]), ta,
      el("div",{class:"row",style:"margin-top:10px"},[
        el("button",{class:"btn primary",onclick:function(){
          var txt=ta.value.trim(); if(!txt){toast("문항을 입력하세요");return;}
          copy(buildCustomEvalPrompt(uSel.value, txt));
        }},["📋 평가 프롬프트 복사"])
      ]),
      el("div",{class:"note"},["직접 쓴 자유 주제(예: 학교 논술 연습문제)도 이렇게 평가받을 수 있어요."])
    ]));
  };

  VIEWS.paper=function(v){
    v.appendChild(el("h2",{class:"section"},["원고지 (실전 연습용)"]));
    v.appendChild(el("p",{class:"lead no-print"},["칸 수를 고르고 인쇄해, 실제 시험처럼 손글씨로 연습하세요. 20칸 × 줄 구성."]));
    var size=store.get("paperSize",1000);
    var controls=el("div",{class:"mp-controls no-print"},[]);
    [[700,"고려대형 700자"],[1000,"1000자"],[800,"800자"],[1600,"장문 1600자"]].forEach(function(o){
      controls.appendChild(el("button",{class:"chip"+(size===o[0]?" on":""),onclick:function(){store.set("paperSize",o[0]);go("paper");}},[o[1]]));
    });
    controls.appendChild(el("button",{class:"btn primary",onclick:function(){window.print();}},["🖨 인쇄 / PDF 저장"]));
    v.appendChild(controls);
    v.appendChild(el("div",{class:"note no-print"},["팁: 인쇄 대화상자에서 ‘PDF로 저장’을 고르면 파일로도 보관됩니다. 고려대는 700±50자, 성균관대는 문항별 지정 분량을 확인하세요."]));

    var cols=20, rows=Math.ceil(size/cols);
    var head=el("div",{class:"gp-head"},["이름: ____________   날짜: ____________   문항: ____________________   ( "+size+"자 / "+cols+"칸 × "+rows+"줄 )"]);
    var grid=el("div",{class:"grid-paper",style:"grid-template-columns:repeat("+cols+",1fr)"});
    for(var i=0;i<cols*rows;i++) grid.appendChild(el("div",{class:"gp-cell"},[]));
    v.appendChild(el("div",{class:"sheet"},[head, grid]));
  };

  /* ---- 평가 프롬프트 생성 ---- */
  function rubricText(univKey){
    var r=D.rubric[univKey];
    var lines=["[채점 기준 — "+r.title+"]"];
    r.criteria.forEach(function(c){ lines.push("- "+c.name+"("+c.weight+"): "+c.desc); });
    lines.push(""); lines.push("[자기 점검 항목]");
    r.checklist.forEach(function(c){ lines.push("- "+c); });
    return lines.join("\n");
  }
  function evalShell(univKey, 문항블록, 형식){
    var u=D.universities[univKey];
    return [
"너는 대한민국 대학 논술 채점 전문가입니다. 아래는 "+u.name+" "+u.track+" 논술 문항이고,",
"첨부한 사진은 \"나은\" 학생이 원고지에 손으로 쓴 답안입니다.",
"",
"[진행 순서]",
"1) 먼저 사진 속 손글씨를 그대로 전사(轉寫)해 주세요. 흐리거나 불확실한 글자는 (?)로 표시하고, 전사한 총 글자 수(공백 제외)를 세어 주세요.",
"2) 아래 채점 기준으로 평가해 주세요.",
"",
"[아래는 나은 학생이 푼 문제의 전문입니다]",
문항블록,
형식?("[형식 요건] "+형식):null,
"",
rubricText(univKey),
"",
"[평가 결과 형식]",
"① 전사한 답안 (글자 수)",
"② 잘된 점 3가지 — 답안의 구체적 문장을 인용해 근거를 밝혀 주세요",
"③ 부족한 점·오류 3가지 — 어느 부분을 왜(제시문 활용/논리 일관/자료 인용/구성/분량 등)",
"④ 꼭 보완할 점 1~2가지 (우선순위)",
"⑤ 채점 기준 항목별 평가(상/중/하)와 예상 수준·총평",
"⑥ 개선 예시 — 약한 문장 1~2개를 더 나은 문장으로 고쳐 제시",
"",
"존댓말로, 격려하되 솔직하고 구체적으로 평가해 주세요. 고교 3학년이 바로 고칠 수 있게 써 주세요."
    ].filter(function(x){return x!=null;}).join("\n");
  }
  function buildEvalPrompt(q,idx){
    var parts=["· 주제: "+q.title];
    if(q.sources&&q.sources.length){ parts.push(""); parts.push("[제시문]");
      q.sources.forEach(function(s){ parts.push(s.label+") "+s.text); }); }
    if(q.materials&&q.materials.length){ parts.push(""); parts.push("[자료]");
      q.materials.forEach(function(m){ parts.push(materialToText(m)); parts.push(""); }); }
    parts.push("[문항]"); parts.push(q.prompts[idx]);
    return evalShell(q.univ, parts.join("\n"), q.length+" / 권장 작성시간 "+q.time);
  }
  function buildCustomEvalPrompt(univKey, text){
    return evalShell(univKey, text, null);
  }

  /* ---- boot ---- */
  var start = (location.hash && location.hash.slice(1)) || store.get("tab","home");
  if(!VIEWS[start]) start="home";
  go(start);
  window.addEventListener("hashchange",function(){
    var h=location.hash.slice(1); if(h&&VIEWS[h]) go(h);
  });
})();
