const axios = require('axios');

module.exports.config = {
 name: "welcome",
 version: "1.3.0",
 hasPermssion: 0,
 credits: "𝐌𝐑 𝐉𝐔𝐖𝐄𝐋",
 description: "Welcome system with auto trigger and profile photo",
 commandCategory: "group",
 usages: "/welcome [reply/mention/uid]",
 cooldowns: 5
};

async function getName(Users, uid) {
 try {
 return await Users.getNameUser(uid);
 } catch {
 return "User";
 }
}

// টেক্সট ক্লিন করার ফাংশন (ইমোজি ও স্পেশাল ক্যারেক্টার বাদ দেয়)
function cleanText(text) {
 if (!text) return "";
 return text
 .replace(/[\u{1F600}-\u{1F6FF}]/gu, '')
 .replace(/[\u{2600}-\u{26FF}]/gu, '')
 .replace(/[\u{2700}-\u{27BF}]/gu, '')
 .replace(/[^\w\s\u0980-\u09FF]/g, '')
 .replace(/\s+/g, ' ')
 .trim();
}

// ট্রিগার ওয়ার্ড চেক করার ফাংশন
function isTriggerWord(text) {
 if (!text) return false;
 const cleanMsg = cleanText(text);
 const lowerText = cleanMsg.toLowerCase();
 
 const banglaTriggers = [
 "আমি নতুন", "নতুন আছি", "ওয়েলকাম করো", "ওয়েলকাম করো",
 "কে ওয়েলকাম করবে", "কে ওয়েলকাম করবে", "ওয়েলকাম দাও", "ওয়েলকাম দাও",
 "স্বাগতম জানাও", "নতুন সদস্য", "আমি জয়েন করেছি", "আমি যোগ দিয়েছি", "যোগ দিয়েছি"
 ];
 
 const englishTriggers = [
 "i am new", "i'm new", "im new", "new member",
 "welcome me", "say welcome", "who will welcome",
 "just joined", "joined", "new here", "join"
 ];
 
 for (let word of banglaTriggers) {
 if (lowerText.includes(word)) return true;
 }
 for (let word of englishTriggers) {
 if (lowerText.includes(word)) return true;
 }
 return false;
}

module.exports.run = async ({ api, event, args, Users }) => {
 const threadID = event.threadID;
 const threadInfo = await api.getThreadInfo(threadID).catch(() => null);
 const groupName = threadInfo?.threadName || "Unknown Group";

 let targetID = null;
 let isCommand = false;

 // ===== ১. রিপ্লে =====
 if (event.messageReply) {
 targetID = event.messageReply.senderID;
 isCommand = true;
 }
 
 // ===== ২. মেনশন =====
 else if (event.mentions && Object.keys(event.mentions).length > 0) {
 // যদি মেনশন থাকে, তাহলে যাকে মেনশন করা হয়েছে তাকেই টার্গেট করবে
 // চেক করা হবে যে মেসেজে ওয়েলকাম সম্পর্কিত কিছু আছে কিনা
 const body = event.body || "";
 const cleanBody = cleanText(body).toLowerCase();
 
 // চেক করা যে মেসেজে ওয়েলকাম বা স্বাগতম সম্পর্কিত কিছু আছে কিনা
 const welcomeWords = ["ওয়েলকাম", "ওয়েলকাম", "স্বাগতম", "welcome", "new", "নতুন", "জয়েন", "যোগ"];
 let hasWelcomeWord = false;
 for (let word of welcomeWords) {
 if (cleanBody.includes(word)) {
 hasWelcomeWord = true;
 break;
 }
 }
 
 // যদি মেনশন থাকে এবং ওয়েলকাম সম্পর্কিত শব্দ থাকে, তাহলে মেনশনকৃত ইউজারকে টার্গেট করবে
 if (hasWelcomeWord) {
 targetID = Object.keys(event.mentions)[0];
 isCommand = true;
 }
 // অথবা কমান্ড থাকলে
 else if (args[0] || event.body.startsWith("/welcome") || event.body.startsWith("!welcome")) {
 targetID = Object.keys(event.mentions)[0];
 isCommand = true;
 }
 }

 // ===== ৩. UID =====
 else if (args[0]) {
 targetID = args[0];
 isCommand = true;
 }

 // ===== ৪. অটো ট্রিগার (কমান্ড ছাড়া) =====
 // শুধুমাত্র তখনই কাজ করবে যখন:
 // 1. কমান্ড না হয়
 // 2. রিপ্লে না থাকে
 // 3. মেনশন না থাকে
 if (!isCommand && !event.messageReply && !event.mentions) {
 const body = event.body || "";
 if (isTriggerWord(body)) {
 targetID = event.senderID;
 }
 }

 // যদি টার্গেট আইডি না পাওয়া যায় তাহলে রিটার্ন
 if (!targetID) {
 return;
 }

 // ===== ওয়েলকাম মেসেজ তৈরি =====
 const username = await getName(Users, targetID);

 const adminIDs = threadInfo?.adminIDs?.map(i => i.id) || [];

 let adminText = "";
 let mentions = [];

 for (let id of adminIDs) {
 const name = await getName(Users, id);
 adminText += `@${name}\n`;
 mentions.push({ id, tag: name });
 }

 const botadmin = "61592716197470";
 const botadminName = await getName(Users, botadmin);

 mentions.push({
 id: botadmin,
 tag: botadminName
 });

 mentions.push({
 id: targetID,
 tag: username
 });

 // প্রোফাইল ফটো ডাউনলোড
 let profilePicStream = null;
 try {
 const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
 const response = await axios({
 method: 'get',
 url: avatarUrl,
 responseType: 'stream',
 timeout: 10000
 });
 profilePicStream = response.data;
 } catch (error) {
 console.error("Error fetching profile photo:", error);
 }

 const msg = `
𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚𐙚

❥‌‌𖠣꙰ٜٜٜٜٜٜٜٜٜ‌‌‌‌‌‌‌‌‌‌‌‌⚀ค้้้้้้้้้้้้้้้้้้้­้้้้้้้้้้้้้้้้้้้้­้้้้้้้้ـٰٖٖٖٖٖٜ۬ـٰٰٖٖٖٖٜ۬ـٰٰٰٖٖٖٜ۬ـٰٰٰٰٖٖٜ۬ـٰٰٰٰٰٖٜ۬𝐴𝑠𝑠𝑙𝑎𝑚𝑢𝑙𝑎𝑖𝑘𝑢𝑚ـٰٖٖٖٖٖٜ۬ـٰٰٖٖٖٖٜ۬ـٰٰٰٖٖٖٜ۬ـٰٰٰٰٖٖٜ۬ـٰٰٰٰٰٖٜ۬ค้้้้้้้้้้้้้้้้้้้­้้้้้้้้้้้้้้้้้้้้­้้้้้้้้⁜ٜٜٜٜٜٜٜٜٜ‌‌❥꙰
┏━━━━━━━━━━━━━━━┓

 ${groupName}

┗━━━━━━━━━━━━━━━┛
গু্ঁপে্ঁ আ্ঁমা্ঁদে্ঁর্ঁ সা্ঁথে্ঁ যু্ঁক্ত্ঁ হ্ঁও্ঁয়া্ঁর্ঁ

 জ্ঁন্য্ঁ তো্ঁমা্ঁকে্ঁ অ্ঁস্ঁংখ্য্ঁ ধ্ঁন্য্ঁবা্ঁদ্ঁ ┏━━━━━━━━━━━━━━━┓
༊তা্ঁর সা্ঁথে্ঁ ༆ এ্ঁর্ঁ প্ঁক্ষ্ঁ
থে্ঁকে্ঁ হা্ঁজা্ঁরো্ঁ কা্ঁঠ্ঁ 🌹🥀

গো্ঁলা্ঁপে্ঁর্ঁ শু্ঁভে্ঁচ্ছা্ঁ ও্ঁ

 অ্ঁভি্ঁন্ঁদ্ঁন্ঁ༊᭄আ্ঁমা্ঁদে্ঁর্ঁ সা্ঁথে্ঁই্ঁ 
সা্ঁথে্ঁ যু্ঁক্ত্ঁ হ্ঁয়ে্ঁছে্ঁন্ঁ & আ্ঁমা্ঁদে্ঁর্ঁ

 সা্ঁথে্ঁই্ঁ থা্ঁক্ঁবা্ঁ🫶🫰💝┗━━━━━━━━━━━━━━━┛

 ⍣⃟ ⍣⃟⍣⃟ ⍣⃟⍣⃟ ⍣⃟⍣⃟ ⍣⃟⍣⃟ ⍣⃟⍣⃟ ⍣⃟⍣⃟ ⍣⃟⍣⃟ ⍣⃟⍣⃟ ⍣⃟

┏━━━━━━━━━━━━━━━┓,, আ্ঁশা্ঁ,,ক্ঁরি্ঁ,,গ্রু্ঁপে্ঁ,স্ঁম্ঁয়্ঁ,,

দি্ঁবা্ঁ স্ঁবা্ঁর্ঁ,,, সা্ঁথে্ঁ,,আ্ঁড্ডা্ঁ,,

 দি্ঁবা্ঁ,, কো্ঁন্ঁ,,স্ঁম্ঁস্যা্ঁ,, হ্ঁলে্ঁ

🔰এ্ঁড্ঁমি্ঁন্ঁকে্ঁ🔰,, জা্ঁনা্ঁবা্ঁ,,

,༆নি্ঁজে্ঁর্ঁ,, ম্ঁনে্ঁ,, ক্ঁরে্ঁ,

গ্রু্ঁপ্ঁটা্ঁকে্ঁ 🫶ভা্ঁলো্ঁবা্ঁস্ঁবা্ঁ★ ┗━━━━━━━━━━━━━━━┛
┏━━━━━━━━━━━━━━━━━━┓
 👤 𝐁🅞𝐓 𝐀𝐃🅜𝐈𝐍

 👉 ${botadminName}
 🔗 https://www.facebook.com/profile.php?id=${botadmin}
━━━━━━━━━━━━━━━━━━━━
👥𝐆𝐎🅡𝐔𝐏 𝐀𝐃🅜𝐈𝐍 
 
 ${adminText}
┗━━━━━━━━━━━━━━━━━━━┛
╭──────•◈•──────╮
💓══❥ⵗⵗ̥̥̊̊ⵗ̥̥̥̥̊̊̊ⵗ̥̥̥̥̥̊̊̊̊ⵗ̥̥̥̥̥̥̊̊̊̊̊ⵗ̥̥̥̥̥̥̥̊̊̊̊̊ⵗ̥̥̥̥̥̥̥̥̊̊̊̊ⵗ̥̥̥̥̥̥̥̥̥̊̊̊ⵗ̥̥̥̥̥̥̥̥̥̥̊̊ⵗ̥̥̥̥̥̥̥̥̥̥̥ⵗ̥̥̥̥̥̥̥̥̥̥̊̊ⵗ̥̥̥̥̥̥̥̥̥̊̊̊ⵗ̥̥̥̥̥̥̥̥̊̊̊̊ⵗ̥̥̥̥̥̥̊̊̊̊̊ⵗ̥̥̥̥̥̊̊̊̊ⵗ̥̥̥̥̊̊̊ⵗ̥̥̊̊══❥💓 ┏━━━━━━━━━━━━━━━┓
 
 ──⃟🐱𝗪𝗘𝗟𝗖𝗢𝗠𝗘🫵🫶🫂🌷

 ━〲😽ꤪ ${username}

┗━━━━━━━━━━━━━━━┛
`;

 // ফটো সহ মেসেজ পাঠানো
 if (profilePicStream) {
 return api.sendMessage({
 body: msg,
 mentions: mentions,
 attachment: profilePicStream
 }, threadID);
 } else {
 return api.sendMessage({
 body: msg,
 mentions: mentions
 }, threadID);
 }
};
