import React, { useState } from 'react';
import styled from 'styled-components';
import { Container, Section } from '../style';
import { useFaqs } from '../../hooks/useFirestore';

const FAQ = () => {
  const { faqs } = useFaqs();
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <FAQSection>
      <Container>
        <FAQHeading>Frequently Asked Questions</FAQHeading>
        <FAQList>
          {faqs.map((faq, index) => (
            <FAQItem key={index}>
              <FAQQuestion>
                <FAQButton
                  type="button"
                  onClick={() => toggle(index)}
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span>{faq.question}</span>
                  <Arrow open={openIndex === index}>&#9660;</Arrow>
                </FAQButton>
              </FAQQuestion>
              {openIndex === index && (
                <FAQAnswer id={`faq-answer-${index}`}>{faq.answer}</FAQAnswer>
              )}
            </FAQItem>
          ))}
        </FAQList>
      </Container>
    </FAQSection>
  );
};

export default FAQ;

const FAQSection = styled(Section)`
  background: #f9f9f9;
  padding: 60px 0;
`;

const FAQHeading = styled.h2`
  text-align: center;
  color: #005b38;
  margin-bottom: 32px;
  font-size: 28px;
`;

const FAQList = styled.dl`
  max-width: 800px;
  margin: 0 auto;
`;

const FAQItem = styled.div`
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`;

const FAQQuestion = styled.dt``;

const FAQButton = styled.button`
  width: 100%;
  padding: 16px 20px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Lexend Medium', sans-serif;
  font-size: 16px;
  color: #333;
  background: none;
  border: none;
  text-align: left;
  user-select: none;
  &:hover {
    background: #f0f0f0;
  }
`;

const Arrow = styled.span`
  font-size: 12px;
  color: #005b38;
  transition: transform 0.2s;
  transform: ${(props) => (props.open ? 'rotate(180deg)' : 'rotate(0)')};
`;

const FAQAnswer = styled.dd`
  padding: 0 20px 16px;
  margin: 0;
  font-family: 'Lexend Regular', sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: #555;
`;
