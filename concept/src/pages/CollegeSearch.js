import React, { useState, useEffect, useMemo, useCallback } from 'react';
import placementData from '../data/All_Placement_Stats.json';
import josaaData from '../data/josaa_opening_closing.json';
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
    collegeType: 'all'
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
    const data = josaaData.map(item => {
      const normalizedInstitute = normalizeCollegeName(item.Institute);
      
      const placementInfo = placementData.find(p => {
        const normalizedCollege = normalizeCollegeName(p.COLLEGE);
        return normalizedCollege === normalizedInstitute;
      }) || {};

      const branchSpecificPlacement = placementData.find(p => {
        const normalizedCollege = normalizeCollegeName(p.COLLEGE);
        const normalizedBranch = p.Branch?.toLowerCase().trim();
        const normalizedProgram = item['Academic Program Name']?.toLowerCase().trim();
        
        return normalizedCollege === normalizedInstitute && 
               normalizedBranch && normalizedProgram &&
               normalizedProgram.includes(normalizedBranch);
      });

      const finalPlacementInfo = branchSpecificPlacement || placementInfo;

      return {
        ...item,
        placementStats: finalPlacementInfo ? {
          registered: finalPlacementInfo.Registered,
          placed: finalPlacementInfo.Placed,
          placementPercentage: finalPlacementInfo['Placement %'],
          lowestCTC: finalPlacementInfo['Lowest CTC (LPA)'],
          highestCTC: finalPlacementInfo['Highest CTC (LPA)'],
          medianCTC: finalPlacementInfo['Median CTC (LPA)'],
          averageCTC: finalPlacementInfo['Average CTC (LPA)'],
          year: finalPlacementInfo.Year
        } : null
      };
    });
    return data;
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

      if (filters.collegeType !== 'all') {
        results = results.filter(item => 
          item.TYPE === filters.collegeType
        );
      }

      setFilteredData(results);
      setIsFiltering(false);
    }, 300); // Add slight delay to show loading state
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
                <option value="Female-only (including Supernumerary)">Female-only</option>
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
              <select
                className="filter-select"
                value={filters.collegeType}
                onChange={(e) => handleFilterChange('collegeType', e.target.value)}
              >
                <option value="all">All College Types</option>
                <option value="IIT">IIT</option>
                <option value="NIT">NIT</option>
                <option value="IIITS">IIIT</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="table-container">
          {/* Results Header */}
          <div className="pagination-container" style={{ borderTop: 'none', borderBottom: '1px solid #e2e8f0' }}>
            <div className="page-info">
              Total Results: {isLoading ? '...' : filteredData.length}
            </div>
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
                        {item.placementStats ? (
                          <div className="placement-stats">
                            <div className="stats-year">Year: {item.placementStats.year}</div>
                            <div className="stats-placement">Placement: {item.placementStats.placementPercentage}</div>
                            <div>Average: {formatCTC(item.placementStats.averageCTC)}</div>
                            <div className="stats-highlight">Highest: {formatCTC(item.placementStats.highestCTC)}</div>
                            <div>Median: {formatCTC(item.placementStats.medianCTC)}</div>
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