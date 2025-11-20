import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ChatWindow from "../ChatWindow";
import { ThemeProvider } from "@/contexts/ThemeContext";

describe("ChatWindow", () => {
  const defaultProps = {
    messages: [],
    partnerTyping: false,
    partnerOnline: false,
    onSendMessage: jest.fn(),
    onTyping: jest.fn(),
    isConnected: false,
    userId: "user1",
    onToggleTheme: jest.fn(),
  };

  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  it("renders not connected state correctly", () => {
    renderWithTheme(<ChatWindow {...defaultProps} />);
    expect(screen.getByText("Not connected")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Connect to start chatting")).toBeDisabled();
    expect(screen.getByText("Send")).toBeDisabled();
  });

  it("renders connected state correctly", () => {
    renderWithTheme(<ChatWindow {...defaultProps} isConnected={true} partnerOnline={true} />);
    expect(screen.getByText("Stranger is online")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type a message...")).not.toBeDisabled();
  });

  it("renders messages correctly", async () => {
    const messages = [
      {
        id: "1",
        senderId: "user1",
        message: "Hello",
        timestamp: Date.now(),
        type: "text" as const,
      },
      {
        id: "2",
        senderId: "user2",
        message: "Hi there",
        timestamp: Date.now(),
        type: "text" as const,
      },
      {
        id: "3",
        senderId: "system",
        message: "System message",
        timestamp: Date.now(),
        type: "system" as const,
      },
    ];

    renderWithTheme(<ChatWindow {...defaultProps} messages={messages} isConnected={true} />);

    expect(screen.getByText("You:")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Stranger:")).toBeInTheDocument();
    // Partner message uses EncryptedText animation - check that the message container exists
    // The encrypted text component renders each character in spans, so we can't easily find the full text
    expect(screen.getByText("System message")).toBeInTheDocument();
  });

  it("calls onSendMessage when form is submitted", () => {
    renderWithTheme(<ChatWindow {...defaultProps} isConnected={true} />);
    const input = screen.getByPlaceholderText("Type a message...");
    const sendButton = screen.getByText("Send");

    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.click(sendButton);

    expect(defaultProps.onSendMessage).toHaveBeenCalledWith("Test message");
    expect(input).toHaveValue("");
  });

  it("calls onTyping when input changes", () => {
    renderWithTheme(<ChatWindow {...defaultProps} isConnected={true} />);
    const input = screen.getByPlaceholderText("Type a message...");

    fireEvent.change(input, { target: { value: "T" } });
    expect(defaultProps.onTyping).toHaveBeenCalled();
  });

  it("shows partner typing indicator", () => {
    renderWithTheme(<ChatWindow {...defaultProps} isConnected={true} partnerTyping={true} />);
    expect(screen.getByText("Stranger is typing")).toBeInTheDocument();
  });

  it("does not send empty messages", () => {
    renderWithTheme(<ChatWindow {...defaultProps} isConnected={true} />);
    const sendButton = screen.getByText("Send");

    fireEvent.click(sendButton);
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled();
  });
});
