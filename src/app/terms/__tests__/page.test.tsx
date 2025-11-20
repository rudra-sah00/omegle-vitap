import { render, screen } from "@testing-library/react";
import TermsPage from "../page";

describe("Terms of Service Page", () => {
  it("renders the terms page with title", () => {
    render(<TermsPage />);
    expect(screen.getByText("Terms of Service")).toBeInTheDocument();
    expect(screen.getByText(/For VIT Campus Community/i)).toBeInTheDocument();
  });

  it("displays key main sections", () => {
    render(<TermsPage />);

    // Check for a few key section headings
    expect(screen.getByText("1. Acceptance of Terms")).toBeInTheDocument();
    expect(screen.getByText(/Service Description/i)).toBeInTheDocument();
    expect(screen.getByText(/Eligibility/i)).toBeInTheDocument();
    expect(screen.getByText(/Prohibited Conduct/i)).toBeInTheDocument();
    expect(screen.getByText(/Disclaimer of Warranties/i)).toBeInTheDocument();
  });

  it("displays VIT campus eligibility information", () => {
    render(<TermsPage />);

    expect(screen.getByText(/Vellore/)).toBeInTheDocument();
    expect(screen.getByText(/Chennai/)).toBeInTheDocument();
    expect(screen.getByText(/Bhopal/)).toBeInTheDocument();
  });

  it("displays anonymous platform information", () => {
    render(<TermsPage />);

    expect(screen.getByText(/no registration required/i)).toBeInTheDocument();
    const anonymousElements = screen.getAllByText(/anonymous/i);
    expect(anonymousElements.length).toBeGreaterThan(0);
  });

  it("displays VIT-specific content", () => {
    render(<TermsPage />);

    const vitStudent = screen.getAllByText(/VIT student/i);
    expect(vitStudent.length).toBeGreaterThan(0);
    expect(screen.getByText(/Eligibility & User Requirements/i)).toBeInTheDocument();
  });

  it("has links to privacy policy and community guidelines", () => {
    render(<TermsPage />);

    const privacyLinks = screen.getAllByRole("link", { name: /privacy/i });
    const communityLinks = screen.getAllByRole("link", {
      name: /community guidelines/i,
    });

    expect(privacyLinks.length).toBeGreaterThan(0);
    expect(communityLinks.length).toBeGreaterThan(0);
  });

  it("has navigation links", () => {
    render(<TermsPage />);

    const homeLink = screen.getByRole("link", { name: /Back to Home/i });
    expect(homeLink).toBeInTheDocument();
  });

  it("displays last updated date", () => {
    render(<TermsPage />);

    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    expect(screen.getByText(/November 20, 2025/)).toBeInTheDocument();
  });

  it("displays prohibited activities section", () => {
    render(<TermsPage />);

    expect(screen.getByText(/harassment/i)).toBeInTheDocument();
    expect(screen.getByText(/explicit content/i)).toBeInTheDocument();
    expect(screen.getByText(/hate speech/i)).toBeInTheDocument();
  });

  it("displays disclaimer of warranties", () => {
    render(<TermsPage />);

    expect(screen.getByText("9. Disclaimer of Warranties")).toBeInTheDocument();
    expect(screen.getByText(/as is/i)).toBeInTheDocument();
  });

  it("displays limitation of liability", () => {
    render(<TermsPage />);

    expect(screen.getByText("10. Limitation of Liability")).toBeInTheDocument();
  });

  it("displays governing law section", () => {
    render(<TermsPage />);

    expect(screen.getByText(/laws of India/i)).toBeInTheDocument();
  });

  it("has proper page structure with gradient background", () => {
    const { container } = render(<TermsPage />);

    // Check for gradient background classes
    const gradientElement = container.querySelector('[class*="from-purple-50"]');
    expect(gradientElement).toBeInTheDocument();
  });

  it("renders content with proper spacing", () => {
    const { container } = render(<TermsPage />);

    const contentContainer = container.querySelector('[class*="space-y-8"]');
    expect(contentContainer).toBeInTheDocument();
  });

  it("displays multiple sections", () => {
    render(<TermsPage />);

    // Check that multiple sections exist
    expect(screen.getByText(/Acceptance of Terms/i)).toBeInTheDocument();
    expect(screen.getByText(/15\. Contact/i)).toBeInTheDocument();
  });
});
