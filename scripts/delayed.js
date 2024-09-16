// add delayed functionality here
import {
  getMetadata,
} from './aem.js';
import {
  div, p, section, a, button,
  span, i,
} from './dom-helpers.js';
import {
  getLanguage, fetchLanguageNavigation,
} from './utils.js';
/**
 * Swoosh on page
 */
function pageSwoosh() {
  const pSwoosh = getMetadata('page-swoosh');
  if (!pSwoosh || pSwoosh.length < 1) return;
  if (pSwoosh !== 'page-swoosh-no') {
    document.body.classList.add(pSwoosh);
  } else {
    document.body.classList.remove(pSwoosh);
  }
}

const setConsentCookie = (name, value, daysToExpire, cookieSection) => {
  const currDate = new Date();
  currDate.setTime(currDate.getTime() + (daysToExpire * 24 * 60 * 60 * 1000));

  const expiration = `expires=${currDate.toUTCString()}`;
  const url = new URL(window.location.href);
  const domain = `; domain=${url.hostname};`;
  document.cookie = `${name}=${value}; ${expiration}; path=/${domain}`;
  cookieSection.style.display = 'none';
};

function cookiePopUp() {
  const consentCookie = document.cookie.replace(/(?:(?:^|.*;\s*)consent_cookie\s*=\s*([^;]*).*$)|^.*$/, '$1');
  if (consentCookie.indexOf('1') >= 0) {
    return;
  }

  const cookieSection = section({ class: 'cookie-tooltip' });
  const placeholders = window.placeholders[`/${getLanguage()}`] || {};
  const hasCookieText = !!(placeholders && placeholders.cookiePopUpText);
  if (!hasCookieText) return;
  const cookieContainer = div(
    { class: 'container' },
    p(
      `${placeholders.cookiePopUpText}`,
      a(
        { href: `${placeholders.cookiePopUpLearnMoreLink || '#'}` },
        `${placeholders.cookiePopUpLearnMoreLinkLabel || 'Click Here'}`,
      ),
    ),
    button(
      {
        type: 'button',
        class: 'close accept-consent',
        'aria-label': `${placeholders.cookiePopUpCloseAriaLabel || 'Close Cookie Notification'}`,
        onclick: () => setConsentCookie('consent_cookie', '1', 365, cookieSection),
      },
      span(
        { 'aria-hidden': 'true' },
        '×',
      ),
    ),
  );

  cookieSection.append(cookieContainer);
  const footerTag = document.querySelector('footer');
  footerTag.append(cookieSection);
}

const getNavigationData = async (langCode) => {
  await fetchLanguageNavigation(`/${langCode}`);
};

// refactor tweetable links function
/**
 * Opens a popup for the Twitter links autoblock.
 */
function openPopUp(popUrl) {
  const popupParams = `height=450, width=550, top=${(window.innerHeight / 2 - 275)}`
   + `, left=${(window.innerWidth / 2 - 225)}`
   + ', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0';
  window.open(popUrl, 'fbShareWindow', popupParams);
}

/**
 * Finds and decorates anchor elements with Twitter hrefs
 */
function buildTwitterLinks() {
  const main = document.querySelector('main');
  if (!main) return;

  // get all paragraph elements
  const paras = main.querySelectorAll('p');
  const url = window.location.href;
  const encodedUrl = encodeURIComponent(url);

  [...paras].forEach((p) => {
    const tweetables = p.innerHTML.match(/&lt;tweetable[^>]*&gt;([\s\S]*?)&lt;\/tweetable&gt;/g);
    if (tweetables) {
      tweetables.forEach((tweetableTag) => {
        const matchedContent = tweetableTag.match(
          /&lt;tweetable(?:[^>]*data-channel=['"]([^'"]*)['"])?(?:[^>]*data-hashtag=['"]([^'"]*)['"])?[^>]*&gt;([\s\S]*?)&lt;\/tweetable&gt;/
        );
        const channel = matchedContent[1] || '';
        const hashtag = matchedContent[2] || '';
        const tweetContent = matchedContent[3];

        let modalURL = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetContent)}`
          + `&original_referrer=${encodedUrl}&source=tweetbutton`;
        if (channel) modalURL += `&via=${encodeURIComponent(channel.charAt(0) === '@' ? channel.substring(1) : channel)}`;
        if (hashtag) modalURL += `&hashtags=${encodeURIComponent(hashtag)}`;

        const span = document.createElement('span');
        const tweetableEl = span({ class: 'tweetable' },
          a({ href: modalURL, target: '_blank', tabindex: 0 }, tweetContent,
            i({ class: 'lp lp-twit' }),
          )
        );
        /*span.classList.add('tweetable');
        const anchor = document.createElement('a');
        anchor.href = modalURL;
        anchor.target= '_blank';
        anchor.textContent = tweetContent;
        const icon = document.createElement('i');
        icon.classList.add('lp', 'lp-twit');
        anchor.appendChild(icon);
        span.appendChild(anchor);
        */

        //p.innerHTML = p.innerHTML.replace(tweetableTag, span.outerHTML);
        p.innerHTML = p.innerHTML.replace(tweetableTag, tweetableEl.outerHTML);
      });
    }
    [...p.querySelectorAll('.tweetable > a')].forEach((twitterAnchor) => {
      twitterAnchor.addEventListener('click', (event) => {
        event.preventDefault();
        const url = twitterAnchor.href;
        openPopUp(url);
      });
    })
  });
}

function loadDelayed() {
  pageSwoosh();
  cookiePopUp();
  buildTwitterLinks();
  getNavigationData(getLanguage());
}
loadDelayed();
