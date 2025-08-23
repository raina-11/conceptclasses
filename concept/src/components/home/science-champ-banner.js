import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const ScienceChampBanner = () => {
  const navigate = useNavigate();

  const handleRegisterClick = () => {
    navigate('/science-champ-2025-2026/');
  };

  return (
    <BannerSection>
      <BannerContainer>
        <LeftContent>
          <BannerLabel>Competition 2025-2026</BannerLabel>
          <BannerTitle>Science Champ</BannerTitle>
          <BannerSubtitle>
            For Classes VII-XII • Win Exciting Prizes!
          </BannerSubtitle>
        </LeftContent>
        
        <RightContent>
          <RegisterButton onClick={handleRegisterClick}>
            Register Now
          </RegisterButton>
          <RegistrationNote>Limited Seats!</RegistrationNote>
        </RightContent>
      </BannerContainer>
    </BannerSection>
  );
};

export default ScienceChampBanner;

// Styled Components
const BannerSection = styled.section`
  width: 100%;
  padding: 40px 0;
  background: linear-gradient(135deg, #005B38 0%, #076B37 100%);
  position: relative;
  overflow: hidden;
  
  @media (max-width: 768px) {
    padding: 10px 0;
  }
`;

const BannerContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 25px;
  }
`;

const LeftContent = styled.div`
  flex: 1;
`;

const RightContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const BannerLabel = styled.span`
  display: inline-block;
  background: rgba(239, 200, 0, 0.2);
  color: #EFC800;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
`;

const BannerTitle = styled.h2`
  font-size: 36px;
  color: #FFFFFF;
  font-weight: 700;
  margin: 0 0 8px 0;
  font-family: 'Lexend', sans-serif;
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const BannerSubtitle = styled.p`
  font-size: 18px;
  color: #B4D9C3;
  font-weight: 400;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const RegisterButton = styled.button`
  padding: 12px 28px;
  font-size: 15px;
  background: #EFC800;
  color: #005B38;
  border: 2px solid #EFC800;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Lexend', sans-serif;
  
  &:hover {
    background: transparent;
    color: #EFC800;
  }
  
  @media (max-width: 768px) {
    padding: 10px 24px;
    font-size: 14px;
  }
`;

const RegistrationNote = styled.p`
  color: #EFC800;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
`;