import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Select from 'react-select';
import allData from '../data/all_data.json';
import neetData from '../data/neet_data.json';
import '../styles/CollegeSearch.css';
import Navigation from '../components/common/navigation/navigation';
import Layout from '../components/common/layout/layout';
import neetRajData from '../data/neet_raj_state.json';
import IITSearch from './iitSerach';

// Debounce helper function
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const CollegeSearch = () => {
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedQuota, setSelectedQuota] = useState('all'); // 'all' or 'state'
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Initialize all filter states
  const [filters, setFilters] = useState({
    // Common filters
    searchQuery: '',
    category: 'all',
    year: '2024',
    
    // NEET specific filters
    states: [],
    collegeTypes: [],
    bond: 'all',
    
    // IIT JEE specific filters
    counsellingType: 'JOSAA',
    round: 'all',
    instituteTypes: [],
    gender: 'all',
    seatType: 'all'
  });

  const [inputValues, setInputValues] = useState({
    searchQuery: '',
    rankRange: {
      min: '',
      max: ''
    }
  });

  // Add showMainContent state back
  const [showMainContent, setShowMainContent] = useState(false);

  // Debounce the search query and rank range
  const debouncedSearchQuery = useDebounce(inputValues.searchQuery, 300);
  const debouncedRankMin = useDebounce(inputValues.rankRange.min, 300);
  const debouncedRankMax = useDebounce(inputValues.rankRange.max, 300);

  // Update filters with debounced values
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      searchQuery: debouncedSearchQuery,
      rankRange: {
        min: debouncedRankMin,
        max: debouncedRankMax
      }
    }));
  }, [debouncedSearchQuery, debouncedRankMin, debouncedRankMax]);

  const [filteredData, setFilteredData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  // Initialize loading state
  useEffect(() => {
    setIsLoading(true);
    // Simulate network delay for initial data load
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // Memoize the initial data processing


  // Add state options for react-select
  const STATE_OPTIONS = [
    'Andaman',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chandigarh',
    'Chhattisgarh',
    'Dadra and Nagar Haveli',
    'Delhi',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jammu & Kashmir',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Puducherry',
    'Punjab',
    'Rajasthan',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal'
  ].sort().map(state => ({ value: state, label: state }));

  // Add college type options for react-select
  const COLLEGE_TYPE_OPTIONS = [
    { value: 'Govt.', label: 'Govt.' },
    { value: 'AIIMS', label: 'AIIMS' },
    { value: 'JIPMER', label: 'JIPMER' }
  ];

  // Add counseling type options for IIT JEE
  const IIT_COUNSELLING_OPTIONS = [
    { value: 'JOSAA', label: 'JOSAA' },
    { value: 'CSAB', label: 'CSAB' }
  ];

  // Update select styles to be consistent
  const selectStyles = {
    control: (base) => ({
      ...base,
      borderColor: '#e2e8f0',
      borderRadius: '4px',
      minHeight: '42px',
      backgroundColor: 'white',
      '&:hover': {
        borderColor: '#cbd5e1'
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#076B37' : state.isFocused ? '#f1f5f9' : 'white',
      color: state.isSelected ? 'white' : '#1e293b',
      '&:active': {
        backgroundColor: '#076B37'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#e2e8f0'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#1e293b'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#64748b',
      '&:hover': {
        backgroundColor: '#cbd5e1',
        color: '#1e293b'
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: '#94a3b8'
    }),
    input: (base) => ({
      ...base,
      color: '#1e293b'
    })
  };

  // Modify filterData to include state filtering
  const filterData = useCallback(() => {
    setIsFiltering(true);
    let results =  neetData;

    if (selectedExam === 'NEET') {
      // Add state filtering
      if (filters.states.length > 0) {
        results = results.filter(item => {
          const itemState = item.State;
          return filters.states.some(state => {
            // Handle state name variations
            if (state === 'Delhi') return itemState.includes('Delhi');
            if (state === 'Odisha') return itemState.includes('Odisha') || itemState.includes('Orissa');
            if (state === 'Jammu & Kashmir') return itemState.includes('Jammu');
            if (state === 'Andhra Pradesh') return itemState.includes('Andhra P.');
            if (state === 'Himachal Pradesh') return itemState.includes('Himachal P.');
            if (state === 'Madhya Pradesh') return itemState.includes('Madhya P.');
            if (state === 'Uttar Pradesh') return itemState.includes('U. P.');
            return itemState.includes(state);
          });
        });
      }

      // Filter by category
      if (filters.category !== 'all') {
        results = results.filter(item => item.Category === filters.category);
      }

      // Filter by bond
      if (filters.bond !== 'all') {
        const hasBond = filters.bond === 'yes';
        results = results.filter(item => {
          const bondInfo = item['UG Bond'] || '';
          return hasBond ? bondInfo.toLowerCase().includes('yes') : bondInfo.toLowerCase().includes('no');
        });
      }

      // Filter by college type
      if (filters.collegeTypes.length > 0) {
        results = results.filter(item => filters.collegeTypes.includes(item.TYPE));
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
      results = results.filter(item => 
          item['Name of the Medical College'].toLowerCase().includes(query) ||
          item.Location.toLowerCase().includes(query)
        );
      }
    }

    setFilteredData(results);
    setIsFiltering(false);
  }, [filters, selectedExam]);

  // Effect to run filtering when filters change
  useEffect(() => {
    const filterTimer = setTimeout(() => {
      filterData();
    }, 100); // Small delay to prevent too frequent updates

    return () => clearTimeout(filterTimer);
  }, [filterData]);

  // Handle input changes without immediate filtering
  const handleInputChange = (field, value) => {
    setIsFiltering(true);
    setInputValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle direct filter changes (dropdowns)
  const handleFilterChange = (field, value) => {
    setIsFiltering(true);
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calculate pagination values
  useEffect(() => {
    setTotalPages(Math.ceil(filteredData.length / pageSize));
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [filteredData, pageSize]);

  // Add sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    // For state quota, the sorting is handled in filterStateQuotaData
    if (selectedExam === 'NEET' && selectedQuota === 'state') {
      return;
    }

    // For all other cases, sort the filtered data directly
    const sortedData = [...filteredData].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      // Handle special cases like "--" or empty values
      if (aValue === "--" || aValue === "" || aValue === undefined) aValue = direction === 'asc' ? Infinity : -Infinity;
      if (bValue === "--" || bValue === "" || bValue === undefined) bValue = direction === 'asc' ? Infinity : -Infinity;

      // Convert to numbers if they're numeric strings
      if (typeof aValue === 'string' && !isNaN(aValue)) aValue = parseInt(aValue);
      if (typeof bValue === 'string' && !isNaN(bValue)) bValue = parseInt(bValue);

      // If both values are strings (like college names), use string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Numeric comparison
      return direction === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    });

    setFilteredData(sortedData);
  };

  // Modify getCurrentPageData to include sorting
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    let sortedData = [...filteredData];
    if (sortConfig.key) {
      sortedData.sort((a, b) => {
        const aValue = parseInt(a[sortConfig.key]) || 0;
        const bValue = parseInt(b[sortConfig.key]) || 0;
        
        if (sortConfig.direction === 'asc') {
          return aValue - bValue;
        }
        return bValue - aValue;
      });
    }
    
    return sortedData.slice(startIndex, endIndex);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (event) => {
    const newPageSize = parseInt(event.target.value);
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  // Add CSV export function
  const exportToCSV = useCallback(() => {
    // Define CSV headers
    const headers = [
      'Counselling',
      'Type',
      'Institute',
      'Academic Program & Placement Stats',
      'Opening Rank',
      'Closing Rank',
      'Seat Type',
      'Gender',
      'Quota'
    ].join(',');

    // Convert data to CSV rows
    const csvRows = filteredData.map(item => [
      `"${item.TYPE_Counselling}"`,
      `"${item.TYPE}"`,
      `"${item.Institute}"`,
      `"${item['Academic Program & Stats']}"`,
      item['Opening Rank'],
      item['Closing Rank'],
      item['Seat Type'],
      item.Gender,
      item.Quota
    ].join(','));

    // Combine headers and rows
    const csvContent = `${headers}\n${csvRows.join('\n')}`;
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'college_search_results.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredData]);

  // Add helper function to check if columns should be visible
  const shouldShowColumn = {
    seat: filters.seatType === 'all',
    gender: filters.gender === 'all'
  };

  // Modify helper function to handle newlines for both NEET and IIT data
  const formatProgramName = (name) => {
    if (!name) return ''; // Handle undefined/null case
    
    if (selectedExam === 'NEET') {
      return name; // Return as is for NEET data
    }

    // IIT data formatting
    const lines = name.split('\n');
    return lines.map((line, i) => {
      if (i === 0) {
        return (
          <React.Fragment key={i}>
            {line}
            <br />
          </React.Fragment>
        );
      }

      // For placement stats lines
      const yearMatch = line.match(/(\d{4}[-–]\d{2}:)/);
      const beforeYear = yearMatch ? line.substring(0, yearMatch.index) : '';
      const restOfLine = yearMatch ? line.substring(yearMatch.index) : line;
      
      // Split into main sections
      const [yearSection, ...statSections] = restOfLine.split(',').map(part => part.trim());
      
      // Handle the year and placement section separately
      const [year, placementStats] = yearSection.split(/:(.*)/); // Split on first colon only
      
      return (
        <React.Fragment key={i}>
          <span style={{ fontSize: '11px' }}>
            {beforeYear}
            {year}: {/* Year */}
            <span style={{ color: '#ef4444' }}>{placementStats.trim()}</span>
            {statSections.map((stat, index) => {
              let element;
              if (stat.toLowerCase().includes('low')) {
                element = <span key={index} style={{ color: '#22c55e' }}>{stat}</span>;
              } else if (stat.toLowerCase().includes('high')) {
                element = <span key={index} style={{ color: '#3b82f6' }}>{stat}</span>;
              } else if (stat.toLowerCase().includes('median')) {
                element = <span key={index} style={{ color: '#eab308' }}>{stat}</span>;
              } else {
                element = <span key={index} style={{ color: '#ef4444' }}>{stat}</span>;
              }
              return [', ', element];
            })}
          </span>
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };



  // Update the exam selection handler to use string literals
  const handleExamSelect = (exam) => {
    setSelectedExam(exam);
    setFilters(prev => ({
      ...prev,
      searchQuery: '',
      category: 'all',
      year: '2024',
      // Reset exam-specific filters
      states: [],
      collegeTypes: [],
      bond: 'all',
      counsellingType: 'JOSAA',
      round: 'all',
      instituteTypes: [],
      gender: 'all',
      seatType: 'all'
    }));
    setCurrentPage(1);
    setExpandedRows(new Set());
  };

  // Add toggle function for row expansion
  const toggleRowExpansion = (index) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Add styles for the expand/collapse button
  const expandButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    color: '#076B37',
    fontSize: '0.8rem', // Smaller size for the triangle icons
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    width: '24px',
    height: '24px',
    lineHeight: 1,
  };

  // Add styles for the expanded content
  const expandedContentStyle = {
    backgroundColor: '#f8fafc',
    padding: '1rem',
    borderTop: '1px solid #e2e8f0',
    color: '#64748b',
    display: 'flex',
    gap: '2rem'
  };

  const infoListStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: '0.9rem',
    lineHeight: '1.8',
    flex: '0 0 40%'  // Fixed width for the left column
  };

  const infoItemStyle = {
    display: 'flex',
    gap: '0.5rem'
  };

  const infoLabelStyle = {
    fontWeight: '600',
    minWidth: '250px',
    color: '#1e293b',
    fontSize: '1rem',
    textAlign: 'left'
  };

  const infoValueStyle = {
    color: '#64748b',
    fontSize: '1rem',
    textAlign: 'left'
  };

  const pgCoursesContainerStyle = {
    flex: '1',
    borderLeft: '1px solid #e2e8f0',
    paddingLeft: '2rem'
  };

  const pgCoursesStyle = {
    color: '#475569',
    lineHeight: '1.6'
  };

  const formatPGCoursesList = (coursesList, item) => {
    if (!coursesList) return null;
    
    // Transform the numbered list into comma-separated format
    const formattedCourses = coursesList
      .split(/\d+\.\s*/)  // Split by numbers followed by dots
      .filter(Boolean)     // Remove empty strings
      .map(course => course.trim())
      .join(', ');
    
    return (
      <div style={pgCoursesStyle}>
        <div style={{ 
          fontWeight: '600', 
          marginBottom: '0.75rem',
          fontSize: '0.95rem',
          color: '#1e293b'
        }}>
          PG Courses Available ({item['No. of pg courses']} courses, {item['No. of pg seats']} seats)
        </div>
        <div style={{ 
          color: '#475569',
          lineHeight: '1.6',
          textAlign: 'left'
        }}>
          {formattedCourses}
        </div>
      </div>
    );
  };

  // Update the renderExpandedContent function
  const renderExpandedContent = (item) => {
    return (
      <div style={expandedContentStyle}>
        <ul style={infoListStyle}>
          <li style={infoItemStyle}>
            <span style={infoLabelStyle}>MBBS Seats:</span>
            <span style={infoValueStyle}>{item['Annual Intake (Seats)']}</span>
          </li>
          <li style={infoItemStyle}>
            <span style={infoLabelStyle}>PG Specialisations:</span>
            <span style={infoValueStyle}>{item['No. of pg courses'] ? 'Yes' : 'No'}</span>
          </li>
          <li style={infoItemStyle}>
            <span style={infoLabelStyle}>Hostel:</span>
            <span style={infoValueStyle}>Yes</span>
          </li>
          <li style={infoItemStyle}>
            <span style={infoLabelStyle}>Teaching Hospital:</span>
            <span style={infoValueStyle}>Yes</span>
          </li>
          <li style={infoItemStyle}>
            <span style={infoLabelStyle}>Transport:</span>
            <span style={infoValueStyle}>{item['Transport'] || '-'}</span>
          </li>
          <li style={infoItemStyle}>
            <span style={infoLabelStyle}>Est. Year:</span>
            <span style={infoValueStyle}>{item['Year of Inspection of College']}</span>
          </li>
          <li style={infoItemStyle}>
            <span style={infoLabelStyle}>University Name:</span>
            <span style={infoValueStyle}>{item['University  Name']}</span>
          </li>
          <li style={infoItemStyle}>
            <span style={infoLabelStyle}>Management of College:</span>
            <span style={infoValueStyle}>{item['Managemet of College']}</span>
          </li>
          <li style={infoItemStyle}>
            <span style={infoLabelStyle}>After MBBS Service Bond:</span>
            <span style={infoValueStyle}>{item['UG Bond']}</span>
          </li>
          <li style={infoItemStyle}>
            <span style={infoLabelStyle}>Penalty if Service Bond Broken:</span>
            <span style={infoValueStyle}>₹{item['penalty of service bond if broken']}</span>
          </li>
          <li style={infoItemStyle}>
            <span style={infoLabelStyle}>Discontinuation Bond Penalty:</span>
            <span style={infoValueStyle}>₹{item['mbbs discontinuation bond penalty']}</span>
          </li>
        </ul>
        {item['pg courses available list'] && (
          <div style={pgCoursesContainerStyle}>
            {formatPGCoursesList(item['pg courses available list'], item)}
          </div>
        )}
      </div>
    );
  };

  // Update the renderTableRow function
  const renderTableRow = (item, index) => {
    const isExpanded = expandedRows.has(index);
    
    return (
      <React.Fragment key={index}>
        <tr 
          className={isExpanded ? 'expanded-row' : ''} 
          onClick={() => toggleRowExpansion(index)}
          style={{ cursor: 'pointer' }}
        >
          <td style={{ width: '40px', textAlign: 'center' }}>
            <button
              style={expandButtonStyle}
              className="expand-button"
              title={isExpanded ? 'Collapse' : 'Expand'}
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click event when clicking the button
                toggleRowExpansion(index);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          </td>
          {selectedExam === 'NEET' ? (
            <>
              <td>{item.Location}</td>
              <td>{item['2023 College Rank']}</td>
              <td>{item['2022 College Rank']}</td>
              <td>{item['2021 College Rank']}</td>
              <td>{item['Name of the Medical College']}</td>
              <td>{item[`Round-1 (${filters.year})`]}</td>
              <td>{item[`Round-2 (${filters.year})`]}</td>
              <td>{item[`MoP_Up (${filters.year})`]}</td>
              <td>{item[`Stray (${filters.year})`]}</td>
              <td>{item[`Special Stray (${filters.year})`]}</td>
              <td>{item[`closing (${filters.year})`]}</td>
              <td>{item['UG Bond']}</td>
            </>
          ) : (
            <>
              <td>{item.TYPE_Counselling}</td>
              <td>{item.TYPE}</td>
              <td>{item.Institute}</td>
              <td>{formatProgramName(item['Academic Program & Stats'])}</td>
              <td>{item['Opening Rank']}</td>
              <td>{item['Closing Rank']}</td>
              {shouldShowColumn.seat && <td>{item['Seat Type']}</td>}
              {shouldShowColumn.gender && <td>{item.Gender}</td>}
              <td>{item.Quota}</td>
              {filters.counsellingType === 'CSAB' && <td>{item['Round On']}</td>}
            </>
          )}
        </tr>
        {isExpanded && (
          <tr>
            <td colSpan={selectedExam === 'NEET' ? 13 : 10}>
              {renderExpandedContent(item)}
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  // Modify the table headers to include the expand column
  const renderTableHeaders = () => {
    if (selectedExam === 'NEET') {
      return (
        <tr>
          <th style={{ width: '40px' }}></th>
          <th>Location</th>
          <th>2023 Rank</th>
          <th>2022 Rank</th>
          <th>2021 Rank</th>
          <th>College Name</th>
          <th>Round 1</th>
          <th>Round 2</th>
          <th>Mop Up</th>
          <th>Stray</th>
          <th>Special Stray</th>
          <th 
            onClick={() => handleSort(`closing (${filters.year})`)}
            style={{ cursor: 'pointer' }}
          >
            Closing Rank ↕
          </th>
          <th>Bond</th>
        </tr>
      );
    }

    return (
      <tr>
        {/* <th style={{ width: '40px' }}></th> */}
        <th>Counselling</th>
        <th>TYPE</th>
        <th>Institute</th>
        <th>Academic Program & Placement Stats</th>
        <th>Opening Rank</th>
        <th>Closing Rank</th>
        {shouldShowColumn.seat && <th>Seat</th>}
        {shouldShowColumn.gender && <th>Gender</th>}
        <th>Quota</th>
        {filters.counsellingType === 'CSAB' && <th>Round On</th>}
      </tr>
    );
  };

  // Add state filter component
  const renderStateFilter = () => {
    return (
      <div>
        <label className="filter-label">States</label>
        <Select
          isMulti
          options={STATE_OPTIONS}
          value={STATE_OPTIONS.filter(option => filters.states.includes(option.value))}
          onChange={(selectedOptions) => {
            const selectedStates = selectedOptions ? selectedOptions.map(option => option.value) : [];
            handleFilterChange('states', selectedStates);
          }}
          styles={selectStyles}
          placeholder="Select states..."
          className="basic-multi-select"
          classNamePrefix="select"
        />
      </div>
    );
  };

  // Function to get the AIR value based on round and year
  const getRoundValue = (item, round, year) => {
    const key = `${year} R${round} AIR`;
    return item[key] || '-';
  };

  // Function to render table headers for state quota
  const renderStateQuotaHeaders = () => {
    return (
      <tr>
        <th style={{ width: '40px' }}></th>
        <th onClick={() => handleSort('rajasthan college rank')}>College Rank</th>
        <th onClick={() => handleSort('College Name')}>College Name</th>
        <th onClick={() => handleSort('Category')}>Category</th>
        <th 
          onClick={() => handleSort(`${filters.year} R1 AIR`)}
          style={{ cursor: 'pointer' }}
        >
          Round 1 ↕
        </th>
        <th 
          onClick={() => handleSort(`${filters.year} R2 AIR`)}
          style={{ cursor: 'pointer' }}
        >
          Round 2 ↕
        </th>
        <th 
          onClick={() => handleSort(`${filters.year} R3 AIR`)}
          style={{ cursor: 'pointer' }}
        >
          Round 3 ↕
        </th>
      </tr>
    );
  };

  // Function to render table row for state quota
  const renderStateQuotaRow = (item, index) => {
    const isExpanded = expandedRows.has(index);
    
    return (
      <React.Fragment key={index}>
        <tr 
          className={isExpanded ? 'expanded-row' : ''} 
          onClick={() => toggleRowExpansion(index)}
          style={{ cursor: 'pointer' }}
        >
          <td style={{ width: '40px', textAlign: 'center' }}>
            <button
              style={expandButtonStyle}
              className="expand-button"
              title={isExpanded ? 'Collapse' : 'Expand'}
              onClick={(e) => {
                e.stopPropagation();
                toggleRowExpansion(index);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          </td>
          <td>{item['rajasthan college rank']}</td>
          <td>{item['College Name']}</td>
          <td>{item.Category}</td>
          <td>{getRoundValue(item, 1, filters.year)}</td>
          <td>{getRoundValue(item, 2, filters.year)}</td>
          <td>{getRoundValue(item, 3, filters.year)}</td>
        </tr>
        {isExpanded && (
          <tr>
            <td colSpan={7}>
              <div style={expandedContentStyle}>
                <ul style={infoListStyle}>
                  <li style={infoItemStyle}>
                    <span style={infoLabelStyle}>MBBS Seats:</span>
                    <span style={infoValueStyle}>{item['Annual Intake (Seats)']}</span>
                  </li>
                  <li style={infoItemStyle}>
                    <span style={infoLabelStyle}>PG Specialisations:</span>
                    <span style={infoValueStyle}>{item['no. of pg courses'] ? 'Yes' : 'No'}</span>
                  </li>
                  <li style={infoItemStyle}>
                    <span style={infoLabelStyle}>Hostel:</span>
                    <span style={infoValueStyle}>Yes</span>
                  </li>
                  <li style={infoItemStyle}>
                    <span style={infoLabelStyle}>Teaching Hospital:</span>
                    <span style={infoValueStyle}>Yes</span>
                  </li>
                  <li style={infoItemStyle}>
                    <span style={infoLabelStyle}>Transport:</span>
                    <span style={infoValueStyle}>{item['Transport'] || '-'}</span>
                  </li>
                  <li style={infoItemStyle}>
                    <span style={infoLabelStyle}>Est. Year:</span>
                    <span style={infoValueStyle}>{item['Year of Inspection of College']}</span>
                  </li>
                  <li style={infoItemStyle}>
                    <span style={infoLabelStyle}>University Name:</span>
                    <span style={infoValueStyle}>{item['University  Name']}</span>
                  </li>
                  <li style={infoItemStyle}>
                    <span style={infoLabelStyle}>Management of College:</span>
                    <span style={infoValueStyle}>{item['Managemet of College']}</span>
                  </li>
                  <li style={infoItemStyle}>
                    <span style={infoLabelStyle}>After MBBS Service Bond:</span>
                    <span style={infoValueStyle}>{item['after mbbs service bond']}</span>
                  </li>
                  <li style={infoItemStyle}>
                    <span style={infoLabelStyle}>Penalty if Service Bond Broken:</span>
                    <span style={infoValueStyle}>₹{item['penalty of service bond if broken']}</span>
                  </li>
                  <li style={infoItemStyle}>
                    <span style={infoLabelStyle}>Discontinuation Bond Penalty:</span>
                    <span style={infoValueStyle}>₹{item['mbbs discontinuation bond penalty']}</span>
                  </li>
                </ul>
                {item['pg courses available list'] && (
                  <div style={pgCoursesContainerStyle}>
                    {formatPGCoursesList(item['pg courses available list'], item)}
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  // Function to render filters for state quota
  const renderStateQuotaFilters = () => {
    return (
      <div className="filters-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px',
        padding: '20px'
      }}>
        {/* College Search Input */}
        <div style={{ gridColumn: 'span 3' }}>
          <label className="filter-label">Search Colleges</label>
          <input
            type="text"
            placeholder="Type to search colleges..."
            className="search-input"
            value={inputValues.searchQuery}
            onChange={(e) => handleInputChange('searchQuery', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              minHeight: '42px',
              backgroundColor: 'white'
            }}
          />
        </div>

        {/* Year Filter */}
        <div>
          <label className="filter-label">Year</label>
          <select
            className="filter-select"
            value={filters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              minHeight: '42px',
              backgroundColor: 'white'
            }}
          >
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="filter-label">Category</label>
          <select
            className="filter-select"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              minHeight: '42px',
              backgroundColor: 'white'
            }}
          >
            <option value="all">All Categories</option>
            <option value="GEN">GEN</option>
            <option value="OBC">OBC</option>
            <option value="EWS">EWS</option>
            <option value="MBC">MBC</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
            <option value="STA">STA</option>
          </select>
        </div>

        {/* Gender Filter */}
        <div>
          <label className="filter-label">Gender</label>
          <select
            className="filter-select"
            value={filters.gender}
            onChange={(e) => handleFilterChange('gender', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              minHeight: '42px',
              backgroundColor: 'white'
            }}
          >
            <option value="all">All</option>
            <option value="Boys">Boys</option>
            <option value="Girls">Girls</option>
          </select>
        </div>
      </div>
    );
  };

  // Update filterStateQuotaData to include search functionality
  const filterStateQuotaData = useCallback(() => {
    let results = neetRajData.filter(item => {
      // Apply category and gender filters
      if (filters.category !== 'all' && item.Category !== filters.category) return false;
      if (filters.gender !== 'all' && item.Gender !== filters.gender) return false;
      
      // Apply search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const collegeName = (item['College Name'] || '').toLowerCase();
        if (!collegeName.includes(query)) return false;
      }
      
      return true;
    });

    // Apply sorting if configured
    if (sortConfig.key) {
      results.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle special cases like "--" or empty values
        if (aValue === "--" || aValue === "" || aValue === undefined) aValue = sortConfig.direction === 'asc' ? Infinity : -Infinity;
        if (bValue === "--" || bValue === "" || bValue === undefined) bValue = sortConfig.direction === 'asc' ? Infinity : -Infinity;

        // Convert to numbers if they're numeric strings
        if (typeof aValue === 'string' && !isNaN(aValue)) aValue = parseInt(aValue);
        if (typeof bValue === 'string' && !isNaN(bValue)) bValue = parseInt(bValue);

        // If both values are strings (like college names), use string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        // Numeric comparison
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      });
    }

    return results;
  }, [filters, sortConfig, neetRajData]);

  // Add quota selection buttons for NEET
  const renderQuotaSelection = () => {
    if (selectedExam !== 'NEET') return null;
    
    return (
      <div className="quota-selector" style={{ marginTop: '20px', marginBottom: '20px' }}>
        <button
          className={`quota-button ${selectedQuota === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedQuota('all')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: selectedQuota === 'all' ? '#076B37' : 'white',
            color: selectedQuota === 'all' ? 'white' : '#1e293b',
            cursor: 'pointer'
          }}
        >
          All India Quota
        </button>
        <button
          className={`quota-button ${selectedQuota === 'state' ? 'active' : ''}`}
          onClick={() => setSelectedQuota('state')}
          style={{
            padding: '10px 20px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: selectedQuota === 'state' ? '#076B37' : 'white',
            color: selectedQuota === 'state' ? 'white' : '#1e293b',
            cursor: 'pointer'
          }}
        >
          State Quota
        </button>
      </div>
    );
  };

  // Update the print function to handle both AIQ and state quota data
  const handlePrint = useCallback(() => {
    let dataToExport;
    let filename;
    
    if (selectedExam === 'NEET' && selectedQuota === 'state') {
      // Handle state quota data
      const filteredData = filterStateQuotaData();
      
      // Transform data for state quota
      dataToExport = filteredData.map(item => ({
        'Rajasthan College Rank': item['rajasthan college rank'] || '-',
        'College Name': item['College Name'] || '-',
        'Category': item['Category'] || '-',
        'Round 1 AIR': getRoundValue(item, 1, filters.year) || '-',
        'Round 2 AIR': getRoundValue(item, 2, filters.year) || '-',
        'Round 3 AIR': getRoundValue(item, 3, filters.year) || '-',
        'Gender': item['Gender'] || '-'
      }));

      filename = `NEET_State_Quota_${filters.year}_${filters.category}_${filters.gender}.csv`;
    } else {
      // Handle AIQ data - use filteredData instead of getCurrentPageData
      dataToExport = filteredData.map(item => ({
        'College Name': item['Name of the Medical College'] || '-',
        'Location': item['Location'] || '-',
        'Category': item['Category'] || '-',
        'College Rank 2023': item['2023 College Rank'] || '-',
        'College Rank 2022': item['2022 College Rank'] || '-',
        'College Rank 2021': item['2021 College Rank'] || '-',
        'Round 1': item[`Round-1 (${filters.year})`] || '-',
        'Round 2': item[`Round-2 (${filters.year})`] || '-',
        'Mop Up': item[`MoP_Up (${filters.year})`] || '-',
        'Stray': item[`Stray (${filters.year})`] || '-',
        'Special Stray': item[`Special Stray (${filters.year})`] || '-',
        'Closing Rank': item[`closing (${filters.year})`] || '-',
        'Bond': item['UG Bond'] || '-',
        'MBBS Seats': item['MBBS Seats'] || '-',
        'PG': item['PG'] || '-',
        'Hostel': item['Boys & Girls Hostel'] || '-',
        'Teaching Hospital': item['Teaching Hospital'] || '-',
        'Transport': item['Transport'] || '-'
      }));

      filename = `NEET_AIQ_${filters.year}_${filters.category}_${new Date().toISOString().split('T')[0]}.csv`;
    }

    if (dataToExport.length === 0) {
      alert('No data to export. Please adjust your filters.');
      return;
    }

    // Convert to CSV
    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(','), // Headers
      ...dataToExport.map(row => 
        headers.map(header => {
          let cell = row[header] || '';
          // Escape commas and quotes in the cell content
          if (cell.toString().includes(',') || cell.toString().includes('"')) {
            cell = `"${cell.toString().replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      ) // Data rows
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [selectedExam, selectedQuota, filters, filteredData, filterStateQuotaData]);

  // Add print button to the UI
  const renderPrintButton = () => {
    return (
      <button
        onClick={handlePrint}
        style={{
          padding: '8px 16px',
          backgroundColor: '#076B37',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 12h8v2H4v-2zM4 6h8v2H4V6zm0-4h8v2H4V2z" fill="currentColor"/>
        </svg>
        Download Results
      </button>
    );
  };

  if (!selectedExam) {
    return (
      <Layout>
        <Navigation/>
        <div className="college-search-container" style={{ 
          minHeight: 'calc(100vh - 200px)',
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem',
          background: '#f8fafc'
        }}>
          <div style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            width: '100%',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              color: '#1e293b',
              marginBottom: '1rem',
              fontWeight: '600'
            }}>Select Exam Type</h1>
            
            <p style={{
              fontSize: '1.1rem',
              color: '#64748b',
              marginBottom: '2rem',
              lineHeight: '1.5'
            }}>
              Choose the exam type to view relevant college and counselling information
            </p>

            <div style={{ 
              display: 'flex', 
              gap: '1.5rem',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <button 
                onClick={() => handleExamSelect('IIT')}
                style={{
                  padding: '1.25rem 2.5rem',
                  fontSize: '1.25rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#076B37',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '200px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(7, 107, 55, 0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(7, 107, 55, 0.25)';
                  e.currentTarget.style.backgroundColor = '#0A864A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(7, 107, 55, 0.2)';
                  e.currentTarget.style.backgroundColor = '#076B37';
                }}
              >
                <span style={{ position: 'relative', zIndex: 1 }}>IIT-JEE</span>
              </button>
              <button 
                onClick={() => handleExamSelect('NEET')}
                style={{
                  padding: '1.25rem 2.5rem',
                  fontSize: '1.25rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#076B37',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '200px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(7, 107, 55, 0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(7, 107, 55, 0.25)';
                  e.currentTarget.style.backgroundColor = '#0A864A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(7, 107, 55, 0.2)';
                  e.currentTarget.style.backgroundColor = '#076B37';
                }}
              >
                <span style={{ position: 'relative', zIndex: 1 }}>NEET</span>
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      {selectedExam && selectedExam === 'IIT' ? (
        <IITSearch />
      ) : (
        <Layout>
          <Navigation />
          <div className="college-search-container">
            <div className="exam-selector">
              <button
                className={`exam-button ${selectedExam === 'NEET' ? 'active' : ''}`}
                onClick={() => handleExamSelect('NEET')}
              >
                NEET
              </button>
              <button
                className={`exam-button ${selectedExam === 'IIT' ? 'active' : ''}`}
                onClick={() => handleExamSelect('IIT')}
              >
                IIT JEE
              </button>
            </div>

            {renderQuotaSelection()}

            <div className="search-card">
              <h2 className="card-title">Search & Filters</h2>
              {selectedExam === 'NEET' && selectedQuota === 'state' ? (
                renderStateQuotaFilters()
              ) : (
                <div className="filters-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '24px',
                  padding: '20px'
                }}>
                {/* Search Input */}
                  <div style={{ gridColumn: '1' }}>
                    <label className="filter-label">Search Colleges/Location</label>
                  <input
                    type="text"
                      placeholder="Type to search colleges or location..."
                    className="search-input"
                    value={inputValues.searchQuery}
                    onChange={(e) => handleInputChange('searchQuery', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                        minHeight: '42px'
                      }}
                  />
                </div>

                {/* State Filter */}
                <div style={{ gridColumn: '2' }}>
                  <label className="filter-label">States</label>
                  <Select
                    isMulti
                    options={STATE_OPTIONS}
                    value={STATE_OPTIONS.filter(option => filters.states.includes(option.value))}
                    onChange={(selectedOptions) => {
                      const selectedStates = selectedOptions ? selectedOptions.map(option => option.value) : [];
                      handleFilterChange('states', selectedStates);
                    }}
                    styles={selectStyles}
                    placeholder="Select states..."
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                </div>

                {/* Category Filter */}
                <div style={{ gridColumn: '3' }}>
                  <label className="filter-label">Category</label>
                  <select
                    className="filter-select"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      minHeight: '42px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="all">All Categories</option>
                    <option value="GEN">General</option>
                    <option value="EWS">EWS</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
              </div>

                {/* Bond Filter */}
                <div style={{ gridColumn: '1' }}>
                  <label className="filter-label">Bond</label>
                <select
                  className="filter-select"
                    value={filters.bond}
                    onChange={(e) => handleFilterChange('bond', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      minHeight: '42px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="all">All</option>
                    <option value="yes">With Bond</option>
                    <option value="no">No Bond</option>
                </select>
              </div>

                {/* Year Filter */}
                <div style={{ gridColumn: '2' }}>
                  <label className="filter-label">Year</label>
                <select
                  className="filter-select"
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      minHeight: '42px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                </select>
              </div>

              {/* College Type Filter */}
                <div style={{ gridColumn: '3' }}>
                <label className="filter-label">College Type</label>
                  <Select
                    isMulti
                    options={COLLEGE_TYPE_OPTIONS}
                    value={COLLEGE_TYPE_OPTIONS.filter(option => filters.collegeTypes.includes(option.value))}
                    onChange={(selectedOptions) => {
                      const selectedTypes = selectedOptions ? selectedOptions.map(option => option.value) : [];
                      handleFilterChange('collegeTypes', selectedTypes);
                    }}
                    styles={selectStyles}
                    placeholder="Select college types..."
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                </div>
              </div>
            )}
            </div>

            {/* Add print button before the results table */}
            {/* <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 20px' }}>
              {renderPrintButton()}
            </div> */}

            {/* Results Section */}
            <div className="table-container">
              {/* Disclaimer */}
              <div className="disclaimer-container" style={{ borderBottom: '1px solid #e2e8f0', borderTop: 'none', marginTop: 0 }}>
                <p className="disclaimer-text">
                  Disclaimer: This data has been sourced from various institutions and public records. Concept does not guarantee the accuracy of this information and bears no responsibility for any decisions made based on this data.
                </p>
              </div>

              {/* Results Header */}
              <div className="pagination-container" style={{ borderTop: 'none' }}>
                <div className="page-info">
                  Total Results: {isLoading ? '...' : filteredData.length}
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {/* <button
                    onClick={exportToCSV}
                    className="print-button"
                    disabled={isLoading || isFiltering || filteredData.length === 0}
                  >
                    <span className="print-icon">🖨️</span> Print Results
                  </button> */}
                  <div className="rows-per-page">
                    <label htmlFor="pageSize" className="filter-label" style={{ margin: 0 }}>Rows per page:</label>
                    <select
                      id="pageSize"
                      className="rows-select"
                      value={pageSize}
                      onChange={handlePageSizeChange}
                      disabled={isLoading || isFiltering}
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table with Loading State */}
              <div className="table-wrapper">
                {/* Loading Overlay */}
                {(isLoading || isFiltering) && (
                  <div className="loading-overlay">
                    <div className="loading-content">
                      <div className="spinner"></div>
                      <div className="loading-text">
                        {isLoading ? 'Loading data...' : 'Updating results...'}
                      </div>
                    </div>
                  </div>
                )}
                
                <table className="results-table">
                  <thead>
                    {selectedExam === 'NEET' && selectedQuota === 'state' ? (
                      renderStateQuotaHeaders()
                    ) : (
                      renderTableHeaders()
                    )}
                  </thead>
                  <tbody>
                    {!isLoading && !isFiltering && getCurrentPageData().length === 0 ? (
                      <tr>
                        <td colSpan={selectedExam === 'NEET' ? 13 : 10} style={{ textAlign: 'center', padding: '2rem' }}>
                          No results found
                        </td>
                      </tr>
                    ) : (
                      selectedExam === 'NEET' && selectedQuota === 'state' ? (
                        filterStateQuotaData().map((item, index) => renderStateQuotaRow(item, index))
                      ) : (
                        getCurrentPageData().map((item, index) => renderTableRow(item, index))
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="pagination-container">
                <div className="page-info">
                  {isLoading || isFiltering ? (
                    'Loading...'
                  ) : (
                    `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, filteredData.length)} of ${filteredData.length} results`
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || isLoading || isFiltering}
                    className="pagination-button"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading || isFiltering}
                    className="pagination-button"
                  >
                    Previous
                  </button>
                  <span className="pagination-button" style={{ cursor: 'default' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading || isFiltering}
                    className="pagination-button"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || isLoading || isFiltering}
                    className="pagination-button"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      )}
    </>
  );
};

export default CollegeSearch; 