/**
 * Game loop update logic
 */

function loadStage(idx) {
  game.stageIndex = idx;
  game.stage = STAGES[idx];
  game.map = game.stage.map;
  game.mapH = game.map.length;
  game.mapW = game.map[0].length;
  game.cameraX = 0; game.cameraY = 0;
  game.time = 0;
  game.state = "intro";
  game.introLine = 0;
  game.alert = 0;
  game.message = "";
  game.messageT = 0;

  // reset player
  player.x = 2*TILE; player.y = 6*TILE;
  player.vx = 0; player.vy = 0;
  player.onGround = false; player.face = 1;
  player.trust = 100;
  player.hp = 3;
  player.dashT = 0;
  player.dashCD = 0;
  player.negotiating = null;
  player.negoProgress = 0;
  player.canDoubleJump = true; // reset double jump ability

  // enemies
  enemies = [];
  for (const s of game.stage.enemySpawns) {
    const e = enemyTemplate(s.type);
    e.x = s.x; e.y = s.y;
    e.originX = e.x;
    enemies.push(e);
  }

  // breakable tiles
  breakTiles.clear();
  for (let y=0; y<game.mapH; y++) {
    for (let x=0; x<game.mapW; x++) {
      if (game.map[y][x] === 4) breakTiles.set(`${x},${y}`, 120); // durability frames
    }
  }
}

function update() {
  game.time++;

  if (game.messageT > 0) game.messageT--;

  // Stage selection screen
  if (game.state === "select") {
    // Navigation
    if (pressed("ArrowUp") || pressed("w") || pressed("W")) {
      game.selectedStage = (game.selectedStage - 1 + STAGES.length) % STAGES.length;
    }
    if (pressed("ArrowDown") || pressed("s") || pressed("S")) {
      game.selectedStage = (game.selectedStage + 1) % STAGES.length;
    }
    // Select stage
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      loadStage(game.selectedStage);
    }
    return;
  }

  if (game.state === "intro") {
    // Advance intro with Enter or E or Space
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      game.introLine++;
      if (game.introLine >= game.stage.intro.length) {
        game.state = "play";
        say("任務開始：壊さずに通れ。", 150);
      }
    }
    return;
  }

  if (game.state === "gameover") {
    if (pressed("r") || pressed("R")) loadStage(game.stageIndex);
    return;
  }

  if (game.state === "clear") {
    if (game.stageIndex < STAGES.length - 1) {
      loadStage(game.stageIndex + 1);
    } else {
      // end
      game.state = "intro";
      game.stage = {
        title: "完了：報告書は届いた",
        palette: { sky:"#0b1020", far:"#0b1020", mid:"#0b1020", ground:"#0b1020", accent:"#e2e8f0" },
        intro: [
          "あなたは最後の検問を越えた。",
          "報告書は首都に届き、襲撃の構造は露呈する。",
          "黒幕は一人ではない。だが、壊さずに通す道は確かに存在した。",
          "もう一度遊ぶなら R。"
        ],
        map: Array.from({length:15}, () => Array(40).fill(0)),
        enemySpawns: [],
        npcNotes: []
      };
      game.map = game.stage.map;
      game.mapH = game.map.length;
      game.mapW = game.map[0].length;
      game.introLine = 0;
      enemies = [];
    }
    return;
  }

  // =====================================================
  // PLAY state
  // =====================================================
  // Player control
  const left = isDown("ArrowLeft") || isDown("a") || isDown("A");
  const right = isDown("ArrowRight") || isDown("d") || isDown("D");
  const jump = pressed(" ") || pressed("ArrowUp") || pressed("w") || pressed("W");
  const dash = pressed("Shift");

  // dash
  if (player.dashCD > 0) player.dashCD--;
  if (player.dashT > 0) player.dashT--;

  if (dash && player.dashCD === 0) {
    player.dashT = 14;
    player.dashCD = 65;
    say("ダッシュ", 30);
  }

  const moveSpeed = player.dashT > 0 ? 6.2 : 3.2;

  if (left && !right) { player.vx = -moveSpeed; player.face = -1; }
  else if (right && !left) { player.vx = moveSpeed; player.face = 1; }
  else player.vx = lerp(player.vx, 0, 0.4);

  // Jump and Double Jump logic
  if (jump) {
    if (player.onGround) {
      // First jump from ground
      player.vy = -13.2;
      player.onGround = false;
    } else if (player.canDoubleJump) {
      // Double jump in air
      player.vy = -12.0; // slightly weaker than first jump
      player.canDoubleJump = false;
    }
  }

  // Reset double jump ability when landing (handles both: after double-jump and after falling)
  if (player.onGround) {
    player.canDoubleJump = true;
  }

  // gravity
  player.vy = clamp(player.vy + GRAVITY, -999, MAX_FALL);

  // negotiation start/hold
  const eNear = nearestNegotiableEnemy();
  const eKeyHeld = isDown("e") || isDown("E");
  if (eKeyHeld) {
    if (!player.negotiating && eNear) startNegotiation(eNear);
    if (player.negotiating) negotiationTick();
  } else {
    if (player.negotiating) stopNegotiation();
  }

  // apply movement/collision
  resolveCollisions(player);

  // hazards: trust drains; falling pits: if y > map bottom -> death
  if (hazardTouch(player)) {
    player.trust = clamp(player.trust - 0.35, 0, 100);
    // In city hazard also raises alert slowly
    if (game.stage.id === "city" && Math.random() < 0.03) {
      game.alert = clamp(game.alert + 1, 0, 3);
      say("監視が反応した。警戒 +1", 90);
    }
  }

  // breakable tiles: standing on them decreases durability
  updateBreakablesUnderPlayer();

  // goal
  if (goalTouch(player)) {
    game.state = "clear";
    say("通過成功：次の現場へ", 120);
  }

  // enemy updates and interactions
  updateEnemies();

  // fail conditions
  if (player.y > game.mapH*TILE + 220) {
    // fell into pit
    player.hp = 0;
    die("落下：落とし穴に落ちた。");
  }
  if (player.trust <= 0) {
    die("信頼が尽きた：現場はあなたを拒絶した。");
  }
  if (player.hp <= 0) {
    die("負傷：任務続行不能。");
  }

  // camera
  const targetX = clamp(player.x - W*0.45, 0, game.mapW*TILE - W);
  game.cameraX = lerp(game.cameraX, targetX, 0.12);
  game.cameraY = 0;
}

function updateBreakablesUnderPlayer() {
  // Check tiles just beneath player's feet
  const footY = player.y + player.h + 1;
  const leftX = player.x + 4;
  const rightX = player.x + player.w - 4;

  const a = worldToTile(leftX, footY);
  const b = worldToTile(rightX, footY);

  for (const p of [a,b]) {
    if (tileAt(p.tx, p.ty) === 4) {
      const key = `${p.tx},${p.ty}`;
      const d = breakTiles.get(key) ?? 0;
      const nd = d - 1;
      breakTiles.set(key, nd);
      if (nd === 60) say("床が軋む…", 60);
      if (nd <= 0) {
        // break: set to empty
        game.map[p.ty][p.tx] = 0;
        say("床が崩れた。", 80);
      }
    }
  }
}

function updateEnemies() {
  const alertMul = 1 + game.alert * 0.22;

  for (const e of enemies) {
    // drones hover: ignore ground a bit
    if (e.type === "drone") {
      e.y += Math.sin(game.time * 0.06) * 0.45;
    }

    // allied/neutral don't attack
    const canAttack = e.hostile && e.stance !== "allied";

    // patrol
    const patrolLeft = e.originX - e.patrol;
    const patrolRight = e.originX + e.patrol;

    // aggro movement toward player if close and hostile
    const dx = (player.x + player.w/2) - (e.x + e.w/2);
    const dist = Math.abs(dx);

    let speed = e.vx * alertMul;
    if (e.stance === "neutral") speed *= 0.6;

    if (canAttack && dist < e.aggroRange) {
      e.dir = dx >= 0 ? 1 : -1;
      e.vx = e.dir * speed;
    } else {
      // normal patrol
      e.vx = e.dir * speed * 0.85;
      if (e.x < patrolLeft) e.dir = 1;
      if (e.x > patrolRight) e.dir = -1;
    }

    // gravity for non-drones
    if (e.type !== "drone") {
      e.vy = clamp(e.vy + GRAVITY, -999, MAX_FALL);
    } else {
      e.vy = 0;
    }

    resolveCollisions(e);

    // contact damage if hostile
    if (canAttack && aabb(player.x, player.y, player.w, player.h, e.x, e.y, e.w, e.h)) {
      // If negotiating, break it
      if (player.negotiating) stopNegotiation();
      // damage
      player.hp -= e.contactDamage;
      player.trust = clamp(player.trust - 7, 0, 100);
      say("接触：押し返された（HP -1 / 信頼 -7）", 120);
      // knockback
      player.vx = -e.dir * 5.2;
      player.vy = -7.5;
      // alert rises on clash
      game.alert = clamp(game.alert + 1, 0, 3);
    }
  }
}

function die(reason) {
  game.state = "gameover";
  say(reason + "　Rで再開。", 999999);
}
