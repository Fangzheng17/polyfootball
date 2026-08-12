export const DEFAULT_EVENT_SLUG = process.env.EVENT_SLUG || "fifwc-fra-sen-2026-06-16";
export const LISTING_EVENT_SLUGS = [
  "fifwc-esp-cvi-2026-06-15",
  "fifwc-bel-egy-2026-06-15",
  "fifwc-ksa-ury-2026-06-15",
  "fifwc-irn-nzl-2026-06-15",
  "fifwc-fra-sen-2026-06-16",
  "fifwc-irq-nor-2026-06-16",
  "fifwc-arg-alg-2026-06-16",
  "fifwc-aut-jor-2026-06-17",
  "fifwc-prt-cdr-2026-06-17",
  "fifwc-eng-hrv-2026-06-17",
  "fifwc-gha-pan-2026-06-17",
  "fifwc-uzb-col-2026-06-17",
  "fifwc-cze-rsa-2026-06-18",
  "fifwc-che-bih-2026-06-18",
  "fifwc-can-qat-2026-06-18",
];
export const ALLOWED_EVENT_SLUGS = new Set([DEFAULT_EVENT_SLUG, ...LISTING_EVENT_SLUGS]);
export const GAMMA_URL = process.env.GAMMA_URL || "https://gamma-api.polymarket.com";
export const CLOB_URL = process.env.CLOB_URL || "https://clob.polymarket.com";
export const CACHE_MS = Number(process.env.CACHE_MS || 5000);
export const CHART_CACHE_MS = Number(process.env.CHART_CACHE_MS || 60000);
export const PROPS_CACHE_MS = Number(process.env.PROPS_CACHE_MS || 60000);

export const propsCategories = [
  { id: "all", label: "全部", tagId: 102350 },
  { id: "world-cup-awards", label: "奖项", tagId: 105306 },
  { id: "World-Cup-Player-H2H", label: "球员对决", tagId: 105308 },
  { id: "WC-group-futures", label: "小组远期", tagId: 105309 },
  { id: "WC-Stage-of-Elimination", label: "淘汰阶段", tagId: 105310 },
  { id: "WC-Team-Props", label: "球队玩法", tagId: 105311 },
  { id: "WC-Player-Futures", label: "球员远期", tagId: 105312 },
  { id: "wc-continental-futures", label: "洲际远期", tagId: 105313 },
  { id: "WC-Trump", label: "特朗普", tagId: 105314 },
  { id: "WC-Tournament-Futures", label: "赛事远期", tagId: 105315 },
  { id: "WC-Records", label: "纪录", tagId: 105316 },
  { id: "WC-culture-mentions", label: "文化", tagId: 105317 },
];

export const baseCategories = [
  {
    id: "game-lines",
    label: "比赛盘口",
    types: ["soccer_team_to_advance", "moneyline", "spreads", "totals", "soccer_team_totals", "both_teams_to_score", "soccer_first_to_score"],
  },
  { id: "correct-score", label: "准确比分", types: ["soccer_exact_score", "correct_score"] },
  {
    id: "halves",
    label: "上下半场",
    types: [
      "soccer_halftime_result",
      "soccer_second_half_result",
      "first_half_totals",
      "second_half_totals",
      "both_teams_to_score_first_half",
      "both_teams_to_score_second_half",
      "soccer_first_half_team_totals",
      "soccer_second_half_team_totals",
    ],
  },
  {
    id: "corners",
    label: "角球",
    types: [
      "total_corners",
      "soccer_team_total_corners",
      "soccer_first_corner",
      "soccer_game_corners_odd_even",
      "soccer_first_half_total_corners",
      "soccer_second_half_total_corners",
    ],
  },
  { id: "goals", label: "进球", types: ["soccer_player_goals"] },
  { id: "assists", label: "助攻", types: ["soccer_player_assists"] },
  { id: "shots", label: "射门", types: ["soccer_player_shots"] },
];

const typeToCategory = new Map(baseCategories.flatMap((category) => category.types.map((type) => [type, category.id])));
const displayMarketTypes = new Set(typeToCategory.keys());
const typeLabel = {
  moneyline: "胜平负",
  soccer_team_to_advance: "晋级球队",
  spreads: "让球",
  totals: "总进球",
  soccer_team_totals: "球队进球",
  both_teams_to_score: "双方进球",
  soccer_first_to_score: "先进球",
  soccer_exact_score: "准确比分",
  soccer_halftime_result: "半场结果",
  soccer_second_half_result: "下半场结果",
  first_half_totals: "上半场总进球",
  second_half_totals: "下半场总进球",
  both_teams_to_score_first_half: "上半场双方进球",
  both_teams_to_score_second_half: "下半场双方进球",
  soccer_first_half_team_totals: "上半场球队进球",
  soccer_second_half_team_totals: "下半场球队进球",
  total_corners: "总角球",
  soccer_team_total_corners: "球队角球",
  soccer_first_corner: "首个角球",
  soccer_game_corners_odd_even: "角球单双",
  soccer_first_half_total_corners: "上半场角球",
  soccer_second_half_total_corners: "下半场角球",
  soccer_player_goals: "球员进球",
  soccer_player_goals_plus_assists: "球员进球+助攻",
  soccer_player_assists: "球员助攻",
  soccer_player_shots: "球员射门",
  soccer_player_shots_on_target: "射正",
};

const playerNameMap = {
  "Dani Olmo": "达尼·奥尔莫",
  "Eric García": "埃里克·加西亚",
  "Fabián Ruiz": "法比安·鲁伊斯",
  "Ferrán Torres": "费兰·托雷斯",
  "Gavi Paez": "加维",
  "Lamine Yamal": "拉明·亚马尔",
  "Martín Zubimendi": "马丁·苏比门迪",
  "Mikel Merino": "米克尔·梅里诺",
  "Mikel Oyarzabal": "米克尔·奥亚萨瓦尔",
  "Borja Iglesias": "博尔哈·伊格莱西亚斯",
  "Cucurella": "库库雷利亚",
  "Dailon Livramento": "戴隆·利夫拉门托",
  "Marcos Llorente": "马科斯·略伦特",
  "Marc Pubill": "马克·普比尔",
  "Alex Baena": "阿莱士·巴埃纳",
  "Alexis Saelemaekers": "亚历克西斯·萨勒马克尔斯",
  "Matias Fernandez-Pardo": "马蒂亚斯·费尔南德斯-帕尔多",
  "Maxim De Cuyper": "马克西姆·德库伊佩尔",
  "Mostafa Zico": "穆斯塔法·齐科",
  "Romelu Lukaku": "罗梅卢·卢卡库",
  "Thomas Meunier": "托马斯·默尼耶",
  "Youri Tielemans": "尤里·蒂勒曼斯",
  "Zizo": "齐佐",
  "Amadou Onana": "阿马杜·奥纳纳",
  "Charles De Ketelaere": "查尔斯·德凯特拉雷",
  "Diego Moreira": "迭戈·莫雷拉",
  "Dodi Lukebakio": "多迪·卢克巴基奥",
  "Haissem Hassan": "海瑟姆·哈桑",
  "Hamza Abdelkarim": "哈姆扎·阿卜杜勒卡里姆",
  "Hans Vanaken": "汉斯·瓦纳肯",
  "Ibrahim Adel": "易卜拉欣·阿德尔",
  "Federico Valverde": "费德里科·巴尔韦德",
  "Federico Viñas": "费德里科·比尼亚斯",
  "Feras Al Brikan": "费拉斯·布赖坎",
  "Giorgian De Arrascaeta": "乔治安·德阿拉斯卡埃塔",
  "Joaquín Piquerez": "华金·皮克雷斯",
  "Juan Manuel Sanabria": "胡安·曼努埃尔·萨纳布里亚",
  "Khalid Al Ghannam": "哈立德·加纳姆",
  "Maximiliano Araújo": "马克西米利亚诺·阿劳霍",
  "Musab Al Juwayr": "穆萨布·朱韦尔",
  "Nicolás  de la Cruz": "尼古拉斯·德拉克鲁斯",
  "Nicolás de la Cruz": "尼古拉斯·德拉克鲁斯",
  "Rodrigo Zalazar": "罗德里戈·萨拉萨尔",
  "Saleh Al Shehri": "萨利赫·谢赫里",
  "Salem Al Dawsari": "萨勒姆·达瓦萨里",
  "Sultan Mandash": "苏丹·曼达什",
  "Agustín Canobbio": "阿古斯丁·卡诺比奥",
  "Rodrigo Aguirre": "罗德里戈·阿吉雷",
  "Rodrigo Bentancur": "罗德里戈·本坦库尔",
  "Callum McCowatt": "卡勒姆·麦考瓦特",
  "Ali Alipour": "阿里·阿利普尔",
  "Alireza Jahanbakhsh": "阿里雷扎·贾汉巴赫什",
  "Amirhossein Hosseinzadeh": "阿米尔侯赛因·侯赛因扎德",
  "Amirmohammad Razaghinia": "阿米尔穆罕默德·拉扎吉尼亚",
  "Ben Waine": "本·韦恩",
  "Chris Wood": "克里斯·伍德",
  "Dennis Eckert": "丹尼斯·埃克特",
  "Eli Just": "伊莱·贾斯特",
  "Hossein Kanani": "侯赛因·卡纳尼",
  "Jesse Randall": "杰西·兰德尔",
  "Kosta Barbarouses": "科斯塔·巴巴鲁塞斯",
  "Lachlan Bayliss": "拉克兰·贝利斯",
  "Mahdi Torabi": "迈赫迪·托拉比",
  "Matt Garbett": "马特·加贝特",
  "Mehdi Ghayedi": "迈赫迪·盖迪",
  "Mehdi Taremi": "迈赫迪·塔雷米",
  "Théo Hernández": "特奥·埃尔南德斯",
  "Warren Zaïre-Emery": "沃伦·扎伊尔-埃梅里",
  "Manu Koné": "马努·科内",
  "Ousmane Dembélé": "奥斯曼·登贝莱",
  "Sadio Mané": "萨迪奥·马内",
  "Adrien Rabiot": "阿德里安·拉比奥",
  "Assane Diao": "阿桑·迪奥",
  "Bamba Dieng": "班巴·迪昂",
  "Bradley Barcola": "布拉德利·巴尔科拉",
  "Chérif Ndiaye": "谢里夫·恩迪亚耶",
  "Désiré Doué": "德西雷·杜埃",
  "Habib Diarra": "哈比卜·迪亚拉",
  "Ibrahim Mbaye": "易卜拉欣·姆巴耶",
  "Iliman Ndiaye": "伊利曼·恩迪亚耶",
  "Ismaïla Sarr": "伊斯梅拉·萨尔",
  "Jean-Philippe Mateta": "让-菲利普·马特塔",
  "Kylian Mbappé": "基利安·姆巴佩",
  "Kylian Mbappe": "基利安·姆巴佩",
  "Harry Kane": "哈里·凯恩",
  "Erling Haaland": "埃尔林·哈兰德",
  "Lionel Messi": "莱昂内尔·梅西",
  "Cristiano Ronaldo": "克里斯蒂亚诺·罗纳尔多",
  "Jude Bellingham": "裘德·贝林厄姆",
  "Raphinha": "拉菲尼亚",
  "Rodrygo": "罗德里戈",
  "Vinícius Jr.": "维尼修斯",
  "Vinicius Jr.": "维尼修斯",
  "Michael Olise": "迈克尔·奥利塞",
  "Neymar": "内马尔",
  "Pedri": "佩德里",
  "Ronaldo": "罗纳尔多",
  "Messi": "梅西",
  "Maghnes Akliouche": "马格内斯·阿克利乌什",
  "Marko Arnautovic": "马尔科·阿瑙托维奇",
  "Konrad Laimer": "康拉德·莱默",
  "Nicolas Seiwald": "尼古拉斯·赛瓦尔德",
  "Christoph Baumgartner": "克里斯托夫·鲍姆加特纳",
  "Marcel Sabitzer": "马塞尔·萨比策",
  "Xaver Schlager": "哈韦尔·施拉格",
  "Alexander Prass": "亚历山大·普拉斯",
  "Florian Grillitsch": "弗洛里安·格里利奇",
  "Michael Gregoritsch": "迈克尔·格雷戈里奇",
  "Patrick Wimmer": "帕特里克·维默",
  "Romano Schmid": "罗马诺·施密德",
  "Stefan Posch": "斯特凡·波施",
  "Philipp Mwene": "菲利普·姆韦内",
  "Paul Wanner": "保罗·万纳",
  "Saša Kalajdžić": "萨沙·卡拉伊季奇",
  "Alessandro Schöpf": "亚历山德罗·舍普夫",
  "Bruno Fernandes": "布鲁诺·费尔南德斯",
  "Bernardo Silva": "贝尔纳多·席尔瓦",
  "Rafael Leão": "拉斐尔·莱昂",
  "João Félix": "若昂·费利克斯",
  "João Cancelo": "若昂·坎塞洛",
  "João Neves": "若昂·内维斯",
  "Nuno Mendes": "努诺·门德斯",
  "Rúben Neves": "鲁本·内维斯",
  "Gonçalo Ramos": "贡萨洛·拉莫斯",
  "Gonçalo Guedes": "贡萨洛·格德斯",
  "Pedro Neto": "佩德罗·内托",
  "Vitinha": "维蒂尼亚",
  "Francisco Conceição": "弗朗西斯科·孔塞桑",
  "Trincão": "特林康",
  "Samu Costa": "萨穆·科斯塔",
  "Bukayo Saka": "布卡约·萨卡",
  "Declan Rice": "德克兰·赖斯",
  "John Stones": "约翰·斯通斯",
  "Marcus Rashford": "马库斯·拉什福德",
  "Reece James": "里斯·詹姆斯",
  "Eberechi Eze": "埃贝雷奇·埃泽",
  "Anthony Gordon": "安东尼·戈登",
  "Ivan Toney": "伊万·托尼",
  "Ollie Watkins": "奥利·沃特金斯",
  "Morgan Rogers": "摩根·罗杰斯",
  "Elliot Anderson": "埃利奥特·安德森",
  "Ezri Konsa": "埃兹里·孔萨",
  "Marc Guéhi": "马克·格伊",
  "Nico O'Reilly": "尼科·奥赖利",
  "Nico O’Reilly": "尼科·奥赖利",
  "Carney Chukwuemeka": "卡尼·丘库埃梅卡",
  "Noni Madueke": "诺尼·马杜埃凯",
  "Luka Modrić": "卢卡·莫德里奇",
  "Mateo Kovačić": "马特奥·科瓦契奇",
  "Ivan Perišić": "伊万·佩里西奇",
  "Andrej Kramarić": "安德烈·克拉马里奇",
  "Joško Gvardiol": "约什科·格瓦迪奥尔",
  "Nikola Vlašić": "尼科拉·弗拉希奇",
  "Marin Pongračić": "马林·蓬格拉契奇",
  "Luka Sučić": "卢卡·苏契奇",
  "Marco Pašalić": "马尔科·帕沙利奇",
  "Petar Musa": "彼得·穆萨",
  "Ante Budimir": "安特·布迪米尔",
  "Martin Baturina": "马丁·巴图里纳",
  "Josip Stanišić": "约西普·斯塔尼西奇",
  "Igor Matanović": "伊戈尔·马塔诺维奇",
  "Luka Vušković": "卢卡·武什科维奇",
  "Toni Fruk": "托尼·弗鲁克",
  "James Rodríguez": "哈梅斯·罗德里格斯",
  "Luis Díaz": "路易斯·迪亚斯",
  "Jhon Córdoba": "约翰·科尔多瓦",
  "Jhon Arias": "约翰·阿里亚斯",
  "Daniel Muñoz": "丹尼尔·穆尼奥斯",
  "Jefferson Lerma": "杰斐逊·莱尔马",
  "Richard Ríos": "理查德·里奥斯",
  "Luis Suárez": "路易斯·苏亚雷斯",
  "Juan Fernando Quintero": "胡安·费尔南多·金特罗",
  "Jorge Carrascal": "豪尔赫·卡拉斯卡尔",
  "Deiver Machado": "德伊韦尔·马查多",
  "Jaminton Campaz": "哈明顿·坎帕斯",
  "Andrés Gómez": "安德烈斯·戈麦斯",
  "Juan Camilo Portilla": "胡安·卡米洛·波尔蒂利亚",
  "Cucho Hernández": "库乔·埃尔南德斯",
  "Eldor Shomurodov": "埃尔多尔·绍穆罗多夫",
  "Abbosbek Fayzullayev": "阿博斯别克·法伊祖拉耶夫",
  "Jaloliddin Masharipov": "贾洛利丁·马沙里波夫",
  "Azizbek Amonov": "阿齐兹别克·阿莫诺夫",
  "Oston Urunov": "奥斯顿·乌鲁诺夫",
  "Igor Sergeyev": "伊戈尔·谢尔盖耶夫",
  "Aziz Gʻaniyev": "阿齐兹·加尼耶夫",
  "Antoine Semenyo": "安托万·塞门约",
  "Abdul Fatawu Issahaku": "阿卜杜勒·法塔乌·伊萨胡",
  "Ernest Nuamah": "欧内斯特·努阿马",
  "Kamal Deen Sulemana": "卡马尔丁·苏莱曼纳",
  "Christopher Bonsu-Baah": "克里斯托弗·邦苏-巴阿",
  "Caleb Yirenkyi": "卡莱布·伊伦基",
  "Augustine Boakye": "奥古斯丁·博阿基",
  "Brandon Thomas-Asante": "布兰登·托马斯-阿桑特",
  "Prince Adu Kwabena": "普林斯·阿杜·夸贝纳",
  "Kwasi Sibo": "夸西·西博",
  "Iñaki Williams": "伊纳基·威廉姆斯",
  "Jordan Ayew": "约旦·阿尤",
  "Adalberto Carrasquilla": "阿达尔韦托·卡拉斯基利亚",
  "Alberto Quintero": "阿尔贝托·金特罗",
  "José Fajardo": "何塞·法哈多",
  "Cecilio Waterman": "塞西利奥·沃特曼",
  "Ismael Díaz": "伊斯梅尔·迪亚斯",
  "César Yanis": "塞萨尔·亚尼斯",
  "José Luis Rodríguez": "何塞·路易斯·罗德里格斯",
  "Édgar Bárcenas": "埃德加·巴塞纳斯",
  "Azarias Londoño": "阿萨里亚斯·隆多尼奥",
  "Tomás Rodríguez": "托马斯·罗德里格斯",
  "Mousa Ta'mari": "穆萨·塔马里",
  "Ali Olwan": "阿里·奥尔万",
  "Mohammad Ratib": "穆罕默德·拉提卜",
  "Abdallah Al Fakhori": "阿卜杜拉·法胡里",
  "Ali Azaizeh": "阿里·阿扎伊泽",
  "Mohammad Shararah": "穆罕默德·沙拉拉",
  "Ibrahim Sabra": "易卜拉欣·萨布拉",
  "Odeh Fakhoury": "奥德·法胡里",
  "Cédric Bakambu": "塞德里克·巴坎布",
  "Fiston Mayele": "菲斯顿·马耶莱",
  "Yoane Wissa": "约阿内·维萨",
  "Theo Bongonda": "特奥·邦贡达",
  "Gaël Kakuta": "加埃尔·卡库塔",
  "Simon Banza": "西蒙·班扎",
};

const cacheBySlug = new Map();
const chartCache = new Map();
const inFlightBySlug = new Map();
const propsCache = new Map();
const inFlightProps = new Map();
const propEventCache = new Map();
const inFlightPropEvents = new Map();

const awardOrder = [
  "world-cup-golden-boot-winner",
  "world-cup-fair-play-award-winner-20260603201520240",
  "world-cup-young-player-award-winner-20260602160649063",
  "world-cup-silver-boot-winner-20260603195826159",
  "world-cup-bronze-boot-winner-20260603200444388",
  "world-cup-golden-ball-winner-20260603194031758",
  "world-cup-silver-ball-winner-20260603194459107",
  "world-cup-bronze-ball-winner-20260603194938828",
];

const awardTitleBySlug = {
  "world-cup-golden-boot-winner": "世界杯金靴",
  "world-cup-fair-play-award-winner-20260603201520240": "公平竞赛奖得主",
  "world-cup-young-player-award-winner-20260602160649063": "青年球员奖",
  "world-cup-silver-boot-winner-20260603195826159": "银靴奖",
  "world-cup-bronze-boot-winner-20260603200444388": "铜靴奖",
  "world-cup-golden-ball-winner-20260603194031758": "金球奖",
  "world-cup-silver-ball-winner-20260603194459107": "银球奖",
  "world-cup-bronze-ball-winner-20260603194938828": "铜球奖",
};

export function normalizeSlug(value) {
  const slug = String(value || DEFAULT_EVENT_SLUG).trim();
  if (!/^[a-z0-9-]+$/i.test(slug)) throw new Error(`Invalid event slug: ${slug}`);
  return slug;
}

export function normalizePropSlug(value) {
  const slug = String(value || "").trim();
  if (!/^[a-z0-9-]+$/i.test(slug)) throw new Error(`Invalid prop slug: ${slug}`);
  return slug;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "Mozilla/5.0 PolymarketDashboard/1.0",
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} from ${url}`);
  return response.json();
}

export function parseList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function number(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatCent(value) {
  const n = number(value);
  if (n == null) return "-";
  const cents = n * 100;
  const text = cents >= 10 ? cents.toFixed(1) : cents.toFixed(2);
  return `${text.replace(/\.?0+$/, "")}¢`;
}

function formatPercent(value) {
  const n = number(value);
  if (n == null) return "-";
  return `${Math.round(n * 100)}%`;
}

function formatMoney(value) {
  const n = number(value);
  if (n == null) return "--";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2).replace(/\.?0+$/, "")}K`;
  return `$${n.toFixed(0)}`;
}

function translate(value) {
  let text = String(value ?? "");
  for (const [english, chinese] of Object.entries(playerNameMap)) {
    text = text.replaceAll(english, chinese);
  }
  text = text
    .replaceAll("Bosnia and Herzegovina", "波黑")
    .replaceAll("Bosnia-Herzegovina", "波黑")
    .replaceAll("波斯尼亚和黑塞哥维那", "波黑")
    .replaceAll("Canada", "加拿大")
    .replaceAll("France", "法国")
    .replaceAll("Senegal", "塞内加尔")
    .replaceAll("Spain", "西班牙")
    .replaceAll("Cabo Verde", "佛得角")
    .replaceAll("Cape Verde", "佛得角")
    .replaceAll("Côte d'Ivoire", "科特迪瓦")
    .replaceAll("Ivory Coast", "科特迪瓦")
    .replaceAll("Ecuador", "厄瓜多尔")
    .replaceAll("Netherlands", "荷兰")
    .replaceAll("Japan", "日本")
    .replaceAll("Sweden", "瑞典")
    .replaceAll("Tunisia", "突尼斯")
    .replaceAll("Belgium", "比利时")
    .replaceAll("Egypt", "埃及")
    .replaceAll("Saudi Arabia", "沙特阿拉伯")
    .replaceAll("Uruguay", "乌拉圭")
    .replaceAll("IR Iran", "伊朗")
    .replaceAll("Iran", "伊朗")
    .replaceAll("New Zealand", "新西兰")
    .replaceAll("Iraq", "伊拉克")
    .replaceAll("Norway", "挪威")
    .replaceAll("Argentina", "阿根廷")
    .replaceAll("Austria", "奥地利")
    .replaceAll("Jordan", "约旦")
    .replaceAll("DR Congo", "刚果民主共和国")
    .replaceAll("Democratic Republic of the Congo", "刚果民主共和国")
    .replaceAll("Croatia", "克罗地亚")
    .replaceAll("Ghana", "加纳")
    .replaceAll("Panama", "巴拿马")
    .replaceAll("Uzbekistan", "乌兹别克斯坦")
    .replaceAll("Colombia", "哥伦比亚")
    .replaceAll("Czechia", "捷克")
    .replaceAll("Czech Republic", "捷克")
    .replaceAll("South Africa", "南非")
    .replaceAll("Switzerland", "瑞士")
    .replaceAll("Qatar", "卡塔尔")
    .replaceAll("Australia", "澳大利亚")
    .replaceAll("Brazil", "巴西")
    .replaceAll("Germany", "德国")
    .replaceAll("England", "英格兰")
    .replaceAll("Portugal", "葡萄牙")
    .replaceAll("Mexico", "墨西哥")
    .replaceAll("Algeria", "阿尔及利亚")
    .replace(/\bDraw\b/g, "平局")
    .replaceAll("World Cup", "世界杯")
    .replaceAll("FIFA", "国际足联")
    .replaceAll("Golden Boot", "金靴奖")
    .replaceAll("Silver Boot", "银靴奖")
    .replaceAll("Bronze Boot", "铜靴奖")
    .replaceAll("Golden Ball", "金球奖")
    .replaceAll("Silver Ball", "银球奖")
    .replaceAll("Bronze Ball", "铜球奖")
    .replaceAll("Fair Play Award", "公平竞赛奖")
    .replaceAll("Young Player Award", "最佳年轻球员奖")
    .replaceAll("Winner", "得主")
    .replaceAll("top goalscorer", "最佳射手")
    .replaceAll("win the", "赢得")
    .replaceAll("will win", "会赢得")
    .replaceAll("Any Other Score", "其他比分")
    .replaceAll("Neither", "均无")
    .replace(/\bYes\b/g, "是的")
    .replace(/\bNo\b/g, "不")
    .replace(/\bOver\b/g, "大")
    .replace(/\bUnder\b/g, "小")
    .replaceAll("O/U", "大小")
    .replaceAll("Total Corners", "总角球")
    .replaceAll("to Take First Corner", "先开角球")
    .replaceAll("First Corner", "首角球")
    .replaceAll("Halftime Result", "半场结果")
    .replaceAll("Halftime", "半场")
    .replaceAll("Half Time", "半场")
    .replaceAll("Exact Score", "准确比分")
    .replaceAll("Spread", "让球")
    .replaceAll("Both Teams to Score", "双方进球")
    .replaceAll("to score first", "先进球")
    .replaceAll("First Half", "上半场")
    .replaceAll("Second Half", "下半场")
    .replaceAll("1st Half", "上半场")
    .replaceAll("2nd Half", "下半场")
    .replaceAll("Corners", "角球")
    .replace(/\bOdd\b/g, "单")
    .replace(/\bEven\b/g, "双");
  return text
    .replace(/世界杯\s*:\s*/g, "世界杯：")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/:\s*(\d+)\+\s*goals?/gi, "：$1+ 进球")
    .replace(/:\s*(\d+)\+\s*assists?/gi, "：$1+ 助攻")
    .replace(/:\s*(\d+)\+\s*shots?(?:\s+on\s+target)?/gi, "：$1+ 射门")
    .replace(/(\d+)\+\s*goals?/gi, "$1+ 进球")
    .replace(/(\d+)\+\s*assists?/gi, "$1+ 助攻")
    .replace(/(\d+)\+\s*shots?(?:\s+on\s+target)?/gi, "$1+ 射门");
}

function translateOutcome(value) {
  const translated = translate(value).trim();
  if (translated === "是") return "是的";
  if (translated === "否") return "不";
  return translated;
}

function propsCategoryById(id) {
  return propsCategories.find((category) => category.id === id) || propsCategories[0];
}

function activeMarkets(markets = []) {
  return markets.filter((market) => {
    if (market.closed || market.archived || market.active === false) return false;
    const outcomes = parseList(market.outcomes);
    const prices = parseList(market.outcomePrices);
    return outcomes.length && prices.length;
  });
}

function formatPropOutcomeLabel(value) {
  const translated = translateOutcome(value);
  if (translated === "是的") return "YES";
  if (translated === "不") return "NO";
  if (translated === "平局") return "DRAW";
  return translated;
}

function summarizePropMarkets(event) {
  const markets = activeMarkets(event.markets || []);
  const candidates = [];
  for (const market of markets) {
    const outcomes = parseList(market.outcomes);
    const prices = parseList(market.outcomePrices);
    const yesIndex = outcomes.findIndex((outcome) => {
      const value = String(outcome).trim().toLowerCase();
      return value === "yes" || value === "是";
    });
    const indexes = yesIndex >= 0 ? [yesIndex] : outcomes.map((_, index) => index);
    indexes.forEach((index) => {
      const outcome = outcomes[index];
      const price = number(prices[index]);
      if (price == null) return;
      const rawLabel = market.groupItemTitle || outcome;
      const label = formatPropOutcomeLabel(rawLabel);
      candidates.push({
        label,
        price,
        priceText: formatCent(price),
        marketId: market.id,
        image: market.icon || market.image || null,
        question: translate(market.question || event.title),
      });
    });
  }
  const seen = new Set();
  return candidates
    .sort((a, b) => b.price - a.price)
    .filter((item) => {
      const key = `${item.label}:${item.priceText}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

function serializePropEvent(event, category) {
  const tags = (event.tags || []).map((tag) => ({
    id: tag.id,
    slug: tag.slug,
    label: translate(tag.label || tag.slug),
  }));
  return {
    id: event.id,
    slug: event.slug,
    title: awardTitleBySlug[event.slug] || translate(event.title),
    volume: number(event.volume ?? event.volumeNum ?? event.volume_num, 0),
    volumeText: `${formatMoney(event.volume ?? event.volumeNum ?? event.volume_num)} 交易量`,
    image: event.icon || event.image || event.imageOptimized || null,
    category: { id: category.id, label: category.label },
    tags,
    marketsCount: activeMarkets(event.markets || []).length,
    outcomes: summarizePropMarkets(event),
    url: `https://polymarket.com/zh/event/${event.slug}`,
  };
}

function propEventMarketLabel(market) {
  return translate(market.groupItemTitle || market.title || market.question || "候选项").trim();
}

function serializePropEventMarket(market) {
  const outcomes = parseList(market.outcomes);
  const prices = parseList(market.outcomePrices);
  const volume = number(market.volumeNum ?? market.volume_num ?? market.volume, 0);
  return {
    id: market.id,
    slug: market.slug,
    title: propEventMarketLabel(market),
    image: market.icon || market.image || null,
    question: translate(market.question || ""),
    volume,
    volumeText: `${formatMoney(volume)} 交易量`,
    outcomes: outcomes.map((outcome, index) => ({
      label: formatPropOutcomeLabel(outcome),
      rawLabel: String(outcome),
      price: number(prices[index]),
      priceText: formatCent(prices[index]),
    })),
  };
}

function findPropsCategoryForEvent(event) {
  const tagIds = new Set((event.tags || []).map((tag) => Number(tag.id)));
  return propsCategories.find((category) => category.id !== "all" && tagIds.has(category.tagId)) || propsCategories[0];
}

function parseTeams(title) {
  const cleanTitle = translate(title);
  const parts = cleanTitle.split(/\s*vs\.?\s*/i).map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return { home: parts[0], away: parts.slice(1).join(" vs ") };
  return { home: cleanTitle, away: "" };
}

function marketChartLabel(market) {
  const title = translate(market.groupItemTitle || market.question || "");
  if (/平局|draw/i.test(title)) return "平局";
  return title.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

function marketPeriodLabel(type) {
  if (String(type).includes("first_half")) return "上半场";
  if (String(type).includes("second_half")) return "下半场";
  if (type === "soccer_halftime_result") return "半场";
  return "常规时间";
}

function chartColor(label, index, teams = []) {
  const l = String(label || "");
  if (l.includes("平局") || /draw/i.test(l)) return "#7a8491";
  for (const team of teams || []) {
    if (!team?.color) continue;
    const en = String(team.name || "");
    const zh = en ? translate(en) : "";
    const abbr = String(team.abbreviation || "");
    const match = (zh && l.includes(zh)) ||
      (en && new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(l)) ||
      (abbr && l.toUpperCase().includes(abbr.toUpperCase()));
    if (match) return team.color;
  }
  return ["#174ea6", "#7a8491", "#137a3d"][index % 3];
}

function intervalOptions(interval) {
  const key = ["1h", "6h", "1d", "1w", "1m", "all"].includes(interval) ? interval : "all";
  return {
    "1h": { interval: "1h", fidelity: 1 },
    "6h": { interval: "6h", fidelity: 2 },
    "1d": { interval: "1d", fidelity: 10 },
    "1w": { interval: "1w", fidelity: 30 },
    "1m": { interval: "1m", fidelity: 120 },
    all: { interval: "all", fidelity: 120 },
  }[key];
}

function downsample(points, maxPoints = 420) {
  if (!Array.isArray(points) || points.length <= maxPoints) return points || [];
  const result = [];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i += 1) {
    result.push(points[Math.round(i * step)]);
  }
  return result;
}

function normalizeMarket(market) {
  const outcomes = parseList(market.outcomes);
  const prices = parseList(market.outcomePrices);
  const type = market.sportsMarketType || "unknown";
  return {
    id: String(market.id),
    slug: market.slug,
    question: translate(market.question),
    title: translate(market.groupItemTitle || market.question || market.slug),
    type,
    typeLabel: typeLabel[type] || type,
    periodLabel: marketPeriodLabel(type),
    categoryId: typeToCategory.get(type) || "other",
    active: Boolean(market.active),
    closed: Boolean(market.closed),
    volume: number(market.volumeNum ?? market.volume, 0),
    volumeText: `${formatMoney(market.volumeNum ?? market.volume)} 交易量`,
    outcomes: outcomes.map((outcome, index) => ({
      label: translateOutcome(outcome),
      price: number(prices[index]),
      priceText: formatCent(prices[index]),
    })),
  };
}

function buildCategories(markets) {
  const categories = baseCategories.map((category) => ({
    id: category.id,
    label: category.label,
    count: markets.filter((market) => market.categoryId === category.id).length,
  }));
  const otherCount = markets.filter((market) => market.categoryId === "other").length;
  if (otherCount > 0) categories.push({ id: "other", label: "其他", count: otherCount });
  return categories;
}

function isDisplayMarket(market) {
  if (!displayMarketTypes.has(market.sportsMarketType || "unknown")) return false;
  if (market.archived || market.closed) return false;
  const prices = parseList(market.outcomePrices).map((p) => Number(p)).filter((p) => Number.isFinite(p));
  if (prices.length && Math.max(...prices) >= 0.97) return false; // 已基本定胜负，隐藏
  return true;
}

function mergeEventMarkets(events) {
  const seen = new Set();
  const markets = [];
  for (const event of events) {
    for (const market of event.markets || []) {
      if (!isDisplayMarket(market)) continue;
      const key = market.slug || market.conditionId || market.id;
      if (seen.has(key)) continue;
      seen.add(key);
      markets.push({
        ...market,
        events: market.events?.length ? market.events : [{ id: event.id, slug: event.slug, title: event.title }],
      });
    }
  }
  return markets;
}

async function fetchMarketsFromGamma(eventSlug) {
  const slug = normalizeSlug(eventSlug);
  const parentUrl = `${GAMMA_URL}/events/slug/${encodeURIComponent(slug)}?locale=zh`;
  const parent = await fetchJson(parentUrl);
  if (!parent?.id) throw new Error(`Could not find Polymarket event for slug: ${slug}`);

  const childrenParams = new URLSearchParams({
    parent_event_id: String(parent.id),
    include_children: "true",
    limit: "500",
    locale: "zh",
  });
  const childrenResponse = await fetchJson(`${GAMMA_URL}/events/keyset?${childrenParams.toString()}`);
  const childEvents = Array.isArray(childrenResponse.events) ? childrenResponse.events : [];
  const eventList = childEvents.length ? childEvents : [parent];
  const rawMarkets = mergeEventMarkets(eventList);
  // Moneyline markets kept UNFILTERED (settled/closed ones too) so the chart can still
  // read clobTokenIds for ended matches — mergeEventMarkets drops them via isDisplayMarket.
  const moneylineRaw = [];
  const moneylineSeen = new Set();
  for (const source of [parent, ...childEvents]) {
    for (const market of source.markets || []) {
      if (market.sportsMarketType !== "moneyline") continue;
      const seenKey = market.slug || market.conditionId || market.id;
      if (moneylineSeen.has(seenKey)) continue;
      moneylineSeen.add(seenKey);
      moneylineRaw.push(market);
    }
  }
  const event = {
    ...parent,
    markets: rawMarkets,
    moneylineRaw,
    childEventIds: childEvents.filter((event) => String(event.id) !== String(parent.id)).map((event) => String(event.id)),
  };
  const markets = rawMarkets.map(normalizeMarket);

  return {
    data: {
      snapshotAt: new Date().toISOString(),
      source: `${GAMMA_URL}/events/slug/${slug} + ${GAMMA_URL}/events/keyset?parent_event_id=${parent.id}&include_children=true`,
      totalMarkets: markets.length,
      categories: buildCategories(markets),
      event: {
        id: event.id,
        slug: event.slug,
        title: translate(event.title),
        teams: parseTeams(event.title),
        active: Boolean(event.active),
        closed: Boolean(event.closed),
        endDate: event.endDate,
        updatedAt: event.updatedAt,
        gameId: event.gameId,
        childEventIds: event.childEventIds,
        volumeText: `${formatMoney(event.volume ?? event.sportsCardVolume)} Vol.`,
        startTime: event.startTime || event.endDate,
        live: Boolean(event.live),
        ended: Boolean(event.ended),
        score: event.score || "",
        period: event.period || "",
        elapsed: event.elapsed || "",
        sportradarGameId: sportradarMatchId(event.eventMetadata),
        home: fixtureTeamInfo((event.teams || []).find((t) => t.ordering === "home") || (event.teams || [])[0]),
        away: fixtureTeamInfo((event.teams || []).find((t) => t.ordering === "away") || (event.teams || [])[1]),
      },
      markets,
    },
    event,
  };
}

export async function getMarketsForSlug(eventSlug, { force = false } = {}) {
  const slug = normalizeSlug(eventSlug);
  const now = Date.now();
  const cached = cacheBySlug.get(slug);
  if (!force && cached && now - cached.fetchedAt < CACHE_MS) return cached.data;
  if (inFlightBySlug.has(slug)) return inFlightBySlug.get(slug);

  const inFlight = fetchMarketsFromGamma(slug)
    .then(({ data, event }) => {
      cacheBySlug.set(slug, { fetchedAt: Date.now(), data, event });
      return data;
    })
    .finally(() => {
      inFlightBySlug.delete(slug);
    });
  inFlightBySlug.set(slug, inFlight);

  return inFlight;
}

async function getRawEvent(eventSlug = DEFAULT_EVENT_SLUG) {
  const slug = normalizeSlug(eventSlug);
  if (!cacheBySlug.get(slug)?.event) await getMarketsForSlug(slug, { force: false });
  return cacheBySlug.get(slug)?.event;
}

async function fetchBatchPriceHistory(markets, interval) {
  const options = intervalOptions(interval);
  const response = await fetch(`${CLOB_URL}/batch-prices-history`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "user-agent": "Mozilla/5.0 PolymarketDashboard/1.0",
    },
    body: JSON.stringify({
      markets,
      interval: options.interval,
      fidelity: options.fidelity,
    }),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} from prices history`);
  return response.json();
}

export async function getChart(interval = "all", eventSlug = DEFAULT_EVENT_SLUG) {
  const slug = normalizeSlug(eventSlug);
  const key = ["1h", "6h", "1d", "1w", "1m", "all"].includes(interval) ? interval : "all";
  const cacheKey = `${slug}:${key}`;
  const cached = chartCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CHART_CACHE_MS) return cached.data;

  const event = await getRawEvent(slug);
  // Only bail if the event itself is missing. A fully-settled match has all display
  // markets filtered out (event.markets empty) but moneylineRaw still holds the
  // settled moneyline tokens, so the chart can still render its history.
  if (!event) throw new Error("No cached event data available for chart");

  // Prefer the unfiltered moneyline list (keeps settled markets for ended games);
  // fall back to display markets for older cache entries.
  let moneylineMarkets = (event.moneylineRaw || []).slice(0, 3);
  if (!moneylineMarkets.length) {
    moneylineMarkets = event.markets
      .filter((market) => market.sportsMarketType === "moneyline")
      .slice(0, 3);
  }
  const chartMarkets = moneylineMarkets.map((market, index) => {
    const outcomes = parseList(market.outcomes);
    const prices = parseList(market.outcomePrices);
    const tokenIds = parseList(market.clobTokenIds);
    const yesIndex = Math.max(0, outcomes.findIndex((outcome) => String(outcome).toLowerCase() === "yes"));
    const label = marketChartLabel(market);
    return {
      label,
      color: chartColor(label, index, event.teams),
      tokenId: tokenIds[yesIndex],
      current: number(prices[yesIndex]),
    };
  }).filter((market) => market.tokenId);

  if (!chartMarkets.length) {
    const empty = {
      snapshotAt: new Date().toISOString(),
      interval: key,
      source: `${CLOB_URL}/batch-prices-history`,
      event: {
        title: translate(event.title),
        volumeText: `${formatMoney(event.volume ?? event.sportsCardVolume)} Vol.`,
      },
      series: [],
    };
    chartCache.set(cacheKey, { fetchedAt: now, data: empty });
    return empty;
  }

  const historyResponse = await fetchBatchPriceHistory(chartMarkets.map((market) => market.tokenId), key);
  const series = chartMarkets.map((market) => {
    const points = downsample((historyResponse.history?.[market.tokenId] || [])
      .map((point) => ({ t: number(point.t), p: number(point.p) }))
      .filter((point) => point.t != null && point.p != null)
      .sort((a, b) => a.t - b.t));
    const lastPoint = points.at(-1);
    const current = market.current ?? lastPoint?.p ?? null;
    return {
      label: market.label,
      color: market.color,
      current,
      currentText: formatPercent(current),
      history: points,
    };
  });

  const data = {
    snapshotAt: new Date().toISOString(),
    interval: key,
    source: `${CLOB_URL}/batch-prices-history`,
    event: {
      title: translate(event.title),
      volumeText: `${formatMoney(event.volume ?? event.sportsCardVolume)} Vol.`,
    },
    series,
  };
  chartCache.set(cacheKey, { fetchedAt: now, data });
  return data;
}

async function fetchPropsPage(category, cursor = null, limit = 100) {
  const params = new URLSearchParams({
    tag_id: String(category.tagId),
    related_tags: "true",
    closed: "false",
    limit: String(limit),
    include_best_lines: "true",
    locale: "zh",
  });
  if (cursor) params.set("after_cursor", cursor);
  return fetchJson(`${GAMMA_URL}/events/keyset?${params}`);
}

async function fetchPropsCategory(category) {
  const events = [];
  let cursor = null;
  for (let page = 0; page < 8; page += 1) {
    const data = await fetchPropsPage(category, cursor);
    const pageEvents = Array.isArray(data.events) ? data.events : [];
    events.push(...pageEvents);
    if (!data.next_cursor || data.next_cursor === cursor || !pageEvents.length) break;
    cursor = data.next_cursor;
  }
  const unique = new Map();
  for (const event of events) {
    if (!event?.slug || unique.has(event.slug)) continue;
    if (!activeMarkets(event.markets || []).length) continue;
    unique.set(event.slug, serializePropEvent(event, category));
  }
  const serialized = Array.from(unique.values());
  if (category.id === "world-cup-awards") {
    return serialized.sort((a, b) => {
      const ai = awardOrder.indexOf(a.slug);
      const bi = awardOrder.indexOf(b.slug);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      return b.volume - a.volume;
    });
  }
  return serialized.sort((a, b) => b.volume - a.volume);
}

export async function getWorldCupProps(categoryId = "all", { force = false } = {}) {
  const category = propsCategoryById(categoryId);
  const cacheKey = category.id;
  const now = Date.now();
  const cached = propsCache.get(cacheKey);
  if (!force && cached && now - cached.fetchedAt < PROPS_CACHE_MS) return cached.data;
  if (inFlightProps.has(cacheKey)) return inFlightProps.get(cacheKey);

  const inFlight = fetchPropsCategory(category)
    .then((events) => {
      const data = {
        snapshotAt: new Date().toISOString(),
        source: `${GAMMA_URL}/events/keyset?tag_id=${category.tagId}&related_tags=true&closed=false&include_best_lines=true`,
        category: { id: category.id, label: category.label },
        categories: propsCategories,
        totalEvents: events.length,
        events,
      };
      propsCache.set(cacheKey, { fetchedAt: Date.now(), data });
      return data;
    })
    .finally(() => {
      inFlightProps.delete(cacheKey);
    });
  inFlightProps.set(cacheKey, inFlight);
  return inFlight;
}

async function fetchPropEventFromGamma(propSlug) {
  const slug = normalizePropSlug(propSlug);
  const event = await fetchJson(`${GAMMA_URL}/events/slug/${slug}?locale=zh`);
  const category = findPropsCategoryForEvent(event);
  const markets = activeMarkets(event.markets || [])
    .map(serializePropEventMarket)
    .sort((a, b) => {
      const ap = a.outcomes.find((outcome) => outcome.rawLabel.toLowerCase() === "yes" || outcome.rawLabel === "是")?.price ?? 0;
      const bp = b.outcomes.find((outcome) => outcome.rawLabel.toLowerCase() === "yes" || outcome.rawLabel === "是")?.price ?? 0;
      return bp - ap;
    });

  return {
    snapshotAt: new Date().toISOString(),
    source: `${GAMMA_URL}/events/slug/${slug}`,
    event: {
      id: event.id,
      slug: event.slug,
      title: awardTitleBySlug[event.slug] || translate(event.title),
      description: translate(event.description || ""),
      category: { id: category.id, label: category.label },
      volume: number(event.volume ?? event.volumeNum ?? event.volume_num, 0),
      volumeText: `${formatMoney(event.volume ?? event.volumeNum ?? event.volume_num)} 交易量`,
      marketsCount: markets.length,
      active: Boolean(event.active),
      closed: Boolean(event.closed),
      updatedAt: event.updatedAt,
      endDate: event.endDate,
    },
    markets,
  };
}

export async function getWorldCupPropEvent(propSlug, { force = false } = {}) {
  const slug = normalizePropSlug(propSlug);
  const now = Date.now();
  const cached = propEventCache.get(slug);
  if (!force && cached && now - cached.fetchedAt < PROPS_CACHE_MS) return cached.data;
  if (inFlightPropEvents.has(slug)) return inFlightPropEvents.get(slug);

  const inFlight = fetchPropEventFromGamma(slug)
    .then((data) => {
      propEventCache.set(slug, { fetchedAt: Date.now(), data });
      return data;
    })
    .finally(() => {
      inFlightPropEvents.delete(slug);
    });
  inFlightPropEvents.set(slug, inFlight);
  return inFlight;
}

export const FIXTURES_SERIES_ID = process.env.WC_SERIES_ID || "11433";
// Polymarket tags every soccer match with 100350 ("Soccer") and expresses the
// competition as a series, so one tag sweep mirrors its whole soccer section
// and new leagues show up without a hardcoded list. Set WC_SERIES_ID to pin
// back to a single series (e.g. 11433 for the World Cup archive).
export const SOCCER_TAG_ID = process.env.SOCCER_TAG_ID || "100350";
export const USE_SOCCER_TAG = process.env.WC_SERIES_ID ? false : true;
export const FIXTURES_CACHE_MS = Number(process.env.FIXTURES_CACHE_MS || 30000);
let fixturesCache = null;
let fixturesInFlight = null;

// Extract the numeric Sportradar match id from eventMetadata.
// e.g. "sr:sport_event:66457030" -> "66457030". Returns "" when absent.
// Used as the upgrade seam: the frontend can later embed Sportradar's LMT widget
// with this id (requires our own Sportradar widget client ID — see design doc).
function sportradarMatchId(eventMetadata) {
  try {
    const md = typeof eventMetadata === "string" ? JSON.parse(eventMetadata) : (eventMetadata || {});
    const raw = md.sportradarGameId || md.sportradar_game_id || "";
    const m = String(raw).match(/(\d+)\s*$/);
    return m ? m[1] : "";
  } catch {
    return "";
  }
}

function fixtureTeamInfo(team) {
  if (!team) return null;
  return {
    name: team.name,
    nameZh: translate(team.name),
    abbr: String(team.abbreviation || "").toUpperCase(),
    flag: team.logo || null,
    color: team.color || null,
    record: team.record || "",
  };
}

function serializeFixture(event) {
  const teams = Array.isArray(event.teams) ? event.teams : [];
  const home = fixtureTeamInfo(teams.find((t) => t.ordering === "home") || teams[0]);
  const away = fixtureTeamInfo(teams.find((t) => t.ordering === "away") || teams[1]);
  const sideOf = (market) => {
    const text = String(market.groupItemTitle || market.question || "").toLowerCase();
    if (/draw|平局/.test(text)) return "draw";
    if (home?.name && text.includes(home.name.toLowerCase())) return "home";
    if (away?.name && text.includes(away.name.toLowerCase())) return "away";
    return null;
  };
  const moneyline = (event.markets || [])
    .filter((market) => market.sportsMarketType === "moneyline")
    .map((market) => {
      const outcomes = parseList(market.outcomes);
      const prices = parseList(market.outcomePrices);
      const yesIndex = Math.max(0, outcomes.findIndex((o) => String(o).toLowerCase() === "yes"));
      const price = number(prices[yesIndex]);
      const side = sideOf(market);
      const label = side === "draw" ? "平局"
        : side === "home" ? (home?.abbr || translate(market.groupItemTitle || ""))
        : side === "away" ? (away?.abbr || translate(market.groupItemTitle || ""))
        : translate(market.groupItemTitle || "");
      return { side, label, price, priceText: formatCent(price) };
    })
    .filter((item) => item.side);
  const order = { home: 0, draw: 1, away: 2 };
  moneyline.sort((a, b) => (order[a.side] ?? 9) - (order[b.side] ?? 9));
  const volume = number(event.volume ?? event.volumeNum, 0);
  const series = Array.isArray(event.series) ? event.series[0] : null;
  return {
    slug: event.slug,
    title: translate(event.title),
    league: series ? translate(series.title || series.slug || "") : "",
    kickoff: event.endDate,
    closed: Boolean(event.closed),
    volume,
    volumeText: `${formatMoney(volume)} 交易量`,
    home,
    away,
    moneyline,
  };
}

async function fetchFixtures(days = 30) {
  const now = Date.now();
  const min = new Date(now - 3 * 3600 * 1000).toISOString();
  const max = new Date(now + days * 24 * 3600 * 1000).toISOString();
  let events = [];

  if (USE_SOCCER_TAG) {
    // Tag sweep across all competitions. /events/keyset caps at 100 per page,
    // so follow next_cursor — without it only the first league comes back.
    const seen = new Map();
    let cursor = null;
    for (let page = 0; page < 25; page += 1) {
      const params = new URLSearchParams({
        tag_id: SOCCER_TAG_ID,
        related_tags: "true",
        closed: "false",
        end_date_min: min,
        end_date_max: max,
        limit: "100",
        locale: "zh",
      });
      if (cursor) params.set("after_cursor", cursor);
      const page_ = await fetchJson(`${GAMMA_URL}/events/keyset?${params.toString()}`);
      const pageEvents = Array.isArray(page_?.events) ? page_.events : [];
      for (const event of pageEvents) if (event?.slug && !seen.has(event.slug)) seen.set(event.slug, event);
      if (!page_?.next_cursor || page_.next_cursor === cursor || !pageEvents.length) break;
      cursor = page_.next_cursor;
    }
    events = [...seen.values()];
  } else {
    const params = new URLSearchParams({
      series_id: FIXTURES_SERIES_ID,
      closed: "false",
      end_date_min: min,
      end_date_max: max,
      limit: "200",
      order: "endDate",
      ascending: "true",
      locale: "zh",
    });
    const response = await fetchJson(`${GAMMA_URL}/events?${params.toString()}`);
    events = Array.isArray(response) ? response : [];
  }
  const seen = new Set();
  const fixtures = [];
  for (const event of events) {
    if (!Array.isArray(event.markets)) continue;
    if (!event.markets.some((market) => market.sportsMarketType === "moneyline")) continue;
    if (seen.has(event.slug)) continue;
    seen.add(event.slug);
    const ts = new Date(event.endDate).getTime();
    if (!Number.isFinite(ts) || ts < now - 3 * 3600 * 1000 || ts > now + days * 24 * 3600 * 1000) continue;
    fixtures.push(serializeFixture(event));
  }
  fixtures.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  return {
    snapshotAt: new Date().toISOString(),
    source: `${GAMMA_URL}/events?series_id=${FIXTURES_SERIES_ID}&end_date_min&end_date_max`,
    count: fixtures.length,
    fixtures,
  };
}

export async function getFixtures({ force = false, days = 30 } = {}) {
  const now = Date.now();
  if (!force && fixturesCache && now - fixturesCache.fetchedAt < FIXTURES_CACHE_MS) return fixturesCache.data;
  if (fixturesInFlight) return fixturesInFlight;
  fixturesInFlight = fetchFixtures(days)
    .then((data) => {
      fixturesCache = { fetchedAt: Date.now(), data };
      return data;
    })
    .catch((error) => {
      if (fixturesCache) return fixturesCache.data;
      throw error;
    })
    .finally(() => {
      fixturesInFlight = null;
    });
  return fixturesInFlight;
}

export function getHealth() {
  return {
    status: "ok",
    cachedSlugs: Array.from(cacheBySlug.keys()),
    cachedProps: Array.from(propsCache.keys()),
    cachedPropEvents: Array.from(propEventCache.keys()),
    defaultSlug: DEFAULT_EVENT_SLUG,
    now: new Date().toISOString(),
  };
}
