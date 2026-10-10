// PIXELPAL — GAME LOGIC 🐾

const $ = (id) => document.getElementById(id);

const defaultState = {
  name: "Mochi",
  hunger: 80,
  happiness: 80,
  energy: 80,
  coins: 30,
  xp: 0,
  level: 1,
  accessory: "",
  owned: ["none"],
  lastVisit: Date.now(),
  gamesPlayed: 0
};

let state;

try {
  const saved = JSON.parse(localStorage.getItem("pixelpal-save"));
  state = saved && typeof saved === "object"
    ? { ...defaultState, ...saved }
    : { ...defaultState };

  // Protect against invalid saved data.
  ["hunger", "happiness", "energy"].forEach(key => {
    state[key] = Math.max(0, Math.min(100, Number(state[key]) || 0));
  });

  state.coins = Math.max(0, Number(state.coins) || 0);
  state.xp = Math.max(0, Number(state.xp) || 0);
  state.level = Math.max(1, Number(state.level) || 1);
  if (!Array.isArray(state.owned)) state.owned = ["none"];
} catch {
  state = { ...defaultState };
}

let toastTimeout;
let gameInterval = null;
let gameRunning = false;
let caught = 0;
let timeLeft = 15;

const costumes = [
  { id: "none", icon: "🐾", name: "Natural", cost: 0 },
  { id: "crown", icon: "👑", name: "Royal", cost: 20 },
  { id: "glasses", icon: "🤓", name: "Nerdy", cost: 25 },
  { id: "flower", icon: "🌸", name: "Floral", cost: 30 },
  { id: "hat", icon: "🎩", name: "Fancy", cost: 35 },
  { id: "halo", icon: "😇", name: "Angel", cost: 40 },
  { id: "devil", icon: "😈", name: "Mischief", cost: 45 },
  { id: "sparkles", icon: "✨", name: "Magic", cost: 50 }
];

const petForms = [
  { level: 1, emoji: "🐣", name: "Baby Pal", title: "A tiny friend" },
  { level: 3, emoji: "🐥", name: "Sunny Pal", title: "Growing up nicely!" },
  { level: 5, emoji: "🐲", name: "Dragon Pal", title: "A little magical!" },
  { level: 8, emoji: "🐉", name: "Mystic Pal", title: "Legendary creature!" }
];

const funnyMessages = [
  "Did you bring snacks? 👀",
  "I have an important announcement: boop!",
  "You're my favorite human. Don't tell anyone.",
  "I was totally not eating your pixels...",
  "Can we have a tiny adventure?",
  "I dreamed I was a giant marshmallow.",
  "Boop me again! I dare you.",
  "I am 90% fluff and 10% chaos.",
  "Do I look fabulous today? ✨"
];

function save() {
  state.lastVisit = Date.now();

  try {
    localStorage.setItem("pixelpal-save", JSON.stringify(state));
  } catch {
    // The game still works if browser storage is unavailable.
  }
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function currentForm() {
  return [...petForms].reverse().find(form => state.level >= form.level)
    || petForms[0];
}

function currentMood() {
  if (state.hunger < 25) return ["Hungry", "Feed me, please! 🍓"];
  if (state.energy < 20) return ["Sleepy", "Five more minutes... 😴"];
  if (state.happiness < 25) return ["Lonely", "Let's spend time together? 🥺"];
  if (state.happiness > 75 && state.energy > 50) {
    return ["Happy", "Life is better with you! 💗"];
  }
  if (state.energy < 45) return ["Tired", "I'm getting sleepy..."];
  if (state.happiness > 50) return ["Playful", "Hehe, let's do something! ✨"];
  return ["Chill", "Just vibing today. ☁️"];
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2300);
}

function speak(message) {
  $("speech").textContent = message;
}

function animatePet() {
  const pet = $("pet");
  pet.classList.remove("excited");
  void pet.offsetWidth;
  pet.classList.add("excited");

  setTimeout(() => pet.classList.remove("excited"), 700);
}

function addXP(amount) {
  state.xp += amount;

  // Each new level requires more experience.
  while (state.xp >= state.level * 100) {
    state.xp -= state.level * 100;
    state.level++;

    const form = currentForm();
    showToast(`LEVEL UP! You're now level ${state.level}! 🎉`);
    speak(`New level unlocked! I'm ${form.name}!`);

    if (petForms.some(f => f.level === state.level)) {
      showToast(`EVOLUTION! Meet your ${form.name}! 🐉`);
      speak(`Surprise! I've evolved into ${form.name}!`);
    }
  }
}

function renderWardrobe() {
  const wardrobe = $("wardrobe");
  wardrobe.innerHTML = "";

  costumes.forEach(item => {
    const owned = state.owned.includes(item.id);
    const selected = state.accessory === item.id;
    const button = document.createElement("button");

    button.className = "costume" + (selected ? " selected" : "");
    button.innerHTML = `
      <span class="icon">${item.icon}</span>
      ${item.name}<br>
      <span>${owned ? (selected ? "Wearing ✓" : "Owned") : "🪙 " + item.cost}</span>
    `;

    button.addEventListener("click", () => {
      if (owned) {
        state.accessory = item.id;
        speak(item.id === "none"
          ? "Back to my natural look!"
          : "Look at my new style! ✨");
        save();
        render();
        return;
      }

      if (state.coins < item.cost) {
        showToast(`You need ${item.cost - state.coins} more coins! 🪙`);
        return;
      }

      state.coins -= item.cost;
      state.owned.push(item.id);
      state.accessory = item.id;

      speak("A new outfit! Do I look cute? 🥹");
      showToast(`${item.name} unlocked! 🎀`);
      animatePet();
      save();
      render();
    });

    wardrobe.appendChild(button);
  });
}

function render() {
  const form = currentForm();
  const [mood, message] = currentMood();

  $("coins").textContent = state.coins;
  $("level").textContent = `LEVEL ${state.level}`;
  $("stage").textContent = form.name.toUpperCase();
  $("petName").textContent = state.name;
  $("mood").textContent = `${mood} — ${message}`;

  $("petEmoji").textContent = form.emoji;

  const accessory = costumes.find(c => c.id === state.accessory);
  $("accessory").textContent =
    accessory && accessory.id !== "none" ? accessory.icon : "";

  $("hungerText").textContent = `${state.hunger}%`;
  $("happyText").textContent = `${state.happiness}%`;
  $("energyText").textContent = `${state.energy}%`;

  $("hungerBar").style.width = `${state.hunger}%`;
  $("happyBar").style.width = `${state.happiness}%`;
  $("energyBar").style.width = `${state.energy}%`;

  const needed = state.level * 100;
  $("xpText").textContent = `${state.xp} / ${needed} XP`;
  $("xpBar").style.width = `${Math.min(100, state.xp / needed * 100)}%`;

  renderWardrobe();
}

// Pet care actions

$("feedBtn").addEventListener("click", () => {
  if (state.hunger >= 100) {
    speak("I'm full! Save me some room for later. 🍓");
    showToast("Mochi is already full!");
    return;
  }

  state.hunger = clamp(state.hunger + 25);
  state.happiness = clamp(state.happiness + 5);
  state.coins += 2;
  addXP(10);

  speak("YUM! My favorite snack! 🍓");
  animatePet();
  showToast("+2 coins · +10 XP");
  save();
  render();
});

$("playBtn").addEventListener("click", () => {
  if (state.energy < 15) {
    speak("I'm too tired to play! Let me rest. 😴");
    showToast("Mochi needs more energy.");
    return;
  }

  state.happiness = clamp(state.happiness + 20);
  state.energy = clamp(state.energy - 15);
  state.hunger = clamp(state.hunger - 8);
  state.coins += 3;
  addXP(15);

  speak("WHEEEE! BEST DAY EVER! 🎾");
  animatePet();
  showToast("+3 coins · +15 XP");
  save();
  render();
});

$("petBtn").addEventListener("click", () => {
  state.happiness = clamp(state.happiness + 12);
  state.energy = clamp(state.energy + 3);
  addXP(5);

  const message = Math.random() < 0.3
    ? funnyMessages[Math.floor(Math.random() * funnyMessages.length)]
    : "Purrrr... I like you a lot! 💗";

  speak(message);
  animatePet();
  save();
  render();
});

$("sleepBtn").addEventListener("click", () => {
  if (state.energy >= 100) {
    speak("I'm wide awake already! Let's have fun! ⚡");
    showToast("Energy is already full!");
    return;
  }

  state.energy = clamp(state.energy + 35);
  state.hunger = clamp(state.hunger - 5);
  addXP(5);

  speak("Zzz... dreaming of giant strawberries. 🌙");
  showToast("Mochi had a refreshing nap!");
  save();
  render();
});

// Click the pet itself for a surprise.

$("pet").addEventListener("click", () => {
  const messages = [
    "BOOP! Got your nose! 👉",
    "Hehe, that tickles!",
    "Head pats accepted. 💗",
    "I shall now perform my happy dance!",
    "You're pretty cool, you know that?",
    "Secret mission: find more snacks."
  ];

  state.happiness = clamp(state.happiness + 3);
  speak(messages[Math.floor(Math.random() * messages.length)]);
  animatePet();
  save();
  render();
});

// Mini-game: catch five stars in 15 seconds.

function moveTarget() {
  const area = $("playArea");
  const target = $("target");

  const maxX = Math.max(0, area.clientWidth - 48);
  const maxY = Math.max(0, area.clientHeight - 48);

  target.style.left = `${Math.random() * maxX}px`;
  target.style.top = `${Math.random() * maxY}px`;
}

function endGame(won) {
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = null;
  gameRunning = false;

  $("target").style.display = "none";
  $("startGame").textContent = "Play again!";

  if (won) {
    state.coins += 15;
    state.happiness = clamp(state.happiness + 10);
    state.energy = clamp(state.energy - 10);
    state.gamesPlayed++;
    addXP(20);

    speak("YOU DID IT! You're a star catcher! ⭐");
    showToast("You won! +15 coins and +20 XP!");
  } else {
    speak("Almost! Let's try again together. 💗");
    showToast("Time's up! Give it another try.");
  }

  save();
  render();
}

function startGame() {
  if (gameRunning) return;

  if (state.energy < 10) {
    showToast("Mochi needs more energy to play!");
    return;
  }

  gameRunning = true;
  caught = 0;
  timeLeft = 15;

  $("score").textContent = "Caught: 0 / 5";
  $("timer").textContent = "⏱ 15s";
  $("gameInfo").textContent = "Catch 5 stars before time runs out!";
  $("startGame").textContent = "Game in progress...";
  $("startGame").disabled = true;
  $("target").style.display = "block";

  moveTarget();

  gameInterval = setInterval(() => {
    timeLeft--;
    $("timer").textContent = `⏱ ${timeLeft}s`;

    if (timeLeft <= 0) endGame(false);
  }, 1000);
}

$("target").addEventListener("click", () => {
  if (!gameRunning) return;

  caught++;
  $("score").textContent = `Caught: ${caught} / 5`;

  if (caught >= 5) {
    endGame(true);
  } else {
    moveTarget();
  }
});

$("gameBtn").addEventListener("click", () => {
  $("miniGame").classList.remove("hidden");
  $("miniGame").scrollIntoView({ behavior: "smooth", block: "nearest" });
});

$("closeGame").addEventListener("click", () => {
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = null;
  gameRunning = false;

  $("target").style.display = "none";
  $("startGame").disabled = false;
  $("startGame").textContent = "Start playing!";
  $("miniGame").classList.add("hidden");
});

$("startGame").addEventListener("click", startGame);

// A gentle passage of time while the game is closed or open.
// No need for constant network access.

const elapsedMinutes = Math.max(
  0,
  Math.min(720, (Date.now() - Number(state.lastVisit || Date.now())) / 60000)
);

state.hunger = clamp(state.hunger - Math.floor(elapsedMinutes * 0.3));
state.happiness = clamp(state.happiness - Math.floor(elapsedMinutes * 0.15));
state.energy = clamp(state.energy + Math.floor(elapsedMinutes * 0.25));

setInterval(() => {
  state.hunger = clamp(state.hunger - 1);
  save();
  render();
}, 60000);

// Reset the game.

$("resetBtn").addEventListener("click", () => {
  const confirmed = confirm(
    "Start a new life for Mochi? Your current coins, levels and outfits will be lost."
  );

  if (!confirmed) return;

  if (gameInterval) clearInterval(gameInterval);
  gameInterval = null;
  gameRunning = false;

  state = { ...defaultState, lastVisit: Date.now(), owned: ["none"] };

  $("startGame").disabled = false;
  $("startGame").textContent = "Start playing!";
  $("miniGame").classList.add("hidden");

  speak("Hi! I'm Mochi. Let's start our adventure! 🐣");
  save();
  render();
});

// Welcome!

render();
save();

setTimeout(() => {
  speak("Psst... click me! I have secrets. 👀");
}, 2500);
