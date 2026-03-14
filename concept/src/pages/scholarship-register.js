import React, { useState } from 'react';
import Navigation from '../components/common/navigation/navigation';
import Layout from '../components/common/layout/layout';
import Footer from '../components/common/footer';
import '../components/common/reg.css';
import styled, { keyframes } from 'styled-components';

// Set REACT_APP_SCHOLARSHIP_API_URL in your .env to the Google Apps Script deployment URL
// api/scholarship-registration.gs has the script to deploy
const API_URL = process.env.REACT_APP_SCHOLARSHIP_API_URL || '';

const INITIAL_FORM = {
  studentName: '',
  currentClass: '',
  schoolName: '',
  boardName: '',
  medium: '',
  cityOrVillageName: '',
  contactNumber: '',
  whatsappNumber: '',
  formType: 'scholarship',
};

export default function ScholarshipRegister() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic phone validation
    if (!/^\d{10}$/.test(formData.contactNumber)) {
      setError('Please enter a valid 10-digit contact number.');
      return;
    }
    if (formData.whatsappNumber && !/^\d{10}$/.test(formData.whatsappNumber)) {
      setError('Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    setIsLoading(true);
    try {
      const dataToSend = {
        ...formData,
        whatsappNumber: formData.whatsappNumber || formData.contactNumber,
        _source: 'website',
      };

      if (API_URL) {
        await fetch(API_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        });
      }

      setSubmitted(true);
      setFormData(INITIAL_FORM);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <Navigation />
      <PageWrapper>
        {!submitted ? (
          <FormCard>
            <BadgeRow>
              <Badge>Science Scholarship 2025–26</Badge>
            </BadgeRow>
            <FormTitle>Register Now</FormTitle>
            <FormSubtitle>Fill in your details and secure your scholarship seat today.</FormSubtitle>

            <form onSubmit={handleSubmit}>
              <FieldGrid>
                {/* Student Name */}
                <Field>
                  <Label>Student Name <Required>*</Required></Label>
                  <Input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    placeholder="Full name"
                    required
                  />
                </Field>

                {/* Class */}
                <Field>
                  <Label>Current Class <Required>*</Required></Label>
                  <Select
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
                  </Select>
                </Field>

                {/* School Name */}
                <Field>
                  <Label>School Name <Required>*</Required></Label>
                  <Input
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    placeholder="Your school name"
                    required
                  />
                </Field>

                {/* Board */}
                <Field>
                  <Label>Board <Required>*</Required></Label>
                  <Select
                    name="boardName"
                    value={formData.boardName}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="RBSE">RBSE</option>
                    <option value="Other">Other</option>
                  </Select>
                </Field>

                {/* Medium */}
                <Field>
                  <Label>Medium <Required>*</Required></Label>
                  <Select
                    name="medium"
                    value={formData.medium}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Medium</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                  </Select>
                </Field>

                {/* City / Village */}
                <Field>
                  <Label>City / Village</Label>
                  <Input
                    type="text"
                    name="cityOrVillageName"
                    value={formData.cityOrVillageName}
                    onChange={handleChange}
                    placeholder="City or village name"
                  />
                </Field>

                {/* Contact Number */}
                <Field>
                  <Label>Contact Number <Required>*</Required></Label>
                  <Input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    required
                  />
                </Field>

                {/* WhatsApp Number */}
                <Field $fullWidth>
                  <Label>WhatsApp Number <HintText>(leave blank if same as contact)</HintText></Label>
                  <Input
                    type="tel"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    placeholder="10-digit WhatsApp number"
                    maxLength={10}
                  />
                </Field>
              </FieldGrid>

              {error && <ErrorText>{error}</ErrorText>}

              <SubmitButton type="submit" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Registration'}
              </SubmitButton>
            </form>
          </FormCard>
        ) : (
          <SuccessCard>
            <CheckCircle>
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="26" cy="26" r="25" stroke="#22c55e" strokeWidth="2" fill="none" />
                <path d="M14 27l9 9 16-16" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </CheckCircle>
            <SuccessTitle>Registration Successful!</SuccessTitle>
            <SuccessText>
              Thank you for registering for the Science Scholarship 2025–26.<br />
              Our team will contact you on WhatsApp with next steps.
            </SuccessText>
            <BackButton onClick={() => setSubmitted(false)}>
              Register Another Student
            </BackButton>
          </SuccessCard>
        )}
      </PageWrapper>
      <Footer />
    </Layout>
  );
}

/* ─── Styled Components ─────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const PageWrapper = styled.main`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0fdf4 0%, #fefce8 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 100px 16px 60px;
`;

const FormCard = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 32px rgba(0, 91, 56, 0.12);
  padding: 40px 36px;
  width: 100%;
  max-width: 640px;
  animation: ${fadeIn} 0.4s ease;

  @media (max-width: 480px) {
    padding: 28px 20px;
  }
`;

const BadgeRow = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
`;

const Badge = styled.span`
  background: #dcfce7;
  color: #15803d;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 14px;
  border-radius: 999px;
`;

const FormTitle = styled.h1`
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: #064e3b;
  margin: 0 0 6px;

  @media (max-width: 480px) {
    font-size: 22px;
  }
`;

const FormSubtitle = styled.p`
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 28px;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  grid-column: ${(props) => (props.$fullWidth ? '1 / -1' : 'auto')};
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
`;

const Required = styled.span`
  color: #ef4444;
  margin-left: 2px;
`;

const HintText = styled.span`
  color: #9ca3af;
  font-weight: 400;
  font-size: 12px;
  margin-left: 4px;
`;

const inputStyles = `
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  color: #111827;
  background: #f9fafb;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
  -webkit-appearance: none;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
    background: #fff;
  }

  &::placeholder {
    color: #9ca3af;
    font-size: 14px;
  }
`;

const Input = styled.input`${inputStyles}`;
const Select = styled.select`
  ${inputStyles}
  cursor: pointer;
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: 13px;
  margin: 12px 0 0;
  text-align: center;
`;

const SubmitButton = styled.button`
  display: block;
  width: 100%;
  margin-top: 24px;
  padding: 14px;
  background: #15803d;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;

  &:hover:not(:disabled) {
    background: #166534;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

/* ─── Success Screen ─────────────────────────────────────── */

const popIn = keyframes`
  from { transform: scale(0.7); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
`;

const SuccessCard = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 32px rgba(0, 91, 56, 0.12);
  padding: 56px 36px;
  width: 100%;
  max-width: 480px;
  text-align: center;
  animation: ${fadeIn} 0.4s ease;
`;

const CheckCircle = styled.div`
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  animation: ${popIn} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

  svg {
    width: 100%;
    height: 100%;
  }
`;

const SuccessTitle = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: #064e3b;
  margin: 0 0 12px;
`;

const SuccessText = styled.p`
  color: #6b7280;
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 28px;
`;

const BackButton = styled.button`
  background: transparent;
  border: 2px solid #15803d;
  color: #15803d;
  border-radius: 999px;
  padding: 10px 28px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: #15803d;
    color: #fff;
  }
`;
