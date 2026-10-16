# Light Card working guide

- Read docs/working-guide.md before modifying editor, device actions or releases. Keep verified new lessons there.
- Keep the UI and project-specific documentation in English (the bundled German design references may stay in German); respond in the user's language. Use Home Assistant themes, accessible names, keyboard focus, 44px targets and reduced-motion support.
- Before visual work, read docs/design-style.md. Prefer atmospheric minimalism with device-specific backgrounds and restrained state-driven motion; respect explicit design choices and the existing card identity. Use docs/design-adaptation-prompt.md as a reusable brief for other card projects. The initial entity-only scaffold is a neutral baseline, not the finished visual design.
- Determine light brightness support from supported_color_modes. Never send dimming commands to switches or on/off-only lights. Keep service domains explicit: buttons press, scenes/scripts turn_on, and supported toggle domains toggle. Do not infer device behavior from another integration.
- Preserve native editor bootstrap, context subscription cleanup and reused-hass rendering. Keep configuration minimal and preserve unknown fields on editor updates.
- Run npm run check after card changes. Test meaningful state/service failures. Distinguish mocked previews from real Home Assistant or device verification.
- Commit package-lock.json and the built dist/homeassistant-light-card.js with source changes. Runtime code must not depend on a CDN.
- Before releasing, synchronize package and lock versions, update CHANGELOG.md, rebuild, verify CI, and use a matching v-version tag. Confirm the actual GitHub release asset and HACS validation.
- Check git status and preserve unrelated work. Use the requested repository-local Git author/committer identity; do not change global identity or rewrite old commits implicitly.
- Repository creation, pushing, publishing, visibility changes and releases require authorization from the task. A credential, this guide or past authorization for another repo does not authorize those actions.
