/**
 * Rendering functions
 */

function draw() {
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
}

function drawNegotiationUI() {
  if (!player.negotiating || negoState.phase === "idle") return;
  
  // Draw choice panel at bottom of screen
  const panelH = 140;
  const panelY = H - panelH - 10;
  
  // Background panel
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(10, panelY, W - 20, panelH);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, panelY, W - 20, panelH);
  
  if (negoState.phase === "choice") {
    // Title
    ctx.fillStyle = "rgba(255,200,100,0.95)";
    ctx.font = "bold 16px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText("▼ 交渉アプローチを選択（↑↓/1-3で選択、Enter/Spaceで決定）", 24, panelY + 24);
    
    // Draw choices
    const choiceStartY = panelY + 48;
    const choiceHeight = 28;
    
    for (let i = 0; i < negoState.choices.length; i++) {
      const choice = negoState.choices[i];
      const cy = choiceStartY + i * choiceHeight;
      const isSelected = i === negoState.selectedChoice;
      
      // Selection highlight
      if (isSelected) {
        ctx.fillStyle = "rgba(100, 150, 255, 0.35)";
        ctx.fillRect(20, cy - 4, W - 50, choiceHeight - 2);
      }
      
      // Choice number
      ctx.fillStyle = isSelected ? "#64b5f6" : "rgba(255,255,255,0.6)";
      ctx.font = "bold 14px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText(`[${i + 1}]`, 28, cy + 14);
      
      // Choice text
      ctx.fillStyle = isSelected ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)";
      ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText(choice.text, 60, cy + 14);
      
      // Success rate indicator (visual hint)
      const rateX = W - 180;
      const rateW = 100;
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(rateX, cy + 4, rateW, 10);
      
      // Color based on success rate
      let rateColor = "#22c55e"; // green for high
      if (choice.successRate < 0.5) rateColor = "#ef4444"; // red for low
      else if (choice.successRate < 0.7) rateColor = "#eab308"; // yellow for medium
      
      ctx.fillStyle = rateColor;
      ctx.fillRect(rateX, cy + 4, rateW * choice.successRate, 10);
      
      // Alert modifier indicator
      if (choice.alertMod !== 0) {
        ctx.fillStyle = choice.alertMod < 0 ? "#22c55e" : "#ef4444";
        ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
        const modText = choice.alertMod < 0 ? `警戒${choice.alertMod}` : `警戒+${choice.alertMod}`;
        ctx.fillText(modText, W - 60, cy + 14);
      }
    }
  } else if (negoState.phase === "resolving") {
    // Show result
    const resultColor = negoState.lastResult === "success" ? "#22c55e" : "#ef4444";
    const resultText = negoState.lastResult === "success" ? "交渉成功" : "交渉失敗";
    
    ctx.fillStyle = resultColor;
    ctx.font = "bold 24px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.fillText(resultText, W/2 - 60, panelY + 60);
    
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
  
  if (e.type === "militia") {
    // Desert militia: tan/khaki clothing, headscarf, rifle silhouette
    // Body
    ctx.fillStyle = "#8b7355"; // tan/khaki
    ctx.fillRect(x + 4, y + 14, w - 8, h - 22);
    // Legs
    ctx.fillStyle = "#5c4a3a";
    ctx.fillRect(x + 6, y + h - 10, 7, 10);
    ctx.fillRect(x + w - 13, y + h - 10, 7, 10);
    // Head with scarf/keffiyeh
    ctx.fillStyle = "#d4c4a8"; // cream scarf
    ctx.fillRect(x + 6, y, w - 12, 14);
    ctx.fillStyle = "#fcd9b6"; // face
    ctx.fillRect(x + 8, y + 4, w - 16, 8);
    // Eyes
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + (facing === 1 ? w - 12 : 10), y + 6, 2, 2);
    // Rifle silhouette
    ctx.fillStyle = "#3d3d3d";
    if (facing === 1) {
      ctx.fillRect(x + w - 4, y + 18, 12, 3);
    } else {
      ctx.fillRect(x - 8, y + 18, 12, 3);
    }
    // Ammo belt
    ctx.fillStyle = "#5a4a3a";
    ctx.fillRect(x + 4, y + 20, w - 8, 3);

  } else if (e.type === "caravan") {
    // Transport leader: civilian clothes, clipboard/radio
    // Body - work clothes
    ctx.fillStyle = "#4a6741"; // olive work jacket
    ctx.fillRect(x + 3, y + 12, w - 6, h - 20);
    // Pants
    ctx.fillStyle = "#3a4a5a";
    ctx.fillRect(x + 5, y + h - 10, 8, 10);
    ctx.fillRect(x + w - 13, y + h - 10, 8, 10);
    // Head with cap
    ctx.fillStyle = "#2a3a4a"; // cap
    ctx.fillRect(x + 5, y, w - 10, 6);
    ctx.fillStyle = "#fcd9b6"; // face
    ctx.fillRect(x + 6, y + 6, w - 12, 8);
    // Eyes
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + (facing === 1 ? w - 11 : 9), y + 8, 2, 2);
    // Clipboard in hand
    ctx.fillStyle = "#d4a574"; // tan clipboard
    if (facing === 1) {
      ctx.fillRect(x + w - 2, y + 16, 8, 10);
      ctx.fillStyle = "#f5f5f5"; // paper
      ctx.fillRect(x + w, y + 17, 5, 7);
    } else {
      ctx.fillRect(x - 6, y + 16, 8, 10);
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(x - 5, y + 17, 5, 7);
    }

  } else if (e.type === "poacher") {
    // Jungle poacher: camo, net/trap, rugged look
    // Body - camo pattern
    ctx.fillStyle = "#4a5a3a"; // dark green base
    ctx.fillRect(x + 4, y + 14, w - 8, h - 22);
    // Camo spots
    ctx.fillStyle = "#3a4a2a";
    ctx.fillRect(x + 6, y + 16, 4, 4);
    ctx.fillRect(x + 14, y + 20, 5, 3);
    ctx.fillStyle = "#5a6a4a";
    ctx.fillRect(x + 10, y + 18, 3, 5);
    // Legs
    ctx.fillStyle = "#3a4a3a";
    ctx.fillRect(x + 5, y + h - 10, 8, 10);
    ctx.fillRect(x + w - 13, y + h - 10, 8, 10);
    // Head - bandana
    ctx.fillStyle = "#8b4513"; // brown bandana
    ctx.fillRect(x + 5, y, w - 10, 6);
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(x + 6, y + 5, w - 12, 9);
    // Stubble/rough face
    ctx.fillStyle = "#a08060";
    ctx.fillRect(x + 7, y + 10, w - 14, 3);
    // Eyes
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + (facing === 1 ? w - 11 : 9), y + 7, 2, 2);
    // Net/trap in hand
    ctx.fillStyle = "#8b7355";
    if (facing === 1) {
      ctx.fillRect(x + w - 2, y + 18, 10, 6);
      // Net pattern
      ctx.strokeStyle = "#6b5a45";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + w, y + 19); ctx.lineTo(x + w + 6, y + 23);
      ctx.moveTo(x + w + 3, y + 19); ctx.lineTo(x + w + 3, y + 23);
      ctx.stroke();
    } else {
      ctx.fillRect(x - 8, y + 18, 10, 6);
    }

  } else if (e.type === "guerrilla") {
    // Guerrilla: military vest, beret, serious stance
    // Body - military vest
    ctx.fillStyle = "#3a4a3a";
    ctx.fillRect(x + 3, y + 12, w - 6, h - 20);
    // Vest pockets
    ctx.fillStyle = "#2a3a2a";
    ctx.fillRect(x + 5, y + 16, 6, 6);
    ctx.fillRect(x + w - 11, y + 16, 6, 6);
    // Pants
    ctx.fillStyle = "#2a3a2a";
    ctx.fillRect(x + 5, y + h - 10, 8, 10);
    ctx.fillRect(x + w - 13, y + h - 10, 8, 10);
    // Head with beret
    ctx.fillStyle = "#8b0000"; // dark red beret
    ctx.fillRect(x + 4, y - 2, w - 8, 8);
    ctx.fillRect(x + 2, y + 2, 6, 4); // beret side
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(x + 6, y + 5, w - 12, 9);
    // Stern eyes
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + (facing === 1 ? w - 12 : 8), y + 7, 4, 2);
    // Weapon slung
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(x + 2, y + 14, 3, h - 24);

  } else if (e.type === "riot") {
    // Riot/crowd: civilian clothes, protest sign/megaphone
    // Body - casual clothes
    ctx.fillStyle = "#5a6a7a"; // hoodie
    ctx.fillRect(x + 4, y + 12, w - 8, h - 20);
    // Hood up
    ctx.fillStyle = "#4a5a6a";
    ctx.fillRect(x + 3, y + 12, w - 6, 6);
    // Jeans
    ctx.fillStyle = "#3a4a6a";
    ctx.fillRect(x + 5, y + h - 10, 8, 10);
    ctx.fillRect(x + w - 13, y + h - 10, 8, 10);
    // Head
    ctx.fillStyle = "#fcd9b6";
    ctx.fillRect(x + 6, y + 2, w - 12, 12);
    // Eyes (angry)
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + 8, y + 6, 3, 2);
    ctx.fillRect(x + w - 11, y + 6, 3, 2);
    // Raised fist or sign
    ctx.fillStyle = "#f5f5f5"; // sign
    if (facing === 1) {
      ctx.fillRect(x + w - 4, y - 10, 12, 14);
      ctx.fillStyle = "#d32f2f";
      ctx.fillRect(x + w - 2, y - 8, 8, 2);
      ctx.fillRect(x + w - 2, y - 4, 8, 2);
    } else {
      ctx.fillRect(x - 8, y - 10, 12, 14);
      ctx.fillStyle = "#d32f2f";
      ctx.fillRect(x - 6, y - 8, 8, 2);
      ctx.fillRect(x - 6, y - 4, 8, 2);
    }

  } else if (e.type === "security") {
    // Security force: tactical gear, helmet, shield
    // Body - tactical armor
    ctx.fillStyle = "#1a2a3a"; // dark blue tactical
    ctx.fillRect(x + 2, y + 12, w - 4, h - 20);
    // Armor plates
    ctx.fillStyle = "#2a3a4a";
    ctx.fillRect(x + 4, y + 14, w - 8, 4);
    ctx.fillRect(x + 4, y + 22, w - 8, 4);
    // Legs - tactical pants
    ctx.fillStyle = "#1a2a3a";
    ctx.fillRect(x + 4, y + h - 10, 9, 10);
    ctx.fillRect(x + w - 13, y + h - 10, 9, 10);
    // Knee pads
    ctx.fillStyle = "#3a4a5a";
    ctx.fillRect(x + 5, y + h - 10, 7, 4);
    ctx.fillRect(x + w - 12, y + h - 10, 7, 4);
    // Helmet
    ctx.fillStyle = "#2a3a4a";
    ctx.fillRect(x + 3, y - 2, w - 6, 14);
    // Visor
    ctx.fillStyle = "rgba(100, 180, 255, 0.6)";
    ctx.fillRect(x + 5, y + 4, w - 10, 6);
    // Shield
    ctx.fillStyle = "#4a5a6a";
    if (facing === 1) {
      ctx.fillRect(x + w - 2, y + 8, 6, h - 16);
      ctx.fillStyle = "rgba(150, 200, 255, 0.3)";
      ctx.fillRect(x + w, y + 10, 4, h - 20);
    } else {
      ctx.fillRect(x - 4, y + 8, 6, h - 16);
      ctx.fillStyle = "rgba(150, 200, 255, 0.3)";
      ctx.fillRect(x - 4, y + 10, 4, h - 20);
    }

  } else if (e.type === "drone") {
    // Surveillance drone: mechanical, rotors, camera eye
    // Main body
    ctx.fillStyle = "#4a5a6a";
    ctx.fillRect(x + 6, y + 10, w - 12, h - 18);
    // Propeller arms
    ctx.fillStyle = "#3a4a5a";
    ctx.fillRect(x, y + 6, w, 4);
    ctx.fillRect(x, y + h - 10, w, 4);
    // Rotors (spinning effect)
    const spin = (game.time % 10) < 5;
    ctx.fillStyle = spin ? "#2a3a4a" : "#5a6a7a";
    ctx.fillRect(x - 4, y + 4, 10, 2);
    ctx.fillRect(x + w - 6, y + 4, 10, 2);
    ctx.fillRect(x - 4, y + h - 8, 10, 2);
    ctx.fillRect(x + w - 6, y + h - 8, 10, 2);
    // Camera lens (glowing red)
    ctx.fillStyle = "#ff3333";
    ctx.beginPath();
    ctx.arc(x + w/2, y + h/2, 5, 0, Math.PI * 2);
    ctx.fill();
    // Inner lens
    ctx.fillStyle = "#aa0000";
    ctx.beginPath();
    ctx.arc(x + w/2, y + h/2, 3, 0, Math.PI * 2);
    ctx.fill();
    // Red scanning light pulse
    const pulse = Math.sin(game.time * 0.15) * 0.3 + 0.5;
    ctx.fillStyle = `rgba(255, 50, 50, ${pulse})`;
    ctx.fillRect(x + w/2 - 2, y + h/2 - 2, 4, 4);
    // Antenna
    ctx.fillStyle = "#3a4a5a";
    ctx.fillRect(x + w/2 - 1, y, 2, 6);
    ctx.fillStyle = "#ff6666";
    ctx.fillRect(x + w/2 - 1, y - 2, 2, 3);

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
  if (!game.stage) return; // Guard for when stage is not yet loaded
  
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

function drawStageSelectOverlay() {
  // Full screen background
  ctx.fillStyle = "#0a1020";
  ctx.fillRect(0, 0, W, H);
  
  // Title
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "32px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("Diplomat Run", 40, 60);
  
  ctx.font = "16px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("〜 交渉で道を拓く 〜", 40, 90);
  
  // Stage list
  const startY = 140;
  const itemHeight = 110;
  
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
    
    // Enemy count
    ctx.fillStyle = "rgba(255,200,100,0.7)";
    ctx.fillText(`敵: ${stage.enemySpawns.length}体`, 170, y + 70);
    
    // Selection indicator
    if (isSelected) {
      ctx.fillStyle = "#64b5f6";
      ctx.font = "24px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillText("▶", 38, y + 35);
    }
  }
  
  // Instructions
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText("↑↓ / W/S: 選択　Enter / Space / E: 決定", 40, H - 30);
}
