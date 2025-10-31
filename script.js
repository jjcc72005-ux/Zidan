let scene, camera, renderer, globe, currentMode = "day", countriesData;

init();
animate();

// إنشاء الكوكب
function init() {
  scene = new THREE.Scene();
  const bgTexture = new THREE.TextureLoader().load('assets/stars_bg.jpg');
  scene.background = bgTexture;

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 250;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("globe-container").appendChild(renderer.domElement);

  // تحميل الخامات (textures)
  const texture = new THREE.TextureLoader().load('assets/earth_day.jpg');
  const bumpMap = new THREE.TextureLoader().load('assets/earth_night.jpg');

  globe = new ThreeGlobe()
    .globeImageUrl('assets/earth_day.jpg')
    .bumpImageUrl('assets/earth_night.jpg');
  scene.add(globe);

  const light = new THREE.AmbientLight(0xffffff, 1);
  scene.add(light);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // تحميل بيانات الدول
  fetch('countries.json')
    .then(res => res.json())
    .then(data => {
      countriesData = data;
    });

  // البحث
  document.getElementById('search').addEventListener('input', e => {
    const query = e.target.value.trim();
    if (countriesData && countriesData[query]) {
      const country = countriesData[query];
      rotateTo(country.lat, country.lng);
      showInfo(country, query);
    }
  });

  // تبديل الوضع
  document.getElementById('mode-toggle').addEventListener('click', toggleMode);

  document.getElementById('close-info').addEventListener('click', () => {
    document.getElementById('info-box').classList.add('hidden');
  });
}

// دوران الكوكب
function animate() {
  requestAnimationFrame(animate);
  globe.rotation.y += 0.0015; // دوران تلقائي ببطء
  renderer.render(scene, camera);
}

function rotateTo(lat, lng) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  camera.position.x = 250 * Math.sin(phi) * Math.cos(theta);
  camera.position.y = 250 * Math.cos(phi);
  camera.position.z = 250 * Math.sin(phi) * Math.sin(theta);
  camera.lookAt(scene.position);
}

function showInfo(country, name) {
  const info = document.getElementById('info-box');
  info.classList.remove('hidden');
  document.getElementById('flag').src = country.flag;
  document.getElementById('country-name').textContent = name;
  document.getElementById('location').textContent = country.location;
  document.getElementById('capital').textContent = country.capital;
  document.getElementById('population').textContent = country.population;
  document.getElementById('area').textContent = country.area;
  document.getElementById('currency').textContent = country.currency;
  document.getElementById('history').textContent = country.history;
  document.getElementById('power').textContent = country.power;
}

function toggleMode() {
  currentMode = currentMode === "day" ? "night" : "day";
  const texture = currentMode === "day" ? 'assets/earth_day.jpg' : 'assets/earth_night.jpg';
  globe.globeImageUrl(texture);
  document.getElementById('mode-toggle').textContent = currentMode === "day" ? "🌙 وضع الليل" : "🔆 وضع النهار";
}
