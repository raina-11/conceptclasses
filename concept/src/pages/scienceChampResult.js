import React, { useState, useEffect } from "react";
import Navigation from "../components/common/navigation/navigation";
import Layout from "../components/common/layout/layout";
import { Container, PrimaryButton, Section } from "../components/style";
import Footer from "../components/common/footer";

function ResultLookup() {
  const [rollNumber, setRollNumber] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [data, setData] = useState([]);
  const [showNote, setShowNote] = useState(true);  // State to control the note visibility

  useEffect(() => {
    // Fetch the JSON data when the component mounts
    fetch("/omrResults.json")
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => {
        console.error("Error loading JSON data:", error);
        setError("Failed to load data. Please try again later.");
      });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const foundResult = data.find((item) => item.rollNumber === rollNumber);

    if (foundResult) {
      setResult(foundResult);
      setError("");
      setShowNote(false);  // Hide the note once result is found
    } else {
      setResult(null);
      setError("Roll number not found. Please check and try again. Contact Concept Institute for more info");
    }
  };

  return (
    <>
    <Layout>
    <Navigation />
    <Section style={{display:'flex', flexDirection:'column',paddingTop:'1vh', justifyContent:'center' , minHeight:'100vh', background:'ivory'}}>
        <Container>
    <div style={styles.container}>
          <h2 style={styles.title}>Science Champ Result 2025</h2>
          
          

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
                  <h3 style={styles.resultTitle}>Hi {result.name}! Please Find your Result below  </h3>
                  <p style={styles.resultText}>Name: {result.name}</p>
                  <p style={styles.resultText}>Class: {result.class}</p>
                  <p style={styles.resultText}>Marks: {result.marks}/240</p>
                  <PrimaryButton
                    onClick={() => window.open(result.omrLink, '_blank', 'noopener,noreferrer')}
                    style={{background:'#005B38',border: '2px solid #005B38', padding:'8px 16px', height:'45px', marginTop:'10px', borderRadius:'8px'}}
                  >
                    Download your OMR sheet
                  </PrimaryButton>
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
  },
  title: {
    textAlign: "center",
    color: "#333",
    fontSize: "24px",
    marginBottom: "16px",
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
    padding: "15px",
    borderRadius: "6px",
    backgroundColor: "#f9f9f9",
    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.05)",
  },
  resultTitle: {
    fontSize: "18px",
    color: "#333",
    marginBottom: "10px",
  },
  resultText: {
    fontSize: "16px",
    color: "#555",
    marginBottom: "8px",
  },
  omrLink: {
    fontSize: "16px",
    color: "#4CAF50",
    textDecoration: "none",
    fontWeight: "bold",
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
