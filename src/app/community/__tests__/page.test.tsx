import { render, screen } from "@testing-library/react";
import CommunityPage from "../page";

describe("Community Guidelines Page", () => {
  it("renders the community guidelines page with title", () => {
    render(<CommunityPage />);
    expect(screen.getByText("Community Guidelines")).toBeInTheDocument();
    expect(screen.getByText(/Building a Safe VIT Community Together/i)).toBeInTheDocument();
  });

  it("displays the subtitle", () => {
    render(<CommunityPage />);
    expect(screen.getByText(/Building a Safe VIT Community Together/i)).toBeInTheDocument();
  });

  it("displays all main sections", () => {
    render(<CommunityPage />);

    // Check for key section headings
    expect(screen.getByText("1. 🎯 Core Values")).toBeInTheDocument();
    expect(screen.getByText("2. ✅ Do's - What We Encourage")).toBeInTheDocument();
    expect(screen.getByText("3. ❌ Don'ts - What's Not Allowed")).toBeInTheDocument();
    expect(screen.getByText("4. 🎓 VIT-Specific Guidelines")).toBeInTheDocument();
    expect(screen.getByText("5. 🛡️ Safety Tips")).toBeInTheDocument();
    expect(screen.getByText("6. 📢 Reporting & Moderation")).toBeInTheDocument();
    expect(screen.getByText("7. 🌟 Building Positive Connections")).toBeInTheDocument();
    expect(screen.getByText("8. ⚖️ Consequences of Violations")).toBeInTheDocument();
  });

  it("displays the Do's and Don'ts section", () => {
    render(<CommunityPage />);

    expect(screen.getByText(/Do's - What We Encourage/i)).toBeInTheDocument();
    expect(screen.getByText(/Don'ts - What's Not Allowed/i)).toBeInTheDocument();
  });

  it("displays all Do's points", () => {
    render(<CommunityPage />);

    expect(screen.getByText(/Be Welcoming/i)).toBeInTheDocument();
    expect(screen.getByText(/Report Issues/i)).toBeInTheDocument();
    expect(screen.getByText(/Exit Politely/i)).toBeInTheDocument();
    expect(screen.getByText(/Represent VIT Well/i)).toBeInTheDocument();
    expect(screen.getByText(/Meaningful Conversations/i)).toBeInTheDocument();
    expect(screen.getByText(/Be Authentic/i)).toBeInTheDocument();
  });

  it("displays all Don'ts points", () => {
    render(<CommunityPage />);

    expect(screen.getByText(/No Inappropriate Content/i)).toBeInTheDocument();
    expect(screen.getByText(/No Harassment or Bullying/i)).toBeInTheDocument();
    expect(screen.getByText(/No Personal Info Pressure/i)).toBeInTheDocument();
    expect(screen.getByText(/No Hate Speech/i)).toBeInTheDocument();
    expect(screen.getByText(/No Recording/i)).toBeInTheDocument();
    expect(screen.getByText(/No Spam or Scams/i)).toBeInTheDocument();
  });

  it("displays safety tips", () => {
    render(<CommunityPage />);

    expect(screen.getByText(/Protect Your Identity/i)).toBeInTheDocument();
    expect(screen.getByText(/Trust Your Instincts/i)).toBeInTheDocument();
    expect(screen.getByText(/Financial Safety/i)).toBeInTheDocument();
    expect(screen.getByText(/Meeting Offline/i)).toBeInTheDocument();
  });

  it("displays VIT campus culture information", () => {
    render(<CommunityPage />);

    expect(screen.getByText(/All Campuses Welcome/i)).toBeInTheDocument();
    expect(screen.getByText(/Academic Integrity/i)).toBeInTheDocument();
    expect(screen.getByText(/Support Each Other/i)).toBeInTheDocument();
  });

  it("displays all VIT campuses", () => {
    render(<CommunityPage />);

    expect(screen.getByText(/Vellore/i)).toBeInTheDocument();
    expect(screen.getByText(/Chennai/i)).toBeInTheDocument();
    expect(screen.getByText(/AP.*Amaravati/i)).toBeInTheDocument();
    expect(screen.getByText(/Bhopal/i)).toBeInTheDocument();
  });

  it("displays consequences section", () => {
    render(<CommunityPage />);

    expect(screen.getByText(/Minor Violations/i)).toBeInTheDocument();
    const seriousViolations = screen.getAllByText(/Serious Violations/i);
    expect(seriousViolations.length).toBeGreaterThan(0);
    expect(screen.getByText(/Severe Cases/i)).toBeInTheDocument();
  });

  it("has links to privacy policy and terms", () => {
    render(<CommunityPage />);

    const privacyLinks = screen.getAllByRole("link", { name: /privacy/i });
    const termsLinks = screen.getAllByRole("link", { name: /terms/i });

    expect(privacyLinks.length).toBeGreaterThan(0);
    expect(termsLinks.length).toBeGreaterThan(0);
  });

  it("has navigation links", () => {
    render(<CommunityPage />);

    const homeLink = screen.getByRole("link", { name: /Back to Home/i });
    expect(homeLink).toBeInTheDocument();
  });

  it("displays last updated date", () => {
    render(<CommunityPage />);

    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    expect(screen.getByText(/November 20, 2025/i)).toBeInTheDocument();
  });

  it("has proper page structure with gradient background", () => {
    const { container } = render(<CommunityPage />);

    // Check for gradient background classes
    const gradientElement = container.querySelector('[class*="from-green-50"]');
    expect(gradientElement).toBeInTheDocument();
  });

  it("renders content with proper spacing", () => {
    const { container } = render(<CommunityPage />);

    const contentContainer = container.querySelector('[class*="space-y-8"]');
    expect(contentContainer).toBeInTheDocument();
  });

  it("displays all 8 main sections", () => {
    render(<CommunityPage />);

    // Check for section headings
    expect(screen.getByText(/1\. 🎯 Core Values/)).toBeInTheDocument();
    expect(screen.getByText(/2\. ✅ Do's/)).toBeInTheDocument();
    expect(screen.getByText(/3\. ❌ Don'ts/)).toBeInTheDocument();
    expect(screen.getByText(/4\. 🎓 VIT-Specific/)).toBeInTheDocument();
    expect(screen.getByText(/5\. 🛡️ Safety Tips/)).toBeInTheDocument();
    expect(screen.getByText(/6\. 📢 Reporting/)).toBeInTheDocument();
    expect(screen.getByText(/7\. 🌟 Building Positive/)).toBeInTheDocument();
    expect(screen.getByText(/8\. ⚖️ Consequences/)).toBeInTheDocument();
  });

  it("displays academic integrity section", () => {
    render(<CommunityPage />);

    expect(screen.getByText(/exam questions/i)).toBeInTheDocument();
    const academicDishonesty = screen.getAllByText(/academic dishonesty/i);
    expect(academicDishonesty.length).toBeGreaterThan(0);
  });

  it("displays reporting section", () => {
    render(<CommunityPage />);

    expect(screen.getByText(/When to Report:/i)).toBeInTheDocument();
    expect(screen.getByText(/What Happens:/i)).toBeInTheDocument();
  });

  it("displays cards with icons", () => {
    const { container } = render(<CommunityPage />);

    // Check for card sections
    const cards = container.querySelectorAll('[class*="bg-white"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it("emphasizes respect and safety", () => {
    render(<CommunityPage />);

    expect(screen.getByText(/Treat everyone with dignity/i)).toBeInTheDocument();
    expect(screen.getByText(/Protect Your Identity/i)).toBeInTheDocument();
  });

  it("displays positive community message", () => {
    render(<CommunityPage />);

    expect(screen.getByText(/Made by VITians, for VITians/i)).toBeInTheDocument();
  });
});
