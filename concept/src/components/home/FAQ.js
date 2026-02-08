import React, { useState } from 'react';
import styled from 'styled-components';
import { Container, Section } from '../style';

export const faqs = [
  {
    question: 'What courses does Concept Classes offer?',
    answer:
      'Concept Classes offers coaching for IIT-JEE (Main & Advanced), NEET-UG, and Pre-Foundation programs for Class 9th and 10th students. Engineering courses include Early Lead, Flight, and Eagle\'s Eye. Medical courses include Genesis, Orchid, and Synapse.',
  },
  {
    question: 'Where is Concept Classes located?',
    answer:
      'Our main campus is at Concept Heights, Vyas Colony, E-4, Police Thana Road, Bikaner, Rajasthan 334003. We also have branches in Nagaur, Hanumangarh, and Suratgarh.',
  },
  {
    question: 'Who founded Concept Classes and when?',
    answer:
      'Concept Classes was founded in 1999 by Er. Bhupendra Middha, an experienced mathematics educator. The institute has over 25 years of coaching excellence in Bikaner.',
  },
  {
    question: 'What is the medium of instruction at Concept Classes?',
    answer:
      'Classes are conducted in both English and Hindi medium to ensure students from all backgrounds can learn effectively.',
  },
  {
    question: 'How can I contact Concept Classes for admission enquiry?',
    answer:
      'You can call us at 9928111865, visit our campus in Bikaner, or fill the contact form on our website. You can also schedule a campus visit through our website.',
  },
];

const FAQ = () => {
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
              <FAQQuestion onClick={() => toggle(index)} aria-expanded={openIndex === index}>
                <span>{faq.question}</span>
                <Arrow open={openIndex === index}>&#9660;</Arrow>
              </FAQQuestion>
              {openIndex === index && (
                <FAQAnswer>{faq.answer}</FAQAnswer>
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

const FAQQuestion = styled.dt`
  padding: 16px 20px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Lexend Medium', sans-serif;
  font-size: 16px;
  color: #333;
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
