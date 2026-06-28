/* AfriTrust — i18n (Spanish default, English optional) */
(function () {
  const LANG_KEY = 'afritrust_lang';

  const T = {
    /* ── NAVBAR ── */
    'nav-how':      { es: 'Cómo funciona',     en: 'How it works' },
    'nav-why':      { es: 'Por qué AfriTrust', en: 'Why AfriTrust' },
    'nav-faq':      { es: 'Preguntas',         en: 'FAQ' },
    'nav-login':    { es: 'Iniciar sesión',    en: 'Login' },
    'nav-register': { es: 'Registrarse',       en: 'Register' },
    'nav-withdraw': { es: 'Solicitar retiro',  en: 'Request a withdrawal' },

    /* ── HERO ── */
    'hero-eyebrow': { es: 'Pagos bancarios',   en: 'Bank payouts' },
    'hero-title': {
      es: 'Recibe tu pago,<br>directo a tu banco.',
      en: 'Get paid,<br>straight to your bank.',
    },
    'hero-sub': {
      es: 'AfriTrust envía tu pago a cualquier cuenta bancaria. Ingresa tus datos bancarios, confírmalo con un código de tu administrador de Telegram y nuestro equipo transfiere tu dinero — normalmente en menos de 24 horas.',
      en: 'AfriTrust sends your payout to any bank account. Enter your bank details, confirm it\'s you with a code from your Telegram admin, and our team transfers your money — usually within 24 hours.',
    },
    'hero-btn-withdraw': { es: 'Solicitar retiro', en: 'Request a withdrawal' },
    'hero-btn-how':      { es: 'Ver cómo funciona', en: 'See how it works' },
    'hero-trust-text':   { es: 'Con la confianza de miembros en 14 países africanos', en: 'Trusted by members across 14 African countries' },

    /* ── HERO CARD (visual) ── */
    'card-chip':     { es: 'Verificado',          en: 'Verified' },
    'card-tag':      { es: 'Solicitud de retiro', en: 'Withdrawal request' },
    'card-bank-lbl': { es: 'Banco',               en: 'Bank' },
    'card-name-lbl': { es: 'Nombre de cuenta',    en: 'Account name' },
    'card-num-lbl':  { es: 'Número de cuenta',    en: 'Account number' },
    'card-code-lbl': { es: 'Código de confirmación', en: 'Confirmation code' },
    'card-confirm':  { es: 'Confirmar y enviar',  en: 'Confirm & submit' },

    /* ── TRUST STRIP ── */
    'trust-paid-label':    { es: 'Pagado a miembros',      en: 'Paid out to members' },
    'trust-members-label': { es: 'Miembros pagados',       en: 'Members paid' },
    'trust-time-value':    { es: 'Menos de 24h',           en: 'Under 24h' },
    'trust-time-label':    { es: 'Tiempo típico de pago',  en: 'Typical payout time' },

    /* ── HOW IT WORKS ── */
    'how-eyebrow': { es: 'Cómo funciona',           en: 'How it works' },
    'how-title':   { es: 'Tres pasos para tu pago', en: 'Three steps to your payout' },
    'how-sub': {
      es: 'En AfriTrust nunca se te cobra nada. Nos dices dónde enviar tu dinero, confirmas que eres tú y te pagamos.',
      en: 'No payment is ever taken on AfriTrust. You tell us where to send your money, confirm it\'s you, and we pay you.',
    },
    'step1-title': { es: 'Ingresa tus datos bancarios', en: 'Enter your bank details' },
    'step1-desc':  { es: 'Agrega la cuenta bancaria a la que quieres que te paguen — nombre, número, banco y monto.', en: 'Add the bank account you want paid — account name, number, bank and the amount.' },
    'step2-title': { es: 'Confirma con tu código',      en: 'Confirm with your code' },
    'step2-desc':  { es: 'Tu administrador de Telegram te envía un código de un solo uso que confirma que eres miembro.', en: 'Your Telegram admin sends you a one-time code that confirms you\'re a member.' },
    'step3-title': { es: 'Recibe tu pago',              en: 'Get paid' },
    'step3-desc':  { es: 'Nuestro equipo revisa tu solicitud verificada y transfiere el dinero a tu banco.', en: 'Our team reviews your verified request and transfers the money to your bank.' },

    /* ── ASSURANCES BAND ── */
    'assur-eyebrow': { es: 'Construido en confianza', en: 'Built on trust' },
    'assur-title': {
      es: 'Tus datos son <span class="accent">privados hasta que se confirma que eres tú</span>',
      en: 'Your details stay <span class="accent">private until it\'s you</span>',
    },
    'assur-sub': {
      es: 'AfriTrust nunca te pide pagar nada. Solo mostramos tus datos bancarios a nuestro equipo de pagos después de que tu código de comunidad confirma que realmente eres tú.',
      en: 'AfriTrust never asks you to pay anything. We only show your bank details to our payout team after your community code confirms it\'s really you.',
    },
    'assur-1-title': { es: 'Nunca pagas una tarifa aquí', en: 'You never pay a fee here' },
    'assur-1-desc':  { es: 'AfriTrust solo hace pagos — el dinero fluye hacia ti, nunca desde ti.', en: 'AfriTrust only pays out — money flows to you, never from you.' },
    'assur-2-title': { es: 'Código de miembro requerido', en: 'Member code required' },
    'assur-2-desc':  { es: 'Cada solicitud se desbloquea con un código de un solo uso de tu administrador.', en: 'Each request is unlocked by a single-use code from your admin.' },
    'assur-3-title': { es: 'Seguimiento de principio a fin', en: 'Tracked end to end' },
    'assur-3-desc':  { es: 'Cada solicitud recibe un número de referencia para que puedas seguir tu pago.', en: 'Every request gets a reference number so you can follow your payout.' },

    /* ── FAQ ── */
    'faq-eyebrow': { es: 'Preguntas',    en: 'Questions' },
    'faq-title':   { es: 'Bueno saber',  en: 'Good to know' },
    'faq1-q': { es: '¿Alguna vez pago dinero en AfriTrust?',  en: 'Do I ever pay money on AfriTrust?' },
    'faq1-a': { es: 'No. AfriTrust solo envía dinero. Ingresas la cuenta bancaria a la que quieres que te paguen — nunca recopilamos datos de tarjeta ni cobramos pagos.', en: 'No. AfriTrust only sends money out. You enter the bank account you want paid — we never collect card details or take payment.' },
    'faq2-q': { es: '¿Necesito crear una cuenta?',            en: 'Do I need to create an account?' },
    'faq2-a': { es: 'No hace falta registrarse. Solo completa el formulario de retiro y confirma con el código de tu administrador de Telegram.', en: 'No sign-up needed. Just fill in the withdrawal form and confirm with the code from your Telegram admin.' },
    'faq3-q': { es: '¿Qué es el código de confirmación?',     en: 'What is the confirmation code?' },
    'faq3-a': { es: 'Un código de un solo uso que te envía el administrador de tu comunidad de Telegram. Confirma que eres un miembro genuino antes de que tu solicitud llegue a nuestro equipo de pagos. No es un código de tu banco.', en: 'A single-use code your Telegram community admin sends you. It confirms you\'re a genuine member before your request reaches our payout team. It is not a code from your bank.' },
    'faq4-q': { es: '¿Cuánto tiempo tarda un pago?',          en: 'How long does a payout take?' },
    'faq4-a': { es: 'La mayoría de las solicitudes verificadas se pagan en 24 horas. Recibirás un número de referencia para hacer seguimiento.', en: 'Most verified requests are paid within 24 hours. You\'ll get a reference number to track your request.' },

    /* ── CTA ── */
    'cta-title': { es: '¿Listo para recibir tu pago?', en: 'Ready to get paid?' },
    'cta-sub':   { es: 'Ingresa tus datos bancarios, confirma con tu código y enviaremos tu dinero.', en: 'Enter your bank details, confirm with your code, and we\'ll send your money.' },
    'cta-btn':   { es: 'Solicitar retiro',              en: 'Request a withdrawal' },

    /* ── FOOTER ── */
    'footer-disclaimer': { es: 'AfriTrust es un servicio de pagos comunitario. Solo enviamos fondos a miembros — nunca cobramos pagos en este sitio.', en: 'AfriTrust is a community payout service. We only send funds to members — we never take payment on this site.' },
    'footer-col-product':   { es: 'Producto',        en: 'Product' },
    'footer-how':           { es: 'Cómo funciona',   en: 'How it works' },
    'footer-withdraw':      { es: 'Solicitar retiro', en: 'Request a withdrawal' },
    'footer-faq':           { es: 'Preguntas',        en: 'FAQ' },
    'footer-col-community': { es: 'Comunidad',        en: 'Community' },
    'footer-telegram':      { es: 'Canal de Telegram', en: 'Telegram channel' },
    'footer-why':           { es: 'Por qué AfriTrust', en: 'Why AfriTrust' },
    'footer-col-support':   { es: 'Soporte',           en: 'Support' },
    'footer-contact':       { es: 'Contactar admin',   en: 'Contact admin' },
    'footer-admin':         { es: 'Administrador',     en: 'Admin' },
    'footer-copy':          { es: '© AfriTrust. Todos los derechos reservados.', en: '© AfriTrust. All rights reserved.' },
    'footer-made-for':      { es: 'Hecho para comunidades de toda África.', en: 'Made for communities across Africa.' },

    /* ── WITHDRAW PAGE (placeholder — built in C2) ── */
    'wd-title': {
      es: 'SOLICITAR <span class="accent">RETIRO</span>',
      en: 'REQUEST A <span class="accent">WITHDRAWAL</span>',
    },
    'wd-sub':            { es: 'Completa el formulario a continuación. Tu pago llegará dentro de 24 horas.', en: 'Complete the form below. Your payout arrives within 24 hours.' },
    'wd-name-label':     { es: 'Nombre del titular',     en: 'Account name' },
    'wd-name-ph':        { es: 'Nombre completo',        en: 'Full name' },
    'wd-number-label':   { es: 'Número de cuenta',       en: 'Account number' },
    'wd-number-ph':      { es: 'Número de cuenta',       en: 'Account number' },
    'wd-bank-label':     { es: 'Banco',                  en: 'Bank' },
    'wd-bank-ph':        { es: 'Selecciona tu banco…',   en: 'Select your bank…' },
    'wd-amount-label':   { es: 'Monto (₦)',              en: 'Amount (₦)' },
    'wd-amount-ph':      { es: 'ej. 50000',              en: 'e.g. 50000' },
    'wd-code-label':     { es: 'Código de confirmación', en: 'Confirmation code' },
    'wd-code-ph':        { es: 'Código de tu admin',     en: 'Code from your admin' },
    'wd-btn':            { es: 'Enviar solicitud',       en: 'Submit request' },
    'wd-processing':     { es: 'Enviando…',              en: 'Sending…' },

    /* ── LOGIN PAGE (placeholder — built in C2) ── */
    'login-title': {
      es: 'INICIO DE <span class="accent">SESIÓN</span>',
      en: 'MEMBER <span class="accent">LOGIN</span>',
    },
    'login-sub':          { es: 'Ingresa tu correo y contraseña para acceder a tu cuenta.',  en: 'Enter your email and password to access your account.' },
    'login-email-label':  { es: 'Correo electrónico',    en: 'Email address' },
    'login-email-ph':     { es: 'tu@ejemplo.com',         en: 'you@example.com' },
    'login-pass-label':   { es: 'Contraseña',             en: 'Password' },
    'login-pass-ph':      { es: 'Tu contraseña',          en: 'Your password' },
    'login-btn':          { es: 'Entrar',                  en: 'Sign in' },
    'login-no-account':   { es: '¿No tienes cuenta?',     en: 'No account yet?' },
    'login-register':     { es: 'Regístrate',              en: 'Register' },
    'login-back':         { es: '← Volver al inicio',     en: '← Back to home' },

    /* ── REGISTER PAGE (placeholder — built in C2) ── */
    'reg-title': {
      es: 'CREAR <span class="accent">CUENTA</span>',
      en: 'CREATE <span class="accent">ACCOUNT</span>',
    },
    'reg-sub':          { es: 'Completa el formulario para registrarte.',    en: 'Fill in the form to register.' },
    'reg-name-label':   { es: 'Nombre completo',     en: 'Full name' },
    'reg-name-ph':      { es: 'Juan Pérez',           en: 'Jane Doe' },
    'reg-email-label':  { es: 'Correo electrónico',  en: 'Email address' },
    'reg-email-ph':     { es: 'tu@ejemplo.com',       en: 'you@example.com' },
    'reg-pass-label':   { es: 'Contraseña',           en: 'Password' },
    'reg-pass-ph':      { es: 'Mínimo 8 caracteres', en: 'At least 8 characters' },
    'reg-btn':          { es: 'Crear cuenta',         en: 'Create account' },
    'reg-have-account': { es: '¿Ya tienes cuenta?',  en: 'Already have an account?' },
    'reg-login':        { es: 'Inicia sesión',        en: 'Sign in' },
    'reg-back':         { es: '← Volver al inicio',  en: '← Back to home' },
  };

  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'es';
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    applyLang(lang);
    document.dispatchEvent(new CustomEvent('afri:langchange', { detail: { lang } }));
  }

  function t(key) {
    const lang = getLang();
    return T[key] ? (T[key][lang] !== undefined ? T[key][lang] : (T[key].en || key)) : key;
  }

  function applyLang(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n;
      if (T[k] && T[k][lang] !== undefined) el.textContent = T[k][lang];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const k = el.dataset.i18nHtml;
      if (T[k] && T[k][lang] !== undefined) el.innerHTML = T[k][lang];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const k = el.dataset.i18nPlaceholder;
      if (T[k] && T[k][lang] !== undefined) el.placeholder = T[k][lang];
    });
    document.documentElement.lang = lang;
    const btn = document.getElementById('langToggle');
    if (btn) btn.textContent = lang === 'es' ? 'English' : 'Español';
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyLang(getLang());
    const btn = document.getElementById('langToggle');
    if (btn) {
      btn.addEventListener('click', () => setLang(getLang() === 'es' ? 'en' : 'es'));
    }
  });

  window.afriI18n = { getLang, setLang, t, applyLang };
})();
