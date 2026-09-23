import { chapterMailto } from '../contact.js';

const navItems = [
  { href: './index.html', label: 'Home', page: 'home' },
  { href: './events.html', label: 'Events', page: 'events' },
  { href: './resources.html', label: 'Resources', page: 'resources' },
  { href: './shop.html', label: 'Merch', page: 'shop' },
];

const externalLink = (url) => url.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';

export const renderSiteChrome = () => {
  const page = document.body.dataset.page || 'home';
  const header = document.querySelector('[data-site-header]');
  const footer = document.querySelector('[data-site-footer]');

  if (header) {
    header.innerHTML = `
      <nav class="nav" aria-label="Primary navigation">
        <a class="nav__brand" href="./index.html" aria-label="PHS DECA home">
          <img class="nav__mark" src="./images/logo.png" alt="" width="38" height="50" />
          <span>PHS DECA</span>
        </a>
        <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="site-menu">
          <span class="sr-only">Open navigation</span><i></i><i></i>
        </button>
        <div class="nav__menu" id="site-menu">
          <ul class="nav__links">
            ${navItems.map((item) => `<li><a class="nav-link${item.page === page ? ' is-current' : ''}"${item.page === page ? ' aria-current="page"' : ''} href="${item.href}">${item.label}</a></li>`).join('')}
          </ul>
          <a class="button button--small button--solid nav__join" href="./join.html" aria-label="Join DECA" title="Join DECA"${page === 'join' ? ' aria-current="page"' : ''}>Join DECA <span aria-hidden="true">↗</span></a>
        </div>
      </nav>
    `;
  }

  if (footer) {
    footer.innerHTML = `
      <div class="wrap">
        <div class="footer__top">
          <div>
            <h2 class="contact__headline">Contact<br /><span class="blue">PHS DECA.</span></h2>
          </div>
          <div class="footer__action">
            <p>Want to join or have a question about events? Get in touch with our officers.</p>
            <a class="button button--solid" href="${chapterMailto('PHS DECA question')}">Contact our officers <span aria-hidden="true">↗</span></a>
            <div class="footer__links" aria-label="Footer navigation">
              <a href="./events.html">Events</a>
              <a href="./resources.html">Resources</a>
              <a href="./join.html">Join</a>
              <a href="./shop.html">Merch</a>
            </div>
            <div class="footer__socials">
              <a href="https://www.instagram.com/parhighdeca/?hl=en"${externalLink('https://www.instagram.com/parhighdeca/?hl=en')}>Instagram</a>
              <a href="https://www.tiktok.com/@parhighdeca"${externalLink('https://www.tiktok.com/@parhighdeca')}>TikTok</a>
            </div>
          </div>
        </div>
        <div class="footer-row"><span>PHS DECA</span><span>Parsippany High School · New Jersey</span><span>© ${new Date().getFullYear()}</span></div>
      </div>
    `;
  }

  const toggle = header?.querySelector('.nav__toggle');
  const menu = header?.querySelector('.nav__menu');
  const closeMenu = () => {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', 'false');
    header.classList.remove('is-menu-open');
    toggle.querySelector('.sr-only').textContent = 'Open navigation';
  };

  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    header.classList.toggle('is-menu-open', !open);
    toggle.querySelector('.sr-only').textContent = open ? 'Open navigation' : 'Close navigation';
  });
  menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) closeMenu();
  });
};
