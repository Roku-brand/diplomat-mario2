/**
 * Rendering functions
 */

function draw() {
  // Handle RPG-style top menu
  if (game.state === "topmenu") {
    drawTopMenuOverlay();
    return;
  }
  
  // Handle headquarters menu
  if (game.state === "headquarters") {
    drawHeadquartersOverlay();
    return;
  }
  
  // Handle branch office menu
  if (game.state === "branch") {
    drawBranchOverlay();
    return;
  }
  
  // Handle manufacturer menu (メーカー)
  if (game.state === "manufacturer") {
    drawManufacturerOverlay();
    return;
  }
  
  // Handle connection dictionary
  if (game.state === "dictionary") {
    drawDictionaryOverlay();
    return;
  }
  
  // Handle stage select screen before game.stage is set
  if (game.state === "select") {
    drawStageSelectOverlay();
    return;
  }
  
  const pal = game.stage?.palette || { sky:"#0b0f14", far:"#0b0f14", mid:"#0b0f14", ground:"#222", accent:"#fff" };

  // Update screen shake and particles
  updateScreenShake();
  updateParticles();

  // background
  ctx.fillStyle = pal.sky;
  ctx.fillRect(0,0,W,H);

  // parallax layers
  const px = game.cameraX;
  drawParallax(pal.far, 0.15, 34);
  drawParallax(pal.mid, 0.30, 22);

  // world with screen shake
  ctx.save();
  ctx.translate(-Math.floor(game.cameraX) + screenShake.x, -Math.floor(game.cameraY) + screenShake.y);

  drawTiles(pal);
  drawCollectibles(); // コインと人脈ポイントを描画
  drawPowerUps(); // パワーアップアイテムを描画
  drawEnemies(pal);
  drawPlayer(pal);
  drawDefeatEffects(); // 敵撃退エフェクト
  drawParticles(); // パーティクルエフェクト

  ctx.restore();

  // HUD
  drawHUD(pal);
  
  // スキル効果表示
  if (game.state === "play" && player.activeSkill) {
    drawSkillIndicator();
  }

  // Tutorial overlay
  if (game.showTutorial) {
    drawTutorialOverlay();
  }

  // Intro overlay
  if (game.state === "intro") drawIntroOverlay(pal);

  // Gameover overlay
  if (game.state === "gameover") drawGameoverOverlay(pal);
}

function drawParallax(color, factor, height) {
  ctx.fillStyle = color;
  const offset = -(game.cameraX * factor) % W;
  for (let i=-1;i<=1;i++) {
    ctx.fillRect(offset + i*W, H - height - 110, W, height);
  }
}

function drawCollectibles() {
  const collectW = 24;
  const collectH = 24;
  
  for (const c of collectibles) {
    if (c.collected) continue;
    
    const x = c.x;
    const y = c.y + Math.sin(game.time * 0.08) * 3; // 浮遊アニメーション
    
    if (c.type === "coin") {
      // コイン（お金）💰
      // 金色の円
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.arc(x + collectW/2, y + collectH/2, 10, 0, Math.PI * 2);
      ctx.fill();
      // 内側の円
      ctx.fillStyle = "#ffec80";
      ctx.beginPath();
      ctx.arc(x + collectW/2, y + collectH/2, 6, 0, Math.PI * 2);
      ctx.fill();
      // ¥マーク
      ctx.fillStyle = "#8b6914";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("¥", x + collectW/2 - 4, y + collectH/2 + 4);
      // 光沢
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.arc(x + collectW/2 - 3, y + collectH/2 - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.type === "connection") {
      // 人脈ポイント（コネクション）👤
      // 名刺風デザイン
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(x + 2, y + 4, 20, 16);
      // 名刺の枠
      ctx.strokeStyle = "#4a90d9";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 4, 20, 16);
      // 人アイコン
      ctx.fillStyle = "#4a90d9";
      ctx.beginPath();
      ctx.arc(x + 12, y + 10, 4, 0, Math.PI * 2);
      ctx.fill();
      // 肩
      ctx.fillRect(x + 7, y + 14, 10, 4);
      // 光沢エフェクト
      const pulse = Math.sin(game.time * 0.1) * 0.3 + 0.5;
      ctx.fillStyle = `rgba(100, 180, 255, ${pulse})`;
      ctx.fillRect(x, y + 2, collectW, collectH);
    }
  }
}

// パワーアップアイテムの描画
function drawPowerUps() {
  for (const p of powerUps) {
    if (!p.active) continue;
    
    const x = p.x;
    const y = p.y + Math.sin(game.time * 0.1) * 2;
    const skill = SKILLS[p.type];
    
    // 外枠（光るエフェクト）
    const pulse = Math.sin(game.time * 0.12) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.3})`;
    ctx.beginPath();
    ctx.arc(x + 12, y + 12, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // 背景円
    ctx.fillStyle = skill.color;
    ctx.beginPath();
    ctx.arc(x + 12, y + 12, 14, 0, Math.PI * 2);
    ctx.fill();
    
    // 内側の円（グラデーション風）
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(x + 10, y + 10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // アイコン
    ctx.font = "18px sans-serif";
    ctx.fillText(skill.icon, x + 3, y + 18);
  }
}

// Draw defeat/success effects when enemies are stomped
function drawDefeatEffects() {
  for (const effect of game.defeatEffects) {
    const alpha = clamp(effect.timer / 60, 0, 1);
    const scale = 1 + (1 - effect.timer / 120) * 0.5;
    
    const x = effect.x;
    const y = effect.y;
    
    if (effect.type === "boss_defeat") {
      // Spectacular boss defeat effect
      // Expanding rings
      for (let i = 0; i < 3; i++) {
        const ringProgress = ((120 - effect.timer) + i * 20) / 60;
        const ringRadius = ringProgress * 80;
        const ringAlpha = Math.max(0, alpha - ringProgress * 0.3);
        
        ctx.strokeStyle = `rgba(255, 215, 0, ${ringAlpha})`;
        ctx.lineWidth = 4 - ringProgress * 2;
        ctx.beginPath();
        ctx.arc(x + 20, y + 20, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Floating stars
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + game.time * 0.05;
        const dist = 40 + Math.sin(game.time * 0.1 + i) * 20;
        const sx = x + 20 + Math.cos(angle) * dist;
        const sy = y + 20 + Math.sin(angle) * dist - (120 - effect.timer) * 0.5;
        
        ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
        ctx.font = "16px sans-serif";
        ctx.fillText("⭐", sx, sy);
      }
      
      // Text
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.font = `bold ${20 * scale}px system-ui, -apple-system, Segoe UI, sans-serif`;
      ctx.fillText(effect.text, x - 40, y - 30);
      
    } else if (effect.type === "boss_phase") {
      // Phase transition effect
      ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`;
      ctx.font = `bold ${16 * scale}px system-ui, -apple-system, Segoe UI, sans-serif`;
      ctx.fillText(effect.text, x - 20, y - 20);
      
      // Lightning bolts
      for (let i = 0; i < 4; i++) {
        const bx = x + Math.sin(game.time * 0.2 + i * 1.5) * 30;
        const by = y + Math.cos(game.time * 0.3 + i) * 20;
        ctx.fillStyle = `rgba(200, 220, 255, ${alpha * 0.7})`;
        ctx.font = "14px sans-serif";
        ctx.fillText("⚡", bx, by);
      }
      
    } else if (effect.type === "negotiate_success") {
      // Regular negotiation success effect
      // Handshake icon floating up
      ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
      ctx.font = `${20 * scale}px sans-serif`;
      ctx.fillText("🤝", x, y);
      
      // Sparkles
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + game.time * 0.1;
        const dist = 25 + (120 - effect.timer) * 0.3;
        const sx = x + 10 + Math.cos(angle) * dist;
        const sy = y + Math.sin(angle) * dist;
        
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha * 0.7})`;
        ctx.font = "12px sans-serif";
        ctx.fillText("✨", sx, sy);
      }
      
      // Text
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.font = `bold 14px system-ui, -apple-system, Segoe UI, sans-serif`;
      ctx.fillText(effect.text, x - 20, y - 25);
      
    } else if (effect.type === "promotion") {
      // Career promotion effect
      // Rising arrow and stars
      ctx.fillStyle = `rgba(255, 180, 0, ${alpha})`;
      ctx.font = `${24 * scale}px sans-serif`;
      ctx.fillText("📈", x, y);
      
      // Confetti
      for (let i = 0; i < 6; i++) {
        const confettiX = x + Math.sin(game.time * 0.15 + i * 2) * 50;
        const confettiY = y - (120 - effect.timer) * 0.8 + Math.sin(i * 3) * 30;
        const confettiColors = ["🎊", "🎉", "⭐"];
        
        ctx.font = "14px sans-serif";
        ctx.fillText(confettiColors[i % 3], confettiX, confettiY);
      }
      
      // Text
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.font = `bold 18px system-ui, -apple-system, Segoe UI, sans-serif`;
      ctx.fillText(effect.text, x - 50, y - 35);
    }
  }
}

function drawTiles(pal) {
  const startX = Math.floor(game.cameraX / TILE) - 2;
  const endX = Math.floor((game.cameraX + W) / TILE) + 2;
  const startY = 0;
  const endY = game.mapH;

  for (let ty=startY; ty<endY; ty++) {
    for (let tx=startX; tx<=endX; tx++) {
      const t = tileAt(tx, ty);
      if (t === 0) continue;

      const x = tx*TILE, y = ty*TILE;

      if (t === 1) {
        // 通常の地面（オフィスフロア風）
        ctx.fillStyle = pal.ground;
        ctx.fillRect(x, y, TILE, TILE);
        // タイル模様を追加
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x+1, y+1, TILE-2, TILE-2);
      } else if (t === 2) {
        // hazard（競合エリア/監視ゾーン）
        ctx.fillStyle = "#5a2020";
        ctx.fillRect(x, y, TILE, TILE);
        // 警告パターン
        ctx.fillStyle = "#ffcc00";
        ctx.fillRect(x, y, 6, TILE);
        ctx.fillRect(x+TILE-6, y, 6, TILE);
        ctx.fillStyle = "rgba(255,0,0,0.3)";
        ctx.fillRect(x+6, y+6, TILE-12, TILE-12);
      } else if (t === 3) {
        // goal gate（契約成立ゲート）
        ctx.fillStyle = pal.accent;
        ctx.fillRect(x, y, TILE, TILE);
        // 金色のゲート
        ctx.fillStyle = "#ffd700";
        ctx.fillRect(x+4, y, 4, TILE);
        ctx.fillRect(x+TILE-8, y, 4, TILE);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillRect(x+10, y+10, TILE-20, TILE-20);
        // 契約書アイコン
        ctx.fillStyle = "#fff";
        ctx.fillRect(x+12, y+8, 12, 16);
        ctx.fillStyle = "#333";
        ctx.fillRect(x+14, y+12, 8, 2);
        ctx.fillRect(x+14, y+16, 8, 2);
        ctx.fillRect(x+14, y+20, 6, 2);
      } else if (t === 4) {
        // breakable（古いオフィス床）
        const key = `${tx},${ty}`;
        const d = breakTiles.get(key) ?? 120;
        const a = clamp(d/120, 0, 1);
        ctx.fillStyle = `rgba(120, 100, 80, ${0.3 + 0.5*a})`;
        ctx.fillRect(x, y, TILE, TILE);
        // ひび割れパターン
        ctx.strokeStyle = `rgba(60, 50, 40, ${0.5 + 0.3*a})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x+8, y+4); ctx.lineTo(x+TILE-8, y+TILE-4);
        ctx.moveTo(x+TILE-8, y+8); ctx.lineTo(x+8, y+TILE-8);
        ctx.stroke();
      } else if (t === 5) {
        // ゲート（敵を倒さなくても通れるように変更）
        ctx.fillStyle = "#4a3a2a";
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = "#8b7355";
        ctx.fillRect(x+4, y+2, TILE-8, TILE-4);
        ctx.fillStyle = "#d4af37";
        ctx.beginPath();
        ctx.arc(x+TILE-10, y+TILE/2, 4, 0, Math.PI*2);
        ctx.fill();
      } else if (t === 6) {
        // アイテムボックス（?ブロック）
        const key = `${tx},${ty}`;
        const boxState = itemBoxes.get(key);
        const used = boxState && boxState.used;
        
        if (used) {
          // 使用済み（暗い色）
          ctx.fillStyle = "#5a4a3a";
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = "#4a3a2a";
          ctx.fillRect(x+3, y+3, TILE-6, TILE-6);
        } else {
          // 未使用（金色の?ブロック）
          // 外枠
          ctx.fillStyle = "#d4a400";
          ctx.fillRect(x, y, TILE, TILE);
          // 内側
          ctx.fillStyle = "#ffcc00";
          ctx.fillRect(x+3, y+3, TILE-6, TILE-6);
          // ハイライト
          ctx.fillStyle = "#ffe066";
          ctx.fillRect(x+5, y+5, TILE-15, TILE-15);
          // ?マーク
          ctx.fillStyle = "#8b6914";
          ctx.font = "bold 22px sans-serif";
          ctx.fillText("?", x+10, y+28);
          // 点滅エフェクト
          const pulse = Math.sin(game.time * 0.15) * 0.15 + 0.85;
          ctx.fillStyle = `rgba(255, 255, 200, ${0.3 * pulse})`;
          ctx.fillRect(x, y, TILE, TILE);
        }
      }
    }
  }
}

function drawPlayer(pal) {
  const px = player.x;
  const py = player.y;
  const pw = player.w;
  const ph = player.h;
  const facing = player.face; // 1 = right, -1 = left

  // === Legs (dark suit pants) ===
  ctx.fillStyle = "#1e293b"; // dark navy pants
  const legWidth = 8;
  const legHeight = 14;
  const legY = py + ph - legHeight;
  // Left leg
  ctx.fillRect(px + 4, legY, legWidth, legHeight);
  // Right leg
  ctx.fillRect(px + pw - 12, legY, legWidth, legHeight);
  // Shoes
  ctx.fillStyle = "#0f172a"; // black shoes
  ctx.fillRect(px + 3, py + ph - 4, legWidth + 2, 4);
  ctx.fillRect(px + pw - 13, py + ph - 4, legWidth + 2, 4);

  // === Suit jacket (torso) ===
  const jacketY = py + 16;
  const jacketH = ph - 16 - legHeight;
  ctx.fillStyle = "#1e3a5f"; // dark blue suit jacket
  ctx.fillRect(px + 2, jacketY, pw - 4, jacketH);
  // Jacket lapels (V-shape collar)
  ctx.fillStyle = "#0f2942"; // darker lapel
  ctx.beginPath();
  ctx.moveTo(px + pw / 2, jacketY);
  ctx.lineTo(px + 4, jacketY + 8);
  ctx.lineTo(px + 4, jacketY);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(px + pw / 2, jacketY);
  ctx.lineTo(px + pw - 4, jacketY + 8);
  ctx.lineTo(px + pw - 4, jacketY);
  ctx.closePath();
  ctx.fill();
  // Suit buttons
  ctx.fillStyle = "#d4af37"; // gold buttons
  ctx.beginPath();
  ctx.arc(px + pw / 2, jacketY + 10, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px + pw / 2, jacketY + 18, 2, 0, Math.PI * 2);
  ctx.fill();

  // === White dress shirt (visible under jacket) ===
  ctx.fillStyle = "#f8fafc"; // white shirt
  ctx.fillRect(px + pw / 2 - 4, jacketY, 8, 10);

  // === Tie ===
  ctx.fillStyle = "#dc2626"; // red tie
  const tieX = px + pw / 2 - 3;
  ctx.fillRect(tieX, jacketY + 2, 6, 16);
  // Tie knot
  ctx.fillStyle = "#b91c1c";
  ctx.fillRect(tieX + 1, jacketY + 1, 4, 4);

  // === Head ===
  const headY = py;
  const headH = 16;
  // Face / skin
  ctx.fillStyle = "#fcd9b6"; // skin tone
  ctx.fillRect(px + 5, headY + 4, pw - 10, headH - 4);
  // Hair
  ctx.fillStyle = "#1c1917"; // dark hair
  ctx.fillRect(px + 4, headY, pw - 8, 6);
  if (facing === 1) {
    ctx.fillRect(px + 4, headY, 4, 10); // side hair left
  } else {
    ctx.fillRect(px + pw - 8, headY, 4, 10); // side hair right
  }
  // Eyes
  ctx.fillStyle = "#0f172a";
  if (facing === 1) {
    ctx.fillRect(px + pw - 12, headY + 8, 3, 3);
  } else {
    ctx.fillRect(px + 9, headY + 8, 3, 3);
  }

  // === Arms (suit sleeves) ===
  ctx.fillStyle = "#1e3a5f"; // same as jacket
  const armY = jacketY + 4;
  const armH = 12;
  if (facing === 1) {
    // Right arm forward
    ctx.fillRect(px + pw - 2, armY, 6, armH);
    // Hand
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(px + pw - 1, armY + armH, 4, 5);
  } else {
    // Left arm forward
    ctx.fillRect(px - 4, armY, 6, armH);
    // Hand
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(px - 3, armY + armH, 4, 5);
  }

  // === Briefcase (diplomat accessory) ===
  ctx.fillStyle = "#78350f"; // brown briefcase
  const briefcaseY = armY + armH + 5;
  if (facing === 1) {
    ctx.fillRect(px + pw, briefcaseY, 10, 8);
    ctx.fillStyle = "#d4af37"; // gold clasp
    ctx.fillRect(px + pw + 3, briefcaseY + 2, 4, 2);
  } else {
    ctx.fillRect(px - 10, briefcaseY, 10, 8);
    ctx.fillStyle = "#d4af37";
    ctx.fillRect(px - 7, briefcaseY + 2, 4, 2);
  }

  // === スキル発動中のオーラエフェクト ===
  if (player.activeSkill) {
    const skill = SKILLS[player.activeSkill];
    const pulse = Math.sin(game.time * 0.2) * 0.3 + 0.5;
    ctx.fillStyle = skill.color;
    ctx.globalAlpha = pulse * 0.3;
    ctx.beginPath();
    ctx.arc(px + pw/2, py + ph/2, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  
  // === 無敵時の点滅エフェクト ===
  if (player.invincible) {
    const blink = Math.floor(game.time / 4) % 2;
    if (blink === 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillRect(px, py, pw, ph);
    }
  }
}

// スキルインジケーター表示
function drawSkillIndicator() {
  if (!player.activeSkill) return;
  
  const skill = SKILLS[player.activeSkill];
  const skillDuration = skill.duration;
  const remaining = player.skillTimer / skillDuration;
  
  // 画面右下にスキル表示
  const indicatorX = W - 150;
  const indicatorY = H - 80;
  
  // 背景
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(indicatorX, indicatorY, 140, 50);
  ctx.strokeStyle = skill.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(indicatorX, indicatorY, 140, 50);
  
  // アイコンと名前
  ctx.font = "24px sans-serif";
  ctx.fillText(skill.icon, indicatorX + 10, indicatorY + 32);
  
  ctx.fillStyle = "#fff";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(skill.name, indicatorX + 45, indicatorY + 22);
  
  // 残り時間バー
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillRect(indicatorX + 45, indicatorY + 30, 85, 10);
  ctx.fillStyle = skill.color;
  ctx.fillRect(indicatorX + 45, indicatorY + 30, 85 * remaining, 10);
}

function drawEnemies(pal) {
  for (const e of enemies) {
    if (e.defeated && !e.isBoss) continue; // 倒された敵は描画しない
    
    drawEnemyByType(e);

    // label near if close
    const dx = Math.abs((e.x+e.w/2) - (player.x+player.w/2));
    const dy = Math.abs((e.y+e.h/2) - (player.y+player.h/2));
    if (dx < 140 && dy < 90) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
      const tag = e.unstompable ? "踏めない！" : "踏み付け可";
      ctx.fillText(`${nameOfEnemy(e.type)}（${tag}）`, e.x - 6, e.y - 8);
    }
  }
}

function drawEnemyByType(e) {
  const x = e.x, y = e.y, w = e.w, h = e.h;
  const facing = e.dir || 1;
  
  // 踏めない敵には赤いオーラ
  if (e.unstompable) {
    const pulse = Math.sin(game.time * 0.1) * 0.2 + 0.4;
    ctx.fillStyle = `rgba(255, 100, 100, ${pulse})`;
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  }
  
  if (e.type === "competitor") {
    // 競合企業の営業マン：スーツ、アタッシュケース、競争心溢れる姿
    // スーツジャケット（グレー）
    ctx.fillStyle = "#4a4a4a";
    ctx.fillRect(x + 3, y + 12, w - 6, h - 20);
    // ネクタイ（赤：攻撃的）
    ctx.fillStyle = "#cc3333";
    ctx.fillRect(x + w/2 - 2, y + 14, 4, 12);
    // 白シャツ
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(x + w/2 - 4, y + 12, 8, 6);
    // パンツ
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(x + 5, y + h - 10, 8, 10);
    ctx.fillRect(x + w - 13, y + h - 10, 8, 10);
    // 頭（短髪、整った印象）
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + 5, y, w - 10, 6);
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(x + 6, y + 5, w - 12, 9);
    // 目（鋭い）
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + (facing === 1 ? w - 11 : 9), y + 7, 3, 2);
    // アタッシュケース
    ctx.fillStyle = "#2a2a2a";
    if (facing === 1) {
      ctx.fillRect(x + w - 2, y + 20, 10, 8);
      ctx.fillStyle = "#c0c0c0";
      ctx.fillRect(x + w, y + 22, 6, 2);
    } else {
      ctx.fillRect(x - 8, y + 20, 10, 8);
      ctx.fillStyle = "#c0c0c0";
      ctx.fillRect(x - 6, y + 22, 6, 2);
    }

  } else if (e.type === "buyer") {
    // バイヤー：カジュアルビジネス、タブレット持ち
    // ジャケット（ネイビー）
    ctx.fillStyle = "#2a4a6a";
    ctx.fillRect(x + 3, y + 12, w - 6, h - 20);
    // シャツ（水色）
    ctx.fillStyle = "#a0c8e0";
    ctx.fillRect(x + w/2 - 4, y + 12, 8, 8);
    // チノパン
    ctx.fillStyle = "#c4a882";
    ctx.fillRect(x + 5, y + h - 10, 8, 10);
    ctx.fillRect(x + w - 13, y + h - 10, 8, 10);
    // 頭
    ctx.fillStyle = "#3a2a1a";
    ctx.fillRect(x + 5, y, w - 10, 5);
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(x + 6, y + 4, w - 12, 10);
    // メガネ
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 8, y + 6, 5, 4);
    ctx.strokeRect(x + w - 13, y + 6, 5, 4);
    // タブレット
    ctx.fillStyle = "#1a1a1a";
    if (facing === 1) {
      ctx.fillRect(x + w - 2, y + 16, 8, 12);
      ctx.fillStyle = "#4a90d9";
      ctx.fillRect(x + w, y + 18, 5, 8);
    } else {
      ctx.fillRect(x - 6, y + 16, 8, 12);
      ctx.fillStyle = "#4a90d9";
      ctx.fillRect(x - 5, y + 18, 5, 8);
    }

  } else if (e.type === "broker") {
    // ブローカー：派手なスーツ、ゴールドアクセサリー
    // スーツ（ピンストライプ）
    ctx.fillStyle = "#1a3050";
    ctx.fillRect(x + 3, y + 12, w - 6, h - 20);
    // ストライプ
    ctx.fillStyle = "#3a5070";
    ctx.fillRect(x + 6, y + 14, 2, h - 24);
    ctx.fillRect(x + 12, y + 14, 2, h - 24);
    ctx.fillRect(x + 18, y + 14, 2, h - 24);
    // ゴールドタイ
    ctx.fillStyle = "#d4af37";
    ctx.fillRect(x + w/2 - 2, y + 14, 4, 12);
    // パンツ
    ctx.fillStyle = "#1a2a3a";
    ctx.fillRect(x + 5, y + h - 10, 8, 10);
    ctx.fillRect(x + w - 13, y + h - 10, 8, 10);
    // 頭（オールバック）
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(x + 4, y - 2, w - 8, 8);
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(x + 6, y + 5, w - 12, 9);
    // サングラス
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + 7, y + 6, 6, 3);
    ctx.fillRect(x + w - 13, y + 6, 6, 3);
    // 金のネックレス
    ctx.fillStyle = "#d4af37";
    ctx.fillRect(x + 8, y + 12, w - 16, 2);

  } else if (e.type === "executive") {
    // 重役：高級スーツ、威厳のある姿
    // スーツ（黒に近い紺）
    ctx.fillStyle = "#0f1a2a";
    ctx.fillRect(x + 2, y + 12, w - 4, h - 20);
    // 高級ネクタイ（シルバー）
    ctx.fillStyle = "#8090a0";
    ctx.fillRect(x + w/2 - 3, y + 14, 6, 14);
    ctx.fillStyle = "#60708a";
    ctx.fillRect(x + w/2 - 2, y + 16, 4, 2);
    ctx.fillRect(x + w/2 - 2, y + 22, 4, 2);
    // 白シャツ
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + w/2 - 5, y + 12, 10, 6);
    // パンツ
    ctx.fillStyle = "#0a1020";
    ctx.fillRect(x + 4, y + h - 10, 9, 10);
    ctx.fillRect(x + w - 13, y + h - 10, 9, 10);
    // 頭（白髪混じり）
    ctx.fillStyle = "#6a6a7a";
    ctx.fillRect(x + 4, y - 2, w - 8, 8);
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(x + 6, y + 5, w - 12, 10);
    // 眉（威厳）
    ctx.fillStyle = "#4a4a5a";
    ctx.fillRect(x + 8, y + 5, 4, 2);
    ctx.fillRect(x + w - 12, y + 5, 4, 2);
    // 目
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + 9, y + 8, 2, 2);
    ctx.fillRect(x + w - 11, y + 8, 2, 2);

  } else if (e.type === "union") {
    // 労働組合代表：作業服、ヘルメット、メガホン
    // 作業着
    ctx.fillStyle = "#3a6a9a";
    ctx.fillRect(x + 3, y + 12, w - 6, h - 20);
    // 反射テープ
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(x + 4, y + 18, w - 8, 3);
    ctx.fillRect(x + 4, y + 24, w - 8, 3);
    // 作業パンツ
    ctx.fillStyle = "#2a4a6a";
    ctx.fillRect(x + 5, y + h - 10, 8, 10);
    ctx.fillRect(x + w - 13, y + h - 10, 8, 10);
    // ヘルメット（黄色）
    ctx.fillStyle = "#ffdd00";
    ctx.fillRect(x + 3, y - 4, w - 6, 10);
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(x + 6, y + 5, w - 12, 9);
    // 目（決意）
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + (facing === 1 ? w - 11 : 9), y + 7, 3, 2);
    // メガホン
    ctx.fillStyle = "#e04040";
    if (facing === 1) {
      ctx.beginPath();
      ctx.moveTo(x + w - 2, y + 16);
      ctx.lineTo(x + w + 10, y + 12);
      ctx.lineTo(x + w + 10, y + 24);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 16);
      ctx.lineTo(x - 10, y + 12);
      ctx.lineTo(x - 10, y + 24);
      ctx.closePath();
      ctx.fill();
    }

  } else if (e.type === "government") {
    // 政府官僚：きっちりしたスーツ、書類フォルダ
    // スーツ（ダークグレー）
    ctx.fillStyle = "#3a3a4a";
    ctx.fillRect(x + 2, y + 12, w - 4, h - 20);
    // ネクタイ（地味な青）
    ctx.fillStyle = "#3a5a7a";
    ctx.fillRect(x + w/2 - 2, y + 14, 4, 12);
    // 白シャツ
    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(x + w/2 - 4, y + 12, 8, 6);
    // パンツ
    ctx.fillStyle = "#2a2a3a";
    ctx.fillRect(x + 4, y + h - 10, 9, 10);
    ctx.fillRect(x + w - 13, y + h - 10, 9, 10);
    // 頭（きっちり整えた）
    ctx.fillStyle = "#1a1a2a";
    ctx.fillRect(x + 5, y, w - 10, 6);
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(x + 6, y + 5, w - 12, 9);
    // メガネ（角型）
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(x + 7, y + 6, 6, 4);
    ctx.fillRect(x + w - 13, y + 6, 6, 4);
    ctx.fillStyle = "rgba(200, 220, 255, 0.4)";
    ctx.fillRect(x + 8, y + 7, 4, 2);
    ctx.fillRect(x + w - 12, y + 7, 4, 2);
    // 書類フォルダ
    ctx.fillStyle = "#8b7355";
    if (facing === 1) {
      ctx.fillRect(x + w - 2, y + 16, 10, 14);
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(x + w, y + 18, 7, 10);
    } else {
      ctx.fillRect(x - 8, y + 16, 10, 14);
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(x - 7, y + 18, 7, 10);
    }

  } else if (e.type === "media") {
    // メディア記者：カジュアル、カメラ/マイク
    // カジュアルジャケット
    ctx.fillStyle = "#5a4a3a";
    ctx.fillRect(x + 3, y + 12, w - 6, h - 20);
    // Tシャツ
    ctx.fillStyle = "#e0e0e0";
    ctx.fillRect(x + w/2 - 4, y + 12, 8, 8);
    // ジーンズ
    ctx.fillStyle = "#3a5a7a";
    ctx.fillRect(x + 5, y + h - 10, 8, 10);
    ctx.fillRect(x + w - 13, y + h - 10, 8, 10);
    // 頭
    ctx.fillStyle = "#5a4a3a";
    ctx.fillRect(x + 5, y, w - 10, 5);
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(x + 6, y + 4, w - 12, 10);
    // 目（観察する目）
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + 8, y + 6, 3, 3);
    ctx.fillRect(x + w - 11, y + 6, 3, 3);
    // カメラ
    ctx.fillStyle = "#1a1a1a";
    if (facing === 1) {
      ctx.fillRect(x + w - 2, y + 10, 14, 10);
      ctx.fillStyle = "#4a90d9";
      ctx.beginPath();
      ctx.arc(x + w + 5, y + 15, 4, 0, Math.PI * 2);
      ctx.fill();
      // フラッシュエフェクト
      const flash = Math.sin(game.time * 0.2) * 0.4 + 0.3;
      ctx.fillStyle = `rgba(255, 255, 255, ${flash})`;
      ctx.beginPath();
      ctx.arc(x + w + 5, y + 15, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(x - 12, y + 10, 14, 10);
      ctx.fillStyle = "#4a90d9";
      ctx.beginPath();
      ctx.arc(x - 5, y + 15, 4, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (e.type === "gatekeeper") {
    // 受付/ゲートキーパー：制服、バッジ
    // 制服（紺）
    ctx.fillStyle = "#1a2a4a";
    ctx.fillRect(x + 2, y + 12, w - 4, h - 20);
    // 名札
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 5, y + 16, 8, 6);
    ctx.fillStyle = "#d4af37";
    ctx.fillRect(x + 6, y + 17, 6, 4);
    // スカート/パンツ
    ctx.fillStyle = "#0a1a3a";
    ctx.fillRect(x + 4, y + h - 10, 9, 10);
    ctx.fillRect(x + w - 13, y + h - 10, 9, 10);
    // 頭（きっちりまとめた）
    ctx.fillStyle = "#2a1a1a";
    ctx.fillRect(x + 5, y, w - 10, 6);
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(x + 6, y + 5, w - 12, 9);
    // 丁寧な表情
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + (facing === 1 ? w - 11 : 9), y + 7, 2, 2);
    // クリップボード
    ctx.fillStyle = "#d4a574";
    if (facing === 1) {
      ctx.fillRect(x + w - 2, y + 18, 10, 12);
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(x + w, y + 20, 7, 8);
    } else {
      ctx.fillRect(x - 8, y + 18, 10, 12);
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(x - 7, y + 20, 7, 8);
    }

  } else if (e.type === "boss_market") {
    // Stage 1 Boss: 海外バイヤー長
    // Draw boss glow aura
    if (!e.defeated) {
      const pulse = Math.sin(game.time * 0.08) * 0.2 + 0.4;
      ctx.fillStyle = `rgba(255, 200, 100, ${pulse})`;
      ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
    }
    
    // Expensive suit (dark navy with gold trim)
    ctx.fillStyle = "#0a1a3a";
    ctx.fillRect(x + 3, y + 14, w - 6, h - 22);
    // Gold trim
    ctx.fillStyle = "#d4af37";
    ctx.fillRect(x + 3, y + 14, 3, h - 22);
    ctx.fillRect(x + w - 6, y + 14, 3, h - 22);
    // Golden tie
    ctx.fillStyle = "#d4af37";
    ctx.fillRect(x + w/2 - 3, y + 16, 6, 16);
    // White shirt
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + w/2 - 5, y + 14, 10, 8);
    // Pants
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(x + 5, y + h - 10, 10, 10);
    ctx.fillRect(x + w - 15, y + h - 10, 10, 10);
    // Head (distinguished, gray temples)
    ctx.fillStyle = "#4a4a5a";
    ctx.fillRect(x + 4, y - 2, w - 8, 10);
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(x + 6, y + 6, w - 12, 12);
    // Distinctive features
    ctx.fillStyle = "#2a2a3a";
    ctx.fillRect(x + 8, y + 10, 3, 3);
    ctx.fillRect(x + w - 11, y + 10, 3, 3);
    // Crown/status indicator
    ctx.fillStyle = "#ffd700";
    ctx.font = "12px sans-serif";
    ctx.fillText("👑", x + w/2 - 6, y - 8);
    // Boss HP indicator
    if (e.bossHP !== undefined && !e.defeated) {
      drawBossHPBar(x, y - 20, w, e.bossHP, 3);
    }
    
  } else if (e.type === "boss_office") {
    // Stage 2 Boss: CEO
    if (!e.defeated) {
      const pulse = Math.sin(game.time * 0.1) * 0.2 + 0.5;
      ctx.fillStyle = `rgba(100, 150, 255, ${pulse})`;
      ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
    }
    
    // Premium black suit
    ctx.fillStyle = "#050510";
    ctx.fillRect(x + 2, y + 14, w - 4, h - 22);
    // Platinum cufflinks
    ctx.fillStyle = "#c0c0c0";
    ctx.fillRect(x + 2, y + 24, 4, 3);
    ctx.fillRect(x + w - 6, y + 24, 4, 3);
    // Silk tie (deep blue)
    ctx.fillStyle = "#1a3a6a";
    ctx.fillRect(x + w/2 - 3, y + 16, 6, 18);
    // Crisp white shirt
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + w/2 - 6, y + 14, 12, 8);
    // Premium pants
    ctx.fillStyle = "#020208";
    ctx.fillRect(x + 4, y + h - 12, 11, 12);
    ctx.fillRect(x + w - 15, y + h - 12, 11, 12);
    // Head (powerful presence)
    ctx.fillStyle = "#3a3a4a";
    ctx.fillRect(x + 3, y - 4, w - 6, 12);
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(x + 5, y + 6, w - 10, 14);
    // Stern eyes
    ctx.fillStyle = "#1a1a2a";
    ctx.fillRect(x + 8, y + 10, 4, 3);
    ctx.fillRect(x + w - 12, y + 10, 4, 3);
    // CEO badge
    ctx.fillStyle = "#ffd700";
    ctx.font = "14px sans-serif";
    ctx.fillText("🏆", x + w/2 - 7, y - 10);
    // Boss HP indicator
    if (e.bossHP !== undefined && !e.defeated) {
      drawBossHPBar(x, y - 25, w, e.bossHP, 3);
    }
    
  } else if (e.type === "boss_port") {
    // Stage 3 Boss: 通関局長
    if (!e.defeated) {
      const pulse = Math.sin(game.time * 0.12) * 0.25 + 0.45;
      ctx.fillStyle = `rgba(100, 200, 150, ${pulse})`;
      ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
    }
    
    // Official uniform (dark green)
    ctx.fillStyle = "#1a3a2a";
    ctx.fillRect(x + 2, y + 14, w - 4, h - 22);
    // Official badges
    ctx.fillStyle = "#d4af37";
    ctx.fillRect(x + 5, y + 18, 6, 6);
    ctx.fillRect(x + 5, y + 26, 6, 6);
    ctx.fillRect(x + w - 11, y + 18, 6, 6);
    // Official epaulettes
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(x + 2, y + 14, 8, 4);
    ctx.fillRect(x + w - 10, y + 14, 8, 4);
    // White shirt
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(x + w/2 - 5, y + 14, 10, 10);
    // Official tie
    ctx.fillStyle = "#2a2a4a";
    ctx.fillRect(x + w/2 - 2, y + 16, 4, 14);
    // Pants
    ctx.fillStyle = "#0a1a1a";
    ctx.fillRect(x + 4, y + h - 12, 12, 12);
    ctx.fillRect(x + w - 16, y + h - 12, 12, 12);
    // Head (official cap)
    ctx.fillStyle = "#1a2a2a";
    ctx.fillRect(x + 2, y - 8, w - 4, 10);
    ctx.fillStyle = "#d4af37";
    ctx.fillRect(x + w/2 - 6, y - 6, 12, 4);
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(x + 5, y + 4, w - 10, 14);
    // Authoritative eyes
    ctx.fillStyle = "#1a1a2a";
    ctx.fillRect(x + 9, y + 8, 4, 3);
    ctx.fillRect(x + w - 13, y + 8, 4, 3);
    // Official seal
    ctx.fillStyle = "#ffd700";
    ctx.font = "14px sans-serif";
    ctx.fillText("🏛️", x + w/2 - 7, y - 16);
    // Boss HP indicator
    if (e.bossHP !== undefined && !e.defeated) {
      drawBossHPBar(x, y - 30, w, e.bossHP, 3);
    }

  } else {
    // Default fallback
    let c = "#ef4444";
    if (!e.hostile) c = "#eab308";
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x + 5, y + 8, w - 10, 8);
  }
}

// Draw boss HP bar
function drawBossHPBar(x, y, w, currentHP, maxHP) {
  const barW = w + 10;
  const barH = 8;
  const barX = x - 5;
  
  // Background
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(barX, y, barW, barH);
  
  // Border
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, y, barW, barH);
  
  // HP segments
  const segmentW = (barW - 4) / maxHP;
  for (let i = 0; i < maxHP; i++) {
    if (i < currentHP) {
      ctx.fillStyle = "#ef4444";
    } else {
      ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
    }
    ctx.fillRect(barX + 2 + i * segmentW, y + 2, segmentW - 2, barH - 4);
  }
}

function nameOfEnemy(type) {
  const map = {
    competitor: "競合営業",
    buyer: "バイヤー",
    broker: "ブローカー",
    executive: "重役",
    union: "組合代表",
    government: "官僚",
    media: "記者",
    gatekeeper: "受付",
    boss_market: "【ボス】バイヤー長",
    boss_office: "【ボス】CEO",
    boss_port: "【ボス】通関局長",
  };
  return map[type] || type;
}

function drawHUD(pal) {
  if (!game.stage) return;
  
  // top bar
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0,0,W,58);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "16px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(game.stage.title, 12, 20);

  // Trust/評判 bar
  const trustW = 140, trustH = 10;
  const tx = 12, ty = 30;
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(tx, ty, trustW, trustH);
  const trustColor = player.trust > 60 ? "#22c55e" : (player.trust > 30 ? "#eab308" : "#ef4444");
  ctx.fillStyle = trustColor;
  ctx.fillRect(tx, ty, trustW * (player.trust/100), trustH);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`評判`, tx + trustW + 8, ty + 9);

  // HP
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`❤️ ${player.hp}`, 220, 38);
  
  // お金（コイン）💰
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`💰 ${player.coins}`, 280, 38);
  
  // 人脈（コネクション）👤
  ctx.fillStyle = "#4a90d9";
  ctx.fillText(`👤 ${player.connections}`, 350, 38);
  
  // Career level indicator
  const careerInfo = CAREER_LEVELS.find(l => l.level === playerGlobal.careerLevel);
  ctx.fillStyle = "#ffd700";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`🏆 ${careerInfo.title}`, 420, 38);
  
  // Boss status indicator
  if (!game.bossDefeated) {
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 12px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText("👑 ボス:踏め!", 510, 38);
  } else {
    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 12px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText("✅ ボス撃破", 510, 38);
  }

  // message
  if (game.messageT > 0 && game.message) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, H-64, W, 64);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "16px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(game.message, 14, H-28);
  }

  // stage notes mini (right side)
  if (game.stage.npcNotes && game.stage.npcNotes.length) {
    ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    const baseX = W - 360, baseY = 16;
    ctx.fillText("交渉メモ：", baseX, baseY);
    for (let i=0;i<Math.min(2, game.stage.npcNotes.length); i++) {
      ctx.fillText("・" + game.stage.npcNotes[i], baseX, baseY + 14*(i+1));
    }
  }
}

function drawIntroOverlay(pal) {
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(0,0,W,H);

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "24px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(game.stage.title, 40, 70);

  ctx.font = "16px system-ui, -apple-system, Segoe UI, sans-serif";
  const lines = game.stage.intro || ["..."];
  const shown = lines.slice(0, game.introLine + 1);
  let y = 120;
  for (const ln of shown) {
    wrapText(ln, 40, y, W-80, 22);
    y += 30;
  }

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("Enter / Space / E で進む", 40, H - 40);
}

function drawGameoverOverlay(pal) {
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.fillRect(0,0,W,H);
  ctx.fillStyle = "rgba(255,100,100,0.95)";
  ctx.font = "28px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("商談失敗", 40, 80);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "16px system-ui, -apple-system, Segoe UI, sans-serif";
  wrapText(game.message || "Rで再開", 40, 130, W-80, 22);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("Rでリトライ　|　Enter/Spaceでトップページへ", 40, H - 40);
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = text.split("");
  let line = "";
  for (let i=0;i<words.length;i++) {
    const test = line + words[i];
    const w = ctx.measureText(test).width;
    if (w > maxWidth && line.length > 0) {
      ctx.fillText(line, x, y);
      line = words[i];
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

function drawStageSelectOverlay() {
  // Full screen background
  ctx.fillStyle = "#0a1525";
  ctx.fillRect(0, 0, W, H);
  
  // Title
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "bold 32px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("商社マン：ビジネス交渉ゲーム", 40, 60);
  
  ctx.font = "16px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(255,200,100,0.8)";
  ctx.fillText("〜 お金💰と人脈👤で契約を勝ち取れ！ 〜", 40, 90);
  
  // Stage list
  const startY = 130;
  const itemHeight = 115;
  
  for (let i = 0; i < STAGES.length; i++) {
    const stage = STAGES[i];
    const y = startY + i * itemHeight;
    const isSelected = i === game.selectedStage;
    
    // Background card
    if (isSelected) {
      ctx.fillStyle = "rgba(100, 150, 255, 0.25)";
      ctx.fillRect(30, y - 10, W - 60, itemHeight - 10);
      ctx.strokeStyle = "rgba(100, 150, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(30, y - 10, W - 60, itemHeight - 10);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(30, y - 10, W - 60, itemHeight - 10);
    }
    
    // Stage palette preview (small color bars)
    const pal = stage.palette;
    const previewX = 50;
    const previewY = y + 5;
    ctx.fillStyle = pal.sky;
    ctx.fillRect(previewX, previewY, 20, 50);
    ctx.fillStyle = pal.far;
    ctx.fillRect(previewX + 20, previewY, 20, 50);
    ctx.fillStyle = pal.mid;
    ctx.fillRect(previewX + 40, previewY, 20, 50);
    ctx.fillStyle = pal.ground;
    ctx.fillRect(previewX + 60, previewY, 20, 50);
    ctx.fillStyle = pal.accent;
    ctx.fillRect(previewX + 80, previewY, 20, 50);
    
    // Stage number and title
    ctx.fillStyle = isSelected ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)";
    ctx.font = isSelected ? "bold 20px system-ui, -apple-system, Segoe UI, sans-serif" : "18px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(`Stage ${i + 1}: ${stage.title}`, 170, y + 20);
    
    // Stage intro preview
    ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    if (stage.intro && stage.intro.length > 0) {
      const previewText = stage.intro[0].substring(0, 60) + (stage.intro[0].length > 60 ? "…" : "");
      ctx.fillText(previewText, 170, y + 45);
    }
    
    // 交渉相手数とコレクティブル数
    ctx.fillStyle = "rgba(255,200,100,0.7)";
    const collectCount = stage.collectibles ? stage.collectibles.length : 0;
    ctx.fillText(`交渉相手: ${stage.enemySpawns.length}人　収集品: ${collectCount}個`, 170, y + 70);
    
    // Selection indicator
    if (isSelected) {
      ctx.fillStyle = "#ffd700";
      ctx.font = "24px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText("▶", 38, y + 35);
    }
  }
  
  // Instructions
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("↑↓ / W/S: 選択　Enter / Space / E: 決定　Esc / Backspace: 戻る", 40, H - 30);
}

// RPG-style Top Menu with 3 locations
function drawTopMenuOverlay() {
  // Full screen background with gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#0a1828");
  gradient.addColorStop(0.5, "#1a3050");
  gradient.addColorStop(1, "#0f2035");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  
  // Draw decorative ground line
  ctx.fillStyle = "#2a4a6a";
  ctx.fillRect(0, H - 80, W, 80);
  ctx.fillStyle = "#3a5a7a";
  ctx.fillRect(0, H - 80, W, 3);
  
  // Draw stars
  for (let i = 0; i < 50; i++) {
    const sx = (game.time * 0.02 + i * 73) % W;
    const sy = (i * 31) % (H - 100);
    const alpha = 0.3 + Math.sin(game.time * 0.05 + i) * 0.2;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(sx, sy, 2, 2);
  }
  
  // Title
  ctx.fillStyle = "rgba(255, 220, 150, 0.95)";
  ctx.font = "bold 36px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("商社マン：ビジネス交渉ゲーム", 60, 60);
  
  ctx.font = "16px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(255, 200, 100, 0.7)";
  ctx.fillText("〜 街を歩いて、交渉の舞台へ 〜", 60, 90);
  
  // Player global stats with career level
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  const careerInfo = CAREER_LEVELS.find(l => l.level === playerGlobal.careerLevel);
  ctx.fillText(`💰 貯金: ${playerGlobal.savings}　👤 人脈: ${playerGlobal.networkTotal}　🏆 ${careerInfo.title}（Lv.${playerGlobal.careerLevel}）`, W - 420, 30);
  
  // Define the 4 locations
  const locations = [
    { 
      name: "① 本社", 
      subtitle: "設定・着せ替え",
      desc: "キャラクターのスタイルを変更",
      icon: "🏢",
      x: 30,
      color: "#4a6a9a"
    },
    { 
      name: "② 支社", 
      subtitle: "貯金・人脈蓄積",
      desc: "資金を管理し、人脈を広げる",
      icon: "🏦",
      x: 250,
      color: "#5a7a6a"
    },
    { 
      name: "③ メーカー", 
      subtitle: "服・アイテム購入",
      desc: "スタイルやパワーアップを購入",
      icon: "🏭",
      x: 470,
      color: "#8a6a5a"
    },
    { 
      name: "④ 交通センター", 
      subtitle: "ステージ選択",
      desc: "各地の商談現場へ出発",
      icon: "🚉",
      x: 690,
      color: "#7a5a6a"
    }
  ];
  
  // Draw location cards
  const cardY = 160;
  const cardW = 200;
  const cardH = 280;
  
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    const isSelected = i === game.topMenuSelection;
    
    // Card background
    if (isSelected) {
      // Glowing effect
      ctx.fillStyle = "rgba(255, 200, 100, 0.2)";
      ctx.fillRect(loc.x - 8, cardY - 8, cardW + 16, cardH + 16);
      
      ctx.fillStyle = loc.color;
      ctx.fillRect(loc.x, cardY, cardW, cardH);
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 3;
      ctx.strokeRect(loc.x, cardY, cardW, cardH);
    } else {
      ctx.fillStyle = "rgba(40, 60, 80, 0.7)";
      ctx.fillRect(loc.x, cardY, cardW, cardH);
      ctx.strokeStyle = "rgba(100, 120, 140, 0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(loc.x, cardY, cardW, cardH);
    }
    
    // Icon area
    ctx.fillStyle = isSelected ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(loc.x + 10, cardY + 10, cardW - 20, 100);
    
    // Icon
    ctx.font = "60px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(loc.icon, loc.x + cardW/2 - 30, cardY + 80);
    
    // Building silhouette decoration
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    if (i === 0) {
      // Headquarters - tall building
      ctx.fillRect(loc.x + 30, cardY + 60, 25, 45);
      ctx.fillRect(loc.x + 60, cardY + 50, 30, 55);
      ctx.fillRect(loc.x + 95, cardY + 70, 20, 35);
      ctx.fillRect(loc.x + 130, cardY + 55, 35, 50);
      ctx.fillRect(loc.x + 170, cardY + 65, 20, 40);
    } else if (i === 1) {
      // Branch - bank style
      ctx.fillRect(loc.x + 40, cardY + 55, 140, 50);
      ctx.fillRect(loc.x + 70, cardY + 40, 80, 65);
      // Columns
      ctx.fillRect(loc.x + 55, cardY + 60, 8, 40);
      ctx.fillRect(loc.x + 85, cardY + 60, 8, 40);
      ctx.fillRect(loc.x + 125, cardY + 60, 8, 40);
      ctx.fillRect(loc.x + 155, cardY + 60, 8, 40);
    } else {
      // Transport center - train station
      ctx.fillRect(loc.x + 30, cardY + 70, 160, 35);
      ctx.fillRect(loc.x + 80, cardY + 50, 60, 55);
      // Platform
      ctx.fillRect(loc.x + 20, cardY + 95, 180, 10);
    }
    
    // Location name
    ctx.fillStyle = isSelected ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.7)";
    ctx.font = isSelected ? "bold 22px system-ui, -apple-system, Segoe UI, sans-serif" : "20px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(loc.name, loc.x + 15, cardY + 145);
    
    // Subtitle
    ctx.fillStyle = isSelected ? "rgba(255, 200, 100, 0.9)" : "rgba(255, 200, 100, 0.6)";
    ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(loc.subtitle, loc.x + 15, cardY + 170);
    
    // Description
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(loc.desc, loc.x + 15, cardY + 195);
    
    // Selection indicator
    if (isSelected) {
      ctx.fillStyle = "#ffd700";
      ctx.font = "24px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText("▼", loc.x + cardW/2 - 8, cardY - 15);
      
      // Animated hint
      const pulse = Math.sin(game.time * 0.1) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(255, 200, 100, ${pulse})`;
      ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText("Enter / Space で入る", loc.x + cardW/2 - 60, cardY + cardH + 30);
    }
  }
  
  // Draw player character walking animation at bottom
  const walkX = 50 + game.topMenuSelection * 220 + Math.sin(game.time * 0.05) * 5;
  const walkY = H - 50;
  drawMiniPlayer(walkX, walkY);
  
  // Instructions
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("←→ / A/D: 移動　Enter / Space / E: 決定", 40, H - 10);
}

// Draw mini player for menu screens
function drawMiniPlayer(x, y) {
  // Simple businessman sprite
  // Legs
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(x - 6, y - 10, 5, 10);
  ctx.fillRect(x + 1, y - 10, 5, 10);
  // Body/suit
  ctx.fillStyle = "#1e3a5f";
  ctx.fillRect(x - 8, y - 25, 16, 16);
  // Tie
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(x - 2, y - 24, 4, 10);
  // Head
  ctx.fillStyle = "#fcd9b6";
  ctx.fillRect(x - 6, y - 35, 12, 10);
  // Hair
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(x - 6, y - 38, 12, 4);
  // Briefcase
  ctx.fillStyle = "#78350f";
  ctx.fillRect(x + 8, y - 18, 8, 6);
  ctx.fillStyle = "#d4af37";
  ctx.fillRect(x + 10, y - 16, 4, 2);
}

// Headquarters menu overlay
function drawHeadquartersOverlay() {
  // Background
  ctx.fillStyle = "#1a2535";
  ctx.fillRect(0, 0, W, H);
  
  // Office interior pattern
  ctx.fillStyle = "#2a3545";
  for (let i = 0; i < 10; i++) {
    ctx.fillRect(i * 100, 0, 2, H);
  }
  
  // Title
  ctx.fillStyle = "rgba(255, 220, 150, 0.95)";
  ctx.font = "bold 28px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("🏢 本社 - 設定・着せ替え", 50, 50);
  
  // Stats display
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`💰 貯金: ${playerGlobal.savings}　現在のスタイル: スタイル${playerGlobal.outfit + 1}`, 50, 85);
  
  // Menu options
  const options = [
    { text: "👔 着せ替え変更", desc: "解放済みスタイルを切り替える" },
    { text: "🔓 新スタイル解放", desc: `10💰で新スタイルを解放（残り: ${playerGlobal.outfitsUnlocked.filter(v => !v).length}）` },
    { text: "◀ 戻る", desc: "トップメニューへ戻る" }
  ];
  
  const menuY = 140;
  const itemHeight = 70;
  
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const y = menuY + i * itemHeight;
    const isSelected = i === game.headquartersSelection;
    
    // Background
    if (isSelected) {
      ctx.fillStyle = "rgba(100, 150, 200, 0.3)";
      ctx.fillRect(40, y - 10, 400, itemHeight - 10);
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 2;
      ctx.strokeRect(40, y - 10, 400, itemHeight - 10);
    }
    
    // Option text
    ctx.fillStyle = isSelected ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.6)";
    ctx.font = isSelected ? "bold 18px system-ui, -apple-system, Segoe UI, sans-serif" : "16px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(opt.text, 60, y + 15);
    
    // Description
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(opt.desc, 60, y + 35);
    
    if (isSelected) {
      ctx.fillStyle = "#ffd700";
      ctx.font = "20px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText("▶", 45, y + 18);
    }
  }
  
  // Preview player with current outfit
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(500, 120, 200, 250);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(500, 120, 200, 250);
  
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("プレビュー", 560, 145);
  
  // Draw larger player preview
  drawPlayerPreview(580, 280, playerGlobal.outfit);
  
  // Unlocked styles indicator
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
  const unlockedCount = playerGlobal.outfitsUnlocked.filter(v => v).length;
  ctx.fillText(`解放済み: ${unlockedCount}/${playerGlobal.outfitsUnlocked.length}`, 550, 390);
  
  // Instructions
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("↑↓: 選択　Enter / Space: 決定　Esc / Backspace: 戻る", 40, H - 30);
}

// Draw player preview for outfit selection
function drawPlayerPreview(x, y, outfit) {
  // Scale up the player (3x)
  const scale = 3;
  
  // Outfit color variations
  const outfitColors = [
    { suit: "#1e3a5f", tie: "#dc2626", pants: "#1e293b" }, // Default blue suit, red tie
    { suit: "#2d3748", tie: "#805ad5", pants: "#1a202c" }, // Gray suit, purple tie
    { suit: "#1a365d", tie: "#38a169", pants: "#171923" }, // Navy suit, green tie
  ];
  
  const colors = outfitColors[outfit] || outfitColors[0];
  
  // Legs
  ctx.fillStyle = colors.pants;
  ctx.fillRect(x - 8*scale, y - 14*scale, 6*scale, 14*scale);
  ctx.fillRect(x + 2*scale, y - 14*scale, 6*scale, 14*scale);
  
  // Shoes
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(x - 9*scale, y - 4*scale, 7*scale, 4*scale);
  ctx.fillRect(x + 2*scale, y - 4*scale, 7*scale, 4*scale);
  
  // Body/suit
  ctx.fillStyle = colors.suit;
  ctx.fillRect(x - 10*scale, y - 28*scale, 20*scale, 16*scale);
  
  // Shirt
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(x - 3*scale, y - 28*scale, 6*scale, 8*scale);
  
  // Tie
  ctx.fillStyle = colors.tie;
  ctx.fillRect(x - 2*scale, y - 27*scale, 4*scale, 14*scale);
  
  // Head
  ctx.fillStyle = "#fcd9b6";
  ctx.fillRect(x - 7*scale, y - 40*scale, 14*scale, 12*scale);
  
  // Hair
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(x - 7*scale, y - 44*scale, 14*scale, 5*scale);
  
  // Eyes
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(x + 2*scale, y - 36*scale, 3*scale, 3*scale);
  
  // Briefcase
  ctx.fillStyle = "#78350f";
  ctx.fillRect(x + 10*scale, y - 20*scale, 10*scale, 8*scale);
  ctx.fillStyle = "#d4af37";
  ctx.fillRect(x + 12*scale, y - 18*scale, 6*scale, 2*scale);
}

// Connection dictionary overlay (人脈図鑑)
function drawDictionaryOverlay() {
  // Background
  ctx.fillStyle = "#1a1a2a";
  ctx.fillRect(0, 0, W, H);
  
  // Book-style pattern
  ctx.fillStyle = "#252535";
  ctx.fillRect(40, 80, W - 80, H - 140);
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 80, W - 80, H - 140);
  
  // Binding decoration
  ctx.fillStyle = "#8b4513";
  ctx.fillRect(60, 80, 20, H - 140);
  
  // Title
  ctx.fillStyle = "rgba(255, 220, 150, 0.95)";
  ctx.font = "bold 28px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("📇 人脈図鑑 - Connection Dictionary", 100, 50);
  
  // Stats
  const totalTypes = Object.keys(CONNECTION_TYPES).length;
  const metCount = Object.keys(playerGlobal.connectionDict).filter(k => playerGlobal.connectionDict[k]?.met).length;
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`収集率: ${metCount}/${totalTypes} (${Math.round(metCount/totalTypes*100)}%)`, W - 200, 50);
  
  // Get connection types for current page
  const connectionTypes = Object.keys(CONNECTION_TYPES);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(connectionTypes.length / itemsPerPage);
  const startIdx = game.dictionaryPage * itemsPerPage;
  const pageTypes = connectionTypes.slice(startIdx, startIdx + itemsPerPage);
  
  // Draw entries
  const entryY = 110;
  const entryH = 95;
  
  for (let i = 0; i < pageTypes.length; i++) {
    const type = pageTypes[i];
    const info = CONNECTION_TYPES[type];
    const playerData = playerGlobal.connectionDict[type];
    const met = playerData?.met || false;
    const negotiated = playerData?.negotiated || false;
    const count = playerData?.count || 0;
    
    const y = entryY + i * entryH;
    
    // Entry background
    if (met) {
      ctx.fillStyle = "rgba(100, 150, 200, 0.2)";
    } else {
      ctx.fillStyle = "rgba(50, 50, 60, 0.5)";
    }
    ctx.fillRect(100, y, W - 180, entryH - 10);
    
    // Category badge
    ctx.fillStyle = getBadgeColor(info.category);
    ctx.fillRect(105, y + 5, 60, 20);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(info.category, 110, y + 18);
    
    // Name
    if (met) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.font = "bold 18px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText(info.name, 180, y + 22);
      
      // Description
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.font = "13px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText(info.description, 180, y + 45);
      
      // Stats
      ctx.fillStyle = negotiated ? "#22c55e" : "#eab308";
      ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
      const status = negotiated ? "✅ 交渉成功" : "📍 出会った";
      ctx.fillText(`${status}　交渉回数: ${count}回`, 180, y + 70);
      
      // Icon for type
      ctx.font = "30px sans-serif";
      const icons = {
        competitor: "💼", buyer: "🛒", broker: "🤝", executive: "👔",
        union: "🔧", government: "🏛️", media: "📷", gatekeeper: "🚪",
        boss_market: "👑", boss_office: "🏆", boss_port: "🏛️"
      };
      ctx.fillText(icons[type] || "👤", W - 120, y + 50);
      
    } else {
      // Unknown entry
      ctx.fillStyle = "rgba(100, 100, 100, 0.7)";
      ctx.font = "bold 18px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText("？？？", 180, y + 22);
      
      ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
      ctx.font = "13px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText("まだ出会っていません。ステージをプレイして出会いましょう。", 180, y + 45);
      
      ctx.font = "30px sans-serif";
      ctx.fillText("❓", W - 120, y + 50);
    }
  }
  
  // Page indicator
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = "16px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`ページ ${game.dictionaryPage + 1} / ${totalPages}`, W/2 - 40, H - 60);
  
  // Navigation arrows
  if (game.dictionaryPage > 0) {
    ctx.fillStyle = "#ffd700";
    ctx.font = "24px sans-serif";
    ctx.fillText("◀", 100, H - 55);
  }
  if (game.dictionaryPage < totalPages - 1) {
    ctx.fillStyle = "#ffd700";
    ctx.font = "24px sans-serif";
    ctx.fillText("▶", W - 120, H - 55);
  }
  
  // Instructions
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("←→: ページ移動　Enter / Space / Esc: 戻る", 100, H - 25);
}

// Helper function for category badge colors
function getBadgeColor(category) {
  const colors = {
    "ビジネス": "#4a6a9a",
    "顧客": "#5a8a6a",
    "仲介": "#8a7a5a",
    "VIP": "#9a5a6a",
    "労働": "#6a5a8a",
    "行政": "#5a6a8a",
    "メディア": "#8a5a5a",
    "窓口": "#6a7a6a",
    "ボス": "#d4af37",
  };
  return colors[category] || "#555";
}

// Branch office menu overlay
function drawBranchOverlay() {
  // Background
  ctx.fillStyle = "#152525";
  ctx.fillRect(0, 0, W, H);
  
  // Bank-style pattern
  ctx.fillStyle = "#1a3030";
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(100 + i * 120, 80, 8, H - 160);
  }
  
  // Title
  ctx.fillStyle = "rgba(255, 220, 150, 0.95)";
  ctx.font = "bold 28px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("🏦 支社 - 貯金・人脈蓄積", 50, 50);
  
  // Stats display
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`💰 貯金: ${playerGlobal.savings}　👤 人脈蓄積: ${playerGlobal.networkTotal}`, 50, 85);
  ctx.fillText(`次ステージ開始時: 💰${player.coins}　👤${player.connections}`, 50, 105);
  
  // Menu options
  const options = [
    { text: "📊 貯金状況を見る", desc: "各ステージクリアで貯金が増加します" },
    { text: "💹 投資する", desc: `5💰 → 次ステージで💰+3（貯金: ${playerGlobal.savings}）` },
    { text: "🤝 人脈を広げる", desc: `8💰 → 👤+1（貯金: ${playerGlobal.savings}）` },
    { text: "◀ 戻る", desc: "トップメニューへ戻る" }
  ];
  
  const menuY = 150;
  const itemHeight = 70;
  
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const y = menuY + i * itemHeight;
    const isSelected = i === game.branchSelection;
    
    // Background
    if (isSelected) {
      ctx.fillStyle = "rgba(100, 180, 150, 0.3)";
      ctx.fillRect(40, y - 10, 450, itemHeight - 10);
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 2;
      ctx.strokeRect(40, y - 10, 450, itemHeight - 10);
    }
    
    // Option text
    ctx.fillStyle = isSelected ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.6)";
    ctx.font = isSelected ? "bold 18px system-ui, -apple-system, Segoe UI, sans-serif" : "16px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(opt.text, 60, y + 15);
    
    // Description
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(opt.desc, 60, y + 35);
    
    if (isSelected) {
      ctx.fillStyle = "#ffd700";
      ctx.font = "20px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText("▶", 45, y + 18);
    }
  }
  
  // Right side: stats visualization
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(520, 140, 200, 280);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(520, 140, 200, 280);
  
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("資産状況", 585, 165);
  
  // Savings bar
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("💰 貯金", 540, 200);
  
  ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
  ctx.fillRect(540, 210, 160, 20);
  ctx.fillStyle = "#ffd700";
  const savingsW = Math.min(160, playerGlobal.savings * 4);
  ctx.fillRect(540, 210, savingsW, 20);
  ctx.fillStyle = "#fff";
  ctx.fillText(`${playerGlobal.savings}`, 545, 225);
  
  // Network bar
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fillText("👤 人脈", 540, 260);
  
  ctx.fillStyle = "rgba(74, 144, 217, 0.3)";
  ctx.fillRect(540, 270, 160, 20);
  ctx.fillStyle = "#4a90d9";
  const networkW = Math.min(160, playerGlobal.networkTotal * 8);
  ctx.fillRect(540, 270, networkW, 20);
  ctx.fillStyle = "#fff";
  ctx.fillText(`${playerGlobal.networkTotal}`, 545, 285);
  
  // Next stage resources
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("次ステージ開始時の所持品:", 540, 330);
  ctx.fillStyle = "#ffd700";
  ctx.fillText(`💰 ${player.coins}`, 540, 355);
  ctx.fillStyle = "#4a90d9";
  ctx.fillText(`👤 ${player.connections}`, 600, 355);
  
  // Instructions
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("↑↓: 選択　Enter / Space: 決定　Esc / Backspace: 戻る", 40, H - 30);
}

// Manufacturer menu overlay (メーカー - 服やアイテム購入)
function drawManufacturerOverlay() {
  // Background
  ctx.fillStyle = "#1a2025";
  ctx.fillRect(0, 0, W, H);
  
  // Factory/shop pattern
  ctx.fillStyle = "#252a30";
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(50 + i * 160, 100, 120, H - 180);
  }
  
  // Title
  ctx.fillStyle = "rgba(255, 220, 150, 0.95)";
  ctx.font = "bold 28px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("🏭 メーカー - 服・アイテム購入", 50, 50);
  
  // Stats display
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`💰 貯金: ${playerGlobal.savings}`, 50, 85);
  
  // Menu items
  const menuY = 120;
  const itemHeight = 60;
  
  for (let i = 0; i < SHOP_ITEMS.length; i++) {
    const item = SHOP_ITEMS[i];
    const y = menuY + i * itemHeight;
    const isSelected = i === game.manufacturerSelection;
    
    // Check if already purchased (for outfits)
    let alreadyOwned = false;
    if (item.type === "outfit" && playerGlobal.outfitsUnlocked[item.unlockIndex]) {
      alreadyOwned = true;
    }
    
    // Background
    if (isSelected) {
      ctx.fillStyle = "rgba(200, 150, 100, 0.3)";
      ctx.fillRect(40, y - 5, 500, itemHeight - 5);
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 2;
      ctx.strokeRect(40, y - 5, 500, itemHeight - 5);
    }
    
    // Item icon based on type
    let icon = "📦";
    if (item.type === "outfit") icon = "👔";
    else if (item.type === "startItem") {
      if (item.effect === "speed") icon = "⚡";
      else if (item.effect === "jump") icon = "🦘";
      else if (item.effect === "magnet") icon = "🧲";
    }
    else if (item.type === "consumable") icon = "❤️";
    
    ctx.font = "24px sans-serif";
    ctx.fillText(icon, 55, y + 28);
    
    // Item name
    ctx.fillStyle = isSelected ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.6)";
    if (alreadyOwned) ctx.fillStyle = "rgba(150, 150, 150, 0.6)";
    ctx.font = isSelected ? "bold 16px system-ui, -apple-system, Segoe UI, sans-serif" : "14px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(item.name, 95, y + 18);
    
    // Description
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(item.description, 95, y + 38);
    
    // Price
    if (alreadyOwned) {
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 14px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText("購入済み", 450, y + 25);
    } else {
      ctx.fillStyle = playerGlobal.savings >= item.price ? "#ffd700" : "#ef4444";
      ctx.font = "bold 14px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText(`${item.price}💰`, 460, y + 25);
    }
    
    if (isSelected) {
      ctx.fillStyle = "#ffd700";
      ctx.font = "18px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText("▶", 43, y + 22);
    }
  }
  
  // Back button
  const backY = menuY + SHOP_ITEMS.length * itemHeight;
  const backSelected = game.manufacturerSelection >= SHOP_ITEMS.length;
  
  if (backSelected) {
    ctx.fillStyle = "rgba(100, 100, 120, 0.3)";
    ctx.fillRect(40, backY - 5, 200, itemHeight - 5);
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, backY - 5, 200, itemHeight - 5);
  }
  
  ctx.fillStyle = backSelected ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.6)";
  ctx.font = backSelected ? "bold 16px system-ui, -apple-system, Segoe UI, sans-serif" : "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("◀ 戻る", 60, backY + 25);
  
  if (backSelected) {
    ctx.fillStyle = "#ffd700";
    ctx.font = "18px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText("▶", 43, backY + 22);
  }
  
  // Preview area for purchased start items
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(560, 120, 180, 280);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(560, 120, 180, 280);
  
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("購入済みアイテム", 590, 145);
  
  // Show purchased start items
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
  if (purchasedStartItems.length > 0) {
    let itemY = 175;
    for (const effect of purchasedStartItems) {
      const skill = SKILLS[effect];
      if (skill) {
        ctx.fillText(`${skill.icon} ${skill.name}`, 580, itemY);
        itemY += 25;
      }
    }
  } else {
    ctx.fillText("次ステージ用アイテムなし", 575, 175);
  }
  
  // Extra HP status
  ctx.fillText(`追加HP: ${extraHPPurchased ? "購入済み ✅" : "なし"}`, 575, 280);
  
  // Unlocked outfits count
  const unlockedCount = playerGlobal.outfitsUnlocked.filter(v => v).length;
  ctx.fillText(`解放済みスタイル: ${unlockedCount}/${playerGlobal.outfitsUnlocked.length}`, 575, 320);
  
  // Instructions
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("↑↓: 選択　Enter / Space: 購入　Esc / Backspace: 戻る", 40, H - 30);
}

// Tutorial overlay for new players
function drawTutorialOverlay() {
  // Semi-transparent background
  ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillRect(0, 0, W, H);
  
  // Tutorial content based on step
  const tutorials = [
    {
      title: "🎮 ようこそ！商社マンへ",
      content: [
        "このゲームはマリオ風アクションゲームです！",
        "敵を踏み付けて人脈👤をゲットしよう！",
        "",
        "まずは基本操作を覚えましょう。"
      ],
      icon: "🦶"
    },
    {
      title: "🏃 移動操作",
      content: [
        "← → または A D キー：左右に移動",
        "Space / W / ↑ キー：ジャンプ",
        "空中でもう一度押す：2段ジャンプ！",
        "Shift 長押し：ダッシュで高速移動"
      ],
      icon: "⬅️➡️"
    },
    {
      title: "⬇️ ヒップドロップ",
      content: [
        "空中で ↓ または S キー：ヒップドロップ！",
        "高速で落下し、敵を踏みやすくなる！",
        "?ブロックの上からも叩ける！",
        "着地時に衝撃波が発生！"
      ],
      icon: "💥"
    },
    {
      title: "💰 アイテム収集",
      content: [
        "💰 コイン：コース上で集めよう！",
        "👤 人脈：敵を倒すとドロップ！",
        "?ブロック：叩くとアイテムが出る！",
        "メーカーでアイテムを購入できる！"
      ],
      icon: "✨"
    },
    {
      title: "🎯 勝利条件",
      content: [
        "ステージ内の「ボス」を3回踏み付けろ！",
        "ボスを倒したら、ゴール（金色のゲート）へ！",
        "クリア後はトップページに戻る！",
        "がんばれ、商社マン！"
      ],
      icon: "🏆"
    }
  ];
  
  const step = game.tutorialStep;
  const tut = tutorials[step];
  const lastTutorialStep = tutorials.length - 1;
  
  // Card background
  const cardW = 500;
  const cardH = 280;
  const cardX = (W - cardW) / 2;
  const cardY = (H - cardH) / 2;
  
  // Card shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(cardX + 5, cardY + 5, cardW, cardH);
  
  // Card
  ctx.fillStyle = "#1a2535";
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 3;
  ctx.strokeRect(cardX, cardY, cardW, cardH);
  
  // Icon
  ctx.font = "60px sans-serif";
  ctx.fillText(tut.icon, cardX + cardW - 80, cardY + 80);
  
  // Title
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 24px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(tut.title, cardX + 30, cardY + 45);
  
  // Content
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "16px system-ui, -apple-system, Segoe UI, sans-serif";
  let lineY = cardY + 90;
  for (const line of tut.content) {
    ctx.fillText(line, cardX + 30, lineY);
    lineY += 28;
  }
  
  // Progress dots
  const dotY = cardY + cardH - 40;
  const dotStartX = cardX + cardW / 2 - (tutorials.length * 20) / 2;
  for (let i = 0; i < tutorials.length; i++) {
    ctx.beginPath();
    ctx.arc(dotStartX + i * 20, dotY, i === step ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = i === step ? "#ffd700" : "rgba(255, 255, 255, 0.3)";
    ctx.fill();
  }
  
  // Navigation hint
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  const navText = step < lastTutorialStep 
    ? "Enter / Space で次へ　|　Esc でスキップ" 
    : "Enter / Space でゲーム開始！";
  ctx.fillText(navText, cardX + cardW / 2 - 100, cardY + cardH - 15);
  
  // Step indicator
  ctx.fillStyle = "rgba(255, 200, 100, 0.8)";
  ctx.fillText(`${step + 1} / ${tutorials.length}`, cardX + cardW - 50, cardY + cardH - 15);
}
