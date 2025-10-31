// عنصر الكوكب
const globeContainer = document.getElementById("globe-container");
const countryInfo = document.getElementById("countryInfo");
const searchInput = document.getElementById("searchInput");
const modeButton = document.getElementById("modeToggle");

// إنشاء الكوكب باستخدام Globe.gl
const world = Globe()
  .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
  .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
  .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
  (document.getElementById("earthCanvas"));

// تحميل بيانات الدول من ملف JSON
fetch("countries.json")
  .then(res => res.json())
  .then(data => {
    window.countriesData = data;
    console.log("تم تحميل بيانات الدول بنجاح ✅");
  });

// دالة عرض معلومات الدولة
function showCountryInfo(countryName) {
  const country = window.countriesData.find(c => c.name.toLowerCase() === countryName.toLowerCase());
  if (!country) {
    countryInfo.innerHTML = `<p>لم يتم العثور على الدولة.</p>`;
    return;
  }

  countryInfo.innerHTML = `
    <h2>${country.name}</h2>
    <img src="${country.flag}" alt="علم ${country.name}">
    <p><b>العاصمة:</b> ${country.capital}</p>
    <p><b>القارة:</b> ${country.continent}</p>
    <p><b>الموقع الجغرافي:</b> ${country.location}</p>
    <p><b>عدد السكان:</b> ${country.population}</p>
    <p><b>القوة الدولية:</b> ${country.power}</p>
    <p><b>نبذة تاريخية:</b> ${country.history}</p>
  `;
  countryInfo.classList.remove("hidden");
}

// البحث عن دولة
searchInput.addEventListener("keyup", e => {
  if (e.key === "Enter") {
    const query = searchInput.value.trim();
    if (query) showCountryInfo(query);
  }
});

// زر التبديل بين الوضعين
modeButton.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  world.globeImageUrl(isDark
    ? "//unpkg.com/three-globe/example/img/earth-night.jpg"
    : "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
  );
  modeButton.textContent = isDark ? "☀️ وضع النهار" : "🌙 وضع الليل";
});
