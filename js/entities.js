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
  state: "topmenu", // topmenu | headquarters | branch | transit | select | intro | play | clear | gameover
  introLine: 0,
  alert: 0, // 0..3 affects enemies
  message: "",
  messageT: 0,
  selectedStage: 0, // for stage select screen
  topMenuSelection: 0, // 0: headquarters, 1: branch, 2: transit
  branchSelection: 0, // sub-menu selection for branch
  headquartersSelection: 0, // sub-menu selection for headquarters
};

// Global player stats (persistent across stages)
const playerGlobal = {
  savings: 10, // 貯金（初期値）
  networkTotal: 5, // 人脈蓄積（初期値）
  outfit: 0, // 着せ替えスタイル（0: default, 1+: unlocked outfits）
  outfitsUnlocked: [true, false, false], // 解放済み着せ替え
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
  return base;
}

let enemies = [];
let breakTiles = new Map(); // key "x,y" -> remaining durability
