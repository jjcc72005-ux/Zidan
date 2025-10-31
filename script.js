// === إعداد الخريطة ===
const map = L.map('map', {
  minZoom: 2,
  maxZoom: 8,
  worldCopyJump: true
}).setView([20, 0], 2);

// طبقة بلاط (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// عناصر DOM
const countryListEl = document.getElementById('country-list');
const searchInput = document.getElementById('search');
const regionFilter = document.getElementById('region-filter');

const modal = document.getElementById('country-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalFlag = document.getElementById('modal-flag');
const modalName = document.getElementById('modal-name');
const modalRegion = document.getElementById('modal-region');
const modalCapital = document.getElementById('modal-capital');
const modalPopulation = document.getElementById('modal-population');
const modalArea = document.getElementById('modal-area');
const modalCurrency = document.getElementById('modal-currency');
const modalLanguages = document.getElementById('modal-languages');
const modalNote = document.getElementById('modal-note');
const modalClassification = document.getElementById('modal-classification');
const modalMore = document.getElementById('modal-more');

// خريطة لتحويل subregion إلى وصف عربي تقريبي
const subregionArabic = {
  "Southern Asia":"جنوب آسيا",
  "Western Asia":"غرب آسيا",
  "Central Asia":"آسيا الوسطى",
  "South-Eastern Asia":"جنوب شرق آسيا",
  "Eastern Europe":"شرق أوروبا",
  "Northern Europe":"شمال أوروبا",
  "Southern Europe":"جنوب أوروبا",
  "Western Europe":"غرب أوروبا",
  "Northern Africa":"شمال أفريقيا",
  "Sub-Saharan Africa":"أفريقيا جنوب الصحراء",
  "Caribbean":"الكاريبي",
  "Central America":"أمريكا الوسطى",
  "South America":"أمريكا الجنوبية",
  "Micronesia":"ميكرونيزيا",
  "Polynesia":"بولنيسيا",
  "Melanesia":"ميلانيسيا",
  "Australia and New Zealand":"أستراليا ونيوزيلندا",
  "Antarctica":"القطب الجنوبي"
};

// رابط GeoJSON لحدود دول العالم (مستضاف على GitHub). يعمل عادة على GitHub Pages ويدعم الاستخدام العام.
const GEOJSON_URL = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';

// تخزين وطبقة GeoJSON
let countriesLayer = null;
let countriesGeo = null;

// وظيفة لتحميل GeoJSON ورسم الدول
fetch(GEOJSON_URL)
  .then(resp => resp.json())
  .then(geo => {
    countriesGeo = geo;
    // نرسم الطبقة
    countriesLayer = L.geoJSON(geo, {
      style: defaultStyle,
      onEachFeature: onEachCountry
    }).addTo(map);

    // نملأ قائمة الدول في الشريط الجانبي
    populateCountryList(geo.features);
  })
  .catch(err => {
    console.error('فشل تحميل GeoJSON:', err);
    alert('حدث خطأ في تحميل بيانات حدود الدول. تأكد من اتصالك بالإنترنت.');
  });

// نمط افتراضي للدول
function defaultStyle(){
  return {
    color: '#0f7a6a',
    weight: 1,
    fillColor: '#084b40',
    fillOpacity: 0.25
  };
}
function highlightStyle(){
  return {
    weight: 2,
    color: '#66f0dd',
    fillOpacity: 0.35
  };
}

// عند كل فيتشر (دولة)
function onEachCountry(feature, layer){
  const name = feature.properties.name || feature.properties.NAME || "غير معروف";
  layer.bindPopup(`<b>${name}</b><br>اضغط لعرض معلومات مفصلة`);
  layer.on({
    mouseover(e){ e.target.setStyle(highlightStyle()); },
    mouseout(e){ countriesLayer.resetStyle(e.target); },
    click(e){ onCountryClick(feature, e.latlng); }
  });
}

// عند الضغط على دولة: نجيب بياناتها من REST Countries ونظهر المودال
async function onCountryClick(feature, latlng) {
  const props = feature.properties || {};
  let countryName = props.name || props.NAME || props.ADMIN || null;
  // أفضل طريقة: نبحث أولًا عن الـ ISO_A3 أو ISO_A2
  const iso_a3 = props['iso_a3'] || props['ISO_A3'] || props['ISO3'] || null;
  const iso_a2 = props['iso_a2'] || props['ISO_A2'] || props['ISO_A2'] || null;

  try {
    let restData = null;

    if(iso_a2 && iso_a2.length === 2){
      // جلب باستخدام كود البلد (alpha2)
      restData = await fetchRestCountryByCode(iso_a2);
    }
    if(!restData && iso_a3 && iso_a3.length === 3){
      restData = await fetchRestCountryByCode(iso_a3);
    }
    if(!restData && countryName){
      // البحث بالاسم (قد يفشل لبعض الأسماء المحلية)
      restData = await fetchRestCountryByName(countryName);
    }

    if(!restData){
      // لو مفهوش بيانات من REST Countries نعرض مودال بالحد الأدنى من المعلومات المتاحة
      showModalMinimal(countryName, feature);
      return;
    }

    showCountryModalFromRest(restData, feature);

    // نركّز الخريطة على النقطة اللي اتدوس عليها
    if(latlng){
      map.flyTo(latlng, 4, {duration:0.8});
    }

  } catch (err){
    console.error('خطأ عند جلب بيانات الدولة:', err);
    showModalMinimal(countryName, feature);
  }
}

// جلب بيانات من REST Countries حسب الكود (alpha2/alpha3)
async function fetchRestCountryByCode(code){
  // REST Countries — v3.1
  const url = `https://restcountries.com/v3.1/alpha/${code}`;
  const r = await fetch(url);
  if(!r.ok) return null;
  const data = await r.json();
  return data && data[0] ? data[0] : null;
}
async function fetchRestCountryByName(name){
  const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=true`;
  const r = await fetch(url);
  if(!r.ok){
    // محاولة بحث جزئي
    const r2 = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}`);
    if(!r2.ok) return null;
    const d2 = await r2.json();
    return d2 && d2[0] ? d2[0] : null;
  }
  const data = await r.json();
  return data && data[0] ? data[0] : null;
}

// عرض المودال باستخدام بيانات REST Countries
function showCountryModalFromRest(rc, feature){
  const commonName = rc.name && (rc.name.common || rc.name.official) || feature.properties.name || "غير معروف";
  modalName.textContent = commonName;

  // علم
  const flagUrl = rc.flags && (rc.flags.png || rc.flags.svg) || '';
  modalFlag.src = flagUrl;
  modalFlag.alt = `علم ${commonName}`;

  // region / subregion
  const region = rc.region || '';
  const subregion = rc.subregion || '';
  let regionText = region;
  if(subregion){
    regionText += ` — ${subregionArabic[subregion] || subregion}`;
  }
  modalRegion.textContent = regionText || 'غير متوفر';

  // العاصمة
  modalCapital.textContent = (rc.capital && rc.capital[0]) || 'غير متوفر';

  // السكان
  modalPopulation.textContent = rc.population ? numberWithCommas(rc.population) + ' نسمة' : 'غير متوفر';

  // المساحة
  modalArea.textContent = rc.area ? numberWithCommas(Math.round(rc.area)) : 'غير متوفر';

  // العملات
  if(rc.currencies){
    const curArr = Object.keys(rc.currencies).map(k => `${k} (${rc.currencies[k].name || ''})`);
    modalCurrency.textContent = curArr.join(', ');
  } else modalCurrency.textContent = 'غير متوفر';

  // اللغات
  if(rc.languages){
    modalLanguages.textContent = Object.values(rc.languages).join(', ');
  } else modalLanguages.textContent = 'غير متوفر';

  // نبذة موجزة (ننشئ جملة قصيرة من الخصائص المتاحة)
  let noteParts = [];
  if(rc.independent === true) noteParts.push('دولة مستقلة');
  if(rc.unMember === false) noteParts.push('ليست عضوًا في الأمم المتحدة');
  if(rc.capital && rc.capital.length) noteParts.push(`عاصمتها ${rc.capital[0]}`);
  modalNote.textContent = noteParts.length ? noteParts.join(' • ') : '—';

  // تصنيف تقديري — مبني على عدد السكان (منطق بسيط يمكن استبداله لاحقًا ببيانات اقتصادية)
  const classification = estimateClassification(rc.population, rc.area);
  modalClassification.textContent = classification;

  // رابط للمزيد
  modalMore.href = rc.maps && rc.maps.googleMaps ? rc.maps.googleMaps : `https://restcountries.com/`;
  modalMore.textContent = 'عرض صفحة REST Countries (مصدر البيانات)';

  // إظهار المودال
  modal.classList.remove('hidden');
}

// إذا لم تتوفر بيانات REST Countries
function showModalMinimal(name, feature){
  modalName.textContent = name || 'غير معروف';
  modalFlag.src = '';
  modalFlag.alt = '';
  modalRegion.textContent = feature.properties.region || feature.properties.continent || 'غير متوفر';
  modalCapital.textContent = 'غير متوفر';
  modalPopulation.textContent = 'غير متوفر';
  modalArea.textContent = feature.properties.area ? feature.properties.area : 'غير متوفر';
  modalCurrency.textContent = 'غير متوفر';
  modalLanguages.textContent = 'غير متوفر';
  modalNote.textContent = 'لا توجد بيانات إضافية من مصدر خارجي.';
  modalClassification.textContent = 'غير معروف (لا توجد بيانات كافية)';
  modalMore.href = '#';
  modalMore.textContent = 'لا يوجد';
  modal.classList.remove('hidden');
}

// تصنيف تقديري بناءً على السكان (قواعد بسيطة لتوضيح الفكرة)
function estimateClassification(population, area){
  // population may be undefined
  if(!population) return 'غير متوفر (تقديري)';
  const pop = Number(population);
  if(pop >= 100_000_000) return 'قوية (دولة كبيرة تعدادياً)';
  if(pop >= 50_000_000) return 'قوية/كبيرة';
  if(pop >= 10_000_000) return 'متوسطة';
  if(pop >= 1_000_000) return 'صغيرة';
  return 'هامشية (قليلة السكان)';
}

// مساعدة لتنسيق الأرقام
function numberWithCommas(x){
  if(!x && x !== 0) return x;
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// غلق المودال
closeModalBtn.addEventListener('click', ()=> modal.classList.add('hidden'));
modal.addEventListener('click', (e) => {
  if(e.target === modal) modal.classList.add('hidden');
});

// === قائمة الدول في الشريط الجانبي + بحث + تصفية ===
function populateCountryList(features){
  countryListEl.innerHTML = '';
  // نرتب اسامي الدول أبجدياً حسب الخاصية name
  const arr = features.map(f => {
    return {
      name: f.properties.name || f.properties.NAME || f.properties.ADMIN || 'غير معروف',
      props: f.properties,
      feature: f
    };
  }).sort((a,b)=> a.name.localeCompare(b.name, 'ar') );

  arr.forEach(item=>{
    const li = document.createElement('li');
    const img = document.createElement('img');
    img.className = 'country-flag-thumb';
    img.alt = `${item.name} علم`;
    img.src = getFlagThumbUrl(item.props); // حاول نجيب علم من REST Countries عبر الكود لو متاح
    const span = document.createElement('span');
    span.textContent = item.name;
    li.appendChild(img);
    li.appendChild(span);
    li.addEventListener('click', ()=>{
      // عند الضغط على اسم الدولة في القائمة — نفرض مركزها هو مركز المساحة الجغرافية (centroid)
      zoomToFeature(item.feature);
      onCountryClick(item.feature);
    });
    countryListEl.appendChild(li);
  });
}

// محاولة الحصول على علم مصغر عن طريق ISO code المتاح في الخصائص
function getFlagThumbUrl(props){
  // REST Countries uses alpha2 code (ISO 3166-1 alpha-2)
  const iso_a2 = props.iso_a2 || props.ISO_A2 || props['ISO_A2'];
  if(iso_a2){
    return `https://flagcdn.com/w40/${iso_a2.toLowerCase()}.png`;
  }
  // بديل: محاولة من iso_a3 — بعض الأحيان لا يعمل مع flagcdn
  const iso_a3 = props.iso_a3 || props.ISO_A3 || props['ISO3'];
  if(iso_a3){
    // لا يوجد رابط مباشر موثوق من iso3 لذلك نرجع صورة فارغة placeholder
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="24"></svg>';
  }
  // placeholder شفاف
  return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="24"></svg>';
}

// تكبير/انتقال للخريطة على فيتشر
function zoomToFeature(feature){
  const layer = findLayerByFeature(feature);
  if(layer){
    map.fitBounds(layer.getBounds(), { maxZoom:5 });
    layer.fire('click'); // اختياري: لفتح popup
  } else {
    // محاولة استخدام مركز هندسي تقريبي
    const coords = getFeatureCenter(feature);
    if(coords) map.setView(coords,4);
  }
}

// البحث عن الطبقة المطابقة للفيتشر
function findLayerByFeature(feature){
  let found = null;
  countriesLayer.eachLayer(layer=>{
    if(layer.feature && layer.feature.properties && feature.properties && (
      layer.feature.properties.name === feature.properties.name
      || layer.feature.properties.iso_a3 === feature.properties.iso_a3
      || layer.feature.properties.ISO_A3 === feature.properties.ISO_A3
    )){
      found = layer;
    }
  });
  return found;
}

// حساب مركز تقريبي من البوليغون (إذا متاح)
function getFeatureCenter(feature){
  try {
    const coords = feature.geometry.coordinates;
    // نحاول استخراج أول زوج من الإحداثيات
    if(!coords) return null;
    function findFirstPair(arr){
      if(typeof arr[0] === 'number' && typeof arr[1] === 'number') return arr;
      for(let i=0;i<arr.length;i++){
        const r = findFirstPair(arr[i]);
        if(r) return r;
      }
      return null;
    }
    const pair = findFirstPair(coords);
    return pair ? [pair[1], pair[0]] : null;
  } catch(e){ return null; }
}

// بحث بالاسم وتصفية حسب القارة
searchInput.addEventListener('input', filterList);
regionFilter.addEventListener('change', filterList);

function filterList(){
  const q = searchInput.value.trim().toLowerCase();
  const region = regionFilter.value;
  const items = countryListEl.querySelectorAll('li');
  items.forEach(li=>{
    const txt = li.textContent.trim().toLowerCase();
    let show = txt.includes(q);
    if(region && show){
      // نتحقق من كون الدولة في region المحدد باستخدام REST API (asynchronous) — لكن هنا نبسط: إخفاء/عرض حسب اسم المنطقة غير متوفر محليًا
      // لذلك فقط نظهر حسب الاسم والبحث. لإضافة فلتر المناطق بدقة نحتاج تحميل ومطابقة بيانات REST Countries لكل عنصر مسبقًا.
    }
    li.style.display = show ? 'flex' : 'none';
  });
}

// === تحسينات / نصائح تشغيل ===
// إذا رغبت: يمكننا لاحقاً تحميل بيانات REST Countries كلها مرة واحدة (https://restcountries.com/v3.1/all)
// وتخزينها في مصفوفة محلية لتمكين تصفية region/subregion سريعة بدون طلبات متعددة.

// === ملاحظة أخيرة ===
// REST Countries مصدر موثوق للعلم والمعلومات الأساسية، وملف GeoJSON المستخدم هو ملف مفتوح شائع الاستخدام.
// لو تحب أجهز نسخة جاهزة بالكامل (downloadable) بتحتوي بيانات REST Countries المجمعة محليًا عشان الموقع يشتغل أسرع وبلا طلبات خارجية — أعملك كمان.
