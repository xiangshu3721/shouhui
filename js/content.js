/*
 * 「主体边界卡」—— 全部文案集中在这里，改字只改这个文件。
 *
 * 标注说明：
 *   src: "user"   = 用户原文（2026-10-11 规格），一字不改
 *   src: "added"  = 按同样风格补写，可随时改
 * 题目、选项、按钮文案、首页状态按钮均为用户原文。
 * 可见产品名按设计稿为「主体边界卡」。
 */
(function (root) {
  "use strict";

  var C = {};

  C.app = {
    name: "主体边界卡",
    subtitle: "一个帮助你减少内耗、看清边界、找回主动权的小练习。",
    tagline: "分清课题，收回注意力，练习主体性。",
    heroLine: "更清晰的自己，从今天开始",               // user
    credit: "内容受到阿德勒个体心理学及《被讨厌的勇气》相关思想启发。",           // user
    version: "0.3.0"
  };

  /* 四个维度：name / question / signs 为用户原文；desc（结果页说明）、practice（练习方向）、nextWeek（下周提醒）见各自 src 标注 */
  C.dims = {
    A: {
      key: "A", name: "评价牵引",
      question: "我有多容易被别人怎么看影响？", signs: "怕被讨厌、讨好、反复证明",
      desc: "你似乎比较容易把注意力放在“别人怎么看我”上。当外界评价不确定时，你容易反复确认、解释或者怀疑自己。", descSrc: "user",
      practice: "别人怎么看是别人的事，我怎么做是我的事。", practiceSrc: "added",
      nextWeek: "少解释一次，多选择自己一次。", nextWeekSrc: "user"
    },
    B: {
      key: "B", name: "边界混淆",
      question: "我能不能分清谁的课题？", signs: "替别人负责、操心、拯救",
      desc: "你比较容易承担关系中本来不完全属于自己的责任。", descSrc: "user",
      practice: "把别人的课题还给别人，把自己的课题拿回来。", practiceSrc: "user",
      nextWeek: "少替别人操一次心，把一件事还给TA自己。", nextWeekSrc: "added"
    },
    C: {
      key: "C", name: "控制期待",
      question: "我是否希望别人按照我的期待行动？", signs: "催促、控制、失望、生气",
      desc: "你比较容易希望身边的人和事按你认为对的方式发展。当别人没有照做、事情不受你控制时，你容易着急、失望或生气。", descSrc: "added",
      practice: "把期待变成请求，允许别人有自己的选择。", practiceSrc: "added",
      nextWeek: "少催一次，多问一句“你怎么想？”", nextWeekSrc: "added"
    },
    D: {
      key: "D", name: "行动退缩",
      question: "我会不会因为害怕结果而不敢选择？", signs: "拖延、不表达、不拒绝",
      desc: "你心里其实知道自己想要什么，但一想到结果或别人的反应，就容易先等一等、先忍一忍，把真正重要的事往后放。", descSrc: "added",
      practice: "不等完全准备好，先迈出很小的一步。", practiceSrc: "added",
      nextWeek: "挑一件拖着的小事，先做五分钟。", nextWeekSrc: "added"
    }
  };
  C.dimOrder = ["A", "B", "C", "D"];
  C.dimCover = { A: "看清评价，把注意力收回来", B: "分清课题，守住边界", C: "放下控制，允许不同", D: "带着勇气，先迈一步" };

  /* 16 题 —— 用户原文，顺序即题号 */
  C.options = ["几乎没有", "偶尔", "有时", "经常", "几乎总是"];   // = 1～5 分
  C.questions = [
    { dim: "A", text: "别人不认同我的选择时，我会反复怀疑自己。" },
    { dim: "A", text: "我做完一件事后，会很在意别人怎么评价。" },
    { dim: "A", text: "为了避免别人不高兴，我会答应一些自己并不愿意做的事。" },
    { dim: "A", text: "别人的负面评价会影响我很久。" },
    { dim: "B", text: "身边的人情绪不好时，我会觉得自己有责任让TA好起来。" },
    { dim: "B", text: "即使不是我的事情，我也很容易替别人操心。" },
    { dim: "B", text: "别人做出我认为错误的选择时，我很难真正放手。" },
    { dim: "B", text: "我有时分不清“关心别人”和“替别人负责”的区别。" },
    { dim: "C", text: "我希望重要的人按照我认为正确的方式去做。" },
    { dim: "C", text: "对方的反应和我期待的不一样时，我会明显失望或生气。" },
    { dim: "C", text: "我会不断解释、劝说或者催促，希望别人改变。" },
    { dim: "C", text: "当事情的发展不受我控制时，我容易焦虑。" },
    { dim: "D", text: "因为担心失败或别人怎么看，我会推迟一些真正重要的事情。" },
    { dim: "D", text: "为了避免冲突，我常常不表达真实想法。" },
    { dim: "D", text: "即使知道自己想要什么，我有时还是会因为怕别人失望而放弃。" },
    { dim: "D", text: "面对不确定的结果，我更容易继续等待，而不是开始行动。" }
  ];

  /* 内部分档（用户端不显示分档名称）：0–39 相对稳定 / 40–64 值得觉察 / 65–100 当前重点 */
  C.bands = [
    { min: 0, max: 39, key: "steady", label: "相对稳定" },
    { min: 40, max: 64, key: "notice", label: "值得觉察" },
    { min: 65, max: 100, key: "focus", label: "当前重点" }
  ];

  /* 页面文案 */
  C.ui = {
    homeAsk: "今天，你更像是哪一种？",                                       // user
    drawLead: "抽一张卡，开始今天的觉察。",
    libraryTitle: "卡牌",
    libraryLead: "24 张觉察卡，分成四个方向。点开就能看完整内容。",
    setsTitle: "推荐卡组",
    setsAll: "查看全部",
    drawTitle: "今日抽卡",
    drawSub: "抽一张卡片，开启今天的指引。",
    thinkLabel: "今日思考",
    tryLabel: "今天试一次",
    redraw: "换一张",
    seeAll: "查看全部卡牌",
    practiceTitle: "情境练习",
    practiceLead: "挑一个很小的情境，把觉察用在今天。",
    practiceMore: "按当下的心情抽一张",
    remindTitle: "今日提醒",
    remindLead: "一句话，带来力量。",
    remindCta: "用这张开始今天",
    resultModeTitle: "你的课题模式",
    resultModeLead: "基于测试结果生成，帮助你更好地理解自己。",
    resultBadge: "主要课题",
    actionTitle: "行动建议",
    grid: [
      { key: "draw", title: "抽卡", desc: "获得当下的指引", hash: "#/card" },
      { key: "quiz", title: "测一测", desc: "探索你的课题模式", hash: "#/quiz" },
      { key: "practice", title: "情境练习", desc: "在生活中应用", hash: "#/practice" },
      { key: "remind", title: "今日提醒", desc: "一句话，带来力量", hash: "#/remind" }
    ],
    states: [                                                               // user
      { label: "特别在意别人怎么看", dim: "A" },
      { label: "又在替别人操心", dim: "B" },
      { label: "希望某个人按我的期待改变", dim: "C" },
      { label: "知道该做什么，但就是不敢", dim: "D" },
      { label: "随便给我一张", dim: null }
    ],
    resultTitle: "你最近最容易卡住的地方",                                    // user
    resultTopLead: "你当前最值得关注的是前两个维度：",                          // user（意思）
    resultPracticeLead: "接下来一段时间，你可以重点练习：",                     // user
    resultCta: "开始我的7天觉察 →",                                          // user
    resultAllSteady: "整体来看，你最近在这几方面都相对稳定。下面两个，只是相对更值得留意一点的地方。", // added
    cardCta: "我愿意试试",                                                   // user
    reactions: [                                                            // user
      { key: "like", label: "很像我" },
      { key: "some", label: "有一点" },
      { key: "none", label: "没感觉" }
    ],
    notePlaceholder: "写一句我刚刚意识到的事……",                               // user
    cardDone: "好，今天就这一件事。",                                         // added（任务说明里给的收尾句）
    taskBoxes: [                                                            // user
      { key: "mine", label: "我的课题" },
      { key: "theirs", label: "TA的课题" },
      { key: "ours", label: "我们共同的课题" }
    ],
    weekFound: "这一周，你最常遇见的是：",                                     // user
    weekDone: "你完成了{n}次觉察。",                                           // user
    weekNote: "这周你写过的一句话：",                                          // user
    weekNext: "下周提醒：",                                                   // user
    weekNotEnough: "再陪自己走几天吧。满 7 天，这里会出现一份很短的小结。",       // added
    weekNoRecord: "这 7 天还没有完成的觉察。不着急，想起来的时候抽一张就好。"       // added
  };

  /*
   * 24 张卡（每维度 6 张，顺序同用户卡单）。
   * 每张只有：title 标题 / remind 今日提醒 / ask 问问自己 / try 今天试一次
   * boxes: true 的卡在「今天试一次」下面显示三个可填小框
   */
  C.cards = [
    /* ---------- 评价牵引 ---------- */
    { id: "A1", dim: "A", src: "user", title: "他人的评价",
      tag: "他人的课题，不是我的课题",
      remind: "你可以决定自己怎么做，但无法决定别人怎么看你。",
      ask: "如果暂时不考虑别人是否认可，我真正想怎么做？",
      try: "做一个很小的、符合自己真实想法的选择，不急着解释。" },
    { id: "A2", dim: "A", src: "added", title: "不被理解",
      tag: "不被懂，也可以继续做自己",
      remind: "不是每个人都会懂你，这不代表你错了。",
      ask: "如果对方一直不懂，我还会坚持这么做吗？",
      try: "今天被误会时，把想法说一遍就停，不追着解释第二遍。" },
    { id: "A3", dim: "A", src: "added", title: "不再证明",
      tag: "不必每天向别人证明自己",
      remind: "你不需要每天都向别人证明自己够好。",
      ask: "我最近在努力向谁证明什么？",
      try: "今天做一件只为自己做的小事，不发出来，也不讲给别人听。" },
    { id: "A4", dim: "A", src: "added", title: "比较",
      tag: "别人走得快，不等于你走错",
      remind: "别人走得快，不等于你走错了路。",
      ask: "我拿来和别人比的那件事，真的是我想要的吗？",
      try: "冒出“TA比我好”的念头时，写下一件自己这周做到的小事。" },
    { id: "A5", dim: "A", src: "added", title: "自我价值",
      tag: "价值不靠别人点头才成立",
      remind: "你的价值，不靠别人点头才成立。",
      ask: "如果今天没有任何人夸我，我还觉得自己可以吗？",
      try: "睡前写下一件今天做得还行的事，不管有没有人看到。" },
    { id: "A6", dim: "A", src: "added", title: "真实表达",
      tag: "真实比正确更重要",
      remind: "说出真实的想法，比说出“正确”的话更重要。",
      ask: "今天有哪句话，我说出口之前先改成了别人爱听的样子？",
      try: "在一个安全的场合，原样说一句真实感受，比如“我其实不太同意”。" },

    /* ---------- 边界混淆 ---------- */
    { id: "B1", dim: "B", src: "user", title: "这是谁的课题？",
      tag: "谁承担后果，谁就是主人", listTitle: "谁的课题", boxes: true,
      remind: "谁承担这个选择最终的后果，谁就是这个课题的主要主人。",
      ask: "我现在操心的这件事情，最后主要是谁承担结果？",
      try: "把它放进三个框：", tryFull: "把它放进三个框：我的课题____ / TA的课题____ / 我们共同的课题____" },  // 三个框做成可填小框，见 C.ui.taskBoxes
    { id: "B2", dim: "B", src: "added", title: "情绪归谁",
      tag: "看见情绪，不必替它负责",
      remind: "别人的情绪你可以看见，但不一定要由你负责。",
      ask: "TA不开心，是因为我做了什么，还是TA自己正在经历什么？",
      try: "有人情绪不好时，先说一句“我看到你不太好”，不急着替TA修好。" },
    { id: "B3", dim: "B", src: "added", title: "帮助还是替代",
      tag: "帮忙是陪走，不是替走",
      remind: "帮忙是陪TA一起走，替代是替TA走完。",
      ask: "这件事是TA请我帮的，还是我觉得TA需要？",
      try: "想插手之前，先问一句：“你需要我帮忙吗？”" },
    { id: "B4", dim: "B", src: "added", title: "共同课题",
      tag: "共同的事，一起商量",
      remind: "有些事确实是两个人的，那就一起商量，不用一个人扛。",
      ask: "这件事里，哪一部分需要我们一起决定？",
      try: "对TA说一句“这件事我们一起定一下吧”，然后先听TA说。" },
    { id: "B5", dim: "B", src: "added", title: "拒绝",
      tag: "拒绝一件事，不是拒绝人",
      remind: "拒绝一件事，不等于拒绝这个人。",
      ask: "最近有哪件事，我心里想说“不”，嘴上却说了“好”？",
      try: "对一个小请求说“这次我不行”，不附上一长串理由。" },
    { id: "B6", dim: "B", src: "added", title: "把课题还回去",
      tag: "把课题还回去，也是信任",
      remind: "把属于别人的事还给TA，也是一种信任。",
      ask: "我手里有哪件事，其实本该由别人自己来做？",
      try: "挑一件小事，今天不替TA做了，只说一句“我相信你能处理”。" },

    /* ---------- 控制期待 ---------- */
    { id: "C1", dim: "C", src: "added", title: "我的期待",
      tag: "期待是希望，不是义务",
      remind: "期待是你的，别人不一定要照着做。",
      ask: "我希望TA怎么做？这个希望，TA知道吗？",
      try: "写下一个对别人的期待，在后面补一句：“这是我的希望，不是TA的义务。”" },
    { id: "C2", dim: "C", src: "added", title: "可控与不可控",
      tag: "力气放在能决定的事上",
      remind: "把力气放在自己能决定的事上，心会松一点。",
      ask: "让我着急的这件事里，哪一部分是我真正能做的？",
      try: "在纸上分两栏：我能做的 / 我管不了的。今天只做左边一件。" },
    { id: "C3", dim: "C", src: "added", title: "请求还是要求",
      tag: "请求允许对方说不",
      remind: "请求允许对方说“不”，要求不允许。",
      ask: "如果TA拒绝了，我还能平静地接受吗？",
      try: "把一句“你应该……”换成“我希望……，你觉得可以吗？”" },
    { id: "C4", dim: "C", src: "added", title: "允许别人不同",
      tag: "允许别人和你不同",
      remind: "别人和你想的不一样，不代表TA错了。",
      ask: "TA的做法虽然不是我的方式，会不会也有TA的道理？",
      try: "看到别人做法和你不同时，先不纠正，看看会怎样。" },
    { id: "C5", dim: "C", src: "added", title: "接纳失望",
      tag: "失望很正常，不必变成指责",
      remind: "失望很正常，它只是在说：你曾经很在乎。",
      ask: "这次失望的背后，我真正在乎的是什么？",
      try: "对自己说一句“我有点失望，这很正常”，不急着把它变成指责。" },
    { id: "C6", dim: "C", src: "added", title: "放下控制",
      tag: "少抓一点，心会松一点",
      remind: "抓得越紧，往往越累，事情也不一定更好。",
      ask: "这件事我少管一点，最坏会怎样？我能承受吗？",
      try: "今天少催一次、少提醒一次，把那点空间留给对方。" },

    /* ---------- 行动退缩 ---------- */
    { id: "D1", dim: "D", src: "added", title: "被讨厌的勇气",
      tag: "不被所有人喜欢，也可以",
      remind: "不被所有人喜欢，是活成自己要付的正常代价。",
      ask: "如果有人因此不喜欢我，我还愿意这样做吗？",
      try: "做一件你想做、但担心有人会不高兴的小事。" },
    { id: "D2", dim: "D", src: "added", title: "先行动",
      tag: "先迈出很小的一步",
      remind: "想清楚再开始，常常就变成了一直没开始。",
      ask: "这件事最小的第一步是什么？小到五分钟就能做完。",
      try: "现在就做那五分钟，做完就算数。" },
    { id: "D3", dim: "D", src: "added", title: "允许失败",
      tag: "失败说明你试过了",
      remind: "失败说明你试过了，不说明你不行。",
      ask: "如果知道可能不成功，我还想试吗？",
      try: "做一件可能做不好的小事，做完对自己说一句“试过了”。" },
    { id: "D4", dim: "D", src: "added", title: "表达真实",
      tag: "不说出来，别人只能猜",
      remind: "不说出来，别人只能猜；猜错了，委屈的还是你。",
      ask: "有什么需要，我一直没有说出口？",
      try: "用一句话说出一个小需要，比如“我今天想早点休息”。" },
    { id: "D5", dim: "D", src: "added", title: "做自己的选择",
      tag: "最后做决定的还是你",
      remind: "听了再多建议，最后做决定的还是你。",
      ask: "如果不用向任何人交代，我会选哪一个？",
      try: "今天有一个小选择，不问别人，自己定下来。" },
    { id: "D6", dim: "D", src: "added", title: "接受不确定",
      tag: "带着不确定，也可以先走",
      remind: "没有十足把握的时候，也可以先往前走一步。",
      ask: "我在等的那个“确定”，真的会来吗？",
      try: "带着一点不确定做一个小决定，告诉自己“先这样，之后可以再调”。" }
  ];

  /* 图鉴呈现：四个方向。卡牌原文不改，只调整归类与顺序。 */
  C.groups = [
    { id: "edge", name: "边界认知", cover: "看清评价，把注意力收回来",
      lead: "建立清晰的自我边界。",
      cardIds: ["A1", "B1", "A5", "A2", "A3", "A4"] },
    { id: "relate", name: "关系课题", cover: "在关系里守住自己的部分",
      lead: "在关系中保持独立、平等、真实的连接。",
      cardIds: ["B6", "C1", "C5", "B2", "B4", "B5"] },
    { id: "grow", name: "自我成长", cover: "接纳情绪，放下控制",
      lead: "接纳情绪，放下控制，成为更自由的自己。",
      cardIds: ["C2", "C6", "C3", "C4", "A6", "B3"] },
    { id: "act", name: "行动练习", cover: "把觉察落成很小的一步",
      lead: "从觉察到行动，把心理学用在生活中。",
      cardIds: ["D1", "D4", "D2", "D3", "D5", "D6"] }
  ];

  root.SHOUHUI_CONTENT = C;
})(this);
