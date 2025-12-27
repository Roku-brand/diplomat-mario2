/**
 * Negotiation system with interactive choices
 */

// Negotiation state
const negoState = {
  phase: "idle", // idle | approach | choice | resolving
  selectedChoice: 0,
  choices: [],
  resolveTimer: 0,
  lastResult: null,
};

// Choice definitions for each enemy type
const NEGOTIATION_CHOICES = {
  militia: {
    prompt: "民兵：『通行は許可制だ。理由を言え』",
    options: [
      { text: "監察団の公務だ。中立を保証する", type: "formal", successRate: 0.7, trustGain: 5, alertMod: 0 },
      { text: "あなたたちの正義を理解している", type: "empathy", successRate: 0.8, trustGain: 8, alertMod: -1 },
      { text: "通さないと上に報告する", type: "threat", successRate: 0.4, trustGain: 0, alertMod: 1 },
    ]
  },
  caravan: {
    prompt: "輸送隊：『安全保証があるなら通す。書類は？』",
    options: [
      { text: "正式な通行許可証がある", type: "formal", successRate: 0.85, trustGain: 6, alertMod: -1 },
      { text: "状況報告と引き換えに通行を", type: "trade", successRate: 0.75, trustGain: 10, alertMod: 0 },
      { text: "急いでいる。形式は後で", type: "rush", successRate: 0.3, trustGain: 0, alertMod: 1 },
    ]
  },
  poacher: {
    prompt: "密猟者：『金か、見逃しか。どっちだ』",
    options: [
      { text: "撤退すれば通報しない", type: "bargain", successRate: 0.7, trustGain: 5, alertMod: 0 },
      { text: "別の稼ぎ場所を教える", type: "redirect", successRate: 0.8, trustGain: 8, alertMod: -1 },
      { text: "金はない。力ずくか？", type: "confront", successRate: 0.35, trustGain: 0, alertMod: 2 },
    ]
  },
  guerrilla: {
    prompt: "ゲリラ：『正義を語るな。代案を出せ』",
    options: [
      { text: "あなたの主張を報告書に載せる", type: "voice", successRate: 0.75, trustGain: 12, alertMod: 0 },
      { text: "撤退路を示す。損失を減らせ", type: "tactical", successRate: 0.85, trustGain: 10, alertMod: -1 },
      { text: "これ以上は無意味だ", type: "blunt", successRate: 0.25, trustGain: 0, alertMod: 2 },
    ]
  },
  riot: {
    prompt: "群衆：『真実を隠してるのか？』",
    options: [
      { text: "情報公開を約束する", type: "transparency", successRate: 0.8, trustGain: 8, alertMod: -1 },
      { text: "あなたたちの怒りは正当だ", type: "validate", successRate: 0.7, trustGain: 6, alertMod: 0 },
      { text: "ここを通らせてくれ", type: "dismiss", successRate: 0.3, trustGain: 0, alertMod: 1 },
    ]
  },
  security: {
    prompt: "治安部隊：『許可番号を提示しろ。ないなら引き返せ』",
    options: [
      { text: "監察団ID-7749。確認を", type: "procedure", successRate: 0.9, trustGain: 8, alertMod: -1 },
      { text: "上官に連絡を取ってくれ", type: "escalate", successRate: 0.6, trustGain: 4, alertMod: 0 },
      { text: "緊急事態だ。通せ", type: "urgent", successRate: 0.35, trustGain: 0, alertMod: 1 },
    ]
  },
};

function nearestNegotiableEnemy() {
  let best = null;
  let bestD = 999999;
  for (const e of enemies) {
    if (e.stance === "allied") continue;
    if (!e.negotiable) continue;
    const dx = (e.x + e.w/2) - (player.x + player.w/2);
    const dy = (e.y + e.h/2) - (player.y + player.h/2);
    const d = Math.hypot(dx, dy);
    if (d < 78 && d < bestD) { bestD = d; best = e; }
  }
  return best;
}

function startNegotiation(e) {
  player.negotiating = e;
  player.negoProgress = 0;
  negoState.phase = "choice";
  negoState.selectedChoice = 0;
  negoState.resolveTimer = 0;
  
  // Get choices for this enemy type
  const choiceData = NEGOTIATION_CHOICES[e.type];
  if (choiceData) {
    negoState.choices = choiceData.options;
    say(choiceData.prompt, 200);
  } else {
    // Fallback for undefined types
    negoState.choices = [
      { text: "理解を求める", type: "default", successRate: 0.6, trustGain: 5, alertMod: 0 },
      { text: "強引に通る", type: "force", successRate: 0.3, trustGain: 0, alertMod: 1 },
    ];
    say(e.talkText || "交渉を開始", 140);
  }
}

function stopNegotiation() {
  player.negotiating = null;
  player.negoProgress = 0;
  negoState.phase = "idle";
  negoState.choices = [];
  negoState.selectedChoice = 0;
}

function negotiationTick() {
  const e = player.negotiating;
  if (!e) return;

  // If too far, cancel
  const dx = Math.abs((e.x+e.w/2) - (player.x+player.w/2));
  const dy = Math.abs((e.y+e.h/2) - (player.y+player.h/2));
  if (dx > 100 || dy > 80) {
    say("交渉が途切れた。距離を詰めろ。", 110);
    stopNegotiation();
    return;
  }

  // If in hazard, cancel
  if (hazardTouch(player)) {
    say("足元が不安定だ。安全を確保して交渉しろ。", 110);
    stopNegotiation();
    return;
  }

  if (negoState.phase === "choice") {
    // Handle choice navigation
    if (pressed("ArrowUp") || pressed("w") || pressed("W")) {
      negoState.selectedChoice = (negoState.selectedChoice - 1 + negoState.choices.length) % negoState.choices.length;
    }
    if (pressed("ArrowDown") || pressed("s") || pressed("S")) {
      negoState.selectedChoice = (negoState.selectedChoice + 1) % negoState.choices.length;
    }
    
    // Number keys for quick selection (1, 2, 3)
    if (pressed("1") && negoState.choices.length >= 1) {
      negoState.selectedChoice = 0;
      executeNegotiationChoice(e);
    }
    if (pressed("2") && negoState.choices.length >= 2) {
      negoState.selectedChoice = 1;
      executeNegotiationChoice(e);
    }
    if (pressed("3") && negoState.choices.length >= 3) {
      negoState.selectedChoice = 2;
      executeNegotiationChoice(e);
    }
    
    // Confirm with Enter or Space (but not E which is held for negotiation)
    if (pressed("Enter") || pressed(" ")) {
      executeNegotiationChoice(e);
    }
  } else if (negoState.phase === "resolving") {
    negoState.resolveTimer--;
    if (negoState.resolveTimer <= 0) {
      stopNegotiation();
    }
  }
}

function executeNegotiationChoice(e) {
  const choice = negoState.choices[negoState.selectedChoice];
  if (!choice) return;
  
  // Calculate success with difficulty and alert modifiers
  const alertPenalty = game.alert * 0.1;
  const difficultyMod = (e.difficulty - 1) * 0.15;
  const finalRate = clamp(choice.successRate - alertPenalty - difficultyMod, 0.1, 0.95);
  
  const success = Math.random() < finalRate;
  
  negoState.phase = "resolving";
  negoState.resolveTimer = 120;
  
  if (success) {
    // Apply success effects
    player.trust = clamp(player.trust + choice.trustGain, 0, 100);
    game.alert = clamp(game.alert + choice.alertMod, 0, 3);
    
    // Set enemy stance based on type
    if (e.type === "caravan" || e.type === "guerrilla") {
      e.stance = "allied";
    } else {
      e.stance = "neutral";
    }
    e.hostile = false;
    
    // Success message based on enemy type
    const successMessages = {
      militia: "成功：民兵は道を開けた。",
      caravan: "成功：輸送隊が通行を保証した。",
      poacher: "成功：密猟者は引き下がった。",
      guerrilla: "成功：ゲリラが撤退路を示した。",
      riot: "成功：群衆が落ち着いた。",
      security: "成功：治安部隊が通過を許可した。",
    };
    say(successMessages[e.type] || "成功：相手は退いた。", 180);
    negoState.lastResult = "success";
  } else {
    // Apply failure effects
    player.trust = clamp(player.trust - 8, 0, 100);
    game.alert = clamp(game.alert + 1, 0, 3);
    
    // Failure message based on choice type
    const failMessages = {
      threat: "失敗：脅しは通じなかった。警戒上昇。",
      rush: "失敗：焦りが裏目に出た。",
      confront: "失敗：対立が深まった。",
      blunt: "失敗：相手の怒りを買った。",
      dismiss: "失敗：無視は逆効果だった。",
      urgent: "失敗：緊急性は認められなかった。",
    };
    say(failMessages[choice.type] || "失敗：交渉は決裂した。警戒 +1", 180);
    negoState.lastResult = "failure";
  }
}
