/**
 * Game state, player, and enemy templates
 */

const game = {
  stageIndex: 0,
  stage: null,
  map: null,
  mapW: 0,
  mapH: 0,
  cameraX: 0,
  cameraY: 0,
  time: 0,
  state: "topmenu", // topmenu | headquarters | branch | transit | select | intro | play | clear | gameover | dictionary | bossIntro | bossBattle
  introLine: 0,
  alert: 0, // 0..3 affects enemies
  message: "",
  messageT: 0,
  selectedStage: 0, // for stage select screen
  topMenuSelection: 0, // 0: headquarters, 1: branch, 2: transit, 3: dictionary
  branchSelection: 0, // sub-menu selection for branch
  headquartersSelection: 0, // sub-menu selection for headquarters
  dictionaryPage: 0, // current page in connection dictionary
  bossPhase: 0, // boss battle phase
  bossDefeated: false, // whether current boss is defeated
  defeatEffects: [], // visual effects for enemy defeats { x, y, timer, type, text }
};

// Global player stats (persistent across stages)
const playerGlobal = {
  savings: 10, // 貯金（初期値）
  networkTotal: 5, // 人脈蓄積（初期値）
  outfit: 0, // 着せ替えスタイル（0: default, 1+: unlocked outfits）
  outfitsUnlocked: [true, false, false], // 解放済み着せ替え
  // Career advancement (出世システム)
  careerLevel: 1, // 1=新人, 2=主任, 3=課長, 4=部長, 5=役員
  careerExp: 0, // experience towards next level
  totalContracts: 0, // total contracts signed
  // Connection dictionary (人脈図鑑)
  connectionDict: {}, // key: enemy type, value: { met: boolean, negotiated: boolean, allied: boolean, count: int }
  stagesCleared: [false, false, false], // track which stages are cleared
};

// Career level definitions
const CAREER_LEVELS = [
  { level: 1, title: "新人営業", expRequired: 0, bonus: "なし" },
  { level: 2, title: "主任", expRequired: 30, bonus: "交渉成功率+5%" },
  { level: 3, title: "課長", expRequired: 80, bonus: "初期コイン+2" },
  { level: 4, title: "部長", expRequired: 150, bonus: "初期人脈+1" },
  { level: 5, title: "役員", expRequired: 300, bonus: "全ボーナス適用" },
];

// Connection dictionary entries
const CONNECTION_TYPES = {
  competitor: { name: "競合営業", description: "ライバル企業の営業マン。激しい競争の中で切磋琢磨。", category: "ビジネス" },
  buyer: { name: "バイヤー", description: "取引先の購買担当。価格と品質を見極める目利き。", category: "顧客" },
  broker: { name: "ブローカー", description: "仲介業者。広いネットワークと情報を持つ。", category: "仲介" },
  executive: { name: "重役", description: "大企業の意思決定者。論理と数字で動く。", category: "VIP" },
  union: { name: "組合代表", description: "労働者の代弁者。現場の声を届ける。", category: "労働" },
  government: { name: "官僚", description: "許認可を握る政府職員。手続きと書類が命。", category: "行政" },
  media: { name: "記者", description: "情報を追う報道関係者。交渉不可だが避けるべし。", category: "メディア" },
  gatekeeper: { name: "受付", description: "ゲートキーパー。アポなしでは通さない門番。", category: "窓口" },
  boss_market: { name: "海外バイヤー長", description: "展示会の最重要人物。大型契約の鍵を握る。", category: "ボス" },
  boss_office: { name: "CEO", description: "本社の最高責任者。会社の命運を左右する。", category: "ボス" },
  boss_port: { name: "通関局長", description: "港湾の最終権限者。輸出入の成否を決める。", category: "ボス" },
};

const player = {
  x: 2*TILE,
  y: 6*TILE,
  w: 26,
  h: 40,
  vx: 0,
  vy: 0,
  onGround: false,
  face: 1,
  trust: 100, // 0..100 reputation/信頼
  hp: 3,
  dashT: 0,
  dashCD: 0,
  negotiating: null, // enemy ref when negotiating
  negoProgress: 0,
  canDoubleJump: true, // double jump ability flag
  coins: 0, // お金（交渉材料）
  connections: 0, // 人脈ポイント（交渉材料）
};

// Collectibles in the stage
let collectibles = []; // { type: "coin" | "connection", x, y, collected }

function enemyTemplate(type) {
  // negotiable: true/false; difficulty affects required time; hostility affects contact damage
  const base = {
    type,
    x: 0, y: 0, w: 28, h: 36,
    vx: 0.8, vy: 0,
    dir: -1,
    patrol: 80,
    originX: 0,
    hostile: true,
    negotiable: true,
    difficulty: 1.0,  // higher = slower progress / more failure chance
    stance: "hostile", // hostile | neutral | allied
    aggroRange: 160,
    contactDamage: 1,
    talkText: "",
    isGateGuard: false, // true if this enemy blocks a negotiation gate
  };

  // 商社マン向けの敵キャラクター
  if (type === "competitor") {
    // 競合企業の営業マン
    return { ...base,
      vx: 0.9, patrol: 120, difficulty: 1.1, aggroRange: 170,
      talkText: "競合営業：『この案件はウチが先に動いてる。引けよ』"
    };
  }
  if (type === "buyer") {
    // バイヤー（取引先）
    return { ...base,
      vx: 0.6, patrol: 70, hostile: false, stance: "neutral",
      difficulty: 0.9, aggroRange: 120,
      talkText: "バイヤー：『価格と納期、両方クリアできるか？』"
    };
  }
  if (type === "broker") {
    // 仲介業者
    return { ...base,
      vx: 1.0, patrol: 110, difficulty: 1.0, aggroRange: 170,
      talkText: "ブローカー：『紹介料は？それとも別ルートで行く？』"
    };
  }
  if (type === "executive") {
    // 大企業の重役
    return { ...base,
      vx: 1.1, patrol: 140, difficulty: 1.6, aggroRange: 210,
      talkText: "重役：『数字で語れ。情緒では動かん』"
    };
  }
  if (type === "union") {
    // 労働組合代表
    return { ...base,
      vx: 0.8, patrol: 150, difficulty: 1.2, aggroRange: 190,
      talkText: "組合代表：『労働者の権利を無視するのか？』"
    };
  }
  if (type === "government") {
    // 政府官僚
    return { ...base,
      vx: 0.95, patrol: 170, difficulty: 1.9, aggroRange: 240,
      talkText: "官僚：『許認可がなければ話にならん。書類は？』"
    };
  }
  if (type === "media") {
    // メディア記者（交渉不可）
    return { ...base,
      vx: 1.3, patrol: 220, negotiable: false, difficulty: 999,
      aggroRange: 260, talkText: "記者：交渉不可（スキャンダルを避けろ）"
    };
  }
  if (type === "gatekeeper") {
    // 交渉ゲートの門番（交渉必須）
    return { ...base,
      vx: 0, patrol: 0, difficulty: 1.3, aggroRange: 300,
      isGateGuard: true,
      talkText: "受付：『アポなしでは通せません。交渉してください』"
    };
  }
  
  // === BOSS CHARACTERS ===
  if (type === "boss_market") {
    // Stage 1 Boss: 海外バイヤー長
    return { ...base,
      vx: 0.5, patrol: 60, difficulty: 2.0, aggroRange: 350,
      w: 36, h: 44, // larger size
      isBoss: true,
      bossPhase: 1, // 1-3 phases
      bossHP: 3, // requires 3 successful negotiations
      hostile: false, stance: "neutral",
      talkText: "バイヤー長：『君の会社に興味がある。本気度を見せてもらおう』"
    };
  }
  if (type === "boss_office") {
    // Stage 2 Boss: CEO
    return { ...base,
      vx: 0.4, patrol: 40, difficulty: 2.5, aggroRange: 400,
      w: 38, h: 46,
      isBoss: true,
      bossPhase: 1,
      bossHP: 3,
      hostile: false, stance: "neutral",
      talkText: "CEO：『我が社との提携を望むなら、それ相応の覚悟を見せろ』"
    };
  }
  if (type === "boss_port") {
    // Stage 3 Boss: 通関局長
    return { ...base,
      vx: 0.3, patrol: 30, difficulty: 3.0, aggroRange: 450,
      w: 40, h: 48,
      isBoss: true,
      bossPhase: 1,
      bossHP: 3,
      hostile: false, stance: "neutral",
      talkText: "通関局長：『すべての書類と許可が揃っているか確認する』"
    };
  }
  
  return base;
}

let enemies = [];
let breakTiles = new Map(); // key "x,y" -> remaining durability
