(function(){
  "use strict";

  document.documentElement.classList.add('js');
  document.getElementById('year').textContent = new Date().getFullYear();

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- header scroll state + progress bar ---- */
  var header = document.getElementById('siteHeader');
  var ann = document.querySelector('.top-announcement');
  function syncAnnHeight(){
    var h = ann ? ann.offsetHeight : 0;
    document.documentElement.style.setProperty('--ann-h', h + 'px');
  }
  syncAnnHeight();
  window.addEventListener('resize', syncAnnHeight, {passive:true});
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(syncAnnHeight); }
  var toTop = document.getElementById('toTop');
  var progress = document.getElementById('progressBar');
  var quickbar = document.getElementById('quickbar');
  var footer = document.getElementById('footer');
  function onScroll(){
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 12);
    toTop.classList.toggle('show', y > 700);
    if(progress){
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
    if(quickbar && footer){
      var fr = footer.getBoundingClientRect();
      quickbar.classList.toggle('hide', fr.top < window.innerHeight);
    }
  }
  document.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll, {passive:true});
  onScroll();
  toTop.addEventListener('click', function(){ window.scrollTo({top:0, behavior: reduceMotion ? 'auto' : 'smooth'}); });

  /* ---- mobile nav ---- */
  var burger = document.getElementById('burgerBtn');
  var panel = document.getElementById('mobilePanel');
  function closeMenu(){
    burger.setAttribute('aria-expanded','false');
    panel.classList.remove('open');
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', function(){
    var open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    panel.classList.toggle('open', !open);
    document.body.style.overflow = !open ? 'hidden' : '';
  });
  panel.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && panel.classList.contains('open')){ closeMenu(); }
  });

  /* ---- scroll-spy active nav link ---- */
  var navLinks = document.querySelectorAll('nav.primary a');
  var sections = ['home','services','about','contact']
    .map(function(id){ return document.getElementById(id); })
    .filter(Boolean);
  function spy(){
    var pos = window.scrollY + 140;
    var current = sections[0];
    sections.forEach(function(sec){ if(sec.offsetTop <= pos) current = sec; });
    navLinks.forEach(function(a){
      a.classList.toggle('active', a.getAttribute('href') === '#' + current.id);
    });
  }
  document.addEventListener('scroll', spy, {passive:true});
  spy();

  /* ---- reveal on scroll ---- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if(reduceMotion || !('IntersectionObserver' in window)){
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -60px 0px'});
    revealEls.forEach(function(el){ io.observe(el); });
  }

  /* ---- image fade-ins ---- */
  function fadeIn(el, src){
    if(!el) return;
    if(el.complete && el.naturalWidth){ el.classList.add('loaded'); return; }
    el.addEventListener('load', function(){ el.classList.add('loaded'); });
  }
  [document.querySelector('.about-photo')].forEach(function(el){
    if(el){ fadeIn(el, el.currentSrc || el.src); }
  });
  function fadeInUrl(el, url){
    var img = new Image();
    img.onload = function(){ el.classList.add('loaded'); };
    img.src = url;
  }

  /* ---- marquee content (removed — no longer in DOM) ---- */

  /* ---- lightbox (shared; opens for any card carrying gallery data) ---- */
  var lightbox = document.getElementById('lightbox');
  var lbClose = document.getElementById('lightboxClose');
  var lastFocused = null;
  function openLightbox(card){
    if (!card || !card.dataset || !card.dataset.img) return;
    lastFocused = document.activeElement;
    var lbPhoto = document.getElementById('lbPhoto');
    lbPhoto.classList.remove('loaded');
    lbPhoto.src = card.dataset.img;
    lbPhoto.alt = card.dataset.title;
    fadeIn(lbPhoto, card.dataset.img);
    document.getElementById('lbId').textContent = card.dataset.id;
    document.getElementById('lbTitle').textContent = card.dataset.title;
    document.getElementById('lbLoc').textContent = card.dataset.loc;
    document.getElementById('lbDesc').textContent = card.dataset.desc;
    document.getElementById('lbTag').textContent = card.dataset.tag;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }
  function closeLightbox(){
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    if(lastFocused){ lastFocused.focus(); }
  }
  window.GlassLightbox = { open: openLightbox, close: closeLightbox };
  lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function(e){ if(e.target === lightbox){ closeLightbox(); } });
  lightbox.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && lightbox.classList.contains('open')){ closeLightbox(); }
    if(e.key === 'Tab' && lightbox.classList.contains('open')){
      var focusable = lightbox.querySelectorAll('button, a, [tabindex]:not([tabindex="-1"])');
      if(!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });

  /* ---- contact form ---- */
  var form = document.getElementById('quoteForm');
  var success = document.getElementById('formSuccess');
  var submitBtn = document.getElementById('submitBtn');
  var formError = document.getElementById('formError');
  var submitting = false;

  /* Service chip selector */
  var svcChips = document.querySelectorAll('.svc-chip');
  var fService = document.getElementById('fService');
  var svcGroups = document.querySelectorAll('.svc-group');
  var EXTRA_SERVICES = { poolfencing:'Pool Fencing', balustrade:'Balustrades', privacy:'Privacy Screens', repairs:'Window Repairs' };
  var moreBtn = document.getElementById('moreSvcBtn');
  var moreLabel = document.getElementById('moreSvcLabel');
  var moreMenu = document.getElementById('moreSvcMenu');
  var moreOpts = document.querySelectorAll('.svc-more-opt');
  var extraLegend = document.getElementById('extraLegend');
  function setService(svc) {
    fService.value = svc;
    var isExtra = !!EXTRA_SERVICES[svc];
    svcChips.forEach(function(c){
      if(c === moreBtn) return;
      var active = c.getAttribute('data-service') === svc;
      c.classList.toggle('active', active);
      c.setAttribute('aria-checked', active ? 'true' : 'false');
    });
    svcGroups.forEach(function(g){
      var grp = g.getAttribute('data-svc-group');
      g.hidden = !(grp === svc || (isExtra && grp === 'extra'));
    });
    if(moreBtn){
      moreBtn.classList.toggle('active', isExtra);
      moreBtn.setAttribute('aria-checked', isExtra ? 'true' : 'false');
      if(moreLabel) moreLabel.textContent = isExtra ? EXTRA_SERVICES[svc] : 'More services';
    }
    if(extraLegend && isExtra){ extraLegend.textContent = EXTRA_SERVICES[svc] + ' details'; }
    moreOpts.forEach(function(o){
      o.classList.toggle('is-picked', o.getAttribute('data-service') === svc);
    });
  }
  svcChips.forEach(function(chip){
    if(chip === moreBtn) return;
    chip.addEventListener('click', function(){ setService(chip.getAttribute('data-service')); closeMoreMenu(); });
  });

  /* ⋯ More-services menu */
  function openMoreMenu(){
    if(!moreMenu || !moreBtn) return;
    moreMenu.hidden = false;
    moreBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMoreMenu(){
    if(!moreMenu || !moreBtn) return;
    moreMenu.hidden = true;
    moreBtn.setAttribute('aria-expanded', 'false');
  }
  if(moreBtn){
    moreBtn.addEventListener('click', function(e){
      e.stopPropagation();
      if(moreMenu.hidden){ openMoreMenu(); } else { closeMoreMenu(); }
    });
  }
  moreOpts.forEach(function(opt){
    opt.addEventListener('click', function(e){
      e.stopPropagation();
      setService(opt.getAttribute('data-service'));
      closeMoreMenu();
    });
  });
  document.addEventListener('click', function(e){
    if(moreMenu && !moreMenu.hidden && !e.target.closest('.svc-more-wrap')){ closeMoreMenu(); }
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && moreMenu && !moreMenu.hidden){
      closeMoreMenu();
      if(moreBtn) moreBtn.focus();
    }
  });

  /* Service cards: click to pre-select in contact form */
  var svcCards = document.querySelectorAll('.svc-card');
  svcCards.forEach(function(card){
    function activateCard(){
      var svc = card.getAttribute('data-service');
      if(svc) setService(svc);
      var contactSec = document.getElementById('contact');
      if(contactSec){
        contactSec.scrollIntoView({ behavior:'smooth' });
        setTimeout(function(){
          var nameInput = document.getElementById('fName');
          if(nameInput) nameInput.focus();
        }, 600);
      }
    }
    card.addEventListener('click', activateCard);
    card.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); activateCard(); }
    });
  });

  /* Full-list service buttons: jump to quote form, prefilled */
  var sflBtns = document.querySelectorAll('.sfl-btn');
  var fMsgBox = document.getElementById('fMsg');
  var fSbFinish = document.getElementById('fSbFinish');
  sflBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      var target = btn.getAttribute('data-target');
      var label = btn.getAttribute('data-label') || 'this service';
      var finish = btn.getAttribute('data-finish');
      if(target && typeof setService === 'function'){ setService(target); }
      if(finish && fSbFinish){ fSbFinish.value = finish; }
      if(fMsgBox && !fMsgBox.value.trim()){ fMsgBox.value = "Hi, I'd like a quote for: " + label + '.'; }
      sflBtns.forEach(function(b){ b.classList.remove('is-picked'); });
      btn.classList.add('is-picked');
      var contactSec = document.getElementById('contact');
      if(contactSec){
        contactSec.scrollIntoView({ behavior:'smooth' });
        setTimeout(function(){
          var nameInput = document.getElementById('fName');
          if(nameInput) nameInput.focus({ preventScroll:true });
        }, 650);
      }
    });
  });

  /* Pet type toggle (dog / cat) */
  var petBtns = document.querySelectorAll('.mt-btn');
  var fPetType = document.getElementById('fPetType');
  var dogSizeGroup = document.getElementById('dogSizeGroup');
  var catGroup = document.getElementById('catGroup');
  function setPetType(type) {
    fPetType.value = type;
    petBtns.forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-pet') === type); });
    if (dogSizeGroup) dogSizeGroup.hidden = (type !== 'dog');
    if (catGroup) catGroup.hidden = (type !== 'cat');
  }
  petBtns.forEach(function(btn){
    btn.addEventListener('click', function(){ setPetType(btn.getAttribute('data-pet')); });
  });

  function setFieldError(name, msg) {
    var field = form.querySelector('[name="' + name + '"]');
    if (!field) return;
    field.classList.toggle('is-invalid', !!msg);
    var err = field.parentElement.querySelector('.field-error');
    if (!err) {
      err = document.createElement('span');
      err.className = 'field-error';
      err.setAttribute('role', 'alert');
      field.parentElement.appendChild(err);
    }
    err.textContent = msg || '';
    err.style.display = msg ? 'block' : 'none';
  }
  function clearErrors() {
    form.querySelectorAll('.is-invalid').forEach(function(el){ el.classList.remove('is-invalid'); });
    form.querySelectorAll('.field-error').forEach(function(el){ el.textContent = ''; el.style.display = 'none'; });
    if (formError) { formError.textContent = ''; formError.style.display = 'none'; }
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (submitting) return;
    clearErrors();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    submitting = true;
    submitBtn.classList.add('is-busy');
    submitBtn.disabled = true;
    var label = submitBtn.querySelector('.btn-label');
    var origLabel = label.textContent;
    label.textContent = 'Sending\u2026';

    // Multipart FormData so the optional photo upload travels with the rest of the fields
    var data = new FormData(form);
    // Checkbox doesn't submit a value when unchecked — normalise explicitly
    data.set('emergency', document.getElementById('fEmergency').checked ? 'true' : 'false');

    // Determine API base: same-origin when served by Node, else localhost fallback
    var apiBase = (window.location.port === '3001' || window.location.port === '' || window.location.port === '80' || window.location.port === '443')
      ? ''
      : 'http://localhost:3001';

    fetch(apiBase + '/api/quote', {
      method: 'POST',
      body: data
    })
    .then(function(res) {
      return res.json().then(function(d) { return { ok: res.ok, data: d }; });
    })
    .then(function(result) {
      if (result.ok) {
        // Success
        form.reset();
        form.style.display = 'none';
        success.textContent = result.data.message || 'Thank you \u2014 we\u2019ll be in touch shortly!';
        success.classList.add('show');
        success.focus();
      } else {
        // Validation / server error
        if (result.data.fields) {
          Object.keys(result.data.fields).forEach(function(k) {
            setFieldError(k, result.data.fields[k]);
          });
          // Focus first invalid field
          var first = form.querySelector('.is-invalid');
          if (first) first.focus();
        } else {
          if (formError) {
            formError.textContent = result.data.error || 'Something went wrong. Please try calling us directly.';
            formError.style.display = 'block';
          }
        }
      }
    })
    .catch(function() {
      if (formError) {
        formError.textContent = 'Network error — please check your connection or call us on 0497\u00a0470\u00a0036.';
        formError.style.display = 'block';
      }
    })
    .finally(function() {
      submitting = false;
      submitBtn.classList.remove('is-busy');
      submitBtn.disabled = false;
      label.textContent = origLabel;
    });
  });

  /* ---- Before & After Transformation Slider ---- */
  (function(){
    var container = document.getElementById('baContainer');
    var beforeLayer = document.getElementById('baBeforeLayer');
    var handle = document.getElementById('baHandle');
    if(!container || !beforeLayer || !handle) return;

    var dragging = false;

    function setPosition(xPos){
      var rect = container.getBoundingClientRect();
      var offsetX = Math.max(0, Math.min(xPos - rect.left, rect.width));
      var percentage = (offsetX / rect.width) * 100;
      beforeLayer.style.width = percentage + '%';
      handle.style.left = percentage + '%';
    }

    function onPointerMove(e){
      if(!dragging) return;
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setPosition(clientX);
    }

    function onPointerDown(e){
      dragging = true;
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setPosition(clientX);
    }

    function onPointerUp(){
      dragging = false;
    }

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
  })();
})();