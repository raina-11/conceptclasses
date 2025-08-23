import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import neetData from '../data/neet_data.json';
import '../styles/CollegeSearch.css';
import Navigation from '../components/common/navigation/navigation';
import Layout from '../components/common/layout/layout';
import neetRajData from '../data/neet_raj_state.json';
import IITSearch from './iitSerach';
import neetBdsData from '../data/neet_bds_data.json';
import neetMgmtData from '../data/neet_mgmt_data.json';
import MedicalCollegesDashboard, { StateWiseDashboard } from '../components/common/dashboard/MedicalCollegesDashboard';
// import { ReactComponent as IndiaMap } from '../images/india-map.svg';
import statesData from '../data/states_hover.json';
import * as XLSX from 'xlsx';
import IndiaMap from './IndiaMap';

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

// Add TrophyIcon component at the top of the file
const TrophyIcon = (props) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    minWidth: '120px',
    padding: '16px 10px',
  }}>
    <svg width="32" height="32" viewBox="0 0 98 124" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_d_35_125)">
        <path d="M81.5024 15.4578C80.1055 13.2737 78.118 12.0216 76.0494 12.0216H68.9769C68.6222 5.0809 65.2069 6.04565 63.8768 6.04565C62.4732 6.04565 45.1431 6.04565 45.1431 6.04565C45.1431 6.04565 27.8131 6.04565 26.4094 6.04565C25.0792 6.04565 21.6633 5.0811 21.3087 12.0216H14.2363C12.168 12.0216 10.1804 13.2741 8.78325 15.4578C7.08983 18.1052 6.35912 21.9258 6.71823 26.2341C6.78473 28.148 7.4852 37.9793 14.8558 44.972C18.6016 48.5256 22.2018 50.3374 25.477 51.2594C26.1948 51.4734 26.921 51.6657 27.6652 51.8158C27.6754 51.8315 27.6855 51.8477 27.6961 51.8633C43.0203 74.117 41.1489 61.243 41.1489 81.6416C41.1489 89.5498 33.2097 86.99 33.2097 93.06C33.2097 99.1297 27.0221 94.1342 27.5948 101.336C27.9456 105.75 37.4216 109.06 45.1434 109.06C52.8645 109.06 62.3411 105.75 62.6919 101.336C63.2644 94.1342 57.0764 99.1297 57.0764 93.06C57.0764 86.99 49.1377 89.5498 49.1377 81.6416C49.1377 61.2428 47.2662 74.117 62.5905 51.8633C62.6116 51.8324 62.6311 51.7996 62.6522 51.7684C66.4683 51.0864 70.845 49.323 75.4308 44.9722C82.8008 37.9795 83.5013 28.1482 83.5677 26.2343C83.9269 21.9258 83.1958 18.1048 81.5024 15.4578ZM77.5209 25.385L77.4932 25.5909L77.497 25.8718C77.4825 26.4168 77.1952 33.1207 71.9875 38.0615C70.5632 39.4131 69.1852 40.4374 67.845 41.2329C67.542 41.4024 67.2396 41.572 66.9297 41.7196C68.7594 34.609 69.0565 26.6559 69.0618 20.4078H76.0492C76.2836 20.4078 76.6295 20.512 76.9466 21.0073C77.4872 21.8523 77.6966 23.4476 77.5209 25.385ZM40.8573 46.764C40.2849 47.7604 39.4377 48.2794 38.583 48.2794C37.9515 48.2794 37.3157 47.9964 36.7827 47.4128C29.504 39.4467 28.8942 28.5111 28.8942 18.8866C28.8942 16.6764 30.193 14.8846 31.7946 14.8846C33.3963 14.8846 34.6948 16.6764 34.6948 18.8866C34.6948 27.3313 35.1303 35.3877 40.387 41.1412C41.642 42.5149 41.8525 45.0324 40.8573 46.764ZM18.2983 38.0615C13.0953 33.1252 12.8035 26.4294 12.7886 25.8735L12.7919 25.6825L12.7648 25.3848C12.5891 23.4478 12.7985 21.8521 13.3392 21.0071C13.6563 20.5118 14.0021 20.4076 14.2363 20.4076H21.2237C21.2284 25.7416 21.4544 32.3153 22.656 38.5496C22.8564 39.6246 23.0784 40.6934 23.3395 41.7437C21.7201 40.8985 20.0426 39.7164 18.2983 38.0615Z" fill="#FFC247"/>
      </g>
      <defs>
        <filter id="filter0_d_35_125" x="0.628906" y="0" width="97.0283" height="123.06" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dx="4" dy="4"/>
          <feGaussianBlur stdDeviation="5"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_35_125"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_35_125" result="shape"/>
        </filter>
      </defs>
    </svg>
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontSize: '14px',
      lineHeight: '1.2'
    }}>
      {props.selectedQuota === 'bds' ?
        <div>BDS Rank </div>
        :
        <>
          <div>NIRF</div>
          <div>Ranking</div>
        </>
      }
    </div>
    <div>↕</div>
  </div>
);

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
    course: 'all', // Add course filter for management seats
    
    // NEET specific filters
    states: [],
    collegeTypes: [],
    bond: 'all',
    pgAvailability: 'all',  // Add this line
    
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
  const [hoveredState, setHoveredState] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedStateId, setSelectedStateId] = useState('IN-RJ'); // Set default to Rajasthan
  const [excelData, setExcelData] = useState(null);

  // Add state mapping object
  const stateNameToId = {
    'madhya pradesh': 'IN-MP',
    'rajasthan': 'IN-RJ',
    'ladakh': 'IN-LA',
    'lakshadweep': 'IN-LD',
    'gujarat': 'IN-GJ',
    'punjab': 'IN-PB',
    'odisha': 'IN-OR',
    'jammu and kashmir': 'IN-JK',
    'delhi': 'IN-DL',
    'chandigarh': 'IN-CH',
    'assam': 'IN-AS',
    'arunachal pradesh': 'IN-AR',
    'nagaland': 'IN-NL',
    'mizoram': 'IN-MZ',
    'dadra & nagar haveli': 'IN-DN',
    'andaman & nicobar': 'IN-AN',
    'goa': 'IN-GA',
    'uttar pradesh': 'IN-UP',
    'karnataka': 'IN-KA',
    'telangana': 'IN-TG',
    'tamil nadu': 'IN-TN',
    'maharashtra': 'IN-MH',
    'kerala': 'IN-KL',
    'andhra pradesh': 'IN-AP',
    'west bengal': 'IN-WB',
    'bihar': 'IN-BR',
    'haryana': 'IN-HR',
    'chhattisgarh': 'IN-CT',
    'pondicherry': 'IN-PY',
    'uttarakhand': 'IN-UT',
    'tripura': 'IN-TR',
    'himachal pradesh': 'IN-HP',
    'sikkim': 'IN-SK',
    'meghalaya': 'IN-ML',
    'manipur': 'IN-MN',
    'jharkhand': 'IN-JH'
  };

  // Create state options for dropdown
  const STATE_SELECT_OPTIONS = Object.entries(stateNameToId).map(([name, id]) => ({
    value: id,
    label: name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }));

  const handleStateHover = (e, stateId) => {
    setHoveredState(stateId);
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleStateLeave = () => {
    setHoveredState(null);
  };

  const handleStateClick = (stateId) => {
    setSelectedStateId(stateId);
    loadExcelFile(stateId);
  };

  const loadExcelFile = async (stateId) => {
    try {
      const response = await fetch(`/data/${stateId}.xlsx`);
      if (!response.ok) {
        throw new Error('File not found');
      }
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      setExcelData(data);
    } catch (error) {
      console.error('Error loading Excel file:', error);
      setExcelData(null);
    }
  };

  const renderExcelTable = () => {
    if (!excelData) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          color: '#64748b',
          fontSize: '1rem'
        }}>
          No data available for this state
        </div>
      );
    }

    return (
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr>
              {excelData[0]?.map((header, index) => (
                <th key={index} style={{
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderBottom: '2px solid #e2e8f0',
                  color: '#1e293b',
                  textAlign: 'left',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {excelData.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex} style={{
                borderBottom: '1px solid #e2e8f0',
                backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc'
              }}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{
                    padding: '12px',
                    color: '#4a5568',
                    whiteSpace: 'nowrap'
                  }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStateDetails = () => {
    if (!selectedStateId) {
      return (
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#718096',
          fontSize: '16px',
          padding: '20px',
          textAlign: 'center'
        }}>
          Click on any state to view detailed information
        </div>
      );
    }

    const stateInfo = statesData.find(state => state.StateId === selectedStateId);
    if (!stateInfo) return null;

    return (
      <div style={{
        padding: '25px',
        height: '100%'
      }}>
        <h2 style={{ 
          color: '#076B37', 
          marginBottom: '20px',
          fontSize: '24px',
          fontWeight: '600',
          borderBottom: '2px solid #076B37',
          paddingBottom: '10px'
        }}>
          {stateInfo.State}
        </h2>
        <div style={{ 
          display: 'grid', 
          gap: '15px',
          fontSize: '16px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ 
              backgroundColor: '#f7fafc', 
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ color: '#076B37', marginBottom: '10px', fontSize: '18px' }}>Status</h3>
              <span style={{ color: '#4A5568' }}>{stateInfo.Status}</span>
            </div>
            <div style={{ 
              backgroundColor: '#f7fafc', 
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ color: '#076B37', marginBottom: '10px', fontSize: '18px' }}>Total Seats</h3>
              <span style={{ color: '#4A5568' }}>{stateInfo["Total Seats"]}</span>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: '#f7fafc', 
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ color: '#076B37', marginBottom: '15px', fontSize: '18px' }}>College Distribution</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Government Colleges:</span>
                <span style={{ color: '#4A5568' }}>{stateInfo["Govt. Colleges"]}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Private Colleges:</span>
                <span style={{ color: '#4A5568' }}>{stateInfo["Private Colleges"]}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Deemed Colleges:</span>
                <span style={{ color: '#4A5568' }}>{stateInfo["Deemed Colleges"]}</span>
              </div>
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#f7fafc', 
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ color: '#076B37', marginBottom: '15px', fontSize: '18px' }}>Seat Distribution</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Government Seats:</span>
                <span style={{ color: '#4A5568' }}>{stateInfo["Govt. Seats"]}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Private Seats:</span>
                <span style={{ color: '#4A5568' }}>{stateInfo["Private Seats"]}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Deemed Seats:</span>
                <span style={{ color: '#4A5568' }}>{stateInfo["Deemed Seats"]}</span>
              </div>
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#f7fafc', 
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ color: '#076B37', marginBottom: '15px', fontSize: '18px' }}>Financial Information</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Average Fees/Year:</span>
                <span style={{ color: '#4A5568' }}>{stateInfo["Avg fees per year"]}</span>
              </div>
              {stateInfo["Security Deposit"] !== "-" && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Security Deposit:</span>
                  <span style={{ color: '#4A5568' }}>{stateInfo["Security Deposit"]}</span>
                </div>
              )}
              {stateInfo["Total Budget"] !== "-" && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Budget:</span>
                  <span style={{ color: '#4A5568' }}>{stateInfo["Total Budget"]}</span>
                </div>
              )}
            </div>
          </div>

          {stateInfo["Open Seats"] && stateInfo["Open Seats"] !== "0" && (
            <div style={{ 
              backgroundColor: '#f7fafc', 
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ color: '#076B37', marginBottom: '15px', fontSize: '18px' }}>Open Seats Information</h3>
              <div style={{ color: '#4A5568' }}>{stateInfo["Open Seats"]}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Move filterStateQuotaData before its usage
  // Update filterStateQuotaData to include search functionality
  const filterStateQuotaData = useCallback(() => {
    let results = neetRajData.filter(item => {
      // Apply category and gender filters
      if (filters.category !== 'all' && item.Category !== filters.category) return false;
      if (filters.gender !== 'all' && item.Gender !== filters.gender) return false;
      
      // Apply PG availability filter
      if (filters.pgAvailability !== 'all') {
        const hasPG = item['PG Specializations'] && item['PG Specializations'].trim() !== '';
        if (filters.pgAvailability === 'yes' && !hasPG) return false;
        if (filters.pgAvailability === 'no' && hasPG) return false;
      }
      
      // Apply search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase().trim();
        const collegeName = (item['College Name'] || '').toLowerCase();
        const words = query.split(/\s+/);
        return words.every(word => collegeName.includes(word));
      }
      
      return true;
    });

    // Apply sorting if configured
    if (sortConfig.key) {
      results.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Special handling for NIRF Rankings
        if (sortConfig.key === 'NIRF Ranking') {
          // Convert rankings to numbers, treating non-numeric, "-", "--", "NA" values as infinity
          const isInvalidRank = (val) => !val || val === '--' || val === 'NA' || val === '-' || val.toString().trim() === '';
          aValue = isInvalidRank(aValue) ? Infinity : parseInt(aValue);
          bValue = isInvalidRank(bValue) ? Infinity : parseInt(bValue);
          
          // For NIRF rankings, lower numbers are better
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Handle special cases for other fields
        if (aValue === "--" || aValue === "-" || aValue === "" || aValue === undefined) {
          aValue = sortConfig.direction === 'asc' ? Infinity : -Infinity;
        }
        if (bValue === "--" || bValue === "-" || bValue === "" || bValue === undefined) {
          bValue = sortConfig.direction === 'asc' ? Infinity : -Infinity;
        }

        // Convert to numbers if they're numeric strings
        if (typeof aValue === 'string' && !isNaN(aValue)) aValue = parseInt(aValue);
        if (typeof bValue === 'string' && !isNaN(bValue)) bValue = parseInt(bValue);

        // If both values are strings (like college names), use string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        // Numeric comparison
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
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


  // Add custom components for react-select with checkboxes
  const Option = props => {
    return (
      <div
        {...props.innerProps}
        style={{
          padding: '8px 12px',
          backgroundColor: props.isFocused ? '#f1f5f9' : 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <input
          type="checkbox"
          checked={props.isSelected}
          onChange={() => {}}
          style={{
            width: '16px',
            height: '16px',
            accentColor: '#076B37'
          }}
        />
        <span>{props.label}</span>
      </div>
    );
  };

  const MultiValue = props => {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
          margin: '2px',
          padding: '2px 8px',
          fontSize: '14px'
        }}
      >
        <span style={{ marginRight: '6px' }}>{props.data.label}</span>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            props.removeProps.onClick();
          }}
          style={{
            border: 'none',
            background: 'none',
            padding: '0 2px',
            cursor: 'pointer',
            color: '#64748b',
            fontSize: '14px'
          }}
        >
          ×
        </button>
      </div>
    );
  };

  // Update selectStyles to include new styles for the checkbox dropdown
  const selectStyles = {
    control: (base) => ({
      ...base,
      borderColor: '#e2e8f0',
      borderRadius: '6px',
      minHeight: '40px',
      backgroundColor: 'white',
      padding: '0 4px',
      boxShadow: 'none',
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: '#076B37'
      },
      '&:focus-within': {
        borderColor: '#076B37',
        boxShadow: '0 0 0 1px #076B37'
      }
    }),
    option: () => ({}), // Reset option styles as we're using custom Option component
    multiValue: () => ({}), // Reset multiValue styles as we're using custom MultiValue component
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
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '6px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      zIndex: 999
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
      maxHeight: '250px'
    })
  };

  // Modify filterData to include PG availability filtering
  const filterData = useCallback(() => {
    setIsFiltering(true);
    let results = selectedQuota === 'mgmt' ? neetMgmtData : selectedQuota === 'bds' ? neetBdsData : neetData;

    if (selectedExam === 'NEET') {
      // Handle management seat data format differently
      if (selectedQuota === 'mgmt') {
        // Filter by year
        if (filters.year !== 'all') {
          results = results.filter(item => item.Year === parseInt(filters.year));
        }

        // Filter by category
        if (filters.category !== 'all') {
          results = results.filter(item => item.CATEGORY === filters.category);
        }

        // Filter by gender
        if (filters.gender !== 'all') {
          results = results.filter(item => item.GENDER === filters.gender);
        }

        // Filter by course (MBBS/BDS)
        if (filters.course && filters.course !== 'all') {
          results = results.filter(item => item.Course === filters.course);
        }

        // Filter by search query
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          results = results.filter(item => 
            item['COLLEGE NAME'].toLowerCase().includes(query)
          );
        }
      } else {
        // Add state filtering for non-management data
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

        // Filter by PG availability
        if (filters.pgAvailability !== 'all') {
          results = results.filter(item => {
            const hasPG = item['PG Specializations'] && item['PG Specializations'].trim() !== '';
            return filters.pgAvailability === 'yes' ? hasPG : !hasPG;
          });
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
    URL.revokeObjectURL(url);
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

  // Update toggle function for row expansion to handle single expansion
  const toggleRowExpansion = (index) => {
    setExpandedRows(prev => {
      // If clicking the same row that's already expanded, close it by returning empty set
      if (prev.has(index)) {
        return new Set();
      }
      // If clicking a different row, close the current one and open the new one
      return new Set([index]);
    });
  };

  // Add mobile detection hook
  const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };

      checkIsMobile();
      window.addEventListener('resize', checkIsMobile);

      return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    return isMobile;
  };

  const isMobile = useIsMobile();

  // Update expandedContentStyle to be more responsive
  const expandedContentStyle = {
    backgroundColor: '#f8fafc',
    padding: isMobile ? '16px' : '24px',
    color: '#64748b',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0px',
    borderBottom: '1px solid #e2e8f0',
    width: '100%',
    boxSizing: 'border-box'
  };

  const infoListStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    lineHeight: '1.7',
    fontSize: isMobile ? '12px' : '14px',
    textAlign: 'left',
    flex: '1',
    minWidth: isMobile ? '250px' : '300px',
    boxSizing: 'border-box'
  };

  const infoItemStyle = {
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'flex-start'
  };

  const infoLabelStyle = {
    fontWeight: '700',
    color: '#000',
    fontSize: isMobile ? '12px' : '14px',
    fontFamily: 'Lexend Semibold',
    minWidth: isMobile ? '120px' : '200px',
    marginRight: '8px'
  };

  const infoValueStyle = {
    color: '#000',
    fontSize: isMobile ? '12px' : '14px',
    fontWeight: '400',
    flex: '1'
  };

  const infoHeaderStyle = {
    fontWeight: '700',
    fontSize: isMobile ? '12px' : '14px',
    color: '#000',
    textDecoration: 'underline',
    textAlign: 'center',
    marginBottom: isMobile ? '1rem' : '1.5rem',
    fontFamily: 'Lexend Semibold'
  };

  const pgCoursesContainerStyle = {
    flex: '1',
    minWidth: isMobile ? '250px' : '300px',
    borderLeft: isMobile ? 'none' : '1px solid #e2e8f0',
    borderTop: isMobile ? '1px solid #e2e8f0' : 'none',
    paddingLeft: isMobile ? '0' : '2rem',
    paddingTop: isMobile ? '1rem' : '0',
    marginTop: isMobile ? '1rem' : '0',
    boxSizing: 'border-box'
  };

  const pgCoursesStyle = {
    color: '#475569',
    width: '100%',
    columnCount: isMobile ? 1 : 2
  };

  // Update formatPGCoursesList to improve layout
  const formatPGCoursesList = (coursesList, item) => {
    if (!coursesList) return null;
    
    // Split the courses into an array and clean up
    const courses = coursesList
      .split(/\d+\.\s*/)  // Split by numbers followed by dots
      .filter(Boolean)     // Remove empty strings
      .map(course => course.trim());
    
    return (
      <div style={pgCoursesStyle}>
        <div style={infoHeaderStyle}>
          PG specializations ({item['no. of pg courses']} courses, {item['no. of pg seats']} seats)
        </div>
        <div style={{ 
          color: '#000',
          lineHeight: '1.8',
          textAlign: 'left',
          columnCount: courses.length > 10 ? 2 : 1,  // Two columns if more than 10 courses
          columnGap: '2rem',
          fontSize: '14px'
        }}>
          {courses.map((course, index) => (
            <div key={index} style={{
              breakInside: 'avoid-column',
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '8px'
            }}>
              <span style={{ minWidth: '25px', fontWeight: '600' }}>{index + 1}.</span>
              <span>{course}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Update renderExpandedContent to use new styling
  const renderExpandedContent = (item) => {
    return (
      <div style={expandedContentStyle}>
        <div style={{ flex: '1', maxWidth: '50%' }}>
          <div style={infoHeaderStyle}>Important Information</div>
          <div style={infoListStyle}>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>MBBS Seats</span>
              <span style={infoValueStyle}>{item['Annual Intake (MBBS Seats)']}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Transport</span>
              <span style={infoValueStyle}>{item['Connectivity'] || '-'}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>University Name</span>
              <span style={infoValueStyle}>{item['University Name']}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Management of College</span>
              <span style={infoValueStyle}>{item['Managemet of College']?.toLowerCase()}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>After MBBS Service Bond</span>
              <span style={infoValueStyle}>{item['After MBBS Service Bond']}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Penalty if Service Bond Broken</span>
              <span style={infoValueStyle}>{item['Penalty if Service Bond Broken']}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>MBBS Discontinuation Bond Penalty</span>
              <span style={infoValueStyle}>{item['MBBS Discontinuation Bond Penalty']}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Established Year</span>
              <span style={infoValueStyle}>{item['Est. Year']}</span>
            </div>
          </div>
        </div>
        {item['PG Specializations'] && (
          <div style={pgCoursesContainerStyle}>
            {formatPGCoursesList(item['PG Specializations'], item)}
          </div>
        )}
        {item['Disclaimer'] && (
          <div style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '8px',
            width: '100%',
            fontSize: '12px',
            color: '#64748b',
            fontStyle: 'italic',
            textAlign: 'center'
          }}>
            {item['Disclaimer']}
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

  // Add helper function to format table header text with newlines
  const formatHeaderText = (text) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Add helper function to check if category column should be shown
  const shouldShowCategoryColumn = () => {
    if (selectedQuota === 'mgmt') {
      return filters.category === 'all';
    }
    return filters.category === 'all';
  };

  // Add helper function to check if gender column should be shown
  const shouldShowGenderColumn = () => {
    if (selectedQuota === 'mgmt') {
      return filters.gender === 'all';
    }
    return filters.gender === 'all';
  };

  // Update renderTableHeaders function
  const renderTableHeaders = () => {
    if (selectedExam === 'NEET') {
      if (selectedQuota === 'bds') {
        return (
          <tr>
            <th style={{ width: '40px' }}></th>
            <th>College Name</th>
            <th>City, State</th>
            {shouldShowCategoryColumn() && <th>Category</th>}
            <th 
              onClick={() => handleSort('BDS College Ranking')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <TrophyIcon selectedQuota={selectedQuota} />
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {formatHeaderText(`Round 1\nR1\n(${filters.year})`)}
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {formatHeaderText(`Round 2\nR2\n(${filters.year})`)}
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {formatHeaderText(`Round 3\nR3\n(${filters.year})`)}
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {formatHeaderText(`Round 4\nR4\n(${filters.year})`)}
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {formatHeaderText(`Round 5\nR5\n(${filters.year})`)}
            </th>
            <th 
              onClick={() => handleSort(`Closing\nMax(R1 to R5)\n(${filters.year})`)}
              style={{ cursor: 'pointer', whiteSpace: 'pre-line', textAlign: 'center' }}
            >
              {formatHeaderText(`Closing\nMax(R1 to R5)\n(${filters.year})`)} ↕
            </th>
          </tr>
        );
      } else if (selectedQuota === 'mgmt') {
        // Determine which rounds to show based on year
        const getRoundsForYear = (year) => {
          switch (year) {
            case '2024':
              return ['R1', 'R2', 'R3', 'R4', 'R5'];
            case '2023':
              return ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];
            case '2022':
              return ['R1', 'R2', 'R3', 'R4'];
            default:
              return ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];
          }
        };

        const rounds = getRoundsForYear(filters.year);
        
        return (
          <tr>
            <th style={{ textAlign: 'center', width: '60px' }}>S No.</th>
            <th>College Name</th>
            <th>Course</th>
            {shouldShowCategoryColumn() && <th>Category</th>}
            {shouldShowGenderColumn() && <th>Gender</th>}
            {rounds.map(round => (
              <th key={round} style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
                {round}
              </th>
            ))}
            <th 
              onClick={() => handleSort('CLOSING RANK')}
              style={{ cursor: 'pointer', whiteSpace: 'pre-line', textAlign: 'center', fontWeight: '700' }}
            >
              Closing Rank ↕
            </th>
          </tr>
        );
      } else if (selectedQuota === 'state') {
        return (
          <tr style={{
            backgroundColor: '#1B5431',
            color: 'white',
            textAlign: 'left'
          }}>
            <th style={{ textAlign: 'center', width: '60px', padding: '16px 10px' }}>S No.</th>
            <th style={{ padding: '16px 10px' }}>College Name</th>
            <th 
              onClick={() => handleSort('Est. Year')}
              style={{ 
                cursor: 'pointer', 
                padding: '16px 10px',
                position: 'relative'
              }}
            >
              Est. Year ↕
            </th>
            <th style={{ padding: '16px 10px' }}>City, State</th>
            <th 
              onClick={() => handleSort('NIRF Ranking')}
              style={{ 
                padding: '0',
                textAlign: 'center',
                minWidth: '120px',
                cursor: 'pointer'
              }}
            >
              <TrophyIcon selectedQuota={selectedQuota} />
            </th>
            <th style={{ padding: '16px 10px' }}>Raj. Rank</th>
            {shouldShowCategoryColumn() && <th style={{ padding: '16px 10px' }}>Category</th>}
            {shouldShowGenderColumn() && <th style={{ padding: '16px 10px' }}>Gender</th>}
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>
              {formatHeaderText('Round 1\nR1')}
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>
              {formatHeaderText('Round 2\nR2')}
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>
              {formatHeaderText('Round 3\nR3')}
            </th>
            <th 
              onClick={() => handleSort(`Closing\nMax(R1, R2, R3)\n(${filters.year})`)}
              style={{ 
                cursor: 'pointer', 
                whiteSpace: 'pre-line', 
                textAlign: 'center', 
                padding: '16px 10px',
                position: 'relative'
              }}
            >
              {formatHeaderText('Closing\nMax(R1, R2, R3)')} ↕
            </th>
          </tr>
        );
      } else {
        // MBBS All India Quota headers
        return (
          <tr>
            <th style={{ textAlign: 'center', width: '60px' }}>S No.</th>
            <th>College Name</th>
            <th 
              onClick={() => handleSort('Est. Year')}
              style={{ 
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              Est. Year ↕
            </th>
            <th>City, State</th>
            {shouldShowCategoryColumn() && <th>Category</th>}
            <th 
              onClick={() => handleSort('NIRF Ranking')}
              style={{ 
                padding: '0',
                minWidth: '120px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <TrophyIcon selectedQuota={selectedQuota} />
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {formatHeaderText('Round 1\nR1')}
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {formatHeaderText('Round 2\nR2')}
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {formatHeaderText('MoP Up\nR3')}
            </th>
            <th 
              onClick={() => handleSort(`Closing\nMax(R1, R2, R3)\n(${filters.year})`)}
              style={{ cursor: 'pointer', whiteSpace: 'pre-line', textAlign: 'center' }}
            >
              {formatHeaderText('Closing\nMax(R1, R2, R3)')} ↕
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {formatHeaderText('Stray\nR4')}
            </th>
            <th style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
              {formatHeaderText('Special Stray\nR5')}
            </th>
            <th 
              onClick={() => handleSort(`Closing\nMax(R1 to R5)\n(${filters.year})`)}
              style={{ cursor: 'pointer', whiteSpace: 'pre-line', textAlign: 'center' }}
            >
              {formatHeaderText('Closing\nMax(R1 to R5)')} ↕
            </th>
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
      <div style={{ marginBottom: '20px' }}>
        <Select
          value={STATE_SELECT_OPTIONS.find(option => option.value === selectedStateId)}
          onChange={(selectedOption) => setSelectedStateId(selectedOption.value)}
          options={STATE_SELECT_OPTIONS}
          placeholder="Select a state"
          className="state-filter-select"
          styles={{
            control: (base) => ({
              ...base,
              minWidth: '250px',
              borderColor: '#ccc',
              '&:hover': {
                borderColor: '#076B37'
              }
            }),
            option: (base, { isFocused, isSelected }) => ({
              ...base,
              backgroundColor: isSelected ? '#076B37' : isFocused ? '#e6f0eb' : null,
              color: isSelected ? 'white' : 'black'
            })
          }}
        />
      </div>
    );
  };

  // Function to get the AIR value based on round and year
  const getRoundValue = (item, round, year) => {
    const key = `${year} R${round} AIR`;
    return item[key] || '-';
  };

  // Function to render state quota headers
  const renderStateQuotaHeaders = () => {
    return (
      <tr style={{
        backgroundColor: '#1B5431',
        color: 'white',
        textAlign: 'left'
      }}>
        <th style={{ textAlign: 'center', width: '60px', padding: '16px 10px' }}>S No.</th>
        <th style={{ padding: '16px 10px' }}>College Name</th>
        <th 
          onClick={() => handleSort('Est. Year')}
          style={{ 
            cursor: 'pointer', 
            padding: '16px 10px',
            position: 'relative'
          }}
        >
          Est. Year ↕
        </th>
        <th style={{ padding: '16px 10px' }}>City, State</th>
        <th 
        onClick={() => handleSort('NIRF Ranking')}
        style={{ 
          padding: '0',
          textAlign: 'center',
          minWidth: '120px',
          cursor: 'pointer'
        }}>
          <TrophyIcon selectedQuota={selectedQuota} />
        </th>
        <th style={{ padding: '16px 10px' }}>Raj. Rank</th>
        {shouldShowCategoryColumn() && <th style={{ padding: '16px 10px' }}>Category</th>}
        {shouldShowGenderColumn() && <th style={{ padding: '16px 10px' }}>Gender</th>}
        <th style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>
          {formatHeaderText('Round 1\nR1')}
        </th>
        <th style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>
          {formatHeaderText('Round 2\nR2')}
        </th>
        <th style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>
          {formatHeaderText('Round 3\nR3')}
        </th>
        <th 
          onClick={() => handleSort(`Closing\nMax(R1, R2, R3)\n(${filters.year})`)}
          style={{ 
            cursor: 'pointer', 
            whiteSpace: 'pre-line', 
            textAlign: 'center', 
            padding: '16px 10px',
            position: 'relative'
          }}
        >
          {formatHeaderText('Closing\nMax(R1, R2, R3)')} ↕
        </th>
      </tr>
    );
  };

  // Function to render state quota row
  const renderStateQuotaRow = (item, index) => {
    const isExpanded = expandedRows.has(index);
    const startIndex = (currentPage - 1) * pageSize;
    const serialNumber = startIndex + index + 1;
    
    return (
      <React.Fragment key={index}>
        <tr 
          className={isExpanded ? 'expanded-row' : ''} 
          onClick={() => toggleRowExpansion(index)}
          style={{ 
            cursor: 'pointer',
            backgroundColor: 'white',
            borderBottom: isExpanded ? 'none' : '1px solid #e2e8f0',
            position: 'relative'
          }}
        >
          <td style={{ textAlign: 'center', padding: '16px 10px' }}>{serialNumber}</td>
          <td style={{ position: 'relative', maxWidth: '400px', padding: '16px 10px' }}>{renderCollegeNameCell(item)}</td>
          <td style={{ padding: '16px 10px' }}>{item['Est. Year'] || '-'}</td>
          <td style={{ padding: '16px 10px' }}>{item['City, State']}</td>
          <td style={{ padding: '16px 10px', textAlign: 'center' }}>{item['NIRF Ranking']}</td>
          <td style={{ padding: '16px 10px' }}>{item['Rajasthan College Ranking']}</td>
          {shouldShowCategoryColumn() && <td style={{ padding: '16px 10px' }}>{item.Category}</td>}
          {shouldShowGenderColumn() && <td style={{ padding: '16px 10px' }}>{item.Gender}</td>}
          <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>{formatCellText(item[`Round 1\nR1\n(${filters.year})`])}</td>
          <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>{formatCellText(item[`Round 2\nR2\n(${filters.year})`])}</td>
          <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>{formatCellText(item[`Round 3\nR3\n(${filters.year})`])}</td>
          <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px', fontWeight: '700', fontFamily: 'Lexend Bold' }}>{formatCellText(item[`Closing\nMax(R1, R2, R3)\n(${filters.year})`])}</td>
        </tr>
        {isExpanded && (
          <tr style={{ backgroundColor: '#f8fafc' }}>
            <td colSpan={getColSpan()} style={{ padding: 0, border: 'none' }}>
              {renderExpandedContent(item)}
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  // Add sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    // For state quota, trigger a re-render which will use the new sortConfig in filterStateQuotaData
    if (selectedExam === 'NEET' && selectedQuota === 'state') {
      setIsFiltering(true); // Show loading state
      setTimeout(() => {
        setIsFiltering(false);
      }, 100);
      return;
    }

    // For all other cases, sort the filtered data directly
    const sortedData = [...filteredData].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      // Special handling for NIRF and BDS College Rankings
      if (key === 'NIRF Ranking' || key === 'BDS College Ranking') {
        aValue = !aValue || aValue === '--' || aValue === 'NA' ? Infinity : parseInt(aValue);
        bValue = !bValue || bValue === '--' || bValue === 'NA' ? Infinity : parseInt(bValue);
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Special handling for management seat CLOSING RANK
      if (key === 'CLOSING RANK') {
        aValue = !aValue || aValue === '--' || aValue === 'NA' || aValue === 0 ? Infinity : parseInt(aValue);
        bValue = !bValue || bValue === '--' || bValue === 'NA' || bValue === 0 ? Infinity : parseInt(bValue);
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle special cases like "--" or empty values
      if (aValue === "--" || aValue === "" || aValue === undefined || aValue === "N/A") aValue = direction === 'asc' ? Infinity : -Infinity;
      if (bValue === "--" || bValue === "" || bValue === undefined || bValue === "N/A") bValue = direction === 'asc' ? Infinity : -Infinity;

      // Convert to numbers if they're numeric strings
      if (typeof aValue === 'string' && !isNaN(aValue)) aValue = parseInt(aValue);
      if (typeof bValue === 'string' && !isNaN(bValue)) bValue = parseInt(bValue);

      // If both values are strings (like college names), use string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      // Numeric comparison
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
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
        'Round 1': item[`Round 1\nR1\n(${filters.year})`] || '-',
        'Round 2': item[`Round 2\nR2\n(${filters.year})`] || '-',
        'Round 3': item[`Round 3\nR3\n(${filters.year})`] || '-',
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
        'Round 1': item[`Round 1\nR1\n(${filters.year})`] || '-',
        'Round 2': item[`Round 2\nR2\n(${filters.year})`] || '-',
        'Mop Up': item[`MoP Up\nR3\n(${filters.year})`] || '-',
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

  // Update renderCollegeNameCell to handle both AIQ and state quota
  const renderCollegeNameCell = (item, hideDetails = false) => {
    const hasPG = item['PG Specializations'] && item['PG Specializations'].trim() !== '';
    const hasBond = item['After MBBS Service Bond'] && 
                   !(item['After MBBS Service Bond'].toLowerCase().includes('no') || 
                     item['After MBBS Service Bond'] === '');

    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isMobile ? '4px' : '8px',
        minHeight: isMobile ? '40px' : '60px',
        position: 'relative'
      }}>
        <div style={{ 
          fontSize: isMobile ? '12px' : '14px',
          fontWeight: '600', 
          color: '#000',
          fontFamily: 'Lexend Semibold',
          textAlign: 'left',
          lineHeight: '1.4'
        }}>
          {item['College Name']}
        </div>
        {!hideDetails && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isMobile ? '2px' : '4px', 
          fontSize: isMobile ? '10px' : '12px',
          color: '#4B5563'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Service Bond after MBBS</span>
            {hasBond ? (
              <span style={{ color: '#22c55e', fontWeight: '600' }}>✅</span>
            ) : (
              <span style={{ color: '#ef4444', fontWeight: '600' }}>❌</span>
                )}
              </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>PG Availability</span>
            {hasPG ? (
              <span style={{ color: '#22c55e', fontWeight: '600' }}>✅</span>
            ) : (
              <span style={{ color: '#ef4444', fontWeight: '600' }}>❌</span>
            )}
          </div>
        </div>
          )}
        {!hideDetails && (

        <div style={{ 
          position: 'absolute',
          right: isMobile ? '8px' : '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: isMobile ? '10px' : '12px',
          color: '#6366F1',
          cursor: 'pointer',
          padding: isMobile ? '2px 4px' : '4px 8px',
          borderRadius: '4px',
          transition: 'all 0.2s ease'
        }}>
          view details
        </div>
        )}
      </div>
    );
  };

  // Add helper function to calculate max closing rank
  const calculateMaxClosingRank = (item, rounds, year) => {
    const values = rounds.map(round => {
      const value = item[`${round}\n(${year})`];
      return value === '--' || value === '' ? -1 : parseInt(value);
    }).filter(val => val !== -1);
    
    return values.length > 0 ? Math.max(...values) : '--';
  };

  // Update renderTableRow function
  const renderTableRow = (item, index) => {
    const isExpanded = expandedRows.has(index);
    const startIndex = (currentPage - 1) * pageSize;
    const serialNumber = startIndex + index + 1;

    // Calculate max closing ranks
    const maxR1toR3 = calculateMaxClosingRank(item, ['Round 1\nR1', 'Round 2\nR2', 'MoP Up\nR3'], filters.year);
    const maxR1toR5 = calculateMaxClosingRank(item, ['Round 1\nR1', 'Round 2\nR2', 'MoP Up\nR3', 'Stray\nR4', 'Special Stray\nR5'], filters.year);
    
    return (
      <React.Fragment key={index}>
        <tr
          onClick={() => toggleRowExpansion(index)}
          className={isExpanded && selectedQuota!= 'bds' && selectedQuota!= 'mgmt' ? 'expanded-row' : ''} 
          style={{ padding:'0px 10px', cursor: 'pointer' }}
        >
          {selectedExam === 'NEET' ? (
            selectedQuota === 'bds' ? (
              <>
                <td style={{ textAlign: 'center' }}>{serialNumber}</td>
                <td style={{ position: 'relative', maxWidth: '400px' , padding: '16px 10px'}}>{renderCollegeNameCell(item, true)}</td>
                <td>{item['City, State']}</td>
                {shouldShowCategoryColumn() && <td>{item.Category}</td>}
                <td style={{ textAlign: 'center' }}>{item['BDS College Ranking']}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>{formatCellText(item[`Round 1\nR1\n(${filters.year})`])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>{formatCellText(item[`Round 2\nR2\n(${filters.year})`])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>{formatCellText(item[`Round 3\nR3\n(${filters.year})`])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>{formatCellText(item[`Round 4\nR4\n(${filters.year})`])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>{formatCellText(item[`Round 5\nR5\n(${filters.year})`])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px', fontWeight: '700', fontFamily: 'Lexend Bold' }}>{formatCellText(item[`Closing\nMax(R1 to R5)\n(${filters.year})`])}</td>
              </>
            ) : selectedQuota === 'mgmt' ? (
              <>
                <td style={{ textAlign: 'center' }}>{serialNumber}</td>
                <td style={{ position: 'relative', maxWidth: '400px', padding: '16px 10px' }}>{item['COLLEGE NAME']}</td>
                <td style={{ padding: '16px 10px' }}>{item.Course}</td>
                {shouldShowCategoryColumn() && <td style={{ padding: '16px 10px' }}>{item.CATEGORY}</td>}
                {shouldShowGenderColumn() && <td style={{ padding: '16px 10px' }}>{item.GENDER}</td>}
                {(() => {
                  // Determine which rounds to show based on year
                  const getRoundsForYear = (year) => {
                    switch (year) {
                      case '2024':
                        return ['R1', 'R2', 'R3', 'R4', 'R5'];
                      case '2023':
                        return ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];
                      case '2022':
                        return ['R1', 'R2', 'R3', 'R4'];
                      default:
                        return ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];
                    }
                  };
                  
                  const rounds = getRoundsForYear(filters.year);
                  
                  return rounds.map(round => (
                    <td key={round} style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>
                      {formatCellText(item[round])}
                    </td>
                  ));
                })()}
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px', fontWeight: '700', fontFamily: 'Lexend Bold' }}>{formatCellText(item['CLOSING RANK'])}</td>
              </>
            ) : selectedQuota === 'state' ? (
              renderStateQuotaRow(item, index)
            ) : (
              // MBBS All India Quota row
              <>
                <td style={{ textAlign: 'center' }}>{serialNumber}</td>
                <td style={{ position: 'relative', maxWidth: '400px' , padding: '16px 10px'}}>{renderCollegeNameCell(item)}</td>
                <td>{item['Est. Year'] || '-'}</td>
                <td>{item['City, State']}</td>
                {shouldShowCategoryColumn() && <td style={{ padding: '16px 10px' }}>{item.Category}</td>}
                <td style={{ padding: '16px 10px' }}>{item['NIRF Ranking']}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>{formatCellText(item[`Round 1\nR1\n(${filters.year})`])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>{formatCellText(item[`Round 2\nR2\n(${filters.year})`])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>{formatCellText(item[`MoP Up\nR3\n(${filters.year})`])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px', fontWeight: '700', fontFamily: 'Lexend Bold' }}>{maxR1toR3}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>{formatCellText(item[`Stray\nR4\n(${filters.year})`])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px' }}>{formatCellText(item[`Special Stray\nR5\n(${filters.year})`])}</td>
                <td style={{ whiteSpace: 'pre-line', textAlign: 'center', padding: '16px 10px', fontWeight: '700', fontFamily: 'Lexend Bold' }}>{maxR1toR5}</td>
              </>
            )
          ) :<></>}
        </tr>
        {isExpanded && selectedQuota!= 'bds' && selectedQuota!= 'mgmt' && (
          <tr>
            <td colSpan={getColSpan()}>
              {renderExpandedContent(item)}
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
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '16px' : '24px',
        padding: isMobile ? '16px' : '20px'
      }}>
        {/* College Search Input */}
        <div style={{ gridColumn: isMobile ? '1' : 'span 3' }}>
          <label className="filter-label">Search Colleges</label>
          <input
            type="text"
            placeholder="Type to search colleges..."
            className="search-input"
            value={inputValues.searchQuery}
            onChange={(e) => handleInputChange('searchQuery', e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '8px 12px' : '10px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              fontSize: isMobile ? '16px' : '14px',
              minHeight: isMobile ? '44px' : '42px',
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
              padding: isMobile ? '8px 12px' : '10px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              fontSize: isMobile ? '16px' : '14px',
              minHeight: isMobile ? '44px' : '42px',
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
              padding: isMobile ? '8px 12px' : '10px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              fontSize: isMobile ? '16px' : '14px',
              minHeight: isMobile ? '44px' : '42px',
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
              padding: isMobile ? '8px 12px' : '10px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              fontSize: isMobile ? '16px' : '14px',
              minHeight: isMobile ? '44px' : '42px',
              backgroundColor: 'white'
            }}
          >
            <option value="all">All</option>
            <option value="Boys">Boys</option>
            <option value="Girls">Girls</option>
          </select>
        </div>

        {/* PG Availability Filter */}
        <div>
          <label className="filter-label">PG Availability</label>
          <select
            className="filter-select"
            value={filters.pgAvailability}
            onChange={(e) => handleFilterChange('pgAvailability', e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '8px 12px' : '10px',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              fontSize: isMobile ? '16px' : '14px',
              minHeight: isMobile ? '44px' : '42px',
              backgroundColor: 'white'
            }}
          >
            <option value="all">All</option>
            <option value="yes">With PG</option>
            <option value="no">Without PG</option>
          </select>
        </div>
      </div>
    );
  };

  // Add quota selection buttons for NEET
  const renderQuotaSelection = () => {
    if (selectedExam !== 'NEET') return null;
    
    return (
      <div className="quota-selector" style={{ 
        marginTop: '20px', 
        marginBottom: '20px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '0.5rem' : '0.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          className={`quota-button ${selectedQuota === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedQuota('all')}
          style={{
            padding: isMobile ? '0.75rem 1rem' : '10px 20px',
            marginRight: isMobile ? '0' : '10px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: selectedQuota === 'all' ? '#076B37' : 'white',
            color: selectedQuota === 'all' ? 'white' : '#1e293b',
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto',
            fontSize: isMobile ? '0.875rem' : 'inherit',
            textAlign: isMobile ? 'center' : 'left'
          }}
        >
          MBBS All India Quota
        </button>
        <button
          className={`quota-button ${selectedQuota === 'state' ? 'active' : ''}`}
          onClick={() => setSelectedQuota('state')}
          style={{
            padding: isMobile ? '0.75rem 1rem' : '10px 20px',
            marginRight: isMobile ? '0' : '10px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: selectedQuota === 'state' ? '#076B37' : 'white',
            color: selectedQuota === 'state' ? 'white' : '#1e293b',
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto',
            fontSize: isMobile ? '0.875rem' : 'inherit',
            textAlign: isMobile ? 'center' : 'left'
          }}
        >
          Rajasthan State Counselling (Govt Seat)
        </button>
        <button
          className={`quota-button ${selectedQuota === 'bds' ? 'active' : ''}`}
          onClick={() => setSelectedQuota('bds')}
          style={{
            padding: isMobile ? '0.75rem 1rem' : '10px 20px',
            marginRight: isMobile ? '0' : '10px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: selectedQuota === 'bds' ? '#076B37' : 'white',
            color: selectedQuota === 'bds' ? 'white' : '#1e293b',
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto',
            fontSize: isMobile ? '0.875rem' : 'inherit',
            textAlign: isMobile ? 'center' : 'left'
          }}
        >
          BDS All India
        </button>
        <button
          className={`quota-button ${selectedQuota === 'mgmt' ? 'active' : ''}`}
          onClick={() => setSelectedQuota('mgmt')}
          style={{
            padding: isMobile ? '0.75rem 1rem' : '10px 20px',
            marginRight: isMobile ? '0' : '10px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: selectedQuota === 'mgmt' ? '#076B37' : 'white',
            color: selectedQuota === 'mgmt' ? 'white' : '#1e293b',
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto',
            fontSize: isMobile ? '0.875rem' : 'inherit',
            textAlign: isMobile ? 'center' : 'left'
          }}
        >
          Rajasthan State counseling (Semi Govt Seat)
        </button>
        <button
          className={`quota-button ${selectedQuota === 'private' ? 'active' : ''}`}
          onClick={() => setSelectedQuota('private')}
          style={{
            padding: isMobile ? '0.75rem 1rem' : '10px 20px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: selectedQuota === 'private' ? '#076B37' : 'white',
            color: selectedQuota === 'private' ? 'white' : '#1e293b',
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto',
            fontSize: isMobile ? '0.875rem' : 'inherit',
            textAlign: isMobile ? 'center' : 'left'
          }}
        >
          Private Colleges
        </button>
      </div>
    );
  };

  // Add helper function to calculate colspan based on current view and filters
  const getColSpan = () => {
    if (selectedExam === 'NEET') {
      if (selectedQuota === 'bds') {
        return shouldShowCategoryColumn() ? 11 : 10;
      } else if (selectedQuota === 'mgmt') {
        // Calculate rounds based on year
        const getRoundsForYear = (year) => {
          switch (year) {
            case '2024':
              return 5; // R1-R5
            case '2023':
              return 7; // R1-R7
            case '2022':
              return 4; // R1-R4
            default:
              return 7; // R1-R7
          }
        };
        
        let baseCount = 3; // S.No, College Name, Course
        if (shouldShowCategoryColumn()) baseCount++;
        if (shouldShowGenderColumn()) baseCount++;
        baseCount += getRoundsForYear(filters.year); // Add rounds
        baseCount += 1; // Add Closing Rank
        return baseCount;
      } else if (selectedQuota === 'state') {
        let baseCount = 10; // Base count without category and gender
        if (shouldShowCategoryColumn()) baseCount++;
        if (shouldShowGenderColumn()) baseCount++;
        return baseCount;
      } else {
        return shouldShowCategoryColumn() ? 13 : 12;
      }
    }
    let baseCount = 9;
    if (shouldShowColumn.seat) baseCount++;
    if (shouldShowColumn.gender) baseCount++;
    if (filters.counsellingType === 'CSAB') baseCount++;
    return baseCount;
  };

  // Add helper function to get total results count
  const getTotalResults = () => {
    if (selectedExam === 'NEET' && selectedQuota === 'state') {
      return filterStateQuotaData().length;
    }
    return filteredData.length;
  };

  // Function to render filters for management seats
  const renderManagementFilters = () => {
    return (
      <div className="filters-grid" style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr',
        gap: isMobile ? '16px' : '16px',
        padding: isMobile ? '16px' : '16px',
        alignItems: 'start',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
      }}>
        {/* Search Input */}
        <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
          <label className="filter-label" style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: isMobile ? '14px' : '14px',
            fontWeight: '500',
            color: '#1e293b'
          }}>Search Colleges</label>
          <input
            type="text"
            placeholder="Type to search colleges..."
            className="search-input"
            value={inputValues.searchQuery}
            onChange={(e) => handleInputChange('searchQuery', e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '8px 12px' : '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: isMobile ? '16px' : '14px',
              minHeight: isMobile ? '44px' : '40px',
              backgroundColor: '#fff',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
          />
        </div>

        {/* Course Filter */}
        <div>
          <label className="filter-label" style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: isMobile ? '14px' : '14px',
            fontWeight: '500',
            color: '#1e293b'
          }}>Course</label>
          <select
            className="filter-select"
            value={filters.course}
            onChange={(e) => handleFilterChange('course', e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '8px 12px' : '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: isMobile ? '16px' : '14px',
              minHeight: isMobile ? '44px' : '40px',
              backgroundColor: '#fff',
              transition: 'all 0.2s ease',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Courses</option>
            <option value="MBBS">MBBS</option>
            <option value="BDS">BDS</option>
          </select>
        </div>

        {/* Year Filter */}
        <div>
          <label className="filter-label" style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: isMobile ? '14px' : '14px',
            fontWeight: '500',
            color: '#1e293b'
          }}>Year</label>
          <select
            className="filter-select"
            value={filters.year}
            onChange={(e) => handleFilterChange('year', e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '8px 12px' : '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: isMobile ? '16px' : '14px',
              minHeight: isMobile ? '44px' : '40px',
              backgroundColor: '#fff',
              transition: 'all 0.2s ease',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="filter-label" style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: isMobile ? '14px' : '14px',
            fontWeight: '500',
            color: '#1e293b'
          }}>Category</label>
          <select
            className="filter-select"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '8px 12px' : '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: isMobile ? '16px' : '14px',
              minHeight: isMobile ? '44px' : '40px',
              backgroundColor: '#fff',
              transition: 'all 0.2s ease',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Categories</option>
            <option value="GEN">General</option>
            <option value="OBC">OBC</option>
            <option value="EWS">EWS</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
            <option value="STA">STA</option>
          </select>
        </div>

        {/* Gender Filter */}
        <div>
          <label className="filter-label" style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: isMobile ? '14px' : '14px',
            fontWeight: '500',
            color: '#1e293b'
          }}>Gender</label>
          <select
            className="filter-select"
            value={filters.gender}
            onChange={(e) => handleFilterChange('gender', e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '8px 12px' : '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: isMobile ? '16px' : '14px',
              minHeight: isMobile ? '44px' : '40px',
              backgroundColor: '#fff',
              transition: 'all 0.2s ease',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>
    );
  };

  // Add this new function
  const renderIndiaMap = () => {
    return (
      <div className="map-container">
        {/* Add state filter dropdown */}
        <div className="state-filter-container">
          <Select
            value={STATE_SELECT_OPTIONS.find(option => option.value === selectedStateId)}
            onChange={(selectedOption) => {
              setSelectedStateId(selectedOption.value);
              loadExcelFile(selectedOption.value);
            }}
            options={STATE_SELECT_OPTIONS}
            placeholder="Select a state"
            className="state-filter-select"
            styles={{
              control: (base) => ({
                ...base,
                minWidth: '250px',
                borderColor: '#ccc',
                '&:hover': {
                  borderColor: '#076B37'
                }
              }),
              option: (base, { isFocused, isSelected }) => ({
                ...base,
                backgroundColor: isSelected ? '#076B37' : isFocused ? '#e6f0eb' : base.backgroundColor,
                color: isSelected ? 'white' : base.color,
                '&:active': {
                  backgroundColor: '#076B37'
                }
              })
            }}
          />
        </div>
        
        <div className="map-section">
          <div className="map-wrapper">
            <IndiaMap
              onMouseMove={(e, stateId) => handleStateHover(e, stateId)}
              onMouseOut={handleStateLeave}
              onClick={(stateId) => {
                setSelectedStateId(stateId);
                loadExcelFile(stateId);
              }}
              selectedStateId={selectedStateId}
            />
            {hoveredState && (
              <div
                className="tooltip"
                style={{
                  position: 'fixed',
                  left: mousePosition.x + 10,
                  top: mousePosition.y + 10,
                  backgroundColor: 'white',
                  padding: '8px',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  zIndex: 1000
                }}
              >
                {statesData[hoveredState]?.name || hoveredState}
              </div>
            )}
          </div>
          {renderStateDetails()}
        </div>
        {excelData && renderExcelTable()}
      </div>
    );
  };

  // Add state data mapping
  const stateData = {
    'AP': {
      name: 'Andhra Pradesh',
      privateColleges: 28,
      totalSeats: 4200
    },
    'KA': {
      name: 'Karnataka',
      privateColleges: 35,
      totalSeats: 5250
    },
    'TN': {
      name: 'Tamil Nadu',
      privateColleges: 25,
      totalSeats: 3750
    },
    // Add data for other states similarly
  };

  const renderStateInfoBox = () => {
    if (!hoveredState) return null;
    
    const stateInfo = statesData.find(state => state.StateId === hoveredState);
    if (!stateInfo) return null;

    return (
      <div style={{
        position: 'fixed',
        left: mousePosition.x + 20,
        top: mousePosition.y + 20,
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '15px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        maxWidth: '300px',
        fontSize: '14px'
      }}>
        <h3 style={{ 
          color: '#076B37', 
          marginBottom: '10px',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          {stateInfo.State}
        </h3>
        <div style={{ display: 'grid', gap: '8px' }}>
          <div>Status: <span style={{ color: '#4A5568' }}>{stateInfo.Status}</span></div>
          <div>Total Colleges: <span style={{ color: '#4A5568' }}>{stateInfo["Total Colleges"]}</span></div>
          <div>Private Colleges: <span style={{ color: '#4A5568' }}>{stateInfo["Private Colleges"]}</span></div>
          <div>Private Seats: <span style={{ color: '#4A5568' }}>{stateInfo["Private Seats"]}</span></div>
          <div>Avg fees/year: <span style={{ color: '#4A5568' }}>{stateInfo["Avg fees per year"]}</span></div>
          {stateInfo["Security Deposit"] !== "-" && (
            <div>Security Deposit: <span style={{ color: '#4A5568' }}>{stateInfo["Security Deposit"]}</span></div>
          )}
        </div>
      </div>
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
          padding: isMobile ? '1rem' : '2rem',
          background: '#f8fafc'
        }}>
          <div style={{
            background: 'white',
            padding: isMobile ? '2rem' : '3rem',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            width: '100%',
            maxWidth: isMobile ? '100%' : '600px',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: isMobile ? '2rem' : '2.5rem',
              color: '#1e293b',
              marginBottom: '1rem',
              fontWeight: '600'
            }}>Select Exam Type</h1>
            
            <p style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              color: '#64748b',
              marginBottom: '2rem',
              lineHeight: '1.5'
            }}>
              Choose the exam type to view relevant college and counselling information
            </p>

            <div style={{ 
              display: 'flex', 
              gap: isMobile ? '1rem' : '1.5rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button 
                onClick={() => handleExamSelect('IIT')}
                style={{
                  padding: isMobile ? '1rem 2rem' : '1.25rem 2.5rem',
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#076B37',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: isMobile ? '100%' : '200px',
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
                  padding: isMobile ? '1rem 2rem' : '1.25rem 2.5rem',
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#076B37',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: isMobile ? '100%' : '200px',
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
            <div className="exam-selector" style={{
              display: 'flex',
              gap: isMobile ? '0.5rem' : '1rem',
              marginBottom: isMobile ? '1rem' : '2rem',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button
                className={`exam-button ${selectedExam === 'NEET' ? 'active' : ''}`}
                onClick={() => handleExamSelect('NEET')}
                style={{
                  padding: isMobile ? '0.75rem 1rem' : '10px',
                  fontSize: isMobile ? '0.875rem' : '13px',
                  fontWeight: '600',
                  border: '2px solid #1B5431',
                  borderRadius: '8px',
                  backgroundColor: selectedExam === 'NEET' ? '#1B5431' : 'transparent',
                  color: selectedExam === 'NEET' ? 'white' : '#1B5431',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: isMobile ? '100%' : '80px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                NEET
              </button>
              <button
                className={`exam-button ${selectedExam === 'IIT' ? 'active' : ''}`}
                onClick={() => handleExamSelect('IIT')}
                style={{
                  padding: isMobile ? '0.75rem 1rem' : '10px',
                  fontSize: isMobile ? '0.875rem' : '13px',
                  fontWeight: '600',
                  border: '2px solid #1B5431',
                  borderRadius: '8px',
                  backgroundColor: selectedExam === 'IIT' ? '#1B5431' : 'transparent',
                  color: selectedExam === 'IIT' ? 'white' : '#1B5431',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: isMobile ? '100%' : '80px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                IIT JEE
              </button>
            </div>

            {selectedExam === 'NEET'}

            {renderQuotaSelection()}

            {renderIndiaMap()}

            <div className="search-card" style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: isMobile ? '1rem' : '1.5rem',
              marginBottom: isMobile ? '1rem' : '2rem'
            }}>
              <h2 className="card-title" style={{
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: isMobile ? '0.75rem' : '1rem'
              }}>Search & Filters</h2>
              {selectedExam === 'NEET' && selectedQuota === 'state' ? (
                <>
                <StateWiseDashboard title="Rajasthan Medical Colleges And MBBS Seats" />
                {renderStateQuotaFilters()}
                </>
              ) : selectedQuota === 'mgmt' ? (
                <>
                <StateWiseDashboard title="Rajasthan Medical Colleges And MBBS Seats" />
                {renderManagementFilters()}
                </>
              ) : selectedQuota === 'bds' ? (
                // Special layout for BDS view
                <div className="filters-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr',
                  gap: isMobile ? '16px' : '16px',
                  padding: isMobile ? '16px' : '16px',
                  alignItems: 'start',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
                }}>
                  {/* Search Input */}
                  <div>
                    <label className="filter-label" style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: isMobile ? '14px' : '14px',
                      fontWeight: '500',
                      color: '#1e293b'
                    }}>Search Colleges/Location</label>
                    <input
                      type="text"
                      placeholder="Type to search colleges or location..."
                      className="search-input"
                      value={inputValues.searchQuery}
                      onChange={(e) => handleInputChange('searchQuery', e.target.value)}
                      style={{
                        width: '100%',
                        padding: isMobile ? '8px 12px' : '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px',
                        minHeight: isMobile ? '44px' : '40px',
                        backgroundColor: '#fff',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="filter-label" style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: isMobile ? '14px' : '14px',
                      fontWeight: '500',
                      color: '#1e293b'
                    }}>Category</label>
                    <select
                      className="filter-select"
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      style={{
                        width: '100%',
                        padding: isMobile ? '8px 12px' : '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px',
                        minHeight: isMobile ? '44px' : '40px',
                        backgroundColor: '#fff',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        cursor: 'pointer'
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

                  {/* Year Filter */}
                  <div>
                    <label className="filter-label" style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: isMobile ? '14px' : '14px',
                      fontWeight: '500',
                      color: '#1e293b'
                    }}>Year</label>
                    <select
                      className="filter-select"
                      value={filters.year}
                      onChange={(e) => handleFilterChange('year', e.target.value)}
                      style={{
                        width: '100%',
                        padding: isMobile ? '8px 12px' : '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px',
                        minHeight: isMobile ? '44px' : '40px',
                        backgroundColor: '#fff',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                    </select>
                  </div>
                </div>
              ) : (
                // Regular layout for MBBS views
                <>
                <MedicalCollegesDashboard title="Medical Colleges And MBBS Seats" />
                <div className="filters-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: isMobile ? '16px' : '24px',
                  padding: isMobile ? '16px' : '20px'
                }}>
                  {/* Search Input */}
                  <div style={{ gridColumn: isMobile ? '1' : '1' }}>
                    <label className="filter-label">Search Colleges/Location</label>
                    <input
                      type="text"
                      placeholder="Type to search colleges or location..."
                      className="search-input"
                      value={inputValues.searchQuery}
                      onChange={(e) => handleInputChange('searchQuery', e.target.value)}
                      style={{
                        width: '100%',
                        padding: isMobile ? '8px 12px' : '10px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px',
                        minHeight: isMobile ? '44px' : '42px'
                      }}
                    />
                  </div>

                  {/* State Filter - Only show for All India MBBS quota */}
                  {selectedQuota === 'all' && (
                    <div style={{ gridColumn: isMobile ? '1' : '2' }}>
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
                        components={{ Option, MultiValue }}
                        placeholder="Select states..."
                        className="basic-multi-select"
                        classNamePrefix="select"
                        closeMenuOnSelect={false}
                        hideSelectedOptions={false}
                      />
                    </div>
                  )}

                  {/* Category Filter */}
                  <div style={{ gridColumn: isMobile ? '1' : '3' }}>
                    <label className="filter-label">Category</label>
                    <select
                      className="filter-select"
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      style={{
                        width: '100%',
                        padding: isMobile ? '8px 12px' : '10px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px',
                        minHeight: isMobile ? '44px' : '42px',
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

                  {/* PG Availability Filter */}
                  <div style={{ gridColumn: isMobile ? '1' : '1' }}>
                    <label className="filter-label">PG Availability</label>
                    <select
                      className="filter-select"
                      value={filters.pgAvailability}
                      onChange={(e) => handleFilterChange('pgAvailability', e.target.value)}
                      style={{
                        width: '100%',
                        padding: isMobile ? '8px 12px' : '10px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px',
                        minHeight: isMobile ? '44px' : '42px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="all">All</option>
                      <option value="yes">With PG</option>
                      <option value="no">Without PG</option>
                    </select>
                  </div>

                  {/* Bond Filter */}
                  <div style={{ gridColumn: isMobile ? '1' : '2' }}>
                    <label className="filter-label">Bond</label>
                    <select
                      className="filter-select"
                      value={filters.bond}
                      onChange={(e) => handleFilterChange('bond', e.target.value)}
                      style={{
                        width: '100%',
                        padding: isMobile ? '8px 12px' : '10px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px',
                        minHeight: isMobile ? '44px' : '42px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="all">All</option>
                      <option value="yes">With Bond</option>
                      <option value="no">No Bond</option>
                    </select>
                  </div>

                  {/* Year Filter */}
                  <div style={{ gridColumn: isMobile ? '1' : '3' }}>
                    <label className="filter-label">Year</label>
                    <select
                      className="filter-select"
                      value={filters.year}
                      onChange={(e) => handleFilterChange('year', e.target.value)}
                      style={{
                        width: '100%',
                        padding: isMobile ? '8px 12px' : '10px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        fontSize: isMobile ? '16px' : '14px',
                        minHeight: isMobile ? '44px' : '42px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                    </select>
                  </div>

                  {/* College Type Filter */}
                  <div style={{ gridColumn: isMobile ? '1' : '1' }}>
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
                      components={{ Option, MultiValue }}
                      placeholder="Select college types..."
                      className="basic-multi-select"
                      classNamePrefix="select"
                      closeMenuOnSelect={false}
                      hideSelectedOptions={false}
                    />
                  </div>
                </div>
                </>
              )}
            </div>

            {/* Results Section */}
            <div className="table-container">
              {/* Disclaimer */}
              <div className="disclaimer-container" style={{ 
                borderBottom: '1px solid #e2e8f0', 
                borderTop: 'none', 
                marginTop: 0,
                padding: isMobile ? '0.75rem' : '1rem'
              }}>
                <p className="disclaimer-text" style={{
                  color: '#64748b',
                  fontStyle: 'italic',
                  fontSize: isMobile ? '9px' : '10px',
                  textAlign: 'center',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  Disclaimer: This data has been sourced from various institutions and public records. Concept does not guarantee the accuracy of this information and bears no responsibility for any decisions made based on this data.
                </p>
              </div>

              {/* Results Header */}
              <div className="pagination-container" style={{ 
                borderTop: 'none', 
                backgroundColor: '#1B5431',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '1rem' : '1rem',
                padding: isMobile ? '1rem' : '1rem'
              }}>
                <div className="page-info" style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: '#fff',
                  textAlign: isMobile ? 'center' : 'left'
                }}>
                  Total Results: {isLoading ? '...' : getTotalResults()}
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: isMobile ? '0.5rem' : '1rem', 
                  alignItems: 'center',
                  justifyContent: isMobile ? 'center' : 'flex-end'
                }}>
                  <div className="rows-per-page">
                    <label htmlFor="pageSize" className="filter-label" style={{ 
                      margin: 0, 
                      color: '#fff',
                      fontSize: isMobile ? '0.75rem' : '0.875rem'
                    }}>Rows per page:</label>
                    <select
                      id="pageSize"
                      className="rows-select"
                      value={pageSize}
                      onChange={handlePageSizeChange}
                      disabled={isLoading || isFiltering}
                      style={{
                        padding: isMobile ? '0.25rem' : '0.25rem 0.5rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                        fontSize: isMobile ? '0.75rem' : '0.875rem'
                      }}
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
              <div className="table-wrapper" style={{
                position: 'relative',
                minHeight: isMobile ? '300px' : '400px',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}>
                {/* Loading Overlay */}
                {(isLoading || isFiltering) && (
                  <div className="loading-overlay" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.95)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: isMobile ? '1rem' : '1rem'
                  }}>
                    <div className="loading-content" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: isMobile ? '0.75rem' : '1rem'
                    }}>
                      <div className="spinner" style={{
                        width: isMobile ? '40px' : '50px',
                        height: isMobile ? '40px' : '50px',
                        border: '4px solid #e2e8f0',
                        borderTop: '4px solid #4299e1',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <div className="loading-text" style={{
                        textAlign: 'center',
                        color: '#2d3748',
                        fontSize: isMobile ? '12px' : '13px',
                        fontWeight: '500'
                      }}>
                        {isLoading ? 'Loading data...' : 'Updating results...'}
                      </div>
                    </div>
                  </div>
                )}
                
                <table className="results-table" style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: isMobile ? '600px' : '800px',
                  fontSize: isMobile ? '12px' : '13px'
                }}>
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
                        <td colSpan={selectedExam === 'NEET' ? 11 : 10} style={{ 
                          textAlign: 'center', 
                          padding: isMobile ? '1rem' : '2rem',
                          fontSize: isMobile ? '12px' : '14px'
                        }}>
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
              <div className="pagination-container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isMobile ? '1rem' : '1rem',
                backgroundColor: '#f7fafc',
                borderTop: '1px solid #e2e8f0',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '1rem' : '1rem'
              }}>
                <div className="page-info" style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: '#4a5568',
                  textAlign: isMobile ? 'center' : 'left'
                }}>
                  {isLoading || isFiltering ? (
                    'Loading...'
                  ) : (
                    `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, getTotalResults())} of ${getTotalResults()} results`
                  )}
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: isMobile ? '0.25rem' : '0.5rem',
                  flexWrap: 'wrap',
                  justifyContent: isMobile ? 'center' : 'flex-end'
                }}>
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || isLoading || isFiltering}
                    className="pagination-button"
                    style={{
                      padding: isMobile ? '0.375rem 0.5rem' : '0.5rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#4a5568',
                      fontSize: isMobile ? '0.7rem' : '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading || isFiltering}
                    className="pagination-button"
                    style={{
                      padding: isMobile ? '0.375rem 0.5rem' : '0.5rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#4a5568',
                      fontSize: isMobile ? '0.7rem' : '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Previous
                  </button>
                  <span className="pagination-button" style={{ 
                    cursor: 'default',
                    padding: isMobile ? '0.375rem 0.5rem' : '0.5rem 1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#4a5568',
                    fontSize: isMobile ? '0.7rem' : '0.875rem',
                    fontWeight: '500'
                  }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading || isFiltering}
                    className="pagination-button"
                    style={{
                      padding: isMobile ? '0.375rem 0.5rem' : '0.5rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#4a5568',
                      fontSize: isMobile ? '0.7rem' : '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || isLoading || isFiltering}
                    className="pagination-button"
                    style={{
                      padding: isMobile ? '0.375rem 0.5rem' : '0.5rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#4a5568',
                      fontSize: isMobile ? '0.7rem' : '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
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