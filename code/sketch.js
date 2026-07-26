/* ===================================================================
   1) SCALE ARTBOARD 1920x1080 PHỦ KÍN MÀN HÌNH (COVER), KHÔNG VIỀN ĐEN
   - Dùng Math.max thay vì Math.min => khung sẽ được scale đủ lớn để
     phủ kín toàn bộ chiều rộng VÀ chiều cao màn hình (giống CSS
     "background-size: cover"), nên KHÔNG còn viền đen 2 bên.
   - Đánh đổi: nếu tỉ lệ màn hình quá lệch so với 16:9 (vd màn hình
     ultrawide, hoặc điện thoại dọc), phần rìa trên/dưới hoặc trái/phải
     của thiết kế sẽ bị cắt bớt (do overflow:hidden ở .artboard), thay
     vì hiện viền đen. Đây là cách duy nhất để phủ kín 100% mà không méo.
=================================================================== */
const ARTBOARD_WIDTH = 1920;
const ARTBOARD_HEIGHT = 1080;
 
function fitArtboardToScreen() {
  const artboard = document.querySelector('.artboard');
  if (!artboard) return;
  const scale = Math.max(
    window.innerWidth / ARTBOARD_WIDTH,
    window.innerHeight / ARTBOARD_HEIGHT
  );
  artboard.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
window.addEventListener('DOMContentLoaded', fitArtboardToScreen);
window.addEventListener('resize', fitArtboardToScreen);
 
 
const ASSET_PATH = '../edited-media/';

// Tên file Plasticback -- CẦN GIỐNG HỆT tên file thật trong thư mục
// edited-media (kể cả hoa/thường), vì code sẽ dùng file này để "đọc"
// hình dạng bao nhựa (xem mục 3 bên dưới).
const PLASTICBACK_FILE = 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Plastic-back-edited.png';
 
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
 
 
/* ===================================================================
   2) RANDOM ZIPPER (1/3) + RANDOM BỘ QUOTE-CTA-PARAGRAPH (1/3, đi chung)
=================================================================== */
const ZIPPER_VARIANTS = ['COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Zipper-edited.png', 
  'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Zipper-2-edited.png', 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Zipper-3-edited.png'];
 
// 3 bộ card luôn đi chung: quote/CTA/paragraph cùng số thứ tự
const CARD_SETS = [
  { cta: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-CTA-edited.png',  paragraph: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Paragraph-edited.png',  quote: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Quote-edited.png' },
  { cta: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-CTA-2-edited.png', paragraph: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Paragraph-2-edited.png', quote: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Quote-2-edited.png' },
  { cta: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-CTA-3-edited.png', paragraph: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Paragraph-3-edited.png', quote: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Quote-3-edited.png' },
];
 
function setupZipperAndCardSet() {
  const zipperImg = document.querySelector('.zipper');
  if (zipperImg) {
    zipperImg.src = ASSET_PATH + pickRandom(ZIPPER_VARIANTS);
  }
 
  const set = pickRandom(CARD_SETS);
  const cta = document.getElementById('cardCTA');
  const paragraph = document.getElementById('cardParagraph');
  const quote = document.getElementById('cardQuote');
  if (cta) cta.src = ASSET_PATH + set.cta;
  if (paragraph) paragraph.src = ASSET_PATH + set.paragraph;
  if (quote) quote.src = ASSET_PATH + set.quote;
}
 
 
/* ===================================================================
   3) RANDOM TRANG TRÍ TRONG KHUNG "PLASTIC" (8/21 element)
   - Vị trí hợp lệ được xác định bằng cách đọc alpha-channel THẬT của
     Plasticback, nên dù bao nhựa có hình dạng nghiêng/bất định thế
     nào, element trang trí luôn nằm đúng bên trong bao.
   - THUẬT TOÁN MỚI (grid-based) để element dàn đều & cân bằng:
     Chia vùng bên trong Plasticback thành 1 LƯỚI Ô đều nhau, số ô >=
     số element cần đặt. Mỗi element được gán vào 1 ô riêng (rải đều
     theo lưới), rồi mới random jitter vị trí trong ô đó => tự nhiên
     dàn đều khắp khung, không bị dồn cụm 1 chỗ / trống 1 chỗ như random
     thuần trước đây.
   - Không được đè quá sâu lên Quote/CTA/Paragraph: thay vì cấm tuyệt
     đối "lõi giữa" card, giờ tính % DIỆN TÍCH của chính element đè lên
     card - chỉ cho phép tối đa MAX_CARD_OVERLAP_RATIO (mặc định 1%)
     diện tích của nó chồng lên card, nghĩa là chỉ được chạm rìa/góc
     ngoài chứ không lấn vào phần thông tin ở giữa.
   - Không được dính/chồng lên nhau (MIN_GAP).
=================================================================== */
 
// 21 element, gom theo "base" để không random trùng loại
// (vd lon-1/lon-2/lon-3 cùng base "lon" chỉ được chọn tối đa 1).
const decorationPool = [
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Boc-edited.png',          base: 'boc' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Cau-edited.png',          base: 'cau' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Chai-Nhua-edited.png',    base: 'chai-nhua' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Chai-Nhua-2-edited.png',  base: 'chai-nhua' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Binh-edited.png',         base: 'binh' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Hop-edited.png',          base: 'hop' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Hop-2-edited.png',        base: 'hop' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Hop-3-edited.png',        base: 'hop' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Lon-1-edited.png',        base: 'lon' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Lon-2-edited.png',        base: 'lon' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Lon-3-edited.png',        base: 'lon' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Muong-edited.png',        base: 'muong' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Nia-edited.png',          base: 'nia' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Nia-2-edited.png',        base: 'nia' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Oc-edited.png',           base: 'oc' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Oc-2-edited.png',          base: 'oc' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Qua-edited.png',          base: 'qua' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-To-edited.png',           base: 'to' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Rac-edited.png',          base: 'rac' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Rua-edited.png',          base: 'rua' },
  { file: 'COMM2754-2026-S4012478-A1w04-A-Drowning-Paradise-Rua-2-edited.png',        base: 'rua' },
];
 
const DECOR_COUNT = 8;              // số element random mỗi lần reload
const DECOR_MIN_SIZE = 90;          // kích thước hiển thị nhỏ nhất (px trên canvas 1920x1080)
const DECOR_MAX_SIZE = 150;         // kích thước hiển thị lớn nhất
const MIN_GAP = 16;                 // khoảng cách tối thiểu giữa 2 element, tránh dính nhau
const MAX_CARD_OVERLAP_RATIO = 0.3; // cho phép đè NHẸ lên rìa card (tối đa 30% diện tích chính nó), giống kiểu "nĩa" chỉ chạm góc/mép - không cho phép đè sâu che chữ ở giữa
const MAX_ATTEMPTS = 120;           // số lần thử random vị trí trong 1 ô lưới cho mỗi element
const CELL_PADDING = 8;             // chừa lề nhỏ trong mỗi ô lưới để element không dính mép ô
 
// ---------- Helper: load ảnh ----------
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không load được ảnh: ' + src));
    img.src = src;
  });
}
 
// ---------- Helper: vẽ ảnh lên canvas ẩn để đọc alpha ----------
function getAlphaData(img) {
  const canvas = document.createElement('canvas');
  canvas.width = ARTBOARD_WIDTH;
  canvas.height = ARTBOARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, ARTBOARD_WIDTH, ARTBOARD_HEIGHT);
  return ctx.getImageData(0, 0, ARTBOARD_WIDTH, ARTBOARD_HEIGHT).data;
}
 
function alphaAt(data, x, y) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= ARTBOARD_WIDTH || y >= ARTBOARD_HEIGHT) return 0;
  return data[(y * ARTBOARD_WIDTH + x) * 4 + 3];
}
 
// Tính bounding box của vùng không trong suốt (sample lưới cho nhanh)
function computeAlphaBBox(data, step = 4) {
  let minX = ARTBOARD_WIDTH, minY = ARTBOARD_HEIGHT, maxX = 0, maxY = 0;
  let found = false;
  for (let y = 0; y < ARTBOARD_HEIGHT; y += step) {
    for (let x = 0; x < ARTBOARD_WIDTH; x += step) {
      if (alphaAt(data, x, y) > 20) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) return { x: 0, y: 0, width: ARTBOARD_WIDTH, height: ARTBOARD_HEIGHT };
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
 
function rectsOverlap(a, b) {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}
 
// Diện tích phần giao nhau giữa 2 rect (0 nếu không chạm nhau)
function rectIntersectionArea(a, b) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  if (x2 <= x1 || y2 <= y1) return 0;
  return (x2 - x1) * (y2 - y1);
}
 
function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
 
// Chọn ngẫu nhiên DECOR_COUNT element, không trùng "base"
function pickRandomDecorations() {
  const shuffled = shuffle(decorationPool);
  const chosen = [];
  const usedBase = new Set();
  for (const item of shuffled) {
    if (chosen.length >= DECOR_COUNT) break;
    if (usedBase.has(item.base)) continue;
    usedBase.add(item.base);
    chosen.push(item);
  }
  return chosen;
}
 
// ---------- Chia vùng plasticBBox thành lưới ô đều nhau ----------
// Trả về mảng cell {x,y,width,height}, số lượng >= count, được chọn
// rải đều (evenly spaced) trong toàn bộ lưới để phủ đều mọi khu vực.
function buildEvenGridCells(bbox, count) {
  const aspect = bbox.width / Math.max(1, bbox.height);
  // Chọn số cột/hàng sao cho ô gần vuông nhất có thể với đúng "count" ô
  let cols = Math.max(1, Math.round(Math.sqrt(count * aspect)));
  let rows = Math.ceil(count / cols);
  // Nếu lưới dư quá nhiều ô so với count, thu nhỏ cols/rows lại gần count hơn
  while (cols * rows - count >= cols && cols > 1) {
    cols -= 1;
    rows = Math.ceil(count / cols);
  }
 
  const cellW = bbox.width / cols;
  const cellH = bbox.height / rows;
  const allCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      allCells.push({
        x: bbox.x + c * cellW,
        y: bbox.y + r * cellH,
        width: cellW,
        height: cellH,
      });
    }
  }
 
  // Chọn ra đúng "count" ô, rải đều theo chỉ số (evenly spaced index)
  // để không bị dồn hết về 1 phía nếu allCells.length > count.
  const total = allCells.length;
  const picked = [];
  const usedIdx = new Set();
  for (let i = 0; i < count; i++) {
    let idx = Math.floor((i * total) / count);
    while (usedIdx.has(idx) && usedIdx.size < total) {
      idx = (idx + 1) % total;
    }
    usedIdx.add(idx);
    picked.push(allCells[idx]);
  }
  return shuffle(picked);
}
 
async function setupRandomDecorations() {
  const behindLayer = document.getElementById('decorBehind');
  const frontLayer = document.getElementById('decorFront');
  const cardCTA = document.getElementById('cardCTA');
  const cardParagraph = document.getElementById('cardParagraph');
  const cardQuote = document.getElementById('cardQuote');
  if (!behindLayer || !frontLayer) return;
 
  // Xoá kết quả cũ (phòng khi hàm được gọi lại)
  behindLayer.innerHTML = '';
  frontLayer.innerHTML = '';

  let plasticbackImg, ctaImg, paraImg, quoteImg;
  try {
    // 1) Đọc alpha của Plasticback để biết vùng "trong bao"
    plasticbackImg = await loadImage(ASSET_PATH + PLASTICBACK_FILE);

    // 2) Đọc alpha của Quote/CTA/Paragraph (đã được random ở bước trước
    //    đó) để biết vùng của card (dùng để tính % overlap cho phép)
    [ctaImg, paraImg, quoteImg] = await Promise.all([
      loadImage(cardCTA.getAttribute('src')),
      loadImage(cardParagraph.getAttribute('src')),
      loadImage(cardQuote.getAttribute('src')),
    ]);
  } catch (err) {
   
    console.error('[Trang trí] Không load được ảnh cần thiết:', err.message);
    console.error('[Trang trí] Kiểm tra lại tên file trong thư mục edited-media có khớp CHÍNH XÁC (kể cả hoa/thường) với PLASTICBACK_FILE / CARD_SETS trong sketch.js.');
    return;
  }

  const plasticData = getAlphaData(plasticbackImg);
  const plasticBBox = computeAlphaBBox(plasticData);
  // Nới rộng bbox của mỗi card thêm CARD_GAP mỗi phía, để element trang trí
  // không chỉ "không đè" mà còn có khoảng cách thật với card (không chạm mép).
  const CARD_GAP = MIN_GAP;
  const cardBBoxes = [
    computeAlphaBBox(getAlphaData(ctaImg)),
    computeAlphaBBox(getAlphaData(paraImg)),
    computeAlphaBBox(getAlphaData(quoteImg)),
  ].map(b => ({
    x: b.x - CARD_GAP,
    y: b.y - CARD_GAP,
    width: b.width + CARD_GAP * 2,
    height: b.height + CARD_GAP * 2,
  }));
 
  const chosen = pickRandomDecorations();
  const cells = buildEvenGridCells(plasticBBox, chosen.length);
  const placedRects = [];

  function renderDecor(item, rect, size, forceBehind) {
    const el = document.createElement('img');
    el.src = ASSET_PATH + item.file;
    el.className = 'decor-item';
    el.style.left = rect.x + 'px';
    el.style.top = rect.y + 'px';
    el.style.width = size + 'px';
    el.style.height = 'auto';

    // forceBehind = true: vị trí này đè khá sâu lên card (fallback), nên
    // BẮT BUỘC nằm ở lớp "decorBehind" (dưới Quote/CTA/Paragraph trong
    // DOM) để phần đè lên bị card che khuất, không lộ ra đè lên chữ.
    const layer = forceBehind ? behindLayer : (Math.random() < 0.5 ? behindLayer : frontLayer);
    layer.appendChild(el);
  }

  // Thử tìm vị trí cho 1 kích thước "size" bên trong 1 vùng "region"
  // (có thể là 1 ô lưới, hoặc toàn bộ khung nhựa). Luôn nằm trong bao
  // nhựa và không dính/chồng lên element khác đã đặt. Trả về:
  //   - clean: rect "sạch" (đè lên card <= MAX_CARD_OVERLAP_RATIO) nếu tìm được
  //   - fallback: rect có % đè lên card THẤP NHẤT từng thấy (dù vượt mức cho
  //     phép), để dùng khi không tìm được vị trí "sạch" nào - KHÔNG bao giờ
  //     bỏ hẳn element, nhưng luôn ưu tiên vị trí đè ít nhất có thể.
  function searchRect(region, size) {
    const innerX = region.x + CELL_PADDING;
    const innerY = region.y + CELL_PADDING;
    const innerW = Math.max(1, region.width - CELL_PADDING * 2 - size);
    const innerH = Math.max(1, region.height - CELL_PADDING * 2 - size);

    let fallback = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const x = innerX + Math.random() * innerW;
      const y = innerY + Math.random() * innerH;
      const rect = { x, y, width: size, height: size };

      // (a) Cả 4 góc + tâm phải nằm trong vùng không-trong-suốt của Plasticback
      const checkPoints = [
        [x, y], [x + size, y], [x, y + size], [x + size, y + size],
        [x + size / 2, y + size / 2],
      ];
      const insidePlastic = checkPoints.every(([px, py]) => alphaAt(plasticData, px, py) > 20);
      if (!insidePlastic) continue;

      // (b) Không dính/chồng lên element đã đặt trước đó - điều kiện BẮT
      // BUỘC dù là vị trí sạch hay fallback, để các món không đè lên nhau.
      const withGap = {
        x: rect.x - MIN_GAP, y: rect.y - MIN_GAP,
        width: rect.width + MIN_GAP * 2, height: rect.height + MIN_GAP * 2,
      };
      const overlapsPlaced = placedRects.some(p => rectsOverlap(withGap, p));
      if (overlapsPlaced) continue;

      // (c) % diện tích đè lên Quote/CTA/Paragraph
      const rectArea = rect.width * rect.height;
      const worstOverlapRatio = cardBBoxes.reduce((maxR, c) => {
        return Math.max(maxR, rectIntersectionArea(rect, c) / rectArea);
      }, 0);

      if (worstOverlapRatio <= MAX_CARD_OVERLAP_RATIO) {
        // Đủ "sạch" (chạm rìa/góc nhẹ giống kiểu "nĩa") -> dùng luôn
        return { clean: rect, fallback: null };
      }

      // Vượt mức cho phép -> chỉ giữ lại làm fallback nếu đây là vị trí
      // đè lên card ÍT NHẤT trong số các lần thử.
      if (!fallback || worstOverlapRatio < fallback.ratio) {
        fallback = { rect, ratio: worstOverlapRatio };
      }
    }
    return { clean: null, fallback };
  }

  for (let i = 0; i < chosen.length; i++) {
    const item = chosen[i];
    const cell = cells[i];
    // Kích thước element bị giới hạn thêm bởi kích thước ô, để không
    // tràn lố sang ô bên cạnh và giữ khoảng cách đều nhau.
    const maxByCell = Math.max(DECOR_MIN_SIZE, Math.min(cell.width, cell.height) - MIN_GAP);
    const sizeCeil = Math.min(DECOR_MAX_SIZE, maxByCell);
    const sizeFloor = Math.min(DECOR_MIN_SIZE, sizeCeil);
    const size = sizeFloor + Math.random() * Math.max(0, sizeCeil - sizeFloor);

    // 1) Thử trong ô lưới được gán trước
    const inCell = searchRect(cell, size);

    // 2) Nếu ô lưới không có chỗ "sạch", MỞ RỘNG tìm kiếm ra toàn bộ
    // khung nhựa - biết đâu có ô khác trống hoàn toàn để dùng thay vì
    // phải đè lên card.
    const inWhole = inCell.clean ? null : searchRect(plasticBBox, size);

    // 3) Chọn vị trí cuối: ưu tiên "sạch" (ô lưới trước, cả khung sau),
    // nếu không có "sạch" nào thì lấy fallback đè ÍT NHẤT trong 2 lần
    // tìm - KHÔNG BAO GIỜ bỏ qua element. Vị trí fallback sẽ được ép
    // nằm DƯỚI Quote/CTA/Paragraph (xem renderDecor) để phần đè lên
    // bị che khuất, thay vì lộ ra đè lên chữ.
    let rect = inCell.clean || (inWhole && inWhole.clean);
    let isFallback = false;
    if (!rect) {
      const fbCell = inCell.fallback;
      const fbWhole = inWhole ? inWhole.fallback : null;
      const best = [fbCell, fbWhole].filter(Boolean).sort((a, b) => a.ratio - b.ratio)[0];
      rect = best ? best.rect : null;
      isFallback = true;
    }

    if (rect) {
      placedRects.push(rect);
      renderDecor(item, rect, size, isFallback);
    }
  }
}
 
window.addEventListener('DOMContentLoaded', async () => {
  setupZipperAndCardSet();
  await setupRandomDecorations();
});