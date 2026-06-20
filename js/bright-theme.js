/**
 * Bright visual pass.
 * Keeps gameplay behavior intact while lifting the game's overall mood.
 */
(function () {
  "use strict";

  const baseDraw = window.draw;

  const BRIGHT_PALETTES = {
    market: { sky: "#9ed8ff", far: "#bfe8ff", mid: "#fff1b8", ground: "#c98b58", accent: "#ffcf55" },
    office: { sky: "#f7fbff", far: "#e4f3ff", mid: "#d7ecff", ground: "#9eb4ca", accent: "#59b8ff" },
    port: { sky: "#8edcff", far: "#b9efff", mid: "#78cde2", ground: "#42a8bb", accent: "#ffd05a" },
  };

  applyBrightPalettes();

  window.draw = function draw() {
    applyBrightPalettes();
    ctx.save();
    ctx.filter = "brightness(1.16) saturate(1.08)";
    baseDraw();
    ctx.restore();
  };

  window.drawParallax = function drawParallax(color, factor, height) {
    const id = game.stage?.id || "market";
    const offset = -((game.cameraX * factor) % W);

    ctx.save();
    if (factor < 0.2) {
      if (id === "office") drawOfficeInteriorBack(offset);
      else if (id === "port") drawPortDayBack(offset);
      else drawMarketDayBack(offset);
    } else {
      if (id === "office") drawOfficeInteriorFront(offset);
      else if (id === "port") drawPortDayFront(offset);
      else drawMarketDayFront(offset);
    }
    ctx.restore();
  };

  function applyBrightPalettes() {
    for (const stage of STAGES) {
      const bright = BRIGHT_PALETTES[stage.id];
      if (bright) stage.palette = bright;
    }
  }

  function loop(offset, drawOne) {
    for (let i = -1; i <= 2; i++) drawOne(offset + i * W);
  }

  function drawMarketDayBack(offset) {
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    loop(offset * 0.55, x => {
      for (let i = 0; i < 5; i++) {
        drawCloud(x + i * 210 + 45, 72 + (i % 2) * 24, 1 + (i % 3) * 0.12);
      }
    });

    loop(offset, x => {
      for (let i = 0; i < 7; i++) {
        const bx = x + i * 150 + 18;
        ctx.fillStyle = i % 2 ? "#9bd8e6" : "#ffd789";
        ctx.fillRect(bx, H - 282, 92, 86);
        ctx.fillStyle = "rgba(255,255,255,0.74)";
        ctx.fillRect(bx + 10, H - 264, 72, 12);
        ctx.fillRect(bx + 10, H - 238, 52, 10);
      }
    });
  }

  function drawMarketDayFront(offset) {
    loop(offset, x => {
      for (let i = 0; i < 6; i++) {
        const bx = x + i * 172 + 26;
        ctx.fillStyle = i % 2 ? "#46b8aa" : "#ff9f6a";
        ctx.fillRect(bx, H - 186, 108, 18);
        ctx.fillStyle = "#fffbe7";
        ctx.fillRect(bx + 10, H - 212, 88, 26);
        ctx.fillStyle = "#52718a";
        ctx.fillRect(bx + 18, H - 204, 54, 4);
        ctx.fillRect(bx + 18, H - 194, 68, 4);
        ctx.fillStyle = "#7f9bac";
        ctx.fillRect(bx + 12, H - 168, 8, 64);
        ctx.fillRect(bx + 88, H - 168, 8, 64);
      }
    });
  }

  function drawOfficeInteriorBack(offset) {
    ctx.fillStyle = "#f8fcff";
    ctx.fillRect(0, H - 340, W, 178);
    ctx.fillStyle = "#e7f3fb";
    ctx.fillRect(0, H - 162, W, 58);

    loop(offset * 0.35, x => {
      for (let i = 0; i < 7; i++) {
        const wx = x + i * 158 + 28;
        ctx.fillStyle = "#d6ecff";
        ctx.fillRect(wx, H - 314, 102, 84);
        ctx.fillStyle = "rgba(255,255,255,0.74)";
        ctx.fillRect(wx + 6, H - 308, 90, 72);
        ctx.strokeStyle = "rgba(86, 140, 170, 0.26)";
        ctx.lineWidth = 2;
        ctx.strokeRect(wx, H - 314, 102, 84);
        ctx.beginPath();
        ctx.moveTo(wx + 51, H - 314);
        ctx.lineTo(wx + 51, H - 230);
        ctx.moveTo(wx, H - 272);
        ctx.lineTo(wx + 102, H - 272);
        ctx.stroke();
      }
    });

    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(70 + i * 190, H - 354, 86, 8);
      ctx.fillStyle = "rgba(255, 238, 160, 0.48)";
      ctx.fillRect(78 + i * 190, H - 346, 70, 46);
      ctx.fillStyle = "#ffffff";
    }
  }

  function drawOfficeInteriorFront(offset) {
    loop(offset, x => {
      for (let i = 0; i < 6; i++) {
        const dx = x + i * 176 + 30;
        ctx.fillStyle = "#b8d4e8";
        ctx.fillRect(dx, H - 178, 92, 10);
        ctx.fillStyle = "#f7d99a";
        ctx.fillRect(dx + 10, H - 196, 72, 18);
        ctx.fillStyle = "#7aa7c4";
        ctx.fillRect(dx + 20, H - 214, 32, 18);
        ctx.fillStyle = "#eef8ff";
        ctx.fillRect(dx + 23, H - 211, 26, 12);
        ctx.fillStyle = "#8aa1b2";
        ctx.fillRect(dx + 18, H - 168, 6, 42);
        ctx.fillRect(dx + 68, H - 168, 6, 42);

        ctx.fillStyle = "#86cfa0";
        ctx.fillRect(dx + 100, H - 166, 14, 28);
        ctx.fillStyle = "#3fa76e";
        ctx.beginPath();
        ctx.arc(dx + 107, H - 180, 14, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.fillStyle = "rgba(255,255,255,0.48)";
    ctx.fillRect(0, H - 128, W, 10);
  }

  function drawPortDayBack(offset) {
    ctx.fillStyle = "#74cce4";
    ctx.fillRect(0, H - 178, W, 48);
    ctx.fillStyle = "rgba(255,255,255,0.44)";
    for (let i = 0; i < 14; i++) {
      const wx = (offset * 0.18 + i * 86) % (W + 120) - 60;
      ctx.fillRect(wx, H - 158 + (i % 2) * 9, 48, 3);
    }

    loop(offset, x => {
      for (let i = 0; i < 4; i++) {
        const cx = x + i * 250 + 38;
        ctx.strokeStyle = "#4ba6b9";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx, H - 292);
        ctx.lineTo(cx, H - 162);
        ctx.lineTo(cx + 88, H - 262);
        ctx.lineTo(cx + 166, H - 262);
        ctx.stroke();
        ctx.fillStyle = "#ffbd5b";
        ctx.fillRect(cx + 136, H - 256, 16, 34);
      }
    });
  }

  function drawPortDayFront(offset) {
    loop(offset, x => {
      const colors = ["#ff7f6e", "#ffbd5b", "#46b878", "#4aa3df"];
      for (let i = 0; i < 10; i++) {
        const bx = x + i * 110 + 18;
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(bx, H - 176 - (i % 2) * 26, 74, 22);
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.fillRect(bx + 8, H - 171 - (i % 2) * 26, 58, 2);
      }
      ctx.fillStyle = "#4fb9ca";
      ctx.fillRect(x, H - 128, W, 20);
    });
  }

  function drawCloud(x, y, scale) {
    ctx.beginPath();
    ctx.arc(x, y, 18 * scale, 0, Math.PI * 2);
    ctx.arc(x + 22 * scale, y - 7 * scale, 24 * scale, 0, Math.PI * 2);
    ctx.arc(x + 48 * scale, y, 18 * scale, 0, Math.PI * 2);
    ctx.rect(x - 2 * scale, y, 54 * scale, 18 * scale);
    ctx.fill();
  }
}());
