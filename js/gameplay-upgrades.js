/**
 * Gameplay upgrades: redesigned stages, richer enemy AI, boss attacks,
 * friendlier collision checks, stronger feedback, and career/network bonuses.
 */
(function () {
  "use strict";

  const bossHazards = [];
  const stompState = { combo: 0, timer: 0 };

  const baseLoadStage = window.loadStage;
  const baseUpdate = window.update;
  const baseDrawEnemies = window.drawEnemies;
  const baseStompEnemy = window.stompEnemy;
  const basePlayerTakeDamage = window.playerTakeDamage;
  const baseHazardTouch = window.hazardTouch;
  const baseGoalTouch = window.goalTouch;

  redesignStages();

  window.loadStage = function loadStage(idx) {
    bossHazards.length = 0;
    stompState.combo = 0;
    stompState.timer = 0;

    baseLoadStage(idx);
    applyCareerBonuses();
    enhanceLoadedEnemies();
  };

  window.update = function update() {
    if (player.damageCooldown > 0) player.damageCooldown--;
    if (stompState.timer > 0) stompState.timer--;
    else stompState.combo = 0;

    baseUpdate();
  };

  window.hazardTouch = function hazardTouch(ent) {
    if (ent !== player) return baseHazardTouch(ent);
    const box = playerBodyBox();
    const points = [
      worldToTile(box.x + 4, box.y + box.h - 2),
      worldToTile(box.x + box.w - 4, box.y + box.h - 2),
      worldToTile(box.x + box.w / 2, box.y + box.h - 2),
    ];
    return points.some(p => isHazardTile(tileAt(p.tx, p.ty)));
  };

  window.goalTouch = function goalTouch(ent) {
    if (ent !== player) return baseGoalTouch(ent);
    const box = playerBodyBox();
    const points = [
      worldToTile(box.x + 3, box.y + box.h - 8),
      worldToTile(box.x + box.w - 3, box.y + box.h - 8),
      worldToTile(box.x + box.w / 2, box.y + box.h / 2),
    ];
    return points.some(p => isGoalTile(tileAt(p.tx, p.ty)));
  };

  window.playerTakeDamage = function playerTakeDamage(e) {
    if (player.invincible) {
      basePlayerTakeDamage(e);
      return;
    }
    if (player.damageCooldown > 0) return;

    basePlayerTakeDamage(e);
    player.damageCooldown = playerGlobal.careerLevel >= 4 ? 70 : 52;
  };

  window.stompEnemy = function stompEnemy(e) {
    const wasDefeated = e.defeated;
    const bossHpBefore = e.bossHP;
    const result = baseStompEnemy(e);

    if (result) {
      stompState.combo = stompState.timer > 0 ? stompState.combo + 1 : 1;
      stompState.timer = 150;

      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2;
      createParticles(cx, cy, e.isBoss ? "boss" : "success", e.isBoss ? 18 : 10);

      if (!e.isBoss && !wasDefeated && stompState.combo >= 2) {
        collectibles.push({
          type: "coin",
          x: e.x + e.w / 2 - 12,
          y: e.y - 20,
          collected: false,
          fromBox: true,
          vy: -5,
        });
        createDefeatEffect(e.x, e.y - 12, "negotiate_success", `${stompState.combo}連続!`);
      } else if (e.isBoss && bossHpBefore !== e.bossHP) {
        spawnBossHitBurst(e);
      }
    }

    return result;
  };

  window.updateEnemies = function updateEnemies() {
    updateBossHazards();

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.defeated && !e.isBoss) {
        enemies.splice(i, 1);
        continue;
      }

      ensureEnemyUpgraded(e);
      if (e.defeated) continue;

      e.attackTimer = (e.attackTimer || 0) + 1;
      updateEnemyBrain(e);

      if (e.type !== "drone") e.vy = clamp(e.vy + GRAVITY, -999, MAX_FALL);
      resolveCollisions(e);
      e.onGround = isEnemyGrounded(e);

      if (!e.hostile || e.allied) continue;
      resolvePlayerEnemyContact(e);
    }
  };

  window.drawEnemies = function drawEnemies(pal) {
    baseDrawEnemies(pal);
    drawBossHazards();
    drawAllyBadges();
  };

  function redesignStages() {
    const market = STAGES.find(s => s.id === "market");
    const office = STAGES.find(s => s.id === "office");
    const port = STAGES.find(s => s.id === "port");

    Object.assign(market, {
      title: "国際展示会：ブース巡回ルート",
      palette: { sky: "#17273a", far: "#24384e", mid: "#335169", ground: "#6f5b7c", accent: "#f2c15e" },
      intro: [
        "展示会場に到着。まずは安全な足場でジャンプとブロック叩きを確認しよう。",
        "中盤は競合営業が追ってくる。踏む、避ける、ブロックで倒すを使い分けろ。",
        "後半のVIPブースにはコイン列とボスが待つ。報酬を拾って契約ゲートへ！",
      ],
      map: makeMarketRoute(),
      collectibles: coins([
        [5, 10], [7, 10], [9, 10], [13, 7], [24, 9], [25, 9], [36, 7], [44, 10],
        [55, 6], [56, 6], [68, 8], [78, 10], [92, 10], [95, 10], [99, 9], [113, 7],
      ]),
      enemySpawns: [
        spawn(23, 8, "buyer"),
        spawn(35, 8, "competitor"),
        spawn(53, 7, "competitor"),
        spawn(71, 8, "buyer"),
        spawn(91, 10, "competitor"),
      ],
      bossSpawn: spawn(118, 8, "boss_market"),
      npcNotes: [
        "序盤は練習、中央は追跡、終盤は報酬ルート。",
        "普通ブロックの上に敵がいる時は下から叩くと倒せる！",
      ],
    });

    Object.assign(office, {
      title: "本社ビル：会議室と低い通路",
      palette: { sky: "#0f1a27", far: "#18283a", mid: "#22364d", ground: "#526170", accent: "#8bd3ff" },
      intro: [
        "本社ビルでは低い資料室通路を通る。1ブロック分の隙間も抜けられる。",
        "ブローカーは跳び、受付は道を塞ぎ、重役は接触が重い。踏み判定をよく見よう。",
        "CEOは書類を降らせる。床とブロックを使って間合いを作れ！",
      ],
      map: makeOfficeRoute(),
      collectibles: coins([
        [4, 10], [6, 10], [20, 11], [22, 11], [24, 11], [32, 7], [43, 6], [52, 10],
        [63, 7], [74, 10], [85, 6], [97, 9], [100, 9],
      ]),
      enemySpawns: [
        spawn(18, 10, "gatekeeper"),
        spawn(36, 6, "broker"),
        spawn(55, 10, "executive"),
        spawn(72, 7, "broker"),
        spawn(92, 10, "gatekeeper"),
      ],
      bossSpawn: spawn(106, 7, "boss_office"),
      npcNotes: [
        "低い通路は資料室。1ブロック分でも通れるようになった。",
        "ブローカーは跳ぶ。重役は横から触ると痛い。",
      ],
    });

    Object.assign(port, {
      title: "港湾物流：コンテナと税関ライン",
      palette: { sky: "#102332", far: "#17394a", mid: "#1e5267", ground: "#2f6d7c", accent: "#75d0ff" },
      intro: [
        "港湾ではコンテナ足場と税関ラインが入り組む。焦らず足場を読むこと。",
        "官僚は書類、記者は踏めない追跡、組合代表はジャンプで揺さぶってくる。",
        "通関局長はコンテナを落とす。警告位置からすぐ離れろ！",
      ],
      map: makePortRoute(),
      collectibles: coins([
        [4, 10], [7, 10], [14, 9], [24, 8], [35, 7], [46, 10], [58, 6], [69, 10],
        [78, 7], [89, 9], [101, 6], [106, 6], [112, 10],
      ]),
      enemySpawns: [
        spawn(21, 8, "union"),
        spawn(38, 7, "government"),
        spawn(55, 8, "media"),
        spawn(75, 10, "gatekeeper"),
        spawn(91, 8, "government"),
        spawn(103, 8, "union"),
      ],
      bossSpawn: spawn(113, 7, "boss_port"),
      npcNotes: [
        "赤い警告が出たらコンテナ落下地点から離れよう。",
        "記者は踏めない。ブロックや無敵で対処！",
      ],
    });
  }

  function makeMap(w, h = 15) {
    return Array.from({ length: h }, () => Array(w).fill(0));
  }

  function fillGround(m, from, to, y = 12) {
    for (let x = from; x <= to; x++) {
      m[y][x] = 1;
      m[y + 1][x] = 1;
      m[y + 2][x] = 1;
    }
  }

  function row(m, x, y, w, value) {
    for (let i = 0; i < w; i++) m[y][x + i] = value;
  }

  function makeMarketRoute() {
    const m = makeMap(128);
    [[0, 15], [19, 39], [44, 64], [69, 88], [92, 126]].forEach(s => fillGround(m, s[0], s[1]));
    row(m, 10, 8, 5, 1);
    row(m, 24, 9, 6, 1);
    row(m, 34, 8, 5, 1);
    row(m, 52, 7, 6, 1);
    row(m, 66, 9, 5, 1);
    row(m, 80, 8, 5, 1);
    row(m, 94, 10, 8, 1);
    row(m, 111, 8, 6, 1);
    [13, 28, 36, 55, 68, 82, 96, 114].forEach((x, i) => { m[i % 2 ? 7 : 6][x] = 6; });
    row(m, 46, 11, 4, 2);
    row(m, 76, 11, 4, 2);
    m[11][125] = 3;
    m[10][125] = 3;
    return m;
  }

  function makeOfficeRoute() {
    const m = makeMap(116);
    [[0, 14], [16, 34], [39, 58], [63, 81], [86, 114]].forEach(s => fillGround(m, s[0], s[1]));
    row(m, 18, 10, 10, 1);
    row(m, 32, 7, 7, 1);
    row(m, 42, 6, 6, 1);
    row(m, 61, 8, 7, 1);
    row(m, 78, 7, 5, 1);
    row(m, 94, 9, 7, 1);
    row(m, 45, 11, 5, 2);
    row(m, 67, 11, 5, 2);
    row(m, 50, 6, 4, 4);
    [22, 34, 44, 63, 80, 96].forEach((x, i) => { m[i % 2 ? 5 : 6][x] = 6; });
    m[11][113] = 3;
    m[10][113] = 3;
    return m;
  }

  function makePortRoute() {
    const m = makeMap(122);
    [[0, 12], [16, 31], [36, 54], [59, 77], [82, 120]].forEach(s => fillGround(m, s[0], s[1]));
    row(m, 18, 9, 7, 1);
    row(m, 33, 8, 7, 1);
    row(m, 48, 9, 8, 1);
    row(m, 62, 7, 6, 1);
    row(m, 75, 9, 6, 1);
    row(m, 88, 8, 8, 1);
    row(m, 101, 7, 7, 1);
    row(m, 41, 11, 5, 2);
    row(m, 70, 11, 4, 2);
    [20, 23, 37, 52, 65, 90, 104].forEach((x, i) => { m[i % 2 ? 6 : 7][x] = 6; });
    m[11][119] = 3;
    m[10][119] = 3;
    return m;
  }

  function coins(points) {
    return points.map(([x, y]) => ({ type: "coin", x: x * TILE, y: y * TILE }));
  }

  function spawn(x, y, type) {
    return { x: x * TILE, y: y * TILE, type };
  }

  function applyCareerBonuses() {
    player.damageCooldown = 0;

    if (playerGlobal.careerLevel >= 2) {
      player.hp += 1;
      player.trust = Math.min(100, player.trust + 10);
    }
    if (playerGlobal.careerLevel >= 3) player.coins += 1;
    if (playerGlobal.careerLevel >= 4) player.connections += 1;
    if (playerGlobal.careerLevel >= 5) {
      game.pendingStartItems.push("speed", "jump");
      game.startItemDelay = Math.max(game.startItemDelay, 20);
    }

    const allyCount = Math.min(3, Math.floor(playerGlobal.networkTotal / 8));
    if (allyCount > 0) {
      let allied = 0;
      for (const e of enemies) {
        if (e.isBoss || e.unstompable || allied >= allyCount) continue;
        e.allied = true;
        e.hostile = false;
        e.contactDamage = 0;
        e.vx = Math.max(0.35, Math.abs(e.vx) * 0.45);
        allied++;
      }
      if (allied > 0) say(`人脈効果：${allied}人が味方として同行！`, 150);
    }
  }

  function enhanceLoadedEnemies() {
    for (const e of enemies) ensureEnemyUpgraded(e);
  }

  function ensureEnemyUpgraded(e) {
    if (e.upgradedAI) return;
    e.upgradedAI = true;
    e.baseSpeed = Math.max(0.35, Math.abs(e.vx || 0.8));
    e.attackTimer = 0;
    e.aiCooldown = 30 + Math.floor(Math.random() * 50);
    e.noticeRange = e.isBoss ? 320 : 210;

    if (e.type === "buyer") {
      e.noticeRange = 170;
      e.baseSpeed = 0.7;
    } else if (e.type === "broker") {
      e.baseSpeed = 1.05;
      e.jumpCD = 55;
    } else if (e.type === "executive") {
      e.baseSpeed = 0.5;
      e.contactDamage = 2;
      e.armor = 1;
    } else if (e.type === "gatekeeper") {
      e.baseSpeed = 0.35;
      e.patrol = 28;
    } else if (e.type === "government") {
      e.baseSpeed = 0.55;
      e.noticeRange = 240;
    } else if (e.type === "media") {
      e.baseSpeed = 1.55;
      e.noticeRange = 280;
      e.unstompable = true;
    } else if (e.type === "boss_market") {
      e.baseSpeed = 0.9;
      e.bossRushCD = 65;
      e.noticeRange = 460;
    } else if (e.type === "boss_office") {
      e.baseSpeed = 0.72;
      e.paperCD = 45;
      e.noticeRange = 460;
    } else if (e.type === "boss_port") {
      e.baseSpeed = 0.62;
      e.containerCD = 70;
      e.noticeRange = 460;
    }
  }

  function updateEnemyBrain(e) {
    if (e.allied) {
      updateAlly(e);
      return;
    }

    if (e.isBoss) {
      updateBossBrain(e);
      return;
    }

    const dx = centerX(player) - centerX(e);
    const dist = Math.abs(dx);
    const patrolLeft = e.originX - e.patrol;
    const patrolRight = e.originX + e.patrol;
    let speed = e.baseSpeed;

    if (e.type === "competitor") {
      if (dist < e.noticeRange) {
        e.dir = dx > 0 ? 1 : -1;
        speed *= e.aiCooldown > 0 ? 1.35 : 2.1;
        if (e.aiCooldown <= 0) {
          e.aiCooldown = 100;
          createDefeatEffect(e.x, e.y - 18, "boss_phase", "突進!");
        }
      } else {
        patrolTurn(e, patrolLeft, patrolRight);
      }
    } else if (e.type === "buyer") {
      if (dist < e.noticeRange) {
        e.dir = dx > 0 ? -1 : 1;
        speed *= 1.2;
      } else {
        patrolTurn(e, patrolLeft, patrolRight);
      }
    } else if (e.type === "broker") {
      speed *= 0.8 + Math.sin(e.attackTimer * 0.15) * 0.35;
      if (e.jumpCD-- <= 0 && e.onGround) {
        e.vy = -9.5;
        e.jumpCD = 70;
      }
      patrolTurn(e, patrolLeft, patrolRight);
    } else if (e.type === "executive") {
      if (dist < 120) speed *= 0.45;
      patrolTurn(e, patrolLeft, patrolRight);
    } else if (e.type === "union") {
      if (e.jumpCD-- <= 0 && e.onGround) {
        e.vy = -10.5;
        e.jumpCD = 64;
      }
      patrolTurn(e, patrolLeft, patrolRight);
    } else if (e.type === "government") {
      if (dist < e.noticeRange && e.aiCooldown <= 0) {
        e.dir = dx > 0 ? 1 : -1;
        spawnBossHazard("paper", e.x + e.w / 2, e.y + 4, 18, 22, e.dir * 1.8, -3.5, 140, 1, 0);
        e.aiCooldown = 115;
        speed *= 0.3;
      } else {
        patrolTurn(e, patrolLeft, patrolRight);
      }
    } else if (e.type === "media") {
      if (dist < e.noticeRange) {
        e.dir = dx > 0 ? 1 : -1;
        speed *= 1.38;
        if (e.onGround && Math.abs(player.y - e.y) > 20 && e.aiCooldown <= 0) {
          e.vy = -8.5;
          e.aiCooldown = 80;
        }
      } else {
        patrolTurn(e, patrolLeft, patrolRight);
      }
    } else {
      patrolTurn(e, patrolLeft, patrolRight);
    }

    if (e.aiCooldown > 0) e.aiCooldown--;
    e.vx = e.dir * clamp(speed, 0.25, 3.6) * 0.85;
  }

  function updateAlly(e) {
    const targetX = player.x - player.face * (54 + enemies.indexOf(e) * 12);
    const dx = targetX - e.x;
    e.dir = dx > 0 ? 1 : -1;
    e.vx = clamp(dx * 0.035, -1.1, 1.1);
    if (Math.abs(dx) < 8) e.vx *= 0.3;
  }

  function updateBossBrain(e) {
    const dx = centerX(player) - centerX(e);
    const dist = Math.abs(dx);
    const dirToPlayer = dx > 0 ? 1 : -1;
    let speed = e.baseSpeed;

    if (e.type === "boss_market") {
      if (e.bossRushCD-- <= 0 && dist < e.noticeRange) {
        e.rushTimer = 32;
        e.bossRushCD = 120;
        e.dir = dirToPlayer;
        createDefeatEffect(e.x - 8, e.y - 28, "boss_phase", "大型商談突進!");
        triggerScreenShake(4, 8);
      }
      if (e.rushTimer > 0) {
        e.rushTimer--;
        speed = 3.6 + (4 - e.bossHP) * 0.45;
      } else {
        bossPatrolOrChase(e, dirToPlayer, dist);
      }
    } else if (e.type === "boss_office") {
      if (e.paperCD-- <= 0) {
        for (let i = -1; i <= 1; i++) {
          spawnBossHazard("paper", player.x + player.w / 2 + i * 44, 40, 18, 24, i * 0.25, 3.4, 170, 1, 12);
        }
        e.paperCD = Math.max(30, 76 - (4 - e.bossHP) * 12);
        createDefeatEffect(e.x - 8, e.y - 24, "boss_phase", "書類の雨!");
      }
      speed *= 0.95 + Math.sin(e.attackTimer * 0.12) * 0.35;
      bossPatrolOrChase(e, dirToPlayer, dist);
    } else if (e.type === "boss_port") {
      if (e.containerCD-- <= 0) {
        spawnBossHazard("container", player.x + player.w / 2 - 26, 20, 52, 34, 0, 6.2, 190, 2, 34);
        e.containerCD = Math.max(44, 94 - (4 - e.bossHP) * 14);
        createDefeatEffect(e.x - 8, e.y - 24, "boss_phase", "コンテナ落下!");
      }
      if (e.onGround && e.aiCooldown-- <= 0) {
        e.vy = -11;
        e.aiCooldown = 80;
      }
      bossPatrolOrChase(e, dirToPlayer, dist);
    }

    e.vx = e.dir * clamp(speed, 0.25, 4.4) * 0.9;
  }

  function bossPatrolOrChase(e, dirToPlayer, dist) {
    if (dist < e.noticeRange) e.dir = dirToPlayer;
    else patrolTurn(e, e.originX - e.patrol, e.originX + e.patrol);
  }

  function patrolTurn(e, left, right) {
    if (e.x < left) e.dir = 1;
    if (e.x > right) e.dir = -1;
  }

  function resolvePlayerEnemyContact(e) {
    const body = playerBodyBox();
    const enemyBox = { x: e.x, y: e.y, w: e.w, h: e.h };
    if (!aabb(body.x, body.y, body.w, body.h, enemyBox.x, enemyBox.y, enemyBox.w, enemyBox.h)) return;

    const feet = playerFeetBox();
    const enemyTop = e.y;
    const falling = player.vy > 0;
    const stompZone = feet.y + feet.h >= enemyTop - 6 && feet.y + feet.h <= enemyTop + 18;
    const centered = feet.x < e.x + e.w - 4 && feet.x + feet.w > e.x + 4;
    const hipDropStomp = player.hipDropping && falling && feet.y + feet.h <= enemyTop + 26;

    if ((falling && stompZone && centered && !e.unstompable) || (hipDropStomp && !e.unstompable)) {
      const stomped = stompEnemy(e);
      if (stomped) {
        player.vy = player.hipDropping ? -12.5 : -10.5;
        player.canDoubleJump = true;
        player.hipDropping = false;
      }
      return;
    }

    playerTakeDamage(e);
  }

  function updateBossHazards() {
    for (let i = bossHazards.length - 1; i >= 0; i--) {
      const h = bossHazards[i];
      h.timer--;

      if (h.warning > 0) {
        h.warning--;
      } else {
        h.x += h.vx;
        h.y += h.vy;
        if (h.type === "container") h.vy = Math.min(h.vy + 0.28, 9);
        if (h.type === "paper") h.vy = Math.min(h.vy + 0.08, 4.2);

        if (aabb(playerBodyBox().x, playerBodyBox().y, playerBodyBox().w, playerBodyBox().h, h.x, h.y, h.w, h.h)) {
          playerTakeDamage({ contactDamage: h.damage, dir: h.vx >= 0 ? 1 : -1 });
          createParticles(h.x + h.w / 2, h.y + h.h / 2, "damage", 10);
          h.timer = 0;
        }
      }

      if (h.timer <= 0 || h.y > game.mapH * TILE + 120) bossHazards.splice(i, 1);
    }
  }

  function spawnBossHazard(type, x, y, w, h, vx, vy, timer, damage, warning) {
    bossHazards.push({ type, x, y, w, h, vx, vy, timer, damage, warning });
  }

  function drawBossHazards() {
    for (const h of bossHazards) {
      if (h.warning > 0) {
        ctx.fillStyle = h.type === "container" ? "rgba(255, 70, 70, 0.28)" : "rgba(255, 230, 140, 0.22)";
        ctx.fillRect(h.x, 0, h.w, game.mapH * TILE);
        ctx.strokeStyle = h.type === "container" ? "rgba(255, 120, 120, 0.75)" : "rgba(255, 245, 190, 0.7)";
        ctx.lineWidth = 2;
        ctx.strokeRect(h.x, h.y, h.w, h.h);
        continue;
      }

      if (h.type === "container") {
        ctx.fillStyle = "#bd4f45";
        ctx.fillRect(h.x, h.y, h.w, h.h);
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.fillRect(h.x + 6, h.y + 8, h.w - 12, 3);
        ctx.fillRect(h.x + 6, h.y + 20, h.w - 12, 3);
        ctx.strokeStyle = "#6e2f2b";
        ctx.lineWidth = 2;
        ctx.strokeRect(h.x, h.y, h.w, h.h);
      } else {
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(h.x, h.y, h.w, h.h);
        ctx.fillStyle = "#64748b";
        ctx.fillRect(h.x + 4, h.y + 6, h.w - 8, 2);
        ctx.fillRect(h.x + 4, h.y + 12, h.w - 8, 2);
        ctx.strokeStyle = "rgba(30,41,59,0.45)";
        ctx.strokeRect(h.x, h.y, h.w, h.h);
      }
    }
  }

  function drawAllyBadges() {
    for (const e of enemies) {
      if (!e.allied || e.defeated) continue;
      ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
      ctx.beginPath();
      ctx.arc(e.x + e.w / 2, e.y - 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("味", e.x + e.w / 2 - 6, e.y - 6);
    }
  }

  function spawnBossHitBurst(e) {
    for (let i = 0; i < 2; i++) {
      collectibles.push({
        type: "coin",
        x: e.x + e.w / 2 + (i ? 14 : -14),
        y: e.y - 10,
        collected: false,
        fromBox: true,
        vy: -5 - i,
      });
    }
  }

  function playerBodyBox() {
    return {
      x: player.x + 2,
      y: player.y + 6,
      w: player.w - 4,
      h: player.h - 7,
    };
  }

  function playerFeetBox() {
    return {
      x: player.x + 4,
      y: player.y + player.h - 10,
      w: player.w - 8,
      h: 12,
    };
  }

  function isEnemyGrounded(e) {
    const footY = e.y + e.h + 1;
    const left = Math.floor((e.x + 4) / TILE);
    const mid = Math.floor((e.x + e.w / 2) / TILE);
    const right = Math.floor((e.x + e.w - 4) / TILE);
    const ty = Math.floor(footY / TILE);
    return [left, mid, right].some(tx => isSolidTile(tileAt(tx, ty)));
  }

  function centerX(ent) {
    return ent.x + ent.w / 2;
  }
}());
