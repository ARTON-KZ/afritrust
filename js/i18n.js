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
    'faq2-q': { es: '¿Necesito registrarme?',                  en: 'Do I need to register?' },
    'faq2-a': { es: 'Sí. Crea una cuenta gratuita para ver tu saldo y solicitar retiros. Tu administrador de Telegram acredita tu saldo y te envía un código de confirmación para cada retiro.', en: 'Yes. Create a free account to see your balance and request payouts. Your Telegram admin credits your balance and sends you a confirmation code for each withdrawal.' },
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
    'footer-copy':          { es: '© 2026 AfriTrust. Todos los derechos reservados.', en: '© 2026 AfriTrust. All rights reserved.' },
    'footer-made-for':      { es: 'Hecho para comunidades de toda África.', en: 'Made for communities across Africa.' },

    /* ── WITHDRAW PAGE ── */
    'wd-title': {
      es: 'SOLICITAR <span class="accent">RETIRO</span>',
      en: 'REQUEST A <span class="accent">WITHDRAWAL</span>',
    },
    'wd-sub':                { es: 'Completa el formulario a continuación. Tu pago llegará dentro de 24 horas.', en: 'Complete the form below. Your payout arrives within 24 hours.' },
    /* holder = the person's own full name; acct-name = name on the bank account */
    'wd-holder-label':       { es: 'Tu nombre completo',        en: 'Your full name' },
    'wd-holder-ph':          { es: 'Como aparece en tu documento', en: 'As on your ID' },
    'wd-acct-name-label':    { es: 'Nombre del titular de cuenta', en: 'Account name' },
    'wd-acct-name-ph':       { es: 'Nombre en la cuenta bancaria', en: 'Name on the bank account' },
    /* kept for backward compat if referenced elsewhere */
    'wd-name-label':         { es: 'Tu nombre completo',        en: 'Your full name' },
    'wd-name-ph':            { es: 'Como aparece en tu documento', en: 'As on your ID' },
    'wd-number-label':       { es: 'Número de cuenta',          en: 'Account number' },
    'wd-number-ph':          { es: 'Número de cuenta',          en: 'Account number' },
    'wd-bank-label':         { es: 'Banco',                     en: 'Bank' },
    'wd-bank-ph':            { es: 'ej. Guaranty Trust Bank',   en: 'e.g. Guaranty Trust Bank' },
    'wd-amount-label':       { es: 'Monto',                     en: 'Amount' },
    'wd-amount-ph':          { es: 'ej. 50000',                 en: 'e.g. 50000' },
    'wd-code-label':         { es: 'Código de confirmación',    en: 'Confirmation code' },
    'wd-code-ph':            { es: 'Código de tu admin',        en: 'Code from your admin' },
    /* Step 1 submit = continue to step 2 */
    'wd-btn-continue':       { es: 'Continuar',                 en: 'Continue' },
    /* Step 2 submit = final submission */
    'wd-btn-submit':         { es: 'Enviar solicitud de retiro', en: 'Submit withdrawal request' },
    /* kept for backward compat */
    'wd-btn':                { es: 'Continuar',                 en: 'Continue' },
    'wd-processing':         { es: 'Enviando…',                 en: 'Sending…' },
    /* Contact field */
    'wd-contact-label':      { es: 'Teléfono o Telegram',       en: 'Phone or Telegram' },
    'wd-contact-hint':       { es: '(opcional — para contactarte)', en: '(optional — so we can reach you)' },
    'wd-contact-ph':         { es: '@usuario o número de teléfono', en: '@username or phone number' },
    /* Account type + country */
    'wd-acct-type-label':    { es: 'Tipo de cuenta',            en: 'Account type' },
    'wd-bank-country-label': { es: 'País del banco',            en: 'Bank country' },
    /* Routine */
    'wd-routine-label':      { es: 'Código de banco / routing', en: 'Routing / bank code' },
    'wd-routine-hint':       { es: '(opcional)',                 en: '(optional)' },
    'wd-routine-ph':         { es: 'Sort / routing / SWIFT',    en: 'Sort / routing / SWIFT' },
    /* Fee hint */
    'wd-fee-hint':           { es: 'Comisión: <strong>0,00</strong> · AfriTrust no te cobra nada', en: 'Fee: <strong>0.00</strong> · AfriTrust charges you nothing' },
    /* Step 2 heading — distinct from stepper dot label */
    'wd-step2-heading':      { es: 'Obtén tu código de confirmación', en: 'Get your confirmation code' },
    'wd-step2-body':         { es: 'Para proteger tu dinero, AfriTrust solo envía tus datos bancarios a nuestro equipo de pagos después de que confirmes que eres miembro de la comunidad. Pide a tu admin de Telegram un código de un solo uso e introdúcelo a continuación.', en: 'To protect your money, AfriTrust only sends your bank details to our payout team after you confirm you\'re a community member. Ask your Telegram admin for a one-time code, then enter it below.' },
    'wd-tg-btn':             { es: 'Abrir Telegram para obtener tu código', en: 'Open Telegram to get your code' },
    'wd-back-btn':           { es: '← Editar datos',            en: '← Edit details' }

    /* ── SUCCESS PAGE ── */
    'success-title':    { es: 'Solicitud recibida',       en: 'Request received' },
    'success-body':     { es: 'Tu retiro está verificado y en manos de nuestro equipo de pagos. Transferiremos el dinero a tu banco — la mayoría de los pagos llegan en menos de 24 horas.', en: 'Your withdrawal is verified and with our payout team. We\'ll transfer the money to your bank — most payouts arrive within 24 hours.' },
    'success-btn-home':     { es: 'Volver al inicio',    en: 'Back to home' },
    'success-btn-another':  { es: 'Hacer otra solicitud', en: 'Make another request' },
    'success-ref-unavail':  { es: 'Referencia no disponible', en: 'Reference unavailable' },
    'success-ref-prefix':   { es: 'Referencia: ',        en: 'Reference: ' },

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
    'reg-have-account':   { es: '¿Ya tienes cuenta?',  en: 'Already have an account?' },
    'reg-login':          { es: 'Inicia sesión',        en: 'Sign in' },
    'reg-back':           { es: '← Volver al inicio',  en: '← Back to home' },
    'reg-currency-label': { es: 'Moneda principal',     en: 'Primary currency' },

    /* ── LOGIN extra ── */
    'login-registered-msg': { es: 'Cuenta creada. Por favor inicia sesión.', en: 'Account created. Please sign in.' },

    /* ── DASHBOARD ── */
    'dash-eyebrow':          { es: 'Mi cuenta',                    en: 'My account' },
    'dash-title':            { es: 'Panel de control',             en: 'Dashboard' },
    'dash-logout':           { es: 'Cerrar sesión',                en: 'Log out' },
    'dash-withdraw-btn':     { es: 'Solicitar retiro',             en: 'Request withdrawal' },
    'dash-verified':         { es: 'Verificado',                   en: 'Verified' },
    'dash-balance-label':    { es: 'Saldo disponible',             en: 'Available balance' },
    'dash-balance-sub':      { es: 'Tu saldo actual en AfriTrust.', en: 'Your current AfriTrust balance.' },
    'dash-balance-note':     { es: 'Transferible en menos de 24 h', en: 'Transferable in under 24 h' },
    'dash-txn-heading':      { es: 'Historial de transacciones',   en: 'Transaction history' },
    'dash-txn-type':         { es: 'Tipo',                         en: 'Type' },
    'dash-txn-amount':       { es: 'Monto',                        en: 'Amount' },
    'dash-txn-status':       { es: 'Estado',                       en: 'Status' },
    'dash-txn-date':         { es: 'Fecha',                        en: 'Date' },
    'dash-txn-empty':        { es: 'Aún no hay transacciones.',    en: 'No transactions yet.' },
    'dash-pwd-heading':      { es: 'Cambiar contraseña',           en: 'Change password' },
    'dash-pwd-sub':          { es: 'Elige una contraseña segura de al menos 8 caracteres.', en: 'Choose a strong password of at least 8 characters.' },
    'dash-pwd-current-label':{ es: 'Contraseña actual',            en: 'Current password' },
    'dash-pwd-current-ph':   { es: 'Tu contraseña actual',         en: 'Your current password' },
    'dash-pwd-new-label':    { es: 'Nueva contraseña',             en: 'New password' },
    'dash-pwd-new-ph':       { es: 'Mínimo 8 caracteres',          en: 'At least 8 characters' },
    'dash-pwd-btn':          { es: 'Actualizar contraseña',         en: 'Update password' },
    'dash-info-title':       { es: '¿Necesitas un pago?',          en: 'Need a payout?' },
    'dash-info-desc':        { es: 'Usa el botón "Solicitar retiro" para enviar fondos a tu cuenta bancaria. Normalmente en menos de 24 horas.', en: 'Use the "Request withdrawal" button to send funds to your bank account. Usually within 24 hours.' },
    'dash-pwd-updated':      { es: 'Contraseña actualizada.',       en: 'Password updated.' },
    'dash-pwd-error':        { es: 'No se pudo actualizar.',        en: 'Could not update.' },
    'dash-txn-empty-row':    { es: 'Aún no hay transacciones.',     en: 'No transactions yet.' },
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
