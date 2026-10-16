export const DOMAINS = ['light', 'switch', 'input_boolean', 'fan', 'automation', 'button', 'input_button', 'scene', 'script'];
export const APPEARANCE = { show_icon: true, show_name: true, show_state: true, show_last_changed: false, show_brightness: true, show_brightness_value: true, controls_when_on: false, use_light_color: true, show_glow: true, show_more_info: false, icon_size: 56 };
export const DEFAULTS = { layout: 'tablet', columns: 4, compact_columns: 1, show_layout_toggle: false, tap_action: 'toggle', appearance: APPEARANCE };
export const domainOf = id => id.split('.')[0];
export function entries(config) { return (config.entities || (config.entity ? [{ entity: config.entity, name: config.name, icon: config.icon }] : [])).map(item => typeof item === 'string' ? { entity: item } : item); }
export function validateConfig(config) {
  if (!config || typeof config !== 'object') throw new Error('Configure at least one entity.');
  if (config.entities !== undefined && !Array.isArray(config.entities)) throw new Error('Entities must be a list.');
  const items = entries(config);
  if (!items.length) throw new Error('Select at least one entity.');
  for (const item of items) {
    if (!item || typeof item.entity !== 'string' || !/^[a-z][a-z0-9_]*\.[a-z0-9_]+$/.test(item.entity) || !DOMAINS.includes(domainOf(item.entity))) throw new Error('Select a light, switch, helper, fan, automation, button, scene or script.');
    for (const key of ['name', 'icon']) if (item[key] !== undefined && typeof item[key] !== 'string') throw new Error(`${key} must be text.`);
  }
  if (new Set(items.map(item => item.entity)).size !== items.length) throw new Error('Select each entity only once.');
  if (config.layout !== undefined && !['tablet', 'compact', 'auto'].includes(config.layout)) throw new Error('Layout must be tablet, compact or auto.');
  if (config.tap_action !== undefined && !['toggle', 'more-info', 'none'].includes(config.tap_action)) throw new Error('Tap action must be toggle, more-info or none.');
  for (const key of ['columns', 'compact_columns']) if (config[key] !== undefined && (!Number.isInteger(config[key]) || config[key] < 1 || config[key] > 12)) throw new Error(`${key} must be between 1 and 12.`);
  if (config.title !== undefined && typeof config.title !== 'string') throw new Error('Title must be text.');
  if (config.show_layout_toggle !== undefined && typeof config.show_layout_toggle !== 'boolean') throw new Error('Show layout toggle must be boolean.');
  for (const key of ['appearance', 'compact']) {
    const options = config[key];
    if (options === undefined) continue;
    if (!options || typeof options !== 'object' || Array.isArray(options)) throw new Error(`${key} must be an object.`);
    for (const field of Object.keys(APPEARANCE)) {
      if (options[field] === undefined) continue;
      if (field === 'icon_size') {
        if (!Number.isInteger(options[field]) || options[field] < 24 || options[field] > 96) throw new Error('Icon size must be 24–96 px.');
      } else if (typeof options[field] !== 'boolean') throw new Error(`${field} must be boolean.`);
    }
  }
  return { ...DEFAULTS, ...config, entities: items, appearance: { ...APPEARANCE, ...config.appearance } };
}
export function brightnessSupported(id, state) {
  return domainOf(id) === 'light' && state?.attributes?.supported_color_modes?.some(mode => ['brightness', 'color_temp', 'hs', 'xy', 'rgb', 'rgbw', 'rgbww', 'white'].includes(mode)) === true;
}
export function brightnessPercent(state) {
  if (state?.state === 'off') return 0;
  const value = state?.attributes?.brightness;
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(Math.max(0, Math.min(255, value)) / 255 * 100) : null;
}
export function serviceFor(id) {
  const domain = domainOf(id);
  if (['button', 'input_button'].includes(domain)) return [domain, 'press'];
  if (['scene', 'script'].includes(domain)) return [domain, 'turn_on'];
  return [domain, 'toggle'];
}
export function relativeTime(value, language = 'en', now = Date.now()) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return '';
  const seconds = Math.max(0, (now - timestamp) / 1000);
  const [unit, divisor] = seconds < 60 ? ['second', 1] : seconds < 3600 ? ['minute', 60] : seconds < 86400 ? ['hour', 3600] : ['day', 86400];
  try { return new Intl.RelativeTimeFormat(language, { numeric: 'auto', style: 'short' }).format(-Math.floor(seconds / divisor), unit); }
  catch { return new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' }).format(-Math.floor(seconds / divisor), unit); }
}
export function lightColor(state, enabled) {
  const fallback = 'var(--state-light-active-color, var(--amber-color, #ffc66d))';
  if (!enabled) return fallback;
  const rgb = state?.attributes?.rgb_color;
  if (Array.isArray(rgb) && rgb.length === 3 && rgb.every(n => Number.isFinite(n) && n >= 0 && n <= 255)) return `rgb(${rgb.join(',')})`;
  const kelvin = state?.attributes?.color_temp_kelvin;
  if (Number.isFinite(kelvin)) return kelvin < 3500 ? '#ffc681' : kelvin < 5000 ? '#ffe6bd' : '#dbeaff';
  return fallback;
}
