# Light Card 1.0.0

The first stable release brings shared controls for one or many lights and devices to Home Assistant. Configure four entities once, show large tiles on a wall display, and switch to slim rows for your everyday dashboard.

- Tablet, compact and automatic views with an optional dashboard toggle.
- Optional large icons, brightness slider/percentage, last state change, state labels, soft glow and details button.
- Real light colors, shared appearance and compact-specific overrides in a collapsible visual editor.
- Toggle lights, switches, helpers, fans and automations; activate buttons, scenes and scripts.
- Responsive layout, keyboard controls, explicit unavailable/error states and theme support.

Install through HACS as a **custom Dashboard repository** using `https://github.com/jancrab/homeassistant-light-card`, or download the attached JavaScript module. See the README for installation and YAML examples.

Validation: 15 automated unit/DOM tests; browser checks of switching, brightness keyboard focus, errors and responsive card widths around 280/360/480 px, plus light/dark appearance. Home Assistant state/services are simulated; real HA editor and physical device smoke testing remains outstanding. The demo uses placeholder icons; installed cards use Home Assistant icons.

The release asset bundles its runtime and requires no CDN. This release is not a submission to the default HACS catalog.
