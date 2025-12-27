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
  
  // Handle stage select screen before game.stage is set
  if (game.state === "select") {
    drawStageSelectOverlay();
    return;
  }
  
  const pal = game.stage?.palette || { sky:"#0b0f14", far:"#0b0f14", mid:"#0b0f14", ground:"#222", accent:"#fff" };

  // background
  ctx.fillStyle = pal.sky;
  ctx.fillRect(0,0,W,H);

  // parallax layers
  const px = game.cameraX;
  drawParallax(pal.far, 0.15, 34);
  drawParallax(pal.mid, 0.30, 22);

  // world
  ctx.save();
  ctx.translate(-Math.floor(game.cameraX), -Math.floor(game.cameraY));

  drawTiles(pal);
  drawCollectibles(); // コインと人脈ポイントを描画
  drawEnemies(pal);
  drawPlayer(pal);

  ctx.restore();

  // HUD
  drawHUD(pal);
  
  // Negotiation UI (choice-based dialog)
  if (game.state === "play" && player.negotiating) {
    drawNegotiationUI();
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
        // 交渉ゲート（交渉しないと進めない壁）
        ctx.fillStyle = "#4a3a2a";
        ctx.fillRect(x, y, TILE, TILE);
        // 鍵付きドア
        ctx.fillStyle = "#8b7355";
        ctx.fillRect(x+4, y+2, TILE-8, TILE-4);
        // ドアノブ
        ctx.fillStyle = "#d4af37";
        ctx.beginPath();
        ctx.arc(x+TILE-10, y+TILE/2, 4, 0, Math.PI*2);
        ctx.fill();
        // 「交渉」アイコン
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("🤝", x+6, y+TILE/2+4);
        // 点滅エフェクト
        const pulse = Math.sin(game.time * 0.1) * 0.2 + 0.3;
        ctx.fillStyle = `rgba(255, 200, 100, ${pulse})`;
        ctx.fillRect(x, y, TILE, TILE);
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

  // === Negotiation indicator ===
  const eNear = nearestNegotiableEnemy();
  if (game.state === "play" && eNear && !player.negotiating) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText("E:交渉", px - 6, py - 10);
  }
}

function drawNegotiationUI() {
  if (!player.negotiating || negoState.phase === "idle") return;
  
  // Draw choice panel at bottom of screen
  const panelH = 150;
  const panelY = H - panelH - 10;
  
  // Background panel
  ctx.fillStyle = "rgba(0,0,0,0.88)";
  ctx.fillRect(10, panelY, W - 20, panelH);
  ctx.strokeStyle = "rgba(255,200,100,0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, panelY, W - 20, panelH);
  
  // Show current resources
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 12px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`所持: 💰${player.coins}  👤${player.connections}`, W - 150, panelY + 18);
  
  if (negoState.phase === "choice") {
    // Title
    ctx.fillStyle = "rgba(255,200,100,0.95)";
    ctx.font = "bold 14px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText("▼ 交渉アプローチを選択（↑↓/1-3で選択、Enter/Spaceで決定）", 24, panelY + 22);
    
    // Draw choices
    const choiceStartY = panelY + 42;
    const choiceHeight = 32;
    
    for (let i = 0; i < negoState.choices.length; i++) {
      const choice = negoState.choices[i];
      const cy = choiceStartY + i * choiceHeight;
      const isSelected = i === negoState.selectedChoice;
      
      // Check if player can afford
      const coinCost = choice.costCoins || 0;
      const connectionCost = choice.costConnections || 0;
      const canAfford = player.coins >= coinCost && player.connections >= connectionCost;
      
      // Selection highlight
      if (isSelected) {
        ctx.fillStyle = canAfford ? "rgba(100, 150, 255, 0.35)" : "rgba(255, 100, 100, 0.25)";
        ctx.fillRect(20, cy - 4, W - 50, choiceHeight - 2);
      }
      
      // Choice number
      ctx.fillStyle = isSelected ? (canAfford ? "#64b5f6" : "#ff8080") : "rgba(255,255,255,0.6)";
      ctx.font = "bold 14px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText(`[${i + 1}]`, 28, cy + 14);
      
      // Choice text
      ctx.fillStyle = isSelected ? (canAfford ? "rgba(255,255,255,0.95)" : "rgba(255,150,150,0.9)") : "rgba(255,255,255,0.7)";
      ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText(choice.text, 60, cy + 14);
      
      // Cost indicator
      let costX = 450;
      if (coinCost > 0) {
        ctx.fillStyle = player.coins >= coinCost ? "#ffd700" : "#ff4444";
        ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
        ctx.fillText(`💰-${coinCost}`, costX, cy + 14);
        costX += 45;
      }
      if (connectionCost > 0) {
        ctx.fillStyle = player.connections >= connectionCost ? "#4a90d9" : "#ff4444";
        ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
        ctx.fillText(`👤-${connectionCost}`, costX, cy + 14);
      }
      
      // Success rate indicator (visual hint)
      const rateX = W - 200;
      const rateW = 80;
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(rateX, cy + 4, rateW, 10);
      
      // Color based on success rate
      let rateColor = "#22c55e"; // green for high
      if (choice.successRate < 0.5) rateColor = "#ef4444"; // red for low
      else if (choice.successRate < 0.7) rateColor = "#eab308"; // yellow for medium
      
      ctx.fillStyle = rateColor;
      ctx.fillRect(rateX, cy + 4, rateW * choice.successRate, 10);
      
      // Success rate text
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "10px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText(`${Math.round(choice.successRate * 100)}%`, rateX + rateW + 5, cy + 12);
      
      // Alert modifier indicator
      if (choice.alertMod !== 0) {
        ctx.fillStyle = choice.alertMod < 0 ? "#22c55e" : "#ef4444";
        ctx.font = "11px system-ui, -apple-system, Segoe UI, sans-serif";
        const modText = choice.alertMod < 0 ? `警戒${choice.alertMod}` : `警戒+${choice.alertMod}`;
        ctx.fillText(modText, W - 55, cy + 14);
      }
    }
  } else if (negoState.phase === "resolving") {
    // Show result
    const resultColor = negoState.lastResult === "success" ? "#22c55e" : "#ef4444";
    const resultText = negoState.lastResult === "success" ? "💼 契約成立！" : "❌ 交渉決裂";
    
    ctx.fillStyle = resultColor;
    ctx.font = "bold 26px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(resultText, W/2 - 80, panelY + 60);
    
    // Progress bar for resolve timer
    const timerW = 200;
    const timerX = W/2 - timerW/2;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(timerX, panelY + 90, timerW, 8);
    ctx.fillStyle = resultColor;
    ctx.fillRect(timerX, panelY + 90, timerW * (negoState.resolveTimer / 120), 8);
  }
}

function drawEnemies(pal) {
  for (const e of enemies) {
    drawEnemyByType(e);

    // label near if close
    const dx = Math.abs((e.x+e.w/2) - (player.x+player.w/2));
    const dy = Math.abs((e.y+e.h/2) - (player.y+player.h/2));
    if (dx < 140 && dy < 90) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
      const tag = e.negotiable ? "交渉可" : "交渉不可";
      ctx.fillText(`${nameOfEnemy(e.type)}（${tag}）`, e.x - 6, e.y - 8);
    }
  }
}

function drawEnemyByType(e) {
  const x = e.x, y = e.y, w = e.w, h = e.h;
  const facing = e.dir || 1;
  
  // Stance-based outline glow
  let glowColor = null;
  if (e.stance === "allied") glowColor = "rgba(34, 197, 94, 0.5)";
  else if (e.stance === "neutral" || !e.hostile) glowColor = "rgba(234, 179, 8, 0.4)";
  
  if (glowColor) {
    ctx.fillStyle = glowColor;
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
    // 交渉必須マーク
    if (e.isGateGuard) {
      ctx.fillStyle = "rgba(255, 200, 100, 0.8)";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("🤝", x + w/2 - 6, y - 4);
    }

  } else {
    // Default fallback
    let c = "#ef4444";
    if (e.stance === "neutral" || !e.hostile) c = "#eab308";
    if (e.stance === "allied") c = "#22c55e";
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x + 5, y + 8, w - 10, 8);
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
  };
  return map[type] || type;
}

function drawHUD(pal) {
  if (!game.stage) return; // Guard for when stage is not yet loaded
  
  // top bar
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0,0,W,58);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "16px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(game.stage.title, 12, 20);

  // Trust/評判 bar
  const trustW = 180, trustH = 10;
  const tx = 12, ty = 30;
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(tx, ty, trustW, trustH);
  // 評判の色（高いと緑、低いと赤）
  const trustColor = player.trust > 60 ? "#22c55e" : (player.trust > 30 ? "#eab308" : "#ef4444");
  ctx.fillStyle = trustColor;
  ctx.fillRect(tx, ty, trustW * (player.trust/100), trustH);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`評判`, tx + trustW + 8, ty + 9);

  // HP
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`❤️ ${player.hp}`, 280, 38);
  
  // 警戒レベル
  ctx.fillText(`⚠️ 警戒: ${game.alert}`, 330, 38);
  
  // お金（コイン）💰
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`💰 ${player.coins}`, 440, 38);
  
  // 人脈（コネクション）👤
  ctx.fillStyle = "#4a90d9";
  ctx.fillText(`👤 ${player.connections}`, 500, 38);

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
  ctx.fillText("Rでリトライ", 40, H - 40);
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
  
  // Player global stats
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`💰 貯金: ${playerGlobal.savings}　👤 人脈蓄積: ${playerGlobal.networkTotal}　👔 スタイル: ${playerGlobal.outfit + 1}`, W - 350, 30);
  
  // Define the 3 locations
  const locations = [
    { 
      name: "① 本社", 
      subtitle: "設定・着せ替え",
      desc: "キャラクターのスタイルを変更",
      icon: "🏢",
      x: 80,
      color: "#4a6a9a"
    },
    { 
      name: "② 支社", 
      subtitle: "貯金・人脈蓄積",
      desc: "資金を管理し、人脈を広げる",
      icon: "🏦",
      x: 340,
      color: "#5a7a6a"
    },
    { 
      name: "③ 交通センター", 
      subtitle: "ステージ選択",
      desc: "各地の商談現場へ出発",
      icon: "🚉",
      x: 600,
      color: "#7a5a6a"
    }
  ];
  
  // Draw location cards
  const cardY = 160;
  const cardW = 220;
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
  const walkX = 50 + game.topMenuSelection * 260 + Math.sin(game.time * 0.05) * 5;
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
