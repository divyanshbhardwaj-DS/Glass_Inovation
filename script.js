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
  function onScroll(){
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 12);
    toTop.classList.toggle('show', y > 700);
    if(progress){
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
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
    if(burger) burger.setAttribute('aria-expanded','false');
    if(panel) panel.classList.remove('open');
    document.body.style.overflow = '';
  }
  if(burger && panel){
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
  }

  /* ---- quote CTA smooth scroll & focus ---- */
  var quoteCtas = document.querySelectorAll('a[href="#contact"]');
  quoteCtas.forEach(function(cta){
    cta.addEventListener('click', function(e){
      var contactSec = document.getElementById('contact');
      if(contactSec){
        e.preventDefault();
        closeMenu();
        contactSec.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        setTimeout(function(){
          var nameInput = document.getElementById('fName');
          if(nameInput) nameInput.focus({ preventScroll: true });
        }, 600);
      }
    });
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
      var isActive = (grp === svc || (isExtra && grp === 'extra'));
      g.hidden = !isActive;
      g.disabled = !isActive;
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
    if (typeof updateQuoteSummary === 'function') {
      updateQuoteSummary();
    }
  }
  svcChips.forEach(function(chip){
    if(chip === moreBtn) return;
    chip.addEventListener('click', function(){ setService(chip.getAttribute('data-service')); closeMoreMenu(); });
  });
  if (fService && fService.value) {
    setService(fService.value);
  }

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

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

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

  /* ---- Live Interactive Quote Summary ---- */
  function updateQuoteSummary() {
    var summaryContainer = document.getElementById('quoteSummaryContent');
    if (!summaryContainer || !form) return;

    var svc = fService ? fService.value : 'shower';
    var svcName = EXTRA_SERVICES[svc] || ({
      shower: 'Shower Screen',
      petdoor: 'Cat / Dog Door',
      mirror: 'Mirror',
      splashback: 'Splashback'
    }[svc] || svc);

    var items = [];

    // Service
    items.push({ label: 'Service', val: svcName });

    // Job Type & Location
    var jobType = document.getElementById('fJobType') ? document.getElementById('fJobType').value : '';
    if (jobType) items.push({ label: 'Project Type', val: jobType });

    var loc = document.getElementById('fLocation') ? document.getElementById('fLocation').value.trim() : '';
    if (loc) items.push({ label: 'Location', val: loc });

    // Service-specific
    if (svc === 'shower') {
      var shFrame = document.getElementById('fShFrame') ? document.getElementById('fShFrame').value : '';
      if (shFrame) items.push({ label: 'Frame Selection', val: shFrame });

      var shL = document.getElementById('fShLength') ? document.getElementById('fShLength').value.trim() : '';
      var shW = document.getElementById('fShWidth') ? document.getElementById('fShWidth').value.trim() : '';
      var shH = document.getElementById('fShHeight') ? document.getElementById('fShHeight').value.trim() : '';
      if (shL || shW || shH) {
        items.push({ label: 'Measurements (mm)', val: (shL || '—') + 'mm (L) × ' + (shW || '—') + 'mm (W) × ' + (shH || '—') + 'mm (H)' });
      }

      var shGlass = document.getElementById('fShGlass') ? document.getElementById('fShGlass').value : '';
      if (shGlass) items.push({ label: 'Glass Preference', val: shGlass });
    } else if (svc === 'petdoor') {
      var petType = document.getElementById('fPetType') ? document.getElementById('fPetType').value : 'dog';
      items.push({ label: 'Pet Door Type', val: petType === 'cat' ? 'Cat' : 'Dog' });

      if (petType === 'dog') {
        var dogSize = document.getElementById('fDogSize') ? document.getElementById('fDogSize').value : '';
        if (dogSize) items.push({ label: 'Dog Size', val: dogSize });
        var dogBreed = document.getElementById('fDogBreed') ? document.getElementById('fDogBreed').value.trim() : '';
        if (dogBreed) items.push({ label: 'Breed', val: dogBreed });

        var petW = document.getElementById('fPetWidth') ? document.getElementById('fPetWidth').value.trim() : '';
        var petH = document.getElementById('fPetHeight') ? document.getElementById('fPetHeight').value.trim() : '';
        if (petW || petH) {
          items.push({ label: 'Opening (mm)', val: (petW || '—') + 'mm (W) × ' + (petH || '—') + 'mm (H)' });
        }
      } else {
        var catBreed = document.getElementById('fCatBreed') ? document.getElementById('fCatBreed').value.trim() : '';
        if (catBreed) items.push({ label: 'Cat Breed', val: catBreed });
      }

      var proxLoc = document.getElementById('fProxLocation') ? document.getElementById('fProxLocation').value : '';
      if (proxLoc) items.push({ label: 'Proximity Reader', val: proxLoc });

      var reglazing = document.getElementById('fReglazing') ? document.getElementById('fReglazing').value : '';
      if (reglazing) items.push({ label: 'Reglazing Option', val: reglazing });
    } else if (svc === 'mirror') {
      var mType = document.getElementById('fMirrorType') ? document.getElementById('fMirrorType').value : '';
      if (mType) items.push({ label: 'Mirror Type', val: mType });

      var mW = document.getElementById('fMirrorWidth') ? document.getElementById('fMirrorWidth').value.trim() : '';
      var mH = document.getElementById('fMirrorHeight') ? document.getElementById('fMirrorHeight').value.trim() : '';
      if (mW || mH) {
        items.push({ label: 'Measurements (mm)', val: (mW || '—') + 'mm (W) × ' + (mH || '—') + 'mm (H)' });
      }

      var mFinish = document.getElementById('fMirrorFinish') ? document.getElementById('fMirrorFinish').value : '';
      if (mFinish) items.push({ label: 'Design / Finishing', val: mFinish });
    } else if (svc === 'splashback') {
      var sbW = document.getElementById('fSbWidth') ? document.getElementById('fSbWidth').value.trim() : '';
      var sbH = document.getElementById('fSbHeight') ? document.getElementById('fSbHeight').value.trim() : '';
      if (sbW || sbH) {
        items.push({ label: 'Measurements (mm)', val: (sbW || '—') + 'mm (W) × ' + (sbH || '—') + 'mm (H)' });
      }

      var sbFinish = document.getElementById('fSbFinish') ? document.getElementById('fSbFinish').value : '';
      if (sbFinish) items.push({ label: 'Finish Type', val: sbFinish });

      var sbBrand = document.getElementById('fSbBrand') ? document.getElementById('fSbBrand').value.trim() : '';
      if (sbBrand) items.push({ label: 'Dulux Brand', val: sbBrand });

      var sbColour = document.getElementById('fSbColour') ? document.getElementById('fSbColour').value.trim() : '';
      if (sbColour) items.push({ label: 'Dulux Colour', val: sbColour });

      var sbCode = document.getElementById('fSbColourCode') ? document.getElementById('fSbColourCode').value.trim() : '';
      if (sbCode) items.push({ label: 'Dulux Colour Code', val: sbCode });
    } else {
      // Pool fencing, balustrade, privacy, repairs
      var exLen = document.getElementById('fExLength') ? document.getElementById('fExLength').value.trim() : '';
      if (exLen) items.push({ label: 'Length (mm)', val: exLen + 'mm' });

      var exW = document.getElementById('fExWidth') ? document.getElementById('fExWidth').value.trim() : '';
      var exH = document.getElementById('fExHeight') ? document.getElementById('fExHeight').value.trim() : '';
      if (exW || exH) {
        items.push({ label: 'Approx Dimensions (mm)', val: (exW || '—') + 'mm (W) × ' + (exH || '—') + 'mm (H)' });
      }
    }

    // Active photo file
    var activePhotoInput = form.querySelector('.svc-group:not([hidden]) input[type="file"][name="photo"]');
    if (activePhotoInput && activePhotoInput.files && activePhotoInput.files[0]) {
      items.push({ label: 'Uploaded Photo', val: '📎 ' + activePhotoInput.files[0].name });
    }

    // Comments / extra instructions
    var msg = document.getElementById('fMsg') ? document.getElementById('fMsg').value.trim() : '';
    if (msg) {
      items.push({ label: 'Comments / Instructions', val: msg.length > 70 ? (msg.slice(0, 70) + '…') : msg });
    }

    // Customer Info
    var cName = document.getElementById('fName') ? document.getElementById('fName').value.trim() : '';
    var cPhone = document.getElementById('fPhone') ? document.getElementById('fPhone').value.trim() : '';
    var cSub = document.getElementById('fSuburb') ? document.getElementById('fSuburb').value.trim() : '';
    if (cName || cPhone || cSub) {
      items.push({ label: 'Customer Details', val: [cName, cPhone, cSub].filter(Boolean).join(' · ') });
    }

    if (items.length === 0) {
      summaryContainer.innerHTML = '<span class="qs-empty">Enter your measurements and options above to preview your quote summary.</span>';
      return;
    }

    summaryContainer.innerHTML = items.map(function(it) {
      return '<div class="qs-item">' +
               '<span class="qs-item-label">' + esc(it.label) + '</span>' +
               '<span class="qs-item-val">' + esc(it.val) + '</span>' +
             '</div>';
    }).join('');
  }

  form.addEventListener('input', updateQuoteSummary);
  form.addEventListener('change', updateQuoteSummary);
  updateQuoteSummary();

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (submitting) return;
    clearErrors();

    var hasValidationErr = false;

    // Validate Length if provided (CH-015, CH-016, CH-017, CH-018: optional, positive mm)
    var exLenInput = document.getElementById('fExLength');
    var isExtra = !!EXTRA_SERVICES[fService.value];
    if (isExtra && exLenInput) {
      var exLenVal = exLenInput.value.trim();
      if (exLenVal) {
        if (isNaN(Number(exLenVal)) || Number(exLenVal) <= 0) {
          setFieldError('length', 'Length must be a positive number in mm.');
          hasValidationErr = true;
        }
      }
    }

    // Validate dimensions if filled
    ['fShLength', 'fShWidth', 'fShHeight', 'fMirrorWidth', 'fMirrorHeight',
     'fSbWidth', 'fSbHeight', 'fPetWidth', 'fPetHeight', 'fExWidth', 'fExHeight'].forEach(function(id){
      var inp = document.getElementById(id);
      if (inp && inp.value.trim()) {
        var n = Number(inp.value.trim());
        if (isNaN(n) || n <= 0) {
          setFieldError(inp.name, 'Measurement must be a positive number in mm.');
          hasValidationErr = true;
        }
      }
    });

    // Validate active photo upload
    var activePhoto = form.querySelector('.svc-group:not([hidden]) input[type="file"][name="photo"]');
    if (activePhoto && activePhoto.files && activePhoto.files[0]) {
      var photoFile = activePhoto.files[0];
      if (!/^image\/(jpeg|png|webp|gif|heic|heif)$/i.test(photoFile.type)) {
        setFieldError('photo', 'Please select a valid image file (JPEG, PNG, WEBP).');
        hasValidationErr = true;
      } else if (photoFile.size > 8 * 1024 * 1024) {
        setFieldError('photo', 'Photo file size exceeds 8MB limit.');
        hasValidationErr = true;
      }
    }

    if (hasValidationErr || !form.checkValidity()) {
      form.reportValidity();
      var firstInv = form.querySelector('.is-invalid');
      if (firstInv) firstInv.focus();
      return;
    }

    submitting = true;
    submitBtn.classList.add('is-busy');
    submitBtn.disabled = true;
    var label = submitBtn.querySelector('.btn-label');
    var origLabel = label.textContent;
    label.textContent = 'Sending\u2026';

    // Multipart FormData
    var data = new FormData(form);
    data.set('emergency', document.getElementById('fEmergency').checked ? 'true' : 'false');

    // Ensure photo from active group is explicitly set
    if (activePhoto && activePhoto.files && activePhoto.files[0]) {
      data.set('photo', activePhoto.files[0]);
    } else {
      data.delete('photo');
    }

    var apiBase = (window.location.protocol === 'file:') ? 'http://localhost:3001' : '';
    var quoteEndpoint = apiBase + '/api/quote';
    console.log('[QUOTE FORM] Submitting quote enquiry to:', quoteEndpoint);

    fetch(quoteEndpoint, {
      method: 'POST',
      body: data
    })
    .then(function(res) {
      return res.json().then(function(d) { return { ok: res.ok, data: d }; });
    })
    .then(function(result) {
      if (result.ok) {
        form.reset();
        form.style.display = 'none';
        var msgSpan = success.querySelector('span');
        if (msgSpan) {
          msgSpan.textContent = result.data.message || 'Thank you \u2014 we\u2019ll be in touch shortly!';
        } else {
          success.textContent = result.data.message || 'Thank you \u2014 we\u2019ll be in touch shortly!';
        }
        success.classList.add('show');
        success.focus();
      } else {
        if (result.data.fields) {
          Object.keys(result.data.fields).forEach(function(k) {
            setFieldError(k, result.data.fields[k]);
          });
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

  /* ---- Before & After Reusable Transformation Slideshow ---- */
  (function(){
    // Reusable data structure for before/after projects
    var projects = [
      {
        id: 'splashback',
        title: 'Kitchen Splashback Transformation',
        description: 'Removing dated tiled grout lines and installing a seamless, custom heat-toughened glass splashback in a matched colour creates an immaculate contemporary finish.',
        before: 'media/work/kitchen-splashback-before.jpg',
        after: 'media/work/kitchen-splashback-after.jpg',
        beforeAlt: 'Before: dated kitchen tiled splashback with visible grout joints',
        afterAlt: 'After: modern seamless toughened glass splashback installation'
      },
      {
        id: 'vanity-mirror',
        title: 'Custom Vanity Mirror Fit-Out',
        description: 'Replacing an incomplete vanity mirror with a single polished custom-cut panel gives the whole basin wall a clean, seamless finish with no visible joins.',
        before: 'media/work/vanity-mirror-before.jpg',
        after: 'media/work/vanity-mirror-after.jpg',
        beforeAlt: 'Before: vanity with incomplete shelving and patchwork mirror',
        afterAlt: 'After: full-width polished custom mirror over the timber vanity'
      }
    ];

    window.BEFORE_AFTER_PROJECTS = projects; // Expose reusable structure

    var currentIdx = 0;
    var counterEl = document.getElementById('baCounter');
    var titleEl = document.getElementById('baProjTitle');
    var descEl = document.getElementById('baProjDesc');
    var prevBtn = document.getElementById('baPrevBtn');
    var nextBtn = document.getElementById('baNextBtn');
    var dotsContainer = document.getElementById('baDots');

    var container = document.getElementById('baContainer');
    var beforeLayer = document.getElementById('baBeforeLayer');
    var handle = document.getElementById('baHandle');
    var beforeImg = document.getElementById('baBeforeImg');
    var afterImg = document.getElementById('baAfterImg');

    if (!container || !beforeLayer || !handle) return;

    function renderDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = projects.map(function(p, i) {
        return '<button type="button" class="ba-dot' + (i === currentIdx ? ' active' : '') + '" data-idx="' + i + '" aria-label="Go to project ' + (i + 1) + '"></button>';
      }).join('');
      dotsContainer.querySelectorAll('.ba-dot').forEach(function(dot) {
        dot.addEventListener('click', function() {
          var idx = parseInt(dot.dataset.idx, 10);
          showProject(idx);
        });
      });
    }

    function showProject(idx) {
      if (idx < 0) idx = projects.length - 1;
      if (idx >= projects.length) idx = 0;
      currentIdx = idx;

      var p = projects[currentIdx];
      if (counterEl) counterEl.textContent = 'Project ' + (currentIdx + 1) + ' of ' + projects.length;
      if (titleEl) titleEl.textContent = p.title;
      if (descEl) descEl.textContent = p.description;

      if (beforeImg) {
        beforeImg.src = p.before;
        beforeImg.alt = p.beforeAlt || p.title;
      }
      if (afterImg) {
        afterImg.src = p.after;
        afterImg.alt = p.afterAlt || p.title;
      }

      // Reset slider to 50%
      beforeLayer.style.width = '50%';
      handle.style.left = '50%';

      // Update dots
      if (dotsContainer) {
        dotsContainer.querySelectorAll('.ba-dot').forEach(function(d, i) {
          d.classList.toggle('active', i === currentIdx);
        });
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function() { showProject(currentIdx - 1); });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function() { showProject(currentIdx + 1); });
    }

    renderDots();
    showProject(0);

    // Interactive split slider drag
    var dragging = false;

    function setPosition(xPos) {
      var rect = container.getBoundingClientRect();
      var offsetX = Math.max(0, Math.min(xPos - rect.left, rect.width));
      var percentage = (offsetX / rect.width) * 100;
      beforeLayer.style.width = percentage + '%';
      handle.style.left = percentage + '%';
    }

    function onPointerMove(e) {
      if (!dragging) return;
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setPosition(clientX);
    }

    function onPointerDown(e) {
      dragging = true;
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setPosition(clientX);
    }

    function onPointerUp() {
      dragging = false;
    }

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
  })();

  /* ---- Dynamic Customer Reviews System ---- */
  (function(){
    var reviewsGrid = document.getElementById('reviewsGrid');
    var openModalBtn = document.getElementById('openReviewModalBtn');
    var closeModalBtn = document.getElementById('closeReviewModalBtn');
    var cancelModalBtn = document.getElementById('cancelReviewBtn');
    var modal = document.getElementById('reviewModal');
    var form = document.getElementById('customerReviewForm');
    var formError = document.getElementById('revFormError');
    var submitBtn = document.getElementById('revSubmitBtn');
    var successState = document.getElementById('revSuccessState');
    var successCloseBtn = document.getElementById('revSuccessCloseBtn');
    var googleBtn = document.getElementById('googleReviewBtn');

    var starPicker = document.getElementById('starPicker');
    var ratingInput = document.getElementById('revRating');
    var ratingLabel = document.getElementById('ratingLabelText');
    var revText = document.getElementById('revText');
    var charCount = document.getElementById('revCharNum');
    var photoInput = document.getElementById('revPhoto');
    var photoPreview = document.getElementById('revPhotoPreview');
    var photoImg = document.getElementById('revPhotoImg');
    var removePhotoBtn = document.getElementById('revRemovePhotoBtn');

    var ratingLabels = {
      1: '1 Star (Poor)',
      2: '2 Stars (Fair)',
      3: '3 Stars (Good)',
      4: '4 Stars (Very Good)',
      5: '5 Stars (Excellent)'
    };

    function esc(str){
      if(!str) return '';
      return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function getInitials(name){
      if(!name) return 'CGI';
      var parts = name.trim().split(/\s+/);
      if(parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }

    function formatReviewDate(iso){
      if(!iso) return '';
      try {
        var d = new Date(iso);
        if(isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
      } catch { return ''; }
    }

    // 1. Fetch public configuration (e.g. Google Review URL)
    function loadConfig(){
      fetch('/api/config')
        .then(function(r){ return r.json(); })
        .then(function(cfg){
          if(cfg && cfg.googleReviewUrl && googleBtn){
            googleBtn.href = cfg.googleReviewUrl;
          }
        })
        .catch(function(){});
    }

    // 2. Load Approved Reviews from SQLite Database
    function loadApprovedReviews(){
      if(!reviewsGrid) return;
      fetch('/api/reviews')
        .then(function(r){ return r.json(); })
        .then(function(res){
          var reviews = (res && res.data) ? res.data : [];
          renderReviews(reviews);
        })
        .catch(function(){
          renderReviews([]);
        });
    }

    function renderReviews(list){
      if(!reviewsGrid) return;

      if(!list || list.length === 0){
        // Honest, transparent empty state when 0 reviews have been approved yet
        reviewsGrid.innerHTML =
          '<div class="rev-empty-card">' +
            '<svg class="rev-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
            '<h3>Be the First to Review Us</h3>' +
            '<p>We take pride in our architectural glass craftsmanship. If our family team has recently completed a shower screen, splashback, mirror, or glass repair for you, we invite you to share your experience!</p>' +
            '<button type="button" class="btn-cut btn-cut-solid btn-empty-rev" id="emptyRevBtn">Write a Review</button>' +
          '</div>';

        var emptyBtn = document.getElementById('emptyRevBtn');
        if(emptyBtn){
          emptyBtn.addEventListener('click', openModal);
        }
        return;
      }

      var isDevEnv = (function(){
        try {
          var h = window.location.hostname || '';
          return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h.indexOf('192.168.') === 0 || h.indexOf('10.') === 0 || h.endsWith('.local') || window.location.port === '3001' || window.location.port === '3000';
        } catch(e){ return false; }
      })();

      reviewsGrid.innerHTML = list.map(function(r){
        var starsStr = '★★★★★'.slice(0, Math.max(1, Math.min(5, r.rating || 5)));
        var initials = getInitials(r.name);
        var dateStr = formatReviewDate(r.approved_at || r.created_at);

        var photoHtml = r.photoUrl ?
          '<div class="rev-photo-box"><img src="' + esc(r.photoUrl) + '" alt="Project photo by ' + esc(r.name) + '" loading="lazy"></div>' :
          '';

        var demoIndicator = (r.is_demo && isDevEnv) ?
          '<span class="rev-demo-badge" title="Development demo preview — not a verified customer review">Sample Preview</span>' : '';

        return '<div class="review-card">' +
          '<div>' +
            '<div class="rev-top-meta">' +
              '<div class="rev-stars" aria-label="' + (r.rating || 5) + ' out of 5 stars">' + starsStr + '</div>' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                demoIndicator +
                (dateStr ? '<span class="rev-date-badge">' + esc(dateStr) + '</span>' : '') +
              '</div>' +
            '</div>' +
            '<p class="rev-text">&ldquo;' + esc(r.review) + '&rdquo;</p>' +
            photoHtml +
          '</div>' +
          '<div class="rev-author">' +
            '<div class="rev-avatar" aria-hidden="true">' + esc(initials) + '</div>' +
            '<div>' +
              '<b>' + esc(r.name) + '</b>' +
              '<span>' + esc(r.suburb) + (r.service ? ' · ' + esc(r.service) : '') + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    // 3. Modal Handlers
    function openModal(){
      if(!modal) return;
      if(form) form.style.display = 'block';
      if(successState) successState.style.display = 'none';
      if(formError) formError.style.display = 'none';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      var firstInput = document.getElementById('revName');
      if(firstInput) setTimeout(function(){ firstInput.focus(); }, 100);
    }

    function closeModal(){
      if(!modal) return;
      modal.classList.remove('open');
      document.body.style.overflow = '';
      if(form) form.reset();
      if(photoPreview) photoPreview.style.display = 'none';
      if(photoImg) photoImg.src = '';
      setRating(5);
    }

    if(openModalBtn) openModalBtn.addEventListener('click', openModal);
    if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if(cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
    if(successCloseBtn) successCloseBtn.addEventListener('click', closeModal);

    if(modal){
      modal.addEventListener('click', function(e){
        if(e.target === this) closeModal();
      });
      document.addEventListener('keydown', function(e){
        if(e.key === 'Escape' && modal.classList.contains('open')) closeModal();
      });
    }

    // 4. Star Picker Interactivity
    function setRating(val){
      val = Math.max(1, Math.min(5, parseInt(val, 10) || 5));
      if(ratingInput) ratingInput.value = val;
      if(ratingLabel) ratingLabel.textContent = ratingLabels[val] || (val + ' Stars');
      if(starPicker){
        var btns = starPicker.querySelectorAll('.star-btn');
        btns.forEach(function(b){
          var bVal = parseInt(b.dataset.val, 10);
          b.classList.toggle('active', bVal <= val);
        });
      }
    }

    if(starPicker){
      starPicker.addEventListener('click', function(e){
        var btn = e.target.closest('.star-btn');
        if(btn){
          var val = parseInt(btn.dataset.val, 10);
          setRating(val);
        }
      });

      starPicker.addEventListener('mouseover', function(e){
        var btn = e.target.closest('.star-btn');
        if(btn){
          var hoverVal = parseInt(btn.dataset.val, 10);
          var btns = starPicker.querySelectorAll('.star-btn');
          btns.forEach(function(b){
            var bVal = parseInt(b.dataset.val, 10);
            b.classList.toggle('active', bVal <= hoverVal);
          });
        }
      });

      starPicker.addEventListener('mouseleave', function(){
        var current = ratingInput ? parseInt(ratingInput.value, 10) || 5 : 5;
        setRating(current);
      });
    }

    // 5. Character count
    if(revText && charCount){
      revText.addEventListener('input', function(){
        charCount.textContent = revText.value.length;
      });
    }

    // 6. Photo preview
    if(photoInput){
      photoInput.addEventListener('change', function(){
        if(photoInput.files && photoInput.files[0]){
          var file = photoInput.files[0];
          if(!file.type.match(/^image\//i)){
            alert('Please select a valid image file (JPEG, PNG, WEBP).');
            photoInput.value = '';
            return;
          }
          if(file.size > 8 * 1024 * 1024){
            alert('Photo size is too large (maximum 8MB).');
            photoInput.value = '';
            return;
          }
          var reader = new FileReader();
          reader.onload = function(e){
            if(photoImg) photoImg.src = e.target.result;
            if(photoPreview) photoPreview.style.display = 'flex';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if(removePhotoBtn){
      removePhotoBtn.addEventListener('click', function(){
        if(photoInput) photoInput.value = '';
        if(photoImg) photoImg.src = '';
        if(photoPreview) photoPreview.style.display = 'none';
      });
    }

    // 7. Review Form Submission
    if(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        if(formError) formError.style.display = 'none';

        var nameVal = document.getElementById('revName') ? document.getElementById('revName').value.trim() : '';
        var suburbVal = document.getElementById('revSuburb') ? document.getElementById('revSuburb').value.trim() : '';
        var serviceVal = document.getElementById('revService') ? document.getElementById('revService').value : '';
        var textVal = revText ? revText.value.trim() : '';
        var ratingVal = ratingInput ? ratingInput.value : '5';

        // Validation
        if(!nameVal || nameVal.length < 2){
          showError('Please enter your name.');
          return;
        }
        if(!suburbVal || suburbVal.length < 2){
          showError('Please enter your suburb.');
          return;
        }
        if(!serviceVal){
          showError('Please select the service provided.');
          return;
        }
        if(!textVal || textVal.length < 10){
          showError('Please enter a review of at least 10 characters.');
          return;
        }

        var formData = new FormData(form);
        var origBtnText = submitBtn ? submitBtn.querySelector('.rev-btn-text').textContent : 'Submit Review';
        if(submitBtn){
          submitBtn.disabled = true;
          submitBtn.querySelector('.rev-btn-text').textContent = 'Submitting...';
        }

        fetch('/api/reviews', {
          method: 'POST',
          body: formData
        })
        .then(function(r){
          return r.json().then(function(d){ return { ok: r.ok, data: d }; });
        })
        .then(function(res){
          if(res.ok && res.data.success){
            if(form) form.style.display = 'none';
            if(successState) successState.style.display = 'block';
          } else {
            showError(res.data.error || 'Failed to submit review. Please try again.');
          }
        })
        .catch(function(){
          showError('Connection error submitting review. Please check your internet connection.');
        })
        .finally(function(){
          if(submitBtn){
            submitBtn.disabled = false;
            submitBtn.querySelector('.rev-btn-text').textContent = origBtnText;
          }
        });
      });
    }

    function showError(msg){
      if(!formError) return;
      formError.textContent = msg;
      formError.style.display = 'block';
      formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Initial load
    loadConfig();
    loadApprovedReviews();
  })();

  /* ---- Site video strip: play in view, pause out of view ---- */
  (function(){
    var vids = document.querySelectorAll('#siteVideos video');
    if(!vids.length || reduceMotion || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        var v = en.target;
        if(en.isIntersecting){
          var p = v.play();
          if(p && p.catch) p.catch(function(){});
        } else if(!v.paused){
          v.pause();
        }
      });
    }, { threshold: 0.55 });
    vids.forEach(function(v){ io.observe(v); });
  })();
})();
