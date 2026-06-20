/**
 * Animated player drawing override.
 * Loaded after render.js so it replaces drawPlayer without touching other rendering.
 */
(function () {
  "use strict";

  const OUTFIT_COLORS = [
    { suit: "#1e3a5f", lapel: "#0f2942", tie: "#dc2626", tieDark: "#b91c1c", pants: "#1e293b" },
    { suit: "#2d3748", lapel: "#1f2937", tie: "#805ad5", tieDark: "#6b46c1", pants: "#1a202c" },
    { suit: "#1a365d", lapel: "#102a45", tie: "#38a169", tieDark: "#2f855a", pants: "#171923" },
  ];

  const SKIN = "#fcd9b6";
  const HAIR = "#1c1917";
  const SHOE = "#0f172a";
  const SHIRT = "#f8fafc";
  const BRIEFCASE = "#78350f";
  const CLASP = "#d4af37";

  function getOutfitColors() {
    const outfit = (typeof playerGlobal !== "undefined" && playerGlobal.outfit) || 0;
    return OUTFIT_COLORS[outfit] || OUTFIT_COLORS[0];
  }

  function drawCenteredRect(x, y, w, h, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function drawLimb(topX, topY, width, height, angle, color) {
    const dx = -Math.sin(angle);
    const dy = Math.cos(angle);
    const centerX = topX + dx * height / 2;
    const centerY = topY + dy * height / 2;
    drawCenteredRect(centerX, centerY, width, height, angle, color);
    return {
      x: topX + dx * height,
      y: topY + dy * height,
      angle,
    };
  }

  function drawShoe(foot, strideSide) {
    drawCenteredRect(foot.x + strideSide * 1.5, foot.y + 1, 11, 4, foot.angle * 0.35, SHOE);
  }

  function drawHand(hand) {
    drawCenteredRect(hand.x, hand.y + 1, 5, 5, hand.angle * 0.35, SKIN);
  }

  function drawBriefcase(hand, facing) {
    const caseX = hand.x + (facing === 1 ? 7 : -7);
    const caseY = hand.y + 7;

    ctx.save();
    ctx.translate(caseX, caseY);
    ctx.rotate(hand.angle * 0.18);
    ctx.fillStyle = BRIEFCASE;
    ctx.fillRect(-5, -4, 10, 8);
    ctx.fillStyle = CLASP;
    ctx.fillRect(-2, -2, 4, 2);
    ctx.strokeStyle = "#4a2608";
    ctx.lineWidth = 1;
    ctx.strokeRect(-5, -4, 10, 8);
    ctx.restore();
  }

  window.drawPlayer = function drawPlayer(pal) {
    const px = player.x;
    const py = player.y;
    const pw = player.w;
    const ph = player.h;
    const facing = player.face || 1;
    const colors = getOutfitColors();
    const speed = Math.abs(player.vx || 0);
    const grounded = !!player.onGround;
    const walking = grounded && speed > 0.45 && !player.hipDropping;
    const dashStride = player.dashT > 0 || speed > 4.5;
    const strideRate = dashStride ? 0.52 : 0.36;
    const stride = walking ? Math.sin(game.time * strideRate) : 0;
    const strideStrength = walking ? clamp(speed / 3.2, 0, 1) : 0;
    const bob = walking ? Math.abs(Math.sin(game.time * strideRate)) * 1.4 : 0;
    const drawY = py - bob;
    const airborne = !grounded;
    const rising = airborne && player.vy < -0.7;
    const falling = airborne && player.vy >= -0.7;
    const hipDropping = !!player.hipDropping;

    if (player.activeSkill) {
      const skill = SKILLS[player.activeSkill];
      const pulse = Math.sin(game.time * 0.2) * 0.3 + 0.5;
      ctx.fillStyle = skill.color;
      ctx.globalAlpha = pulse * 0.3;
      ctx.beginPath();
      ctx.arc(px + pw / 2, drawY + ph / 2, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    let leftLegAngle = stride * 0.55 * strideStrength;
    let rightLegAngle = -stride * 0.55 * strideStrength;
    let legLength = 14;

    if (rising) {
      leftLegAngle = -0.5;
      rightLegAngle = 0.35;
      legLength = 12;
    } else if (falling) {
      leftLegAngle = 0.2;
      rightLegAngle = -0.18;
      legLength = hipDropping ? 15 : 13;
    }

    const legY = drawY + ph - legLength;
    const leftFoot = drawLimb(px + 8, legY, 7, legLength, leftLegAngle, colors.pants);
    const rightFoot = drawLimb(px + pw - 8, legY, 7, legLength, rightLegAngle, colors.pants);
    drawShoe(leftFoot, -Math.sign(stride || 1));
    drawShoe(rightFoot, Math.sign(stride || 1));

    const jacketY = drawY + 16;
    const jacketH = ph - 16 - legLength + 2;
    const shoulderY = jacketY + 6;

    let leftArmAngle = -stride * 0.7 * strideStrength - 0.08;
    let rightArmAngle = stride * 0.7 * strideStrength + 0.08;

    if (!walking) {
      leftArmAngle = -0.1;
      rightArmAngle = 0.1;
    }
    if (rising || hipDropping) {
      leftArmAngle = 2.45;
      rightArmAngle = -2.45;
    } else if (falling) {
      leftArmAngle = -0.35;
      rightArmAngle = 0.35;
    }

    const leftHand = drawLimb(px + 4, shoulderY, 6, 14, leftArmAngle, colors.suit);
    const rightHand = drawLimb(px + pw - 4, shoulderY, 6, 14, rightArmAngle, colors.suit);

    ctx.fillStyle = colors.suit;
    ctx.fillRect(px + 2, jacketY, pw - 4, jacketH);

    ctx.fillStyle = colors.lapel;
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

    ctx.fillStyle = SHIRT;
    ctx.fillRect(px + pw / 2 - 4, jacketY, 8, 10);

    const tieSwing = stride * 1.4 * strideStrength + (falling ? 0.4 * facing : 0);
    ctx.save();
    ctx.translate(px + pw / 2, jacketY + 2);
    ctx.rotate(tieSwing * 0.08);
    ctx.fillStyle = colors.tie;
    ctx.fillRect(-3, 0, 6, 16);
    ctx.fillStyle = colors.tieDark;
    ctx.fillRect(-2, -1, 4, 4);
    ctx.restore();

    ctx.fillStyle = CLASP;
    ctx.beginPath();
    ctx.arc(px + pw / 2, jacketY + 11, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + pw / 2, jacketY + 19, 2, 0, Math.PI * 2);
    ctx.fill();

    drawHand(leftHand);
    drawHand(rightHand);
    drawBriefcase(facing === 1 ? rightHand : leftHand, facing);

    const headY = drawY;
    const headH = 16;
    ctx.fillStyle = SKIN;
    ctx.fillRect(px + 5, headY + 4, pw - 10, headH - 4);

    ctx.fillStyle = HAIR;
    ctx.fillRect(px + 4, headY, pw - 8, 6);
    if (facing === 1) {
      ctx.fillRect(px + 4, headY, 4, 10);
    } else {
      ctx.fillRect(px + pw - 8, headY, 4, 10);
    }

    ctx.fillStyle = SHOE;
    if (facing === 1) {
      ctx.fillRect(px + pw - 12, headY + 8, 3, 3);
    } else {
      ctx.fillRect(px + 9, headY + 8, 3, 3);
    }

    if (player.invincible) {
      const blink = Math.floor(game.time / 4) % 2;
      if (blink === 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillRect(px, drawY, pw, ph);
      }
    }
  };
}());
