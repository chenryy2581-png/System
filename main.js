// ======= 狀態 =======
let totalBox = 0;
let summary = {};   // key: driver|location|pallet|fish|spec -> { driver, location, pallet, fish, spec, box }
let palletSum = {}; // key: driver|location|pallet -> number
let currentDriver = "";
let currentFish  = "";
let isViewMode   = false;

// ======= 載入資料 =======
window.addEventListener('load', () => {
  const saved = localStorage.getItem("cargoData");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      summary       = data.summary      || {};
      palletSum     = data.palletSum    || {};
      totalBox      = data.totalBox     || 0;
      currentDriver = data.currentDriver|| "";
      currentFish   = data.currentFish  || "";
    } catch(e) { console.error(e); }
  }

  document.getElementById("driverDisplay").textContent = currentDriver || "尚未設定";
  document.getElementById("fishDisplay").textContent   = currentFish   || "尚未設定";
  document.getElementById("totalBox").innerText        = totalBox;

  // 設定選單預設值
  document.getElementById("currentDriver").value = currentDriver || "";
  document.getElementById("currentFish").value   = currentFish   || "";

  renderSummary();
  renderFilterTable();
  renderPalletTable();
  updateFilterOptions();
});

function saveData() {
  localStorage.setItem("cargoData", JSON.stringify({
    summary, palletSum, totalBox, currentDriver, currentFish
  }));
}

// ======= 模式切換 =======
document.getElementById("toggleMode").addEventListener("click", () => {
  isViewMode = !isViewMode;
  document.getElementById("inputSection").classList.toggle("hidden", isViewMode);
  document.getElementById("toggleMode").textContent = isViewMode
    ? "🔄 切換為「輸入模式」"
    : "🔄 切換為「查看模式」";
});

// ======= 固定司機 =======
document.getElementById("currentDriver").addEventListener("change", function () {
  const sel = this;
  if (sel.value === "_other") {
    const name = (prompt("輸入新司機名稱：") || "").trim();
    if (name) {
      const opt = document.createElement('option'); opt.value = name; opt.textContent = name;
      sel.insertBefore(opt, sel.querySelector('option[value="_other"]'));
      sel.value = name;
    } else {
      sel.value = "";
    }
  }
  currentDriver = sel.value;
  document.getElementById("driverDisplay").textContent = currentDriver || "尚未設定";
  saveData();
});

// ======= 固定魚種 =======
document.getElementById("currentFish").addEventListener("change", function () {
  const sel = this;
  if (sel.value === "_other") {
    const name = (prompt("輸入新魚種名稱：") || "").trim();
    if (name) {
      const opt = document.createElement('option'); opt.value = name; opt.textContent = name;
      sel.insertBefore(opt, sel.querySelector('option[value="_other"]'));
      sel.value = name;
    } else {
      sel.value = "";
    }
  }
  currentFish = sel.value;
  document.getElementById("fishDisplay").textContent = currentFish || "尚未設定";
  saveData();
});

// ======= 更新篩選器 =======
function updateFilterOptions() {
  const drivers   = new Set(Object.values(summary).map(i=>i.driver));
  const locations = new Set(Object.values(summary).map(i=>i.location));
  const fishes    = new Set(Object.values(summary).map(i=>i.fish));
  const specs     = new Set(Object.values(summary).map(i=>i.spec));

  const fill = (id, values) => {
    const sel = document.getElementById(id);
    const cur = sel.value;
    sel.innerHTML = `<option value="">全部</option>` + [...values].map(v=>`<option value="${v}">${v}</option>`).join("");
    if (cur) sel.value = cur;
  };
  fill("filterDriver",   drivers);
  fill("filterLocation", locations);
  fill("filterFish",     fishes);
  fill("filterSpec",     specs);
}

// ======= 明細表 =======
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
        <td><button class="btn-danger" onclick="deleteEntry('${key}')">❌ 刪除</button></td>
      </tr>`;
  });
}

window.deleteEntry = function(key) {
  if (!summary[key]) return;
  if (!confirm("確定刪除此筆資料？")) return;

  const item = summary[key];
  const pKey = `${item.driver}|${item.location}|${item.pallet}`;

  totalBox -= item.box; if (totalBox < 0) totalBox = 0;
  if (palletSum[pKey]) {
    palletSum[pKey] -= item.box;
    if (palletSum[pKey] <= 0) delete palletSum[pKey];
  }
  delete summary[key];

  document.getElementById("totalBox").innerText = totalBox;
  renderSummary(); renderFilterTable(); renderPalletTable(); updateFilterOptions();
  saveData();
};

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

// ======= 新增 =======
document.getElementById("form").addEventListener("submit", (e) => {
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

  const key = `${driver}|${location}|${pallet}|${fish}|${spec}`;
  if (!summary[key]) summary[key] = { driver, location, pallet, fish, spec, box: 0 };
  summary[key].box += box;

  const pKey = `${driver}|${location}|${pallet}`;
  if (!palletSum[pKey]) palletSum[pKey] = 0;
  palletSum[pKey] += box;

  totalBox += box;
  document.getElementById("totalBox").innerText = totalBox;

  renderSummary(); renderFilterTable(); renderPalletTable(); updateFilterOptions();
  saveData();

  e.target.reset();
});

// ======= 清除 =======
document.getElementById("clearBtn").addEventListener("click", () => {
  if (!confirm("確定要清除所有資料嗎？")) return;
  summary = {}; palletSum = {}; totalBox = 0;
  currentDriver = ""; currentFish = "";
  document.getElementById("driverDisplay").textContent = "尚未設定";
  document.getElementById("fishDisplay").textContent   = "尚未設定";
  document.getElementById("totalBox").innerText = "0";

  renderSummary(); renderFilterTable(); renderPalletTable(); updateFilterOptions();
  localStorage.removeItem("cargoData");

  document.getElementById("currentDriver").value = "";
  document.getElementById("currentFish").value   = "";
});

// ======= 匯出 CSV =======
document.getElementById("exportBtn").addEventListener("click", () => {
  let csv = "司機,據點,棧板編號,魚種,規格,箱數\n";
  Object.values(summary).forEach(item => {
    csv += `${item.driver},${item.location},${item.pallet},${item.fish},${item.spec},${item.box}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "點貨資料.csv";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
