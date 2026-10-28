var $ = function (s) { return document.querySelector(s); };
function money(v) { return "$" + v.toLocaleString("es-AR"); }
function coma(n) { return String(n).replace(".", ","); }
function wa(t) { return "https://wa.me/" + TEL + "?text=" + encodeURIComponent(t); }

// Dibuja la pileta vista desde arriba, a escala según las medidas
function pool(m, i) {
  var s = '<svg viewBox="0 0 400 260" role="img" aria-label="Ilustración de ' + m.n + '"><defs>' +
    '<linearGradient id="w' + i + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + m.water + '"/><stop offset="1" stop-color="#1D6FD1"/></linearGradient>' +
    '<pattern id="g' + i + '" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="var(--grass)"/><path d="M2 12l2-6M8 12l1-5" stroke="#000" stroke-opacity=".08" stroke-width="1.5"/></pattern></defs>' +
    '<rect width="400" height="260" fill="url(#g' + i + ')"/>';
  var cx = 200, cy = 135;
  if (m.round) {
    s += '<ellipse cx="200" cy="150" rx="128" ry="22" fill="#000" opacity=".18"/>' +
      '<ellipse cx="200" cy="132" rx="122" ry="96" fill="' + m.rim + '"/>' +
      '<ellipse cx="200" cy="132" rx="104" ry="80" fill="url(#w' + i + ')"/>' +
      '<clipPath id="c' + i + '"><ellipse cx="200" cy="132" rx="104" ry="80"/></clipPath>' + olas(i, 200, 132, 104, 80) + '';
  } else {
    var k = Math.min(300 / m.w, 170 / m.d), rx = m.w * k / 2, ry = m.d * k / 2;
    s += '<rect x="' + (cx - rx + 6) + '" y="' + (cy - ry + 14) + '" width="' + 2 * rx + '" height="' + 2 * ry + '" rx="30" fill="#000" opacity=".18"/>' +
      '<rect x="' + (cx - rx) + '" y="' + (cy - ry) + '" width="' + 2 * rx + '" height="' + 2 * ry + '" rx="30" fill="' + m.rim + '"/>' +
      '<rect x="' + (cx - rx + 14) + '" y="' + (cy - ry + 14) + '" width="' + (2 * rx - 28) + '" height="' + (2 * ry - 28) + '" rx="20" fill="url(#w' + i + ')"/>' +
      '<clipPath id="c' + i + '"><rect x="' + (cx - rx + 14) + '" y="' + (cy - ry + 14) + '" width="' + (2 * rx - 28) + '" height="' + (2 * ry - 28) + '" rx="20"/></clipPath>' + olas(i, cx, cy, rx - 14, ry - 14) +
      '<text x="200" y="' + (cy + ry + 26) + '" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" font-family="Figtree,sans-serif">' + coma(m.w) + ' m × ' + coma(m.d) + ' m</text>';
  }
  return s + '</svg>';
}


// Ondas y reflejo animados dentro del agua (centro cx,cy y medio ancho/alto del agua)
function olas(i, cx, cy, hw, hh) {
  var x0 = cx - hw - 40, w = hw * 2 + 80, o = "";
  [-0.45, 0, 0.45].forEach(function (f, n) {
    var y = cy + hh * f;
    o += '<g class="ola ' + (n % 2 ? 'b' : 'a') + '"><path d="M' + x0 + ' ' + y + 'q' + (w / 8) + ' -12 ' + (w / 4) + ' 0t' + (w / 4) + ' 0t' + (w / 4) + ' 0t' + (w / 4) + ' 0" stroke="#fff" stroke-opacity=".55" stroke-width="3" fill="none"/></g>';
  });
  return '<g clip-path="url(#c' + i + ')">' + o +
    '<rect class="brillo" x="' + (cx - hw - 60) + '" y="' + (cy - hh - 20) + '" width="40" height="' + (hh * 2 + 40) + '" fill="#fff" opacity=".22" transform="skewX(-20)"/></g>';
}

var grid = $("#grid"), sel = $("#sel");
var gp = document.createElement("optgroup"); gp.label = "Piletas"; sel.appendChild(gp);
MODELOS.forEach(function (m, i) {
  var med = m.round ? "Ø " + m.dia + " × " + m.h : coma(m.w) + " × " + coma(m.d) + " m × " + m.h;
  var c = document.createElement("article");
  c.className = "card";
  c.innerHTML = pool(m, i) + '<div class="b">' +
    (m.tag ? '<span class="tag">' + m.tag + '</span>' : '') +
    '<h3>' + m.n + '</h3>' +
    '<dl><dt>Medidas</dt><dd>' + med + '</dd><dt>Material</dt><dd>Fibra de vidrio ultrarreforzada</dd><dt>Instalación</dt><dd>Sin pozo, autoportante</dd></dl>' +
    (m.nota ? '<span class="nota">' + m.nota + '</span>' : '') +
    '<div class="price">' + (m.price ? '<span data-v="' + m.price + '">' + money(m.price) + '</span><small>en efectivo</small>' : 'Consultar<small>precio por WhatsApp</small>') + '</div>' +
    '<a class="btn" href="' + wa("Hola! Me interesa la pileta " + m.n + " (" + med + ")" + (m.price ? " a " + money(m.price) + " en efectivo" : "") + ". ¿Está disponible?") + '" target="_blank" rel="noopener">Consultar este modelo</a></div>';
  grid.appendChild(c);
  var o = document.createElement("option");
  o.textContent = m.n + (m.price ? " — " + money(m.price) : "");
  o.value = m.n;
  gp.appendChild(o);
});

// Servicios
var gs = document.createElement("optgroup"); gs.label = "Servicios"; sel.appendChild(gs);
SERVICIOS.forEach(function (s) {
  var c = document.createElement("article");
  c.className = "card svc";
  c.innerHTML = '<div class="b"><span class="ico" aria-hidden="true">' + s.i + '</span><h3>' + s.t + '</h3><p class="nota">' + s.d + '</p>' +
    '<a class="btn" href="' + wa("Hola! Quiero consultar por el servicio: " + s.t + ".") + '" target="_blank" rel="noopener">Consultar servicio</a></div>';
  $("#srv").appendChild(c);
  var o = document.createElement("option");
  o.textContent = s.t; o.value = s.t; gs.appendChild(o);
});

$("#heroPool").innerHTML = pool(MODELOS[1], 99);

document.querySelectorAll("[data-wa]").forEach(function (a) {
  a.href = wa(a.dataset.wa); a.target = "_blank"; a.rel = "noopener";
});

$("#f").addEventListener("submit", function (e) {
  e.preventDefault();
  var d = new FormData(e.target);
  var t = "Hola! Soy " + d.get("n") + " de " + d.get("l") + ". Quiero coordinar: " + d.get("m") + ".\nForma de pago: " + d.get("p") + ". Envío: " + d.get("e") + "." + (d.get("c") ? "\nComentarios: " + d.get("c") : "");
  window.open(wa(t), "_blank");
});

// ---- Movimiento ----
var quieto = false; // las animaciones están siempre activas; el botón "Movimiento" las apaga

// Burbujas que suben en el fondo
var bub = $("#burbujas");
if (bub && !quieto) {
  for (var n = 0; n < 16; n++) {
    var b = document.createElement("i"), t = 8 + Math.random() * 22;
    b.style.cssText = "left:" + Math.random() * 100 + "%;width:" + t + "px;height:" + t + "px;animation-duration:" + (9 + Math.random() * 10) + "s;animation-delay:-" + Math.random() * 15 + "s";
    bub.appendChild(b);
  }
}

// Entrada al hacer scroll + contador de precios
function contar(el) {
  var fin = +el.dataset.v, ini = performance.now(), dur = 900;
  (function paso(t) {
    var k = Math.min(1, (t - ini) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = money(Math.round(fin * e));
    if (k < 1) requestAnimationFrame(paso);
  })(ini);
}
var io = new IntersectionObserver(function (es) {
  es.forEach(function (e) {
    if (!e.isIntersecting) return;
    e.target.classList.add("ver");
    var p = e.target.querySelector("[data-v]");
    if (p && !quieto) contar(p);
    io.unobserve(e.target);
  });
}, { threshold: 0.15 });
document.querySelectorAll(".card").forEach(function (c, n) {
  c.style.transitionDelay = (n % 3) * 90 + "ms";
  if (quieto) c.classList.add("ver"); else io.observe(c);
});
document.querySelectorAll(".rev").forEach(function (r) { if (quieto) r.classList.add("ver"); else io.observe(r); });

// Inclinación suave de las tarjetas con el mouse
if (!quieto && window.matchMedia("(hover:hover)").matches) {
  document.querySelectorAll(".card").forEach(function (c) {
    c.addEventListener("mousemove", function (e) {
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = "perspective(700px) rotateY(" + x * 7 + "deg) rotateX(" + -y * 7 + "deg) translateY(-4px)";
    });
    c.addEventListener("mouseleave", function () { c.style.transform = ""; });
  });
}

// Botón para apagar / prender el movimiento
var bm = $("#mov");
bm.addEventListener("click", function () {
  var calmo = document.documentElement.classList.toggle("calmo");
  bm.textContent = calmo ? "Movimiento: apagado" : "Movimiento: activado";
  bm.setAttribute("aria-pressed", calmo);
});