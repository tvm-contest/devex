
import { render, unmountComponentAtNode } from 'react-dom';
import App from '../../App';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../../store/store';
// @ts-ignore
import styles from '../../index.sass';
// @ts-ignore
import appStyles from '../../routes/index.sass';

class DebotBrowserElement extends HTMLElement {
  _innerHTML: string | undefined;
  static observedAttributes = ['value'];


  connectedCallback() {
    this._innerHTML = this.innerHTML;
    this.mount();
  }

  disconnectedCallback() {
    this.unmount();
  }

  attributeChangedCallback() {
    this.unmount();
    this.mount();
  }

  mount() {
    // const props = {
    //   ...this.getProps(this.attributes),
    //   ...this.getEvents(),
    //   children: this.innerHTML
    // };
    //   render(
    //     <BrowserRouter>
    //       <Provider store={store}><App />
    //   </Provider>
    // </BrowserRouter>, this);
    const mountPoint = document.createElement('span');
    this.attachShadow({ mode: 'open' }).appendChild(mountPoint);
    let styleTag = document.createElement('style');
    let appStyleTag = document.createElement('style');
    styleTag.innerHTML = styles;
    appStyleTag.innerHTML = appStyles;
    if (this.shadowRoot) {
      this.shadowRoot.appendChild(styleTag)
      this.shadowRoot.appendChild(appStyleTag)
    }
    render(
      <BrowserRouter>
        <Provider store={store}>
          <App />
        </Provider>
      </BrowserRouter>,
      mountPoint);
  }

  unmount() {
    unmountComponentAtNode(this);
  }

  getProps(attributes: any[]) {
    return [...attributes]
      .filter(attr => attr.name !== 'style')
      .map(attr => this.convert(attr.name, attr.value))
      .reduce((props, prop) =>
        ({ ...props, [prop.name]: prop.value }), {});
  }

  getEvents() {
    return Object.values(this.attributes)
      .filter(key => /on([a-z].*)/.exec(key.name))
      .reduce((events, ev) => ({
        ...events,
        [ev.name]: (args: any) =>
          this.dispatchEvent(new CustomEvent(ev.name, { ...args }))
      }), {});
  }
  // TODO: remove any
  convert(attrName: string, attrValue: any) {
    let value = attrValue;
    if (attrValue === 'true' || attrValue === 'false')
      value = attrValue === 'true';
    else if (!isNaN(attrValue) && attrValue !== '')
      value = +attrValue;
    else if (/^{.*}/.exec(attrValue))
      value = JSON.parse(attrValue);
    return {
      name: attrName,
      value: value
    };
  }
}

customElements.define('debot-browser', DebotBrowserElement)