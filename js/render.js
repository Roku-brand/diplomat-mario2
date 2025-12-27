/**
 * Rendering functions
 */

function draw() {
  const pal = game.stage.palette || { sky:"#0b0f14", far:"#0b0f14", mid:"#0b0f14", ground:"#222", accent:"#fff" };

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
  drawEnemies(pal);
  drawPlayer(pal);

  ctx.restore();

  // HUD
  drawHUD(pal);

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
        ctx.fillStyle = pal.ground;
        ctx.fillRect(x, y, TILE, TILE);
      } else if (t === 2) {
        // hazard
        ctx.fillStyle = "#7c2d12";
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = "rgba(255,255,255,0.20)";
        ctx.fillRect(x+6, y+6, TILE-12, TILE-12);
      } else if (t === 3) {
        // goal gate
        ctx.fillStyle = pal.accent;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(x+8, y+8, TILE-16, TILE-16);
      } else if (t === 4) {
        // breakable
        const key = `${tx},${ty}`;
        const d = breakTiles.get(key) ?? 120;
        const a = clamp(d/120, 0, 1);
        ctx.fillStyle = `rgba(140, 180, 160, ${0.25 + 0.55*a})`;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(x+10, y+10, TILE-20, TILE-20);
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

  if (player.negotiating) {
    const barW = 120, barH = 10;
    const bx = px + pw / 2 - barW / 2;
    const by = py - 24;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(bx + 2, by + 2, (barW - 4) * clamp(player.negoProgress / 100, 0, 1), barH - 4);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText("交渉中…（離れると中断）", bx, by - 6);
  }
}

function drawEnemies(pal) {
  for (const e of enemies) {
    let c = "#ef4444"; // hostile
    if (e.stance === "neutral" || !e.hostile) c = "#eab308";
    if (e.stance === "allied") c = "#22c55e";
    if (e.type === "drone") c = "#a78bfa";

    ctx.fillStyle = c;
    ctx.fillRect(e.x, e.y, e.w, e.h);

    // visor
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(e.x + 5, e.y + 8, e.w - 10, 8);

    // label near if close
    const dx = Math.abs((e.x+e.w/2) - (player.x+player.w/2));
    const dy = Math.abs((e.y+e.h/2) - (player.y+player.h/2));
    if (dx < 140 && dy < 90) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      const tag = e.negotiable ? "交渉可" : "交渉不可";
      ctx.fillText(`${nameOfEnemy(e.type)}（${tag}）`, e.x - 6, e.y - 8);
    }
  }
}

function nameOfEnemy(type) {
  const map = {
    militia: "民兵",
    caravan: "輸送隊",
    poacher: "密猟者",
    guerrilla: "ゲリラ",
    riot: "群衆",
    security: "治安部隊",
    drone: "監視ドローン",
  };
  return map[type] || type;
}

function drawHUD(pal) {
  // top bar
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0,0,W,54);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "16px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(game.stage.title, 12, 22);

  // Trust bar
  const trustW = 220, trustH = 12;
  const tx = 12, ty = 32;
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(tx, ty, trustW, trustH);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillRect(tx, ty, trustW * (player.trust/100), trustH);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(`信頼`, tx + trustW + 10, ty + 11);

  // HP & Alert
  ctx.fillText(`HP: ${player.hp}`, 360, 42);
  ctx.fillText(`警戒: ${game.alert}`, 430, 42);

  // message
  if (game.messageT > 0 && game.message) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, H-64, W, 64);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "16px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(game.message, 14, H-28);
  }

  // stage notes mini (right side)
  if (game.stage.npcNotes && game.stage.npcNotes.length) {
    ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    const baseX = W - 360, baseY = 18;
    ctx.fillText("現場メモ：", baseX, baseY);
    for (let i=0;i<Math.min(2, game.stage.npcNotes.length); i++) {
      ctx.fillText("・" + game.stage.npcNotes[i], baseX, baseY + 16*(i+1));
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
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "28px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("任務失敗", 40, 80);

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
