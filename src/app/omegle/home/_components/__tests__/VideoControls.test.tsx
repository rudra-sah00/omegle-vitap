import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import VideoControls from "../VideoControls";

describe("VideoControls", () => {
  const defaultProps = {
    isMicOn: true,
    isCameraOn: true,
    networkQuality: "excellent" as const,
    onMicToggle: jest.fn(),
    onCameraToggle: jest.fn(),
    onNext: jest.fn(),
    onStop: jest.fn(),
    showControls: true,
  };

  it("does not render when showControls is false", () => {
    render(<VideoControls {...defaultProps} showControls={false} />);
    expect(screen.queryByTitle("Turn off camera")).not.toBeInTheDocument();
  });

  it("renders all controls when showControls is true", () => {
    render(<VideoControls {...defaultProps} />);
    expect(screen.getByTitle("Turn off camera")).toBeInTheDocument();
    expect(screen.getByTitle("Mute microphone")).toBeInTheDocument();
    expect(screen.getByTitle("Stop and disconnect")).toBeInTheDocument();
    expect(screen.getByTitle("Skip to next stranger")).toBeInTheDocument();
  });

  it("calls onCameraToggle when camera button is clicked", () => {
    render(<VideoControls {...defaultProps} />);
    fireEvent.click(screen.getByTitle("Turn off camera"));
    expect(defaultProps.onCameraToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onMicToggle when mic button is clicked", () => {
    render(<VideoControls {...defaultProps} />);
    fireEvent.click(screen.getByTitle("Mute microphone"));
    expect(defaultProps.onMicToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onStop when stop button is clicked", () => {
    render(<VideoControls {...defaultProps} />);
    fireEvent.click(screen.getByTitle("Stop and disconnect"));
    expect(defaultProps.onStop).toHaveBeenCalledTimes(1);
  });

  it("calls onNext when next button is clicked", () => {
    render(<VideoControls {...defaultProps} />);
    fireEvent.click(screen.getByTitle("Skip to next stranger"));
    expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
  });

  it("shows correct state for camera off", () => {
    render(<VideoControls {...defaultProps} isCameraOn={false} />);
    expect(screen.getByTitle("Turn on camera")).toBeInTheDocument();
    expect(screen.getByTitle("Turn on camera")).toHaveClass("bg-red-600");
  });

  it("shows correct state for mic off", () => {
    render(<VideoControls {...defaultProps} isMicOn={false} />);
    expect(screen.getByTitle("Unmute microphone")).toBeInTheDocument();
    expect(screen.getByTitle("Unmute microphone")).toHaveClass("bg-red-600");
  });
});
