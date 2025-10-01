// ========== Firebase 初始化 ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDyzfiGBBfkIYUp_xKykdncocJJwLTnqMs",
  authDomain: "cargosystem-56b91.firebaseapp.com",
  projectId: "cargosystem-56b91",
  storageBucket: "cargosystem-56b91.firebasestorage.app",
  messagingSenderId: "150281096087",
  appId: "1:150281096087:web:96b16f96f6f5887f2692d2",
  measurementId: "G-TLMZFMZW4K"
};

// 初始化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ======= 狀態 =======
let totalBox = 0;
let summary = {};
let palletSum = {};
let currentDriver = "";
let currentFish  = "";
let isViewMode   = false;

// ======= 固定司機 / 魚種 =======
document.getElementById("currentDriver").addEventListener("change", (e) => {
  currentDriver = e.target.value;
  document.getElementById("driverDisplay").textContent = currentDriver || "尚未設定";
});

document.getElementById("currentFish").addEventListener("change", (e) => {
  currentFish = e.target.value;
  document.getElementById("fishDisplay").textContent = currentFish || "尚未設定";
});

// ======= 新增一筆（寫入 Firestore） =======
document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentDriver) { alert("⚠️ 請先設定司機！"); return; }
  if (!currentFish)   { alert("⚠️ 請先設定魚種！"); return; }

  const driver  = currentDriver;
  const fish    = currentFish;
  const location= document.getElementById("location").value;
  const pallet  = (document.getElementById("pallet").value || "").trim();
  const spec    = (document.getElementById("spec").value   || "").trim();
  const box     = parseInt(document.getElementById("box").value, 10);

  if (!location || !pallet || !spec || isNaN(box)) { alert("⚠️ 請完整填寫！"); return; }

  try {
    await addDoc(collection(db, "cargoData"), {
      driver, location, pallet, fish, spec, box,
      timestamp: new Date()
    });
    console.log("✅ 已同步到 Firebase");
    e.target.reset();
  } catch (err) {
    console.error("❌ Firebase 寫入失敗", err);
  }
});

// ======= 即時讀取 Firestore（多裝置同步） =======
const q = query(collection(db, "cargoData"), orderBy("timestamp"));
onSnapshot(q, (snapshot) => {
  summary = {};
  palletSum = {};
  totalBox = 0;

  snapshot.forEach(doc => {
    const item = doc.data();
    const key = `${item.driver}|${item.location}|${item.pallet}|${item.fish}|${item.spec}`;
    if (!summary[key]) summary[key] = { ...item, box: 0 };
    summary[key].box += item.box;

    const pKey = `${item.driver}|${item.location}|${item.pallet}`;
    if (!palletSum[pKey]) palletSum[pKey] = 0;
    palletSum[pKey] += item.box;

    totalBox += item.box;
  });

  document.getElementById("totalBox").innerText = totalBox;
  renderSummary();
  renderFilterTable();
  renderPalletTable();
  updateFilterOptions();
});

// ======= 渲染明細表 =======
function renderSummary() {
  const tbody = document.querySelector("#summaryTable tbody");
  tbody.innerHTML = "";
  Object.entries(summary).forEach(([key, item]) => {
    const pKey = `${item.driver}|${item.location}|${item.pallet}`;
    const pTotal = palletSum[pKey] || 0;
    const isFull = pTotal >= 60 ? "✅ 滿版" : "";
    tbody.innerHTML += `
      <tr>
        <td>${item.driver}</td>
        <td>${item.location}</td>
        <td>${item.pallet}</td>
        <td>${item.fish}</td>
        <td>${item.spec}</td>
        <td>${item.box}</td>
        <td>${pTotal}</td>
        <td>${isFull}</td>
      </tr>`;
  });
}

// ======= 統計表 =======
function renderFilterTable() {
  const fDriver   = document.getElementById("filterDriver").value;
  const fLocation = document.getElementById("filterLocation").value;
  const fFish     = document.getElementById("filterFish").value;
  const fSpec     = document.getElementById("filterSpec").value;

  const agg = {};
  Object.values(summary).forEach(item => {
    if ((fDriver   && item.driver   !== fDriver)  ||
        (fLocation && item.location !== fLocation)||
        (fFish     && item.fish     !== fFish)    ||
        (fSpec     && item.spec     !== fSpec)) return;

    const key = `${item.driver}|${item.location}|${item.fish}|${item.spec}`;
    if (!agg[key]) agg[key] = { driver:item.driver, location:item.location, fish:item.fish, spec:item.spec, box:0 };
    agg[key].box += item.box;
  });

  const tbody = document.querySelector("#filterTable tbody");
  tbody.innerHTML = "";
  Object.values(agg).forEach(row => {
    tbody.innerHTML += `<tr>
      <td>${row.driver}</td><td>${row.location}</td><td>${row.fish}</td><td>${row.spec}</td><td>${row.box}</td>
    </tr>`;
  });
}
document.querySelectorAll("#filterDriver,#filterLocation,#filterFish,#filterSpec")
  .forEach(sel => sel.addEventListener("change", renderFilterTable));

// ======= 棧板小計 =======
function renderPalletTable() {
  const tbody = document.querySelector("#palletTable tbody");
  tbody.innerHTML = "";
  Object.keys(palletSum).forEach(key => {
    const [driver, location, pallet] = key.split("|");
    const total = palletSum[key];
    const isFull = total >= 60 ? "✅ 滿版" : "";
    const percent = Math.min(100, (total / 60) * 100);
    let color = "green";
    if (total >= 40 && total < 60) color = "orange";
    if (total >= 60) color = "red";

    tbody.innerHTML += `
      <tr>
        <td>${driver}</td>
        <td>${location}</td>
        <td>${pallet}</td>
        <td>
          <div class="progress-bar">
            <div class="progress ${color}" style="width:${percent}%">${total}/60</div>
          </div>
        </td>
        <td>${total}</td>
        <td>${isFull}</td>
      </tr>`;
  });
}

// ======= 更新篩選選項 =======
function updateFilterOptions() {
  const drivers = new Set(), locations = new Set(), fishes = new Set(), specs = new Set();
  Object.values(summary).forEach(item => {
    drivers.add(item.driver); locations.add(item.location); fishes.add(item.fish); specs.add(item.spec);
  });

  fillOptions("filterDriver", drivers);
  fillOptions("filterLocation", locations);
  fillOptions("filterFish", fishes);
  fillOptions("filterSpec", specs);
}
function fillOptions(id, set) {
  const select = document.getElementById(id);
  const current = select.value;
  select.innerHTML = `<option value="">全部</option>`;
  set.forEach(v => select.innerHTML += `<option value="${v}">${v}</option>`);
  if (set.has(current)) select.value = current;
}
