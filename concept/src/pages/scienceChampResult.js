import React, { useState, useEffect } from "react";
import Navigation from "../components/common/navigation/navigation";
import Layout from "../components/common/layout/layout";
import { Container, Section } from "../components/style";
import Footer from "../components/common/footer";

function ResultLookup() {
  const [rollNumber, setRollNumber] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [data, setData] = useState([]);
  const [showNote, setShowNote] = useState(true);  // State to control the note visibility

  useEffect(() => {
    // Fetch both JSON files when the component mounts
    const fetch11th12th = fetch("/data/11th-12th.json").then(res => res.json());
    const fetch7th9th10th = fetch("/data/7th-8th-9th-10th.json").then(res => res.json());
    
    Promise.all([fetch11th12th, fetch7th9th10th])
      .then(([data11th12th, data7th9th10th]) => {
        // Combine both datasets
        const combinedData = [...data11th12th, ...data7th9th10th];
        setData(combinedData);
      })
      .catch((error) => {
        console.error("Error loading JSON data:", error);
        setError("Failed to load data. Please try again later.");
      });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const foundResult = data.find((item) => item["Roll No."] === parseInt(rollNumber));

    if (foundResult) {
      setResult(foundResult);
      setError("");
      setShowNote(false);  // Hide the note once result is found
    } else {
      setResult(null);
      setError("Roll number not found. Please check and try again. Contact Concept Institute for more info");
    }
  };

  const formatMarksDisplay = (result) => {
    const studentClass = result["Class"];
    
    // Check if it's 11th or 12th class (PCM format)
    if (studentClass.includes("11th") || studentClass.includes("12th")) {
      return (
        <div style={styles.marksSection}>
          <h4 style={styles.marksSectionTitle}>Subject-wise Marks:</h4>
          <div style={styles.marksRow}>
            <span style={styles.subjectLabel}>Physics (80):</span>
            <span style={styles.marksValue}>{result["Physics (80)"]}</span>
          </div>
          <div style={styles.marksRow}>
            <span style={styles.subjectLabel}>Chemistry (80):</span>
            <span style={styles.marksValue}>{result["Chemistry (80)"]}</span>
          </div>
          <div style={styles.marksRow}>
            <span style={styles.subjectLabel}>Mathematics (80):</span>
            <span style={styles.marksValue}>{result["Maths (80)"]}</span>
          </div>
        </div>
      );
    } else {
      // 7th, 9th, 10th format
      return (
        <div style={styles.marksSection}>
          <h4 style={styles.marksSectionTitle}>Subject-wise Marks:</h4>
          <div style={styles.marksRow}>
            <span style={styles.subjectLabel}>Science (120):</span>
            <span style={styles.marksValue}>{result["Science (120)"]}</span>
          </div>
          <div style={styles.marksRow}>
            <span style={styles.subjectLabel}>Mathematics (120):</span>
            <span style={styles.marksValue}>{result["Maths (120)"]}</span>
          </div>
        </div>
      );
    }
  };

  return (
    <>
    <Layout>
    <Navigation />
    <Section style={{display:'flex', flexDirection:'column',paddingTop:'1vh', justifyContent:'center' , minHeight:'100vh', background:'ivory'}}>
        <Container>
    <div style={styles.container}>
          <h2 style={styles.title}>Science Champ Result 2026</h2>
          
          {/* <div style={styles.banner}>
              <div style={styles.bannerIcon}>📢</div>
              <div style={styles.bannerContent}>
                  <strong>Class 8th Result Update:</strong> Class 8th results are still being processed and will be available soon. Stay tuned for updates!
              </div>
          </div> */}

          <form onSubmit={handleSearch} style={styles.form}>
              <label style={styles.label}>
                  Enter your Roll Number:
                  <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      required
                      style={styles.input} />
              </label>
              <button type="submit" style={styles.button}>Submit</button>
          </form>
          
          {error && <p style={styles.error}>{error}</p>}

          {result && (
              <div style={styles.resultContainer}>
                  <div style={styles.reportCardHeader}>
                      <h3 style={styles.resultTitle}>Science Champ 2026 - Result Card</h3>
                      <div style={styles.studentInfo}>
                          <h4 style={styles.studentName}>{result["Student Name"]}</h4>
                      </div>
                  </div>
                  
                  <div style={styles.basicInfo}>
                      <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Roll Number:</span>
                          <span style={styles.infoValue}>{result["Roll No."]}</span>
                      </div>
                      <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Class:</span>
                          <span style={styles.infoValue}>{result["Class"]}</span>
                      </div>
                      <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Board:</span>
                          <span style={styles.infoValue}>{result["BOARD"]}</span>
                      </div>
                      <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>School:</span>
                          <span style={styles.infoValue}>{result["School"]}</span>
                      </div>
                      <div style={styles.infoRow}>
                          <span style={styles.infoLabel}>Centre:</span>
                          <span style={styles.infoValue}>{result["Centre"]}</span>
                      </div>
                      {result["Place"] && (
                          <div style={styles.infoRow}>
                              <span style={styles.infoLabel}>Place:</span>
                              <span style={styles.infoValue}>{result["Place"]}</span>
                          </div>
                      )}
                  </div>

                  {formatMarksDisplay(result)}

                  <div style={styles.totalSection}>
                      <div style={styles.totalRow}>
                          <span style={styles.totalLabel}>Grand Total:</span>
                          <span style={styles.totalValue}>{result["G.Total  (240)"]}/240</span>
                      </div>
                      <div style={styles.percentageRow}>
                          <span style={styles.percentageLabel}>Percentage:</span>
                          <span style={styles.percentageValue}>{result["percentage"]}%</span>
                      </div>
                  </div>

                  {result["Link"] && (
                      <div style={styles.actions}>
                          <a
                              href={result["Link"]}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={styles.omrButton}
                              aria-label="View your OMR in a new tab"
                          >
                              <span style={styles.omrIcon} aria-hidden>
                                  {/* external link icon */}
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M14 3H21V10" stroke="#005B38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M10 14L21 3" stroke="#005B38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M21 14V21H3V3H10" stroke="#005B38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                              </span>
                              View OMR
                          </a>
                      </div>
                  )}
              </div>
          )}
          
      </div>
      {showNote && (
            <div style={styles.note}>
              Please Enter roll number, which you received via SMS
            </div>
          )}
      </Container>
      </Section>
      <Footer/>
      </Layout>
      </>
  );
}

const styles = {
  container: {
    maxWidth: "500px",
    margin: "auto",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#ffffff",
    fontFamily: "'Roboto', sans-serif",
    marginTop:"14vh"
  },
  title: {
    textAlign: "center",
    color: "#333",
    fontSize: "24px",
    marginBottom: "16px",
  },
  banner: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    border: "1px solid #ffeaa7",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "20px",
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
  },
  bannerIcon: {
    fontSize: "20px",
    marginRight: "12px",
    flexShrink: 0,
  },
  bannerContent: {
    fontSize: "14px",
    color: "#856404",
    lineHeight: "1.4",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  label: {
    fontSize: "16px",
    color: "#555",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "10px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    boxSizing: "border-box",
  },
  button: {
    backgroundColor: "#4CAF50",
    color: "#fff",
    padding: "10px",
    fontSize: "16px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  buttonHover: {
    backgroundColor: "#45a049",
  },
  error: {
    color: "red",
    fontSize: "14px",
    marginTop: "10px",
    textAlign: "center",
  },
  resultContainer: {
    marginTop: "20px",
    padding: "25px",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
    boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.1)",
    border: "2px solid #005B38",
  },
  reportCardHeader: {
    textAlign: "center",
    borderBottom: "2px solid #005B38",
    paddingBottom: "15px",
    marginBottom: "20px",
  },
  resultTitle: {
    fontSize: "22px",
    color: "#005B38",
    marginBottom: "10px",
    fontWeight: "bold",
  },
  studentInfo: {
    marginTop: "10px",
  },
  studentName: {
    fontSize: "20px",
    color: "#333",
    margin: "0",
    fontWeight: "600",
  },
  basicInfo: {
    marginBottom: "20px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #eee",
  },
  infoLabel: {
    fontSize: "16px",
    color: "#666",
    fontWeight: "500",
    minWidth: "120px",
  },
  infoValue: {
    fontSize: "16px",
    color: "#333",
    fontWeight: "400",
    textAlign: "right",
    flex: 1,
  },
  marksSection: {
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #dee2e6",
  },
  marksSectionTitle: {
    fontSize: "18px",
    color: "#005B38",
    marginBottom: "12px",
    fontWeight: "600",
    textAlign: "center",
  },
  marksRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    marginBottom: "8px",
    backgroundColor: "#ffffff",
    borderRadius: "5px",
    border: "1px solid #e9ecef",
  },
  subjectLabel: {
    fontSize: "15px",
    color: "#495057",
    fontWeight: "500",
  },
  marksValue: {
    fontSize: "15px",
    color: "#007bff",
    fontWeight: "600",
  },
  totalSection: {
    backgroundColor: "#005B38",
    color: "white",
    padding: "15px",
    borderRadius: "8px",
    textAlign: "center",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  totalLabel: {
    fontSize: "18px",
    fontWeight: "600",
  },
  totalValue: {
    fontSize: "18px",
    fontWeight: "700",
  },
  percentageRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  percentageLabel: {
    fontSize: "16px",
    fontWeight: "500",
  },
  percentageValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#ffd700",
  },
  actions: {
    textAlign: "center",
    marginTop: "14px",
  },
  omrButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#005B38",
    backgroundColor: "#ffffff",
    border: "2px solid #005B38",
    borderRadius: "9999px",
    textDecoration: "none",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    transition: "transform 0.15s ease, background-color 0.2s ease, box-shadow 0.2s ease",
  },
  omrIcon: {
    display: "inline-flex",
  },
  note: {
    backgroundColor: "#fffbcc",
    padding: "6px",
    border: "1px solid #ffd700",
    borderRadius: "5px",
    fontSize: "14px",
    color: "#6b6b6b",
    textAlign: "center",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    maxWidth:'500px',
    margin:'16px auto'
  },
  "@media (max-width: 480px)": {
    container: {
      padding: "15px",
      maxWidth: "100%",
    },
    title: {
      fontSize: "20px",
    },
    form: {
      gap: "10px",
    },
    button: {
      padding: "8px",
      fontSize: "14px",
    },
    resultTitle: {
      fontSize: "16px",
    },
  },
};

export default ResultLookup;
