// 引入 Firebase (注意用 web sdk CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ✅ 你的 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDyzfiGBBfkIYUp_xKykdncocJJwLTnqMs",
  authDomain: "cargosystem-56b91.firebaseapp.com",
  projectId: "cargosystem-56b91",
  storageBucket: "cargosystem-56b91.firebasestorage.app",
  messagingSenderId: "150281096087",
  appId: "1:150281096087:web:96b16f96f6f5887f2692d2",
  measurementId: "G-TLMZFMZW4K"
};

// ✅ 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM 元素
const form = document.getElementById("form");
const summaryTable = document.querySelector("#summaryTable tbody");
const totalBox = document.getElementById("totalBox");

// ✅ 表單送出 → 寫入 Firestore
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const driver = document.getElementById("currentDriver").value;
  const fish = document.getElementById("currentFish").value;
  const location = document.getElementById("location").value;
  const pallet = document.getElementById("pallet").value;
  const spec = document.getElementById("spec").value;
  const box = document.getElementById("box").value;

  if (!driver || !fish || !location || !pallet || !spec || !box) {
    alert("⚠ 請完整輸入資料！");
    return;
  }

  try {
    await addDoc(collection(db, "cargoData"), {
      driver,
      fish,
      location,
      pallet,
      spec,
      box: parseInt(box)
    });
    form.reset();
    console.log("✅ 已新增到 Firestore");
  } catch (err) {
    console.error("❌ 新增失敗", err);
  }
});

// ✅ 即時同步 Firestore → 更新表格
onSnapshot(collection(db, "cargoData"), (snapshot) => {
  summaryTable.innerHTML = "";
  let total = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    total += data.box;

    const row = `<tr>
      <td>${data.driver}</td>
      <td>${data.location}</td>
      <td>${data.pallet}</td>
      <td>${data.fish}</td>
      <td>${data.spec}</td>
      <td>${data.box}</td>
      <td>自動累計</td>
      <td>判斷滿版</td>
      <td>--</td>
    </tr>`;

    summaryTable.innerHTML += row;
  });

  totalBox.textContent = total;
});
