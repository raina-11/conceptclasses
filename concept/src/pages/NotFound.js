import React from 'react';
import styled from 'styled-components';
import Layout from '../components/common/layout/layout';
import Navigation from '../components/common/navigation/navigation';
import Footer from '../components/common/footer';
import { Container } from '../components/style';
import { PrimaryButton } from '../components/style';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <SEO
        title="Page Not Found"
        description="The page you are looking for does not exist. Return to Concept Classes homepage."
        canonicalPath="/404"
        noindex
      />
      <Navigation />
      <main id="main-content">
        <Wrapper>
          <Container>
            <Content>
              <ErrorCode>404</ErrorCode>
              <Title>Page Not Found</Title>
              <Description>
                The page you're looking for doesn't exist or has been moved.
              </Description>
              <PrimaryButton onClick={() => navigate('/')}>
                Go to Homepage
              </PrimaryButton>
            </Content>
          </Container>
        </Wrapper>
      </main>
      <Footer />
    </Layout>
  );
};

export default NotFound;

const Wrapper = styled.section`
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 0 60px;
`;

const Content = styled.div`
  text-align: center;
`;

const ErrorCode = styled.div`
  font-family: 'Lexend Bold';
  font-size: 120px;
  color: #005B38;
  line-height: 1;
  margin-bottom: 16px;
  @media (max-width: 500px) {
    font-size: 80px;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  color: #1C1C1F;
  margin-bottom: 16px;
`;

const Description = styled.p`
  font-size: 16px;
  color: #505050;
  margin-bottom: 32px;
`;
