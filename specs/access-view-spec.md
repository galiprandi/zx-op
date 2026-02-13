# Access View Specification

## 1. Overview

This document describes the Accesos Rápidos view, whose purpose is to provide staff with ready-to-scan QR codes that open the Operación and Check-in interfaces on any device at the start of the day. It centralizes the links, ensures QR render reliability, and reduces setup friction for the team.

## 2. Core Purpose

- Serve two QR codes (Operación and Check-in) with absolute URLs to the local frontend.
- Make it easy for staff to provision devices (phones/tablets) by scanning and loading the correct views without manual typing.
- Keep the view desktop-friendly via `DesktopShell` while remaining simple and low-interaction.

## 3. Business Logic

- QR targets: `/` (Operación) and `/checkin` (Check-in), prefixed with `window.location.origin` for absolute URLs.
- No input or dynamic state; pure display of QR codes and their URLs.
- If the QR component cannot be resolved (module issues), fallback should render nothing rather than crash (handled via module default per library docs).

## 4. UI Structure

- Shell: `DesktopShell` layout.
- Header: icon `QrCode`, title “Accesos rápidos”, helper text explaining scanning purpose.
- Body: two stacked cards (single column) each with:
  - QR code (160px, transparent bg, currentColor fg)
  - Label (Operación / Check-in)
  - Text with the absolute URL for reference.

## 5. Technical Implementation

- Route: `/accesos` added in `App.tsx`.
- Component: `AccessView` in `ui/src/views/AccessView.tsx`.
- QR library: `react-qr-code` default export `QRCode` (per library documentation).
- Styling: Tailwind utility classes, card with border, subtle background, center alignment.

## 6. Edge Cases & Resilience

- QR component resolution: use documented default export; avoid dynamic wrappers that can cause invalid element errors.
- If `window` is undefined (SSR), origin falls back to empty string; view is intended for client-only usage.
- URLs shown under the QR to manually type if scanning fails.

## 7. Success Criteria

- Navigating to `/accesos` renders two QR codes without console errors.
- Scanning Operación QR opens `/` on the device; scanning Check-in QR opens `/checkin`.
- Layout is readable on desktop widths with stacked cards and adequate spacing.

## 8. Future Enhancements

- Add copy-to-clipboard buttons for the URLs.
- Add printable variant (PDF) with quiet zone margins.
- Add environment indicator (e.g., mesh network hostname) near the URLs.
