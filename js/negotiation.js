/**
 * Negotiation system
 */

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
  say(e.talkText, 140);
}

function stopNegotiation() {
  player.negotiating = null;
  player.negoProgress = 0;
}

function negotiationTick() {
  const e = player.negotiating;
  if (!e) return;

  // If too far, cancel
  const dx = Math.abs((e.x+e.w/2) - (player.x+player.w/2));
  const dy = Math.abs((e.y+e.h/2) - (player.y+player.h/2));
  if (dx > 90 || dy > 70) {
    say("交渉が途切れた。距離を詰めろ。", 110);
    stopNegotiation();
    return;
  }

  // If player attacked or in hazard, cancel
  if (hazardTouch(player)) {
    say("足元が不安定だ。安全を確保して交渉しろ。", 110);
    stopNegotiation();
    return;
  }

  // Progress speed affected by alert + difficulty
  const alertPenalty = 1 + game.alert * 0.35;
  const speed = 0.9 / (e.difficulty * alertPenalty);

  player.negoProgress += speed;

  // Chance of failure increases with alert and difficulty
  const failChance = 0.0008 * e.difficulty * (1 + game.alert * 0.6);
  if (Math.random() < failChance) {
    // fail
    game.alert = clamp(game.alert + 1, 0, 3);
    player.trust = clamp(player.trust - 10, 0, 100);
    say("交渉失敗。警戒が上がった。", 160);
    stopNegotiation();
    return;
  }

  if (player.negoProgress >= 100) {
    // success: some become allied (info), others simply stand down
    if (e.type === "caravan") {
      e.stance = "allied";
      e.hostile = false;
      say("成功：輸送隊が通行を保証した（警戒 -1）", 180);
      game.alert = clamp(game.alert - 1, 0, 3);
    } else if (e.type === "guerrilla") {
      e.stance = "allied";
      e.hostile = false;
      say("成功：ゲリラが撤退路を提示した（情報：近道がある）", 180);
      // Give player a trust boost as narrative payoff
      player.trust = clamp(player.trust + 8, 0, 100);
    } else if (e.type === "security") {
      e.stance = "neutral";
      e.hostile = false;
      say("成功：手続きが通った。治安部隊は通過を黙認。", 180);
      player.trust = clamp(player.trust + 5, 0, 100);
    } else {
      e.stance = "neutral";
      e.hostile = false;
      say("成功：相手は退いた。『通れ』", 160);
    }
    stopNegotiation();
  }
}
