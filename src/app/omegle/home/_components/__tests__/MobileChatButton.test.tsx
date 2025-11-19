import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MobileChatButton from "../MobileChatButton";

describe("MobileChatButton", () => {
  it("renders chat icon", () => {
    render(<MobileChatButton messageCount={0} onClick={() => {}} />);
    expect(screen.getByText("💬")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<MobileChatButton messageCount={0} onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not show badge when messageCount is 0", () => {
    render(<MobileChatButton messageCount={0} onClick={() => {}} />);
    // The badge contains the count.
    // We can check if any element with class bg-red-500 exists, or just check text content.
    // Since 0 is not rendered, we can check that.
    const badge = screen.queryByText("0");
    expect(badge).not.toBeInTheDocument();
  });

  it("shows badge with count when messageCount > 0", () => {
    render(<MobileChatButton messageCount={5} onClick={() => {}} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows 9+ when messageCount > 9", () => {
    render(<MobileChatButton messageCount={10} onClick={() => {}} />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });
});
