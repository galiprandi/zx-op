import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionStatusResponse } from '@/api/playerSession';
import { CheckInView } from '@/views/CheckInView';

const { usePlayerSessionMock, useActiveSessionsMock, useProductsMock, usePaymentMethodsMock } = vi.hoisted(() => ({
  usePlayerSessionMock: vi.fn(),
  useActiveSessionsMock: vi.fn(),
  useProductsMock: vi.fn(),
  usePaymentMethodsMock: vi.fn(),
}));

vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => undefined,
}));

vi.mock('@/components/SiteBrand', () => ({
  SiteBrand: () => null,
}));

vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => useProductsMock(),
}));

vi.mock('@/hooks/usePaymentMethods', () => ({
  usePaymentMethods: () => usePaymentMethodsMock(),
}));

vi.mock('@/hooks/usePlayerSession', () => ({
  usePlayerSession: (barcodeId: string) => usePlayerSessionMock(barcodeId),
  useActiveSessions: () => useActiveSessionsMock(),
}));

function createSession(barcodeId: string): SessionStatusResponse {
  const now = new Date();
  return {
    id: `session-${barcodeId}`,
    barcodeId,
    totalAllowedSeconds: 1800,
    accumulatedSeconds: 0,
    lapsCount: 0,
    lastStartAt: null,
    isActive: false,
    expiresAt: null,
    createdAt: now,
    updatedAt: now,
    remainingSeconds: 1800,
    remainingMinutes: 30,
    status: 'paused' as SessionStatusResponse['status'],
    avgSecondsPerLap: null,
  };
}

function renderCheckInView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <MemoryRouter initialEntries={['/checkin']}>
      <QueryClientProvider client={queryClient}>
        <CheckInView />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function dispatchGlobalScannerInput(code: string) {
  for (const key of code) {
    fireEvent.keyDown(window, { key });
  }
  fireEvent.keyDown(window, { key: 'Enter' });
}

describe('CheckInView scanner behavior', () => {
  beforeEach(() => {
    usePlayerSessionMock.mockReset();
    useActiveSessionsMock.mockReset();
    useProductsMock.mockReset();
    usePaymentMethodsMock.mockReset();

    useActiveSessionsMock.mockReturnValue({ waitingSessions: [] });
    usePaymentMethodsMock.mockReturnValue({ data: [] });
    useProductsMock.mockReturnValue({
      requiredProducts: [],
      optionalProducts: [],
      calculateTotalPrice: () => 0,
      calculateTotalTime: () => 0,
    });
  });

  it('auto-focuses the scanner input when no wristband is confirmed yet', async () => {
    usePlayerSessionMock.mockReturnValue({ session: undefined });
    renderCheckInView();

    const scannerInput = screen.getByPlaceholderText('Código de pulsera');
    await waitFor(() => {
      expect(scannerInput).toHaveFocus();
    });
  });

  it('accepts keyboard wedge scans even when input is not focused', async () => {
    usePlayerSessionMock.mockImplementation((barcodeId: string) => ({
      session: barcodeId === '456' ? createSession('456') : undefined,
    }));

    renderCheckInView();

    const scannerInput = screen.getByPlaceholderText('Código de pulsera') as HTMLInputElement;
    scannerInput.blur();

    dispatchGlobalScannerInput('456');

    await waitFor(() => {
      expect(usePlayerSessionMock).toHaveBeenCalledWith('456');
      expect(scannerInput).toHaveValue('456');
      expect(screen.getByText('Esperando')).toBeInTheDocument();
    });
  });

  it('replaces current wristband immediately when a new scan arrives', async () => {
    usePlayerSessionMock.mockImplementation((barcodeId: string) => ({
      session: barcodeId === '456' || barcodeId === '789' ? createSession(barcodeId) : undefined,
    }));

    renderCheckInView();

    const scannerInput = screen.getByPlaceholderText('Código de pulsera') as HTMLInputElement;
    scannerInput.blur();

    dispatchGlobalScannerInput('456');
    await waitFor(() => {
      expect(scannerInput).toHaveValue('456');
    });

    dispatchGlobalScannerInput('789');
    await waitFor(() => {
      expect(usePlayerSessionMock).toHaveBeenCalledWith('789');
      expect(scannerInput).toHaveValue('789');
    });
  });
});
