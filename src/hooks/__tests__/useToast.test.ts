import { renderHook, act } from "@testing-library/react";
import { useToast } from "../useToast";

describe("useToast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("initializes with empty toasts array", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it("shows success toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success("Operation successful!");
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe("Operation successful!");
    expect(result.current.toasts[0].type).toBe("success");
  });

  it("shows error toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.error("Something went wrong!");
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe("Something went wrong!");
    expect(result.current.toasts[0].type).toBe("error");
  });

  it("shows warning toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.warning("Warning message");
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe("Warning message");
    expect(result.current.toasts[0].type).toBe("warning");
  });

  it("shows info toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.info("Info message");
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe("Info message");
    expect(result.current.toasts[0].type).toBe("info");
  });

  it("assigns unique IDs to toasts", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success("Toast 1");
      result.current.error("Toast 2");
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id);
  });

  it("removes toast by ID", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success("Toast to remove");
    });

    const toastId = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it("manually removes toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success("Test toast");
    });

    expect(result.current.toasts).toHaveLength(1);
    const toastId = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it("handles multiple toasts", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success("Toast 1");
      result.current.error("Toast 2");
      result.current.warning("Toast 3");
    });

    expect(result.current.toasts).toHaveLength(3);
  });

  it("removes only specified toast when multiple exist", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success("Toast 1");
      result.current.error("Toast 2");
    });

    const firstToastId = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(firstToastId);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe("Toast 2");
  });
});
