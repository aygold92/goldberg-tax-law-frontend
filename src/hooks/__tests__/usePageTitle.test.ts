/**
 * Tests for the usePageTitle hook
 */

import { renderHook, act } from '@testing-library/react';
import { usePageTitle } from '../usePageTitle';

// Mock document.title
const mockDocumentTitle = jest.fn();
Object.defineProperty(document, 'title', {
  writable: true,
  value: 'Bank Statement Analyzer',
});

describe('usePageTitle', () => {
  beforeEach(() => {
    document.title = 'Bank Statement Analyzer';
    jest.clearAllMocks();
  });

  it('should set page title with prefix', () => {
    const { result } = renderHook(() => usePageTitle());

    act(() => {
      result.current.setPageTitle('Test Page');
    });

    expect(document.title).toBe('Bank Statement Analyzer - Test Page');
  });

  it('should reset page title to base title', () => {
    const { result } = renderHook(() => usePageTitle());

    // First set a title
    act(() => {
      result.current.setPageTitle('Test Page');
    });

    expect(document.title).toBe('Bank Statement Analyzer - Test Page');

    // Then reset it
    act(() => {
      result.current.resetPageTitle();
    });

    expect(document.title).toBe('Bank Statement Analyzer');
  });

  it('should handle empty title', () => {
    const { result } = renderHook(() => usePageTitle());

    act(() => {
      result.current.setPageTitle('');
    });

    expect(document.title).toBe('Bank Statement Analyzer');
  });

  it('should reset title on unmount', () => {
    const { result, unmount } = renderHook(() => usePageTitle());

    act(() => {
      result.current.setPageTitle('Test Page');
    });

    expect(document.title).toBe('Bank Statement Analyzer - Test Page');

    unmount();

    expect(document.title).toBe('Bank Statement Analyzer');
  });
});
