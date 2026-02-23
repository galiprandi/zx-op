import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionStatusResponse } from "@/api/playerSession";
import { OperationView } from "@/views/OperationView";

const { usePlayerSessionMock, useActiveSessionsMock, getCheckinHistoryMock } = vi.hoisted(() => ({
	usePlayerSessionMock: vi.fn(),
	useActiveSessionsMock: vi.fn(),
	getCheckinHistoryMock: vi.fn(),
}));

vi.mock("@/hooks/useSocket", () => ({
	useSocket: () => undefined,
}));

vi.mock("@/components/SiteBrand", () => ({
	SiteBrand: () => null,
}));

vi.mock("@/api/checkin", () => ({
	getCheckinHistory: getCheckinHistoryMock,
}));

vi.mock("@/hooks/usePlayerSession", () => ({
	usePlayerSession: (barcodeId: string) => usePlayerSessionMock(barcodeId),
	useActiveSessions: () => useActiveSessionsMock(),
}));

function createSession(barcodeId: string, overrides: Partial<SessionStatusResponse> = {}): SessionStatusResponse {
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
		status: "paused" as SessionStatusResponse["status"],
		avgSecondsPerLap: null,
		...overrides,
	};
}

function createUsePlayerSessionResult(params: {
	session: SessionStatusResponse | undefined;
	error?: Error;
	isLoading?: boolean;
}) {
	const { session, error, isLoading = false } = params;
	return {
		session,
		isLoading,
		error,
		canPlay: Boolean(session && !session.isActive && session.remainingSeconds > 0),
		canPause: Boolean(session?.isActive),
		playMutation: { mutate: vi.fn(), isPending: false },
		pauseMutation: { mutate: vi.fn(), isPending: false },
		lapMutation: { mutate: vi.fn(), isPending: false },
	};
}

function renderOperationView() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	return render(
		<MemoryRouter initialEntries={["/operation"]}>
			<QueryClientProvider client={queryClient}>
				<OperationView />
			</QueryClientProvider>
		</MemoryRouter>,
	);
}

function dispatchGlobalScannerInput(code: string) {
	for (const key of code) {
		fireEvent.keyDown(window, { key });
	}
	fireEvent.keyDown(window, { key: "Enter" });
}

describe("OperationView scanner behavior", () => {
	beforeEach(() => {
		usePlayerSessionMock.mockReset();
		useActiveSessionsMock.mockReset();
		getCheckinHistoryMock.mockReset();
		useActiveSessionsMock.mockReturnValue({ waitingSessions: [] });
		getCheckinHistoryMock.mockResolvedValue([]);
	});

	it("auto-focuses the scanner input when there is no valid selected wristband", async () => {
		usePlayerSessionMock.mockImplementation((barcodeId: string) =>
			createUsePlayerSessionResult({
				session: undefined,
				error: barcodeId ? new Error("Session not found") : undefined,
			}),
		);

		renderOperationView();

		const scannerInput = screen.getByPlaceholderText("Escanea una pulsera");
		await waitFor(() => {
			expect(scannerInput).toHaveFocus();
		});
	});

	it("restores focus and text selection after a session-not-found scan", async () => {
		usePlayerSessionMock.mockImplementation((barcodeId: string) =>
			createUsePlayerSessionResult({
				session: undefined,
				error: barcodeId === "404" ? new Error("Session not found") : undefined,
			}),
		);

		renderOperationView();

		const scannerInput = screen.getByPlaceholderText("Escanea una pulsera") as HTMLInputElement;
		fireEvent.change(scannerInput, { target: { value: "404" } });
		fireEvent.keyDown(scannerInput, { key: "Enter" });

		await waitFor(() => {
			expect(usePlayerSessionMock).toHaveBeenCalledWith("404");
		});

		await waitFor(() => {
			expect(scannerInput).toHaveFocus();
			expect(scannerInput.selectionStart).toBe(0);
			expect(scannerInput.selectionEnd).toBe(3);
		});
	});

	it("accepts keyboard wedge scans even when input is not focused", async () => {
		usePlayerSessionMock.mockImplementation((barcodeId: string) => {
			if (barcodeId === "123") {
				return createUsePlayerSessionResult({ session: createSession("123") });
			}
			return createUsePlayerSessionResult({ session: undefined });
		});

		renderOperationView();

		const scannerInput = screen.getByPlaceholderText("Escanea una pulsera") as HTMLInputElement;
		scannerInput.blur();

		dispatchGlobalScannerInput("123");

		await waitFor(() => {
			expect(usePlayerSessionMock).toHaveBeenCalledWith("123");
			expect(scannerInput).toHaveValue("123");
		});
	});

	it("replaces the current wristband immediately on a new scan", async () => {
		usePlayerSessionMock.mockImplementation((barcodeId: string) => {
			if (barcodeId === "123") {
				return createUsePlayerSessionResult({ session: createSession("123") });
			}
			if (barcodeId === "999") {
				return createUsePlayerSessionResult({ session: createSession("999") });
			}
			return createUsePlayerSessionResult({ session: undefined });
		});

		renderOperationView();

		const scannerInput = screen.getByPlaceholderText("Escanea una pulsera") as HTMLInputElement;
		fireEvent.change(scannerInput, { target: { value: "123" } });
		fireEvent.keyDown(scannerInput, { key: "Enter" });

		await waitFor(() => {
			expect(scannerInput).toHaveValue("123");
		});

		scannerInput.blur();
		dispatchGlobalScannerInput("999");

		await waitFor(() => {
			expect(usePlayerSessionMock).toHaveBeenCalledWith("999");
			expect(scannerInput).toHaveValue("999");
		});
	});

	it("does not process global scanner input while confirm modal is open", async () => {
		usePlayerSessionMock.mockImplementation((barcodeId: string) => {
			if (barcodeId === "123") {
				return createUsePlayerSessionResult({ session: createSession("123") });
			}
			if (barcodeId === "999") {
				return createUsePlayerSessionResult({ session: createSession("999") });
			}
			return createUsePlayerSessionResult({ session: undefined });
		});

		renderOperationView();

		const scannerInput = screen.getByPlaceholderText("Escanea una pulsera") as HTMLInputElement;
		fireEvent.change(scannerInput, { target: { value: "123" } });
		fireEvent.keyDown(scannerInput, { key: "Enter" });

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "PLAY" })).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole("button", { name: "PLAY" }));
		await waitFor(() => {
			expect(screen.getByText("Iniciar Juego")).toBeInTheDocument();
		});

		scannerInput.blur();
		dispatchGlobalScannerInput("999");

		await waitFor(() => {
			expect(scannerInput).toHaveValue("123");
		});
		expect(usePlayerSessionMock).not.toHaveBeenCalledWith("999");
	});
});
