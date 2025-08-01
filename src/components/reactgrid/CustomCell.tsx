/**
 * CustomCell component for ReactGrid.
 * 
 * This component provides a flexible custom cell type that takes a function
 * with a rowId parameter and returns a React node for rendering. It includes:
 * - Dynamic content rendering based on rowId
 * - Flexible React node output
 * - Proper cell template implementation
 * - Non-editable by default (can be overridden)
 * 
 * Features:
 * - Renders custom React components based on rowId
 * - Supports any React node as content
 * - Maintains proper cell template interface
 * - Can be used for complex cell content (buttons, icons, etc.)
 * 
 * Usage:
 * ```tsx
 * // Basic custom cell with icon
 * { type: 'custom', rowId: 'row1', renderFn: (rowId) => <WarningIcon /> }
 * 
 * // Custom cell with button
 * { type: 'custom', rowId: 'row1', renderFn: (rowId) => <Button>Edit</Button> }
 * 
 * // Custom cell with conditional rendering
 * { type: 'custom', rowId: 'row1', renderFn: (rowId) => 
 *   rowId === 'header' ? <HeaderIcon /> : <DataIcon />
 * }
 * ```
 */

import React from 'react';
import { Cell, CellTemplate, Compatible, Uncertain, UncertainCompatible, getCellProperty } from '@silevis/reactgrid';

// Custom cell type for dynamic content
export interface CustomCell extends Cell {
  type: "custom";
  rowId: string;
  renderFn: (rowId: string) => React.ReactNode;
  nonEditable?: boolean;
  value?: number; // Add value property to satisfy Cell interface
}

// Custom cell template for dynamic content
export class CustomCellTemplate implements CellTemplate<CustomCell> {
  getCompatibleCell(uncertainCell: Uncertain<CustomCell>): Compatible<CustomCell> {
    const rowId = getCellProperty(uncertainCell, 'rowId', 'string');
    const renderFn = getCellProperty(uncertainCell, 'renderFn', 'function');
    const nonEditable = getCellProperty(uncertainCell, 'nonEditable', 'boolean') ?? true;
    const value = getCellProperty(uncertainCell, 'value', 'number') || 0;
    
    return {
      ...uncertainCell,
      rowId,
      renderFn: renderFn || (() => null),
      nonEditable,
      value,
      text: '', // Custom cells don't use text property
    };
  }

  handleKeyDown(
    cell: Compatible<CustomCell>,
    keyCode: number,
    ctrl: boolean,
    shift: boolean,
    alt: boolean
  ): { cell: Compatible<CustomCell>; enableEditMode: boolean } {
    return { cell, enableEditMode: false };
  }

  update(cell: Compatible<CustomCell>, cellToMerge: UncertainCompatible<CustomCell>): Compatible<CustomCell> {
    return this.getCompatibleCell({ ...cell, ...cellToMerge });
  }

  render(
    cell: Compatible<CustomCell>,
    isInEditMode: boolean,
    onCellChanged: (cell: Compatible<CustomCell>, commit: boolean) => void
  ): React.ReactNode {
    // Always render the custom content, regardless of edit mode
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4px',
      }}>
        {cell.renderFn(cell.rowId)}
      </div>
    );
  }
}

// Export the template instance for easy use
export const customCellTemplate = new CustomCellTemplate(); 