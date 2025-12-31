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
  tutorialShown: false, // has the tutorial been shown
  tutorialStep: 0, // current tutorial step (0-4)
  showTutorial: false, // currently showing tutorial overlay
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
  { level: 2, title: "主任", expRequired: 30, bonus: "スピード+5%" },
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
  canDoubleJump: true, // double jump ability flag
  coins: 0, // お金
  connections: 0, // 人脈ポイント
  // スキル/パワーアップシステム
  activeSkill: null, // 現在発動中のスキル
  skillTimer: 0, // スキル残り時間
  speedBoost: false, // スピードアップ
  jumpBoost: false, // ジャンプ力アップ
  invincible: false, // 無敵状態
  magnetActive: false, // アイテム吸引
};

// Collectibles in the stage
let collectibles = []; // { type: "coin" | "connection", x, y, collected }

function enemyTemplate(type) {
  // 敵の基本テンプレート - 踏み付けで倒せる、アイテムをドロップする
  const base = {
    type,
    x: 0, y: 0, w: 28, h: 36,
    vx: 0.8, vy: 0,
    dir: -1,
    patrol: 80,
    originX: 0,
    hostile: true,
    contactDamage: 1,
    dropType: "coin", // ドロップするアイテムの種類
    defeated: false, // 倒されたかどうか
    isBoss: false,
    bossHP: 1, // ボスは複数回踏み付けが必要
    bossPhase: 0,
  };

  // 敵タイプごとの設定
  if (type === "competitor") {
    // 競合営業マン - 素早い動き
    return { ...base,
      vx: 1.0, patrol: 120, dropType: "coin"
    };
  }
  if (type === "buyer") {
    // バイヤー - 人脈をドロップ
    return { ...base,
      vx: 0.6, patrol: 70, dropType: "connection"
    };
  }
  if (type === "broker") {
    // ブローカー - ランダムなパワーアップ
    return { ...base,
      vx: 1.0, patrol: 110, dropType: "powerup"
    };
  }
  if (type === "executive") {
    // 重役 - 大量のコイン
    return { ...base,
      vx: 1.1, patrol: 140, dropType: "coins3"
    };
  }
  if (type === "union") {
    // 組合代表 - 人脈
    return { ...base,
      vx: 0.8, patrol: 150, dropType: "connection"
    };
  }
  if (type === "government") {
    // 政府官僚 - パワーアップ
    return { ...base,
      vx: 0.95, patrol: 170, dropType: "powerup"
    };
  }
  if (type === "media") {
    // メディア記者 - 避けるべき敵（踏み付け不可）
    return { ...base,
      vx: 1.3, patrol: 220, dropType: "none",
      unstompable: true // 踏めない
    };
  }
  if (type === "gatekeeper") {
    // ゲートキーパー - コインをドロップ
    return { ...base,
      vx: 0.5, patrol: 60, dropType: "coin"
    };
  }
  
  // === BOSS CHARACTERS ===
  if (type === "boss_market") {
    return { ...base,
      vx: 0.5, patrol: 60,
      w: 36, h: 44,
      isBoss: true,
      bossPhase: 1,
      bossHP: 3,
      dropType: "powerup"
    };
  }
  if (type === "boss_office") {
    return { ...base,
      vx: 0.4, patrol: 40,
      w: 38, h: 46,
      isBoss: true,
      bossPhase: 1,
      bossHP: 3,
      dropType: "powerup"
    };
  }
  if (type === "boss_port") {
    return { ...base,
      vx: 0.3, patrol: 30,
      w: 40, h: 48,
      isBoss: true,
      bossPhase: 1,
      bossHP: 3,
      dropType: "powerup"
    };
  }
  
  return base;
}

let enemies = [];
let breakTiles = new Map(); // key "x,y" -> remaining durability

// アイテムボックス（?ブロック）の状態管理
let itemBoxes = new Map(); // key "x,y" -> { used: boolean, itemType: string }

// フィールド上のパワーアップアイテム
let powerUps = []; // { type: string, x, y, vy, active }

// スキル定義
const SKILLS = {
  speed: { name: "スピードアップ", duration: 600, color: "#ffd700", icon: "⚡" },
  jump: { name: "ジャンプ強化", duration: 600, color: "#4ecdc4", icon: "🦘" },
  invincible: { name: "無敵", duration: 300, color: "#ff69b4", icon: "⭐" },
  magnet: { name: "アイテム吸引", duration: 480, color: "#9b59b6", icon: "🧲" },
};

// スキルを発動
function activateSkill(skillType) {
  const skill = SKILLS[skillType];
  if (!skill) return;
  
  player.activeSkill = skillType;
  player.skillTimer = skill.duration;
  
  // 各スキルのフラグをセット
  if (skillType === "speed") player.speedBoost = true;
  if (skillType === "jump") player.jumpBoost = true;
  if (skillType === "invincible") player.invincible = true;
  if (skillType === "magnet") player.magnetActive = true;
  
  createParticles(player.x + player.w/2, player.y + player.h/2, "powerup", 15);
  playSFX("levelUp");
  say(`${skill.icon} ${skill.name}発動！`, 120);
}

// スキルタイマー更新
function updateSkillTimer() {
  if (player.skillTimer > 0) {
    player.skillTimer--;
    if (player.skillTimer <= 0) {
      // スキル終了
      player.speedBoost = false;
      player.jumpBoost = false;
      player.invincible = false;
      player.magnetActive = false;
      player.activeSkill = null;
      say("スキル効果が切れた", 80);
    }
  }
}
