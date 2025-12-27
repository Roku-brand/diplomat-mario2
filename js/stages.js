/**
 * Stage data and map generators
 */

function rect(map, x, y, w, v) {
  for (let i=0;i<w;i++) map[y][x+i]=v;
}

function makeStageMap_Desert() {
  // 0 empty, 1 solid ground, 2 hazard, 3 goal
  // height: 15 tiles; width: 110 tiles
  const h = 15, w = 110;
  const m = Array.from({length:h}, () => Array(w).fill(0));

  // baseline ground with pits
  for (let x=0; x<w; x++) {
    // pits (落とし穴)
    const isPit =
      (x>=14 && x<=17) ||
      (x>=31 && x<=33) ||
      (x>=49 && x<=52) ||
      (x>=70 && x<=72) ||
      (x>=97 && x<=99);
    if (!isPit) m[12][x] = 1;
    // some deeper support layer
    if (!isPit) m[13][x] = 1;
    if (!isPit) m[14][x] = 1;
  }

  // platforms / dunes
  rect(m, 10, 8, 6, 1); // small platform
  rect(m, 26, 9, 5, 1);
  rect(m, 40, 8, 7, 1);
  rect(m, 58, 7, 6, 1);
  rect(m, 66, 9, 4, 1);
  rect(m, 82, 8, 6, 1);
  rect(m, 90, 7, 5, 1);

  // hazards: "流砂" = hazard strip (touch = trust drain)
  // represent as 2 on ground surface
  for (let x=34; x<=38; x++) m[11][x] = 2;
  for (let x=73; x<=78; x++) m[11][x] = 2;

  // goal
  m[11][107] = 3;
  m[10][107] = 3;
  return m;
}

function makeStageMap_Jungle() {
  const h = 15, w = 95;
  const m = Array.from({length:h}, () => Array(w).fill(0));

  // ground with irregular pits + "poison swamp" hazards
  for (let x=0; x<w; x++) {
    const isPit =
      (x>=10 && x<=12) ||
      (x>=24 && x<=26) ||
      (x>=45 && x<=46) ||
      (x>=60 && x<=63) ||
      (x>=84 && x<=85);
    if (!isPit) {
      m[12][x] = 1; m[13][x] = 1; m[14][x] = 1;
    }
  }

  // vines / platforms
  rect(m, 16, 8, 6, 1);
  rect(m, 32, 7, 7, 1);
  rect(m, 48, 8, 6, 1);
  rect(m, 67, 7, 6, 1);
  rect(m, 78, 8, 5, 1);

  // "朽ち床" (breakable): encode as 4 (we handle separately)
  for (let x=34; x<=37; x++) m[6][x] = 4;

  // poison swamp zones
  for (let x=27; x<=31; x++) m[11][x] = 2;
  for (let x=52; x<=56; x++) m[11][x] = 2;

  // goal
  m[11][92] = 3; m[10][92] = 3;
  return m;
}

function makeStageMap_City() {
  const h = 15, w = 90;
  const m = Array.from({length:h}, () => Array(w).fill(0));

  // ground with pits (construction gaps)
  for (let x=0; x<w; x++) {
    const isPit =
      (x>=12 && x<=13) ||
      (x>=29 && x<=31) ||
      (x>=50 && x<=51) ||
      (x>=66 && x<=68);
    if (!isPit) { m[12][x]=1; m[13][x]=1; m[14][x]=1; }
  }

  // elevated sidewalks / rooftops
  rect(m, 18, 9, 8, 1);
  rect(m, 36, 8, 7, 1);
  rect(m, 55, 9, 8, 1);
  rect(m, 73, 8, 6, 1);

  // "監視ゾーン" hazards (spotlight) - stepping triggers trust drain / alert
  for (let x=41; x<=46; x++) m[11][x] = 2;

  // goal: gate
  m[11][87] = 3; m[10][87] = 3;
  return m;
}

const STAGES = [
  {
    id: "desert",
    title: "砂漠：境界線の取引",
    palette: { sky:"#1a2330", far:"#1b2b3c", mid:"#2b3a47", ground:"#9a7b4f", accent:"#d7c08c" },
    intro: [
      "中立監察団の交渉官・相良ユウ。",
      "資源輸送路で外交官襲撃が発生。現場は民兵と企業警備が緊張状態。",
      "あなたの任務は『銃を抜かずに通過し、報告書を首都へ届けること』。"
    ],
    // Tiles: 0 empty, 1 solid, 2 hazard (spike/poison), 3 goal
    map: makeStageMap_Desert(),
    enemySpawns: [
      { x: 22*TILE, y: 8*TILE, type:"militia" },
      { x: 44*TILE, y: 8*TILE, type:"militia" },
      { x: 63*TILE, y: 7*TILE, type:"caravan" }, // negotiable "transport leader"
      { x: 88*TILE, y: 8*TILE, type:"militia" },
    ],
    npcNotes: [
      "民兵は『誇りと恐れ』で動く。正論だけでは折れない。",
      "輸送隊は『体面』と『安全』を重視。交渉が通れば全体が沈静化する。"
    ],
  },
  {
    id: "jungle",
    title: "熱帯雨林：見えない戦争",
    palette: { sky:"#0d1b16", far:"#0f261c", mid:"#173528", ground:"#2f5a43", accent:"#9fd3b3" },
    intro: [
      "砂漠の輸送路の背後で、密猟と武器取引がつながっていた。",
      "次の現場は熱帯雨林。視界が悪く、敵味方の境界が曖昧。",
      "交渉は『正しさ』ではなく『出口の設計』だ。"
    ],
    map: makeStageMap_Jungle(),
    enemySpawns: [
      { x: 18*TILE, y: 7*TILE, type:"poacher" },
      { x: 37*TILE, y: 6*TILE, type:"poacher" },
      { x: 55*TILE, y: 7*TILE, type:"guerrilla" }, // hard negotiable
      { x: 73*TILE, y: 7*TILE, type:"poacher" },
    ],
    npcNotes: [
      "密猟者は金で動く。『逮捕』より『撤退条件』が効く。",
      "ゲリラは理念で動く。交渉には『損失を小さく見せる』設計が必要。"
    ],
  },
  {
    id: "city",
    title: "都市：世論と監視",
    palette: { sky:"#10131a", far:"#131722", mid:"#1a2030", ground:"#313847", accent:"#c9d3ff" },
    intro: [
      "襲撃事件は『外』の敵だけではない。首都の政治が火種を育てていた。",
      "都市では監視と世論が武器になる。正義はときに暴力より鋭い。",
      "最後の門は検問。あなたは『正統性』を提示できるか。"
    ],
    map: makeStageMap_City(),
    enemySpawns: [
      { x: 20*TILE, y: 8*TILE, type:"riot" },
      { x: 40*TILE, y: 8*TILE, type:"security" }, // very hard negotiable
      { x: 58*TILE, y: 8*TILE, type:"drone" },    // non-negotiable
      { x: 76*TILE, y: 8*TILE, type:"security" },
    ],
    npcNotes: [
      "治安部隊は『命令』で動く。交渉は『面子』『手続き』の提示が必要。",
      "ドローンは交渉不可。ルート設計（回避）が答えになる。"
    ],
  }
];
