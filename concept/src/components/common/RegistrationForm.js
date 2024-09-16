import React, { useState } from 'react';
import "./reg.css"
import Navigation from './navigation/navigation';
import Layout from './layout/layout';
import { PrimaryButton, Section } from '../style';
import styled from 'styled-components';
import Footer from './footer';

const App = () => {
  const [formData, setFormData] = useState({
    schoolName: '',
    studentName: '',
    fatherName: '',
    dateOfBirth: '',
    currentClass: '',
    pcbOrPcm: '',
    medium: '',
    presentBoard: '',
    address: '',
    cityOrVillageName: '', // New field
    studentMobileNo: '', // Changed field
    parentsMobileNo: '', // New field
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
      const response = await fetch('https://script.google.com/macros/s/AKfycbyknt9LfEvqeacgf4OrWS-zaxWj1FPyk7wD8DiWVgPp6FYN1TpiHxN8Hb4uzNTPw2jlBg/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      setIsLoading(false);

      const result = await response.text();
      setFormSubmitted(true);
    } catch (error) {
      console.error('Error:', error);
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
            <h2>Science Champ Registration Form</h2>

            {/* School/Coaching/Tutor Name */}
            <input
              type="text"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              placeholder="School/Coaching/Tutor Name"
              required
            />

            {/* Student's Name */}
            <input
              type="text"
              name="studentName"
              value={formData.studentName}
              onChange={handleChange}
              placeholder="Student's Name"
              required
            />

            {/* Father's Name */}
            <input
              type="text"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleChange}
              placeholder="Father's Name"
              required
            />

            {/* Date of Birth */}
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />

            {/* Current Class Dropdown */}
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

            {/* Medium */}
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

            {/* Present Board */}
            <select
              name="presentBoard"
              value={formData.presentBoard}
              onChange={handleChange}
              required
            >
              <option value="">Select Present Board</option>
              <option value="CBSE">CBSE</option>
              <option value="RBSE">RBSE</option>
              <option value="Other">Other</option>
            </select>

            {/* Address */}
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              required
            ></textarea>

            {/* City or Village Name (optional) */}
            <input
              type="text"
              name="cityOrVillageName"
              value={formData.cityOrVillageName}
              onChange={handleChange}
              placeholder="City or Village Name"
            />

            {/* Student Mobile No (optional) */}
            <input
              type="text"
              name="studentMobileNo"
              value={formData.studentMobileNo}
              onChange={handleChange}
              placeholder="Student Mobile No"
              pattern="[0-9]{10}"
              title="Mobile number must be 10 digits"
            />

            {/* Parents Mobile No (required) */}
            <input
              type="text"
              name="parentsMobileNo"
              value={formData.parentsMobileNo}
              onChange={handleChange}
              placeholder="Parents Mobile No"
              pattern="[0-9]{10}"
              title="Mobile number must be 10 digits"
              required
            />

            {/* WhatsApp No */}
            <input
              type="text"
              name="whatsappNo"
              value={formData.whatsappNo}
              onChange={handleChange}
              placeholder="WhatsApp No"
              pattern="[0-9]{10}"
              title="WhatsApp number must be 10 digits"
              required
            />

            <PrimaryButton>
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
