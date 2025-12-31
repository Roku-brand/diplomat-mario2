/**
 * アイテムボックスとスキルシステム
 * 交渉システムは削除され、マリオ風のアクションゲームに変更
 */

// アイテムボックスを叩いた時の処理
function hitItemBox(tx, ty) {
  const key = `${tx},${ty}`;
  
  // 既に使用済みの場合は何もしない
  if (itemBoxes.has(key) && itemBoxes.get(key).used) {
    playSFX("select"); // 空のブロック音
    return;
  }
  
  // アイテムを決定
  const rand = Math.random();
  let itemType;
  if (rand < 0.4) {
    itemType = "coin";
  } else if (rand < 0.65) {
    itemType = "connection";
  } else if (rand < 0.80) {
    itemType = "coins3";
  } else {
    // パワーアップ
    const powerupTypes = ["speed", "jump", "invincible", "magnet"];
    itemType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
  }
  
  // アイテムボックスを使用済みに
  itemBoxes.set(key, { used: true, itemType: itemType });
  
  // アイテムを出現させる
  spawnItemFromBox(tx * TILE, ty * TILE - TILE, itemType);
  
  playSFX("coin");
  createParticles(tx * TILE + TILE/2, ty * TILE, "itembox", 8);
  triggerScreenShake(3, 5);
}

// アイテムボックスからアイテムを出現
function spawnItemFromBox(x, y, itemType) {
  if (itemType === "coin") {
    collectibles.push({ type: "coin", x: x, y: y, collected: false, fromBox: true, vy: -5 });
    say("💰 コインが出た！", 60);
  } else if (itemType === "connection") {
    collectibles.push({ type: "connection", x: x, y: y, collected: false, fromBox: true, vy: -5 });
    say("👤 人脈カードが出た！", 60);
  } else if (itemType === "coins3") {
    for (let i = 0; i < 3; i++) {
      collectibles.push({ 
        type: "coin", 
        x: x + (i - 1) * 15, 
        y: y, 
        collected: false, 
        fromBox: true, 
        vy: -5 - i 
      });
    }
    say("💰💰💰 コイン3枚が出た！", 80);
  } else {
    // パワーアップアイテム
    powerUps.push({
      type: itemType,
      x: x,
      y: y,
      vy: -4,
      active: true
    });
    const skill = SKILLS[itemType];
    say(`${skill.icon} ${skill.name}アイテムが出た！`, 100);
  }
}

// 敵を踏み付けた時の処理
function stompEnemy(e) {
  if (e.unstompable) {
    // 踏めない敵の場合はダメージを受ける
    playerTakeDamage(e);
    return false;
  }
  
  if (e.isBoss) {
    // ボスは複数回踏み付けが必要
    e.bossHP--;
    e.bossPhase++;
    
    if (e.bossHP <= 0) {
      // ボス撃破
      e.defeated = true;
      game.bossDefeated = true;
      
      createDefeatEffect(e.x, e.y, "boss_defeat", "🎉 ボス撃破！");
      createParticles(e.x + e.w/2, e.y + e.h/2, "boss", 25);
      triggerScreenShake(12, 25);
      playSFX("bossDefeat");
      
      // パワーアップをドロップ
      for (let i = 0; i < 3; i++) {
        const powerupTypes = ["speed", "jump", "invincible", "magnet"];
        powerUps.push({
          type: powerupTypes[i % powerupTypes.length],
          x: e.x + i * 20,
          y: e.y,
          vy: -6 - i,
          active: true
        });
      }
      
      // 経験値
      addCareerExp(20);
      say("🎉 ボス撃破！大量のパワーアップ獲得！", 180);
    } else {
      // まだHP残ってる
      createDefeatEffect(e.x, e.y, "boss_phase", `残り${e.bossHP}回！`);
      createParticles(e.x + e.w/2, e.y + e.h/2, "stomp", 12);
      triggerScreenShake(6, 10);
      playSFX("negoSuccess");
      say(`ボスにダメージ！残り${e.bossHP}回踏み付けろ！`, 120);
    }
  } else {
    // 通常の敵
    e.defeated = true;
    
    createParticles(e.x + e.w/2, e.y + e.h/2, "stomp", 10);
    triggerScreenShake(4, 6);
    playSFX("negoSuccess");
    
    // アイテムドロップ
    dropEnemyItem(e);
    
    // 経験値
    addCareerExp(5);
  }
  
  // コネクション図鑑に記録
  updateConnectionDict(e.type, true);
  
  return true;
}

// 敵がドロップするアイテム（人脈は敵を倒したらに統一）
function dropEnemyItem(e) {
  const dropType = e.dropType || "connection";
  
  if (dropType === "coin") {
    collectibles.push({ type: "coin", x: e.x, y: e.y - 10, collected: false, fromBox: true, vy: -4 });
    say("💰 コインゲット！", 60);
  } else if (dropType === "connection") {
    collectibles.push({ type: "connection", x: e.x, y: e.y - 10, collected: false, fromBox: true, vy: -4 });
    say("👤 人脈ゲット！", 60);
  } else if (dropType === "connection2") {
    // バイヤーなどは人脈を2つドロップ
    for (let i = 0; i < 2; i++) {
      collectibles.push({ 
        type: "connection", 
        x: e.x + (i - 0.5) * 15, 
        y: e.y - 10, 
        collected: false, 
        fromBox: true, 
        vy: -4 - i 
      });
    }
    say("👤👤 人脈×2ゲット！", 80);
  } else if (dropType === "coins3") {
    for (let i = 0; i < 3; i++) {
      collectibles.push({ 
        type: "coin", 
        x: e.x + (i - 1) * 12, 
        y: e.y - 10, 
        collected: false, 
        fromBox: true, 
        vy: -4 - i 
      });
    }
    say("💰💰💰 大量コインゲット！", 80);
  } else if (dropType === "coins3_connection") {
    // 重役はコイン3つと人脈1つをドロップ
    for (let i = 0; i < 3; i++) {
      collectibles.push({ 
        type: "coin", 
        x: e.x + (i - 1) * 12, 
        y: e.y - 10, 
        collected: false, 
        fromBox: true, 
        vy: -4 - i 
      });
    }
    collectibles.push({ type: "connection", x: e.x, y: e.y - 20, collected: false, fromBox: true, vy: -6 });
    say("💰💰💰👤 大量報酬ゲット！", 100);
  } else if (dropType === "powerup") {
    const powerupTypes = ["speed", "jump", "invincible", "magnet"];
    const pType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    powerUps.push({
      type: pType,
      x: e.x,
      y: e.y - 10,
      vy: -5,
      active: true
    });
    const skill = SKILLS[pType];
    say(`${skill.icon} ${skill.name}アイテムゲット！`, 100);
  }
}

// パワーアップアイテムの更新
function updatePowerUps() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    if (!p.active) {
      powerUps.splice(i, 1);
      continue;
    }
    
    // 重力
    p.vy += 0.3;
    p.y += p.vy;
    
    // 地面との衝突
    const ty = Math.floor((p.y + 24) / TILE);
    const tx = Math.floor((p.x + 12) / TILE);
    if (tileAt(tx, ty) === 1 || tileAt(tx, ty) === 4) {
      p.y = ty * TILE - 24;
      p.vy = 0;
    }
    
    // 画面外に落ちたら削除
    if (p.y > game.mapH * TILE + 100) {
      powerUps.splice(i, 1);
      continue;
    }
    
    // プレイヤーとの衝突判定
    if (aabb(player.x, player.y, player.w, player.h, p.x, p.y, 24, 24)) {
      // スキル発動
      activateSkill(p.type);
      p.active = false;
    }
  }
}

// Update connection dictionary when defeating enemies
function updateConnectionDict(type, defeated) {
  if (!playerGlobal.connectionDict[type]) {
    playerGlobal.connectionDict[type] = {
      met: true,
      negotiated: false,
      allied: false,
      count: 0
    };
  }
  
  playerGlobal.connectionDict[type].met = true;
  if (defeated) {
    playerGlobal.connectionDict[type].negotiated = true;
    playerGlobal.connectionDict[type].allied = true;
    playerGlobal.connectionDict[type].count++;
  }
}

// Add career experience and check for level up
function addCareerExp(amount) {
  playerGlobal.careerExp += amount;
  
  // Check for level up
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
    createDefeatEffect(player.x, player.y - 50, "promotion", `${lastLevelTitle}に昇進！`);
  }
}

// Create visual effect
function createDefeatEffect(x, y, type, text) {
  game.defeatEffects.push({
    x: x,
    y: y,
    timer: 120,
    type: type,
    text: text,
    startY: y,
  });
}

// Update defeat effects
function updateDefeatEffects() {
  for (let i = game.defeatEffects.length - 1; i >= 0; i--) {
    const effect = game.defeatEffects[i];
    effect.timer--;
    effect.y -= 0.5;
    
    if (effect.timer <= 0) {
      game.defeatEffects.splice(i, 1);
    }
  }
}

// プレイヤーがダメージを受ける
function playerTakeDamage(e) {
  if (player.invincible) {
    // 無敵状態なら敵を倒す
    stompEnemy(e);
    return;
  }
  
  player.hp -= e.contactDamage;
  player.trust = clamp(player.trust - 7, 0, 100);
  playSFX("damage");
  triggerScreenShake(8, 15);
  createParticles(player.x + player.w/2, player.y + player.h/2, "damage", 12);
  say("衝突！（HP -1）", 80);
  
  // ノックバック
  player.vx = -e.dir * 5.2;
  player.vy = -7.5;
}
