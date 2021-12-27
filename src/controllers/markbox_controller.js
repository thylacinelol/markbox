import {
  Controller
} from "@hotwired/stimulus"

import {
  Dropbox
} from 'dropbox';

import {
  Transformer
} from 'markmap-lib';

import * as markmap from 'markmap-view';

const {
  Markmap,
  loadCSS,
  loadJS
} = markmap;

export default class extends Controller {
  static targets = ['auth', 'files', 'overlay', 'spinner', 'svg'];

  connect() {
    this.CLIENT_ID = 'lo5aq569kwde9cd';
    this.CLIENT_URL = 'https://thylacinelol.github.io/markbox';
    // this.CLIENT_URL = 'http://127.0.0.1:8000/';
    const storedAccessToken = this.getAccessTokenFromStorage();

    if (!storedAccessToken) {
      const redirectedAccessToken = this.getAccessTokenFromUrl();
      if (redirectedAccessToken) {
        window.localStorage.setItem('markbox:access_token', redirectedAccessToken);

        this.listFiles();
      } else {
        this.renderDropboxAuthLinks();
      }
    } else {
      this.listFiles();
    }
  }

  listFiles() {
    const dbx = new Dropbox({
      accessToken: this.getAccessTokenFromStorage(),
    });

    dbx.filesListFolder({
        path: ''
      })
      .then((response) => {
        this.renderFiles(response.result.entries);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  renderFiles(files) {
    const domFiles = [];

    files.forEach((file) => {
      if (file.name.endsWith('.md')) {
        // const queryParams = new URLSearchParams(window.location.search);
        // queryParams.set('file', file.name);
        domFiles.push(`<button class="markbox__file" data-action="markbox#openOverlay" data-filename="${file.name}">${file.name}</button>`);
      }
    });

    this.filesTarget.innerHTML = domFiles.join("\n");
    this.filesTarget.style.display = 'flex';
  }

  openOverlay(e) {
    const filename = e.target.dataset.filename;

    this.spinnerTarget.style.display = 'block';
    this.overlayTarget.style.display = 'block';
    this.svgTarget.innerHTML = '';

    const dbx = new Dropbox({
      accessToken: this.getAccessTokenFromStorage(),
    });

    dbx.filesDownload({
        path: `/${filename}`
      })
      .then((response) => {
        const blob = response.result.fileBlob;
        const reader = new FileReader();
        reader.addEventListener('loadend', () => {
          const markmap = this.transformMarkdownToMarkmap(reader.result);
          this.renderMarkmap(markmap);

          this.spinnerTarget.style.display = 'none';
        });
        reader.readAsText(blob);
      })
      .catch((error) => {
        console.error('Error while downloading dropbox file:');
        console.log(error);
      });
  }

  closeOverlay(e) {
    this.overlayTarget.style.display = 'none';
    this.svgTarget.innerHTML = '';
  }

  requestAccessToken() {}

  getUrlParams(url) {
    let hashes = url.slice(url.indexOf('?') + 1).split('&');
    let params = {};
    hashes.map(hash => {
      let [key, val] = hash.split('=')
      params[key] = decodeURIComponent(val)
    })

    return params;
  }

  getAccessToken() {
    return this.getAccessTokenFromStorage() || this.getAccessTokenFromUrl();
  }

  // Parses the url and gets the access token if it is in the urls hash
  getAccessTokenFromUrl() {
    return this.getUrlParams(window.location.hash)['#access_token'];
  }

  getAccessTokenFromStorage() {
    const fromStorage = window.localStorage.getItem('markbox:access_token');

    if (typeof (fromStorage) === 'string' && fromStorage.length > 0) {
      return fromStorage;
    }
  }

  renderDropboxAuthLinks() {
    const dbx = new Dropbox({
      clientId: this.CLIENT_ID,
    });

    dbx.auth.getAuthenticationUrl(this.CLIENT_URL)
      .then((authUrl) => {
        this.authTarget.innerHTML = `
          <a href="${authUrl}">Click here to Connect your Dropbox account</a>
        `;
      })
  }

  transformMarkdownToMarkmap(markdown) {
    const transformer = new Transformer();

    const {
      root,
      features
    } = transformer.transform(markdown);

    const {
      styles,
      scripts
    } = transformer.getUsedAssets(features);

    if (styles) loadCSS(styles);
    if (scripts) loadJS(scripts, {
      getMarkmap: () => markmap
    });

    return root;
  }

  renderMarkmap(root) {
    const options = {};
    Markmap.create(this.svgTarget, options, root);
  }

  disconnect() {}
}