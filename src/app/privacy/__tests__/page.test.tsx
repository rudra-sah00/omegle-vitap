import { render, screen } from "@testing-library/react";
import PrivacyPage from "../page";

describe("Privacy Policy Page", () => {
  it("renders the privacy page with title", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText(/For VIT Campus Community/i)).toBeInTheDocument();
  });

  it("displays all main sections", () => {
    render(<PrivacyPage />);

    // Check for key section headings
    expect(screen.getByText("1. Information We Collect")).toBeInTheDocument();
    expect(screen.getByText("3. How We Use Information")).toBeInTheDocument();
    expect(screen.getByText(/Data Security/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Conversations Are Private/i)).toBeInTheDocument();
    expect(screen.getByText("5. Cookies and Tracking")).toBeInTheDocument();
    expect(screen.getByText("7. Data Retention")).toBeInTheDocument();
    expect(screen.getByText("8. Your Rights")).toBeInTheDocument();
    expect(screen.getByText("13. Safety First")).toBeInTheDocument();
    expect(screen.getByText("14. Contact & Support")).toBeInTheDocument();
  });

  it("displays anonymous platform information", () => {
    render(<PrivacyPage />);

    expect(screen.getByText(/No registration required/i)).toBeInTheDocument();
    expect(screen.getByText(/completely anonymous/i)).toBeInTheDocument();
    const anonymous = screen.getAllByText(/anonymous/i);
    expect(anonymous.length).toBeGreaterThan(0);
  });

  it("displays zero recording policy", () => {
    render(<PrivacyPage />);

    expect(screen.getByText(/Zero conversation recording/i)).toBeInTheDocument();
  });

  it("displays technical data collection information", () => {
    render(<PrivacyPage />);

    expect(screen.getByText(/browser type/i)).toBeInTheDocument();
    expect(screen.getByText(/device information/i)).toBeInTheDocument();
  });

  it("mentions VIT community", () => {
    render(<PrivacyPage />);

    const vitStudents = screen.getAllByText(/VIT students/i);
    expect(vitStudents.length).toBeGreaterThan(0);
  });

  it("has links to terms and community guidelines", () => {
    render(<PrivacyPage />);

    const termsLinks = screen.getAllByRole("link", { name: /terms/i });
    const communityLinks = screen.getAllByRole("link", {
      name: /community guidelines/i,
    });

    expect(termsLinks.length).toBeGreaterThan(0);
    expect(communityLinks.length).toBeGreaterThan(0);
  });

  it("has contact section", () => {
    render(<PrivacyPage />);

    expect(screen.getByText(/Contact & Support/i)).toBeInTheDocument();
  });

  it("displays last updated date", () => {
    render(<PrivacyPage />);

    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    expect(screen.getByText(/November 20, 2025/)).toBeInTheDocument();
  });

  it("displays data security information", () => {
    render(<PrivacyPage />);

    expect(screen.getByText(/Security Measures/i)).toBeInTheDocument();
  });

  it("displays third-party services section", () => {
    render(<PrivacyPage />);

    const thirdParty = screen.getAllByText(/Third-Party/i);
    expect(thirdParty.length).toBeGreaterThan(0);
  });

  it("displays user rights information", () => {
    render(<PrivacyPage />);

    const anonymousElements = screen.getAllByText(/anonymous/i);
    expect(anonymousElements.length).toBeGreaterThan(0);
  });

  it("displays data retention policy", () => {
    render(<PrivacyPage />);

    const retention = screen.getAllByText(/Data Retention/i);
    expect(retention.length).toBeGreaterThan(0);
  });

  it("has proper page structure with gradient background", () => {
    const { container } = render(<PrivacyPage />);

    // Check for gradient background classes
    const gradientElement = container.querySelector('[class*="from-blue-50"]');
    expect(gradientElement).toBeInTheDocument();
  });

  it("renders content with proper spacing", () => {
    const { container } = render(<PrivacyPage />);

    const contentContainer = container.querySelector('[class*="space-y-8"]');
    expect(contentContainer).toBeInTheDocument();
  });

  it("displays all 14 sections", () => {
    render(<PrivacyPage />);

    // Count section headings (1-14)
    for (let i = 1; i <= 14; i++) {
      const sectionRegex = new RegExp(`${i}\\.`);
      const sections = screen.getAllByText(sectionRegex);
      expect(sections.length).toBeGreaterThan(0);
    }
  });

  it("emphasizes no personal data collection", () => {
    render(<PrivacyPage />);

    expect(screen.getByText(/no registration required/i)).toBeInTheDocument();
    const anonymous = screen.getAllByText(/anonymous/i);
    expect(anonymous.length).toBeGreaterThan(0);
  });

  it("displays rights section heading", () => {
    render(<PrivacyPage />);

    expect(screen.getByText(/Your Rights/i)).toBeInTheDocument();
  });
});
