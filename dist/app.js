import { systems, qualityMetrics, evidenceMetrics, scenarios, evidenceN, sampleN } from './data.js?v=20261123';

const state = {
  lang: 'en', view: ['arena', 'methodology'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'leaderboard',
  filter: 'all', search: '', metric: 'overview', selected: [],
  left: 'tavus', right: 'openavatar', scenario: 0, blind: false, vote: null
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
      ${[['leaderboard','Leaderboard','排行榜'],['arena','Arena','擂台'],['methodology','Benchmark','评测方法']].map(([id,en,zh]) => `<a href="#${id}" ${state.view===id?'aria-current="page"':''}>${t(en,zh)}${id==='arena'?'<span class="nav-tag">BETA</span>':''}</a>`).join('')}
    </nav>
    <div class="nav-actions"><button class="language-button" data-action="language" aria-label="${t('切换到中文','Switch to English')}">${t('EN <span>/ 中文</span>','中文 <span>/ EN</span>')}</button><button class="button button-small button-outline paper-button" data-action="paper">${icon('book',15)} ${t('Paper','论文')} <span class="soon">${t('Soon','待发布')}</span></button></div>
  </div></header>`;
}
function footer() {
  return `<footer class="site-footer"><div><a class="footer-brand" href="#leaderboard">UUBench<span>.</span></a><p>${t('Beyond what is said. Toward what is meant.','从说出的话，走向未说出的意图。')}</p></div><div class="footer-right"><span class="status-dot live"></span>${t('JEV 1.14.0 · 216 paired inputs','JEV 1.14.0 · 216 条成对输入')}<a href="#methodology">${t('Evaluation protocol','评测协议')} ${icon('external',14)}</a></div></footer>`;
}
function hero() {
  return `<section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="tiny-line"></span>${t('THE DIGITAL HUMAN BENCHMARK','数字人隐式意图回应评测')}</div>
    <h1>${t('Understanding<br>the <em>unspoken.</em>','理解那些<br><em>未说出口的意图。</em>')}</h1>
    <p>${t('Can digital humans read between the lines?<br>Evaluating how they hear, see, and respond to implicit intent.','数字人能否听懂弦外之音？<br>从声音、画面与实际回应，评估对隐式意图的理解。')}</p>
    <div class="hero-actions"><a class="button button-primary" href="#arena">${icon('compare')} ${t('Enter the arena','进入擂台')} ${icon('arrow',16)}</a><a class="text-link" href="#methodology">${t('Explore the benchmark','了解评测基准')} ${icon('external',16)}</a></div>
  </div><div class="hero-art" aria-label="${t('Audio and visual cues inform implicit intent and a digital human response.','声音和视觉线索共同支持隐式意图与数字人回应。')}">
    <div class="art-grid"></div><div class="orbit orbit-outer"></div><div class="orbit orbit-inner"></div>
    <svg class="signal-lines" viewBox="0 0 520 300" aria-hidden="true"><path d="M92 82C180 82 170 147 250 147S340 79 431 79M96 231C175 231 173 151 250 151S346 222 434 222"/><path class="signal-dash" d="M92 82C180 82 170 147 250 147S340 79 431 79M96 231C175 231 173 151 250 151S346 222 434 222"/></svg>
    <div class="signal-node node-audio">${icon('audio',22)}<div><small>${t('AUDIO CUES','声音线索')}</small><strong>${t('Hear the nuance','听见弦外之音')}</strong></div><span class="mini-wave">▂▅▃▇▅▂</span></div>
    <div class="signal-node node-visual">${icon('eye',22)}<div><small>${t('VISUAL CUES','视觉线索')}</small><strong>${t('See the context','看见语境')}</strong></div><span class="focus-box"></span></div>
    <div class="intent-core"><span class="core-star">✳</span><span>${t('IMPLICIT<br>INTENT','隐式<br>意图')}</span></div>
    <div class="signal-output">${icon('spark',22)}<strong>${t('A meaningful<br>response.','恰如其分<br>的回应。')}</strong><span>VOICE + VISION</span></div>
    <span class="art-caption">${t('FROM MULTIMODAL CUES TO HUMAN CONNECTION','从多模态线索，到有意义的交流')}</span>
  </div></section>
  <div class="stats-strip"><div><strong>09</strong><span>${t('Systems evaluated','参测系统')}</span></div><div><strong>05 <span>+ 04</span></strong><span>${t('Closed + open-source','闭源 + 开源')}</span></div><div><strong>216</strong><span>${t('Paired inputs per system','每系统成对输入')}</span></div><div><strong>18</strong><span>${t('Core metrics','核心评测指标')}</span></div><div class="stats-note"><span class="status-dot live"></span><div>${t('JEV 1.14.0 means are posted.','已发布 JEV 1.14.0 均值。')}<small>${t('Scale −3 to +3. Higher is better.','量表 −3 至 +3，越高越好。')}</small></div></div></div>`;
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
    ${rankColumn('time', t('Avg. response time','平均响应时间'), t('Own clock · earlier first','各自口径 · 越早越前'), tRows, tMax, false)}
  </div><p class="rank-note">${icon('info',15)}<span>${t('S and Q are JEV 1.14.0 means on 216 paired inputs, shown to two decimals. Response times do not share one clock: product logs record a first event, and open-source entries add offline Qwen and render time. bitHuman has no aligned timestamp. A negative time means the logged event began before the input ended.','S 和 Q 是 JEV 1.14.0 在 216 条成对输入上的均值，页面显示两位小数。响应时间不是同一把尺子：产品日志记的是首次事件，开源条目是 Qwen 请求与渲染的离线耗时相加。bitHuman 没有可对齐的时间戳。负值表示记录到的事件早于输入结束。')}</span></p></section>`;
}
function leaderboard() {
  return `${hero()}${rankBoard()}<section class="leaderboard-section" aria-labelledby="leaderboard-title"><div class="section-heading"><div><div class="eyebrow">01 / ${t('THE NUMBERS','分数明细')}</div><h2 id="leaderboard-title">${t('Full results','完整结果')}<span class="count-pill">9 ${t('systems','个系统')}</span></h2><p>${t('Same 216 inputs. Modality scores, primitive scores, and the two summary means.','同一组 216 条输入。模态分、原语分，以及两项汇总均值。')}</p></div><button class="button button-outline" data-action="export">${icon('download',16)}${t('Export table','导出表格')}</button></div>
  <div class="leaderboard-panel"><div class="metric-tabs" role="tablist" aria-label="${t('Metric view','指标视图')}">${[['overview','Overview','概览'],['quality','Response quality · Q','回应质量 · Q'],['evidence','Intent evidence · S','意图证据 · S']].map(([v,en,zh])=>`<button role="tab" aria-selected="${state.metric===v}" class="${state.metric===v?'active':''}" data-metric="${v}">${t(en,zh)}</button>`).join('')}<button class="metric-help" data-action="metrics" aria-label="${t('About these metrics','指标说明')}">${icon('info',17)}</button></div>
    <div class="table-toolbar"><div class="filter-group" aria-label="${t('Filter systems','筛选系统')}">${[['all','All systems','全部',9],['closed','Closed','闭源',5],['open','Open','开源',4]].map(([v,en,zh,n])=>`<button data-filter="${v}" aria-pressed="${state.filter===v}" class="${state.filter===v?'active':''}">${t(en,zh)}<span>${n}</span></button>`).join('')}</div><div class="table-controls"><label class="search-box">${icon('search',16)}<input id="model-search" type="search" value="${esc(state.search)}" placeholder="${t('Find a system…','搜索系统…')}" aria-label="${t('Find a system','搜索系统')}"></label></div></div>
    <div id="table-container" role="tabpanel">${table()}</div>
    <div class="table-footer"><span id="row-count">${tableCount()}</span><span>${icon('compare',14)}${t('Select two systems to compare','选择两个系统进行对比')}</span></div>
  </div><div class="table-notes"><span>${t('Q and S: n = 216 on every system','Q 与 S：每个系统 n = 216')}</span><span>${t('Primitive n: A1–A4, V1–V4 = 209, 203, 214, 20, 95, 214, 132, 132','原语有效数：A1–A4、V1–V4 = 209、203、214、20、95、214、132、132')}</span><span>${t('Sorted by the summary score, not by name','按汇总分排序，不按名称')}</span></div>
  </section>
  <section class="bottom-feature"><div class="feature-symbol">${icon('compare',35)}</div><div><div class="eyebrow">${t('BEYOND THE NUMBERS','在分数之外')}</div><h3>${t('Same context. Two different responses.','同一语境，两种回应。')}</h3><p>${t('Step into the arena to explore side-by-side comparison and the cues behind each response.','进入双模型擂台，并排观察回应，以及回应背后的意图线索。')}</p></div><a href="#arena" class="button button-outline">${t('Explore the arena','探索擂台')} ${icon('arrow',17)}</a></section>
  <div id="compare-tray">${compareTray()}</div>`;
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
  return `<div class="table-scroll" tabindex="0" aria-label="${t('System results table; scroll horizontally for more metrics','系统结果表，可横向滚动查看全部指标')}"><table><thead><tr><th class="check-col"><span class="sr-only">${t('Select','选择')}</span></th><th class="rank-col">${t('Rank','名次')}</th><th class="system-col">${t('System','系统')} <span class="sort-label">${sortLabel}</span></th><th class="type-col">${t('Access','类别')}</th>${cols.map(([id,label,category])=>`<th class="score-col ${id==='S'||id==='Qmean'?'s-column':''}" title="${esc(label)}"><span>${category}</span>${label}</th>`).join('')}<th class="valid-col"><span>${t('Valid','有效')}</span>n</th><th class="details-col"><span class="sr-only">${t('Details','详情')}</span></th></tr></thead><tbody>
    ${filtered().map(s=>`<tr><td class="check-col"><input type="checkbox" data-select="${s.id}" ${state.selected.includes(s.id)?'checked':''} aria-label="${t('Compare','对比')} ${s.name}"></td><td class="rank-col">${rankOf(ranks, s.id)}</td><td class="system-col"><button class="model-button" data-model="${s.id}">${mark(s)}<span><strong>${s.name}</strong><small>${s.variant}</small></span></button></td><td><span class="type-pill ${s.type}">${s.type==='open'?icon('code',12):icon('lock',11)}${group(s)}</span></td>${cols.map(([id])=>{const value=cellValue(s,id);const bestCell=value!=null&&value===best[id]?' best':'';const text=id==='latency'&&value!=null?`${score(value)} s`:score(value);return `<td class="number${id==='S'||id==='Qmean'?' s-column':''}${bestCell}">${text}</td>`;}).join('')}<td class="number">${score(result(s).valid_n, 0)}</td><td><button class="icon-button" data-model="${s.id}" aria-label="${s.name} ${t('details','详情')}">${icon('external',16)}</button></td></tr>`).join('')}
    ${filtered().length?'':`<tr><td colspan="${cols.length+6}" class="empty-state">${icon('search',26)}<strong>${t('No matching systems','没有匹配的系统')}</strong><p>${t('Try a different name or reset the filters.','请尝试其他名称，或重置筛选条件。')}</p><button class="button button-outline" data-action="reset">${t('Reset filters','重置筛选')}</button></td></tr>`}
  </tbody></table></div>`;
}
function compareTray() {
  if (!state.selected.length) return '';
  return `<div class="compare-tray"><span>${state.selected.length}/2 ${t('selected','已选')}</span><div>${state.selected.map(id=>`<button class="selected-chip" data-remove="${id}">${systems.find(s=>s.id===id).name} ${icon('close',13)}</button>`).join('')}</div><button class="button button-primary" data-action="compare" ${state.selected.length!==2?'disabled':''}>${t('Compare in arena','进入擂台对比')} ${icon('arrow',16)}</button><button class="icon-button" data-action="clear" aria-label="${t('Clear selection','清空选择')}">${icon('close')}</button></div>`;
}
function arena() {
  const scenario = scenarios[state.scenario];
  const left = systems.find(s => s.id === state.left);
  const right = systems.find(s => s.id === state.right);
  const pair = (pick, suffix = '') => {
    const show = system => { const value = pick(system); return value == null ? dash() : `${score(value)}${suffix}`; };
    return `<strong>${show(left)} <i>/</i> ${show(right)}</strong>`;
  };
  return `<section class="inner-heading"><div class="eyebrow">02 / ${t('HEAD TO HEAD','双模型对战')}</div><h1>${t('The digital human <em>arena.</em>','数字人<em>对战擂台。</em>')}</h1><p>${t('One moment. Two responses. Which one understands the intent?','同一个瞬间，两种回应。谁更懂用户的意图？')}</p></section>
  <div class="notice">${icon('info',17)}<p><strong>${t('Interaction preview.','交互预览。')}</strong> ${t('Scenarios are illustrative. Response videos are not attached yet. The scores below are the published JEV means.','场景为说明性示例。回应视频尚未接入。下方分数是已发布的 JEV 均值。')}</p><span class="notice-tag">DEMO</span></div>
  <section class="arena-panel"><div class="arena-toolbar"><div class="eyebrow">${t('SIDE-BY-SIDE COMPARISON','并排对比')}</div><div><label class="switch-label"><input id="blind-mode" type="checkbox" ${state.blind?'checked':''}><span class="switch"></span>${t('Blind mode','匿名模式')}</label><button class="button button-small button-outline" data-action="shuffle">${icon('shuffle',15)}${t('Random pair','随机配对')}</button></div></div>
    <div class="matchup"><div class="matchup-side"><span class="contender">A</span>${systemSelect('left')}</div><button data-action="swap" class="versus" aria-label="${t('Swap systems','交换系统')}">${icon('compare',18)}<span>VS</span></button><div class="matchup-side"><span class="contender contender-b">B</span>${systemSelect('right')}</div></div>
    <div class="scenario-panel"><div class="scenario-top"><span class="eyebrow">${icon('audio',16)}${t('THE USER CONTEXT','用户语境')}</span><label class="scenario-select"><span class="sr-only">${t('Illustrative scenario','示例场景')}</span><select id="scenario">${scenarios.map((s,i)=>`<option value="${i}" ${i===state.scenario?'selected':''}>${String(i+1).padStart(2,'0')} / ${t(...s.name)}</option>`).join('')}</select></label></div><blockquote>${t(...scenario.quote)}</blockquote><div class="cue-chips">${scenario.cues.map(c=>`<span><span class="cue-dot"></span>${t(...c)}</span>`).join('')}</div><p>${t(...scenario.intent)}</p><small class="illustration-label">${t('ILLUSTRATIVE SCENARIO · NOT A BENCHMARK SAMPLE','说明性场景 · 非真实评测样本')}</small></div>
    <div class="response-grid">${responseCard('left','A')}${responseCard('right','B')}</div>
    <div class="ballot"><div><h3>${t('Which response better understands the user?','哪一个回应更懂用户？')}</h3><p>${t('Try the ballot interaction. Demo choices stay in this tab and do not affect any scores.','可试用投票交互。演示选择仅保留在本标签页，不计入任何成绩。')}</p></div><div class="vote-buttons">${[['a',t('A is better','A 更好')],['tie',t('Tie','平局')],['b',t('B is better','B 更好')],['skip',t('Skip','跳过')]].map(([id,label])=>`<button class="button ${state.vote===id?'button-primary':'button-outline'}" data-vote="${id}" aria-pressed="${state.vote===id}">${state.vote===id?icon('check',15):''}${label}</button>`).join('')}</div><div class="vote-feedback" aria-live="polite">${state.vote?t('Demo selection recorded. No research vote was submitted.','已记录演示选择，未提交研究投票。'):t('Demo ballot · No model response media attached','演示投票 · 尚未接入模型回应媒体')}</div></div>
  </section>
  <section class="comparison-section"><div class="section-heading"><div><h2>${t('Under the same lens','同一尺度下的对比')}</h2><p>${t('JEV 1.14.0 means. Left is A, right is B.','JEV 1.14.0 均值。左为 A，右为 B。')}</p></div></div><div class="comparison-metrics">${[
    ['S', t('Intent response','意图回应'), '−3 → +3', pair(s => result(s).S)],
    ['Q', t('Quality mean','质量均值'), '−3 → +3', pair(s => result(s).Qmean)],
    ['t', t('Response time','响应时间'), t('own clock','各自口径'), pair(s => result(s).latency, ' s')]
  ].map(([id,label,range,value])=>`<div><span>${id}</span><div><h3>${label}</h3><p>${range}</p></div>${value}</div>`).join('')}</div><p class="protocol-note">${icon('info',16)}${t('Open-source entries use an offline composite pipeline with shared Qwen3-Omni responses. This setup is distinct from native end-to-end product evaluation.','开源条目采用共享 Qwen3-Omni 回应的离线组合流程，配置区别于原生端到端产品评测。')}</p></section>`;
}
function systemSelect(side) {
  const id=state[side], s=systems.find(s=>s.id===id);
  if(state.blind) return `<div class="blind-identity"><span class="model-mark blind-mark">?</span><div><strong>${t('Anonymous system','匿名系统')} ${side==='left'?'A':'B'}</strong><small>${t('Identity hidden for this preview','本次预览已隐藏身份')}</small></div></div>`;
  return `${mark(s)}<label class="system-select"><span class="sr-only">${t('System','系统')} ${side==='left'?'A':'B'}</span><select id="${side}-system">${systems.map(m=>`<option value="${m.id}" ${m.id===id?'selected':''} ${m.id===state[side==='left'?'right':'left']?'disabled':''}>${m.name}</option>`).join('')}</select><small>${group(s)} · ${s.type==='open'?t('Offline composite','离线组合'):t('Product configuration','产品配置')}</small></label>`;
}
function responseCard(side,letter) {
  const s=systems.find(s=>s.id===state[side]);
  return `<article class="response-card"><div class="response-top"><span>${t('RESPONSE','回应')} ${letter}</span><span class="pending-label"><span></span>${t('Awaiting media','等待媒体')}</span></div><div class="media-placeholder"><div class="media-corners"></div><div class="video-symbol">${icon('video',30)}</div><h3>${t('Response video','回应视频')}</h3><p>${t('A real response belongs here.','此处将展示真实的模型回应。')}<br>${t('Media will be added with the release.','媒体将在正式发布时接入。')}</p><span class="placeholder-line"></span></div><div class="response-bottom"><span>${state.blind?t('Anonymous system','匿名系统')+' '+letter:s.name}</span><small>${t('VIDEO + AUDIO','视频 + 音频')}</small></div></article>`;
}
function methodology() {
  return `<section class="inner-heading"><div class="eyebrow">03 / ${t('THE BENCHMARK','评测基准')}</div><h1>${t('More than a<br><em>convincing face.</em>','不止于<br><em>逼真的面孔。</em>')}</h1><p>${t('UUBench evaluates whether generated responses meet the needs expressed through words, voice, and visible behavior.','UUBench 评估数字人生成的回应，是否满足由话语、声音和可见行为所表达的需求。')}</p></section>
  <div class="method-intro"><span class="method-number">I → R</span><div><h2>${t('Understanding the Unspoken','理解未说出口的意图')}</h2><p>${t('Toward Full-Duplex Multimodal Interaction','面向全双工多模态交互')}</p><p>${t('The evaluation links user-side intent and evidence to the digital human’s actual audiovisual response. It measures response behavior, not hidden reasoning or intent classification accuracy.','评测将用户侧的意图与证据，连接到数字人实际生成的音视频回应；衡量的是回应行为，而非内部推理过程或意图分类准确率。')}</p></div></div>
  <section class="method-section"><div class="section-heading"><div><div class="eyebrow">${t('THE DATA','数据规模')}</div><h2>${t('A focused evaluation, a broader foundation.','聚焦评测，建立在更广泛的数据之上。')}</h2></div></div><div class="dataset-band"><div><strong>28,548</strong><span>${t('User audiovisual samples','用户音视频样本')}</span><small>TalkVerse · TalkCuts · SpeakVid · TalkVid</small></div><div class="dataset-arrow">${icon('arrow',26)}</div><div><strong>216</strong><span>${t('Stratified evaluation samples','分层抽样评测样本')}</span><small>UUBench-216</small></div><div><strong>9</strong><span>${t('Systems on this board','本榜参测系统')}</span><small>${t('5 closed-source · 4 open-source','5 个闭源 · 4 个开源')}</small></div></div></section>
  <section class="method-section"><div class="section-heading"><div><div class="eyebrow">${t('THE EVALUATION','评测框架')}</div><h2>${t('Two perspectives. Eighteen metrics.','两个视角，十八项指标。')}</h2></div></div><div class="method-grid"><article class="method-card"><div class="method-card-top"><span class="metric-letter">Q</span><span>01 / ${t('MODALITY PERSPECTIVE','模态视角')}</span></div><h3>${t('How does the response come across?','回应呈现得如何？')}</h3><p>${t('Evaluate naturalness, appropriateness, and human-likeness under three observation conditions: audio, visual, and audiovisual (Omni). The published Q is the mean of those nine scores on each input, then the mean across 216 inputs.','在音频、视觉与音画整体（Omni）三种观察条件下，分别评价自然度、合适度和拟人度。发布的 Q 是每条输入上九项分数的均值，再对 216 条取均值。')}</p><div class="quality-matrix"><span></span><span>${t('Natural','自然度')}</span><span>${t('Appropriate','合适度')}</span><span>${t('Human-like','拟人度')}</span>${['Audio','Visual','Omni'].map((m,i)=>`<strong>${t(m,['音频','视觉','音画'][i])}</strong><span>Q<sub>${i*3+1}</sub></span><span>Q<sub>${i*3+2}</sub></span><span>Q<sub>${i*3+3}</sub></span>`).join('')}</div><div class="method-card-bottom">9 ${t('independent metrics','项独立指标')}<strong>−3 → +3</strong></div></article><article class="method-card"><div class="method-card-top"><span class="metric-letter evidence-letter">S</span><span>02 / ${t('EVIDENCE PERSPECTIVE','证据视角')}</span></div><h3>${t('Does it meet the underlying need?','是否回应了深层需求？')}</h3><p>${t('Score how well the response addresses needs supported by eight cue dimensions. Combine them using frozen, source-side evidence weights. Published primitive means use applicable inputs only.','评价回应对八类线索所支持需求的满足程度，再使用固定的源侧证据权重进行聚合。发布的原语均值只统计适用输入。')}</p><div class="evidence-list">${evidenceMetrics.map(([id,en,zh])=>`<span><b>${id}</b>${t(en,zh)} <small>n=${evidenceN[id]}</small></span>`).join('')}</div><div class="method-card-bottom">8 ${t('dimensions','项维度')} + 1 ${t('weighted score','项加权综合分')}<strong>−3 → +3</strong></div></article></div></section>
  <section class="method-section principles"><div><div class="eyebrow">${t('READING THE RESULTS','如何解读结果')}</div><h2>${t('Context matters.<br>So does the protocol.','理解结果，<br>也要理解协议。')}</h2></div><div class="principle-list">${[
    [t('One published pass','一次已发布评分'),t('The board reports JEV 1.14.0 means. It is not an average of separate Ming and Qwen leaderboards.','本榜报告的是 JEV 1.14.0 的均值，不是 Ming 与 Qwen 两套榜的平均。')],
    [t('An empty value is not zero','空值不是零'),t('bitHuman has no aligned response timestamp, so its response time stays empty. Primitive means also omit inputs marked not applicable.','bitHuman 没有可对齐的响应时间戳，响应时间留空。原语均值也不把标为不适用的输入算成零分。')],
    [t('Record the actual configuration','记录实际配置'),t('The four open-source entries use offline composite pipelines with shared Qwen3-Omni replies and distinct avatar backends. Native end-to-end system capability is not established by these runs.','四个开源条目采用共享 Qwen3-Omni 回应与不同数字人后端的离线组合流程；本轮结果不代表已验证各系统原生端到端能力。')],
    [t('Evaluate the response, preserve the evidence','评价回应，保留证据'),t('Omni is evaluated directly, not computed as an audio–visual average. Q is the mean of nine per-input scores, not the mean of the nine column means. Evidence weights describe relevance, not causal importance.','Omni 独立评测，不由音频与视觉分数平均得到。Q 是每条输入九项分数的均值，不是九列均值再平均。证据权重描述相关性，不代表因果重要性。')]
  ].map(([title,text],i)=>`<article><span>0${i+1}</span><div><h3>${title}</h3><p>${text}</p></div></article>`).join('')}</div></section>
  <section class="release-note"><div>${icon('book',24)}<h3>${t('Research materials','研究资料')}</h3><p>${t('The leaderboard reports the current nine-system JEV 1.14.0 means. The paper, public dataset, and evaluation code are still pending release.','排行榜给出的是当前九系统的 JEV 1.14.0 均值。论文、公开数据集与评测代码仍待发布。')}</p></div><a class="button button-primary" href="#leaderboard">${t('Back to the leaderboard','返回排行榜')} ${icon('arrow',16)}</a></section>`;
}
function render() {
  document.documentElement.lang=state.lang==='en'?'en':'zh-CN';
  document.title=`UUBench — ${state.view==='arena'?t('Digital Human Arena','数字人擂台'):state.view==='methodology'?t('The Benchmark','评测基准'):t('Understanding the Unspoken','理解未说出口的意图')}`;
  $('#app').innerHTML=`${header()}<main id="main" class="page-container">${state.view==='leaderboard'?leaderboard():state.view==='arena'?arena():methodology()}</main>${footer()}`;
  bind();
}
function renderTable() {$('#table-container').innerHTML=table();$('#row-count').textContent=tableCount();$('#compare-tray').innerHTML=compareTray();}
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
  showDialog(s.name,`<div class="model-dialog-intro">${mark(s)}<div><strong>${s.variant}</strong><span class="type-pill ${s.type}">${group(s)}</span></div></div><div class="dialog-status posted"><span class="status-dot live"></span>JEV 1.14.0 · n = ${sampleN}</div><dl><dt>Q</dt><dd>${score(result(s).Qmean)} · ${t('rank','名次')} ${q}/9</dd><dt>S</dt><dd>${score(result(s).S)} · ${t('rank','名次')} ${sv}/9</dd><dt>${t('Response time','响应时间')}</dt><dd>${latency==null?dash():`${score(latency)} s`}</dd><dt>${t('Configuration','配置')}</dt><dd>${s.type==='open'?t('Offline composite · shared Qwen3-Omni response, avatar backend ','离线组合 · 共享 Qwen3-Omni 回应，数字人后端 ')+s.variant:t('Commercial product configuration','商业产品配置')}</dd></dl><p class="dialog-note">${t(...s.latencyNote)}</p><button class="button button-primary" id="dialog-compare">${t('Compare this system','对比此系统')} ${icon('arrow',16)}</button>`);
  $('#dialog-compare').onclick=()=>{state.left=id;if(state.right===id)state.right=systems.find(x=>x.id!==id).id;state.vote=null;$('#detail-dialog').close();navigate('arena');};
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
function resetVote() {state.vote=null;render();}
function bind() {
  const search=$('#model-search');if(search)search.oninput=e=>{state.search=e.target.value;renderTable();};
  for(const side of ['left','right']){const input=$(`#${side}-system`);if(input)input.onchange=e=>{state[side]=e.target.value;resetVote();};}
  const scenario=$('#scenario');if(scenario)scenario.onchange=e=>{state.scenario=Number(e.target.value);resetVote();};
  const blind=$('#blind-mode');if(blind)blind.onchange=e=>{state.blind=e.target.checked;resetVote();};
}
$('#app').addEventListener('change',e=>{
  const id=e.target.dataset.select;if(!id)return;
  if(e.target.checked){if(state.selected.length===2){e.target.checked=false;notify(t('Select up to two systems. Remove one to change the matchup.','最多选择两个系统；请先移除其中一个。'));return;}state.selected.push(id);}else state.selected=state.selected.filter(x=>x!==id);
  $('#compare-tray').innerHTML=compareTray();
});
$('#app').addEventListener('click',e=>{
  const el=e.target.closest('button');if(!el)return;
  if(el.dataset.filter){state.filter=el.dataset.filter;render();return;}
  if(el.dataset.metric){state.metric=el.dataset.metric;render();return;}
  if(el.dataset.model){showModel(el.dataset.model);return;}
  if(el.dataset.remove){state.selected=state.selected.filter(id=>id!==el.dataset.remove);renderTable();return;}
  if(el.dataset.vote){state.vote=el.dataset.vote;const pos=window.scrollY;render();window.scrollTo(0,pos);return;}
  switch(el.dataset.action){
    case 'language':state.lang=state.lang==='en'?'zh':'en';render();break;
    case 'reset':state.search='';state.filter='all';render();break;
    case 'clear':state.selected=[];renderTable();break;
    case 'compare':if(state.selected.length===2){[state.left,state.right]=state.selected;state.vote=null;navigate('arena');}break;
    case 'swap':[state.left,state.right]=[state.right,state.left];resetVote();break;
    case 'shuffle':{const a=Math.floor(Math.random()*systems.length);const others=systems.filter((_,i)=>i!==a);state.left=systems[a].id;state.right=others[Math.floor(Math.random()*others.length)].id;resetVote();break;}
    case 'export':exportCSV();break;
    case 'paper':showDialog(t('Paper · Coming soon','论文 · 待发布'),`<span class="dialog-kicker">UUBench</span><h3 class="paper-title">UUBench: Understanding the Unspoken toward Full-Duplex Multimodal Interaction</h3><p>${t('The manuscript and publication link are not yet released. The leaderboard already shows the JEV 1.14.0 means.','论文与公开链接尚未发布。排行榜已经给出 JEV 1.14.0 的均值。')}</p><button id="dialog-method" class="button button-primary">${t('Explore the benchmark','了解评测方法')} ${icon('arrow',16)}</button>`);$('#dialog-method').onclick=()=>{$('#detail-dialog').close();navigate('methodology');};break;
    case 'metrics':showDialog(t('Reading the scores','分数说明'),`<div class="metric-explainer"><strong>S · ${t('Intent evidence','意图证据')}</strong><p>${t('Eight cue scores and one evidence-weighted mean. Scale −3 to +3. Primitive means use applicable inputs only; their denominators are 209, 203, 214, 20, 95, 214, 132 and 132.','八项线索分与一项证据加权均值。量表 −3 至 +3。原语均值只统计适用输入，分母依次为 209、203、214、20、95、214、132、132。')}</p><strong>Q · ${t('Response quality','回应质量')}</strong><p>${t('Three modalities × three criteria. Each input’s Q is the unweighted mean of the nine scores; the board averages those 216 values. Scale −3 to +3.','三种模态 × 三项准则。每条输入的 Q 是九项分数的等权均值，榜上再对这 216 个值取平均。量表 −3 至 +3。')}</p><strong>t · ${t('Response time','响应时间')}</strong><p>${t('Not one shared clock. A dash means the timestamp was not measured. A negative value means the logged event started before the input ended.','不是同一把时钟。横线表示没有测到时间戳。负值表示记录到的事件早于输入结束。')}</p></div>`);break;
  }
});
window.addEventListener('hashchange',()=>{state.view=['arena','methodology'].includes(location.hash.slice(1))?location.hash.slice(1):'leaderboard';render();window.scrollTo({top:0,behavior:'instant'});});
render();
