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
  game.bossDefeated = false;
  game.bossPhase = 0;
  game.defeatEffects = [];

  // reset player
  player.x = 2*TILE; player.y = 6*TILE;
  player.vx = 0; player.vy = 0;
  player.onGround = false; player.face = 1;
  player.trust = 100;
  player.hp = 3;
  player.dashT = 0;
  player.dashCD = 0;
  player.canDoubleJump = true;
  player.hipDropping = false;
  player.hipDropCD = 0;
  
  // スキル状態リセット
  player.activeSkill = null;
  player.skillTimer = 0;
  player.speedBoost = false;
  player.jumpBoost = false;
  player.invincible = false;
  player.magnetActive = false;
  
  // Apply career level bonuses
  player.coins = 0;
  player.connections = 0;
  if (playerGlobal.careerLevel >= 3) player.coins += 2;
  if (playerGlobal.careerLevel >= 4) player.connections += 1;
  
  // Apply purchased extra HP
  if (extraHPPurchased) {
    player.hp += 1;
    extraHPPurchased = false;
  }

  // enemies
  enemies = [];
  for (const s of game.stage.enemySpawns) {
    const e = enemyTemplate(s.type);
    e.x = s.x; e.y = s.y;
    e.originX = e.x;
    enemies.push(e);
  }
  
  // Add boss if stage has one
  if (game.stage.bossSpawn) {
    const boss = enemyTemplate(game.stage.bossSpawn.type);
    boss.x = game.stage.bossSpawn.x;
    boss.y = game.stage.bossSpawn.y;
    boss.originX = boss.x;
    enemies.push(boss);
  }

  // collectibles (コインのみ - 人脈は敵ドロップに統一)
  collectibles = [];
  if (game.stage.collectibles) {
    for (const c of game.stage.collectibles) {
      // Only add coins on the course; connections come from enemies
      if (c.type === "coin") {
        collectibles.push({ ...c, collected: false });
      }
    }
  }
  
  // パワーアップアイテム
  powerUps = [];
  
  // Apply purchased start items (購入済みスタートアイテムを発動)
  if (purchasedStartItems.length > 0) {
    setTimeout(() => {
      for (const item of purchasedStartItems) {
        activateSkill(item);
      }
      purchasedStartItems = [];
    }, 500);
  }
  
  // アイテムボックス状態リセット
  itemBoxes.clear();

  // breakable tiles
  breakTiles.clear();
  for (let y=0; y<game.mapH; y++) {
    for (let x=0; x<game.mapW; x++) {
      if (game.map[y][x] === 4) breakTiles.set(`${x},${y}`, 120);
    }
  }
}

function update() {
  game.time++;

  if (game.messageT > 0) game.messageT--;

  // Top menu (RPG style hub)
  if (game.state === "topmenu") {
    // Navigation (horizontal layout - left/right)
    if (pressed("ArrowLeft") || pressed("a") || pressed("A")) {
      game.topMenuSelection = (game.topMenuSelection - 1 + 4) % 4;
      playSFX("select");
    }
    if (pressed("ArrowRight") || pressed("d") || pressed("D")) {
      game.topMenuSelection = (game.topMenuSelection + 1) % 4;
      playSFX("select");
    }
    // Also support up/down for accessibility
    if (pressed("ArrowUp") || pressed("w") || pressed("W")) {
      game.topMenuSelection = (game.topMenuSelection - 1 + 4) % 4;
      playSFX("select");
    }
    if (pressed("ArrowDown") || pressed("s") || pressed("S")) {
      game.topMenuSelection = (game.topMenuSelection + 1) % 4;
      playSFX("select");
    }
    // Select location
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      playSFX("confirm");
      if (game.topMenuSelection === 0) {
        game.state = "headquarters"; // 本社
        game.headquartersSelection = 0;
      } else if (game.topMenuSelection === 1) {
        game.state = "branch"; // 支社
        game.branchSelection = 0;
      } else if (game.topMenuSelection === 2) {
        game.state = "manufacturer"; // メーカー（服やアイテム購入）
        game.manufacturerSelection = 0;
      } else {
        game.state = "select"; // 交通センター（ステージ選択）
      }
    }
    return;
  }

  // Headquarters menu (settings, outfit)
  if (game.state === "headquarters") {
    if (pressed("ArrowUp") || pressed("w") || pressed("W")) {
      game.headquartersSelection = (game.headquartersSelection - 1 + 3) % 3;
    }
    if (pressed("ArrowDown") || pressed("s") || pressed("S")) {
      game.headquartersSelection = (game.headquartersSelection + 1) % 3;
    }
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      if (game.headquartersSelection === 0) {
        // Change outfit (cycle through unlocked outfits)
        const startOutfit = playerGlobal.outfit;
        let nextOutfit = (playerGlobal.outfit + 1) % playerGlobal.outfitsUnlocked.length;
        let loopCount = 0;
        const maxLoops = playerGlobal.outfitsUnlocked.length;
        while (!playerGlobal.outfitsUnlocked[nextOutfit] && loopCount < maxLoops) {
          nextOutfit = (nextOutfit + 1) % playerGlobal.outfitsUnlocked.length;
          loopCount++;
        }
        if (playerGlobal.outfitsUnlocked[nextOutfit]) {
          playerGlobal.outfit = nextOutfit;
          say("スタイル変更: スタイル " + (playerGlobal.outfit + 1), 90);
        } else {
          say("他に解放済みのスタイルがありません", 90);
        }
      } else if (game.headquartersSelection === 1) {
        // Unlock outfit (costs savings)
        const nextUnlock = playerGlobal.outfitsUnlocked.findIndex((v, i) => !v && i > 0);
        if (nextUnlock !== -1 && playerGlobal.savings >= 10) {
          playerGlobal.savings -= 10;
          playerGlobal.outfitsUnlocked[nextUnlock] = true;
          say("新スタイル解放！", 90);
        } else if (nextUnlock === -1) {
          say("全てのスタイルを解放済み", 90);
        } else {
          say("貯金が足りない（必要: 10💰）", 90);
        }
      } else {
        game.state = "topmenu"; // Back
      }
    }
    if (pressed("Escape") || pressed("Backspace")) {
      game.state = "topmenu";
    }
    return;
  }

  // Branch office menu (savings, connections)
  if (game.state === "branch") {
    if (pressed("ArrowUp") || pressed("w") || pressed("W")) {
      game.branchSelection = (game.branchSelection - 1 + 4) % 4;
    }
    if (pressed("ArrowDown") || pressed("s") || pressed("S")) {
      game.branchSelection = (game.branchSelection + 1) % 4;
    }
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      if (game.branchSelection === 0) {
        // Add to savings from stage earnings (simulated for now)
        say("貯金は各ステージクリア後に増加します", 120);
      } else if (game.branchSelection === 1) {
        // Invest savings to get starting coins
        if (playerGlobal.savings >= 5) {
          playerGlobal.savings -= 5;
          player.coins += 3;
          say("投資成功！次のステージで💰+3", 90);
        } else {
          say("貯金が足りない（必要: 5💰）", 90);
        }
      } else if (game.branchSelection === 2) {
        // Build connections
        if (playerGlobal.savings >= 8) {
          playerGlobal.savings -= 8;
          playerGlobal.networkTotal += 1;
          player.connections += 1;
          say("人脈拡大！👤+1", 90);
        } else {
          say("貯金が足りない（必要: 8💰）", 90);
        }
      } else {
        game.state = "topmenu"; // Back
      }
    }
    if (pressed("Escape") || pressed("Backspace")) {
      game.state = "topmenu";
    }
    return;
  }

  // Connection dictionary screen (人脈図鑑)
  if (game.state === "dictionary") {
    const connectionTypes = Object.keys(CONNECTION_TYPES);
    const totalPages = Math.ceil(connectionTypes.length / 4); // 4 entries per page
    
    if (pressed("ArrowLeft") || pressed("a") || pressed("A")) {
      game.dictionaryPage = (game.dictionaryPage - 1 + totalPages) % totalPages;
    }
    if (pressed("ArrowRight") || pressed("d") || pressed("D")) {
      game.dictionaryPage = (game.dictionaryPage + 1) % totalPages;
    }
    if (pressed("Escape") || pressed("Backspace") || pressed("Enter") || pressed(" ")) {
      game.state = "topmenu";
    }
    return;
  }

  // Manufacturer menu (メーカー - 服やアイテム購入)
  if (game.state === "manufacturer") {
    const totalItems = SHOP_ITEMS.length + 1; // +1 for back button
    if (pressed("ArrowUp") || pressed("w") || pressed("W")) {
      game.manufacturerSelection = (game.manufacturerSelection - 1 + totalItems) % totalItems;
      playSFX("select");
    }
    if (pressed("ArrowDown") || pressed("s") || pressed("S")) {
      game.manufacturerSelection = (game.manufacturerSelection + 1) % totalItems;
      playSFX("select");
    }
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      if (game.manufacturerSelection >= SHOP_ITEMS.length) {
        // Back button
        game.state = "topmenu";
        playSFX("confirm");
      } else {
        // Try to purchase item
        const item = SHOP_ITEMS[game.manufacturerSelection];
        if (playerGlobal.savings >= item.price) {
          if (item.type === "outfit") {
            if (!playerGlobal.outfitsUnlocked[item.unlockIndex]) {
              playerGlobal.savings -= item.price;
              playerGlobal.outfitsUnlocked[item.unlockIndex] = true;
              playSFX("negoSuccess");
              say(`${item.name}を購入！本社で着替え可能！`, 120);
            } else {
              say("すでに購入済みです", 90);
            }
          } else if (item.type === "startItem") {
            playerGlobal.savings -= item.price;
            purchasedStartItems.push(item.effect);
            playSFX("negoSuccess");
            say(`${item.name}を購入！次のステージで発動！`, 120);
          } else if (item.type === "consumable") {
            playerGlobal.savings -= item.price;
            if (item.effect === "hp") {
              extraHPPurchased = true;
            }
            playSFX("negoSuccess");
            say(`${item.name}を購入！次のステージで適用！`, 120);
          }
        } else {
          say(`貯金が足りない（必要: ${item.price}💰）`, 90);
          playSFX("negoFail");
        }
      }
    }
    if (pressed("Escape") || pressed("Backspace")) {
      game.state = "topmenu";
    }
    return;
  }

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
    // Back to top menu
    if (pressed("Escape") || pressed("Backspace")) {
      game.state = "topmenu";
    }
    return;
  }

  if (game.state === "intro") {
    // Advance intro with Enter or E or Space
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      game.introLine++;
      if (game.introLine >= game.stage.intro.length) {
        game.state = "play";
        // Show tutorial on first stage if not already shown
        if (!game.tutorialShown && game.stageIndex === 0) {
          game.showTutorial = true;
          game.tutorialStep = 0;
        }
        say("ゲームスタート！💰と👤を集めてゴールを目指せ！", 150);
      }
    }
    return;
  }

  if (game.state === "gameover") {
    // Press R to retry or Enter to return to top menu
    if (pressed("r") || pressed("R")) loadStage(game.stageIndex);
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      game.state = "topmenu";
      game.topMenuSelection = 0;
    }
    return;
  }

  // Handle tutorial overlay
  if (game.showTutorial) {
    if (pressed("Enter") || pressed(" ") || pressed("e") || pressed("E")) {
      game.tutorialStep++;
      playSFX("select");
      if (game.tutorialStep >= 5) {
        game.showTutorial = false;
        game.tutorialShown = true;
      }
    }
    if (pressed("Escape") || pressed("Backspace")) {
      game.showTutorial = false;
      game.tutorialShown = true;
    }
    return;
  }

  if (game.state === "clear") {
    // Add rewards to global savings
    const stageReward = 5 + game.stageIndex * 3; // Increasing rewards per stage
    const bonusCoins = player.coins; // Remaining coins become savings
    const bonusConnections = player.connections; // Remaining connections add to network
    playerGlobal.savings += stageReward + bonusCoins;
    playerGlobal.networkTotal += bonusConnections;
    
    // Mark stage as cleared
    playerGlobal.stagesCleared[game.stageIndex] = true;
    
    // Add career exp for clearing stage
    const stageExp = 10 + game.stageIndex * 5;
    addCareerExp(stageExp);
    
    // Increment total contracts
    playerGlobal.totalContracts++;
    
    // Return to top menu instead of auto-advancing
    game.state = "topmenu";
    game.topMenuSelection = 0;
    say(`ステージクリア！貯金+${stageReward + bonusCoins}　人脈+${bonusConnections}`, 240);
    return;
  }

  // =====================================================
  // PLAY state
  // =====================================================
  // Player control
  const left = isDown("ArrowLeft") || isDown("a") || isDown("A");
  const right = isDown("ArrowRight") || isDown("d") || isDown("D");
  const jump = pressed(" ") || pressed("ArrowUp") || pressed("w") || pressed("W");
  const down = isDown("ArrowDown") || isDown("s") || isDown("S");
  const dashHold = isDown("Shift");
  
  // Hip drop cooldown
  if (player.hipDropCD > 0) player.hipDropCD--;

  // dash (hold to dash)
  if (player.dashCD > 0) player.dashCD--;
  if (player.dashT > 0) player.dashT--;

  if (dashHold && player.dashCD === 0) {
    player.dashT = 14;
    player.dashCD = 10;
    playSFX("dash");
  }

  // スピードアップスキルの効果
  let moveSpeed = player.dashT > 0 ? 6.2 : 3.2;
  if (player.speedBoost) moveSpeed *= 1.5;

  // ヒップドロップ処理（空中で下キーを押す）
  if (down && !player.onGround && !player.hipDropping && player.hipDropCD === 0) {
    player.hipDropping = true;
    player.vy = 18; // 高速落下
    player.vx = 0; // 横移動停止
    playSFX("dash");
    say("ヒップドロップ！", 40);
  }

  // ヒップドロップ中の制御
  if (player.hipDropping) {
    player.vx = 0; // 横移動不可
    if (player.onGround) {
      // 着地時
      player.hipDropping = false;
      player.hipDropCD = 20; // クールダウン
      triggerScreenShake(6, 10);
      createParticles(player.x + player.w/2, player.y + player.h, "stomp", 12);
      
      // 着地時に真下のアイテムボックスを叩く
      const footTx1 = Math.floor((player.x + 4) / TILE);
      const footTx2 = Math.floor((player.x + player.w - 4) / TILE);
      const footTy = Math.floor((player.y + player.h + 2) / TILE);
      
      if (isItemBoxTile(tileAt(footTx1, footTy))) {
        hitItemBox(footTx1, footTy);
      }
      if (isItemBoxTile(tileAt(footTx2, footTy))) {
        hitItemBox(footTx2, footTy);
      }
    }
  } else {
    if (left && !right) { player.vx = -moveSpeed; player.face = -1; }
    else if (right && !left) { player.vx = moveSpeed; player.face = 1; }
    else player.vx = lerp(player.vx, 0, 0.4);
  }

  // Jump and Double Jump logic
  // ジャンプ力アップスキルの効果
  const jumpPower = player.jumpBoost ? -15.5 : -13.2;
  const doubleJumpPower = player.jumpBoost ? -14.0 : -12.0;
  
  if (jump) {
    if (player.onGround) {
      player.vy = jumpPower;
      player.onGround = false;
      playSFX("jump");
    } else if (player.canDoubleJump) {
      player.vy = doubleJumpPower;
      player.canDoubleJump = false;
      playSFX("doubleJump");
    }
  }

  // Reset double jump ability when landing
  if (player.onGround) {
    player.canDoubleJump = true;
  }

  // gravity
  player.vy = clamp(player.vy + GRAVITY, -999, MAX_FALL);

  // apply movement/collision
  resolveCollisions(player);

  // スキルタイマー更新
  updateSkillTimer();

  // Collect coins and connection points
  updateCollectibles();
  
  // パワーアップアイテムの更新
  updatePowerUps();

  // hazards: trust drains
  if (hazardTouch(player)) {
    player.trust = clamp(player.trust - 0.35, 0, 100);
  }

  // breakable tiles
  updateBreakablesUnderPlayer();

  // goal - requires boss to be defeated first (if stage has a boss)
  if (goalTouch(player)) {
    const hasBoss = game.stage.bossSpawn !== undefined;
    if (!hasBoss || game.bossDefeated) {
      game.state = "clear";
      playSFX("stageClear");
      say("ステージクリア！次のステージへ", 120);
    } else {
      say("ボスを倒さないと進めない！ボスを踏み付けて倒せ！", 120);
    }
  }

  // enemy updates and interactions (踏み付け攻撃)
  updateEnemies();
  
  // Update defeat effects
  updateDefeatEffects();

  // fail conditions
  if (player.y > game.mapH*TILE + 220) {
    player.hp = 0;
    die("落下：穴に落ちてしまった…");
  }
  if (player.trust <= 0) {
    die("評判が地に落ちた：ゲームオーバー。");
  }
  if (player.hp <= 0) {
    die("体力の限界：ゲームオーバー。");
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
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    
    // 倒された敵は削除
    if (e.defeated && !e.isBoss) {
      enemies.splice(i, 1);
      continue;
    }

    // Attack pattern implementation (特徴的な攻撃方法)
    const patrolLeft = e.originX - e.patrol;
    const patrolRight = e.originX + e.patrol;
    let speed = e.vx;
    
    // Update attack timer
    e.attackTimer = (e.attackTimer || 0) + 1;
    
    // Pattern-based movement
    if (e.attackPattern === "chase") {
      // Chase player if within range
      const dx = player.x - e.x;
      const dist = Math.abs(dx);
      if (dist < 200 && dist > 10) {
        e.dir = dx > 0 ? 1 : -1;
        speed = e.vx * 1.3; // Faster when chasing
      } else {
        // Normal patrol when out of range
        if (e.x < patrolLeft) e.dir = 1;
        if (e.x > patrolRight) e.dir = -1;
      }
    } else if (e.attackPattern === "jump") {
      // Jump periodically
      if (e.jumpCD !== undefined) {
        if (e.jumpCD > 0) e.jumpCD--;
        if (e.jumpCD === 0 && e.onGround) {
          e.vy = -10;
          e.jumpCD = 90; // Jump every 90 frames
        }
      }
      if (e.x < patrolLeft) e.dir = 1;
      if (e.x > patrolRight) e.dir = -1;
    } else if (e.attackPattern === "zigzag") {
      // Zigzag movement
      const zigzagOffset = Math.sin(e.attackTimer * 0.1) * 0.5;
      speed = e.vx * (1 + zigzagOffset);
      if (e.x < patrolLeft) e.dir = 1;
      if (e.x > patrolRight) e.dir = -1;
    } else {
      // Normal patrol
      if (e.x < patrolLeft) e.dir = 1;
      if (e.x > patrolRight) e.dir = -1;
    }

    // Apply movement
    e.vx = e.dir * speed * 0.85;

    // gravity for non-drones
    if (e.type !== "drone") {
      e.vy = clamp(e.vy + GRAVITY, -999, MAX_FALL);
    } else {
      e.vy = 0;
    }

    resolveCollisions(e);
    
    // Track onGround for jump pattern
    const footY = e.y + e.h + 1;
    const footTx = Math.floor((e.x + e.w/2) / TILE);
    const footTy = Math.floor(footY / TILE);
    e.onGround = isSolidTile(tileAt(footTx, footTy));

    // 敵との衝突判定
    if (e.hostile && !e.defeated && aabb(player.x, player.y, player.w, player.h, e.x, e.y, e.w, e.h)) {
      // プレイヤーが上から落下中かどうか判定（踏み付け攻撃）
      const playerBottom = player.y + player.h;
      const enemyTop = e.y;
      const playerFalling = player.vy > 0;
      const stompZone = playerBottom <= enemyTop + 15 && playerBottom >= enemyTop - 5;
      
      // ヒップドロップ中は踏み付け範囲を広げる
      const hipDropStomp = player.hipDropping && playerBottom <= enemyTop + 20;
      
      if ((playerFalling && stompZone && !e.unstompable) || (hipDropStomp && !e.unstompable)) {
        // 踏み付け成功！
        const stomped = stompEnemy(e);
        if (stomped) {
          // プレイヤーを上にバウンド
          player.vy = player.hipDropping ? -12 : -10;
          player.canDoubleJump = true;
          player.hipDropping = false;
        }
      } else {
        // 横から当たった場合はダメージ
        playerTakeDamage(e);
      }
    }
  }
}

function updateCollectibles() {
  const collectW = 24;
  const collectH = 24;
  
  for (let i = collectibles.length - 1; i >= 0; i--) {
    const c = collectibles[i];
    if (c.collected) continue;
    
    // アイテムボックスから出たアイテムは物理挙動
    if (c.fromBox && c.vy !== undefined) {
      c.vy += 0.3;
      c.y += c.vy;
      
      // 地面で止まる
      const ty = Math.floor((c.y + collectH) / TILE);
      const tx = Math.floor((c.x + collectW/2) / TILE);
      if (tileAt(tx, ty) === 1 || tileAt(tx, ty) === 4) {
        c.y = ty * TILE - collectH;
        c.vy = 0;
      }
      
      // 画面外に落ちたら削除
      if (c.y > game.mapH * TILE + 100) {
        collectibles.splice(i, 1);
        continue;
      }
    }
    
    // アイテム吸引スキルの効果
    if (player.magnetActive) {
      const dx = (player.x + player.w/2) - (c.x + collectW/2);
      const dy = (player.y + player.h/2) - (c.y + collectH/2);
      const dist = Math.hypot(dx, dy);
      
      if (dist < 150 && dist > 5) {
        // 吸引
        c.x += dx / dist * 4;
        c.y += dy / dist * 4;
      }
    }
    
    // Check collision with player
    if (aabb(player.x, player.y, player.w, player.h, c.x, c.y, collectW, collectH)) {
      c.collected = true;
      if (c.type === "coin") {
        player.coins++;
        playSFX("coin");
        createParticles(c.x + collectW/2, c.y + collectH/2, "coin", 8);
        say("💰 コイン+1！", 50);
      } else if (c.type === "connection") {
        player.connections++;
        playSFX("connection");
        createParticles(c.x + collectW/2, c.y + collectH/2, "connection", 10);
        say("👤 人脈+1！", 50);
      }
    }
  }
}

function die(reason) {
  game.state = "gameover";
  playSFX("gameOver");
  say(reason + "　Rで再開。", 999999);
}
