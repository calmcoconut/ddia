## 2024-06-22 - Missing Focus States for Custom Controls
**Learning:** Custom interactive elements (like `.quiz-option`, `.mc-btn`, `.btn-scenario-nav`, `.slider`, `.filter-btn`, `.hub-card-btn`, `.timer-btn`) often lack default focus states because they reset or hide standard browser outlines without replacing them. This significantly impacts keyboard accessibility.
**Action:** When reviewing or creating new custom UI components, always ensure that `:focus-visible` styles are explicitly added using the design system's focus ring (`outline: 2px solid var(--accent-indigo); outline-offset: 2px;`) to support keyboard navigation.
## 2024-05-24 - Interactive Divs as Links
**Learning:** This app uses `div` elements (like `.logo-area`) as clickable links to the homepage, which breaks keyboard navigation (tabbing) and screen reader support since they lack semantic roles and keyboard event handlers.
**Action:** Always verify if clickable `div`s or `span`s act as links/buttons. If so, apply `role`, `tabindex`, `aria-label`, and `keydown` event listeners, plus `focus-visible` styles in CSS.
