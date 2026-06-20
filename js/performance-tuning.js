/**
 * Lightweight rendering guards.
 * Keeps the richer visuals while skipping work that cannot be seen.
 */
(function () {
  "use strict";

  const PARTICLE_LIMIT = 100;
  const EFFECT_LIMIT = 18;
  const VIEW_MARGIN = 96;

  const baseCreateParticles = window.createParticles;
  const baseDrawEnemyByType = window.drawEnemyByType;
  const baseDrawDefeatEffects = window.drawDefeatEffects;

  window.createParticles = function createParticles(x, y, type, count = 10) {
    const capped = Math.min(count, particleCapFor(type));
    baseCreateParticles(x, y, type, capped);
    if (particles.length > PARTICLE_LIMIT) {
      particles.splice(0, particles.length - PARTICLE_LIMIT);
    }
  };

  window.drawCollectibles = function drawCollectibles() {
    for (const c of collectibles) {
      if (c.collected || !isNearViewport(c.x, c.y, 24, 24, VIEW_MARGIN)) continue;

      const x = c.x;
      const y = c.y + Math.sin(game.time * 0.08) * 3;

      if (c.type === "coin") {
        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.arc(x + 12, y + 12, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffec80";
        ctx.beginPath();
        ctx.arc(x + 12, y + 12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#8b6914";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("\u00a5", x + 8, y + 16);
      } else if (c.type === "connection") {
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(x + 2, y + 4, 20, 16);
        ctx.strokeStyle = "#4a90d9";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 4, 20, 16);
        ctx.fillStyle = "#4a90d9";
        ctx.beginPath();
        ctx.arc(x + 12, y + 10, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + 7, y + 14, 10, 4);
      }
    }
  };

  window.drawPowerUps = function drawPowerUps() {
    for (const p of powerUps) {
      if (!p.active || !isNearViewport(p.x, p.y, 28, 28, VIEW_MARGIN)) continue;

      const x = p.x;
      const y = p.y + Math.sin(game.time * 0.1) * 2;
      const skill = SKILLS[p.type];
      const pulse = Math.sin(game.time * 0.12) * 0.3 + 0.7;

      ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.25})`;
      ctx.beginPath();
      ctx.arc(x + 12, y + 12, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = skill.color;
      ctx.beginPath();
      ctx.arc(x + 12, y + 12, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "18px sans-serif";
      ctx.fillText(skill.icon, x + 3, y + 18);
    }
  };

  window.drawParticles = function drawParticles() {
    for (const p of particles) {
      if (!isNearViewport(p.x, p.y, p.size * 4, p.size * 4, VIEW_MARGIN)) continue;

      const alpha = clamp(p.life / p.maxLife, 0, 1);
      if (p.type === "fail" || p.type === "damage") {
        ctx.fillStyle = p.type === "fail"
          ? `rgba(239, 68, 68, ${alpha})`
          : `rgba(255, 100, 100, ${alpha})`;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        ctx.fillStyle = particleColor(p.type, alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, particleSize(p), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  window.drawEnemyByType = function drawEnemyByType(e) {
    if (!isNearViewport(e.x, e.y, e.w, e.h, 150) && !e.isBoss) return;
    baseDrawEnemyByType(e);
  };

  window.drawDefeatEffects = function drawDefeatEffects() {
    if (game.defeatEffects.length > EFFECT_LIMIT) {
      game.defeatEffects.splice(0, game.defeatEffects.length - EFFECT_LIMIT);
    }

    const visible = game.defeatEffects.filter(effect =>
      isNearViewport(effect.x, effect.y, 120, 90, 160)
    );

    if (visible.length === game.defeatEffects.length) {
      baseDrawDefeatEffects();
      return;
    }

    const original = game.defeatEffects;
    game.defeatEffects = visible;
    baseDrawDefeatEffects();
    game.defeatEffects = original;
  };

  function isNearViewport(x, y, w, h, margin) {
    const left = game.cameraX - margin;
    const right = game.cameraX + W + margin;
    const top = game.cameraY - margin;
    const bottom = game.cameraY + H + margin;
    return x + w >= left && x <= right && y + h >= top && y <= bottom;
  }

  function particleCapFor(type) {
    if (type === "boss") return 10;
    if (type === "stomp" || type === "damage") return 8;
    if (type === "itembox") return 5;
    return 9;
  }

  function particleColor(type, alpha) {
    if (type === "coin") return `rgba(255, 215, 0, ${alpha})`;
    if (type === "connection") return `rgba(74, 144, 217, ${alpha})`;
    if (type === "success") return `rgba(34, 197, 94, ${alpha})`;
    if (type === "boss") return `rgba(255, 215, 0, ${alpha})`;
    if (type === "powerup") return `rgba(255, 100, 200, ${alpha})`;
    if (type === "stomp") return `rgba(255, 150, 50, ${alpha})`;
    return `rgba(255, 255, 255, ${alpha})`;
  }

  function particleSize(p) {
    if (p.type === "powerup") return p.size * 1.35;
    if (p.type === "stomp") return p.size * 1.15;
    if (p.type === "boss") return p.size * 1.3;
    return p.size;
  }
}());
