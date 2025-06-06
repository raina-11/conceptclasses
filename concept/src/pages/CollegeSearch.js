import React, { useState, useEffect, useMemo, useCallback } from 'react';
import allData from '../data/all_data.json';
import '../styles/CollegeSearch.css';
import Navigation from '../components/common/navigation/navigation';
import Layout from '../components/common/layout/layout';

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
    quota: 'all'
  });

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
    setTimeout(() => {
      let results = processedData;

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        results = results.filter(item => 
          item.Institute.toLowerCase().includes(query) ||
          item['Academic Program Name'].toLowerCase().includes(query)
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

      if (filters.quota !== 'all') {
        results = results.filter(item => 
          item.Quota === filters.quota
        );
      }

      if (filters.collegeTypes.length > 0) {
        results = results.filter(item => 
          filters.collegeTypes.includes(item.TYPE)
        );
      }

      setFilteredData(results);
      setIsFiltering(false);
    }, 300);
  }, [filters, processedData]);

  // Effect to run filtering when filters change
  useEffect(() => {
    filterData();
  }, [filterData]);

  // Handle input changes without immediate filtering
  const handleInputChange = (field, value) => {
    setInputValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle direct filter changes (dropdowns)
  const handleFilterChange = (field, value) => {
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

  // Add print function
  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    const selectedTypes = filters.collegeTypes.length > 0 ? filters.collegeTypes.join(', ') : 'All';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>College Search Results</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; }
            .print-header { margin-bottom: 20px; }
            .filters-summary { margin-bottom: 15px; color: #666; }
            .placement-stats { margin-top: 5px; }
            .year-stats { margin-bottom: 10px; }
            .stats-year { font-weight: bold; }
            .disclaimer { 
              margin-bottom: 20px; 
              padding: 10px; 
              border-bottom: 1px solid #ddd;
              color: #666;
              font-style: italic;
              font-size: 0.9em;
            }
            @media print {
              .no-break { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>College Search Results</h1>
            <div class="filters-summary">
              <p>Filters Applied:</p>
              <ul>
                ${filters.searchQuery ? `<li>Search Query: ${filters.searchQuery}</li>` : ''}
                ${filters.rankRange.min || filters.rankRange.max ? `<li>Rank Range: ${filters.rankRange.min || 'Any'} - ${filters.rankRange.max || 'Any'}</li>` : ''}
                <li>College Types: ${selectedTypes}</li>
                <li>Gender: ${filters.gender === 'all' ? 'All' : filters.gender}</li>
                <li>Seat Type: ${filters.seatType === 'all' ? 'All' : filters.seatType}</li>
                <li>Quota: ${filters.quota === 'all' ? 'All' : filters.quota}</li>
              </ul>
            </div>
          </div>
          
          <div class="disclaimer">
            <p>Disclaimer: This data has been sourced from various institutions and public records. Concept does not guarantee the accuracy of this information and bears no responsibility for any decisions made based on this data.</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Institute</th>
                <th>Program</th>
                <th>Opening Rank</th>
                <th>Closing Rank</th>
                <th>Seat Type</th>
                <th>Gender</th>
                <th>Placement Stats</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(item => `
                <tr class="no-break">
                  <td>${item.Institute}</td>
                  <td>${item['Academic Program Name']}</td>
                  <td>${item['Opening Rank']}</td>
                  <td>${item['Closing Rank']}</td>
                  <td>${item['Seat Type']}</td>
                  <td>${item.Gender}</td>
                  <td>
                    ${item.Years ? 
                      item.Years.map(yearData => `
                        <div class="year-stats">
                          <div class="stats-year">Year: ${yearData.Year}</div>
                          <div>Placement: ${yearData['Placement Statistics']['Placement %']}</div>
                          <div>Average: ${formatCTC(yearData['Placement Statistics']['Average CTC (LPA)'])}</div>
                          <div>Highest: ${formatCTC(yearData['Placement Statistics']['Highest CTC (LPA)'])}</div>
                          <div>Median: ${formatCTC(yearData['Placement Statistics']['Median CTC (LPA)'])}</div>
                        </div>
                      `).join('') 
                      : 'No placement data available'
                    }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [filteredData, filters, formatCTC]);

  return (
    <Layout>
      <Navigation/>
      <div className="college-search-container">
        <h1 className="search-header">College & Placement Search</h1>
        
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

            {/* Quota Filter */}
            <div>
              <label className="filter-label">Quota</label>
              <select
                className="filter-select"
                value={filters.quota}
                onChange={(e) => handleFilterChange('quota', e.target.value)}
              >
                <option value="all">All Quotas</option>
                <option value="AI">All India (AI)</option>
                <option value="OS">Other State (OS)</option>
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
                onClick={handlePrint}
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
            {(isLoading || isFiltering) && (
              <div className="loading-overlay">
                <div className="loading-content">
                  <div className="spinner"></div>
                  <div className="loading-text">
                    {isLoading ? 'Loading data...' : 'Filtering results...'}
                  </div>
                </div>
              </div>
            )}
            
            <table className="results-table">
              <thead>
                <tr>
                  <th>Institute</th>
                  <th>Program</th>
                  <th 
                    onClick={() => handleSort('Opening Rank')}
                    style={{ cursor: 'pointer' }}
                  >
                    Opening Rank {sortConfig.key === 'Opening Rank' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    onClick={() => handleSort('Closing Rank')}
                    style={{ cursor: 'pointer' }}
                  >
                    Closing Rank {sortConfig.key === 'Closing Rank' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th>Seat Type</th>
                  <th>Gender</th>
                  <th>Placement Stats</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading && !isFiltering && getCurrentPageData().length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                      No results found
                    </td>
                  </tr>
                ) : (
                  getCurrentPageData().map((item, index) => (
                    <tr key={index}>
                      <td>{item.Institute}</td>
                      <td>{item['Academic Program Name']}</td>
                      <td>{item['Opening Rank']}</td>
                      <td>{item['Closing Rank']}</td>
                      <td>{item['Seat Type']}</td>
                      <td>{item.Gender}</td>
                      <td>
                        {item.Years ? (
                          <div className="placement-stats">
                            {item.Years.map((yearData, index) => (
                              <div key={index} className="year-stats">
                                <div className="stats-year">Year: {yearData.Year}</div>
                                <div className="stats-placement">Placement: {yearData['Placement Statistics']['Placement %']}</div>
                                <div>Average: {formatCTC(yearData['Placement Statistics']['Average CTC (LPA)'])}</div>
                                <div className="stats-highlight">Highest: {formatCTC(yearData['Placement Statistics']['Highest CTC (LPA)'])}</div>
                                <div>Median: {formatCTC(yearData['Placement Statistics']['Median CTC (LPA)'])}</div>
                                {index < item.Years.length - 1 && <div className="year-divider"></div>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>No placement data available</span>
                        )}
                      </td>
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