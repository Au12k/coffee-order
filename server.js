// ============================================
//   FOLK & FAIR COFFEE — server.js
//   รันด้วย: node server.js
//   เปิดดูออเดอร์: http://localhost:3000/orders
// ============================================

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT         = process.env.PORT || 3000;
const ORDERS_FILE  = path.join(__dirname, 'orders.json');
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1490187899193262202/g7qUngSfhsCUaG27OC3ERdd6_vY2o3I3ObjJioBa8uOGOL_coTWnnPkWD5tz5Q19nscc';

// ── helpers ──────────────────────────────────
function loadOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    }
  } catch {}
  return [];
}

function saveOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
}

// ── Discord Webhook ───────────────────────────
function notifyDiscord(order) {
  const itemList = order.items.map(i => `• **${i.name}** x${i.qty}  ฿${i.price * i.qty}`).join('\n');
  const payload = JSON.stringify({
    username: '🚗 Folk & Fair Coffee',
    embeds: [{
      title: `📋 ออเดอร์ใหม่ ${order.orderId}`,
      color: 0xF5C800,  // สีเหลือง
      fields: [
        { name: '🛒 รายการ', value: itemList, inline: false },
        { name: '💰 ยอดรวม', value: `฿${order.total}`, inline: true },
        { name: '📝 หมายเหตุ', value: order.notes || '—', inline: true },
      ],
      footer: { text: new Date(order.timestamp).toLocaleString('th-TH') }
    }]
  });

  const url = new URL(DISCORD_WEBHOOK);
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
  };

  const req = https.request(options, res => {
    console.log(`📣 Discord แจ้งเตือน: ${res.statusCode === 204 ? '✅ สำเร็จ' : '❌ ผิดพลาด'}`);
  });
  req.on('error', e => console.error('Discord error:', e.message));
  req.write(payload);
  req.end();
}

// ── dashboard HTML ───────────────────────────
function dashboardHTML(orders) {
  const rows = orders.length === 0
    ? `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#888">ยังไม่มีออเดอร์</td></tr>`
    : [...orders].reverse().map((o, i) => {
        const statusColor = o.status === 'รอทำ' ? '#F5C800' : o.status === 'เสร็จแล้ว' ? '#4CAF50' : '#888';
        const items = o.items.map(it => `${it.name} x${it.qty}`).join(', ');
        return `
          <tr>
            <td><strong>${o.orderId}</strong></td>
            <td>${new Date(o.timestamp).toLocaleString('th-TH')}</td>
            <td style="max-width:220px;font-size:13px">${items}</td>
            <td><strong>฿${o.total}</strong></td>
            <td>
              <span style="background:${statusColor};color:#111;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600">${o.status}</span>
              ${o.status === 'รอทำ'
                ? `<button onclick="updateStatus('${o.orderId}','เสร็จแล้ว')" style="margin-left:6px;padding:3px 10px;border:none;border-radius:20px;background:#4CAF50;color:#fff;font-size:12px;cursor:pointer">✓ เสร็จ</button>`
                : ''}
            </td>
          </tr>`;
      }).join('');

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const pending      = orders.filter(o => o.status === 'รอทำ').length;
  const done         = orders.filter(o => o.status === 'เสร็จแล้ว').length;

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Folk & Fair — Orders</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Sarabun',Arial,sans-serif;background:#1a1612;color:#f0ede8;min-height:100vh}
  .topbar{background:#111;border-bottom:3px solid #F5C800;padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between}
  .topbar h1{font-size:22px;color:#F5C800;letter-spacing:2px}
  .topbar small{color:#888;font-size:12px}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:1.25rem 1.5rem}
  .stat{background:#2a2520;border-radius:12px;padding:1rem;text-align:center}
  .stat .num{font-size:28px;font-weight:700;color:#F5C800}
  .stat .lbl{font-size:12px;color:#888;margin-top:4px}
  .table-wrap{padding:0 1.5rem 2rem;overflow-x:auto}
  table{width:100%;border-collapse:collapse;background:#2a2520;border-radius:12px;overflow:hidden}
  th{background:#111;color:#F5C800;padding:12px 14px;text-align:left;font-size:13px;letter-spacing:1px}
  td{padding:12px 14px;border-bottom:1px solid #3a3530;font-size:14px;vertical-align:middle}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#322d28}
  .refresh{background:#F5C800;color:#111;border:none;padding:8px 18px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer}
  .refresh:hover{background:#C9A300}
  @media(max-width:600px){
    .stats{grid-template-columns:1fr 1fr}
    th:nth-child(3),td:nth-child(3){display:none}
  }
</style>
</head>
<body>
<div class="topbar">
  <h1>🚗 Folk &amp; Fair — Orders</h1>
  <button class="refresh" onclick="location.reload()">↻ รีเฟรช</button>
</div>

<div class="stats">
  <div class="stat"><div class="num">${orders.length}</div><div class="lbl">ออเดอร์ทั้งหมด</div></div>
  <div class="stat"><div class="num" style="color:#ff9">${pending}</div><div class="lbl">รอทำ</div></div>
  <div class="stat"><div class="num" style="color:#4CAF50">${done}</div><div class="lbl">เสร็จแล้ว</div></div>
</div>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>ออเดอร์</th>
        <th>เวลา</th>
        <th>รายการ</th>
        <th>ราคา</th>
        <th>สถานะ</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</div>

<script>
function updateStatus(orderId, status) {
  fetch('/update-status', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({orderId, status})
  }).then(() => location.reload());
}
// auto-refresh ทุก 30 วินาที
setTimeout(() => location.reload(), 30000);
</script>
</body>
</html>`;
}

// ── HTTP server ──────────────────────────────
const server = http.createServer((req, res) => {

  // CORS headers (อนุญาต index.html เรียกได้จาก file://)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204); res.end(); return;
  }

  // ── POST /order — รับออเดอร์ใหม่ ─────────
  if (req.method === 'POST' && req.url === '/order') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const order   = JSON.parse(body);
        const orders  = loadOrders();
        const newOrder = {
          orderId:   order.orderId   || '#ORD-????',
          timestamp: order.timestamp || new Date().toISOString(),
          items:     order.items     || [],
          total:     order.total     || 0,
          notes:     order.notes     || '',
          status:    'รอทำ'
        };
        orders.push(newOrder);
        saveOrders(orders);
        notifyDiscord(newOrder);

        console.log(`✅ ออเดอร์ใหม่: ${newOrder.orderId}  ฿${newOrder.total}`);
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ok: true}));
      } catch (e) {
        res.writeHead(400); res.end('Bad Request');
      }
    });
    return;
  }

  // ── POST /update-status — อัปเดตสถานะ ────
  if (req.method === 'POST' && req.url === '/update-status') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const {orderId, status} = JSON.parse(body);
        const orders = loadOrders();
        const found  = orders.find(o => o.orderId === orderId);
        if (found) { found.status = status; saveOrders(orders); }
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ok: true}));
      } catch {
        res.writeHead(400); res.end('Bad Request');
      }
    });
    return;
  }

  // ── GET /orders — dashboard ───────────────
  if (req.method === 'GET' && req.url === '/orders') {
    const orders = loadOrders();
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
    res.end(dashboardHTML(orders));
    return;
  }

  // ── GET /orders.json — raw data ───────────
  if (req.method === 'GET' && req.url === '/orders.json') {
    const orders = loadOrders();
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify(orders, null, 2));
    return;
  }

  // ── Serve index.html ──────────────────────
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const filePath = path.join(__dirname, 'index.html');
    if (fs.existsSync(filePath)) {
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404); res.end('index.html not found');
    }
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('  🚗 Folk & Fair Coffee — Server');
  console.log('  ─────────────────────────────────');
  console.log(`  🌐 เว็บออเดอร์  : http://localhost:${PORT}`);
  console.log(`  📋 ดูออเดอร์   : http://localhost:${PORT}/orders`);
  console.log(`  📦 raw JSON    : http://localhost:${PORT}/orders.json`);
  console.log('  ─────────────────────────────────');
  console.log('  กด Ctrl+C เพื่อหยุด server');
  console.log('');
});
