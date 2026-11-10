// Calc SmartX – 3D interactive globe
// Highlights countries by language using TopoJSON + Three.js
// Lazy-loads TopoJSON data, then draws a WebGL globe with colored country fills.
(function () {
  'use strict';
  const canvas = document.getElementById('globe');
  if (!canvas || typeof THREE === 'undefined') return;

  const rawData = canvas.dataset.countries;
  const activeLang = canvas.dataset.active || 'en';
  if (!rawData) return;

  let countryMap; // ISO-a3 → lang code
  try {
    const langCountries = JSON.parse(rawData);
    countryMap = {};
    for (const [lang, codes] of Object.entries(langCountries)) {
      for (const c of (codes || [])) countryMap[c] = lang;
    }
  } catch (e) { return; }

  // Cobalt palette per language (matches site theme)
  const LANG_COLORS = {
    vi: 0x2E8B57, en: 0x2563EB, zh: 0xE53E3E, ja: 0xBC2C3D,
    ko: 0x1E40AF, es: 0xD97706, pt: 0x047857, fr: 0x7C3AED,
    de: 0x374151, ru: 0xB91C1C, th: 0x0F766E, id: 0xC2410C,
  };
  const DEFAULT_COLOR = 0xCBD5E1;   // grey for unassigned countries
  const OCEAN_COLOR   = 0xE8F0FB;   // light cobalt wash
  const LINE_COLOR    = 0xFFFFFF;
  const HIGHLIGHT_MUL = 0xFFFFAA;   // tint on hover

  const cs = getComputedStyle(document.documentElement);
  const bg = cs.getPropertyValue('--color-bg').trim() || '#f7f9fc';

  // ---- scene setup ----
  const W = canvas.parentElement.clientWidth || 700;
  const H = Math.min(W * 0.65, 480);
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
  camera.position.z = 2.5;

  // Ocean sphere
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 64),
    new THREE.MeshPhongMaterial({ color: OCEAN_COLOR, shininess: 30 })
  );
  scene.add(sphere);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(5, 3, 5);
  scene.add(sun);

  // ---- load world topology ----
  const TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';

  function latLonToXYZ(lat, lon, r) {
    const phi   = (90 - lat)  * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  // Convert GeoJSON polygon rings to a BufferGeometry on the sphere surface
  function ringToGeo(ring, r, segments) {
    const pts = [];
    for (const [lon, lat] of ring) pts.push(latLonToXYZ(lat, lon, r));
    // Close
    if (pts.length > 0) pts.push(pts[0].clone());
    const positions = new Float32Array(pts.flatMap(p => [p.x, p.y, p.z]));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }

  // Build a filled country shape with EarCut (approximation via THREE.ShapeUtils)
  function buildCountryMesh(feature, color, r) {
    const group = new THREE.Group();
    const geom = feature.geometry;
    const polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
    for (const poly of polys) {
      const ring = poly[0]; // outer ring only for fill approximation
      const pts3 = ring.map(([lon, lat]) => latLonToXYZ(lat, lon, r + 0.001));
      if (pts3.length < 3) continue;
      // Draw filled polygon via triangulation centroid fan
      const centroid = pts3.reduce((a, b) => a.clone().add(b), new THREE.Vector3()).divideScalar(pts3.length).normalize().multiplyScalar(r + 0.001);
      const positions = [];
      for (let i = 0; i < pts3.length - 1; i++) {
        positions.push(centroid.x, centroid.y, centroid.z);
        positions.push(pts3[i].x,   pts3[i].y,   pts3[i].z);
        positions.push(pts3[i+1].x, pts3[i+1].y, pts3[i+1].z);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      geo.computeVertexNormals();
      const mat = new THREE.MeshPhongMaterial({ color, shininess: 20, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
      group.add(new THREE.Mesh(geo, mat));
      // Outline
      const outPts = pts3.flatMap(p => [p.x, p.y, p.z]);
      const outGeo = new THREE.BufferGeometry();
      outGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(outPts), 3));
      group.add(new THREE.LineLoop(outGeo, new THREE.LineBasicMaterial({ color: LINE_COLOR, opacity: 0.4, transparent: true })));
    }
    return group;
  }

  // Num3 → ISO-A3 map (TopoJSON id = ISO numeric)
  const ISO_NUM = {
    4:'AFG',8:'ALB',12:'DZA',24:'AGO',32:'ARG',36:'AUS',40:'AUT',50:'BGD',56:'BEL',64:'BTN',68:'BOL',76:'BRA',100:'BGR',104:'MMR',116:'KHM',120:'CMR',124:'CAN',140:'CAF',144:'LKA',152:'CHL',156:'CHN',170:'COL',178:'COG',188:'CRI',192:'CUB',196:'CYP',203:'CZE',208:'DNK',214:'DOM',218:'ECU',818:'EGY',222:'SLV',231:'ETH',246:'FIN',250:'FRA',266:'GAB',276:'DEU',288:'GHA',320:'GTM',324:'GIN',332:'HTI',356:'IND',360:'IDN',364:'IRN',368:'IRQ',372:'IRL',376:'ISR',380:'ITA',388:'JAM',392:'JPN',400:'JOR',404:'KEN',408:'PRK',410:'KOR',398:'KAZ',418:'LAO',422:'LBN',430:'LBR',434:'LBY',442:'LUX',484:'MEX',496:'MNG',504:'MAR',508:'MOZ',524:'NPL',528:'NLD',558:'NIC',566:'NGA',578:'NOR',586:'PAK',591:'PAN',600:'PRY',604:'PER',608:'PHL',616:'POL',620:'PRT',630:'PRI',634:'QAT',642:'ROU',643:'RUS',682:'SAU',686:'SEN',706:'SOM',710:'ZAF',724:'ESP',752:'SWE',756:'CHE',760:'SYR',158:'TWN',764:'THA',792:'TUR',800:'UGA',804:'UKR',784:'ARE',826:'GBR',840:'USA',858:'URY',862:'VEN',704:'VNM',887:'YEM',894:'ZMB',716:'ZWE',336:'VAT',496:'MNG',554:'NZL',702:'SGP',646:'RWA',462:'MDV',174:'COM',174:'COM',454:'MWI',466:'MLI',478:'MRT',562:'NER',686:'SEN',694:'SLE',728:'SSD',729:'SDN',768:'TGO',854:'BFA',120:'CMR',562:'NER',686:'SEN',204:'BEN',024:'AGO',
    // Extra
    112:'BLR',398:'KAZ',417:'KGZ',498:'MDA',496:'MNG',
    344:'HKG',446:'MAC',
    854:'BFA',132:'CPV',678:'STP',624:'GNB',626:'TLS',
    384:'CIV',818:'EGY',266:'GAB',450:'MDG',
  };

  fetch(TOPO_URL)
    .then(r => r.json())
    .then(topo => {
      // Convert TopoJSON to GeoJSON countries
      // Manual minimal TopoJSON decode (arc delta-decode + feature build)
      const arcs = topo.arcs;
      const scale = topo.transform ? topo.transform.scale : [1,1];
      const translate = topo.transform ? topo.transform.translate : [0,0];

      function decodeArc(i) {
        const reversed = i < 0;
        const arc = arcs[reversed ? ~i : i];
        const pts = [];
        let x = 0, y = 0;
        for (const [dx, dy] of arc) {
          x += dx; y += dy;
          pts.push([x * scale[0] + translate[0], y * scale[1] + translate[1]]);
        }
        return reversed ? pts.reverse() : pts;
      }

      function rings(arcsArray) {
        return arcsArray.map(ring => ring.flatMap(decodeArc));
      }

      const countries = topo.objects.countries || topo.objects.land;
      const features = (countries.geometries || []).map(g => {
        const id = String(g.id).padStart(3, '0');
        const isoA3 = ISO_NUM[parseInt(g.id)] || ISO_NUM[g.id] || null;
        let coordinates;
        if (g.type === 'Polygon') {
          coordinates = rings(g.arcs);
        } else if (g.type === 'MultiPolygon') {
          coordinates = g.arcs.map(p => rings(p));
        } else return null;
        return { type: 'Feature', id: g.id, isoA3, geometry: { type: g.type, coordinates } };
      }).filter(Boolean);

      // Build meshes
      for (const f of features) {
        const lang = f.isoA3 ? countryMap[f.isoA3] : null;
        const color = lang ? LANG_COLORS[lang] : DEFAULT_COLOR;
        try {
          const mesh = buildCountryMesh(f, color, 1);
          mesh.userData.lang = lang;
          mesh.userData.isoA3 = f.isoA3;
          scene.add(mesh);
        } catch(e) {}
      }
    })
    .catch(() => {}); // fail silently if offline

  // ---- interaction: drag to rotate ----
  let isDragging = false, prevX = 0, prevY = 0;
  const rot = { x: 0.3, y: -0.5 };
  const vel = { x: 0, y: 0.001 };

  canvas.addEventListener('mousedown',  e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; });
  canvas.addEventListener('touchstart', e => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('mouseup',  () => { isDragging = false; });
  window.addEventListener('touchend', () => { isDragging = false; });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - prevX, dy = e.clientY - prevY;
    vel.y = dx * 0.005; vel.x = dy * 0.005;
    rot.y += vel.y; rot.x += vel.x;
    prevX = e.clientX; prevY = e.clientY;
  });
  window.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - prevX, dy = e.touches[0].clientY - prevY;
    vel.y = dx * 0.005; vel.x = dy * 0.005;
    rot.y += vel.y; rot.x += vel.x;
    prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
  }, { passive: true });

  // ---- auto-spin on idle ----
  let lastInteract = 0;
  canvas.addEventListener('mousedown', () => lastInteract = Date.now());
  canvas.addEventListener('touchstart', () => lastInteract = Date.now(), { passive: true });

  // ---- render loop ----
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf;
  const globeGroup = new THREE.Group();
  globeGroup.add(sphere);
  scene.add(globeGroup);

  function animate() {
    raf = requestAnimationFrame(animate);
    if (!isDragging) {
      const idle = Date.now() - lastInteract > 1500;
      if (idle && !reduce) vel.y = 0.003;
      vel.x *= 0.92; vel.y *= 0.98;
      rot.x += vel.x; rot.y += vel.y;
      rot.x = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, rot.x));
    }
    scene.children.forEach(obj => { if (obj !== camera && obj !== ambient && obj !== sun) { obj.rotation.x = rot.x; obj.rotation.y = rot.y; } });
    renderer.render(scene, camera);
  }

  // Start only when visible
  const obs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { if (!raf) animate(); }
    else { cancelAnimationFrame(raf); raf = null; }
  });
  obs.observe(canvas);

  // Resize
  window.addEventListener('resize', () => {
    const nw = canvas.parentElement.clientWidth || W;
    const nh = Math.min(nw * 0.65, 480);
    canvas.style.width = nw + 'px'; canvas.style.height = nh + 'px';
    camera.aspect = nw / nh; camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  });

  // Language card hover → highlight on globe
  document.querySelectorAll('.langs a[data-lang]').forEach(a => {
    a.addEventListener('mouseenter', () => {
      const lang = a.dataset.lang;
      scene.children.forEach(obj => {
        if (obj.userData && obj.userData.lang) {
          obj.children.forEach(c => { if (c.material && c.material.color) c.material.color.setHex(obj.userData.lang === lang ? LANG_COLORS[lang] * 1.3 : LANG_COLORS[obj.userData.lang]); });
        }
      });
    });
    a.addEventListener('mouseleave', () => {
      scene.children.forEach(obj => {
        if (obj.userData && obj.userData.lang) {
          obj.children.forEach(c => { if (c.material && c.material.color) c.material.color.setHex(LANG_COLORS[obj.userData.lang]); });
        }
      });
    });
  });
})();
