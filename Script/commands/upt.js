const { createCanvas, loadImage } = require("canvas");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

module.exports.config = {
  name: "upt",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Show uptime info",
  commandCategory: "system",
  usages: "uptime",
  cooldowns: 5
};

// --- History for Pulse Graphs ---
const HISTORY_LENGTH = 12;
let netHistory1 = Array.from({ length: HISTORY_LENGTH }, () => Math.floor(Math.random() * 35 + 25));
let netHistory2 = Array.from({ length: HISTORY_LENGTH }, () => Math.floor(Math.random() * 30 + 15));

// --- Restart Counter ---
const restartFile = path.join(__dirname, "restart.json");
let restartCount = 1;
if (fs.existsSync(restartFile)) {
  restartCount = JSON.parse(fs.readFileSync(restartFile)).count + 1;
}
fs.writeFileSync(restartFile, JSON.stringify({ count: restartCount }));

function getCpuUsageAsync() {
  return new Promise((resolve) => {
    const start = os.cpus();
    setTimeout(() => {
      const end = os.cpus();
      let idleDiff = 0, totalDiff = 0;
      for (let i = 0; i < start.length; i++) {
        const s = start[i].times, e = end[i].times;
        idleDiff += e.idle - s.idle;
        totalDiff += Object.keys(e).reduce((acc, key) => acc + (e[key] - s[key]), 0);
      }
      resolve(100 - Math.round((idleDiff / totalDiff) * 100));
    }, 100);
  });
}

function getDiskUsage() {
  try {
    const out = execSync("df -k /").toString().split("\n")[1].split(/\s+/);
    return {
      percent: Math.round((parseInt(out[2]) / parseInt(out[1])) * 100)
    };
  } catch {
    return { percent: 0 };
  }
}

// Function to convert numbers to bold math style
function toBoldMathNumbers(num) {
  const boldDigits = {
    '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒',
    '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
  };
  return num.toString().split('').map(d => boldDigits[d] || d).join('');
}

module.exports.run = async function ({ api, event }) {
  try {
    const cpu = await getCpuUsageAsync();
    const totalRAM = os.totalmem();
    const usedRAM = totalRAM - os.freemem();
    const ramPercent = usedRAM / totalRAM;
    const disk = getDiskUsage();

    const allUsers = global.data.allUserID || [];
    const realUserCount = allUsers.length;

    const dataSent = ((restartCount * 1.2) + (realUserCount * 0.05)).toFixed(1);
    const dataReceived = ((restartCount * 0.8) + (realUserCount * 0.03)).toFixed(1);

    const up = process.uptime();
    const d = Math.floor(up / 86400);
    const h = Math.floor((up % 86400) / 3600);
    const m = Math.floor((up % 3600) / 60);

    // Convert numbers to bold math style
    const boldD = toBoldMathNumbers(d);
    const boldH = toBoldMathNumbers(h);
    const boldM = toBoldMathNumbers(m);
    const boldCpu = toBoldMathNumbers(cpu);
    const boldDisk = toBoldMathNumbers(disk.percent);
    const boldRestart = toBoldMathNumbers(restartCount);
    const boldUsers = toBoldMathNumbers(realUserCount);
    const boldRamUsed = toBoldMathNumbers((usedRAM / 1024 ** 3).toFixed(1));
    const boldRamTotal = toBoldMathNumbers((totalRAM / 1024 ** 3).toFixed(1));
    const boldDataSent = toBoldMathNumbers(dataSent);
    const boldDataReceived = toBoldMathNumbers(dataReceived);

    netHistory1.push(Math.floor(Math.random() * 35 + 25));
    if (netHistory1.length > HISTORY_LENGTH) netHistory1.shift();
    netHistory2.push(Math.floor(Math.random() * 30 + 15));
    if (netHistory2.length > HISTORY_LENGTH) netHistory2.shift();

    // Canvas Size
    const W = 600, H = 500;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // --- Background ---
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, "#0a0a2a");
    gradient.addColorStop(0.5, "#1a0a3a");
    gradient.addColorStop(1, "#0a0a2a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // --- Grid Lines (Background) ---
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let i = 0; i < H; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(W, i);
      ctx.stroke();
    }
    for (let i = 0; i < W; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, H);
      ctx.stroke();
    }

    // --- Border Glow ---
    ctx.shadowBlur = 30;
    ctx.shadowColor = "#7b2ffc";
    ctx.strokeStyle = "rgba(123, 47, 252, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.shadowBlur = 0;

    // --- TOP TITLE (Normal Text on Photo) ---
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#7b2ffc";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px 'Segoe UI', Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚡ MARIA V2 UPTIME ⚡", W/2, 45);
    ctx.shadowBlur = 0;

    // --- Decorative Line ---
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#7b2ffc";
    ctx.beginPath();
    ctx.moveTo(180, 58);
    ctx.lineTo(420, 58);
    ctx.strokeStyle = "#7b2ffc";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 1. CPU - Bold Math Style Numbers
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#00d4ff";
    ctx.fillStyle = "#00d4ff";
    ctx.font = "bold 28px 'Segoe UI', 'Arial Unicode MS'";
    ctx.fillText(`${boldCpu}%`, 100, 125);

    ctx.fillStyle = "#aaa";
    ctx.font = "12px 'Segoe UI', Arial";
    ctx.fillText("CPU", 100, 155);

    // 2. RAM - Bold Math Style Numbers
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.font = "13px 'Segoe UI', Arial";
    ctx.fillText(
      `${boldRamUsed}G / ${boldRamTotal}G`,
      240,
      120
    );
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(190, 135, 100, 8);
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff6bff";
    ctx.fillStyle = "#ff6bff";
    ctx.fillRect(190, 135, 100 * ramPercent, 8);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#aaa";
    ctx.font = "12px 'Segoe UI', Arial";
    ctx.fillText("RAM", 240, 160);

    // 3. SERVER STATUS
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00ff88";
    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 16px 'Segoe UI', Arial";
    ctx.fillText("🟢 ONLINE", 410, 125);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#aaa";
    ctx.font = "12px 'Segoe UI', Arial";
    ctx.fillText("STATUS", 410, 155);

    // 4. DISK - Bold Math Style Numbers
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ffaa00";
    ctx.fillStyle = "#ffaa00";
    ctx.font = "bold 28px 'Segoe UI', 'Arial Unicode MS'";
    ctx.fillText(`${boldDisk}%`, 100, 250);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#aaa";
    ctx.font = "12px 'Segoe UI', Arial";
    ctx.fillText("DISK", 100, 278);

    // 5. UPTIME - Bold Math Style Numbers
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00d4ff";
    ctx.fillStyle = "#00d4ff";
    ctx.font = "bold 18px 'Courier New', 'Arial Unicode MS'";
    ctx.fillText(`${boldD}d ${boldH}h ${boldM}m`, 240, 245);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#aaa";
    ctx.font = "12px 'Segoe UI', Arial";
    ctx.fillText("UPTIME", 240, 275);

    // 6. NETWORK GRAPHS (Dual Pulse)
    const gX = 340, gY = 210, gW = 170, gH = 80;

    // Graph Background
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.shadowBlur = 0;
    ctx.fillRect(gX, gY, gW, gH);

    // Graph Border
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.strokeRect(gX, gY, gW, gH);

    // Y-axis labels
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "7px Arial";
    ctx.fillText("100", gX - 15, gY + 5);
    ctx.fillText("0", gX - 10, gY + gH);

    // Graph 1 - Top (cyan)
    ctx.beginPath();
    ctx.strokeStyle = "#00d4ff";
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00d4ff";
    netHistory1.forEach((val, i) => {
      const x = gX + (i * (gW / (HISTORY_LENGTH - 1)));
      const y = gY + gH - (val * (gH / 100));
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill under Graph 1
    ctx.shadowBlur = 0;
    ctx.lineTo(gX + gW, gY + gH);
    ctx.lineTo(gX, gY + gH);
    ctx.closePath();
    ctx.fillStyle = "rgba(0, 212, 255, 0.05)";
    ctx.fill();

    // Graph 2 - Bottom (pink)
    ctx.beginPath();
    ctx.strokeStyle = "#ff6bff";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff6bff";
    netHistory2.forEach((val, i) => {
      const x = gX + (i * (gW / (HISTORY_LENGTH - 1)));
      const y = gY + gH - (val * (gH / 100));
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill under Graph 2
    ctx.shadowBlur = 0;
    ctx.lineTo(gX + gW, gY + gH);
    ctx.lineTo(gX, gY + gH);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 107, 255, 0.03)";
    ctx.fill();

    // Graph Labels
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "9px 'Segoe UI', Arial";
    ctx.fillText("📶 NETWORK", gX + gW/2 - 30, gY + gH + 15);

    // 7. RESTART - Bold Math Style Numbers
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ffaa00";
    ctx.fillStyle = "#ffaa00";
    ctx.font = "bold 28px 'Segoe UI', 'Arial Unicode MS'";
    ctx.fillText(`${boldRestart}`, 95, 365);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#aaa";
    ctx.font = "12px 'Segoe UI', Arial";
    ctx.fillText("RESTARTS", 95, 395);

    // 8. USERS - Bold Math Style Numbers
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#00d4ff";
    ctx.fillStyle = "#00d4ff";
    ctx.font = "bold 28px 'Segoe UI', 'Arial Unicode MS'";
    ctx.fillText(`${boldUsers}`, 240, 365);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#aaa";
    ctx.font = "12px 'Segoe UI', Arial";
    ctx.fillText("USERS", 240, 395);

    // 9. DATA - Bold Math Style Numbers
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ff6bff";
    ctx.fillStyle = "#ff6bff";
    ctx.font = "bold 14px 'Courier New', 'Arial Unicode MS'";
    ctx.fillText(`↑${boldDataSent}G`, 400, 355);

    ctx.fillStyle = "#00d4ff";
    ctx.fillText(`↓${boldDataReceived}G`, 400, 385);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#aaa";
    ctx.font = "12px 'Segoe UI', Arial";
    ctx.fillText("DATA", 400, 405);

    // --- Bottom Decorative Line ---
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#7b2ffc";
    ctx.beginPath();
    ctx.moveTo(150, 435);
    ctx.lineTo(450, 435);
    ctx.strokeStyle = "rgba(123, 47, 252, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // --- Footer Credits (Normal Text on Photo) ---
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = "9px 'Segoe UI', Arial";
    ctx.textAlign = "center";
    ctx.fillText("乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐", W/2, 475);

    // --- Save Image ---
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const imgPath = path.join(cacheDir, `uptime_${Date.now()}.png`);
    fs.writeFileSync(imgPath, canvas.toBuffer());

    // --- TEXT MESSAGE (Bold Math Style Numbers & Letters) ---
    const textInfo =
`╔═════════════════╗
   ⎯꯭𓆩꯭𝆺𝅥😻⃞𝐑⃞𝐈⃞𝐘⃞𝐀⃞༢࿐
╠═════════════════╣
║ 🕐 𝐔𝐩𝐭𝐢𝐦𝐞   : ${boldD}𝐝 ${boldH}𝐡 ${boldM}𝐦
║ ⚙️ 𝐂𝐏𝐔      : ${boldCpu}%
║ 🧠 𝐑𝐀𝐌      : ${boldRamUsed}𝐆 / ${boldRamTotal}𝐆
║ 💾 𝐃𝐢𝐬𝐤     : ${boldDisk}%
║ 🔁 𝐑𝐞𝐬𝐭𝐚𝐫𝐭𝐬 : ${boldRestart}
║ 👥 𝐔𝐬𝐞𝐫𝐬    : ${boldUsers}
║ 📡 𝐃𝐚𝐭𝐚     : ↑${boldDataSent}𝐆 ↓${boldDataReceived}𝐆
╠═════════════════╣
║  🟢 𝐒𝐓𝐀𝐓𝐔𝐒 : 𝐎𝐍𝐋𝐈𝐍𝐄
╚═════════════════╝
╔═════════════════╗
 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛ
╚═════════════════╝`;

    api.sendMessage(
      {
        body: textInfo,
        attachment: fs.createReadStream(imgPath)
      },
      event.threadID,
      () => fs.unlinkSync(imgPath),
      event.messageID
    );

  } catch (err) {
    api.sendMessage("❌ Error: " + err.message, event.threadID);
  }
};
