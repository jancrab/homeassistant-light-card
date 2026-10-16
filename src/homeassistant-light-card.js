import { LitElement, html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { validateConfig, entries, domainOf, brightnessSupported, brightnessPercent, serviceFor, relativeTime, lightColor, DOMAINS } from './config.js';
import { styles } from './styles.js';
import './editor.js';
export { validateConfig } from './config.js';
const ICONS = { light: 'mdi:lightbulb', switch: 'mdi:power-socket-eu', input_boolean: 'mdi:toggle-switch', fan: 'mdi:fan', automation: 'mdi:robot', button: 'mdi:gesture-tap-button', input_button: 'mdi:gesture-tap-button', scene: 'mdi:palette', script: 'mdi:script-text' };
const MOMENTARY = ['button', 'input_button', 'scene', 'script'];
export class LightCard extends LitElement {
  static properties = { hass: { attribute: false, hasChanged: () => true }, _states: { state: true, hasChanged: () => true }, _config: { state: true }, _layoutOverride: { state: true }, _width: { state: true } };
  static styles = styles;
  constructor() { super(); this._pending = new Set(); this._errors = new Map(); this._drafts = new Map(); this._queuedBrightness = new Map(); this._width = 800; }
  connectedCallback() {
    super.connectedCallback();
    const request = new CustomEvent('context-request', { bubbles: true, composed: true, cancelable: true });
    request.context = 'states'; request.subscribe = true;
    request.callback = (states, unsubscribe) => {
      if (!this.isConnected) { unsubscribe?.(); return; }
      this._states = states; this._unsubscribe = unsubscribe;
    };
    this.dispatchEvent(request);
    if (globalThis.ResizeObserver) {
      this._observer = new ResizeObserver(([entry]) => { this._width = entry.contentRect.width; });
      this._observer.observe(this);
    }
    this._syncClock();
  }
  disconnectedCallback() {
    this._unsubscribe?.(); this._unsubscribe = undefined; this._states = undefined;
    this._observer?.disconnect(); clearInterval(this._clock); this._clock = undefined; this._queuedBrightness.clear();
    super.disconnectedCallback();
  }
  _syncClock() {
    clearInterval(this._clock); this._clock = undefined;
    if (this.isConnected && (this._config?.appearance.show_last_changed || this._config?.compact?.show_last_changed)) {
      this._clock = setInterval(() => { if (!document.hidden) this.requestUpdate(); }, 30000);
    }
  }
  setConfig(config) { this._config = validateConfig(config); this._layoutOverride = undefined; this._drafts.clear(); this._queuedBrightness.clear(); this._errors.clear(); this._syncClock(); }
  static getStubConfig(hass) { const ids = Object.keys(hass?.states || {}).filter(id => id.startsWith('light.')).slice(0, 4); return { entities: ids.length ? ids : ['light.example'] }; }
  static async getConfigElement() {
    if (!customElements.get('ha-form')) {
      const helpers = await window.loadCardHelpers();
      await helpers.createCardElement({ type: 'entities', entities: [] }).constructor.getConfigElement();
    }
    return document.createElement('homeassistant-light-card-editor');
  }
  get _layout() { return this._layoutOverride || (this._config?.layout === 'auto' ? (this._width < 600 ? 'compact' : 'tablet') : this._config?.layout); }
  get _appearance() { return this._layout === 'compact' ? { ...this._config.appearance, icon_size: 28, ...this._config.compact } : this._config.appearance; }
  getCardSize() { return Math.max(1, Math.ceil((this.getBoundingClientRect().height || (this._layout === 'compact' ? (this._config?.entities.length || 1) * 100 : 240)) / 50)); }
  getGridOptions() { return { columns: 12, min_columns: 3 }; }
  _state(id) { return (this._states || this.hass?.states)?.[id]; }
  _unavailable(id, state) { return !state || state.state === 'unavailable' || (state.state === 'unknown' && !MOMENTARY.includes(domainOf(id))); }
  _moreInfo(id) { this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true })); }
  async _service(id, domain, service, data = {}) {
    if (this._pending.has(id) || this._unavailable(id, this._state(id))) return;
    this._pending.add(id); this._errors.delete(id); this.requestUpdate();
    try {
      if (!this.hass?.callService) throw new Error('Home Assistant is not connected.');
      await this.hass.callService(domain, service, { ...data, entity_id: id });
    } catch (error) { this._errors.set(id, error?.message || 'Action failed. Please try again.'); this._queuedBrightness.delete(id); }
    finally {
      this._pending.delete(id);
      const queued = this._queuedBrightness.get(id); this._queuedBrightness.delete(id);
      if (queued !== undefined && this.isConnected) {
        // Keep keyboard focus and coalesce rapid committed changes while a request is in flight.
        this._brightness(id, { target: { value: queued } });
      } else this._drafts.delete(id);
      this.requestUpdate();
    }
  }
  _tap(id) {
    if (this._config.tap_action === 'more-info') return this._moreInfo(id);
    if (this._config.tap_action !== 'none') return this._service(id, ...serviceFor(id));
  }
  _brightness(id, event) {
    const value = Number(event.target.value);
    if (!Number.isFinite(value) || value < 0 || value > 100 || !brightnessSupported(id, this._state(id))) return;
    if (this._pending.has(id)) { this._queuedBrightness.set(id, value); return; }
    return this._service(id, 'light', value === 0 ? 'turn_off' : 'turn_on', value === 0 ? {} : { brightness_pct: value });
  }
  _renderEntity(item) {
    const id = item.entity, state = this._state(id), options = this._appearance, domain = domainOf(id);
    const unavailable = this._unavailable(id, state), on = state?.state === 'on', busy = this._pending.has(id);
    const name = item.name || state?.attributes?.friendly_name || id;
    const pct = brightnessPercent(state), shownPct = this._drafts.get(id) ?? pct;
    const dimmable = brightnessSupported(id, state), momentary = MOMENTARY.includes(domain);
    const status = !state ? 'Entity not found' : unavailable ? (state.state === 'unknown' ? 'Unknown' : 'Unavailable') : momentary ? (domain === 'script' && on ? 'Running' : 'Ready') : (this.hass?.formatEntityState?.(state) || (on ? 'On' : state.state === 'off' ? 'Off' : state.state));
    const action = this._config.tap_action === 'more-info' ? 'Show details for' : momentary ? 'Activate' : on ? 'Turn off' : 'Turn on';
    const changed = options.show_last_changed ? relativeTime(state?.last_changed, this.hass?.locale?.language || this.hass?.language || 'en') : '';
    return html`<ha-card class=${`${on ? 'on' : ''} ${unavailable ? 'unavailable' : ''} ${options.show_glow ? 'glow' : ''} ${options.show_more_info ? 'has-info' : ''}`} style=${styleMap({ '--active': domain === 'light' ? lightColor(state, options.use_light_color) : 'var(--state-switch-active-color, var(--primary-color, #62a8eb))', '--icon-size': `${options.icon_size}px`, '--intensity': String(pct === null ? 1 : .35 + pct / 100 * .65) })}>
      <div class="scene" aria-hidden="true"></div>
      <button class="main" aria-label=${`${action} ${name}. ${status}`} aria-pressed=${!momentary && this._config.tap_action === 'toggle' ? String(on) : nothing} aria-busy=${String(busy)} ?disabled=${busy || this._config.tap_action === 'none' || (unavailable && this._config.tap_action !== 'more-info')} @click=${() => this._tap(id)}>
        ${options.show_icon ? html`<span class="icon-wrap" aria-hidden="true"><ha-icon .icon=${item.icon || state?.attributes?.icon || ICONS[domain]}></ha-icon></span>` : nothing}
        <span class="text">
          ${options.show_name ? html`<span class="name">${name}</span>` : nothing}
          ${options.show_state || unavailable || busy ? html`<span class="state" role="status"><span class="dot" aria-hidden="true"></span>${busy ? 'Sending…' : status}</span>` : nothing}
          ${changed ? html`<span class="changed" title=${state.last_changed}>${changed}</span>` : nothing}
        </span>
      </button>
      ${options.show_more_info ? html`<button class="info" aria-label=${`Show details for ${name}`} title="More info" @click=${() => this._moreInfo(id)}>⋯</button>` : nothing}
      ${options.show_brightness && dimmable && (!options.controls_when_on || on) ? html`<div class="controls">
        <input class="range" type="range" min="0" max="100" step="1" .value=${live(String(shownPct ?? 0))} style=${styleMap({ '--percent': `${shownPct ?? 0}%` })} aria-label=${`Brightness of ${name}`} aria-valuetext=${shownPct === null ? 'Brightness unknown' : `${shownPct}%`} aria-busy=${String(busy)} ?disabled=${unavailable}
          @input=${event => { this._drafts.set(id, Number(event.target.value)); this.requestUpdate(); }} @change=${event => this._brightness(id, event)} @pointercancel=${() => { this._drafts.delete(id); this.requestUpdate(); }}>
        ${options.show_brightness_value ? html`<output>${shownPct === null ? '—' : `${shownPct}%`}</output>` : nothing}
      </div>` : nothing}
      ${this._errors.has(id) ? html`<p class="error" role="alert">${this._errors.get(id)}</p>` : nothing}
    </ha-card>`;
  }
  render() {
    if (!this._config) return nothing;
    return html`<section class=${this._layout} style=${styleMap({ '--columns': String(this._config.columns), '--compact-columns': String(this._config.compact_columns) })} aria-label=${this._config.title || 'Light Card'}>
      ${this._config.title || this._config.show_layout_toggle ? html`<div class="toolbar">${this._config.title ? html`<h2>${this._config.title}</h2>` : nothing}${this._config.show_layout_toggle ? html`<button class="layout-toggle" aria-label="Toggle compact layout" aria-pressed=${String(this._layout === 'compact')} @click=${() => { this._layoutOverride = this._layout === 'compact' ? 'tablet' : 'compact'; }}>${this._layout === 'compact' ? 'Tablet view' : 'Compact view'}</button>` : nothing}</div>` : nothing}
      <div class="grid">${repeat(entries(this._config), item => item.entity, item => this._renderEntity(item))}</div>
    </section>`;
  }
}
if (!customElements.get('homeassistant-light-card')) customElements.define('homeassistant-light-card', LightCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === 'homeassistant-light-card')) window.customCards.push({ type: 'homeassistant-light-card', name: 'Light Card', preview: true, description: 'Shared light and device controls. Spacious on the wall, compact in your dashboard.', documentationURL: 'https://github.com/jancrab/homeassistant-light-card', getEntitySuggestion: (_hass, id) => DOMAINS.includes(domainOf(id)) ? { config: { type: 'custom:homeassistant-light-card', entities: [id] } } : null });
console.info(`Light Card ${__VERSION__}`);
