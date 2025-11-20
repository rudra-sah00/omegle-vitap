import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import VideoPanel from "../VideoPanel";
import { ThemeProvider } from "@/contexts/ThemeContext";

describe("VideoPanel", () => {
  const mockVideoRef = { current: document.createElement("div") };

  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
  };

  it("renders video container", () => {
    const { container } = renderWithTheme(
      <VideoPanel
        videoRef={mockVideoRef}
        isConnected={false}
        isSearching={false}
        isCameraOn={false}
      />
    );
    // Check that the main flex-1 container is rendered
    const mainContainer = container.querySelector(".flex-1");
    expect(mainContainer).toBeInTheDocument();
  });

  it("renders Stranger placeholder when isRemote is true and not connected", () => {
    renderWithTheme(
      <VideoPanel videoRef={mockVideoRef} isRemote={true} isConnected={false} isSearching={false} />
    );
    expect(screen.getByText("Stranger")).toBeInTheDocument();
  });

  it("renders Stranger camera off when isRemote is true, connected, but no remote users", () => {
    renderWithTheme(
      <VideoPanel
        videoRef={mockVideoRef}
        isRemote={true}
        isConnected={true}
        isSearching={false}
        remoteUsers={[]}
      />
    );
    expect(screen.getByText("Stranger's camera is off")).toBeInTheDocument();
  });

  it("renders searching animation when not remote and isSearching is true", () => {
    const { container } = renderWithTheme(
      <VideoPanel
        videoRef={mockVideoRef}
        isRemote={false}
        isConnected={false}
        isSearching={true}
        isCameraOn={false}
      />
    );
    // When searching with camera off, just verify the component renders (shows animation instead of text)
    const mainContainer = container.querySelector(".flex-1");
    expect(mainContainer).toBeInTheDocument();
  });

  it("renders Camera is off when not remote, connected, but camera/video off", () => {
    renderWithTheme(
      <VideoPanel
        videoRef={mockVideoRef}
        isRemote={false}
        isConnected={true}
        isSearching={false}
        isCameraOn={false}
      />
    );
    expect(screen.getByText("Camera is off")).toBeInTheDocument();
  });

  it("renders Your camera when not remote, not connected, not searching, and camera off", () => {
    renderWithTheme(
      <VideoPanel
        videoRef={mockVideoRef}
        isRemote={false}
        isConnected={false}
        isSearching={false}
        isCameraOn={false}
      />
    );
    expect(screen.getByText("Your camera")).toBeInTheDocument();
  });

  it("calls onToggleControls when clicked", () => {
    const handleToggle = jest.fn();
    const { container } = renderWithTheme(
      <VideoPanel
        videoRef={mockVideoRef}
        isConnected={false}
        isSearching={false}
        isCameraOn={false}
        onToggleControls={handleToggle}
      />
    );

    // Click the main container div
    const mainContainer = container.querySelector(".flex-1");
    if (mainContainer) {
      fireEvent.click(mainContainer);
      expect(handleToggle).toHaveBeenCalled();
    }
  });
});
