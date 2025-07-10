// 🖼️ Show large preview
function showBig(imgElement) {
  const previewBox = document.getElementById('preview');
  const largeImg = document.getElementById('largeImage');
  largeImg.src = imgElement.src;
  previewBox.style.display = 'block';
}

// 🌐 Language dictionary
const lang = {
  en: {
    title: "☕ Yellow Bug Coffee",
    subtitle: "Drive your day with flavor 🚗",
    menuTitle: "Our Coffee Menu",
    formTitle: "Customize Your Coffee",
    labelCoffee: "Select Coffee:",
    labelSugar: "Sugar:",
    sugar1: "No Sugar",
    sugar2: "Less Sugar",
    sugar3: "Normal Sugar",
    labelToppings: "Toppings:",
    labelSize: "Size:",
    labelPayment: "Payment Method:",
    submitBtn: "☕ Order Now",
    contactTitle: "Contact Us"
  },
  th: {
    title: "☕ เยลโล่บั๊กคอฟฟี่",
    subtitle: "เติมพลังด้วยรสชาติทุกเช้า 🚗",
    menuTitle: "เมนูกาแฟของเรา",
    formTitle: "ปรับแต่งกาแฟของคุณ",
    labelCoffee: "เลือกกาแฟ:",
    labelSugar: "ระดับความหวาน:",
    sugar1: "ไม่หวาน",
    sugar2: "หวานน้อย",
    sugar3: "หวานปกติ",
    labelToppings: "ท็อปปิ้ง:",
    labelSize: "ขนาดแก้ว:",
    labelPayment: "วิธีชำระเงิน:",
    submitBtn: "☕ สั่งเลย",
    contactTitle: "ติดต่อเรา"
  }
};

// 🌍 Set Language
function setLanguage(code) {
  const txt = lang[code];
  for (let id in txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt[id];
  }
}

// ✅ Order Form Submit
document.getElementById('orderForm').addEventListener('submit', function (e) {
  e.preventDefault();
  alert("✅ Thank you! Your coffee order has been received.");
});
