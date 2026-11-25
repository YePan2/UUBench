import { systems, qualityMetrics, evidenceMetrics, evidenceN, sampleN } from './data.js?v=20261125';

import { cases } from './cases.js?v=20261125-hide-scores';
const route = () => location.hash === '#arena' ? 'cases' : ['cases', 'methodology'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'leaderboard';

const state = {
  lang: 'en', view: route(),
  filter: 'all', search: '', metric: 'overview'
};
const $ = s => document.querySelector(s);
const t = (en, zh) => state.lang === 'zh' ? zh : en;
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const icon = (name, size = 18) => {
  const paths = {
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', external: '<path d="M7 17 17 7M7 7h10v10"/>',
    chart: '<path d="M5 20V10m7 10V4m7 16v-7"/>', compare: '<path d="m9 3-6 6 6 6M3 9h14m-2 12 6-6-6-6m6 6H7"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
    download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>', check: '<path d="m5 12 4 4L19 6"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    audio: '<path d="M3 10v4m4-8v12m5-15v18m5-15v12m4-8v4"/>',
    video: '<rect x="3" y="5" width="13" height="14" rx="3"/><path d="m16 10 5-3v10l-5-3"/>',
    book: '<path d="M12 5v16M3 3c5 0 7 1 9 3 2-2 4-3 9-3v16c-5 0-7 0-9 2-2-2-4-2-9-2Z"/>',
    shuffle: '<path d="M3 5h3c5 0 7 14 12 14h3m-4-4 4 4-4 4M3 19h3c2 0 3-2 4-4m4-6c1-2 2-4 4-4h3m-4-4 4 4-4 4"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5M14 3l-4 18"/>',
    spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>'
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.info}</svg>`;
};
const mark = s => `<span class="model-mark" style="--model-color:${s.color}">${s.mark}</span>`;
const formatNumber = (value, digits = 2) => {
  const text = Number(value).toFixed(digits);
  if (Number(text) === 0) return (0).toFixed(digits);
  return text.replace('-', '−');
};
const dash = () => `<span class="pending-score" aria-label="${t('Not measured','未测')}">—</span>`;
const score = (value, digits = 2) => value === null || value === undefined ? dash() : formatNumber(value, digits);
const group = s => s.type === 'open' ? t('Open-source', '开源') : t('Closed-source', '闭源');
const result = s => s.results;
let toastTimer;

function ranked(list, valueOf, direction = 'desc') {
  const sign = direction === 'asc' ? 1 : -1;
  const sorted = [...list].sort((a, b) => {
    const av = valueOf(a), bv = valueOf(b);
    if (av == null && bv == null) return a.name.localeCompare(b.name);
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av === bv) return a.name.localeCompare(b.name);
    return (av - bv) * sign;
  });
  return sorted.map((system, index) => ({ system, value: valueOf(system), rank: valueOf(system) == null ? null : index + 1 }));
}
const qRank = () => ranked(systems, s => result(s).Qmean, 'desc');
const sRank = () => ranked(systems, s => result(s).S, 'desc');
const timeRank = () => ranked(systems, s => result(s).latency, 'asc');
const rankOf = (rows, id) => rows.find(row => row.system.id === id).rank;

function header() {
  return `<header class="site-header"><div class="nav-inner">
    <a class="brand" href="#leaderboard" aria-label="UUBench home"><img src="./favicon.svg" alt="" width="33" height="33"><span>UUBench<span class="brand-dot">.</span></span></a>
    <nav aria-label="${t('Main navigation','主导航')}">
      ${[['leaderboard','Leaderboard','排行榜'],['cases','Case studies','案例展示'],['methodology','Paper','论文']].map(([id,en,zh]) => `<a href="#${id}" ${state.view===id?'aria-current="page"':''}>${t(en,zh)}</a>`).join('')}
    </nav>
    <div class="nav-actions"><button class="language-button" data-action="language" aria-label="${t('切换到中文','Switch to English')}">${t('EN <span>/ 中文</span>','中文 <span>/ EN</span>')}</button><a class="button button-small button-outline paper-button" href="https://arxiv.org/abs/2611.30157" target="_blank" rel="noopener noreferrer">${icon('book',15)} ${t('Read paper','阅读论文')} ${icon('external',12)}</a></div>
  </div></header>`;
}
function footer() {
  return `<footer class="site-footer"><div><a class="footer-brand" href="#leaderboard">UUBench<span>.</span></a><p>${t('Beyond what is said. Toward what is meant.','从说出的话，走向未说出的意图。')}</p></div><div class="footer-right"><span class="status-dot live"></span>${t('JEV 1.14.0 · 216 paired inputs','JEV 1.14.0 · 216 条成对输入')}<a href="#methodology">${t('Paper and figures','论文与配图')} ${icon('external',14)}</a></div></footer>`;
}
function hero() {
  return `<section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="tiny-line"></span>${t('THE DIGITAL HUMAN BENCHMARK','数字人隐式意图回应评测')}</div>
    <h1>${t('Understanding<br>the <em>unspoken.</em>','理解那些<br><em>未说出口的意图。</em>')}</h1>
    <p>${t('Can digital humans read between the lines?<br>Evaluating how they hear, see, and respond to implicit intent.','数字人能否听懂弦外之音？<br>从声音、画面与实际回应，评估对隐式意图的理解。')}</p>
    <div class="hero-actions"><a class="button button-primary" href="#cases">${icon('compare')} ${t('Explore the cases','查看真实案例')} ${icon('arrow',16)}</a><a class="text-link" href="#methodology">${t('Explore the paper','查看论文与配图')} ${icon('external',16)}</a></div>
  </div><div class="hero-art" aria-label="${t('Audio and visual cues inform implicit intent and a digital human response.','声音和视觉线索共同支持隐式意图与数字人回应。')}">
    <div class="art-grid"></div><div class="orbit orbit-outer"></div><div class="orbit orbit-inner"></div>
    <svg class="signal-lines" viewBox="0 0 520 300" aria-hidden="true"><path d="M92 82C180 82 170 147 250 147S340 79 431 79M96 231C175 231 173 151 250 151S346 222 434 222"/><path class="signal-dash" d="M92 82C180 82 170 147 250 147S340 79 431 79M96 231C175 231 173 151 250 151S346 222 434 222"/></svg>
    <div class="signal-node node-audio">${icon('audio',22)}<div><small>${t('AUDIO CUES','声音线索')}</small><strong>${t('Hear the nuance','听见弦外之音')}</strong></div><span class="mini-wave">▂▅▃▇▅▂</span></div>
    <div class="signal-node node-visual">${icon('eye',22)}<div><small>${t('VISUAL CUES','视觉线索')}</small><strong>${t('See the context','看见语境')}</strong></div><span class="focus-box"></span></div>
    <div class="intent-core"><span class="core-star">✳</span><span>${t('IMPLICIT<br>INTENT','隐式<br>意图')}</span></div>
    <div class="signal-output">${icon('spark',22)}<strong>${t('A meaningful<br>response.','恰如其分<br>的回应。')}</strong><span>VOICE + VISION</span></div>
    <span class="art-caption">${t('FROM MULTIMODAL CUES TO HUMAN CONNECTION','从多模态线索，到有意义的交流')}</span>
  </div></section>
  <section class="score-guide" aria-label="${t('What S and Q measure','S 与 Q 的含义')}">
    <article class="score-definition score-definition-s"><span class="score-symbol" aria-hidden="true">S</span><div><h2>${t('S · Intent fulfillment','S · 意图满足程度')}</h2><span class="score-perspective">${t('Process-oriented · Evidence perspective','过程导向 · 证据视角')}</span><p>${t('How well does the response address the user’s implicit needs? Scores for applicable auditory and visual cue dimensions are combined using fixed evidence-based weights for each input, then averaged across inputs.','衡量回应对用户隐含需求的满足程度。对适用的听觉与视觉线索维度分别评分，使用每条输入固定的证据权重加权汇总，再对所有输入取平均。')}</p></div></article>
    <article class="score-definition score-definition-q"><span class="score-symbol" aria-hidden="true">Q</span><div><h2>${t('Q · Response quality','Q · 回应质量')}</h2><span class="score-perspective">${t('Outcome-oriented · Modality perspective','结果导向 · 模态视角')}</span><p>${t('How natural, appropriate, and human-like is the response? Each criterion is rated under audio-only, visual-only, and audiovisual observation. The nine scores are averaged within each response, then across inputs.','衡量回应的自然度、合适度和拟人度。在纯音频、纯视觉和音画联合三种观察条件下分别评分，先对每条回应的九项分数取平均，再对所有输入取平均。')}</p></div></article>
    <p class="score-guide-note">${t('Both scores range from −3 to +3; higher is better. S and Q are reported separately.','两项分数均为 −3 至 +3，越高越好；S 与 Q 分别报告。')}</p>
  </section>`;
}
function medal(rank, ceremonial) {
  if (rank == null) return `<span class="medal medal-na" aria-hidden="true">—</span>`;
  const tier = ceremonial && rank === 1 ? 'gold' : ceremonial && rank === 2 ? 'silver' : ceremonial && rank === 3 ? 'bronze' : '';
  return `<span class="medal ${tier}" aria-hidden="true">${rank}</span>`;
}
function rankColumn(kind, title, subtitle, rows, barMax, ceremonial) {
  return `<section class="rank-column rank-${kind}" aria-label="${esc(title)}"><h3>${title} <span aria-hidden="true">${kind === 'time' ? '↑' : '↓'}</span></h3><p>${subtitle}</p><ol>${rows.map(({ system: s, rank, value }) => {
    const width = value == null || !barMax ? 0 : Math.max(8, Math.round(Math.abs(value) / barMax * 100));
    const label = value == null ? t('n/a','未测') : kind === 'time' ? `${formatNumber(value)} s` : `${kind === 's' ? 'S' : 'Q'} ${formatNumber(value)}`;
    return `<li class="${rank && rank <= 3 && ceremonial ? 'podium' : ''} ${value < 0 ? 'negative' : ''}"><button class="rank-open" data-model="${s.id}"><span class="sr-only">${rank == null ? t('Not measured','未测') : `${t('Rank','名次')} ${rank}`}</span>${medal(rank, ceremonial)}<span class="rank-id"><i class="source-dot ${s.type}"></i><strong>${s.name}</strong></span><b>${label}</b><span class="rank-bar" aria-hidden="true"><span style="width:${width}%"></span></span></button></li>`;
  }).join('')}</ol></section>`;
}
function rankBoard() {
  const sRows = sRank();
  const qRows = qRank();
  const tRows = timeRank();
  const sMax = Math.max(...sRows.map(row => row.value));
  const qMax = Math.max(...qRows.map(row => row.value));
  const tMax = Math.max(...tRows.map(row => row.value).filter(value => value != null));
  return `<section class="rank-board" aria-labelledby="rank-board-title"><div class="rank-board-head"><h2 id="rank-board-title">${t('Leaderboard','排行榜')}</h2><div class="source-legend"><span><i class="source-dot closed"></i>${t('Closed-source','闭源')}</span><span><i class="source-dot open"></i>${t('Open-source','开源')}</span></div></div><div class="rank-columns">
    ${rankColumn('s', t('S ranking','S 排名'), t('Higher is better','越高越好'), sRows, sMax, true)}
    ${rankColumn('q', t('Q ranking','Q 排名'), t('Higher is better','越高越好'), qRows, qMax, true)}
    ${rankColumn('time', t('Avg. response time','平均响应时间'), t('Fastest first','最快优先'), tRows, tMax, true)}
  </div><p class="rank-note">${icon('info',15)}<span>${t('S and Q are JEV 1.14.0 means on 216 paired inputs, shown to two decimals. Average response times follow the benchmark leaderboard and are ranked fastest first.','S 和 Q 是 JEV 1.14.0 在 216 条成对输入上的均值，页面显示两位小数。平均响应时间与基准榜单一致，按耗时从短到长排列。')}</span></p></section>`;
}
function leaderboard() {
  return `${hero()}${rankBoard()}<section class="leaderboard-section" aria-labelledby="leaderboard-title"><div class="section-heading"><div><div class="eyebrow">01 / ${t('THE NUMBERS','分数明细')}</div><h2 id="leaderboard-title">${t('Full results','完整结果')}<span class="count-pill">9 ${t('systems','个系统')}</span></h2><p>${t('Same 216 inputs. Modality scores, primitive scores, and the two summary means.','同一组 216 条输入。模态分、原语分，以及两项汇总均值。')}</p></div><button class="button button-outline" data-action="export">${icon('download',16)}${t('Export table','导出表格')}</button></div>
  <div class="leaderboard-panel"><div class="metric-tabs" role="tablist" aria-label="${t('Metric view','指标视图')}">${[['overview','Overview','概览'],['quality','Response quality · Q','回应质量 · Q'],['evidence','Intent evidence · S','意图证据 · S']].map(([v,en,zh])=>`<button role="tab" aria-selected="${state.metric===v}" class="${state.metric===v?'active':''}" data-metric="${v}">${t(en,zh)}</button>`).join('')}<button class="metric-help" data-action="metrics" aria-label="${t('About these metrics','指标说明')}">${icon('info',17)}</button></div>
    <div class="table-toolbar"><div class="filter-group" aria-label="${t('Filter systems','筛选系统')}">${[['all','All systems','全部',9],['closed','Closed','闭源',5],['open','Open','开源',4]].map(([v,en,zh,n])=>`<button data-filter="${v}" aria-pressed="${state.filter===v}" class="${state.filter===v?'active':''}">${t(en,zh)}<span>${n}</span></button>`).join('')}</div><div class="table-controls"><label class="search-box">${icon('search',16)}<input id="model-search" type="search" value="${esc(state.search)}" placeholder="${t('Find a system…','搜索系统…')}" aria-label="${t('Find a system','搜索系统')}"></label></div></div>
    <div id="table-container" role="tabpanel">${table()}</div>
    <div class="table-footer"><span id="row-count">${tableCount()}</span><span><a href="#cases">${t('Watch real response examples','观看真实回应案例')}</a></span></div>
  </div><div class="table-notes"><span>${t('Q and S: n = 216 on every system','Q 与 S：每个系统 n = 216')}</span><span>${t('Primitive n: A1–A4, V1–V4 = 209, 203, 214, 20, 95, 214, 132, 132','原语有效数：A1–A4、V1–V4 = 209、203、214、20、95、214、132、132')}</span><span>${t('Sorted by the summary score, not by name','按汇总分排序，不按名称')}</span></div>
  </section>
  <section class="bottom-feature"><div class="feature-symbol">${icon('compare',35)}</div><div><div class="eyebrow">${t('BEYOND THE NUMBERS','在分数之外')}</div><h3>${t('Three moments. Three ways to respond.','三个语境，三种回应。')}</h3><p>${t('Watch real user clips and responses from Emma, Tavus, and Vidu. Explore what was said—and what was meant.','观看真人输入与 Emma、Tavus、Vidu 的实际回应，了解字面表达与言外之意。')}</p></div><a href="#cases" class="button button-outline">${t('Explore the cases','查看案例')} ${icon('arrow',17)}</a></section>`;
}
function sortValue(s) { return state.metric === 'evidence' ? result(s).S : result(s).Qmean; }
function filtered() {
  return systems.filter(s => (state.filter==='all'||s.type===state.filter) && `${s.name} ${s.variant}`.toLowerCase().includes(state.search.toLowerCase()))
    .sort((a, b) => sortValue(b) - sortValue(a) || a.name.localeCompare(b.name));
}
function tableCount() {return t(`Showing ${filtered().length} of 9 systems`, `显示 ${filtered().length} / 9 个系统`);}
function cellValue(s, id) {
  const r = result(s);
  if (id === 'S') return r.S;
  if (id === 'Qmean') return r.Qmean;
  if (id === 'latency') return r.latency;
  return state.metric === 'evidence' ? r.evidence[id] : r.Q[id];
}
function table() {
  const cols = state.metric === 'overview'
    ? [['Qmean', t('Quality mean','质量均值'), 'Q'], ['S', t('Intent score','意图得分'), 'S'], ['latency', t('Response time','响应时间'), 's']]
    : state.metric === 'quality'
      ? [['Qmean', t('Mean','均值'), 'Q'], ...qualityMetrics.map(([id,en,zh])=>[id, t(en,zh).split(' · ')[1], t(en,zh).split(' · ')[0]])]
      : [['S', t('Weighted score','加权综合'), 'S'], ...evidenceMetrics.map(([id,en,zh])=>[id, t(en,zh), `${id} · n=${evidenceN[id]}`])];
  const ranks = state.metric === 'evidence' ? sRank() : qRank();
  const best = Object.fromEntries(cols.map(([id]) => {
    if (id === 'latency') return [id, null];
    const values = systems.map(s => cellValue(s, id)).filter(value => value != null);
    return [id, values.length ? Math.max(...values) : null];
  }));
  const sortLabel = state.metric === 'evidence' ? 'S ↓' : 'Q ↓';
  return `<div class="table-scroll" tabindex="0" aria-label="${t('System results table; scroll horizontally for more metrics','系统结果表，可横向滚动查看全部指标')}"><table><thead><tr><th class="rank-col">${t('Rank','名次')}</th><th class="system-col">${t('System','系统')} <span class="sort-label">${sortLabel}</span></th><th class="type-col">${t('Access','类别')}</th>${cols.map(([id,label,category])=>`<th class="score-col ${id==='S'||id==='Qmean'?'s-column':''}" title="${esc(label)}"><span>${category}</span>${label}</th>`).join('')}<th class="valid-col"><span>${t('Valid','有效')}</span>n</th><th class="details-col"><span class="sr-only">${t('Details','详情')}</span></th></tr></thead><tbody>
    ${filtered().map(s=>`<tr><td class="rank-col">${rankOf(ranks, s.id)}</td><td class="system-col"><button class="model-button" data-model="${s.id}">${mark(s)}<span><strong>${s.name}</strong><small>${s.variant}</small></span></button></td><td><span class="type-pill ${s.type}">${s.type==='open'?icon('code',12):icon('lock',11)}${group(s)}</span></td>${cols.map(([id])=>{const value=cellValue(s,id);const bestCell=value!=null&&value===best[id]?' best':'';const text=id==='latency'&&value!=null?`${score(value)} s`:score(value);return `<td class="number${id==='S'||id==='Qmean'?' s-column':''}${bestCell}">${text}</td>`;}).join('')}<td class="number">${score(result(s).valid_n, 0)}</td><td><button class="icon-button" data-model="${s.id}" aria-label="${s.name} ${t('details','详情')}">${icon('external',16)}</button></td></tr>`).join('')}
    ${filtered().length?'':`<tr><td colspan="${cols.length+5}" class="empty-state">${icon('search',26)}<strong>${t('No matching systems','没有匹配的系统')}</strong><p>${t('Try a different name or reset the filters.','请尝试其他名称，或重置筛选条件。')}</p><button class="button button-outline" data-action="reset">${t('Reset filters','重置筛选')}</button></td></tr>`}
  </tbody></table></div>`;
}
function caseVideo(media, label) {
  return `<div class="case-video"><video controls playsinline preload="none" poster="${esc(media.poster)}" aria-label="${esc(label)}"><source src="${esc(media.video)}" type="video/mp4"><a href="${esc(media.video)}">${t('Download video','下载视频')}</a></video></div>`;
}
function caseStudies() {
  return `<section class="inner-heading cases-heading"><div class="eyebrow">02 / ${t('REAL CONVERSATIONS','真实对话案例')}</div><h1>${t('What is said.<br><em>What is meant.</em>','说出的话，<br><em>未说出的意图。</em>')}</h1><p>${t('Three user clips. Responses from Emma, Tavus, and Vidu. Watch how each system responds to the intent beneath the words.','三个真人片段，Emma、Tavus 和 Vidu 的实际回应。观察不同系统如何回应字面表达背后的意图。')}</p></section>
  <div class="case-studies">${cases.map((c,i)=>`<section class="case-study" id="case-${c.id}" aria-labelledby="title-${c.id}"><header class="case-heading"><span class="case-number">0${i+1}</span><div><div class="eyebrow">${t('CASE STUDY','案例展示')} · ${t('CLIP','片段')} ${Number(c.id)}</div><h2 id="title-${c.id}">${esc(t(...c.title))}</h2></div></header>
    <div class="human-case"><div class="human-media"><h3>${icon('video',17)}${t('Human input','真人输入')}</h3>${caseVideo(c.human,t('Human input','真人输入')+' · '+c.id)}</div><div class="human-context"><div><h4>${t('TRANSCRIPT','台词')}</h4><blockquote lang="en">${esc(c.human.transcript)}</blockquote></div><div class="unspoken-intent"><h4>${icon('spark',16)}Unspoken intent${t('',' · 隐含意图')}</h4><p>${esc(t(...c.intent))}</p></div></div></div>
    <div class="case-response-heading"><h3>${t('How the digital humans respond','数字人如何回应')}</h3><span>${t('Same input · Three responses','同一输入 · 三个回应')}</span></div>
    <div class="case-response-grid">${c.responses.map(r=>`<article class="case-response"><h3>${mark(systems.find(s=>s.name===r.name))}${r.name}</h3>${caseVideo(r,r.name+' · '+t('Clip','片段')+' '+Number(c.id))}<div class="case-response-copy"><h4>${t('TRANSCRIPT','台词')}</h4><blockquote lang="en">${esc(r.transcript)}</blockquote><div class="case-analysis"><h4>${t('RESPONSE ANALYSIS','回应分析')}</h4><p>${esc(t(...r.analysis))}</p></div></div></article>`).join('')}</div></section>`).join('')}</div>`;
}
function methodology() {
  const figures = [
    {
      id:'teaser', number:'01', label:'Figure 1', src:'./media/paper/teaser.webp', width:2200, height:946,
      title:['Fluent replies can miss the unspoken','流畅的回应，也可能错过言外之意'],
      description:['Two missed-intent examples appear beside the paper’s nine-system leaderboard for intent fulfillment, response quality, and response time.','两个未能理解隐含意图的例子，与论文中九个系统的意图满足、回应质量和响应时间榜单并列展示。'],
      alt:['Paper Figure 1: two examples of missed implicit intent and the UUBench leaderboard.','论文图 1：两个错过隐含意图的示例及 UUBench 榜单。']
    },
    {
      id:'method', number:'02', label:'Figure 2', src:'./media/paper/method.webp', width:1800, height:1435,
      title:['From a user clip to an evaluation','从真人输入到回应评测'],
      description:['The method connects a human–avatar interaction, annotated intent and observable cues, response quality, primitive-level judgments, and evidence-based aggregation.','方法图将人机交互、人工标注的意图与可观察线索、回应质量、各线索维度的评分，以及基于证据的加权汇总连接起来。'],
      alt:['Paper Figure 2: UUBench interaction, data annotation, and multimodal response evaluation pipeline.','论文图 2：UUBench 的交互、数据标注和多模态回应评测流程。']
    },
    {
      id:'examples', number:'03', label:'Figure 3', src:'./media/paper/annotation.webp', width:1400, height:1316,
      title:['User clips and digital human replies','真人片段与数字人回应示例'],
      description:['Three examples pair sampled video frames with the spoken words from the user and the responding digital human.','三个案例将真人与数字人视频的抽帧画面和双方台词放在一起，展示论文分析的实际交互。'],
      alt:['Paper Figure 3: three user clips and corresponding digital human responses, shown with frames and transcripts.','论文图 3：三组真人片段与数字人回应的画面及台词。']
    },
    {
      id:'jev', number:'04', label:'Figure 5', src:'./media/paper/jev.webp', width:2200, height:930,
      title:['Fact-Grounded Scoring JEV','基于事实的 JEV 评分模块'],
      description:['Timestamped audio and visual observations, reply measurements, and a seven-anchor rubric support one quality or primitive judgment at a time.','JEV 使用带时间戳的音视频观察、回应测量结果和七级评分准则，每次只判断一项质量标准或一个线索维度。'],
      alt:['Paper Figure 5: Fact-Grounded Scoring JEV module, from audiovisual facts and measurements to response judgments.','论文图 5：基于事实的 JEV 评分模块，从音视频事实和测量结果到回应评价。']
    }
  ];
  return `<section class="paper-hero">
    <div class="paper-hero-copy">
      <div class="eyebrow"><span class="tiny-line"></span>03 / ${t('THE PAPER','研究论文')}</div>
      <h1>UUBench:<br><em>Understanding the Unspoken</em></h1>
      <p class="paper-subtitle">toward Full-Duplex Multimodal Interaction</p>
      <p class="paper-intro">${t('The paper asks whether digital humans respond to the needs conveyed through speech, expression, gesture, and context—not just the literal words. These original figures show the benchmark, its annotation workflow, and the JEV scoring module.','论文探讨数字人能否回应由语音、表情、手势和语境传达的需求，而不只停留在字面内容。以下原图展示了评测基准、标注流程与 JEV 评分模块。')}</p>
      <div class="paper-actions"><a class="button button-primary" href="https://arxiv.org/abs/2611.30157" target="_blank" rel="noopener noreferrer">${icon('book',17)} ${t('Read on arXiv','在 arXiv 阅读')} ${icon('external',15)}</a><a class="button button-outline" href="https://arxiv.org/pdf/2611.30157" target="_blank" rel="noopener noreferrer">${t('Open PDF','打开 PDF')} ${icon('external',15)}</a></div>
    </div>
    <aside class="paper-meta" aria-label="${t('Paper details','论文信息')}"><span class="paper-meta-kicker">arXiv:2611.30157</span><strong>Ye Pan et al.</strong><span>${t('v0.1 Preview · November 2026','v0.1 预览版 · 2026 年 11 月')}</span><span>${t('49 pages · Figures and appendix','49 页 · 含配图与附录')}</span></aside>
  </section>
  <nav class="paper-outline" aria-label="${t('Figures on this page','本页配图')}"><span>${t('EXPLORE THE FIGURES','浏览论文配图')}</span><div>${figures.map(f=>`<button type="button" data-paper-target="paper-${f.id}"><b>${f.label}</b>${esc(t(...f.title))}</button>`).join('')}</div></nav>
  <div class="paper-gallery">${figures.map(f=>`<figure class="paper-figure" id="paper-${f.id}">
    <div class="paper-figure-heading"><div><div class="eyebrow">${f.label.toUpperCase()} / ${t('FROM THE PAPER','论文原图')}</div><h2>${esc(t(...f.title))}</h2></div><span class="paper-figure-number">${f.number}</span></div>
    <a class="paper-image-link" href="${f.src}" target="_blank" rel="noopener noreferrer" aria-label="${t('Open full-size','查看高清原图')} · ${f.label}"><img src="${f.src}" width="${f.width}" height="${f.height}" loading="lazy" decoding="async" alt="${esc(t(...f.alt))}"><span>${icon('external',14)} ${t('Open full size','查看高清原图')}</span></a>
    <figcaption><strong>${f.label}.</strong> ${esc(t(...f.description))}</figcaption>
  </figure>`).join('')}</div>
  <section class="paper-end"><div><span class="eyebrow">${t('THE COMPLETE PAPER','完整论文')}</span><h2>${t('Read the methods, results, and appendices.','查看完整方法、结果与附录。')}</h2><p>${t('The figures above are rendered from the files included in the arXiv submission. The full manuscript contains the scoring definitions, experiments, worked examples, and limitations.','本页配图由 arXiv 投稿源文件中的原图转换而来。完整论文包含评分定义、实验、详细案例与局限性。')}</p></div><a class="button button-primary" href="https://arxiv.org/abs/2611.30157" target="_blank" rel="noopener noreferrer">${t('View paper on arXiv','查看 arXiv 论文')} ${icon('external',16)}</a></section>`;
}
function render() {
  document.documentElement.lang=state.lang==='en'?'en':'zh-CN';
  document.title=`UUBench — ${state.view==='cases'?t('Case Studies','案例展示'):state.view==='methodology'?t('Research Paper','研究论文'):t('Understanding the Unspoken','理解未说出口的意图')}`;
  $('#app').innerHTML=`${header()}<main id="main" class="page-container">${state.view==='leaderboard'?leaderboard():state.view==='cases'?caseStudies():methodology()}</main>${footer()}`;
  bind();
}
function renderTable() {$('#table-container').innerHTML=table();$('#row-count').textContent=tableCount();}
function notify(message) {clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4200);}
function showDialog(title, body) {
  const d=$('#detail-dialog');
  d.innerHTML=`<div class="dialog-header"><h2 id="dialog-title">${title}</h2><button class="icon-button" id="close-dialog" aria-label="${t('Close','关闭')}">${icon('close',20)}</button></div>${body}`;
  $('#close-dialog').onclick=()=>d.close();
  if(!d.open)d.showModal();
  d.onclick=e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}};
}
function showModel(id) {
  const s=systems.find(s=>s.id===id);
  const q = rankOf(qRank(), id);
  const sv = rankOf(sRank(), id);
  const latency = result(s).latency;
  showDialog(s.name,`<div class="model-dialog-intro">${mark(s)}<div><strong>${s.variant}</strong><span class="type-pill ${s.type}">${group(s)}</span></div></div><div class="dialog-status posted"><span class="status-dot live"></span>JEV 1.14.0 · n = ${sampleN}</div><dl><dt>Q</dt><dd>${score(result(s).Qmean)} · ${t('rank','名次')} ${q}/9</dd><dt>S</dt><dd>${score(result(s).S)} · ${t('rank','名次')} ${sv}/9</dd><dt>${t('Response time','响应时间')}</dt><dd>${latency==null?dash():`${score(latency)} s`}</dd><dt>${t('Configuration','配置')}</dt><dd>${s.type==='open'?t('Offline composite · shared Qwen3-Omni response, avatar backend ','离线组合 · 共享 Qwen3-Omni 回应，数字人后端 ')+s.variant:t('Commercial product configuration','商业产品配置')}</dd></dl><p class="dialog-note">${t(...s.latencyNote)}</p>${['emma','tavus','vidu'].includes(id)?`<button class="button button-primary" id="dialog-cases">${t('View case studies','查看案例')} ${icon('arrow',16)}</button>`:''}`);
  const casesButton=$('#dialog-cases');if(casesButton)casesButton.onclick=()=>{$('#detail-dialog').close();navigate('cases');};
}
function navigate(view) {if(location.hash==='#'+view){state.view=view;render();window.scrollTo(0,0);}else location.hash=view;}
function exportCSV() {
  const fields=['system','configuration','access','Q','S','response_time_s','valid_n',...qualityMetrics.map(m=>m[0]),...evidenceMetrics.map(m=>m[0])];
  const rows=filtered().map(s=>[s.name,s.variant,s.type,result(s).Qmean,result(s).S,result(s).latency,result(s).valid_n,...qualityMetrics.map(([id])=>result(s).Q[id]),...evidenceMetrics.map(([id])=>result(s).evidence[id])]);
  const csv=[fields,...rows].map(row=>row.map(value=>value===null?'':`"${String(value).replaceAll('"','""')}"`).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=`uubench-jev-${state.filter}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  notify(t('Exported the current table. Empty cells were not measured.','已导出当前表格。空单元格表示未测。'));
}
function bind() {
  const search=$('#model-search');if(search)search.oninput=e=>{state.search=e.target.value;renderTable();};
}
$('#app').addEventListener('play',e=>{
  if(e.target.tagName==='VIDEO')document.querySelectorAll('video').forEach(v=>{if(v!==e.target)v.pause();});
},true);
$('#app').addEventListener('click',e=>{
  const el=e.target.closest('button');if(!el)return;
  if(el.dataset.paperTarget){document.getElementById(el.dataset.paperTarget)?.scrollIntoView({behavior:'smooth',block:'start'});return;}
  if(el.dataset.filter){state.filter=el.dataset.filter;render();return;}
  if(el.dataset.metric){state.metric=el.dataset.metric;render();return;}
  if(el.dataset.model){showModel(el.dataset.model);return;}
  switch(el.dataset.action){
    case 'language':state.lang=state.lang==='en'?'zh':'en';render();break;
    case 'reset':state.search='';state.filter='all';render();break;
    case 'export':exportCSV();break;
    case 'metrics':showDialog(t('Reading the scores','分数说明'),`<div class="metric-explainer"><strong>S · ${t('Intent evidence','意图证据')}</strong><p>${t('Eight cue scores and one evidence-weighted mean. Scale −3 to +3. Primitive means use applicable inputs only; their denominators are 209, 203, 214, 20, 95, 214, 132 and 132.','八项线索分与一项证据加权均值。量表 −3 至 +3。原语均值只统计适用输入，分母依次为 209、203、214、20、95、214、132、132。')}</p><strong>Q · ${t('Response quality','回应质量')}</strong><p>${t('Three modalities × three criteria. Each input’s Q is the unweighted mean of the nine scores; the board averages those 216 values. Scale −3 to +3.','三种模态 × 三项准则。每条输入的 Q 是九项分数的等权均值，榜上再对这 216 个值取平均。量表 −3 至 +3。')}</p><strong>t · ${t('Response time','响应时间')}</strong><p>${t('Not one shared clock. A dash means the timestamp was not measured. A negative value means the logged event started before the input ended.','不是同一把时钟。横线表示没有测到时间戳。负值表示记录到的事件早于输入结束。')}</p></div>`);break;
  }
});
window.addEventListener('hashchange',()=>{state.view=route();render();window.scrollTo({top:0,behavior:'instant'});});
render();
