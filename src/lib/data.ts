export type Member = {
  id: string;
  name: string;
  role: string;
  department: string;
  joined: string;
  activities: number;
  motto: string;
  palette: [string, string];
  /** 一段简介，显示在成员详情页 */
  bio: string;
  /** 头像图：放在 public/members/<id>.jpg，留空则用首字渐变占位 */
  photo?: string;
};

export type Photo = {
  id: string;
  seed: number;
  caption: string;
  /** 真实部署时填照片 CDN 地址，留空则使用生成的占位图 */
  src?: string;
};

export type VolunteerEvent = {
  slug: string;
  title: string;
  date: string;
  location: string;
  summary: string;
  description: string;
  tags: string[];
  participants: number;
  hours: number;
  cover: number; // 封面占位图 seed
  /** 由 serverPhotos 在构建时填入：photos 文件夹里的第一张照片 */
  coverSrc?: string;
  photos: Photo[];
};

export const members: Member[] = [
  { id: "m1", name: "林晓雨", role: "团长", department: "人力资源部", joined: "2021-03", activities: 42, motto: "微光成炬，温暖同行。", palette: ["#1fa45c", "#7edca4"], bio: "义工团的发起人之一。2021 年，她在公司内部发出第一封招募邮件，从 7 个人的小队伍做到今天数十人的规模。她相信公益不是一时热血，而是一种可以长久坚持的生活方式——五年来，几乎每一次活动的统筹都有她的身影。", photo: "/members/m1.jpg" },
  { id: "m2", name: "陈则铭", role: "副团长", department: "技术研发部", joined: "2021-05", activities: 38, motto: "代码改变世界，行动温暖人心。", palette: ["#15803d", "#b9e6cb"], bio: "技术研发部工程师，义工团的“技术担当”。报名表、签到系统，乃至这个活动记录网站，都是他利用业余时间一行行搭起来的。他常说：能用代码解决的事，就别让大家多跑腿。", photo: "/members/m2.jpg" },
  { id: "m3", name: "苏婉清", role: "活动策划", department: "市场部", joined: "2021-09", activities: 35, motto: "每一次出发，都值得被记录。", palette: ["#2fb874", "#0f6b3e"], bio: "市场部出身，把策划活动的本事全用在了公益上。从场地对接、流程设计到物料准备，她总能把一次活动安排得井井有条，让每位义工一到现场就知道自己该做什么。", photo: "/members/m3.jpg" },
  { id: "m4", name: "赵启航", role: "物资管理", department: "运营部", joined: "2022-01", activities: 29, motto: "把小事做好，就是大事。", palette: ["#e6b85c", "#1fa45c"], bio: "运营部的“大管家”，负责每次活动的物资调度。几千份礼包、上万杯饮用水，在他手里从不出错。他习惯提前一周列好清单，反复核对到最后一刻。", photo: "/members/m4.jpg" },
  { id: "m5", name: "何静怡", role: "摄影记录", department: "设计部", joined: "2022-04", activities: 31, motto: "用镜头留住每个善意瞬间。", palette: ["#4cc98a", "#155e38"], bio: "设计部的摄影师，义工团绝大多数照片都出自她的镜头。她总说自己只是“按下快门的人”，却为每一次善行留下了最动人的瞬间——这个网站里的很多画面，都来自她的记录。", photo: "/members/m5.jpg" },
  { id: "m6", name: "吴天乐", role: "安全保障", department: "行政部", joined: "2022-06", activities: 26, motto: "守护好每一位伙伴。", palette: ["#7edca4", "#1fa45c"], bio: "行政部的安全员，每次外出活动他都走在最前、守在最后。清点人数、规划路线、准备应急药箱，是他雷打不动的习惯。有他在，大家都安心。", photo: "/members/m6.jpg" },
  { id: "m7", name: "郑沛霖", role: "外联协调", department: "公共关系部", joined: "2022-10", activities: 22, motto: "连接善意，传递力量。", palette: ["#9fc97a", "#2a7d4f"], bio: "公关部的“外交官”，负责对接敬老院、学校、血站等合作方。许多活动能顺利落地，靠的是他一次次耐心的沟通与协调。", photo: "/members/m7.jpg" },
  { id: "m8", name: "杜若曦", role: "财务监督", department: "财务部", joined: "2023-02", activities: 18, motto: "每一分善款都清清楚楚。", palette: ["#0f7a45", "#8be0b3"], bio: "财务部的“铁面账房”。每一笔善款、每一次采购，她都记得清清楚楚并定期公示。她坚信，透明是公益最基本的底线。", photo: "/members/m8.jpg" },
  { id: "m9", name: "高一帆", role: "新媒体运营", department: "品牌部", joined: "2023-05", activities: 15, motto: "让更多人看见，让更多人加入。", palette: ["#36b06d", "#d9c08a"], bio: "品牌部的新媒体运营，义工团对外的“声音”。活动招募、回顾推送、暖心瞬间，都经她的手传播出去，吸引了越来越多同事加入。", photo: "/members/m9.jpg" },
  { id: "m10", name: "孙若楠", role: "培训讲师", department: "培训发展部", joined: "2023-08", activities: 12, motto: "授人以渔，温暖以心。", palette: ["#1c9355", "#a8e6c2"], bio: "培训发展部讲师，负责新义工的入团培训。从服务礼仪到应急处理，她把每一课都讲得细致又温暖，是许多人公益路上的第一位引路人。", photo: "/members/m10.jpg" },
];

export const events: VolunteerEvent[] = [
  {
    slug: "riverside-cleanup-2024",
    title: "春日江滩环保清洁行动",
    date: "2024-03-16",
    location: "滨江湿地公园",
    summary: "60 名义工沿江清理垃圾 1.2 吨，守护城市绿肺。",
    description:
      "三月的江风还带着凉意，我们的义工团队却热情高涨。本次行动分为六个小组，沿滨江步道分段清理白色垃圾、塑料瓶和废弃渔网。活动同时面向市民开展环保宣传，发放可降解垃圾袋 500 余份。最终统计清理垃圾约 1.2 吨，其中可回收物 300 余公斤已交由专业机构处理。",
    tags: ["环保", "城市公益"],
    participants: 60,
    hours: 4,
    cover: 101,
    photos: [
      { id: "p101", seed: 101, caption: "出发前的全员合影，士气满满" },
      { id: "p102", seed: 102, caption: "小组沿江分段清理中" },
      { id: "p103", seed: 103, caption: "孩子们也加入了捡拾队伍" },
      { id: "p104", seed: 104, caption: "战利品：满满二十袋垃圾" },
      { id: "p105", seed: 105, caption: "夕阳下的江滩恢复了干净" },
    ],
  },
  {
    slug: "elderly-home-visit-2024",
    title: "夕阳暖心敬老院慰问",
    date: "2024-05-25",
    location: "康宁敬老院",
    summary: "文艺演出 + 一对一陪伴，为 80 位老人送去初夏的温暖。",
    description:
      "义工们准备了合唱、戏曲和魔术表演，还为老人们带去了定制的护理礼包。演出结束后开展一对一陪伴：陪老人下棋、读报、整理相册。摄影组为每位老人拍摄了肖像照并现场打印装框，许多老人说这是十年来第一张正式照片。",
    tags: ["敬老", "陪伴"],
    participants: 35,
    hours: 6,
    cover: 201,
    photos: [
      { id: "p201", seed: 201, caption: "合唱团开场《夕阳红》" },
      { id: "p202", seed: 202, caption: "陪王爷爷下了三盘象棋" },
      { id: "p203", seed: 203, caption: "为老人拍摄的肖像照" },
      { id: "p204", seed: 204, caption: "护理礼包发放现场" },
    ],
  },
  {
    slug: "mountain-school-library-2024",
    title: "山区小学图书角共建",
    date: "2024-09-14",
    location: "青岭乡中心小学",
    summary: "捐建 3 个班级图书角，带去图书 2000 册与一堂科学课。",
    description:
      "经过两个月的图书募集，我们带着 2000 册儿童读物和 30 套科学实验器材驱车五小时抵达青岭乡。义工们与孩子们一起组装书架、给图书分类贴标，并开设了「一小时科学课」：水火箭、电路积木、显微镜观察。临别时孩子们写下心愿卡，约定明年再见。",
    tags: ["助学", "乡村振兴"],
    participants: 24,
    hours: 12,
    cover: 301,
    photos: [
      { id: "p301", seed: 301, caption: "五小时车程后抵达青岭乡" },
      { id: "p302", seed: 302, caption: "和孩子们一起组装书架" },
      { id: "p303", seed: 303, caption: "水火箭发射成功的欢呼" },
      { id: "p304", seed: 304, caption: "显微镜下的新世界" },
      { id: "p305", seed: 305, caption: "心愿卡：明年还要见到你们" },
      { id: "p306", seed: 306, caption: "图书角落成合影" },
    ],
  },
  {
    slug: "city-marathon-support-2024",
    title: "城市马拉松志愿服务",
    date: "2024-11-03",
    location: "城市中央大道",
    summary: "凌晨四点集结，45 名义工守护 3 万名跑者的补给线。",
    description:
      "我们承担了 25 公里处补给站的全部运营：凌晨四点到岗布置，准备了 1.5 万杯饮用水、8000 根香蕉和能量胶。高峰期每分钟服务超过 200 名跑者。医疗组协助处理了 12 起抽筋和擦伤。收站后全员留下清理赛道垃圾，被组委会评为「最佳补给站」。",
    tags: ["赛事服务", "城市公益"],
    participants: 45,
    hours: 10,
    cover: 401,
    photos: [
      { id: "p401", seed: 401, caption: "凌晨四点的集结" },
      { id: "p402", seed: 402, caption: "1.5 万杯水的整齐方阵" },
      { id: "p403", seed: 403, caption: "高峰期的补给瞬间" },
      { id: "p404", seed: 404, caption: "「最佳补给站」锦旗合影" },
    ],
  },
  {
    slug: "warm-winter-donation-2025",
    title: "暖冬衣物捐赠计划",
    date: "2025-01-18",
    location: "公司园区 & 西部山区",
    summary: "全员募集冬衣 3600 件，分拣打包发往高寒山区。",
    description:
      "为期两周的衣物募集在园区设立了 6 个捐赠点，共收到冬衣 3600 余件。义工们利用三个周末完成清洗消毒、分类打包，按尺码和厚度建立清单，最终装满一辆 9.6 米货车发往西部高寒山区的三所学校和两个村落。",
    tags: ["捐赠", "暖冬"],
    participants: 52,
    hours: 16,
    cover: 501,
    photos: [
      { id: "p501", seed: 501, caption: "园区捐赠点排起长队" },
      { id: "p502", seed: 502, caption: "周末分拣现场" },
      { id: "p503", seed: 503, caption: "3600 件冬衣装车完毕" },
      { id: "p504", seed: 504, caption: "孩子们穿上新棉衣" },
    ],
  },
  {
    slug: "blood-donation-2025",
    title: "无偿献血公益日",
    date: "2025-04-12",
    location: "公司园区广场",
    summary: "联合血站开进园区，128 人撸袖献血 4.2 万毫升。",
    description:
      "联合市中心血站把采血车开进园区，义工团负责全流程组织：预约登记、健康宣讲、现场引导和献血后关怀。当天共有 156 人报名、128 人成功献血，总量达 42000 毫升。我们还设计了「热血勋章」纪念徽章，献血者人手一枚。",
    tags: ["献血", "健康"],
    participants: 128,
    hours: 8,
    cover: 601,
    photos: [
      { id: "p601", seed: 601, caption: "采血车开进园区广场" },
      { id: "p602", seed: 602, caption: "同事们有序排队登记" },
      { id: "p603", seed: 603, caption: "「热血勋章」纪念徽章" },
      { id: "p604", seed: 604, caption: "献血后的暖心关怀角" },
    ],
  },
];

export function getEvent(slug: string) {
  return events.find((e) => e.slug === slug);
}

export function getMember(id: string) {
  return members.find((m) => m.id === id);
}

export const allPhotoSeeds = events.flatMap((e) => e.photos.map((p) => p.seed));
