import { LitElement, html, css, nothing } from 'lit';
import { DEFAULTS, APPEARANCE, DOMAINS, entries } from './config.js';
const field = (name, selector) => ({ name, selector });
const appearanceSchema = Object.keys(APPEARANCE).map(name => field(name, name === 'icon_size' ? { number: { min: 24, max: 96, mode: 'slider', unit_of_measurement: 'px' } } : { boolean: {} }));
const LABELS = { entities: 'Entities · one shared configuration', title: 'Title (optional)', layout: 'Default view', columns: 'Maximum columns · tablet', compact_columns: 'Maximum columns · compact', show_layout_toggle: 'Show view switch on dashboard', tap_action: 'Tap action (toggle activates scenes and buttons)', show_icon: 'Show icon', show_name: 'Show name', show_state: 'Show state', show_last_changed: 'Show last state change', show_brightness: 'Show brightness slider', show_brightness_value: 'Show brightness percentage', controls_when_on: 'Only show slider when on', use_light_color: 'Use actual light color', show_glow: 'Soft light glow when on', show_more_info: 'Show details button', icon_size: 'Icon size', entity: 'Entity', name: 'Custom name (optional)', icon: 'Custom icon (optional)' };
export class LightCardEditor extends LitElement {
  static properties = { hass: { attribute: false, hasChanged: () => true }, _config: { state: true } };
  static styles = css`:host { display: block; } details { border-top: 1px solid var(--divider-color, #8884); margin-top: 16px; padding-top: 8px; } summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; font-weight: 500; } p { color: var(--secondary-text-color); line-height: 1.5; font-size: 13px; } button { min-height: 44px; border: 1px solid var(--divider-color, #8884); background: transparent; color: var(--primary-text-color); border-radius: 8px; padding: 0 12px; cursor: pointer; } button:focus-visible, summary:focus-visible { outline: 2px solid var(--primary-color); }`;
  setConfig(config) { this._config = { ...config }; }
  _emit(patch) { this._config = { ...this._config, ...patch }; this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true })); }
  _form(schema, data, update) { return html`<ha-form .hass=${this.hass} .data=${data} .schema=${schema} .computeLabel=${field => LABELS[field.name] || field.name} @value-changed=${event => { event.stopPropagation(); update(event.detail.value); }}></ha-form>`; }
  render() {
    if (!this.hass || !this._config) return nothing;
    const items = entries(this._config), base = { ...DEFAULTS, ...this._config };
    return html`
      <p>Select your lights and devices once. Appearance and actions apply to every tile. Tiles wrap automatically when space is limited.</p>
      ${this._form([field('entities', { entity: { multiple: true, filter: { domain: DOMAINS } } }), field('title', { text: {} })], { ...base, entities: items.map(item => item.entity) }, value => {
        const patch = { ...value };
        if (Array.isArray(value.entities)) patch.entities = value.entities.map(id => items.find(item => item.entity === id) || id);
        this._emit(patch);
      })}
      <details open><summary>Layout & interaction</summary>
        ${this._form([field('layout', { select: { options: [{ value: 'tablet', label: 'Tablet · large tiles' }, { value: 'compact', label: 'Compact · slim rows' }, { value: 'auto', label: 'Automatic · compact below 600 px' }] } }), field('columns', { number: { min: 1, max: 12, mode: 'box' } }), field('compact_columns', { number: { min: 1, max: 12, mode: 'box' } }), field('show_layout_toggle', { boolean: {} }), field('tap_action', { select: { options: [{ value: 'toggle', label: 'Toggle / activate' }, { value: 'more-info', label: 'More info' }, { value: 'none', label: 'No action' }] } })], base, value => this._emit(value))}
      </details>
      <details><summary>Shared appearance</summary>${this._form(appearanceSchema, { ...APPEARANCE, ...this._config.appearance }, value => this._emit({ appearance: { ...this._config.appearance, ...value } }))}</details>
      <details><summary>Compact view overrides</summary><p>By default compact uses the shared settings with a 28 px icon. Customize it here for your everyday dashboard. Changes here apply only to the compact view.</p>
        ${this._form(appearanceSchema, { ...APPEARANCE, ...this._config.appearance, icon_size: 28, ...this._config.compact }, value => {
          const inherited = { ...APPEARANCE, ...this._config.appearance, icon_size: 28, ...this._config.compact };
          const changes = Object.fromEntries(Object.entries(value).filter(([key, val]) => inherited[key] !== val));
          this._emit({ compact: { ...this._config.compact, ...changes } });
        })}
        <button @click=${() => this._emit({ compact: {} })}>Reset compact overrides</button>
      </details>
      <details><summary>Individual names & icons</summary><p>Optional exceptions. All other settings stay shared.</p>
        ${items.map((item, index) => html`<details><summary>${item.name || this.hass.states?.[item.entity]?.attributes?.friendly_name || item.entity}</summary>${this._form([field('name', { text: {} }), field('icon', { icon: {} })], item, value => this._emit({ entities: items.map((entry, i) => i === index ? { ...entry, ...value } : entry) }))}</details>`)}
      </details>`;
  }
}
if (!customElements.get('homeassistant-light-card-editor')) customElements.define('homeassistant-light-card-editor', LightCardEditor);
