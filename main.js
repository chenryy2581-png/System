import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// Firebase 設定
const firebaseConfig = {
  apiKey: "你的 apiKey",
  authDomain: "cargosystem-56b91.firebaseapp.com",
  projectId: "cargosystem-56b91",
  storageBucket: "cargosystem-56b91.appspot.com",
  messagingSenderId: "150281096087",
  appId: "1:150281096087:web:96b16f96f6f5887f2692d2",
  measurementId: "G-TLMZFMZW4K"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 匿名登入
signInAnonymously(auth)
  .then(() => console.log("✅ 匿名登入成功"))
  .catch(err => console.error("❌ 匿名登入失敗", err));

// 🔽 表單送出事件
document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const driver = document.getElementById("currentDriver").value;
  const fish = document.getElementById("currentFish").value;
  const location = document.getElementById("location").value;
  const pallet = document.getElementById("pallet").value;
  const spec = document.getElementById("spec").value;
  const box = parseInt(document.getElementById("box").value);

  // 存本地顯示（原功能）
  console.log("本地顯示：", { driver, fish, location, pallet, spec, box });

  // 存到 Firestore
  try {
    await addDoc(collection(db, "cargoData"), {
      driver, fish, location, pallet, spec, box,
      timestamp: new Date()
    });
    alert("✅ 資料已送出並同步到雲端！");
  } catch (err) {
    console.error("Firestore 寫入失敗：", err);
    alert("❌ 雲端儲存失敗");
  }
});
