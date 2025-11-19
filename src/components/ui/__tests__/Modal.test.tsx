import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "../Modal";

describe("Modal", () => {
  it("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    expect(screen.queryByText("Modal Content")).not.toBeInTheDocument();
  });

  it("renders when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
  });

  it("calls onClose when clicking the backdrop", () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal Content</div>
      </Modal>
    );

    // The backdrop is the outer div
    // We can find it by looking for the parent of the modal content's container
    // Or simply clicking on the element that covers the screen.
    // Since the backdrop has the onClick handler, we need to target it.
    // The backdrop has fixed inset-0.

    // Let's try to find the backdrop by its style or class if possible, or just click document.body if it covers it?
    // Actually, the backdrop is the direct child of the portal.
    // We can assume the first div in the portal is the backdrop.

    // A safer way is to add a data-testid to the backdrop in the component, but I shouldn't modify code unless necessary.
    // The backdrop has `fixed inset-0`.

    // Let's use a workaround: find the content, go to parent.
    const content = screen.getByText("Modal Content");
    const modalContainer = content.closest(".bg-white");
    const backdrop = modalContainer?.parentElement;

    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when clicking the modal content", () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal Content</div>
      </Modal>
    );

    const content = screen.getByText("Modal Content");
    fireEvent.click(content);

    expect(handleClose).not.toHaveBeenCalled();
  });

  it("calls onClose when pressing Escape key", () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Modal Content</div>
      </Modal>
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("locks body scroll when open", () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("unlocks body scroll when closed", () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    expect(document.body.style.overflow).toBe("unset");
  });
});
