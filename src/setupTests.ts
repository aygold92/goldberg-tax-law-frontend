/**
 * Test setup file for Jest DOM matchers.
 * 
 * This file configures custom Jest matchers for DOM testing:
 * - Imports jest-dom for enhanced DOM assertions
 * - Enables custom matchers like toHaveTextContent, toBeInTheDocument
 * - Provides better testing utilities for React components
 * 
 * Custom matchers available:
 * - toHaveTextContent: Check if element contains specific text
 * - toBeInTheDocument: Verify element is rendered in DOM
 * - toHaveClass: Check if element has specific CSS class
 * - toHaveAttribute: Verify element has specific attribute
 * 
 * Used by all test files to enable enhanced DOM testing capabilities.
 */

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
