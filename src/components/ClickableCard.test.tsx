import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ClickableCard } from './ClickableCard';

describe('ClickableCard', () => {
  it('renders children correctly', () => {
    const handleClick = vi.fn();
    render(
      <ClickableCard onClick={handleClick}>
        <span data-testid="child">Child Content</span>
      </ClickableCard>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <ClickableCard onClick={handleClick}>
        Child Content
      </ClickableCard>
    );

    const card = screen.getByRole('button');
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Enter key is pressed', () => {
    const handleClick = vi.fn();
    render(
      <ClickableCard onClick={handleClick}>
        Child Content
      </ClickableCard>
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Space key is pressed', () => {
    const handleClick = vi.fn();
    render(
      <ClickableCard onClick={handleClick}>
        Child Content
      </ClickableCard>
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ' });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Spacebar key is pressed (older browsers)', () => {
    const handleClick = vi.fn();
    render(
      <ClickableCard onClick={handleClick}>
        Child Content
      </ClickableCard>
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Spacebar' });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick for other keys', () => {
    const handleClick = vi.fn();
    render(
      <ClickableCard onClick={handleClick}>
        Child Content
      </ClickableCard>
    );

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'a' });
    fireEvent.keyDown(card, { key: 'Tab' });

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders as a div by default', () => {
    const handleClick = vi.fn();
    render(
      <ClickableCard onClick={handleClick}>
        Child Content
      </ClickableCard>
    );

    const card = screen.getByRole('button');
    expect(card.tagName.toLowerCase()).toBe('div');
  });

  it('renders as an article when as="article" is passed', () => {
    const handleClick = vi.fn();
    render(
      <ClickableCard onClick={handleClick} as="article">
        Child Content
      </ClickableCard>
    );

    const card = screen.getByRole('button');
    expect(card.tagName.toLowerCase()).toBe('article');
  });

  it('applies className correctly', () => {
    const handleClick = vi.fn();
    render(
      <ClickableCard onClick={handleClick} className="custom-class">
        Child Content
      </ClickableCard>
    );

    const card = screen.getByRole('button');
    expect(card).toHaveClass('custom-class');
  });

  it('applies aria-label correctly', () => {
    const handleClick = vi.fn();
    render(
      <ClickableCard onClick={handleClick} ariaLabel="custom-label">
        Child Content
      </ClickableCard>
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', 'custom-label');
  });
});
