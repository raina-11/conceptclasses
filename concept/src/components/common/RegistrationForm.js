import React, { useState } from 'react';
import "./reg.css"
import Navigation from './navigation/navigation';
import Layout from './layout/layout';
import { PrimaryButton, Section } from '../style';
import styled from 'styled-components';
import Footer from './footer';

const App = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    motherName: '',
    currentClass: '',
    schoolName: '',
    cityOrVillageName: '',
    dateOfBirth: '',
    boardName: '',
    medium: '',
    studentMobileNo: '',
    parentsMobileNo: '',
    whatsappNo: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Google Apps Script Web App URL (you'll need to replace this with your actual URL)
      const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxgLljdWVIp_Dmx5Zee6xnhin8vzaTp9TtmJCS8VTei4smxiOM1-WWE9wEiv-OBd20L-Q/exec';
      
      // Add timestamp to the data
      const dataWithTimestamp = {
        ...formData,
        timestamp: new Date().toISOString()
      };

      // Use Image pixel tracking (most reliable for CORS)
      const params = new URLSearchParams(dataWithTimestamp);
      const img = new Image();
      img.src = `${GOOGLE_SCRIPT_URL}?${params.toString()}`;

      // Since we're using no-cors, we won't get response data
      // Assume success if no error is thrown
      setFormSubmitted(true);
      
      // Reset form
      setFormData({
        studentName: '',
        fatherName: '',
        motherName: '',
        currentClass: '',
        schoolName: '',
        cityOrVillageName: '',
        dateOfBirth: '',
        boardName: '',
        medium: '',
        studentMobileNo: '',
        parentsMobileNo: '',
        whatsappNo: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting the form. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const [formSubmitted, setFormSubmitted] = useState(false);
  const handleDownload = () => {
    const pdfUrl = 'https://drive.google.com/file/d/1vssU-SrVBkE9B2l9bvuLnmpoV9QI3Hez/view?usp=sharing';
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = "answerkey.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <Navigation />
      <Section style={{ background: 'ivory' }}>
        <StyledDiv isHidden={formSubmitted} className='form-container'>
          <form className="styled-form" onSubmit={handleSubmit}>
            <h2>Science Champ Registration Form 2025-2026</h2>

            <div className="form-group">
              <label>Student Name <span className="required">*</span></label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                placeholder="Enter student's full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Father's Name <span className="required">*</span></label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                placeholder="Enter father's full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Mother's Name <span className="required">*</span></label>
              <input
                type="text"
                name="motherName"
                value={formData.motherName}
                onChange={handleChange}
                placeholder="Enter mother's full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Current Class <span className="required">*</span></label>
              <select
                name="currentClass"
                value={formData.currentClass}
                onChange={handleChange}
                required
              >
                <option value="">Select Class</option>
                <option value="VII">VII</option>
                <option value="VIII">VIII</option>
                <option value="IX">IX</option>
                <option value="X">X</option>
                <option value="XI (PCM)">XI (PCM)</option>
                <option value="XI (PCB)">XI (PCB)</option>
                <option value="XII (PCM)">XII (PCM)</option>
                <option value="XII (PCB)">XII (PCB)</option>
              </select>
            </div>

            <div className="form-group">
              <label>School Name <span className="required">*</span></label>
              <input
                type="text"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleChange}
                placeholder="Enter school name"
                required
              />
            </div>

            <div className="form-group">
              <label>City or Village Name</label>
              <input
                type="text"
                name="cityOrVillageName"
                value={formData.cityOrVillageName}
                onChange={handleChange}
                placeholder="Enter city or village name"
              />
            </div>

            <div className="form-group">
              <label>Date of Birth <span className="required">*</span></label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Board Name <span className="required">*</span></label>
              <select
                name="boardName"
                value={formData.boardName}
                onChange={handleChange}
                required
              >
                <option value="">Select Board</option>
                <option value="CBSE">CBSE</option>
                <option value="RBSE">RBSE</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Medium <span className="required">*</span></label>
              <select
                name="medium"
                value={formData.medium}
                onChange={handleChange}
                required
              >
                <option value="">Select Medium</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>

            <div className="form-group">
              <label>Student Mobile Number</label>
              <input
                type="text"
                name="studentMobileNo"
                value={formData.studentMobileNo}
                onChange={handleChange}
                placeholder="Enter 10-digit mobile number"
                pattern="[0-9]{10}"
                title="Mobile number must be 10 digits"
              />
            </div>

            <div className="form-group">
              <label>Parent's Mobile Number <span className="required">*</span></label>
              <input
                type="text"
                name="parentsMobileNo"
                value={formData.parentsMobileNo}
                onChange={handleChange}
                placeholder="Enter 10-digit mobile number"
                pattern="[0-9]{10}"
                title="Mobile number must be 10 digits"
                required
              />
            </div>

            <div className="form-group">
              <label>WhatsApp Number <span className="required">*</span></label>
              <input
                type="text"
                name="whatsappNo"
                value={formData.whatsappNo}
                onChange={handleChange}
                placeholder="Enter 10-digit WhatsApp number"
                pattern="[0-9]{10}"
                title="WhatsApp number must be 10 digits"
                required
              />
            </div>

            <PrimaryButton disabled={isLoading}>
              {isLoading ? "Sending...." : "Submit"}
            </PrimaryButton>
          </form>
        </StyledDiv>

        {formSubmitted && (
          <>
            <Animation className="canvas">
              <div className="notepad">
                <div className="cover"></div>
                <div className="page one">
                  <p>Thank<br />you!</p>
                </div>
                <div className="page two"></div>
                <div className="page three"></div>
                <div className="page four"></div>
              </div>
              <div className="pencil">
                <div className="edge"></div>
              </div>
            </Animation>
          </>
        )}

        {formSubmitted && (
          <div style={{ display: 'flex', justifyContent: 'center', position: 'absolute', top: '82vh', width: '100%' }}>
            <PrimaryButton onClick={handleDownload}>
              Download the Syllabus
            </PrimaryButton>
          </div>
        )}
      </Section>
      {!formSubmitted &&
      <Footer/>
      }
    </Layout>
  );
};

export default App;

const Animation = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
  padding-bottom: 40px;
  top: 50%;
`;

const StyledDiv = styled.div`
  display: ${(props) => (props.isHidden ? 'none' : 'flex')};
`;


// testing unique
