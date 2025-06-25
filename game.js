const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const miniCanvas = document.getElementById("mini");
const miniCtx = miniCanvas.getContext("2d");

const tileSize = 32;
const miniTileSize = 4;
const mapWidth = 20;
const mapHeight = 15;

let player = {
  x: 0,
  y: 0,
  hp: 100,
  mana: 50,
  xp: 0,
  gold: 0,
  level: 1,
  anim: 0,
  maxHp: 100,
  maxMana: 50
};

const blockedTiles = [2];

const tileset = new Image();
tileset.src = "assets/tileset.png";

const playerSprite = new Image();
playerSprite.src = "assets/player.png";

let map = [];

fetch("map.json")
  .then(res => res.json())
  .then(data => {
    map = data.map;
    if (data.spawn && !localStorage.getItem("playerData")) {
      player.x = data.spawn.x;
      player.y = data.spawn.y;
    }
    carregar();
    renderInventory();
    requestAnimationFrame(draw);
  });

let inventory = Array.from({ length: 100 }, () => null);
let currentPage = 0;

function renderInventory() {
  const grid = document.getElementById("inv-grid");
  const invPage = document.getElementById("inv-page");
  grid.innerHTML = "";
  invPage.textContent = currentPage + 1;

  const start = currentPage * 25;
  const end = start + 25;
  const visibleItems = inventory.slice(start, end);

  visibleItems.forEach(item => {
    const slot = document.createElement("div");
    slot.className = "slot";
    if (item) {
      slot.textContent = item.name;
      slot.setAttribute("data-qty", item.qty);
    } else {
      slot.setAttribute("data-qty", "");
    }
    grid.appendChild(slot);
  });
}

function mudarPagina(dir) {
  const totalPages = Math.ceil(inventory.length / 25);
  currentPage += dir;
  if (currentPage < 0) currentPage = 0;
  if (currentPage >= totalPages) currentPage = totalPages - 1;
  renderInventory();
}

function xpNecessario(nivel) {
  return 100 + (nivel - 1) * 150;
}

function ganharXP(qtd) {
  player.xp += qtd;
  let xpTotal = xpNecessario(player.level);
  if (player.xp >= xpTotal) {
    player.xp -= xpTotal;
    player.level++;
    player.maxHp += 10;
    player.maxMana += 5;
    player.hp = player.maxHp;
    player.mana = player.maxMana;
    alert(`🎉 Subiu para o nível ${player.level}! (+10 HP, +5 Mana)`);
  }
}

function mover(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (nx < 0 || ny < 0 || nx >= mapWidth || ny >= mapHeight) return;
  if (blockedTiles.includes(map[ny][nx])) return;

  player.x = nx;
  player.y = ny;
  player.anim = (player.anim + 1) % 2;

  if (Math.random() < 0.7) {
    const xpGanho = Math.floor(5 + Math.random() * 10);
    ganharXP(xpGanho);
  }

  if (Math.random() < 0.3) player.gold += 1;

  salvar();
}

function atualizarHUD() {
  document.getElementById("hp").textContent = player.hp;
  document.getElementById("mana").textContent = player.mana;
  document.getElementById("level").textContent = player.level;
  document.getElementById("gold").textContent = player.gold;

  const xpAtual = player.xp;
  const xpMax = xpNecessario(player.level);
  document.getElementById("xp").textContent = `${xpAtual} / ${xpMax}`;

  document.getElementById("xp-bar").style.width = `${(xpAtual / xpMax) * 100}%`;
  document.getElementById("hp-bar").style.width = `${(player.hp / player.maxHp) * 100}%`;
  document.getElementById("mana-bar").style.width = `${(player.mana / player.maxMana) * 100}%`;
}

function salvar() {
  localStorage.setItem("playerData", JSON.stringify(player));
}

function carregar() {
  const data = localStorage.getItem("playerData");
  if (data) {
    const salvo = JSON.parse(data);
    player = {
      ...player,
      ...salvo
    };

    player.maxHp = 100 + (player.level - 1) * 10;
    player.maxMana = 100 + (player.level - 1) * 5;

    if (player.hp > player.maxHp) player.hp = player.maxHp;
    if (player.mana > player.maxMana) player.mana = player.maxMana;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      ctx.drawImage(
        tileset,
        map[y][x] * tileSize, 0, tileSize, tileSize,
        x * tileSize, y * tileSize, tileSize, tileSize
      );
    }
  }

  ctx.drawImage(
    playerSprite,
    0, 0, 32, 32,
    player.x * tileSize, player.y * tileSize, tileSize, tileSize
  );

  atualizarHUD();
  drawMiniMap();
  requestAnimationFrame(draw);
}

function drawMiniMap() {
  miniCtx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);

  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const tile = map[y][x];
      miniCtx.fillStyle = blockedTiles.includes(tile) ? "#4444aa" : "#66cc44";
      miniCtx.fillRect(x * miniTileSize, y * miniTileSize, miniTileSize, miniTileSize);
    }
  }

  miniCtx.fillStyle = "red";
  miniCtx.fillRect(player.x * miniTileSize, player.y * miniTileSize, miniTileSize, miniTileSize);

  miniCtx.fillStyle = "#fff";
  miniCtx.font = "10px Arial";
  miniCtx.textAlign = "center";

  miniCtx.fillText("N", miniCanvas.width / 2, 8);
  miniCtx.fillText("S", miniCanvas.width / 2, miniCanvas.height - 2);
  miniCtx.fillText("O", 6, miniCanvas.height / 2 + 3);
  miniCtx.fillText("L", miniCanvas.width - 6, miniCanvas.height / 2 + 3);
}

renderInventory();

function resetar() {
  localStorage.clear();
  alert("Jogo resetado! Começando do zero.");
  location.reload();
}