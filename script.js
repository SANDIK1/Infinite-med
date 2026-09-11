(() => {
  'use strict';

  const body = document.body;
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.scroll-progress');
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.mobile-menu');
  const menuIcon = menuButton.querySelector('use');
  let menuOpen = false;
  let lastDialogTrigger = null;

  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    }).observe(header);
  }

  function setMenu(open, restoreFocus = false) {
    menuOpen = open;
    menu.inert = !open;
    menu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menuIcon.setAttribute('href', open ? '#i-close' : '#i-menu');
    body.classList.toggle('menu-open', open);
    document.querySelector('main').inert = open;
    document.querySelector('.site-footer').inert = open;
    if (open) menu.querySelector('a').focus();
    else if (restoreFocus) menuButton.focus();
  }

  menuButton.addEventListener('click', () => setMenu(!menuOpen, menuOpen));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    setMenu(false);
    const hash = link.getAttribute('href');
    if (hash.startsWith('#')) {
      const section = document.querySelector(hash);
      if (section) {
        section.setAttribute('tabindex', '-1');
        section.focus({ preventScroll: true });
        section.addEventListener('blur', () => section.removeAttribute('tabindex'), { once: true });
      }
    }
  }));

  document.addEventListener('keydown', event => {
    if (!menuOpen) return;
    if (event.key === 'Escape') setMenu(false, true);
    if (event.key === 'Tab') {
      const links = [...menu.querySelectorAll('a')];
      const first = links[0];
      const last = links[links.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === menuButton)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        menuButton.focus();
      } else if (!event.shiftKey && document.activeElement === menuButton) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const mobileQuery = window.matchMedia('(max-width: 760px)');
  mobileQuery.addEventListener('change', event => { if (!event.matches && menuOpen) setMenu(false); });

  document.querySelectorAll('[data-dialog]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const dialog = document.getElementById(trigger.dataset.dialog);
      if (!dialog) return;
      lastDialogTrigger = trigger;
      dialog.showModal();
      dialog.scrollTop = 0;
      body.classList.add('modal-open');
      dialog.querySelector('.close').focus({ preventScroll: true });
    });
  });

  document.querySelectorAll('dialog').forEach(dialog => {
    const heading = dialog.querySelector('h3');
    heading.id = `${dialog.id}-title`;
    dialog.setAttribute('aria-labelledby', heading.id);
    dialog.querySelector('.close').addEventListener('click', () => dialog.close());
    let startedOnBackdrop = false;
    const outside = event => {
      const rect = dialog.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    };
    dialog.addEventListener('pointerdown', event => { startedOnBackdrop = outside(event); });
    dialog.addEventListener('click', event => {
      if (startedOnBackdrop && outside(event)) dialog.close();
      startedOnBackdrop = false;
    });
    dialog.addEventListener('close', () => {
      body.classList.remove('modal-open');
      lastDialogTrigger?.focus({ preventScroll: true });
    });
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 25px 0px' });
    if (!reducedMotion.matches) {
      document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
      body.classList.add('motion-ready');
    }

    const navLinks = [...document.querySelectorAll('.nav-links a')];
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          const active = link.hash === `#${entry.target.id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
    document.querySelectorAll('main section').forEach(section => sectionObserver.observe(section));
  }

  let scrollPending = false;
  function updateScroll() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0})`;
    header.classList.toggle('scrolled', window.scrollY > 15);
    scrollPending = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollPending) {
      scrollPending = true;
      window.requestAnimationFrame(updateScroll);
    }
  }, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();

  function updateTime() {
    const now = new Date();
    document.getElementById('busan-time').textContent = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).format(now);
    document.getElementById('busan-time').dateTime = now.toISOString();
    document.getElementById('current-year').textContent = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Seoul', year: 'numeric' }).format(now);
  }
  updateTime();
  window.setInterval(updateTime, 60000);
})();
