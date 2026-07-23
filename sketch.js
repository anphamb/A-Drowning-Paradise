/* =========================================================
   BONG BÓNG "LIFE BELOW WATER" + STICKER RÁC (gộp 1 file)
   ---------------------------------------------------------
   PHẦN 1 — BONG BÓNG (giữ nguyên 100% logic gốc):
   - background.png (ảnh duotone xanh) hiển thị bằng <img class="background">
   - canvas nằm CHỒNG LÊN TRÊN ảnh đó, trong suốt hoàn toàn
   - Mỗi bong bóng là 1 "khung tròn" vẽ ra đúng vùng ảnh MÀU THẬT
     (backgroundraw.png) tại vị trí tương ứng
   - Bong bóng bay lơ lửng random, né vùng chữ/logo

   PHẦN 2 — STICKER RÁC (mới thêm):
   - 9 vị trí (SLOT) CỐ ĐỊNH theo layout gốc
   - Mỗi lần load trang: random hoán đổi ảnh nào nằm ở slot nào
     (vị trí layout giữ nguyên, chỉ đổi nội dung ảnh)
   - Vẽ TĨNH, nằm DƯỚI lớp bong bóng (bong bóng bay đè lên trên)
   - rot / flipH / flipV mỗi slot: chỉnh trực tiếp trong SLOTS bên dưới

   Dùng chung canvas #bubbleCanvas — KHÔNG cần sửa index.html/style.css
   ========================================================= */

(() => {
  const canvas = document.getElementById("bubbleCanvas");
  const ctx = canvas.getContext("2d");
  const bgImgEl = document.querySelector(".background");

  const rawImage = new Image();
  rawImage.src = "backgroundraw.png";

  // ---------- SPRITE BONG BÓNG (xuất từ Illustrator) ----------
  const SPRITE_PATHS = ["bubble1.png", "bubble2.png", "bubble3.png"];
  const bubbleSprites = [];

  // ---------- CÁC THÔNG SỐ CÓ THỂ CHỈNH (BONG BÓNG) ----------
  const AVOID_SELECTORS = [".header", ".SDG", ".title", ".des", ".quote", ".content-quote", ".letter", ".letteropen", ".mes", ".call", ".pick-up", ".ref-image", ".text-ref", ".RMIT", ".group"];
  const AVOID_PADDING = 22;
  const AVOID_REPEL_MARGIN = 46;
  const AVOID_REPEL_STRENGTH = 90;

  const MIN_RADIUS = 16;
  const MAX_RADIUS = 50;

  const MIN_SPEED = 6;
  const MAX_SPEED = 22;
  const WOBBLE = 1.4;
  const BUOYANCY = 4;

  const FADE_IN_RANGE = [1.2, 2.4];
  const HOLD_RANGE = [1.0, 2.6];
  const FADE_OUT_RANGE = [1.4, 2.6];
  const MAX_OPACITY_RANGE = [0.55, 0.95];

  const BUBBLES_PER_PX2 = 10 / 42000;
  const MIN_BUBBLES = 20;
  const MAX_BUBBLES = 50;

  // ---------------------------------------------------------
  // ---------- CÁC THÔNG SỐ STICKER RÁC (MỚI) ----------
  // ---------------------------------------------------------
  // 1) Danh sách file ảnh — sửa tên cho đúng với file thật của cậu
  const STICKER_FILES = [
    "62.png", // chai nhựa
    "57.png", // nĩa nhỏ
    "63.png", // muỗng
    "16.png", // cua ẩn sĩ + lon
    "44.png", // vòng lục giác (six-pack rings)
    "19.png", // rùa mắc bao nilon
    "65.png", // túi nilon
    "67.png", // lon nước
    "17.png", // chim mắc lưới
    "42.png",
    // "40.png", "42.png", "23.png"  <-- nếu đây là 3 file còn thiếu tên, thêm vào
  ];

  // 2) Slot layout — vị trí % theo ảnh nền (0–1), CỐ ĐỊNH
  //    wFrac: độ rộng sticker theo % chiều rộng ảnh nền
  //    rot: góc xoay (độ) — CHỈNH Ở ĐÂY
  //    flipH/flipV: lật ngang/dọc — CHỈNH true/false Ở ĐÂY
  const STICKER_SLOTS = [
    { id: "A", xFrac: 0.845, yFrac: 0.220, wFrac: 0.16, rot: 0, flipH: false, flipV: false },
    { id: "B", xFrac: 0.153, yFrac: 0.280, wFrac: 0.16, rot: 0, flipH: false, flipV: false },
    { id: "C", xFrac: 0.860, yFrac: 0.319, wFrac: 0.12, rot: 0, flipH: false, flipV: false },
    { id: "D", xFrac: 0.265, yFrac: 0.450, wFrac: 0.14, rot: 0, flipH: false, flipV: false },
    { id: "E", xFrac: 0.760, yFrac: 0.470, wFrac: 0.18, rot: 0, flipH: false, flipV: false },
    { id: "F", xFrac: 0.145, yFrac: 0.567, wFrac: 0.16, rot: 0, flipH: false, flipV: false },
    { id: "G", xFrac: 0.820, yFrac: 0.599, wFrac: 0.20, rot: 0, flipH: false, flipV: false },
    { id: "H", xFrac: 0.133, yFrac: 0.730, wFrac: 0.16, rot: 0, flipH: false, flipV: false },
    { id: "I", xFrac: 0.800, yFrac: 0.720, wFrac: 0.16, rot: 0, flipH: false, flipV: false },
  ];

  let stickerImages = {};
  let stickerAssignment = [];
  let stickersLoaded = false;

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function preloadStickers(cb) {
    stickerAssignment = shuffleArray([...Array(STICKER_FILES.length).keys()]);
    let remaining = STICKER_FILES.length;
    if (remaining === 0) { stickersLoaded = true; cb(); return; }
    STICKER_FILES.forEach((file) => {
      const img = new Image();
      const settle = () => {
        remaining--;
        if (remaining === 0) { stickersLoaded = true; cb(); }
      };
      img.onload = settle;
      img.onerror = () => { console.warn("Không load được sticker:", file); settle(); };
      img.src = file;
      stickerImages[file] = img;
    });
  }

  /* ---------- Vẽ toàn bộ sticker (tĩnh) lên canvas hiện tại ---------- */
  function drawStickers() {
    if (!stickersLoaded) return;
    STICKER_SLOTS.forEach((slot, i) => {
      const file = STICKER_FILES[stickerAssignment[i % stickerAssignment.length]];
      const img = stickerImages[file];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const cx = slot.xFrac * displayWidth;
      const cy = slot.yFrac * displayHeight;
      const targetW = slot.wFrac * displayWidth;
      const scaleF = targetW / img.naturalWidth;
      const targetH = img.naturalHeight * scaleF;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((slot.rot * Math.PI) / 180);
      ctx.scale(slot.flipH ? -1 : 1, slot.flipV ? -1 : 1);
      ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
      ctx.restore();
    });
  }
  // ------------------------------------------------

  let displayWidth = 0;
  let displayHeight = 0;
  let dpr = window.devicePixelRatio || 1;
  let avoidZones = [];
  let bubbles = [];
  let lastTime = 0;
  let ready = false;

  const rand = (min, max) => min + Math.random() * (max - min);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  /* ---------- Đợi ảnh nền + ảnh raw load xong ---------- */
  function whenReady(cb) {
    let count = 0;
    const done = () => { count++; if (count === 2) cb(); };
    if (bgImgEl.complete) done(); else bgImgEl.addEventListener("load", done);
    if (rawImage.complete) done(); else rawImage.addEventListener("load", done);
  }

  /* ---------- Tự động cắt phần trong suốt thừa quanh sprite ---------- */
  function trimTransparentPadding(img) {
    const off = document.createElement("canvas");
    off.width = img.naturalWidth;
    off.height = img.naturalHeight;
    const octx = off.getContext("2d");
    octx.drawImage(img, 0, 0);

    let data;
    try {
      data = octx.getImageData(0, 0, off.width, off.height).data;
    } catch (e) {
      return { sx: 0, sy: 0, sw: off.width, sh: off.height };
    }

    let minX = off.width, minY = off.height, maxX = 0, maxY = 0;
    const ALPHA_THRESHOLD = 10;
    for (let y = 0; y < off.height; y++) {
      for (let x = 0; x < off.width; x++) {
        const alpha = data[(y * off.width + x) * 4 + 3];
        if (alpha > ALPHA_THRESHOLD) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      return { sx: 0, sy: 0, sw: off.width, sh: off.height };
    }

    const contentW = maxX - minX + 1;
    const contentH = maxY - minY + 1;
    const size = Math.max(contentW, contentH) * 1.03;
    const cx = minX + contentW / 2;
    const cy = minY + contentH / 2;

    let sx = cx - size / 2;
    let sy = cy - size / 2;
    sx = clamp(sx, 0, off.width - Math.min(size, off.width));
    sy = clamp(sy, 0, off.height - Math.min(size, off.height));
    const sw = Math.min(size, off.width);
    const sh = Math.min(size, off.height);

    return { sx, sy, sw, sh };
  }

  /* ---------- Load các sprite bong bóng (không bắt buộc phải có) ---------- */
  function preloadSprites(cb) {
    let remaining = SPRITE_PATHS.length;
    if (remaining === 0) { cb(); return; }
    SPRITE_PATHS.forEach((path) => {
      const img = new Image();
      const settle = () => { remaining--; if (remaining === 0) cb(); };
      img.onload = () => {
        const rect = trimTransparentPadding(img);
        bubbleSprites.push({ img, rect });
        settle();
      };
      img.onerror = settle;
      img.src = path;
    });
  }

  /* ---------- Tính lại kích thước canvas + vùng né chữ ---------- */
  function layout() {
    displayWidth = bgImgEl.offsetWidth;
    displayHeight = bgImgEl.offsetHeight;
    dpr = window.devicePixelRatio || 1;

    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = displayWidth + "px";
    canvas.style.height = displayHeight + "px";
    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const canvasRect = canvas.getBoundingClientRect();
    avoidZones = [];
    AVOID_SELECTORS.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        avoidZones.push({
          x1: r.left - canvasRect.left - AVOID_PADDING,
          y1: r.top - canvasRect.top - AVOID_PADDING,
          x2: r.right - canvasRect.left + AVOID_PADDING,
          y2: r.bottom - canvasRect.top + AVOID_PADDING,
        });
      });
    });

    const target = clamp(
      Math.round(displayWidth * displayHeight * BUBBLES_PER_PX2),
      MIN_BUBBLES,
      MAX_BUBBLES
    );
    if (bubbles.length === 0) {
      for (let i = 0; i < target; i++) bubbles.push(makeBubble(true));
    } else {
      while (bubbles.length < target) bubbles.push(makeBubble(true));
      while (bubbles.length > target) bubbles.pop();
      bubbles.forEach((b) => {
        b.x = clamp(b.x, b.r, displayWidth - b.r);
        b.y = clamp(b.y, b.r, displayHeight - b.r);
      });
    }
  }

  function overlapsAvoidZone(x, y, r) {
    for (const z of avoidZones) {
      const closestX = clamp(x, z.x1, z.x2);
      const closestY = clamp(y, z.y1, z.y2);
      const dx = x - closestX;
      const dy = y - closestY;
      if (dx * dx + dy * dy < r * r) return true;
    }
    return false;
  }

  function findSpawnPosition(r) {
    for (let i = 0; i < 24; i++) {
      const x = rand(r, displayWidth - r);
      const y = rand(r, displayHeight - r);
      if (!overlapsAvoidZone(x, y, r)) return { x, y };
    }
    return { x: rand(r, displayWidth - r), y: rand(r, displayHeight - r) };
  }

  /* ---------- Tạo 1 bong bóng mới ---------- */
  function makeBubble(randomAge) {
    const r = rand(MIN_RADIUS, MAX_RADIUS);
    const pos = findSpawnPosition(r);
    const fadeIn = rand(...FADE_IN_RANGE);
    const hold = rand(...HOLD_RANGE);
    const fadeOut = rand(...FADE_OUT_RANGE);

    return {
      x: pos.x,
      y: pos.y,
      r,
      angle: rand(0, Math.PI * 2),
      speed: rand(MIN_SPEED, MAX_SPEED),
      maxOpacity: rand(...MAX_OPACITY_RANGE),
      fadeIn,
      hold,
      fadeOut,
      lifetime: fadeIn + hold + fadeOut,
      age: randomAge ? rand(0, fadeIn + hold + fadeOut) : 0,
      hueShift: rand(0, 360),
      shimmerSeed: rand(0, 1000),
      spriteIndex: bubbleSprites.length
        ? Math.floor(rand(0, bubbleSprites.length))
        : 0,
      rotation: rand(0, Math.PI * 2),
      flipX: Math.random() < 0.5 ? -1 : 1,
      flipY: Math.random() < 0.5 ? -1 : 1,
    };
  }

  function opacityForAge(b) {
    if (b.age < b.fadeIn) {
      const t = b.age / b.fadeIn;
      return easeInOut(t) * b.maxOpacity;
    }
    if (b.age < b.fadeIn + b.hold) {
      return b.maxOpacity;
    }
    const t = (b.age - b.fadeIn - b.hold) / b.fadeOut;
    return (1 - easeInOut(clamp(t, 0, 1))) * b.maxOpacity;
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function updateBubble(b, dt) {
    b.age += dt;
    if (b.age >= b.lifetime) {
      Object.assign(b, makeBubble(false));
      return;
    }

    b.angle += (Math.random() - 0.5) * WOBBLE * dt;

    let vx = Math.cos(b.angle) * b.speed;
    let vy = Math.sin(b.angle) * b.speed - BUOYANCY;

    for (const z of avoidZones) {
      const closestX = clamp(b.x, z.x1, z.x2);
      const closestY = clamp(b.y, z.y1, z.y2);
      let dx = b.x - closestX;
      let dy = b.y - closestY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      const threshold = b.r + AVOID_REPEL_MARGIN;
      if (dist < threshold) {
        const push = (threshold - dist) / threshold;
        vx += (dx / dist) * push * AVOID_REPEL_STRENGTH;
        vy += (dy / dist) * push * AVOID_REPEL_STRENGTH;
      }
    }

    b.x += vx * dt;
    b.y += vy * dt;

    if (b.x < b.r) { b.x = b.r; b.angle = Math.PI - b.angle; }
    if (b.x > displayWidth - b.r) { b.x = displayWidth - b.r; b.angle = Math.PI - b.angle; }
    if (b.y < b.r) { b.y = b.r; b.angle = -b.angle; }
    if (b.y > displayHeight - b.r) { b.y = displayHeight - b.r; b.angle = -b.angle; }

    for (const z of avoidZones) {
      const closestX = clamp(b.x, z.x1, z.x2);
      const closestY = clamp(b.y, z.y1, z.y2);
      let dx = b.x - closestX;
      let dy = b.y - closestY;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < b.r) {
        if (dist < 0.0001) { dx = 1; dy = 0; dist = 1; }
        const need = b.r - dist + 1;
        b.x += (dx / dist) * need;
        b.y += (dy / dist) * need;
      }
    }
  }

  /* ---------- Vẽ 1 bong bóng ---------- */
  function drawBubble(b) {
    const opacity = opacityForAge(b);
    if (opacity <= 0.015) return;

    const { x, y, r } = b;

    const scaleX = rawImage.naturalWidth / displayWidth;
    const scaleY = rawImage.naturalHeight / displayHeight;
    const sx = (x - r) * scaleX;
    const sy = (y - r) * scaleY;
    const sw = r * 2 * scaleX;
    const sh = r * 2 * scaleY;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = opacity;
    ctx.drawImage(rawImage, sx, sy, sw, sh, x - r, y - r, r * 2, r * 2);
    ctx.restore();

    if (bubbleSprites.length) {
      const sprite = bubbleSprites[b.spriteIndex % bubbleSprites.length];
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(x, y);
      ctx.rotate(b.rotation);
      ctx.scale(b.flipX, b.flipY);
      ctx.drawImage(
        sprite.img,
        sprite.rect.sx, sprite.rect.sy, sprite.rect.sw, sprite.rect.sh,
        -r, -r, r * 2, r * 2
      );
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip();

      ctx.globalCompositeOperation = "screen";
      const hi = ctx.createRadialGradient(
        x - r * 0.35, y - r * 0.4, r * 0.05,
        x - r * 0.1, y - r * 0.1, r * 1.05
      );
      hi.addColorStop(0, `rgba(255,255,255,${0.55 * opacity})`);
      hi.addColorStop(0.35, `rgba(255,255,255,${0.15 * opacity})`);
      hi.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hi;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);

      const shimmer = (b.shimmerSeed + performance.now() * 0.00015) % 1;
      const rim = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
      const hue = (b.hueShift + shimmer * 360) % 360;
      rim.addColorStop(0, `hsla(${hue}, 90%, 75%, ${0.22 * opacity})`);
      rim.addColorStop(0.5, `hsla(${(hue + 120) % 360}, 90%, 75%, ${0.10 * opacity})`);
      rim.addColorStop(1, `hsla(${(hue + 240) % 360}, 90%, 75%, ${0.22 * opacity})`);
      ctx.fillStyle = rim;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);

      ctx.restore();

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${0.45 * opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  /* ---------- Vòng lặp hoạt hình ---------- */
  function frame(time) {
    if (!lastTime) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    drawStickers(); // sticker rác vẽ TRƯỚC (tĩnh, nằm dưới)

    for (const b of bubbles) {
      updateBubble(b, dt);
      drawBubble(b); // bong bóng vẽ SAU (động, bay đè lên trên)
    }

    requestAnimationFrame(frame);
  }

  /* ---------- Khởi động ---------- */
  function start() {
    if (ready) return;
    ready = true;
    preloadSprites(() => {
      preloadStickers(() => {
        layout();
        requestAnimationFrame(frame);
      });
    });
  }

  whenReady(start);

  window.addEventListener("load", () => {
    if (ready) layout(); else start();
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { if (ready) layout(); });
  }
  setTimeout(() => { if (ready) layout(); }, 600);

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 150);
  });
})();