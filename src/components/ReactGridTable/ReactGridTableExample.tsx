/**
 * Example component demonstrating ReactGridTable functionality.
 * 
 * This shows how to use the ReactGridTable component with:
 * - Different column types (text, number, date)
 * - Sorting functionality
 * - Add row functionality
 * - Table size controls
 */

import React, { useState } from 'react';
import { ReactGridTable, TableColumn } from './index';
import { isDataColumn } from './types';
import { CustomFilterConfig } from './filter/FilterTypes';
import { Person as PersonIcon, Warning, TrendingUp, Email } from '@mui/icons-material';
import { CellChange } from '@silevis/reactgrid';

// Sample data type
interface Person {
  id: string;
  name: string;
  age: number;
  email: string;
  joinDate: string;
}

// Sample data
const sampleData: Person[] = [
  { id: '1', name: 'Alice Johnson', age: 28, email: 'alice@gmail.com', joinDate: '2023-01-15' },
  { id: '2', name: 'Bob Smith', age: 34, email: 'bob@example.com', joinDate: '2022-11-20' },
  { id: '3', name: 'Carol Davis', age: 25, email: 'carol@gmail.com', joinDate: '2023-03-10' },
  { id: '4', name: 'David Wilson', age: 42, email: 'david@example.com', joinDate: '2021-08-05' },
  { id: '5', name: 'Eva Brown', age: 31, email: 'eva@gmail.com', joinDate: '2022-12-12' },
  { id: '6', name: 'Frank Miller', age: 22, email: 'frank@company.com', joinDate: '2023-06-01' },
  { id: '7', name: 'Grace Lee', age: 29, email: 'grace@gmail.com', joinDate: '2023-02-14' },
  { id: '8', name: 'Henry Taylor', age: 45, email: 'henry@example.com', joinDate: '2020-05-20' },
  { id: '9', name: 'Ivy Chen', age: 26, email: 'ivy@company.com', joinDate: '2023-04-30' },
  { id: '10', name: 'Jack Anderson', age: 33, email: 'jack@gmail.com', joinDate: '2022-09-15' },
];

// Column definitions
const columns: TableColumn<Person>[] = [
  {
    columnId: 'name',
    field: 'name',
    type: 'text',
    label: 'Name',
    width: 200,
    resizable: true,
  },
  {
    columnId: 'age',
    field: 'age',
    type: 'number',
    label: 'Age',
    width: 100,
    resizable: true,
  },
  {
    columnId: 'email',
    field: 'email',
    type: 'text',
    label: 'Email',
    width: 250,
    resizable: true,
  },
  {
    columnId: 'joinDate',
    field: 'joinDate',
    type: 'date',
    label: 'Join Date',
    width: 150,
    resizable: true,
  },
];

// Custom filter configurations
const customFilters: CustomFilterConfig<Person>[] = [
  {
    key: 'young',
    label: 'Young People',
    filterFunction: (person) => person.age < 30,
    icon: <PersonIcon />,
    color: 'primary',
    tooltip: 'Show people under 30 years old'
  },
  {
    key: 'recent',
    label: 'Recent Joiners',
    filterFunction: (person) => person.joinDate.startsWith('2023'),
    icon: <TrendingUp />,
    color: 'success',
    tooltip: 'Show people who joined in 2023'
  },
  {
    key: 'gmail',
    label: 'Gmail Users',
    filterFunction: (person) => person.email.includes('@gmail.com'),
    icon: <Email />,
    color: 'warning',
    tooltip: 'Show people with Gmail addresses'
  },
  {
    key: 'senior',
    label: 'Senior Staff',
    filterFunction: (person) => person.age >= 40,
    icon: <Warning />,
    color: 'error',
    tooltip: 'Show people 40 years or older'
  }
];

const ReactGridTableExample: React.FC = () => {
  const [data, setData] = useState<Person[]>(sampleData);

  // Example row styles - highlight some rows
  const rowStyle = {
    '1': { background: 'rgba(76, 175, 80, 0.1)' }, // Light green for Alice
    '3': { background: 'rgba(255, 235, 59, 0.1)' }, // Light yellow for Carol
    '5': { background: 'rgba(33, 150, 243, 0.1)' }, // Light blue for Eva
  };

  const handleRowAdd = (row: Partial<Person>) => {
    // Since we're not using an add-row anymore, we'll create a new person with default values
    const newPerson: Person = {
      id: String(Date.now()),
      name: 'New Person',
      age: 25,
      email: 'new@example.com',
      joinDate: new Date().toISOString().split('T')[0],
    };
    setData(prev => [...prev, newPerson]);
  };

  const handleCellsChanged = (changes: CellChange[]) => {
    // Handle cell changes for editing existing rows
    const newData = [...data];
    
    changes.forEach(change => {
      const rowIndex = newData.findIndex(p => p.id === change.rowId);
      if (rowIndex === -1) return;
      
      const column = columns.find(col => col.columnId === change.columnId);
      if (!column || !isDataColumn(column)) return;
      
      switch (change.type) {
        case 'text':
          newData[rowIndex] = { ...newData[rowIndex], [column.field]: change.newCell.text };
          break;
        case 'number':
          newData[rowIndex] = { ...newData[rowIndex], [column.field]: change.newCell.value };
          break;
        case 'date':
          newData[rowIndex] = { ...newData[rowIndex], [column.field]: change.newCell.date?.toISOString().split('T')[0] || '' };
          break;
      }
    });
    
    setData(newData);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>ReactGridTable Example</h1>
      <p>This demonstrates the functionality of the ReactGridTable component:</p>
      <ul>
        <li>Click column headers to sort</li>
        <li>Click filter icons in headers for advanced column filtering (equals, contains, greater than, etc.)</li>
        <li>Use quick filter buttons to filter by age, join date, email domain, etc.</li>
        <li>Use the search box to find text across all columns</li>
        <li>Resize columns by dragging the edges</li>
        <li>Use the "Add Row" button in the toolbar to add new people</li>
        <li>Change table size with the size controls</li>
        <li>Edit existing cells by clicking on them</li>
        <li>Notice the row styling - Alice (green), Carol (yellow), and Eva (blue) have custom row styles</li>
      </ul>
      
      <ReactGridTable
        columns={columns}
        data={data}
        handleRowAdd={handleRowAdd}
        initialTableSize="medium"
        customFilters={customFilters}
        onCellsChanged={handleCellsChanged}
        enableRangeSelection
        enableRowSelection
        rowStyle={rowStyle}
      />
      
      <div style={{ marginTop: '40px' }}>
        <h2>Example with Disabled Search</h2>
        <p>This table has search disabled (nonSearchable=true). Notice the "Add Row" button in the toolbar:</p>
        
        <ReactGridTable
          columns={columns}
          data={data.slice(0, 5)} // Show only first 5 rows
          handleRowAdd={handleRowAdd}
          initialTableSize="small"
          customFilters={customFilters}
          onCellsChanged={handleCellsChanged}
          enableRangeSelection
          enableRowSelection
          nonSearchable={true}
          rowStyle={rowStyle}
        />
      </div>
      
      <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <h3>Current Data:</h3>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ReactGridTableExample;

