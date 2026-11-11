// Bajo Prex transactional mail via Brevo (https://developers.brevo.com/reference/sendtransacemail).
// Fetch-based, no new npm dependency. If BREVO_API_KEY or MAIL_FROM_EMAIL is
// missing, every send is logged and skipped so the signup flow still succeeds
// in dev without real credentials.
//
// Email HTML notes: inline styles, table layout (Outlook-safe), web-safe font
// stacks, body background set at the outer <table>, no external CSS, no <script>.
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const BRAND = 'Bajo Prex';

// Palette lifted from the app: forest (deep trust), bright (CTA), gold (accent),
// bone (surface). Matches the Bajo Prex site so the inbox moment feels native.
const C = {
  forest: '#163300',
  forestDeep: '#0d1f00',
  bright: '#9FE870',
  gold: '#E8B04B',
  bone: '#F6F3EC',
  card: '#FFFFFF',
  ink: '#121212',
  inkSub: '#5A5A5A',
  line: '#EDE8DC',
};

// System serif/sans stack — Bricolage won't load reliably in Gmail/Outlook,
// but these stacks give a near-identical warm feel across modern clients.
const FONT = `"Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif`;
const MONO = `"SF Mono","JetBrains Mono",Menlo,Consolas,"Liberation Mono",monospace`;

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

async function sendMail({ to, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.MAIL_FROM_EMAIL;
  const senderName = process.env.MAIL_FROM_NAME || BRAND;
  if (!apiKey || !senderEmail) {
    console.warn('[mail] BREVO_API_KEY or MAIL_FROM_EMAIL missing — not sending to', to);
    return { skipped: true };
  }
  const res = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject, htmlContent: html, textContent: text,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo ${res.status}: ${body}`);
  }
  return res.json();
}

// Shared shell: preheader (invisible inbox-preview snippet), dark brand header,
// white card, subtle footer. Returns a full HTML document.
function shell({ preheader, header, cardBody, footerNote }) {
  // Brand mark is a styled text monogram, not an inline SVG — Gmail mobile
  // strips <svg> which was leaving the header square empty on phones.
  const mark = `<span style="display:inline-block;width:34px;height:34px;line-height:34px;background:${C.bright};color:${C.forestDeep};border-radius:10px;text-align:center;font-family:${FONT};font-size:17px;font-weight:800;vertical-align:middle;margin-right:12px">Bp</span>`;
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeHtml(header || BRAND)}</title></head>
<body style="margin:0;padding:0;background:${C.bone};-webkit-text-size-adjust:100%;">
<div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px">${escapeHtml(preheader || '')}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bone};padding:28px 16px;width:100%;max-width:100%;border-collapse:collapse">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;margin:0 auto;width:100%;border-collapse:collapse">
      <!-- Dark brand header -->
      <tr><td style="background:${C.forestDeep};border-radius:16px 16px 0 0;padding:20px 24px;color:#fff;font-family:${FONT};font-size:17px;font-weight:700;letter-spacing:-0.01em">
        ${mark}<span style="vertical-align:middle">${BRAND}</span>
      </td></tr>
      <!-- Card body -->
      <tr><td style="background:${C.card};border-radius:0 0 16px 16px;border:1px solid ${C.line};border-top:none;padding:32px 24px;font-family:${FONT};color:${C.ink};font-size:15px;line-height:1.6;word-wrap:break-word">
        ${cardBody}
      </td></tr>
      <!-- Footer -->
      <tr><td style="padding:18px 8px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:#9a9a9a;text-align:center">
        ${footerNote || `Enviado por ${BRAND} · Pagos a tu banco`}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function otpEmail(code) {
  const digits = String(code).padStart(6, '0').split('');
  // Each digit is its own cell. Width is a ceiling (not fixed) so the row
  // reflows comfortably on 320–400px wide screens without horizontal scroll.
  const digitCells = digits.map((d) => `
    <td align="center" valign="middle" style="background:${C.bone};border:1px solid ${C.line};border-radius:10px;font-family:${MONO};font-size:28px;font-weight:700;color:${C.forestDeep};letter-spacing:0;padding:12px 0;width:14%">${escapeHtml(d)}</td>
    <td style="width:6px;font-size:1px;line-height:1px">&nbsp;</td>`).join('').replace(/<td style="width:6px;font-size:1px;line-height:1px">&nbsp;<\/td>\s*$/, '');
  const cardBody = `
    <p style="margin:0 0 4px;font-family:${FONT};color:${C.inkSub};font-size:12px;letter-spacing:0.14em;text-transform:uppercase">Código de confirmación</p>
    <h1 style="margin:0 0 20px;font-family:${FONT};font-size:24px;line-height:1.25;font-weight:800;color:${C.forestDeep};letter-spacing:-0.02em">
      Casi listo — confirma tu correo
    </h1>
    <p style="margin:0 0 28px;color:${C.inkSub};font-size:15px;line-height:1.65">
      Ingresa este código de 6 dígitos en ${BRAND} para terminar de crear tu cuenta. Vence en <strong style="color:${C.ink}">10 minutos</strong>.
    </p>
    <!-- Digit grid: full-width row so it never overflows narrow screens -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;border-collapse:collapse">
      <tr>${digitCells}</tr>
    </table>
    <!-- Divider accent -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px">
      <tr><td style="height:1px;background:${C.line};line-height:1px;font-size:1px">&nbsp;</td></tr>
    </table>
    <p style="margin:0;color:${C.inkSub};font-size:13px;line-height:1.6">
      <span style="display:inline-block;width:8px;height:8px;background:${C.gold};border-radius:50%;vertical-align:1px;margin-right:6px"></span>
      ¿No iniciaste este registro? Puedes ignorar este correo sin problema.
    </p>`;
  return {
    subject: `Tu código de ${BRAND}: ${code}`,
    html: shell({
      preheader: `Tu código de ${BRAND}: ${code} — vence en 10 minutos.`,
      header: BRAND,
      cardBody,
      footerNote: `${BRAND} nunca te pedirá este código por chat, teléfono ni correo.`,
    }),
    text: `Tu código de confirmación de ${BRAND} es ${code}. Vence en 10 minutos. Si no iniciaste este registro, puedes ignorar este correo.`,
  };
}

function welcomeEmail(email) {
  const site = (process.env.FRONTEND_URL || 'http://localhost:3099').replace(/\/+$/, '');
  const safe = escapeHtml(email);
  const cardBody = `
    <p style="margin:0 0 4px;font-family:${FONT};color:${C.inkSub};font-size:12px;letter-spacing:0.14em;text-transform:uppercase">Cuenta creada</p>
    <h1 style="margin:0 0 16px;font-family:${FONT};font-size:28px;line-height:1.2;font-weight:800;color:${C.forestDeep};letter-spacing:-0.02em">
      Bienvenido a ${BRAND}.
    </h1>
    <p style="margin:0 0 24px;color:${C.inkSub};font-size:16px;line-height:1.65">
      Tu cuenta <strong style="color:${C.ink}">${safe}</strong> ya está lista. Desde aquí puedes solicitar pagos a tu cuenta bancaria — nosotros hacemos la transferencia, normalmente en menos de 1 hora.
    </p>
    <!-- Primary CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px">
      <tr><td style="background:${C.bright};border-radius:999px">
        <a href="${site}/dashboard.html" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:700;color:${C.forestDeep};text-decoration:none;letter-spacing:-0.005em">
          Entrar a mi panel &nbsp;&rarr;
        </a>
      </td></tr>
    </table>
    <!-- 3-step mini-guide -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px">
      <tr><td style="padding:16px 18px;background:${C.bone};border-radius:12px;font-family:${FONT};color:${C.ink};font-size:14px;line-height:1.6">
        <p style="margin:0 0 10px;color:${C.inkSub};font-size:12px;letter-spacing:0.12em;text-transform:uppercase">Cómo funciona</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td valign="top" style="width:28px;padding:6px 10px 6px 0;font-family:${MONO};color:${C.gold};font-weight:700;font-size:13px">01</td>
            <td style="padding:6px 0;color:${C.ink};font-size:14px">Ingresa los datos del banco donde quieres recibir tu dinero.</td>
          </tr>
          <tr>
            <td valign="top" style="width:28px;padding:6px 10px 6px 0;font-family:${MONO};color:${C.gold};font-weight:700;font-size:13px">02</td>
            <td style="padding:6px 0;color:${C.ink};font-size:14px">Confirma con el código que te da tu administrador en Telegram.</td>
          </tr>
          <tr>
            <td valign="top" style="width:28px;padding:6px 10px 6px 0;font-family:${MONO};color:${C.gold};font-weight:700;font-size:13px">03</td>
            <td style="padding:6px 0;color:${C.ink};font-size:14px">Nuestro equipo hace la transferencia — en menos de 1 hora.</td>
          </tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:0;color:${C.inkSub};font-size:13px;line-height:1.6">
      ¿Dudas? Responde este correo y te contactamos.
    </p>`;
  return {
    subject: `Bienvenido a ${BRAND}`,
    html: shell({
      preheader: `Tu cuenta ${email} ya está lista. Pagos a tu banco en menos de 1 hora.`,
      header: BRAND,
      cardBody,
      footerNote: `${BRAND} · Pagos comunitarios a tu banco`,
    }),
    text: `Bienvenido a ${BRAND}. Tu cuenta ${email} ya está lista. Entra a ${site}/dashboard.html`,
  };
}

async function sendSignupOtp(to, code) {
  const { subject, html, text } = otpEmail(code);
  return sendMail({ to, subject, html, text });
}

async function sendWelcome(to) {
  const { subject, html, text } = welcomeEmail(to);
  return sendMail({ to, subject, html, text });
}

module.exports = { sendMail, sendSignupOtp, sendWelcome };
