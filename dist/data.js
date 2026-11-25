// JEV 1.14.0 means on 216 paired inputs. Qmean is the mean of per-input
// nine-item averages, not the average of the nine column means. Primitive
// means use applicable inputs only. Latency clocks differ by system.
// bitHuman, D-ID and Vidu response times corrected from the author-provided
// leaderboard figure on 2026-11-25; values are supplied to two decimals.

export const sampleN = 216;
export const evidenceN = { A1: 209, A2: 203, A3: 214, A4: 20, V1: 95, V2: 214, V3: 132, V4: 132 };
export const qualityMetrics = [
  ['audio_naturalness', 'Audio · Naturalness', '音频 · 自然度'],
  ['audio_appropriateness', 'Audio · Appropriateness', '音频 · 合适度'],
  ['audio_human_likeness', 'Audio · Human-likeness', '音频 · 拟人度'],
  ['visual_naturalness', 'Visual · Naturalness', '视觉 · 自然度'],
  ['visual_appropriateness', 'Visual · Appropriateness', '视觉 · 合适度'],
  ['visual_human_likeness', 'Visual · Human-likeness', '视觉 · 拟人度'],
  ['omni_naturalness', 'Omni · Naturalness', '音画整体 · 自然度'],
  ['omni_appropriateness', 'Omni · Appropriateness', '音画整体 · 合适度'],
  ['omni_human_likeness', 'Omni · Human-likeness', '音画整体 · 拟人度']
];
export const evidenceMetrics = [
  ['A1', 'Prosody', '韵律'], ['A2', 'Speaker emotion', '说话者情绪'],
  ['A3', 'Speech function', '话语功能'], ['A4', 'Nonverbal vocalizations', '非言语发声'],
  ['V1', 'Facial behavior', '面部行为'], ['V2', 'Gaze', '注视'],
  ['V3', 'Head movements', '头部动作'], ['V4', 'Arm & hand gestures', '手臂与手势']
];

const qIds = qualityMetrics.map(([id]) => id);
const eIds = evidenceMetrics.map(([id]) => id);
const scoreRow = (q, evidence, Qmean, S, latency) => ({
  Qmean, S, latency, valid_n: sampleN,
  Q: Object.fromEntries(qIds.map((id, i) => [id, q[i]])),
  evidence: Object.fromEntries(eIds.map((id, i) => [id, evidence[i]]))
});

const closedLatency = {
  emma: ['Input end to the first detected response sound. Thirty-nine clips already had reply text before the input ended, so this is not a full-turn onset.', '输入结束到首次超过阈值的声音。39 条在输入结束前已有回复文本，因此不是完整回合的起声。'],
  tavus: ['Input end to the first started-speaking event. Negative gaps stay in the mean. The event time is not a measured acoustic onset.', '输入结束到首个开始说话事件。负的时间差保留在均值里。事件时间不是测到的起声。'],
  vidu: ['Average response time: 3.97 s, as reported in the benchmark leaderboard.', '基准榜单报告的平均响应时间为 3.97 秒。'],
  did: ['Average response time: 2.12 s, as reported in the benchmark leaderboard.', '基准榜单报告的平均响应时间为 2.12 秒。'],
  bithuman: ['Average response time: 1.41 s, as reported in the benchmark leaderboard.', '基准榜单报告的平均响应时间为 1.41 秒。']
};
const openLatency = ['Offline sum of the shared Qwen3-Omni request and this avatar’s render or record time. Not a first-packet latency, and not comparable with the product logs.', '共享 Qwen3-Omni 请求耗时，加上该数字人渲染或录制耗时。不是首包延迟，也不能和产品日志直接比较。'];

export const systems = [
  { id: 'emma', name: 'Emma', variant: 'Nuplex Mira', type: 'closed', mark: 'e', color: '#5c6cb3', latencyNote: closedLatency.emma, results: scoreRow([2.7778703703703704, 2.2087499999999998, 2.039675925925926, 2.843148148148148, 1.1591203703703703, 1.9409722222222223, 1.7284259259259258, 1.8510648148148148, 1.7579166666666666], [0.4574641148325359, -0.0382758620689655, 0.7892056074766355, 0.227, -0.08210526315789471, -0.14682242990654204, -0.12833333333333333, -0.1512121212121212], 2.034104938271605, 0.18007120068971486, 2.4496092592544025) },
  { id: 'tavus', name: 'Tavus', variant: 'PALs / Conversational Video Interface', type: 'closed', mark: 't', color: '#b2715c', latencyNote: closedLatency.tavus, results: scoreRow([2.835046296296296, 2.5135648148148144, 1.8884259259259257, 2.6893055555555554, 1.703564814814815, 1.075925925925926, 0.9306018518518518, 2.0776388888888886, 0.8973611111111112], [0.6705263157894737, 0.5936945812807881, 1.242943925233645, 0.4674999999999999, -0.02010526315789473, -0.07953271028037381, -0.17439393939393938, -0.14681818181818185], 1.8457150205761315, 0.46815808503119194, 2.550282748638926) },
  { id: 'vidu', name: 'Vidu', variant: 'S2-Avatar · real-time interaction', type: 'closed', mark: 'v', color: '#4c75b3', latencyNote: closedLatency.vidu, results: scoreRow([2.7885185185185186, 2.543101851851852, 2.134861111111111, 2.314490740740741, 1.305138888888889, 0.3549537037037037, 1.262962962962963, 1.9139351851851854, 0.3501851851851852], [0.540622009569378, 0.39586206896551723, 0.9140654205607477, 0.6765000000000001, -0.08199999999999998, -0.1063551401869159, -0.1506060606060606, -0.1614393939393939], 1.6631275720164609, 0.33280841896498015, 3.97) },
  { id: 'cyberverse', name: 'CyberVerse', variant: 'SoulX-LiveAct', type: 'open', mark: 'C', color: '#7362a7', latencyNote: openLatency, results: scoreRow([2.6080555555555556, 2.5910648148148145, 1.9202314814814814, 2.39125, 2.252314814814815, -0.2980555555555556, 0.6063425925925926, 2.2360185185185184, 0.4499074074074074], [0.3386602870813397, 0.11315270935960592, 0.7441588785046729, 0.20649999999999996, -0.028421052631578958, -0.12803738317757007, -0.2118939393939394, -0.22757575757575757], 1.6396810699588475, 0.17933794834668296, 23.29823589351852) },
  { id: 'openavatar', name: 'OpenAvatarChat', variant: 'LiteAvatar', type: 'open', mark: 'O', color: '#46878a', latencyNote: openLatency, results: scoreRow([2.6093055555555558, 2.5911111111111107, 1.9169444444444446, 2.433148148148148, 1.7327777777777778, -0.5758333333333333, 1.3721759259259259, 1.9666203703703704, -0.0021759259259259206], [0.2773684210526316, 0.008472906403940886, 0.7163551401869159, 0.16499999999999998, -0.20452631578947372, -0.17369158878504673, -0.25575757575757574, -0.2271212121212121], 1.5604526748971195, 0.11807885362481352, 11.67444463425926) },
  { id: 'did', name: 'D-ID', variant: 'V4 Expressive Visual Agents', type: 'closed', mark: 'd', color: '#3e5668', latencyNote: closedLatency.did, results: scoreRow([2.485462962962963, 2.3744444444444444, 1.575462962962963, 2.4414814814814814, 2.124537037037037, -0.2980555555555555, 0.9847685185185185, 1.9727314814814816, 0.2558333333333333], [-0.030909090909090903, -0.14305418719211824, -0.09630841121495327, -0.07449999999999998, -0.3189473684210526, -0.34345794392523366, -0.34984848484848485, -0.3196212121212121], 1.5462962962962963, -0.19559908494051334, 2.12) },
  { id: 'bithuman', name: 'bitHuman', variant: 'Vision Chat', type: 'closed', mark: 'b', color: '#687c5c', latencyNote: closedLatency.bithuman, results: scoreRow([2.488148148148148, 2.5905555555555555, 1.65, 2.6190277777777777, 0.9761111111111112, 0.4090740740740741, 0.4098148148148148, 1.7063425925925926, 0.0068981481481481454], [0.59311004784689, 0.07054187192118226, 0.8279439252336449, 0.6144999999999999, -0.204, -0.10350467289719625, -0.17204545454545456, -0.12772727272727272], 1.4284413580246915, 0.24602618758615438, 1.41) },
  { id: 'vtuber', name: 'Open-LLM-VTuber', variant: 'Live2D', type: 'open', mark: 'V', color: '#a66888', latencyNote: openLatency, results: scoreRow([2.6012962962962964, 2.595277777777778, 1.92, 1.9101388888888888, 1.4312037037037035, -0.713287037037037, 0.8023611111111111, 1.8749537037037038, -0.15226851851851853], [0.2921531100478469, 0.011576354679802952, 0.6877570093457944, 0.217, -0.19473684210526315, -0.12649532710280376, -0.24818181818181817, -0.19643939393939394], 1.3632973251028806, 0.1281351272312881, 10.419655372952143) },
  { id: 'empaava', name: 'EmpaAva', variant: 'GaussianAvatars', type: 'open', mark: 'E', color: '#b16b4f', latencyNote: openLatency, results: scoreRow([2.5730092592592593, 2.5941666666666667, 1.9225925925925924, 1.8202777777777779, 0.16527777777777775, -1.2406944444444445, 0.6226851851851852, 1.052037037037037, -0.4236574074074074], [0.2549760765550239, 0.014630541871921173, 0.6633644859813085, 0.152, -0.2532631578947368, -0.19574766355140188, -0.2828787878787879, -0.25795454545454544], 1.0095216049382716, 0.09042103308783528, 4.857793409672417) }
].map(s => ({ ...s, status: 'published' }));

export const scenarios = [
  { id: 'support', name: ['A need for support', '寻求理解与支持'],
    quote: ['“I thought today would be different.”', '“我本来以为，今天会不一样。”'],
    cues: [['Quiet voice', '轻声表达'], ['Downward gaze', '视线低垂'], ['A long pause', '长停顿']],
    intent: ['The words describe a day. The context may be asking for understanding.', '话语在描述这一天，语境可能表达了希望被理解的需求。'] },
  { id: 'clarify', name: ['A need for clarification', '寻求进一步解释'],
    quote: ['“Right… I think I follow.”', '“嗯……我想我明白了。”'],
    cues: [['Hesitant delivery', '迟疑的语气'], ['Furrowed brow', '眉头紧皱'], ['Head tilt', '头部微倾']],
    intent: ['A verbal agreement can coexist with uncertainty. A helpful response checks understanding.', '口头赞同也可能伴随疑惑，恰当的回应需要确认对方是否理解。'] },
  { id: 'share', name: ['An invitation to share', '邀请分享喜悦'],
    quote: ['“You’ll never guess what happened!”', '“你绝对猜不到发生了什么！”'],
    cues: [['Lively intonation', '活跃的语调'], ['A broad smile', '明显的笑容'], ['Forward lean', '身体前倾']],
    intent: ['The speaker may be inviting curiosity and shared excitement, rather than a literal guess.', '说话者可能在邀请对方好奇地参与、分享兴奋，而非要求字面上的猜测。'] }
];
