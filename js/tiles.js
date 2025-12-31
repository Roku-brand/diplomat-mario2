/**
 * Tile helpers and collision detection
 */

function tileAt(tx, ty) {
  if (ty < 0 || ty >= game.mapH || tx < 0 || tx >= game.mapW) return 0;
  return game.map[ty][tx];
}

function isSolidTile(v) { return v === 1 || v === 4 || v === 5 || v === 6; } // 4=breakable, 5=gate, 6=item box
function isHazardTile(v) { return v === 2; }
function isGoalTile(v) { return v === 3; }
function isGateTile(v) { return v === 5; }
function isItemBoxTile(v) { return v === 6; } // ?ブロック

function worldToTile(x, y) {
  return { tx: Math.floor(x / TILE), ty: Math.floor(y / TILE) };
}

function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function resolveCollisions(ent) {
  // Move X then resolve
  ent.x += ent.vx;
  let left = Math.floor(ent.x / TILE);
  let right = Math.floor((ent.x + ent.w) / TILE);
  let top = Math.floor(ent.y / TILE);
  let bottom = Math.floor((ent.y + ent.h - 1) / TILE);

  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      const t = tileAt(tx, ty);
      if (!isSolidTile(t)) continue;

      const tileX = tx * TILE, tileY = ty * TILE;
      if (aabb(ent.x, ent.y, ent.w, ent.h, tileX, tileY, TILE, TILE)) {
        if (ent.vx > 0) ent.x = tileX - ent.w;
        else if (ent.vx < 0) ent.x = tileX + TILE;
        ent.vx = 0;
      }
    }
  }

  // Move Y then resolve
  ent.y += ent.vy;
  ent.onGround = false;
  left = Math.floor(ent.x / TILE);
  right = Math.floor((ent.x + ent.w) / TILE);
  top = Math.floor(ent.y / TILE);
  bottom = Math.floor((ent.y + ent.h) / TILE);

  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      const t = tileAt(tx, ty);
      if (!isSolidTile(t)) continue;

      const tileX = tx * TILE, tileY = ty * TILE;
      if (aabb(ent.x, ent.y, ent.w, ent.h, tileX, tileY, TILE, TILE)) {
        if (ent.vy > 0) {
          ent.y = tileY - ent.h;
          ent.vy = 0;
          ent.onGround = true;
        } else if (ent.vy < 0) {
          ent.y = tileY + TILE;
          ent.vy = 0;
          
          // アイテムボックス（?ブロック）を叩いた
          if (isItemBoxTile(t) && ent === player) {
            hitItemBox(tx, ty);
          }
        }
      }
    }
  }
}

function hazardTouch(ent) {
  // sample feet area
  const p1 = worldToTile(ent.x + 4, ent.y + ent.h);
  const p2 = worldToTile(ent.x + ent.w - 4, ent.y + ent.h);
  const t1 = tileAt(p1.tx, p1.ty);
  const t2 = tileAt(p2.tx, p2.ty);
  return isHazardTile(t1) || isHazardTile(t2);
}

function goalTouch(ent) {
  const p1 = worldToTile(ent.x + 4, ent.y + ent.h - 4);
  const p2 = worldToTile(ent.x + ent.w - 4, ent.y + ent.h - 4);
  const t1 = tileAt(p1.tx, p1.ty);
  const t2 = tileAt(p2.tx, p2.ty);
  return isGoalTile(t1) || isGoalTile(t2);
}
