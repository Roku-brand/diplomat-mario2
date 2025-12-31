/**
 * Negotiation system with interactive choices
 * 商社マン向け：お金（コイン）と人脈（コネクション）を交渉材料として使用可能
 */

// Negotiation state
const negoState = {
  phase: "idle", // idle | approach | choice | resolving
  selectedChoice: 0,
  choices: [],
  resolveTimer: 0,
  lastResult: null,
};

// Choice definitions for each enemy type (商社マン向け)
const NEGOTIATION_CHOICES = {
  competitor: {
    prompt: "競合営業：『この案件はウチが先に動いてる。引けよ』",
    options: [
      { text: "差別化提案：我々には独自技術がある", type: "value", successRate: 0.7, trustGain: 5, alertMod: 0 },
      { text: "💰 価格勝負：値下げで対抗する", type: "money", successRate: 0.85, trustGain: 3, alertMod: 0, costCoins: 2 },
      { text: "👤 人脈を使う：共通の知人から説得してもらう", type: "connection", successRate: 0.9, trustGain: 8, alertMod: -1, costConnections: 1 },
    ]
  },
  buyer: {
    prompt: "バイヤー：『価格と納期、両方クリアできるか？』",
    options: [
      { text: "実績を提示：過去の成功事例を説明", type: "proof", successRate: 0.8, trustGain: 6, alertMod: 0 },
      { text: "💰 特別価格：今回限りの割引を提案", type: "money", successRate: 0.9, trustGain: 4, alertMod: 0, costCoins: 3 },
      { text: "誠意を見せる：現場視察をお約束", type: "sincerity", successRate: 0.7, trustGain: 8, alertMod: -1 },
    ]
  },
  broker: {
    prompt: "ブローカー：『紹介料は？それとも別ルートで行く？』",
    options: [
      { text: "💰 手数料を払う：正規ルートで", type: "money", successRate: 0.85, trustGain: 4, alertMod: 0, costCoins: 2 },
      { text: "👤 直接交渉：人脈で直ルートを開拓", type: "connection", successRate: 0.8, trustGain: 10, alertMod: 0, costConnections: 1 },
      { text: "断る：自力で進む", type: "reject", successRate: 0.5, trustGain: 0, alertMod: 1 },
    ]
  },
  executive: {
    prompt: "重役：『数字で語れ。情緒では動かん』",
    options: [
      { text: "💰 大型投資を約束：将来の利益を提示", type: "money", successRate: 0.75, trustGain: 8, alertMod: 0, costCoins: 4 },
      { text: "👤 役員紹介：信頼できる人脈からの推薦", type: "connection", successRate: 0.9, trustGain: 12, alertMod: -1, costConnections: 2 },
      { text: "データで勝負：市場分析を提示", type: "logic", successRate: 0.7, trustGain: 6, alertMod: 0 },
    ]
  },
  union: {
    prompt: "組合代表：『労働者の権利を無視するのか？』",
    options: [
      { text: "対話を約束：定期協議の場を設ける", type: "dialogue", successRate: 0.75, trustGain: 8, alertMod: 0 },
      { text: "💰 待遇改善：賃上げを約束", type: "money", successRate: 0.85, trustGain: 6, alertMod: -1, costCoins: 3 },
      { text: "👤 仲介者を立てる：労使双方の信頼者", type: "connection", successRate: 0.8, trustGain: 10, alertMod: 0, costConnections: 1 },
    ]
  },
  government: {
    prompt: "官僚：『許認可がなければ話にならん。書類は？』",
    options: [
      { text: "正規手続き：必要書類を全て準備", type: "procedure", successRate: 0.8, trustGain: 6, alertMod: 0 },
      { text: "👤 政界人脈：適切なチャネルで働きかけ", type: "connection", successRate: 0.95, trustGain: 10, alertMod: -1, costConnections: 2 },
      { text: "💰 経済効果を強調：雇用創出の数字", type: "money", successRate: 0.7, trustGain: 4, alertMod: 0, costCoins: 2 },
    ]
  },
  gatekeeper: {
    prompt: "受付：『アポなしでは通せません。交渉材料は？』",
    options: [
      { text: "💰 謝礼を渡す：お土産を持参", type: "money", successRate: 0.8, trustGain: 3, alertMod: 0, costCoins: 1 },
      { text: "👤 紹介状を見せる：知人からの推薦状", type: "connection", successRate: 0.9, trustGain: 5, alertMod: 0, costConnections: 1 },
      { text: "誠意で説得：目的と熱意を伝える", type: "sincerity", successRate: 0.6, trustGain: 4, alertMod: 0 },
    ]
  },
  // === BOSS NEGOTIATION CHOICES ===
  boss_market: {
    prompt: "バイヤー長：『大型契約に値する企業か、見極めさせてもらう』",
    options: [
      { text: "💰💰 破格の条件を提示：価格優位を証明", type: "money", successRate: 0.7, trustGain: 10, alertMod: 0, costCoins: 4 },
      { text: "👤👤 業界人脈を駆使：推薦者の連名", type: "connection", successRate: 0.85, trustGain: 15, alertMod: -1, costConnections: 2 },
      { text: "実績プレゼン：過去の成功事例を詳細に", type: "proof", successRate: 0.6, trustGain: 8, alertMod: 0 },
    ]
  },
  boss_office: {
    prompt: "CEO：『我が社の未来を託すパートナーか、証明してみろ』",
    options: [
      { text: "💰💰💰 大型投資プラン：長期的リターンを提示", type: "money", successRate: 0.65, trustGain: 12, alertMod: 0, costCoins: 5 },
      { text: "👤👤👤 役員ネットワーク：取締役会からの推薦", type: "connection", successRate: 0.8, trustGain: 18, alertMod: -1, costConnections: 3 },
      { text: "ビジョンの共有：シナジー効果を論理的に", type: "logic", successRate: 0.55, trustGain: 10, alertMod: 0 },
    ]
  },
  boss_port: {
    prompt: "通関局長：『全ての手続きと信用を確認する。妥協はない』",
    options: [
      { text: "💰💰 経済効果報告：雇用と税収への貢献", type: "money", successRate: 0.6, trustGain: 10, alertMod: 0, costCoins: 4 },
      { text: "👤👤👤 政府高官の推薦：省庁からのサポート", type: "connection", successRate: 0.85, trustGain: 20, alertMod: -1, costConnections: 3 },
      { text: "完璧な書類提出：法令遵守を証明", type: "procedure", successRate: 0.7, trustGain: 12, alertMod: 0 },
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
  
  playSFX("negoStart");
  
  // Get choices for this enemy type
  const choiceData = NEGOTIATION_CHOICES[e.type];
  if (choiceData) {
    negoState.choices = choiceData.options;
    say(choiceData.prompt, 200);
  } else {
    // Fallback for undefined types
    negoState.choices = [
      { text: "提案する：Win-Winを模索", type: "default", successRate: 0.6, trustGain: 5, alertMod: 0 },
      { text: "強引に進む", type: "force", successRate: 0.3, trustGain: 0, alertMod: 1 },
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
    say("不利な立場だ。安全を確保して交渉しろ。", 110);
    stopNegotiation();
    return;
  }

  if (negoState.phase === "choice") {
    // Handle choice navigation
    if (pressed("ArrowUp") || pressed("w") || pressed("W")) {
      negoState.selectedChoice = (negoState.selectedChoice - 1 + negoState.choices.length) % negoState.choices.length;
      playSFX("select");
    }
    if (pressed("ArrowDown") || pressed("s") || pressed("S")) {
      negoState.selectedChoice = (negoState.selectedChoice + 1) % negoState.choices.length;
      playSFX("select");
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
    
    // Confirm with Enter or Space
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
  
  // Check if player has enough resources
  const coinCost = choice.costCoins || 0;
  const connectionCost = choice.costConnections || 0;
  
  if (coinCost > player.coins) {
    say(`お金が足りない！（必要: ${coinCost}💰、所持: ${player.coins}💰）`, 120);
    return;
  }
  if (connectionCost > player.connections) {
    say(`人脈が足りない！（必要: ${connectionCost}👤、所持: ${player.connections}👤）`, 120);
    return;
  }
  
  // Deduct resources
  player.coins -= coinCost;
  player.connections -= connectionCost;
  
  // Calculate success with difficulty and alert modifiers
  const alertPenalty = game.alert * 0.1;
  const difficultyMod = (e.difficulty - 1) * 0.15;
  // Bonus for using resources
  const resourceBonus = (coinCost > 0 ? 0.05 : 0) + (connectionCost > 0 ? 0.08 : 0);
  // Career level bonus
  const careerBonus = (playerGlobal.careerLevel >= 2 ? 0.05 : 0);
  const finalRate = clamp(choice.successRate - alertPenalty - difficultyMod + resourceBonus + careerBonus, 0.1, 0.95);
  
  const success = Math.random() < finalRate;
  
  negoState.phase = "resolving";
  negoState.resolveTimer = 120;
  
  // Update connection dictionary
  updateConnectionDict(e.type, success);
  
  if (success) {
    // Apply success effects
    player.trust = clamp(player.trust + choice.trustGain, 0, 100);
    game.alert = clamp(game.alert + choice.alertMod, 0, 3);
    
    // Add career exp
    const expGain = e.isBoss ? 20 : 5;
    addCareerExp(expGain);
    
    // Handle boss battles
    if (e.isBoss) {
      e.bossHP--;
      if (e.bossHP <= 0) {
        // Boss defeated!
        e.stance = "allied";
        e.hostile = false;
        game.bossDefeated = true;
        
        // Create spectacular defeat effect
        createDefeatEffect(e.x, e.y, "boss_defeat", "🎉 ボス撃破！");
        createParticles(e.x + e.w/2, e.y + e.h/2, "boss", 25);
        triggerScreenShake(12, 25);
        playSFX("bossDefeat");
        
        const bossMessages = {
          boss_market: "大勝利！バイヤー長との大型契約成立！出世への道が開けた！",
          boss_office: "完全勝利！CEOとの提携合意！君の評価は天井知らずだ！",
          boss_port: "最終勝利！通関局長の承認完了！輸出成功だ！",
        };
        say(bossMessages[e.type] || "ボス撃破！契約成立！", 240);
        negoState.resolveTimer = 180;
      } else {
        // Boss phase advance
        e.bossPhase++;
        playSFX("negoSuccess");
        const phaseMessages = [
          "『まだだ...もう一度交渉しろ』",
          "『なかなかやるな...最後の一押しを見せろ』",
        ];
        say(`交渉進行中！（残り ${e.bossHP} 回）${phaseMessages[Math.min(e.bossPhase-1, 1)]}`, 180);
        
        // Create phase effect
        createDefeatEffect(e.x, e.y, "boss_phase", `Phase ${e.bossPhase}`);
      }
      negoState.lastResult = "success";
      return;
    }
    
    // Set enemy stance
    if (e.type === "buyer" || e.type === "executive") {
      e.stance = "allied";
    } else {
      e.stance = "neutral";
    }
    e.hostile = false;
    
    // Create defeat effect for regular enemies
    createDefeatEffect(e.x, e.y, "negotiate_success", "契約成立！");
    createParticles(e.x + e.w/2, e.y + e.h/2, "success", 12);
    playSFX("negoSuccess");
    
    // If this is a gatekeeper, open the gate
    if (e.isGateGuard) {
      openNearbyGate(e);
    }
    
    // Success message based on enemy type
    const successMessages = {
      competitor: "成功：競合は撤退した。案件獲得！",
      buyer: "成功：バイヤーとの契約成立！",
      broker: "成功：ブローカーが協力的になった。",
      executive: "成功：重役の承認を得た！",
      union: "成功：組合との協議がまとまった。",
      government: "成功：許認可の道筋がついた。",
      gatekeeper: "成功：ゲートが開いた！先へ進め。",
    };
    say(successMessages[e.type] || "成功：交渉成立！", 180);
    negoState.lastResult = "success";
  } else {
    // Apply failure effects
    player.trust = clamp(player.trust - 8, 0, 100);
    game.alert = clamp(game.alert + 1, 0, 3);
    playSFX("negoFail");
    createParticles(e.x + e.w/2, e.y + e.h/2, "fail", 8);
    triggerScreenShake(4, 8);
    
    // Failure message based on choice type
    const failMessages = {
      money: "失敗：金額では納得してもらえなかった。",
      connection: "失敗：人脈を使ったが響かなかった。",
      reject: "失敗：断ったことで関係が悪化。",
      force: "失敗：強引さが裏目に出た。",
    };
    say(failMessages[choice.type] || "失敗：交渉決裂。評判ダウン。", 180);
    negoState.lastResult = "failure";
  }
}

// Open nearby negotiation gate tiles when gatekeeper is convinced
function openNearbyGate(e) {
  const tx = Math.floor(e.x / TILE);
  const ty = Math.floor(e.y / TILE);
  // Search nearby tiles for gate tiles (type 5)
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const nx = tx + dx;
      const ny = ty + dy;
      if (ny >= 0 && ny < game.mapH && nx >= 0 && nx < game.mapW) {
        if (game.map[ny][nx] === 5) {
          game.map[ny][nx] = 0; // Remove gate
        }
      }
    }
  }
}

// Update connection dictionary when meeting/negotiating with enemies
function updateConnectionDict(type, negotiated) {
  if (!playerGlobal.connectionDict[type]) {
    playerGlobal.connectionDict[type] = {
      met: true,
      negotiated: false,
      allied: false,
      count: 0
    };
  }
  
  playerGlobal.connectionDict[type].met = true;
  if (negotiated) {
    playerGlobal.connectionDict[type].negotiated = true;
    playerGlobal.connectionDict[type].allied = true;
    playerGlobal.connectionDict[type].count++;
  }
}

// Add career experience and check for level up
function addCareerExp(amount) {
  playerGlobal.careerExp += amount;
  
  // Check for level up (use while loop to handle multiple level-ups)
  let leveledUp = false;
  let lastLevelTitle = "";
  let lastLevelBonus = "";
  
  while (playerGlobal.careerLevel < CAREER_LEVELS.length) {
    const nextLevel = CAREER_LEVELS.find(l => l.level === playerGlobal.careerLevel + 1);
    if (nextLevel && playerGlobal.careerExp >= nextLevel.expRequired) {
      playerGlobal.careerLevel = nextLevel.level;
      lastLevelTitle = nextLevel.title;
      lastLevelBonus = nextLevel.bonus;
      leveledUp = true;
    } else {
      break;
    }
  }
  
  if (leveledUp) {
    playSFX("levelUp");
    say(`🎉 昇進！${lastLevelTitle}になった！ボーナス: ${lastLevelBonus}`, 240);
    
    // Create promotion effect
    createDefeatEffect(player.x, player.y - 50, "promotion", `${lastLevelTitle}に昇進！`);
  }
}

// Create visual defeat/success effect
function createDefeatEffect(x, y, type, text) {
  game.defeatEffects.push({
    x: x,
    y: y,
    timer: 120, // 2 seconds at 60fps
    type: type,
    text: text,
    startY: y,
  });
}

// Update defeat effects (called from update.js)
function updateDefeatEffects() {
  for (let i = game.defeatEffects.length - 1; i >= 0; i--) {
    const effect = game.defeatEffects[i];
    effect.timer--;
    effect.y -= 0.5; // Float upward
    
    if (effect.timer <= 0) {
      game.defeatEffects.splice(i, 1);
    }
  }
}
