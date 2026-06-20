/**
 * Stage-specific art and block interaction polish.
 * Loaded after the base modules so it can extend rendering and collision safely.
 */
(function () {
  "use strict";

  const blockBumps = new Map();

  const STAGE_STYLE = {
    market: {
      tileTop: "#f3c66b",
      tileFace: "#6f5b7c",
      tileDark: "#463553",
      seam: "rgba(255,255,255,0.16)",
      hazard: "#8f2430",
      hazardAccent: "#ffd34d",
      goal: "#f4d06f",
    },
    office: {
      tileTop: "#d7e2ec",
      tileFace: "#526170",
      tileDark: "#2e3843",
      seam: "rgba(255,255,255,0.18)",
      hazard: "#31425a",
      hazardAccent: "#ff4f6d",
      goal: "#8bd3ff",
    },
    port: {
      tileTop: "#e4b15f",
      tileFace: "#2f6d7c",
      tileDark: "#1d4350",
      seam: "rgba(255,255,255,0.14)",
      hazard: "#2a4c5d",
      hazardAccent: "#ffcf3d",
      goal: "#75d0ff",
    },
  };

  function stageId() {
    return game.stage?.id || "market";
  }

  function styleForStage() {
    return STAGE_STYLE[stageId()] || STAGE_STYLE.market;
  }

  function repeatingOffset(factor) {
    return -((game.cameraX * factor) % W);
  }

  function drawLooped(offset, drawOne) {
    for (let i = -1; i <= 2; i++) {
      drawOne(offset + i * W);
    }
  }

  window.drawParallax = function drawParallax(color, factor, height) {
    const id = stageId();
    const offset = repeatingOffset(factor);
    ctx.save();

    if (factor < 0.2) {
      if (id === "market") drawMarketFar(offset);
      else if (id === "office") drawOfficeFar(offset);
      else drawPortFar(offset);
    } else if (id === "market") {
      drawMarketMid(offset);
    } else if (id === "office") {
      drawOfficeMid(offset);
    } else {
      drawPortMid(offset);
    }

    ctx.restore();
  };

  function drawMarketFar(offset) {
    ctx.fillStyle = "#223348";
    drawLooped(offset, x => {
      ctx.fillRect(x, H - 232, W, 54);
      for (let i = 0; i < 8; i++) {
        const bx = x + i * 132 + 18;
        ctx.fillStyle = i % 2 ? "#2c4960" : "#31415f";
        ctx.fillRect(bx, H - 274, 76, 96);
        ctx.fillStyle = "#ffd36f";
        ctx.fillRect(bx + 8, H - 262, 24, 4);
        ctx.fillRect(bx + 40, H - 248, 22, 4);
      }
    });
    ctx.fillStyle = "rgba(255, 236, 170, 0.22)";
    for (let i = 0; i < 5; i++) {
      const sx = ((offset * 0.35 + i * 210) % (W + 260)) - 80;
      ctx.beginPath();
      ctx.moveTo(sx, 90);
      ctx.lineTo(sx + 92, H - 178);
      ctx.lineTo(sx - 70, H - 178);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawMarketMid(offset) {
    drawLooped(offset, x => {
      for (let i = 0; i < 6; i++) {
        const bx = x + i * 170 + 28;
        ctx.fillStyle = i % 2 ? "#c65252" : "#2f8f83";
        ctx.fillRect(bx, H - 186, 104, 18);
        ctx.fillStyle = "#f4f1df";
        ctx.fillRect(bx + 10, H - 210, 84, 24);
        ctx.fillStyle = "#31415f";
        ctx.fillRect(bx + 18, H - 203, 52, 4);
        ctx.fillRect(bx + 18, H - 194, 64, 4);
        ctx.fillStyle = "#5b6576";
        ctx.fillRect(bx + 12, H - 168, 8, 64);
        ctx.fillRect(bx + 84, H - 168, 8, 64);
      }
    });
  }

  function drawOfficeFar(offset) {
    drawLooped(offset, x => {
      ctx.fillStyle = "#142130";
      ctx.fillRect(x, H - 284, W, 112);
      for (let i = 0; i < 11; i++) {
        const bx = x + i * 92;
        ctx.fillStyle = i % 2 ? "#1e3145" : "#26364c";
        ctx.fillRect(bx + 6, H - 332 + (i % 3) * 18, 64, 160);
        ctx.fillStyle = "rgba(160, 210, 240, 0.45)";
        for (let wy = H - 310 + (i % 3) * 18; wy < H - 190; wy += 22) {
          ctx.fillRect(bx + 16, wy, 12, 8);
          ctx.fillRect(bx + 42, wy, 12, 8);
        }
      }
    });
  }

  function drawOfficeMid(offset) {
    drawLooped(offset, x => {
      ctx.fillStyle = "#223144";
      for (let i = 0; i < 9; i++) {
        const cx = x + i * 118 + 20;
        ctx.fillRect(cx, H - 236, 16, 132);
        ctx.fillStyle = "rgba(139, 211, 255, 0.22)";
        ctx.fillRect(cx + 24, H - 222, 62, 86);
        ctx.fillStyle = "#223144";
      }
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(x, H - 150, W, 12);
    });
  }

  function drawPortFar(offset) {
    ctx.fillStyle = "#143747";
    ctx.fillRect(0, H - 175, W, 44);
    ctx.fillStyle = "rgba(120, 205, 230, 0.22)";
    for (let i = 0; i < 12; i++) {
      const wx = (offset * 0.2 + i * 92) % (W + 120) - 60;
      ctx.fillRect(wx, H - 155 + (i % 2) * 8, 48, 3);
    }
    drawLooped(offset, x => {
      for (let i = 0; i < 4; i++) {
        const cx = x + i * 250 + 38;
        ctx.strokeStyle = "#2c5f70";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx, H - 290);
        ctx.lineTo(cx, H - 162);
        ctx.lineTo(cx + 88, H - 260);
        ctx.lineTo(cx + 166, H - 260);
        ctx.stroke();
        ctx.fillStyle = "#d49a3d";
        ctx.fillRect(cx + 136, H - 255, 16, 34);
      }
    });
  }

  function drawPortMid(offset) {
    drawLooped(offset, x => {
      const colors = ["#bd4f45", "#d49a3d", "#2f8f83", "#315a7a"];
      for (let i = 0; i < 10; i++) {
        const bx = x + i * 110 + 18;
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(bx, H - 176 - (i % 2) * 26, 74, 22);
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.fillRect(bx + 8, H - 171 - (i % 2) * 26, 58, 2);
      }
      ctx.fillStyle = "#1f5668";
      ctx.fillRect(x, H - 128, W, 20);
    });
  }

  function advanceBlockBumps() {
    for (const [key, bump] of blockBumps) {
      if (bump.delay > 0) {
        bump.delay--;
        continue;
      }
      bump.timer--;
      if (bump.timer <= 0) blockBumps.delete(key);
    }
  }

  function blockOffset(tx, ty) {
    if (blockBumps.size === 0) return 0;
    const bump = blockBumps.get(`${tx},${ty}`);
    if (!bump || bump.delay > 0) return 0;
    const progress = 1 - bump.timer / bump.duration;
    return -Math.sin(progress * Math.PI) * bump.strength;
  }

  function queueBlockWave(tx, ty, strength) {
    const duration = 18;
    for (let dx = -2; dx <= 2; dx++) {
      const t = tileAt(tx + dx, ty);
      if (!isSolidTile(t)) continue;
      const distance = Math.abs(dx);
      const key = `${tx + dx},${ty}`;
      blockBumps.set(key, {
        timer: duration,
        duration,
        delay: distance * 2,
        strength: Math.max(2, strength - distance * 2),
      });
    }
  }

  function drawTileBody(tx, ty, t, pal) {
    const style = styleForStage();
    const x = tx * TILE;
    const y = ty * TILE + blockOffset(tx, ty);

    if (t === 1) {
      drawStageSolidTile(x, y, tx, ty, style);
    } else if (t === 2) {
      drawStageHazardTile(x, y, tx, ty, style);
    } else if (t === 3) {
      drawStageGoalTile(x, y, tx, ty, style);
    } else if (t === 4) {
      drawBreakableTile(x, y, tx, ty);
    } else if (t === 5) {
      drawStageGateTile(x, y, style);
    } else if (t === 6) {
      drawItemBoxTile(x, y, tx, ty);
    }
  }

  window.drawTiles = function drawTiles(pal) {
    if (blockBumps.size > 0) advanceBlockBumps();

    const startX = Math.floor(game.cameraX / TILE) - 2;
    const endX = Math.floor((game.cameraX + W) / TILE) + 2;
    for (let ty = 0; ty < game.mapH; ty++) {
      for (let tx = startX; tx <= endX; tx++) {
        const t = tileAt(tx, ty);
        if (t === 0) continue;
        drawTileBody(tx, ty, t, pal);
      }
    }
  };

  function drawStageSolidTile(x, y, tx, ty, style) {
    const id = stageId();
    ctx.fillStyle = style.tileFace;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = style.tileTop;
    ctx.fillRect(x, y, TILE, 7);
    ctx.fillStyle = style.tileDark;
    ctx.fillRect(x, y + TILE - 6, TILE, 6);
    ctx.strokeStyle = style.seam;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);

    if (id === "market") {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(x + 8, y + 13, 20, 3);
      ctx.fillRect(x + 5, y + 23, 26, 3);
      ctx.fillStyle = "rgba(244, 198, 107, 0.22)";
      ctx.fillRect(x + 2, y + 8, 4, TILE - 15);
    } else if (id === "office") {
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 8);
      ctx.lineTo(x + 8, y + TILE - 7);
      ctx.moveTo(x + 20, y + 8);
      ctx.lineTo(x + 20, y + TILE - 7);
      ctx.moveTo(x + 32, y + 8);
      ctx.lineTo(x + 32, y + TILE - 7);
      ctx.stroke();
      ctx.fillStyle = "rgba(139, 211, 255, 0.18)";
      ctx.fillRect(x + 10, y + 12, 12, 8);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fillRect(x + 5, y + 14, 26, 3);
      ctx.fillRect(x + 5, y + 24, 26, 3);
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.fillRect(x + 10, y + 8, 2, TILE - 15);
      ctx.fillRect(x + 24, y + 8, 2, TILE - 15);
    }
  }

  function drawStageHazardTile(x, y, tx, ty, style) {
    ctx.fillStyle = style.hazard;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = style.hazardAccent;
    for (let i = -TILE; i < TILE * 2; i += 12) {
      ctx.save();
      ctx.translate(x + i, y);
      ctx.rotate(-0.45);
      ctx.fillRect(0, 0, 6, TILE * 2);
      ctx.restore();
    }
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x + 5, y + 5, TILE - 10, TILE - 10);
  }

  function drawStageGoalTile(x, y, tx, ty, style) {
    ctx.fillStyle = style.goal;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#fff8d8";
    ctx.fillRect(x + 9, y + 7, 18, 22);
    ctx.fillStyle = "#334155";
    ctx.fillRect(x + 13, y + 13, 10, 2);
    ctx.fillRect(x + 13, y + 18, 10, 2);
    ctx.fillRect(x + 13, y + 23, 7, 2);
    ctx.strokeStyle = "#9b6b1f";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 2, TILE - 6, TILE - 4);
  }

  function drawBreakableTile(x, y, tx, ty) {
    const key = `${tx},${ty}`;
    const d = breakTiles.get(key) ?? 120;
    const a = clamp(d / 120, 0, 1);
    ctx.fillStyle = `rgba(130, 108, 83, ${0.34 + 0.5 * a})`;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(x, y, TILE, 6);
    ctx.strokeStyle = `rgba(45, 36, 28, ${0.5 + 0.3 * a})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 4);
    ctx.lineTo(x + TILE - 8, y + TILE - 4);
    ctx.moveTo(x + TILE - 8, y + 8);
    ctx.lineTo(x + 8, y + TILE - 8);
    ctx.stroke();
  }

  function drawStageGateTile(x, y, style) {
    ctx.fillStyle = "#4a3a2a";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#8b7355";
    ctx.fillRect(x + 4, y + 2, TILE - 8, TILE - 4);
    ctx.fillStyle = style.goal;
    ctx.beginPath();
    ctx.arc(x + TILE - 10, y + TILE / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawItemBoxTile(x, y, tx, ty) {
    const key = `${tx},${ty}`;
    const boxState = itemBoxes.get(key);
    const used = boxState && boxState.used;
    if (used) {
      ctx.fillStyle = "#5a4a3a";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = "#4a3a2a";
      ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
      return;
    }

    ctx.fillStyle = "#d4a400";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
    ctx.fillStyle = "#ffe066";
    ctx.fillRect(x + 5, y + 5, TILE - 15, TILE - 15);
    ctx.fillStyle = "#8b6914";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("?", x + 10, y + 28);
    const pulse = Math.sin(game.time * 0.15) * 0.15 + 0.85;
    ctx.fillStyle = `rgba(255, 255, 200, ${0.3 * pulse})`;
    ctx.fillRect(x, y, TILE, TILE);
  }

  function collisionBox(ent) {
    if (ent === player) {
      return {
        x: ent.x + 1,
        y: ent.y + 6,
        w: ent.w - 2,
        h: ent.h - 6,
        offsetX: 1,
        offsetY: 6,
      };
    }
    return {
      x: ent.x,
      y: ent.y,
      w: ent.w,
      h: ent.h,
      offsetX: 0,
      offsetY: 0,
    };
  }

  window.resolveCollisions = function resolveCollisions(ent) {
    ent.x += ent.vx;
    let box = collisionBox(ent);
    let left = Math.floor(box.x / TILE);
    let right = Math.floor((box.x + box.w - 1) / TILE);
    let top = Math.floor(box.y / TILE);
    let bottom = Math.floor((box.y + box.h - 1) / TILE);

    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        const t = tileAt(tx, ty);
        if (!isSolidTile(t)) continue;
        const tileX = tx * TILE;
        const tileY = ty * TILE;
        if (!aabb(box.x, box.y, box.w, box.h, tileX, tileY, TILE, TILE)) continue;
        if (ent.vx > 0) ent.x = tileX - box.w - box.offsetX;
        else if (ent.vx < 0) ent.x = tileX + TILE - box.offsetX;
        ent.vx = 0;
        box = collisionBox(ent);
      }
    }

    ent.y += ent.vy;
    ent.onGround = false;
    box = collisionBox(ent);
    left = Math.floor(box.x / TILE);
    right = Math.floor((box.x + box.w - 1) / TILE);
    top = Math.floor(box.y / TILE);
    bottom = Math.floor((box.y + box.h - 1) / TILE);

    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        const t = tileAt(tx, ty);
        if (!isSolidTile(t)) continue;
        const tileX = tx * TILE;
        const tileY = ty * TILE;
        if (!aabb(box.x, box.y, box.w, box.h, tileX, tileY, TILE, TILE)) continue;

        if (ent.vy > 0) {
          ent.y = tileY - box.h - box.offsetY;
          ent.vy = 0;
          ent.onGround = true;
        } else if (ent.vy < 0) {
          ent.y = tileY + TILE - box.offsetY;
          ent.vy = 0;
          if (ent === player) bumpBlock(tx, ty, t);
        }
        box = collisionBox(ent);
      }
    }
  };

  function bumpBlock(tx, ty, tileType) {
    queueBlockWave(tx, ty, tileType === 1 ? 9 : 7);
    defeatEnemiesOnBlock(tx, ty);
    createParticles(tx * TILE + TILE / 2, ty * TILE + 6, "itembox", tileType === 1 ? 5 : 8);
    triggerScreenShake(tileType === 1 ? 2 : 3, 5);

    if (isItemBoxTile(tileType)) {
      hitItemBox(tx, ty);
    } else {
      playSFX("select");
    }
  }

  function defeatEnemiesOnBlock(tx, ty) {
    const tileX = tx * TILE;
    const tileTop = ty * TILE;
    for (const e of enemies) {
      if (e.defeated) continue;
      const horizontalOverlap = e.x < tileX + TILE - 2 && e.x + e.w > tileX + 2;
      const standingOnTop = Math.abs(e.y + e.h - tileTop) <= 8;
      if (!horizontalOverlap || !standingOnTop) continue;

      if (e.isBoss) {
        stompEnemy(e);
      } else {
        e.defeated = true;
        e.vy = -8;
        e.vx = 0;
        createParticles(e.x + e.w / 2, e.y + e.h / 2, "stomp", 12);
        createDefeatEffect(e.x, e.y, "negotiate_success", "\u30d6\u30ed\u30c3\u30af\u6483\u7834!");
        dropEnemyItem(e);
        addCareerExp(5);
        updateConnectionDict(e.type, true);
        playSFX("negoSuccess");
      }
    }
  }
}());
