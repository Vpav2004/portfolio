const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const intro = document.querySelector('#boot');
const frame = document.querySelector('#portfolio');
const menus = [...document.querySelectorAll('.nav-group')];

function closeMenus(except) {
  menus.forEach(menu => { if (menu !== except) menu.open = false; });
}

menus.forEach(menu => {
  const summary = menu.querySelector('summary');
  let pinned = false;

  menu.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    closeMenus(menu);
    menu.open = true;
  });
  menu.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && !pinned && !menu.contains(document.activeElement)) menu.open = false;
  });
  summary.addEventListener('click', event => {
    if (event.pointerType !== 'mouse' || !menu.matches(':hover')) return;
    event.preventDefault();
    pinned = !pinned;
    closeMenus(menu);
    menu.open = pinned;
  });
  menu.addEventListener('toggle', () => {
    if (menu.open) closeMenus(menu);
    else pinned = false;
  });
  menu.addEventListener('focusout', event => {
    if (!menu.contains(event.relatedTarget) && !menu.matches(':hover')) menu.open = false;
  });
});

document.addEventListener('click', event => {
  if (!event.target.closest('.nav-group')) closeMenus();
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const menu = menus.find(item => item.open);
  if (!menu) return;
  menu.open = false;
  if (menu.contains(document.activeElement)) menu.querySelector('summary').focus();
});

if (intro && !motionPreference.matches) {
  let seen = false;
  try { seen = sessionStorage.getItem('portfolio-intro-v2') === 'seen'; } catch {}
  if (!seen) {
    const lines = [...intro.querySelectorAll('[data-type]')];
    const skip = intro.querySelector('.skip-intro');
    let cursor = 0;
    let row = 0;
    let timer;
    let closed = false;
    intro.hidden = false;
    frame.inert = true;
    skip.focus({preventScroll:true});

    function closeIntro(fromUser = false) {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      document.removeEventListener('keydown', handleSkip);
      try { sessionStorage.setItem('portfolio-intro-v2', 'seen'); } catch {}
      frame.inert = false;
      intro.classList.add('closing');
      setTimeout(() => {
        intro.hidden = true;
        if (fromUser) document.querySelector('main').focus({preventScroll:true});
      }, 250);
    }

    function handleSkip(event) {
      if (event.key === 'Enter' || event.key === 'Escape') {
        event.preventDefault();
        closeIntro(true);
      }
    }

    function typeNext() {
      if (closed) return;
      const line = lines[row];
      cursor += 2;
      line.textContent = line.dataset.type.slice(0,cursor);
      if (cursor < line.dataset.type.length) {
        timer = setTimeout(typeNext, 34);
      } else if (++row < lines.length) {
        cursor = 0;
        timer = setTimeout(typeNext, 190);
      } else {
        timer = setTimeout(closeIntro, 580);
      }
    }
    intro.addEventListener('click', () => closeIntro(true));
    document.addEventListener('keydown', handleSkip);
    timer = setTimeout(typeNext, 220);
  }
}

if ('IntersectionObserver' in window && !motionPreference.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      if (!isIntersecting) return;
      target.classList.remove('waiting');
      observer.unobserve(target);
    });
  }, {threshold:.035});
  document.querySelectorAll('[data-reveal]').forEach(node => {
    if (node.getBoundingClientRect().top > innerHeight) node.classList.add('waiting');
    node.addEventListener('focusin', () => node.classList.remove('waiting'));
    observer.observe(node);
  });
}

const filters = document.querySelector('.filters');
if (filters) {
  filters.hidden = false;
  const buttons = [...filters.querySelectorAll('button')];
  const cards = [...document.querySelectorAll('main > .project-grid > [data-group]')];
  buttons.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    cards.forEach(card => { card.hidden = category !== 'all' && category !== card.dataset.group; });
  }));
}

document.querySelectorAll('.video').forEach(figure => {
  const video = figure.querySelector('video');
  const control = figure.querySelector('.video-control');
  control.hidden = false;
  const sync = () => {
    control.textContent = video.paused ? 'Lire l’animation' : 'Mettre en pause';
    control.setAttribute('aria-pressed', String(video.paused));
  };
  if (motionPreference.matches) video.pause();
  control.addEventListener('click', () => video.paused ? video.play().catch(sync) : video.pause());
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  sync();
});

const gallery = document.querySelector('.lightbox');
const photos = [...document.querySelectorAll('.photo-button')];
if (gallery && photos.length) {
  const img = gallery.querySelector('img');
  const caption = gallery.querySelector('figcaption');
  let current = 0;
  let opener;

  function show(offset) {
    current = (current + offset + photos.length) % photos.length;
    const photo = photos[current].querySelector('img');
    img.src = photo.src;
    img.alt = photo.alt;
    caption.textContent = photo.alt || (current + 1) + ' / ' + photos.length;
  }

  photos.forEach((button, index) => button.addEventListener('click', () => {
    current = index;
    opener = button;
    show(0);
    gallery.showModal();
  }));
  gallery.querySelector('.photo-prev').addEventListener('click', () => show(-1));
  gallery.querySelector('.photo-next').addEventListener('click', () => show(1));
  gallery.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') show(-1);
    if (event.key === 'ArrowRight') show(1);
  });
  gallery.addEventListener('click', event => { if (event.target === gallery) gallery.close(); });
  gallery.addEventListener('close', () => opener?.focus());
}
