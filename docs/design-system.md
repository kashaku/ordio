# Ordio Design System

This design direction is derived from the local ordering app brief and the imported `frontend-design` skill. It is intentionally focused on the first demo: one merchant page and one customer ordering page.

## Product Direction

Ordio is a local-first menu publishing and ordering demo. The interface should feel like a practical restaurant operations tool on the merchant side and a fast mobile ordering flow on the customer side.

The memorable design choice should be the live handoff between merchant editing and customer ordering: desktop controls on one side, a believable mobile menu preview on the other.

## Palette

- Ink: `#171717` for primary text and merchant editor chrome.
- Rice: `#FAF7F0` for warm food-adjacent surfaces without becoming beige-heavy.
- Porcelain: `#FFFFFF` for cards, panels, and mobile content surfaces.
- Citrus: `#F5B000` for cart, publish, and add-to-cart actions.
- Leaf: `#2F7D57` for success, rating, and published states.
- Clay: `#B85C38` for destructive or attention states used sparingly.

Avoid purple gradients, generic SaaS blue washes, oversized hero sections, and decorative orb backgrounds.

## Typography

- Use a system sans stack for speed and clarity: `ui-sans-serif`, `system-ui`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`.
- Merchant UI should use compact labels, dense controls, and clear numeric inputs.
- Customer UI should use larger dish names, clear prices, and short action text.
- Keep interface text in sentence case. Avoid all-caps labels unless the surrounding component is genuinely technical chrome.

## Layout

Merchant page, desktop first:

```text
+--------------------------------------------------------------+
| top workflow bar: edit store | menu template | publish QR     |
+-------------+------------------------------+-----------------+
| nav/steps    | editor forms and menu tools  | phone preview   |
|              |                              | QR/publish card |
+-------------+------------------------------+-----------------+
```

Customer page, mobile first:

```text
+-----------------------------+
| store info: rating, place   |
+---------+-------------------+
| cats    | dish list          |
|         | add buttons        |
+---------+-------------------+
| sticky cart bar             |
+-----------------------------+
```

## Interaction Principles

- Merchant actions should use exact verbs: `Save store`, `Use template`, `Publish QR`.
- Customer actions should be direct: `Add`, `Pay`, `Clear cart`.
- Every saved merchant change should immediately affect the phone preview.
- Missing food images should render as intentional placeholders, not broken image boxes.
- The cart bar must always show total quantity and total price when items exist.

## Component Guidance

- Merchant panels can be rectangular with restrained 6-8px radius.
- Customer dish cards should be scannable: image, name, description, sales, price, add button.
- Buttons should have visible disabled, hover, active, and focus states.
- Use `lucide-react` icons where they clarify an action, especially QR, save, preview, cart, plus, minus, and trash.

## Validation And QA

Use the imported `webapp-testing` guidance after implementation:

- Start the Vite dev server.
- Visit `/merchant` and capture a desktop screenshot.
- Edit store name, rating, location, and verify the preview updates.
- Publish QR and open `/m/demo-store-001`.
- Capture a 375px-wide mobile screenshot.
- Add dishes, change quantities, clear cart, and simulate payment.
- Confirm browser console has no runtime errors.
