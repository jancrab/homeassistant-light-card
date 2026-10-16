# Feature research — 2026-10-16

Reviewed primary project documentation; no implementation code or assets copied.

| Reference | Relevant features | Light Card decision |
| --- | --- | --- |
| [Mushroom Light Card](https://github.com/piitaya/lovelace-mushroom/blob/main/docs/cards/light.md) | Brightness/color/temperature controls, last-changed information, collapsible controls and configurable actions. | Include brightness, relative last change, actual icon color and controls-when-on. Use native more-info for advanced color controls in v1. |
| [Bubble Card](https://github.com/Clooos/Bubble-Card) | Compact switch/slider buttons, state/light colors, sub-buttons and grouped controls. | Include compact view, generous touch targets and separate details action. Keep one configuration for repeated entities; no module system in v1. |

Potential follow-ups: capability-aware color temperature control, brightness presets, area-based entity selection, and optional hold/double-tap actions. These are not implemented in v1.0.0.

Packaging and frontend contracts checked against [HA custom cards](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/), [HA light entities](https://developers.home-assistant.io/docs/core/entity/light/), [HACS dashboard requirements](https://www.hacs.dev/docs/publish/plugin/) and [HACS general requirements](https://hacs.dev/docs/publish/start/).
