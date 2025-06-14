import React, { useState, useEffect, useMemo, useCallback } from 'react';
import allData from '../data/all_data.json';
import '../styles/CollegeSearch.css';
import Navigation from '../components/common/navigation/navigation';
import Layout from '../components/common/layout/layout';

// Add styles for year header hover effect
const yearHeaderStyles = {
  hover: {
    backgroundColor: '#f7fafc',
    borderRadius: '4px',
    padding: '8px',
    transition: 'background-color 0.2s'
  }
};

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
  const [filters, setFilters] = useState({
    searchQuery: '',
    rankRange: { min: '', max: '' },
    gender: 'all',
    seatType: 'all',
    collegeTypes: [],
    counsellingType: ''  // Start with empty counseling type
  });

  // Add showMainContent state back
  const [showMainContent, setShowMainContent] = useState(false);

  // Add sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Separate state for input values to prevent lag
  const [inputValues, setInputValues] = useState({
    searchQuery: '',
    rankRange: { min: '', max: '' }
  });

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [expandedYears, setExpandedYears] = useState({});

  // Helper function to normalize college names for comparison
  const normalizeCollegeName = (name) => {
    return name.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace('indian institute of technology', 'iit')
      .replace('national institute of technology', 'nit')
      .replace('indian institute of information technology', 'iiit')
      .trim();
  };

  // Initialize loading state
  useEffect(() => {
    setIsLoading(true);
    // Simulate network delay for initial data load
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // Memoize the initial data processing
  const processedData = useMemo(() => {
    return allData.map(item => ({
      ...item,
      placementStats: {
        registered: item.Registered,
        placed: item.Placed,
        placementPercentage: item['Placement %'],
        lowestCTC: item['Lowest CTC (LPA)'],
        highestCTC: item['Highest CTC (LPA)'],
        medianCTC: item['Median CTC (LPA)'],
        averageCTC: item['Average CTC (LPA)'],
        year: item.Year
      }
    }));
  }, []);

  // Filter data with loading state
  const filterData = useCallback(() => {
    setIsFiltering(true);
    let results = processedData;

    // Filter by counselling type first
    if (filters.counsellingType) {
      results = results.filter(item => 
        item.TYPE_Counselling === filters.counsellingType
      );
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      results = results.filter(item => 
        item['Institute'].toLowerCase().includes(query) ||
        item['Academic Program & Stats']?.toLowerCase().includes(query)
      );
    }

    if (filters.rankRange.min) {
      results = results.filter(item => 
        parseInt(item['Opening Rank']) >= parseInt(filters.rankRange.min)
      );
    }

    if (filters.rankRange.max) {
      results = results.filter(item => 
        parseInt(item['Closing Rank']) <= parseInt(filters.rankRange.max)
      );
    }

    if (filters.gender !== 'all') {
      results = results.filter(item => 
        item.Gender === filters.gender
      );
    }

    if (filters.seatType !== 'all') {
      results = results.filter(item => 
        item['Seat Type'] === filters.seatType
      );
    }

    // Filter out PwD entries
    results = results.filter(item => 
      !item['Seat Type'].includes('PwD')
    );

    // Filter out GFTIS with HS quota
    results = results.filter(item => 
      !(item.TYPE === 'GFTIS' && item.Quota === 'HS')
    );

    if (filters.collegeTypes.length > 0) {
      results = results.filter(item => 
        filters.collegeTypes.includes(item.TYPE)
      );
    }

    setFilteredData(results);
    setIsFiltering(false);
  }, [filters, processedData]);

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

  // Format CTC value for display
  const formatCTC = (value) => {
    return value ? `₹${value} LPA` : 'N/A';
  };

  // Loading Skeleton Component
  const TableSkeleton = () => (
    <div className="animate-pulse">
      {[...Array(10)].map((_, index) => (
        <div key={index} className="shimmer shimmer-line" />
      ))}
    </div>
  );

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

  // Helper function to toggle year expansion
  const toggleYearExpansion = (collegeId, year, rowIndex) => {
    const key = `${collegeId}-${year}-${rowIndex}`;
    setExpandedYears(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Add helper function to check if columns should be visible
  const shouldShowColumn = {
    seat: filters.seatType === 'all',
    gender: filters.gender === 'all'
  };

  // Add helper function to handle newlines
  const formatProgramName = (name) => {
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

  // Counselling type selection handler
  const handleCounsellingTypeSelect = (type) => {
    setFilters(prev => ({
      ...prev,
      counsellingType: type
    }));
    setShowMainContent(true);
  };

  if (!showMainContent) {
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
            }}>Select Counselling Type</h1>
            
            <p style={{
              fontSize: '1.1rem',
              color: '#64748b',
              marginBottom: '2rem',
              lineHeight: '1.5'
            }}>
              Choose the counselling type to view relevant college and placement information
            </p>

            <div style={{ 
              display: 'flex', 
              gap: '1.5rem',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <button 
                onClick={() => handleCounsellingTypeSelect('JOSAA')}
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
                <span style={{ position: 'relative', zIndex: 1 }}>JOSAA</span>
              </button>
              <button 
                onClick={() => handleCounsellingTypeSelect('CSAB')}
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
                <span style={{ position: 'relative', zIndex: 1 }}>CSAB</span>
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Navigation/>
      <div className="college-search-container">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <h1 className="search-header">College & Placement Search</h1>
          <select
            value={filters.counsellingType}
            onChange={(e) => handleFilterChange('counsellingType', e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              borderRadius: '8px',
              border: '2px solid #076B37',
              backgroundColor: 'white',
              color: '#076B37',
              cursor: 'pointer',
              fontWeight: '500',
              minWidth: '120px'
            }}
          >
            <option value="JOSAA">JOSAA</option>
            <option value="CSAB">CSAB</option>
          </select>
        </div>
        
        {/* Search and Filters Card */}
        <div className="search-card">
          <h2 className="card-title">Search & Filters</h2>
          
          <div className="filters-grid">
            {/* Search Input */}
            <div className="col-span-full">
              <label htmlFor="search" className="filter-label">
                Search Colleges/Programs
              </label>
              <input
                id="search"
                type="text"
                placeholder="Type to search colleges or programs..."
                className="search-input"
                value={inputValues.searchQuery}
                onChange={(e) => handleInputChange('searchQuery', e.target.value)}
              />
            </div>

            {/* Rank Range */}
            <div>
              <label className="filter-label">Rank Range</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  placeholder="Min"
                  className="search-input"
                  value={inputValues.rankRange.min}
                  onChange={(e) => handleInputChange('rankRange', { ...inputValues.rankRange, min: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="search-input"
                  value={inputValues.rankRange.max}
                  onChange={(e) => handleInputChange('rankRange', { ...inputValues.rankRange, max: e.target.value })}
                />
              </div>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="filter-label">Gender</label>
              <select
                className="filter-select"
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
              >
                <option value="all">All Genders</option>
                <option value="Gender-Neutral">Gender-Neutral</option>
                <option value="Female-only">Female-only</option>
              </select>
            </div>

            {/* Seat Type Filter */}
            <div>
              <label className="filter-label">Seat Type</label>
              <select
                className="filter-select"
                value={filters.seatType}
                onChange={(e) => handleFilterChange('seatType', e.target.value)}
              >
                <option value="all">All Seat Types</option>
                <option value="GEN">GEN</option>
                <option value="EWS">EWS</option>
                <option value="OBC-NCL">OBC-NCL</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>

            {/* College Type Filter */}
            <div>
              <label className="filter-label">College Type</label>
              <div className="checkbox-group">
                {['IIT', 'NIT', 'IIITS', 'GFTIS'].map((type) => (
                  <label key={type} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.collegeTypes.includes(type)}
                      onChange={(e) => {
                        const updatedTypes = e.target.checked
                          ? [...filters.collegeTypes, type]
                          : filters.collegeTypes.filter(t => t !== type);
                        handleFilterChange('collegeTypes', updatedTypes);
                      }}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

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
              <button
                onClick={exportToCSV}
                className="print-button"
                disabled={isLoading || isFiltering || filteredData.length === 0}
              >
                <span className="print-icon">🖨️</span> Print Results
              </button>
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
                <tr>
                  <th>Counselling</th>
                  <th>TYPE</th>
                  <th>Institute</th>
                  <th>Academic Program & Placement Stats</th>
                  <th 
                    onClick={() => handleSort('Opening Rank')}
                    style={{ cursor: 'pointer' }}
                  >
                    Opening <br/>Rank ↕
                  </th>
                  <th 
                    onClick={() => handleSort('Closing Rank')}
                    style={{ cursor: 'pointer' }}
                  >
                    Closing <br/> Rank ↕
                  </th>
                  {shouldShowColumn.seat && <th>Seat</th>}
                  {shouldShowColumn.gender && <th>Gender</th>}
                  <th>Quota</th>
                  {filters.counsellingType === 'CSAB' && <th>Round On</th>}
                </tr>
              </thead>
              <tbody>
                {!isLoading && !isFiltering && getCurrentPageData().length === 0 ? (
                  <tr>
                    <td colSpan={7 + (shouldShowColumn.seat ? 1 : 0) + (shouldShowColumn.gender ? 1 : 0) + (filters.counsellingType === 'CSAB' ? 1 : 0)} style={{ textAlign: 'center', padding: '2rem' }}>
                      No results found
                    </td>
                  </tr>
                ) : (
                  getCurrentPageData().map((item, index) => (
                    <tr key={index}>
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
                    </tr>
                  ))
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
  );
};

export default CollegeSearch; 