import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import neetData from '../data/neet_data.json';
import '../styles/CollegeSearch.css';
import Navigation from '../components/common/navigation/navigation';
import Layout from '../components/common/layout/layout';
import neetRajData from '../data/neet_raj_state.json';
import IITSearch from './iitSerach';
import neetBdsData from '../data/neet_bds_data.json';

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
  const [selectedQuota, setSelectedQuota] = useState('all'); // 'all', 'state', or 'bds'
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

  // Move filterStateQuotaData before its usage
  // Update filterStateQuotaData to include search functionality
  const filterStateQuotaData = useCallback(() => {
    let results = neetRajData.filter(item => {
      // Apply category and gender filters
      if (filters.category !== 'all' && item.Category !== filters.category) return false;
      if (filters.gender !== 'all' && item.Gender !== filters.gender) return false;
      
      // Apply search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase().trim();
        const collegeName = (item['College Name'] || '').toLowerCase();
        const words = query.split(/\s+/); // Split search query into words
        
        // Check if all words in the query are present in the college name
        return words.every(word => collegeName.includes(word));
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

  // Initialize loading state
  useEffect(() => {
    setIsLoading(true);
    // Simulate network delay for initial data load
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // Calculate pagination values
  useEffect(() => {
    const totalItems = selectedExam === 'NEET' && selectedQuota === 'state' 
      ? filterStateQuotaData().length 
      : filteredData.length;
    setTotalPages(Math.ceil(totalItems / pageSize));
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [filteredData, pageSize, selectedExam, selectedQuota, filterStateQuotaData]);

  // Update getCurrentPageData to handle both AIQ and state quota data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    let dataToDisplay = selectedExam === 'NEET' && selectedQuota === 'state' 
      ? filterStateQuotaData()
      : filteredData;

    if (sortConfig.key) {
      dataToDisplay = [...dataToDisplay].sort((a, b) => {
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
    
    return dataToDisplay.slice(startIndex, endIndex);
  };

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
    let results = selectedQuota === 'bds' ? neetBdsData : neetData;

    if (selectedExam === 'NEET') {
      // Add state filtering
      if (filters.states.length > 0) {
        results = results.filter(item => {
          const [city, state] = (item['City, State'] || '').split(',').map(s => s.trim());
          return filters.states.some(filterState => {
            // Handle state name variations
            if (filterState === 'Delhi') return state.includes('Delhi');
            if (filterState === 'Odisha') return state.includes('Odisha') || state.includes('Orissa');
            if (filterState === 'Jammu & Kashmir') return state.includes('Jammu');
            if (filterState === 'Andhra Pradesh') return state.includes('Andhra');
            if (filterState === 'Himachal Pradesh') return state.includes('Himachal');
            if (filterState === 'Madhya Pradesh') return state.includes('Madhya');
            if (filterState === 'Uttar Pradesh') return state.includes('Uttar');
            return state.includes(filterState);
          });
        });
      }

      // Filter by category
      if (filters.category !== 'all') {
        results = results.filter(item => item.Category === filters.category);
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        results = results.filter(item => 
          item['College Name'].toLowerCase().includes(query) ||
          item['City, State'].toLowerCase().includes(query)
        );
      }

      // Only apply these filters for MBBS (not BDS)
      if (selectedQuota !== 'bds') {
        // Filter by bond
        if (filters.bond !== 'all') {
          const hasBond = filters.bond === 'yes';
          results = results.filter(item => {
            const bondInfo = (item['After MBBS Service Bond'] || '').toLowerCase();
            if (hasBond) {
              if (bondInfo.includes('no ') || bondInfo.includes('not ') || /^no$/i.test(bondInfo)) {
                return false;
              }
              return bondInfo.includes('yes') || 
                     (bondInfo.includes('bond') && !bondInfo.includes('no bond')) || 
                     /\d+\s*(?:year|yr)/.test(bondInfo) ||
                     bondInfo.includes('compulsory') ||
                     bondInfo.includes('mandatory');
            } else {
              return bondInfo.includes('no') || bondInfo === '' || bondInfo.includes('not');
            }
          });
        }

        // Filter by college type
        if (filters.collegeTypes.length > 0) {
          results = results.filter(item => filters.collegeTypes.includes(item.TYPE));
        }
      }
    }

    setFilteredData(results);
    setIsFiltering(false);
  }, [filters, selectedExam, selectedQuota]);

  // Effect to run filtering when filters change
  useEffect(() => {
    const filterTimer = setTimeout(() => {
      filterData();
    }, 100); // Small delay to prevent too frequent updates

    return () => clearTimeout(filterTimer);
  }, [filterData]);

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
    listStyle: 'disc',
    paddingLeft: '1.5rem',
    margin: 0,
    lineHeight: '1.7',
    fontSize: '14px',
    textAlign: 'left',
    // flex: '0 0 40%'  // Fixed width for the left column
  };

  const infoItemStyle = {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'baseline'
  };

  const infoLabelStyle = {
    display: 'inline',
    fontWeight: '700',
    color: '#000',
    fontSize: '14px',
    fontFamily: 'Lexend Semibold'
  };

  const infoValueStyle = {
    display: 'inline',
    color: '#000',
    fontSize: '14px',
    fontWeight: '400'
  };

  const infoHeaderStyle = {
    fontWeight: '700',
    fontSize: '1.1rem',
    color: '#000',
    textDecoration: 'underline',
    textAlign: 'center',
    marginBottom: '1.5rem',
    fontFamily: 'Lexend Semibold'
  };

  const pgCoursesContainerStyle = {
    flex: '1',
    borderLeft: '1px solid #e2e8f0',
    paddingLeft: '2rem'
  };

  const pgCoursesStyle = {
    color: '#475569',
    // lineHeight: '1.6'
  };

  const formatPGCoursesList = (coursesList, item) => {
    if (!coursesList) return null;
    
    // Split the courses into an array and clean up
    const courses = coursesList
      .split(/\d+\.\s*/)  // Split by numbers followed by dots
      .filter(Boolean)     // Remove empty strings
      .map(course => course.trim());
    
    return (
      <div style={pgCoursesStyle}>
        <div style={{ 
          fontWeight: '700',
          marginBottom: '1.5rem',
          fontSize: '1.1rem',
          color: '#000',
          textDecoration: 'underline',
          textAlign: 'center',
          fontFamily: 'Lexend Semibold'
        }}>
          PG specializations ({item['no. of pg courses']} courses, {item['no. of pg seats']} seats)
        </div>
        <div style={{ 
          color: '#000',
          lineHeight: '1.8',
          textAlign: 'left',
          columnCount: courses.length > 6 ? 2 : 1,
          columnGap: '2rem'
        }}>
          {courses.map((course, index) => (
            <div key={index} style={{
              breakInside: 'avoid-column',
              display: 'flex',
              gap: '0.5rem'
            }}>
              <span style={{ minWidth: '25px' }}>{index + 1}.</span>
              <span>{course}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Update the renderExpandedContent function
  const renderExpandedContent = (item) => {
    return (
      <div style={expandedContentStyle}>
        <div>
          <div style={infoHeaderStyle}>Important Information</div>
          <ul style={infoListStyle}>
            <li>
              <div>
                <span style={infoLabelStyle}>MBBS Seats</span>
                <span style={infoLabelStyle}> : </span>
                <span style={infoValueStyle}>{item['Annual Intake (MBBS Seats)']}</span>
              </div>
            </li>
            <li>
              <div>
                <span style={infoLabelStyle}>Connectivity</span>
                <span style={infoLabelStyle}> : </span>
                <span style={infoValueStyle}>{item['Connectivity'] || '-'}</span>
              </div>
            </li>
            <li>
              <div>
                <span style={infoLabelStyle}>University Name</span>
                <span style={infoLabelStyle}> : </span>
                <span style={infoValueStyle}>{item['University Name']}</span>
              </div>
            </li>
            <li>
              <div>
                <span style={infoLabelStyle}>Management of College</span>
                <span style={infoLabelStyle}> : </span>
                <span style={infoValueStyle}>{item['Managemet of College']?.toLowerCase()}</span>
              </div>
            </li>
            <li>
              <div>
                <span style={infoLabelStyle}>After MBBS Service Bond</span>
                <span style={infoLabelStyle}> : </span>
                <span style={infoValueStyle}>{item['After MBBS Service Bond']}</span>
              </div>
            </li>
            <li>
              <div>
                <span style={infoLabelStyle}>Penalty if Service Bond Broken</span>
                <span style={infoLabelStyle}> : </span>
                <span style={infoValueStyle}>{item['Penalty if Service Bond Broken']}</span>
              </div>
            </li>
            <li>
              <div>
                <span style={infoLabelStyle}>Discontinuation Bond Penalty</span>
                <span style={infoLabelStyle}> : </span>
                <span style={infoValueStyle}>{item['MBBS Discontinuation Bond Penalty']}</span>
              </div>
            </li>
            <li>
              <div>
                <span style={infoLabelStyle}>Established Year</span>
                <span style={infoLabelStyle}> : </span>
                <span style={infoValueStyle}>{item['Est. Year']}</span>
              </div>
            </li>
            {item['Disclaimer'] && (
              <li>
                <div>
                  <span style={infoLabelStyle}>Disclaimer</span>
                  <span style={infoLabelStyle}> : </span>
                  <span style={infoValueStyle}>{item['Disclaimer']}</span>
                </div>
              </li>
            )}
          </ul>
        </div>
        {item['PG Specializations'] && (
          <div style={pgCoursesContainerStyle}>
            {formatPGCoursesList(item['PG Specializations'], item)}
          </div>
        )}
      </div>
    );
  };

  // Add helper function to format table cell text with newlines
  const formatCellText = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Update renderTableRow function to use formatCellText
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
                e.stopPropagation();
                toggleRowExpansion(index);
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          </td>
          {selectedExam === 'NEET' ? (
            selectedQuota === 'bds' ? (
              <>
                <td>{item['College Name']}</td>
                <td>{item['City, State']}</td>
                <td>{item['BDS College Ranking']}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{formatCellText(item['Round-1\nR1\n(2024)'])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{formatCellText(item['Round-2\nR2\n(2024)'])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{formatCellText(item['Round-3\nR3\n(2024)'])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{formatCellText(item['Closing\nMax(R1, R2, R3)\n(2024)'])}</td>
              </>
            ) : selectedQuota === 'state' ? (
              renderStateQuotaRow(item, index)
            ) : (
              // MBBS All India Quota row
              <>
                <td>{item['College Name']}</td>
                <td>{item['City, State']}</td>
                <td>{item['TYPE']}</td>
                <td>{item['NIRF Ranking']}</td>
                <td>{item['Category']}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{formatCellText(item[`Round-1\nR1\n(${filters.year})`])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{formatCellText(item[`Round-2\nR2\n(${filters.year})`])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{formatCellText(item[`MoP_Up\nR3\n(${filters.year})`])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{formatCellText(item[`Stray\nR4\n(${filters.year})`])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{formatCellText(item[`Special Stray\nR5\n(${filters.year})`])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{formatCellText(item[`Closing\nMax(R1 to R5)\n(${filters.year})`])}</td>
                <td>{item['After MBBS Service Bond']}</td>
              </>
            )
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
            <td colSpan={selectedQuota === 'bds' ? 8 : selectedExam === 'NEET' ? 13 : 10}>
              {renderExpandedContent(item)}
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  // Add helper function to format table header text with newlines
  const formatHeaderText = (text) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Update renderTableHeaders function to use formatHeaderText
  const renderTableHeaders = () => {
    if (selectedExam === 'NEET') {
      if (selectedQuota === 'bds') {
        const roundHeaders = [
          'Round-1\nR1',
          'Round-2\nR2',
          'Round-3\nR3'
        ];

        return (
          <tr>
            <th style={{ width: '40px' }}></th>
            <th>College Name</th>
            <th>City, State</th>
            <th>BDS Rank</th>
            {roundHeaders.map((header, index) => (
              <th key={index} style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
                {formatHeaderText(`${header}\n(${filters.year})`)}
              </th>
            ))}
            <th 
              onClick={() => handleSort(`Closing\nMax(R1, R2, R3)\n(${filters.year})`)}
              style={{ cursor: 'pointer', whiteSpace: 'pre-line', textAlign: 'center' }}
            >
              {formatHeaderText(`Closing\nMax(R1, R2, R3)\n(${filters.year})`)} ↕
            </th>
          </tr>
        );
      } else if (selectedQuota === 'state') {
        return renderStateQuotaHeaders();
      } else {
        // MBBS All India Quota headers
        return (
          <tr>
            <th style={{ width: '40px' }}></th>
            <th>College Name</th>
            <th>City, State</th>
            <th>Type</th>
            <th>NIRF Rank</th>
            <th>Category</th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {formatHeaderText(`Round-1\nR1\n(${filters.year})`)}
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {formatHeaderText(`Round-2\nR2\n(${filters.year})`)}
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {formatHeaderText(`MoP_Up\nR3\n(${filters.year})`)}
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {formatHeaderText(`Stray\nR4\n(${filters.year})`)}
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {formatHeaderText(`Special Stray\nR5\n(${filters.year})`)}
            </th>
            <th 
              onClick={() => handleSort(`Closing\nMax(R1 to R5)\n(${filters.year})`)}
              style={{ cursor: 'pointer', whiteSpace: 'pre-line', textAlign: 'center' }}
            >
              {formatHeaderText(`Closing\nMax(R1 to R5)\n(${filters.year})`)} ↕
            </th>
            <th>Bond</th>
          </tr>
        );
      }
    }

    return (
      <tr>
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
    const roundHeaders = [
      'Round-1\nR1',
      'Round-2\nR2',
      'Round-3\nR3'
    ];

    return (
      <tr>
        <th style={{ width: '40px' }}></th>
        <th>College Name</th>
        <th>City, State</th>
        <th>NIRF Rank</th>
        <th>Raj. Rank</th>
        <th>Category</th>
        <th>Gender</th>
        {roundHeaders.map((header, index) => (
          <th key={index} style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
            {formatHeaderText(`${header}\n(${filters.year})`)}
          </th>
        ))}
        <th 
          onClick={() => handleSort(`Closing\nMax(R1, R2, R3)\n(${filters.year})`)}
          style={{ cursor: 'pointer', whiteSpace: 'pre-line', textAlign: 'center' }}
        >
          {formatHeaderText(`Closing\nMax(R1, R2, R3)\n(${filters.year})`)} ↕
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
          <td>{item['College Name']}</td>
          <td>{item['City, State']}</td>
          <td>{item['NIRF Ranking']}</td>
          <td>{item['Rajasthan College Ranking']}</td>
          <td>{item.Category}</td>
          <td>{item.Gender}</td>
          <td style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{formatCellText(item[`Round-1\nR1\n(${filters.year})`])}</td>
          <td style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{formatCellText(item[`Round-2\nR2\n(${filters.year})`])}</td>
          <td style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{formatCellText(item[`Round-3\nR3\n(${filters.year})`])}</td>
          <td style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{formatCellText(item[`Closing\nMax(R1, R2, R3)\n(${filters.year})`])}</td>
        </tr>
        {isExpanded && (
          <tr>
            <td colSpan={11}>
              <div style={expandedContentStyle}>
                <div>
                  <div style={infoHeaderStyle}>Important Information</div>
                  <ul style={infoListStyle}>
                    <li>
                      <div>
                        <span style={infoLabelStyle}>MBBS Seats</span>
                        <span style={infoLabelStyle}> : </span>
                        <span style={infoValueStyle}>{item['Annual Intake (MBBS Seats)']}</span>
                      </div>
                    </li>
                    <li>
                      <div>
                        <span style={infoLabelStyle}>Connectivity</span>
                        <span style={infoLabelStyle}> : </span>
                        <span style={infoValueStyle}>{item['Connectivity'] || '-'}</span>
                      </div>
                    </li>
                    <li>
                      <div>
                        <span style={infoLabelStyle}>University Name</span>
                        <span style={infoLabelStyle}> : </span>
                        <span style={infoValueStyle}>{item['University Name']}</span>
                      </div>
                    </li>
                    <li>
                      <div>
                        <span style={infoLabelStyle}>Management of College</span>
                        <span style={infoLabelStyle}> : </span>
                        <span style={infoValueStyle}>{item['Managemet  of College']?.toLowerCase()}</span>
                      </div>
                    </li>
                    <li>
                      <div>
                        <span style={infoLabelStyle}>After MBBS Service Bond</span>
                        <span style={infoLabelStyle}> : </span>
                        <span style={infoValueStyle}>{item['After MBBS Service Bond']}</span>
                      </div>
                    </li>
                    <li>
                      <div>
                        <span style={infoLabelStyle}>Penalty if Service Bond Broken</span>
                        <span style={infoLabelStyle}> : </span>
                        <span style={infoValueStyle}>{item['Penalty if Service Bond Broken']}</span>
                      </div>
                    </li>
                    <li>
                      <div>
                        <span style={infoLabelStyle}>Discontinuation Bond Penalty</span>
                        <span style={infoLabelStyle}> : </span>
                        <span style={infoValueStyle}>{item['MBBS Discontinuation Bond Penalty']}</span>
                      </div>
                    </li>
                    <li>
                      <div>
                        <span style={infoLabelStyle}>Established Year</span>
                        <span style={infoLabelStyle}> : </span>
                        <span style={infoValueStyle}>{item['Est. Year']}</span>
                      </div>
                    </li>
                    {item['Disclaimer'] && (
                      <li>
                        <div>
                          <span style={infoLabelStyle}>Disclaimer</span>
                          <span style={infoLabelStyle}> : </span>
                          <span style={infoValueStyle}>{item['Disclaimer']}</span>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
                {item['PG Specializations'] && (
                  <div style={pgCoursesContainerStyle}>
                    {formatPGCoursesList(item['PG Specializations'], item)}
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
          MBBS All India Quota
        </button>
        <button
          className={`quota-button ${selectedQuota === 'state' ? 'active' : ''}`}
          onClick={() => setSelectedQuota('state')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: selectedQuota === 'state' ? '#076B37' : 'white',
            color: selectedQuota === 'state' ? 'white' : '#1e293b',
            cursor: 'pointer'
          }}
        >
          MBBS State Quota
        </button>
        <button
          className={`quota-button ${selectedQuota === 'bds' ? 'active' : ''}`}
          onClick={() => setSelectedQuota('bds')}
          style={{
            padding: '10px 20px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: selectedQuota === 'bds' ? '#076B37' : 'white',
            color: selectedQuota === 'bds' ? 'white' : '#1e293b',
            cursor: 'pointer'
          }}
        >
          BDS All India
        </button>
      </div>
    );
  };

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

      // For NIRF Ranking, lower is better
      if (key === 'NIRF Ranking') {
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return direction === 'asc' 
            ? aValue - bValue
            : bValue - aValue;
        }
      }

      // For closing ranks, handle the new format
      if (key.includes('Closing')) {
        // Convert to numbers if they're numeric strings
        if (typeof aValue === 'string' && !isNaN(aValue)) aValue = parseInt(aValue);
        if (typeof bValue === 'string' && !isNaN(bValue)) bValue = parseInt(bValue);

        return direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }

      // If both values are strings (like college names), use string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Default numeric comparison
      return direction === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    });

    setFilteredData(sortedData);
  };

  // Update the print function to handle the new data format
  const handlePrint = useCallback(() => {
    let dataToExport;
    let filename;
    
    if (selectedExam === 'NEET' && selectedQuota === 'state') {
      // Handle state quota data
      const filteredData = filterStateQuotaData();
      
      // Transform data for state quota
      dataToExport = filteredData.map(item => ({
        'College Name': item['College Name'] || '-',
        'City, State': item['City, State'] || '-',
        'NIRF Ranking': item['NIRF Ranking'] || '-',
        'Rajasthan College Ranking': item['Rajasthan College Ranking'] || '-',
        'Category': item['Category'] || '-',
        'Gender': item['Gender'] || '-',
        'Round 1': item[`Round-1\nR1\n(${filters.year})`] || '-',
        'Round 2': item[`Round-2\nR2\n(${filters.year})`] || '-',
        'Round 3': item[`Round-3\nR3\n(${filters.year})`] || '-',
        'Closing Rank': item[`Closing\nMax(R1, R2, R3)\n(${filters.year})`] || '-',
        'MBBS Seats': item['Annual Intake (MBBS Seats)'] || '-',
        'PG Courses': item['no. of pg courses'] || '-',
        'PG Seats': item['no. of pg seats'] || '-',
        'Connectivity': item['Connectivity'] || '-',
        'Bond': item['After MBBS Service Bond'] || '-',
        'Bond Penalty': item['Penalty if Service Bond Broken'] || '-',
        'Discontinuation Penalty': item['MBBS Discontinuation Bond Penalty'] || '-'
      }));

      filename = `NEET_State_Quota_${filters.year}_${filters.category}_${filters.gender}.csv`;
    } else {
      // Handle AIQ data - use filteredData instead of getCurrentPageData
      dataToExport = filteredData.map(item => ({
        'College Name': item['College Name'] || '-',
        'City, State': item['City, State'] || '-',
        'NIRF Ranking': item['NIRF Ranking'] || '-',
        'Category': item['Category'] || '-',
        'Round 1': item[`Round-1\nR1\n(${filters.year})`] || '-',
        'Round 2': item[`Round-2\nR2\n(${filters.year})`] || '-',
        'Mop Up': item[`MoP_Up\nR3\n(${filters.year})`] || '-',
        'Stray': item[`Stray\nR4\n(${filters.year})`] || '-',
        'Special Stray': item[`Special Stray\nR5\n(${filters.year})`] || '-',
        'Closing Rank': item[`Closing\nMax(R1 to R5)\n(${filters.year})`] || '-',
        'Bond': item['After MBBS Service Bond'] || '-',
        'MBBS Seats': item['Annual Intake (MBBS Seats)'] || '-',
        'PG Courses': item['no. of pg courses'] || '-',
        'PG Seats': item['no. of pg seats'] || '-',
        'Connectivity': item['Connectivity'] || '-',
        'Est. Year': item['Est. Year'] || '-'
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
              <div className="pagination-container" style={{ borderTop: 'none', backgroundColor: '#1B5431' }}>
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
                    <label htmlFor="pageSize" className="filter-label" style={{ margin: 0, color: '#fff' }}>Rows per page:</label>
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
                        <td colSpan={selectedExam === 'NEET' ? 11 : 10} style={{ textAlign: 'center', padding: '2rem' }}>
                          No results found
                        </td>
                      </tr>
                    ) : (
                      getCurrentPageData().map((item, index) => 
                        selectedExam === 'NEET' && selectedQuota === 'state' 
                          ? renderStateQuotaRow(item, index)
                          : renderTableRow(item, index)
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
                    `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, selectedExam === 'NEET' && selectedQuota === 'state' ? filterStateQuotaData().length : filteredData.length)} of ${selectedExam === 'NEET' && selectedQuota === 'state' ? filterStateQuotaData().length : filteredData.length} results`
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