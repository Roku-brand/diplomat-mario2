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
  state: "intro", // intro | play | clear | gameover
  introLine: 0,
  alert: 0, // 0..3 affects enemies
  message: "",
  messageT: 0,
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
  trust: 100, // 0..100
  hp: 3,
  dashT: 0,
  dashCD: 0,
  negotiating: null, // enemy ref when negotiating
  negoProgress: 0,
  canDoubleJump: true, // double jump ability flag
};

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
  };

  if (type === "militia") {
    return { ...base,
      vx: 0.9, patrol: 120, difficulty: 1.1, aggroRange: 170,
      talkText: "民兵：『通行は許可制だ。理由を言え』"
    };
  }
  if (type === "caravan") {
    return { ...base,
      vx: 0.6, patrol: 70, hostile: false, stance: "neutral",
      difficulty: 0.9, aggroRange: 120,
      talkText: "輸送隊：『安全保証があるなら通す。書類は？』"
    };
  }
  if (type === "poacher") {
    return { ...base,
      vx: 1.0, patrol: 110, difficulty: 1.0, aggroRange: 170,
      talkText: "密猟者：『金か、見逃しか。どっちだ』"
    };
  }
  if (type === "guerrilla") {
    return { ...base,
      vx: 1.1, patrol: 140, difficulty: 1.6, aggroRange: 210,
      talkText: "ゲリラ：『正義を語るな。代案を出せ』"
    };
  }
  if (type === "riot") {
    return { ...base,
      vx: 0.8, patrol: 150, difficulty: 1.2, aggroRange: 190,
      talkText: "群衆：『真実を隠してるのか？』"
    };
  }
  if (type === "security") {
    return { ...base,
      vx: 0.95, patrol: 170, difficulty: 1.9, aggroRange: 240,
      talkText: "治安：『許可番号を提示しろ。ないなら引き返せ』"
    };
  }
  if (type === "drone") {
    return { ...base,
      vx: 1.3, patrol: 220, negotiable: false, difficulty: 999,
      aggroRange: 260, talkText: "ドローン：交渉不可（回避せよ）"
    };
  }
  return base;
}

let enemies = [];
let breakTiles = new Map(); // key "x,y" -> remaining durability
