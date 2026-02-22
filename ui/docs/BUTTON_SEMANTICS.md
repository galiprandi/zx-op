# Button Semantics (Mobile Operations)

## Purpose

This document defines a consistent semantic system for mobile action buttons in operational views (`Check-in`, `Operation`, and related flows).

## Variants

- `cta`: primary action for the current step.
- `secondary`: non-blocking supporting action.
- `cancel`: dismiss/back action that does not persist critical changes.
- `danger`: blocked or destructive/error state.

## CTA Tone

Use `tone` only with `cta`:

- `success`: positive progression (`PLAY`, `COBRAR`, `Confirmar cobro`).
- `warning`: operational hold/pause (`PAUSAR`).
- `default`: neutral primary emphasis where success/warning is not needed.

## Positioning Rule (Critical)

When `cta` and `cancel` are shown in the same mobile footer/stack:

1. `cta` must appear first (top).
2. `cancel` must appear second (bottom).

Rationale: thumb flow should prioritize completion, while keeping a predictable escape action below.

## Recommended Mapping

- `PLAY` -> `variant="cta"` + `tone="success"`
- `PAUSAR` -> `variant="cta"` + `tone="warning"`
- `COBRAR` / `Confirmar cobro` -> `variant="cta"` + `tone="success"`
- `+1 Vuelta` -> `variant="secondary"`
- `Volver` / `Cancelar` -> `variant="cancel"`
- `Tiempo agotado` / hard blocked state -> `variant="danger"` (disabled when applicable)

## Disabled Feedback

For critical disabled CTAs, always show a short reason text directly under the action area:

- Example: `Tiempo agotado. Realiza check-in para agregar tiempo.`
- Example: `Asigna montos hasta completar el total exacto.`

Avoid relying only on muted color changes.
