'use strict';

/* ==========================================================================
   Utility
   ========================================================================== */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ==========================================================================
   Header: scroll shadow + hamburger
   ========================================================================== */
(function initHeader() {
  const header     = qs('#header');
  const hamburger  = qs('#hamburger');
  const nav        = qs('#headerNav');
  const navLinks   = qsa('.header__nav-link');

  // Scroll shadow
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 10);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    hamburger.classList.toggle('is-open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close nav when a link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close nav when clicking outside
  document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') &&
        !nav.contains(e.target) &&
        !hamburger.contains(e.target)) {
      nav.classList.remove('is-open');
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
})();

/* ==========================================================================
   Scroll-in animations (Intersection Observer)
   ========================================================================== */
(function initFadeIn() {
  const targets = qsa('.fade-in');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
})();

/* ==========================================================================
   Tabs (shared — service / flow / entry)
   ========================================================================== */
(function initTabs() {
  qsa('.tab-btns').forEach(group => {
    const btns = qsa('.tab-btn', group);

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.tab;
        const tabGroup = btn.closest('.tab-group');

        // Update buttons
        qsa('.tab-btn', tabGroup).forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        // Update content
        qsa('.tab-content', tabGroup).forEach(panel => {
          panel.classList.remove('is-active');
        });
        const target = qs(`#${targetId}`);
        if (target) target.classList.add('is-active');
      });
    });
  });
})();

/* ==========================================================================
   FAQ Accordion
   ========================================================================== */
(function initFaq() {
  const items = qsa('.faq__item');

  items.forEach(item => {
    const btn    = qs('.faq__question', item);
    const answer = qs('.faq__answer', item);

    btn.addEventListener('click', () => {
      const isOpen = answer.classList.contains('is-open');

      // Close all others
      items.forEach(other => {
        if (other !== item) {
          qs('.faq__question', other).setAttribute('aria-expanded', 'false');
          qs('.faq__answer', other).classList.remove('is-open');
        }
      });

      // Toggle this one
      btn.setAttribute('aria-expanded', String(!isOpen));
      answer.classList.toggle('is-open', !isOpen);
    });
  });
})();

/* ==========================================================================
   Back to Top button
   ========================================================================== */
(function initBackToTop() {
  const btn = qs('#backToTop');
  if (!btn) return;

  const onScroll = () => {
    btn.classList.toggle('is-visible', window.scrollY > 400);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ==========================================================================
   Active nav highlight on scroll (simple section spy)
   ========================================================================== */
(function initNavSpy() {
  const sections = qsa('section[id]');
  const navLinks = qsa('.header__nav-link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        link.style.color = href === `#${id}` ? 'var(--primary)' : '';
      });
    });
  }, { rootMargin: `-${68}px 0px -60% 0px`, threshold: 0 });

  sections.forEach(sec => observer.observe(sec));
})();

/* ==========================================================================
   Form: basic client-side validation & submission feedback
   ========================================================================== */
(function initForms() {
  qsa('form.form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();

      // Simple required-field check
      let valid = true;
      const requiredFields = qsa('[required]', form);

      requiredFields.forEach(field => {
        field.style.borderColor = '';
        if (!field.value.trim() || (field.type === 'checkbox' && !field.checked)) {
          field.style.borderColor = '#e74c3c';
          valid = false;
        }
      });

      if (!valid) {
        const firstInvalid = qs('[required]:not(:valid)', form) || qsa('[required]', form).find(f => !f.value.trim() || (f.type === 'checkbox' && !f.checked));
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const submitBtn = qs('button[type="submit"]', form);
      const originalBtnText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '送信中…';
      }

      fetch(form.action, {
        method: form.method || 'POST',
        body: new FormData(form)
      })
        .then(res => {
          if (!res.ok) throw new Error('send-failed');

          // Show success message (replace form content)
          const successHtml = `
            <div style="text-align:center;padding:3rem 1rem;">
              <div style="font-size:3rem;margin-bottom:1rem;">✅</div>
              <h3 style="font-size:1.3rem;font-weight:800;margin-bottom:.75rem;color:var(--text);">送信が完了しました</h3>
              <p style="color:var(--text-mid);line-height:1.8;">お問い合わせありがとうございます。<br>担当者よりご連絡いたします。</p>
            </div>
          `;
          form.innerHTML = successHtml;
        })
        .catch(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
          }

          let errorEl = qs('.form__error', form);
          if (!errorEl) {
            errorEl = document.createElement('p');
            errorEl.className = 'form__error';
            errorEl.style.color = '#e74c3c';
            errorEl.style.marginTop = '1rem';
            form.appendChild(errorEl);
          }
          errorEl.textContent = '送信に失敗しました。時間をおいて再度お試しいただくか、お電話にてご連絡ください。';
        });
    });
  });
})();

/* ==========================================================================
   Smooth scroll polyfill for older Safari
   ========================================================================== */
(function initSmoothScroll() {
  qsa('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = qs(href);
      if (!target) return;
      e.preventDefault();
      const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 68;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
