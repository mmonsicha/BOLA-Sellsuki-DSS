import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplateGalleryStep } from "./TemplateGalleryStep";
import { richMenuPresets } from "@/data/richMenuPresets";

// Minimal Badge stub — avoids full shadcn setup
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

describe("TemplateGalleryStep", () => {
  const noop = vi.fn();

  it("renders all presets by default (All filter)", () => {
    render(<TemplateGalleryStep selectedId={null} onSelect={noop} />);
    // Each preset card has role=button
    const cards = screen.getAllByRole("button", { name: undefined });
    // At least one card per preset (plus category pills and guide buttons)
    expect(cards.length).toBeGreaterThanOrEqual(richMenuPresets.length);
  });

  it("shows all category filter pills including All", () => {
    render(<TemplateGalleryStep selectedId={null} onSelect={noop} />);
    // Use getAllByText since category labels may also appear as preset names
    expect(screen.getAllByText("All").length).toBeGreaterThan(0);
    expect(screen.getAllByText("General").length).toBeGreaterThan(0);
    expect(screen.getAllByText("E-commerce").length).toBeGreaterThan(0);
    // Verify the pill buttons are specifically there
    const pillBtns = screen.getAllByRole("button").filter(
      (el) => el.textContent === "All" || el.textContent === "General" || el.textContent === "E-commerce"
    );
    expect(pillBtns.length).toBeGreaterThanOrEqual(3);
  });

  it("calls onSelect with the preset when a card is clicked", () => {
    const onSelect = vi.fn();
    render(<TemplateGalleryStep selectedId={null} onSelect={onSelect} />);
    const firstCard = screen.getAllByRole("button", { name: undefined }).find(
      (el) => el.getAttribute("aria-pressed") !== null
    )!;
    fireEvent.click(firstCard);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toMatchObject({ id: expect.any(String) });
  });

  it("marks the selected card as pressed", () => {
    const first = richMenuPresets[0];
    render(<TemplateGalleryStep selectedId={first.id} onSelect={noop} />);
    const pressedCards = screen.getAllByRole("button").filter(
      (el) => el.getAttribute("aria-pressed") === "true"
    );
    expect(pressedCards.length).toBe(1);
  });

  it("toggles use-case guide when ? button is clicked", () => {
    render(<TemplateGalleryStep selectedId={null} onSelect={noop} />);
    const first = richMenuPresets[0];
    // Guide text should not be visible initially
    expect(screen.queryByText(first.useCaseGuide)).toBeNull();

    // Click the first guide button
    const guideButtons = screen.getAllByLabelText("Show use case guide");
    fireEvent.click(guideButtons[0]);
    expect(screen.getByText(first.useCaseGuide)).toBeInTheDocument();

    // Click again — should collapse
    fireEvent.click(guideButtons[0]);
    expect(screen.queryByText(first.useCaseGuide)).toBeNull();
  });

  it("clicking guide button does not trigger card selection", () => {
    const onSelect = vi.fn();
    render(<TemplateGalleryStep selectedId={null} onSelect={onSelect} />);
    const guideBtn = screen.getAllByLabelText("Show use case guide")[0];
    fireEvent.click(guideBtn);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("filters presets by category", () => {
    render(<TemplateGalleryStep selectedId={null} onSelect={noop} />);
    // Count cards before filter
    const allCards = screen.getAllByRole("button").filter(
      (el) => el.getAttribute("aria-pressed") !== null
    );
    const totalCount = allCards.length;

    // Click "Blank" — should show fewer cards
    fireEvent.click(screen.getByText("Blank"));
    const blankCards = screen.getAllByRole("button").filter(
      (el) => el.getAttribute("aria-pressed") !== null
    );
    expect(blankCards.length).toBeLessThan(totalCount);
  });

  it("renders preset name and size badge for each card", () => {
    render(<TemplateGalleryStep selectedId={null} onSelect={noop} />);
    const first = richMenuPresets[0];
    expect(screen.getByText(first.name)).toBeInTheDocument();
    // sizeType badge — multiple cards may have 'large'
    expect(screen.getAllByText(first.sizeType).length).toBeGreaterThan(0);
  });
});
