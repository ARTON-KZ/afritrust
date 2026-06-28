// Landing-page interactions: sticky nav state, mobile menu, scroll reveal,
// FAQ accordion. Animations touch transform/opacity only.
(function () {
  // Sticky nav border once scrolled
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile menu
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  // Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (!('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('is-visible'));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('is-visible');
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
      );
      reveals.forEach((el) => io.observe(el));
    }
  }

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', String(open));
      a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
    });
  });

  // Year
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Telegram link (config can override; placeholder for now)
  const tg = window.AFRITRUST_TELEGRAM || 'https://t.me/';
  document.querySelectorAll('#tgFooter').forEach((el) => (el.href = tg));
})();
