import { css } from 'lit';
export const styles = css`
  :host { display: block; container-type: inline-size; color: var(--primary-text-color, #222); font-family: var(--ha-font-family-body, inherit); }
  * { box-sizing: border-box; }
  .toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  h2 { margin: 0; font-size: 16px; font-weight: 500; flex: 1; overflow-wrap: anywhere; }
  .layout-toggle { margin-left: auto; border: 1px solid var(--divider-color, #8885); padding: 0 14px; border-radius: 24px; font-size: 12px; }
  button { font: inherit; color: inherit; cursor: pointer; background: transparent; border: 0; min-height: 44px; min-width: 44px; touch-action: manipulation; }
  button:disabled { cursor: default; }
  button:focus-visible, input:focus-visible { outline: 2px solid var(--primary-color, #2196f3); outline-offset: -2px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, max(132px, calc((100% - (var(--columns) - 1) * 12px) / var(--columns)))), 1fr)); gap: 12px; }
  ha-card { --active: var(--primary-color, #62a8eb); display: flex; flex-direction: column; min-width: 0; position: relative; overflow: hidden; border-radius: var(--ha-card-border-radius, 20px); border: 1px solid var(--ha-card-border-color, var(--divider-color, #8883)); background: var(--ha-card-background, var(--card-background-color, #fff)); box-shadow: var(--ha-card-box-shadow, none); }
  .scene { position: absolute; inset: 0; pointer-events: none; opacity: 0; background: radial-gradient(ellipse at 50% 10%, color-mix(in srgb, var(--active) 22%, transparent), transparent 75%); transition: opacity 180ms ease; }
  .on.glow .scene { opacity: var(--intensity, 1); }
  .main { width: 100%; padding: 24px 16px 12px; display: flex; flex: 1; flex-direction: column; align-items: flex-start; gap: 18px; text-align: left; position: relative; }
  .icon-wrap { width: max(44px, var(--icon-size)); height: max(44px, var(--icon-size)); display: grid; place-items: center; color: var(--state-icon-color, var(--secondary-text-color, #777)); }
  ha-icon { --mdc-icon-size: var(--icon-size, 56px); }
  .on .icon-wrap { color: color-mix(in srgb, var(--active) 60%, var(--primary-text-color, #222)); }
  .text { min-width: 0; width: 100%; display: flex; flex-direction: column; gap: 5px; }
  .name { font-size: 15px; font-weight: 500; line-height: 1.35; overflow-wrap: anywhere; }
  .state, .changed { font-size: 12px; line-height: 1.4; color: var(--secondary-text-color, #666); overflow-wrap: anywhere; }
  .state { display: flex; align-items: center; gap: 6px; }
  .dot { height: 5px; width: 5px; flex: 0 0 5px; border-radius: 50%; background: currentColor; }
  .on .dot { background: color-mix(in srgb, var(--active) 60%, var(--primary-text-color, #222)); }
  .changed { font-size: 11px; }
  .controls { padding: 0 16px 10px; position: relative; display: flex; align-items: center; gap: 8px; }
  .range { width: 100%; min-width: 0; height: 44px; margin: 0; appearance: none; -webkit-appearance: none; background: transparent; cursor: pointer; --fill: color-mix(in srgb, var(--active) 60%, var(--primary-text-color, #222)); }
  .range::-webkit-slider-runnable-track { height: 4px; border-radius: 4px; background: linear-gradient(to right, var(--fill) var(--percent), var(--divider-color, #8885) var(--percent)); }
  .range::-moz-range-track { height: 4px; border-radius: 4px; background: var(--divider-color, #8885); }
  .range::-moz-range-progress { height: 4px; background: var(--fill); border-radius: 4px; }
  .range::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; margin-top: -5px; border: 2px solid var(--ha-card-background, var(--card-background-color, white)); border-radius: 50%; background: var(--fill); box-shadow: 0 0 0 1px var(--fill); }
  .range::-moz-range-thumb { width: 12px; height: 12px; border: 2px solid var(--card-background-color, white); border-radius: 50%; background: var(--fill); }
  .range:disabled { opacity: .4; cursor: default; }
  output { min-width: 30px; text-align: right; font-size: 11px; font-variant-numeric: tabular-nums; color: var(--secondary-text-color, #666); }
  .info { position: absolute; right: 4px; top: 4px; font-size: 18px; border-radius: 50%; color: var(--secondary-text-color, #666); }
  .has-info .main { padding-right: 44px; }
  .error { margin: 0; padding: 8px 12px; color: var(--error-color, #b3261e); font-size: 12px; overflow-wrap: anywhere; position: relative; }
  .unavailable .icon-wrap { opacity: .45; }
  .compact .grid { grid-template-columns: repeat(auto-fit, minmax(min(100%, max(220px, calc((100% - (var(--compact-columns) - 1) * 8px) / var(--compact-columns)))), 1fr)); gap: 8px; }
  .compact ha-card { border-radius: var(--ha-card-border-radius, 14px); }
  .compact .main { padding: 8px 14px; flex-direction: row; align-items: center; gap: 12px; }
  .compact .icon-wrap { flex-shrink: 0; }
  .compact .text { gap: 2px; }
  .compact .name { font-size: 14px; }
  .compact .controls { padding: 0 14px 0; margin-top: -4px; }
  .compact .has-info .main { padding-right: 48px; }
  .compact .scene { background: radial-gradient(ellipse at 0% 50%, color-mix(in srgb, var(--active) 13%, transparent), transparent 80%); }
  @media (prefers-reduced-motion: reduce) { .scene { transition: none; } }
`;
