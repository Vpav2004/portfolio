const trigger = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const submenus = [...navigation.querySelectorAll('details')];
const compact = matchMedia('(max-width: 860px)');
const flowLayout = matchMedia('(max-width: 700px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function setMenu(open) {
  navigation.hidden = compact.matches && !open;
  trigger.setAttribute('aria-expanded', String(open && compact.matches));
}
function syncMenu() {
  trigger.hidden = !compact.matches;
  setMenu(false);
}
trigger.addEventListener('click', () => setMenu(navigation.hidden));
compact.addEventListener('change', syncMenu);
syncMenu();
submenus.forEach(menu => {
  menu.addEventListener('toggle', () => {
    if (menu.open) submenus.forEach(other => { if (other !== menu) other.open = false; });
  });
});
document.addEventListener('click', event => {
  submenus.forEach(menu => { if (!menu.contains(event.target)) menu.open = false; });
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || document.querySelector('.lightbox[open]')) return;
  const menu = submenus.find(item => item.open);
  if (menu) {
    menu.open = false;
    menu.querySelector('summary').focus();
  } else if (compact.matches && !navigation.hidden) {
    setMenu(false);
    trigger.focus();
  }
});

const sections = [...document.querySelectorAll('.design-section')];
function fitSections() {
  const width = document.documentElement.clientWidth;
  sections.forEach(section => {
    const stage = section.querySelector('.design-stage');
    const minimum = Number(section.style.getPropertyValue('--design-min'));
    stage.style.setProperty('--stage-zoom', flowLayout.matches ? 1 : Math.min(1, width / minimum));
  });
}
window.addEventListener('resize', fitSections);
fitSections();

if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('waiting');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.06 });
  document.querySelectorAll('[data-motion]').forEach(item => {
    item.classList.add('waiting');
    observer.observe(item);
    item.addEventListener('focusin', () => item.classList.remove('waiting'));
  });
}
const videos = [...document.querySelectorAll('.design-stage video')];
function syncVideos() {
  videos.forEach(video => {
    if (reducedMotion.matches) video.pause();
    else video.play().catch(() => {});
  });
}
reducedMotion.addEventListener('change', syncVideos);
syncVideos();

const dialog = document.querySelector('.lightbox');
if (dialog) {
  const buttons = Array.from(document.querySelectorAll('.photo-button'));
  const photos = buttons.map(button => button.querySelector('img'));
  const target = dialog.querySelector('img');
  const caption = dialog.querySelector('figcaption');
  let index = 0;
  let opener;
  function showPhoto(direction) {
    index = (index + direction + photos.length) % photos.length;
    target.src = photos[index].src;
    target.alt = photos[index].alt;
    caption.textContent = photos[index].alt;
  }
  buttons.forEach((button, number) => {
    button.addEventListener('click', () => {
      index = number;
      opener = button;
      showPhoto(0);
      dialog.showModal();
    });
  });
  dialog.querySelector('.previous-photo').addEventListener('click', () => showPhoto(-1));
  dialog.querySelector('.next-photo').addEventListener('click', () => showPhoto(1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') showPhoto(-1);
    if (event.key === 'ArrowRight') showPhoto(1);
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => opener?.focus());
}
