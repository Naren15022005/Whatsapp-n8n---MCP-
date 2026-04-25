/*
  scripts/message-generator.js

  Copia todo este contenido y pégalo en un Function Node de n8n, o úsalo
  como módulo en Node (`require`) si lo deseas. El Function Node puede
  llamar directamente a `generarMensaje(lead)`.

  Función principal: generarMensaje(lead)
  Retorna: { mensaje: string, plantilla_id: string }

  Variables esperadas en `lead`:
  - nombre, categoria, ciudad, tiene_web (boolean)
*/
const fs = require('fs');
const path = require('path');

// Ruta donde se guardan/leen los presets generados
const PRESETS_PATH = path.join(__dirname, '..', 'data', 'presets.json');
let presets = null;

function loadPresets() {
  try {
    if (fs.existsSync(PRESETS_PATH)) {
      const raw = fs.readFileSync(PRESETS_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) presets = parsed;
    }
  } catch (e) {
    presets = null;
  }
}

// Intentar cargar presets (si existen)
loadPresets();

// ─── BLOQUE 1: Saludos (mínimo 10 variantes) ──────────────────────────────
const saludos = [
  'Hola {{nombre}} 👋',
  'Buen día {{nombre}}, ¿cómo están?',
  'Hola, soy desarrollador y vi a {{nombre}}.',
  'Buenas {{nombre}} 🙂',
  'Hola {{nombre}} — un saludo.',
  '¡Hola {{nombre}}! ¿Cómo va todo?',
  'Hola {{nombre}}, un gusto saludarlos.',
  'Buen día {{nombre}} 👋 ¿todo bien?',
  'Hola {{nombre}}, espero que estén bien.',
  'Hola equipo de {{nombre}} 👋',
  'Hola {{nombre}}, ¿qué tal?',
  'Buenas tardes {{nombre}}.'
];

// ─── BLOQUE 2: Presentaciones (mínimo 10 variantes) ──────────────────────
const presentaciones = [
  'Soy Alfonsito, desarrollador de software en Santa Marta.',
  'Me dedico a crear sitios y herramientas para negocios locales.',
  'Trabajo con emprendimientos y pymes en la ciudad, haciendo páginas y sistemas simples.',
  'Soy desarrollador y ayudo a negocios como el suyo a conectar más clientes.',
  'Mi trabajo se centra en negocios de {{categoria}} y en mejorar su presencia digital.',
  'Hago sitios web y soluciones para ventas online, pensadas para comercios locales.',
  'Soy de aquí en {{ciudad}} y trabajo con restaurantes y tiendas de la zona.',
  'Me enfoco en soluciones sencillas que facilitan que los clientes los encuentren y compren.',
  'Ayudo a negocios locales a recibir pedidos y consultas por internet.',
  'Construyo herramientas fáciles de usar para mejorar ventas y atención al cliente.',
  'Llevo un tiempo ayudando negocios de {{categoria}} a mejorar su visibilidad.',
  'Trabajo con comercios de la zona para simplificar ventas, reservas y pedidos.'
];

// ─── BLOQUE 3: Contextos (mínimo 10 variantes, con lógica para tiene_web) ─
const contextosGenerales = [
  'Vi que son un {{categoria}} en {{ciudad}} y pensé en cómo mejorar su llegada a clientes.',
  'Noté su negocio y quería preguntarles sobre su presencia digital.',
  'He trabajado con comercios similares y he visto buenos resultados con pequeños ajustes.',
  'Cada vez más clientes buscan por internet antes de comprar; por eso quería consultarlos.',
  'Quería saber si reciben pedidos o consultas por WhatsApp o redes.',
  'Me llamó la atención su actividad y quería comentarles una idea práctica.'
];

const contextosConWeb = [
  'Vi su página y creo que con pequeños cambios podría convertir más visitas en clientes.',
  'Su web ya existe; con algunos ajustes se puede mejorar la forma en que llegan pedidos.',
  'La página está bien; hay oportunidades para facilitar pedidos y contacto desde WhatsApp.',
  'Su sitio me dio una idea rápida de mejoras que podrían aumentar consultas.'
];

const contextosSinWeb = [
  'No encontré una página web suya; eso suele ser una oportunidad para captar más clientes online.',
  'Si no tienen web, es frecuente que pierdan clientes que buscan por internet.',
  'Sin una web clara es más difícil aparecer en búsquedas locales; se puede resolver con algo simple.',
  'Una página sencilla ayuda a mostrar menú, horarios y recibir pedidos.'
];

// ─── BLOQUE 4: Propuestas / Preguntas de cierre (mínimo 10 variantes) ─────
const propuestas = [
  '¿Actualmente tienen alguna forma para recibir pedidos online o reservas?',
  '¿Te interesa que le eche un vistazo rápido a su web y te diga mejoras?',
  '¿Cómo gestionan hoy las consultas y pedidos de clientes?',
  '¿Quisieras que agendemos una breve llamada para mostrar ideas?',
  '¿Puedo enviarles un ejemplo rápido de cómo podría verse su página?',
  '¿Les interesa mejorar la forma en que los clientes los encuentran online?',
  '¿Prefieres que te escriba un pequeño plan por WhatsApp para revisar?',
  '¿En qué horario les viene bien para hablar 5 minutos?',
  '¿Te gustaría que te muestre ejemplos de negocios similares que he ayudado?',
  '¿Puedo enviar una captura con una propuesta breve?',
  '¿Les parece si les envío 2 ideas rápidas por aquí?',
  '¿Quieren que les comparta un ejemplo real que mejoró ventas?' 
];

// ─── FUNCIÓN AUXILIAR: elegir elemento aleatorio (devuelve item e índice) ───
function aleatorio(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return { item: '', index: -1 };
  const index = Math.floor(Math.random() * arr.length);
  return { item: arr[index], index };
}

// ─── FUNCIÓN AUXILIAR: reemplazar variables en plantillas ───────────────────
function reemplazarVariables(texto, lead) {
  if (!texto) return '';
  lead = lead || {};
  const nombre = lead.nombre || '';
  const categoria = lead.categoria || '';
  const ciudad = lead.ciudad || '';
  const tiene_web = lead.tiene_web ? 'Sí' : 'No';

  return texto
    .replace(/{{\s*nombre\s*}}/gi, nombre)
    .replace(/{{\s*categoria\s*}}/gi, categoria)
    .replace(/{{\s*ciudad\s*}}/gi, ciudad)
    .replace(/{{\s*tiene_web\s*}}/gi, tiene_web)
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── FUNCIÓN AUXILIAR: limitar emojis a un máximo (simple) ────────────────
const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
function limitarEmojis(texto, max) {
  try {
    const matches = texto.match(emojiRegex) || [];
    if (matches.length <= max) return texto;
    // eliminar todos los emojis y volver a insertar los primeros `max` después del primer bloque
    const cleaned = texto.replace(emojiRegex, '');
    const insertPos = cleaned.indexOf('\n') !== -1 ? cleaned.indexOf('\n') : cleaned.length;
    const prefix = cleaned.slice(0, insertPos).trim();
    const rest = cleaned.slice(insertPos).trim();
    const keep = matches.slice(0, max).join('');
    return (prefix + (keep ? ' ' + keep : '') + (rest ? '\n' + rest : '')).trim();
  } catch (e) {
    return texto;
  }
}

// ─── FUNCIÓN PRINCIPAL: generarMensaje(lead, options) ───────────────────────
// options: { usePresets: true|false }
function generarMensaje(lead, options) {
  lead = lead || {};
  options = options || {};

  // normalizar claves comunes
  if (!lead.nombre && lead.nombre_negocio) lead.nombre = lead.nombre_negocio;

  // Si hay presets cargados y el usuario quiere usarlos, elegir uno al azar
  if (presets && Array.isArray(presets) && presets.length >= 1000 && options.usePresets) {
    const idx = Math.floor(Math.random() * presets.length);
    const raw = presets[idx] || '';
    let mensaje = reemplazarVariables(raw, lead);
    mensaje = limitarEmojis(mensaje, 2);

    // Métricas
    const emojiMatches = (mensaje.match(emojiRegex) || []);
    const emoji_count = emojiMatches.length;
    const longitud = mensaje.length;
    const line_count = mensaje.split('\n').length;
    const word_count = mensaje.replace(/\n/g, ' ').trim().split(/\s+/).filter(Boolean).length;

    return { mensaje, plantilla_id: `PRESET-${idx}`, longitud, emoji_count, line_count, word_count };
  }

  // Si no usamos presets, volver al generador dinámico original
  const s = aleatorio(saludos);
  const p = aleatorio(presentaciones);

  // contextos según tiene_web
  const poolContextos = [].concat(contextosGenerales)
    .concat(lead.tiene_web ? contextosConWeb : contextosSinWeb);
  const c = aleatorio(poolContextos);

  const pr = aleatorio(propuestas);

  // Reemplazos
  const saludoText = reemplazarVariables(s.item, lead);
  const presentacionText = reemplazarVariables(p.item, lead);
  const contextoText = reemplazarVariables(c.item, lead);
  let propuestaText = reemplazarVariables(pr.item, lead);

  // Asegurar que la propuesta termina en ?
  propuestaText = propuestaText.trim();
  if (!propuestaText.endsWith('?')) propuestaText = propuestaText.replace(/[.\s]*$/, '') + '?';

  // Decidir número de líneas (2..4)
  const targetLines = Math.floor(Math.random() * 3) + 2; // 2,3 o 4
  let lines = [];

  if (targetLines === 4) {
    lines = [saludoText, presentacionText, contextoText, propuestaText];
  } else if (targetLines === 3) {
    // combinar presentacion + contexto o contexto + propuesta
    if (Math.random() < 0.6) {
      lines = [saludoText, presentacionText + ' ' + contextoText, propuestaText];
    } else {
      lines = [saludoText, presentacionText, contextoText + ' ' + propuestaText];
    }
  } else { // 2 líneas
    lines = [saludoText, presentacionText + ' ' + contextoText + ' ' + propuestaText];
  }

  // Limpiar y unir con saltos de línea naturales
  lines = lines.map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  let mensaje = lines.join('\n');

  // Limitar emojis a máximo 2
  mensaje = limitarEmojis(mensaje, 2);

  // Asegurar que el mensaje termina con una sola pregunta en la última línea
  const partes = mensaje.split('\n');
  const last = partes[partes.length - 1].trim();
  if (!/[?¿]$/.test(last)) {
    partes[partes.length - 1] = last + ' ?';
  }
  mensaje = partes.join('\n').replace(/\s+\?/g, '?').trim();

  // Métricas y conteos
  const emojiMatches = (mensaje.match(emojiRegex) || []);
  const emoji_count = emojiMatches.length;
  const longitud = mensaje.length;
  const line_count = mensaje.split('\n').length;
  const word_count = mensaje.replace(/\n/g, ' ').trim().split(/\s+/).filter(Boolean).length;

  // Generar plantilla id (1-based)
  const plantilla_id = `S${s.index + 1}-P${p.index + 1}-C${c.index + 1}-PR${pr.index + 1}`;

  return { mensaje, plantilla_id, longitud, emoji_count, line_count, word_count };
}

// Exportar si está en entorno CommonJS (opcional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generarMensaje,
    templates: {
      saludos,
      presentaciones,
      contextosGenerales,
      contextosConWeb,
      contextosSinWeb,
      propuestas
    },
    PRESETS_PATH,
    loadPresets
  };
}

// Fin del archivo
