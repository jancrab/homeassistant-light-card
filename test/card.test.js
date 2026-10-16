import { test, before, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { validateConfig, brightnessSupported, brightnessPercent, relativeTime, serviceFor } from '../src/config.js';
const window = new Window();
for (const key of ['window', 'document', 'customElements', 'HTMLElement', 'Element', 'Document', 'CSSStyleSheet', 'ShadowRoot', 'CustomEvent', 'Event']) globalThis[key] = window[key];
globalThis.__VERSION__ = 'test';
before(async () => { await import('../src/homeassistant-light-card.js'); });
afterEach(() => { document.body.replaceChildren(); });
function state(value = 'on', attributes = {}) { return { state: value, attributes: { friendly_name: 'Living room', supported_color_modes: ['brightness'], brightness: 128, ...attributes }, last_changed: new Date(Date.now() - 60000).toISOString() }; }
function fixture(config = {}, states = {}) {
  const card = document.createElement('homeassistant-light-card');
  card.setConfig({ entities: ['light.example'], ...config });
  card.calls = [];
  card.hass = { language: 'de', states: { 'light.example': state(), ...states }, callService: async (...args) => { card.calls.push(args); } };
  document.body.append(card); return card;
}
test('validation rejects invalid domains, duplicates, columns and appearance', () => {
  for (const config of [{}, { entity: 'invalid' }, { entity: 'lock.front' }, { entities: ['light.a', 'light.a'] }, { entity: 'light.a', columns: 0 }, { entity: 'light.a', columns: '4' }, { entity: 'light.a', appearance: { icon_size: 1000 } }, { entity: 'light.a', appearance: { show_icon: 'false' } }]) assert.throws(() => validateConfig(config));
  assert.equal(validateConfig({ entity: 'light.a' }).entities[0].entity, 'light.a');
});
test('capability checks avoid sliders for switches and onoff lights', () => {
  assert.equal(brightnessSupported('switch.a', state()), false);
  assert.equal(brightnessSupported('light.a', state('on', { supported_color_modes: ['onoff'] })), false);
  assert.equal(brightnessSupported('light.a', state('off', { supported_color_modes: ['color_temp'] })), true);
  assert.equal(brightnessPercent(state('off')), 0);
  assert.equal(brightnessPercent(state('on', { brightness: undefined })), null);
});
test('multiple entities share appearance; per-entity names are escaped', async () => {
  const card = fixture({ entities: [{ entity: 'light.example', name: '<img src=x>' }, 'switch.a'], appearance: { show_icon: false, show_last_changed: true } }, { 'switch.a': state('off') }); await card.updateComplete;
  assert.equal(card.shadowRoot.querySelectorAll('ha-card').length, 2);
  assert.equal(card.shadowRoot.querySelector('ha-icon'), null);
  assert.equal(card.shadowRoot.querySelector('img'), null);
  assert.equal(card.shadowRoot.querySelectorAll('input').length, 1);
  assert.match(card.shadowRoot.querySelector('.changed').textContent, /1.*Min/);
});
test('reused hass renders changed, missing and unavailable states', async () => {
  const card = fixture(); await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('[role=status]').textContent, 'On');
  card.hass.states['light.example'] = state('unavailable'); card.hass = card.hass; await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('[role=status]').textContent, 'Unavailable');
  assert.equal(card.shadowRoot.querySelector('.main').disabled, true);
  delete card.hass.states['light.example']; card.hass = card.hass; await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('[role=status]').textContent, 'Entity not found');
});
test('default tap targets a single entity with correct service', async () => {
  const card = fixture(); await card.updateComplete; card.shadowRoot.querySelector('.main').click(); await card.updateComplete;
  assert.deepEqual(card.calls, [['light', 'toggle', { entity_id: 'light.example' }]]);
  for (const [id, expected] of [['switch.a', ['switch', 'toggle']], ['input_boolean.a', ['input_boolean', 'toggle']], ['button.a', ['button', 'press']], ['scene.a', ['scene', 'turn_on']], ['script.a', ['script', 'turn_on']]]) assert.deepEqual(serviceFor(id), expected);
});
test('unknown momentary buttons can be pressed for the first time', async () => {
  const card = fixture({ entities: ['button.a'] }, { 'button.a': state('unknown') }); await card.updateComplete;
  card.shadowRoot.querySelector('.main').click(); await card.updateComplete;
  assert.deepEqual(card.calls, [['button', 'press', { entity_id: 'button.a' }]]);
});
test('slider sends only on commit, zero turns off, no toggle bubbles', async () => {
  const card = fixture(); await card.updateComplete;
  const slider = card.shadowRoot.querySelector('input'); slider.value = '72'; slider.dispatchEvent(new Event('input')); await card.updateComplete;
  assert.equal(card.calls.length, 0);
  slider.dispatchEvent(new Event('change', { bubbles: true })); await card.updateComplete;
  assert.deepEqual(card.calls[0], ['light', 'turn_on', { brightness_pct: 72, entity_id: 'light.example' }]);
  slider.value = '0'; slider.dispatchEvent(new Event('change')); await card.updateComplete;
  assert.deepEqual(card.calls[1], ['light', 'turn_off', { entity_id: 'light.example' }]);
});
test('pending commands are deduplicated, failures are shown and can retry', async () => {
  const card = fixture(); let reject;
  card.hass.callService = () => new Promise((_resolve, fail) => { reject = fail; card.calls.push('called'); });
  const first = card._tap('light.example'); await card._tap('light.example');
  assert.equal(card.calls.length, 1);
  reject(new Error('Connection lost')); await first; await card.updateComplete;
  assert.match(card.shadowRoot.querySelector('[role=alert]').textContent, /Connection lost/);
  assert.equal(card.shadowRoot.querySelector('.main').disabled, false);
  card.hass.callService = async () => {}; await card._tap('light.example'); await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('[role=alert]'), null);
});
test('rapid brightness commits keep focus available and coalesce to the newest value', async () => {
  const card = fixture(); const resolves = [];
  card.hass.callService = (...args) => { card.calls.push(args); return new Promise(resolve => resolves.push(resolve)); };
  const first = card._brightness('light.example', { target: { value: 20 } });
  card._brightness('light.example', { target: { value: 30 } });
  card._brightness('light.example', { target: { value: 40 } });
  await card.updateComplete; assert.equal(card.shadowRoot.querySelector('input').disabled, false);
  assert.equal(card.calls.length, 1); resolves[0](); await first;
  assert.equal(card.calls.length, 2); assert.equal(card.calls[1][2].brightness_pct, 40);
  resolves[1](); await card.updateComplete;
});
test('details and no-action do not toggle; unavailable details remain accessible', async () => {
  const card = fixture({ tap_action: 'more-info' }, { 'light.example': state('unavailable') }); await card.updateComplete;
  let detail; card.addEventListener('hass-more-info', event => { detail = event.detail; }); card.shadowRoot.querySelector('.main').click();
  assert.deepEqual(detail, { entityId: 'light.example' }); assert.equal(card.calls.length, 0);
  card.setConfig({ entity: 'light.example', tap_action: 'none' }); await card.updateComplete; card.shadowRoot.querySelector('.main').click(); assert.equal(card.calls.length, 0);
});
test('layout toggle uses compact overrides without changing saved config', async () => {
  const card = fixture({ show_layout_toggle: true, compact: { show_brightness: false } }); await card.updateComplete;
  assert.ok(card.shadowRoot.querySelector('input'));
  card.shadowRoot.querySelector('.layout-toggle').click(); await card.updateComplete;
  assert.ok(card.shadowRoot.querySelector('.compact')); assert.equal(card.shadowRoot.querySelector('input'), null); assert.equal(card._config.layout, 'tablet');
  card.setConfig({ entity: 'light.example', layout: 'auto' }); card._width = 280; await card.updateComplete; assert.equal(card._layout, 'compact');
  card._width = 800; await card.updateComplete; assert.equal(card._layout, 'tablet');
});
test('off-only controls collapse and missing brightness is not presented as measured zero', async () => {
  const card = fixture({ appearance: { controls_when_on: true } }, { 'light.example': state('off') }); await card.updateComplete; assert.equal(card.shadowRoot.querySelector('input'), null);
  card.hass.states['light.example'] = state('on', { brightness: undefined }); card.hass = card.hass; await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('output').textContent, '—');
});
test('states context updates and disconnect releases context and clock', async () => {
  let callback, releases = 0;
  const host = document.createElement('div'); document.body.append(host);
  host.addEventListener('context-request', event => { callback = event.callback; });
  const card = document.createElement('homeassistant-light-card'); card.setConfig({ entity: 'light.example', appearance: { show_last_changed: true } }); host.append(card);
  callback({ 'light.example': state('off') }, () => releases++); await card.updateComplete;
  assert.equal(card.shadowRoot.querySelector('[role=status]').textContent, 'Off'); assert.ok(card._clock);
  card.remove(); assert.equal(releases, 1); assert.equal(card._clock, undefined);
});
test('relative time follows last_changed and tolerates invalid timestamps', () => {
  assert.equal(relativeTime('invalid'), '');
  assert.match(relativeTime('2026-01-01T00:00:00Z', 'en', Date.parse('2026-01-01T01:00:00Z')), /1 hr/);
});
test('fresh editor bootstraps HA; changes preserve entity overrides and unknown fields', async () => {
  let loads = 0;
  window.loadCardHelpers = async () => ({ createCardElement: () => ({ constructor: { getConfigElement: async () => { loads++; customElements.define('ha-form', class extends HTMLElement {}); } } }) });
  const editor = await customElements.get('homeassistant-light-card').getConfigElement();
  editor.setConfig({ entities: [{ entity: 'light.example', name: 'Custom' }], custom_setting: 7, appearance: { future: true } }); editor.hass = { states: {} }; document.body.append(editor); await editor.updateComplete;
  let result; editor.addEventListener('config-changed', event => { result = event.detail.config; });
  editor.shadowRoot.querySelector('ha-form').dispatchEvent(new CustomEvent('value-changed', { detail: { value: { entities: ['light.example', 'switch.a'], title: 'Updated' } } }));
  assert.equal(result.custom_setting, 7); assert.equal(result.title, 'Updated'); assert.equal(result.entities[0].name, 'Custom');
  await editor.updateComplete;
  const forms = editor.shadowRoot.querySelectorAll('ha-form');
  forms[2].dispatchEvent(new CustomEvent('value-changed', { detail: { value: { show_icon: false } } }));
  assert.equal(result.appearance.future, true);
  await editor.updateComplete;
  const compact = editor.shadowRoot.querySelectorAll('ha-form')[3];
  compact.dispatchEvent(new CustomEvent('value-changed', { detail: { value: { ...compact.data, show_brightness: false } } }));
  assert.deepEqual(result.compact, { show_brightness: false });
  await customElements.get('homeassistant-light-card').getConfigElement(); assert.equal(loads, 1);
});
