import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MediaControls from "../MediaControls";

describe("MediaControls", () => {
  it("renders all controls", () => {
    render(<MediaControls />);
    expect(screen.getByTitle("Turn camera off")).toBeInTheDocument();
    expect(screen.getByTitle("Mute microphone")).toBeInTheDocument();
    expect(screen.getByText("Stop")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("toggles camera state on click", () => {
    render(<MediaControls />);
    const cameraButton = screen.getByTitle("Turn camera off");

    // Initial state is on
    expect(cameraButton).toHaveClass("bg-opacity-20");

    // Click to turn off
    fireEvent.click(cameraButton);

    // State should be off
    // The title changes
    const cameraButtonOff = screen.getByTitle("Turn camera on");
    expect(cameraButtonOff).toHaveClass("bg-red-500");

    // Click to turn on
    fireEvent.click(cameraButtonOff);
    expect(screen.getByTitle("Turn camera off")).toBeInTheDocument();
  });

  it("toggles mic state on click", () => {
    render(<MediaControls />);
    const micButton = screen.getByTitle("Mute microphone");

    // Initial state is on
    expect(micButton).toHaveClass("bg-opacity-20");

    // Click to mute
    fireEvent.click(micButton);

    // State should be off
    const micButtonOff = screen.getByTitle("Unmute microphone");
    expect(micButtonOff).toHaveClass("bg-red-500");

    // Click to unmute
    fireEvent.click(micButtonOff);
    expect(screen.getByTitle("Mute microphone")).toBeInTheDocument();
  });

  it("stops propagation on click", () => {
    const handleParentClick = jest.fn();
    render(
      <div onClick={handleParentClick}>
        <MediaControls />
      </div>
    );

    fireEvent.click(screen.getByText("Stop"));
    expect(handleParentClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("New"));
    expect(handleParentClick).not.toHaveBeenCalled();
  });
});
