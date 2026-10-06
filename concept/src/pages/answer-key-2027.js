import React from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import Navigation from '../components/common/navigation/navigation';
import Layout from '../components/common/layout/layout';
import Footer from '../components/common/footer';
import SEO from '../components/common/SEO';
import seoConfig from '../seo/seoConfig';
import { createBreadcrumbSchema } from '../seo/schemas';
// Parsed from the three provisional answer-key PDFs the office published
// (public/answer-key-2027/). One entry per class and paper set.
import KEYS from '../data/answerKey2027.json';

const CLASSES = [...new Set(KEYS.map((k) => k.class))];
const PDF_FOR_CLASS = { 6: 'class-6-8', 7: 'class-6-8', 8: 'class-6-8', 9: 'class-9-10', 10: 'class-9-10', 11: 'class-11-12', 12: 'class-11-12' };

// Classes 11 and 12 answer either Maths or Biology as Part III, not both.
const SECTION_NOTE = { Maths: 'PCM students', Biology: 'PCB students' };

export default function AnswerKey2027() {
  const [params, setParams] = useSearchParams();
  const cls = CLASSES.includes(params.get('class')) ? params.get('class') : null;
  const sets = KEYS.filter((k) => k.class === cls);
  // No fallback: the key shows only once both class and set are chosen.
  const key = sets.find((k) => k.set === params.get('set'));

  // Selection lives in the URL so a teacher can share "/...?class=10&set=R1" on WhatsApp.
  const select = (next) => setParams(next, { replace: true });

  return (
    <Layout>
      <SEO {...seoConfig.answerKey2027} schemaMarkup={createBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Science Champ Answer Key 2027', path: '/science-champ-answer-key-2027' }])} />
      <Navigation />
      <Page id="main-content">
        <Card>
          <Badge>Provisional</Badge>
          <Title>Science Champ 2027 Answer Key</Title>
          <Subtitle>Concept Science Champ Scholarship cum Entrance Test 2027</Subtitle>


          <Label htmlFor="ak-class">1. Select your class</Label>
          <Select id="ak-class" value={cls || ''} onChange={(e) => select({ class: e.target.value })}>
            <option value="" disabled>Choose class</option>
            {CLASSES.map((c) => <option key={c} value={c}>Class {c}th</option>)}
          </Select>

          <Label htmlFor="ak-set">2. Select your paper set <Hint>(printed on your question paper)</Hint></Label>
          <Select id="ak-set" value={key ? key.set : ''} disabled={!cls} onChange={(e) => select({ class: cls, set: e.target.value })}>
            <option value="" disabled>{cls ? 'Choose paper set' : 'Select class first'}</option>
            {sets.map((k) => <option key={k.set} value={k.set}>Set {k.set}</option>)}
          </Select>
        </Card>

        {key && (
          <Card>
            <KeyHeader>
              <span>Class {key.class}<sup>th</sup></span>
              <span>Paper Set: {key.set}</span>
            </KeyHeader>
            {key.sections.map((s, i) => (
              <section key={s.name}>
                <SectionTitle>
                  Part {['I', 'II', 'III', 'III'][i]}: {s.name}
                  {SECTION_NOTE[s.name] && <Hint> (for {SECTION_NOTE[s.name]})</Hint>}
                </SectionTitle>
                <Grid>
                  {[...s.answers].map((a, j) => (
                    <Cell key={j}>
                      <QNo>Q{s.start + j}</QNo>
                      <Ans>{a}</Ans>
                    </Cell>
                  ))}
                </Grid>
              </section>
            ))}
            <PdfLink href={`/answer-key-2027/${PDF_FOR_CLASS[key.class]}.pdf`} target="_blank" rel="noopener noreferrer">
              Download official PDF
            </PdfLink>
          </Card>
        )}
      </Page>
      <Footer />
    </Layout>
  );
}

const Page = styled.main`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0fdf4 0%, #fefce8 100%);
  padding: 96px 16px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 760px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  @media (max-width: 480px) { padding: 16px; }
`;

const Badge = styled.span`
  display: inline-block;
  background: #fef3c7;
  color: #92400e;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
`;

const Title = styled.h1`
  margin: 12px 0 4px;
  font-size: 28px;
  font-weight: 700;
  color: #064e3b;
  @media (max-width: 480px) { font-size: 22px; }
`;

const Subtitle = styled.p`
  margin: 0 0 16px;
  color: #6b7280;
  font-size: 14px;
`;

const Label = styled.label`
  display: block;
  margin: 20px 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const Hint = styled.span`
  color: #6b7280;
  font-weight: 400;
  font-size: 13px;
`;

const Select = styled.select`
  width: 100%;
  min-height: 48px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1.5px solid #d1d5db;
  background: #fff;
  color: #111827;
  font-size: 16px; /* 16px stops iOS zooming in on focus */
  &:focus { outline: none; border-color: #15803d; box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.15); }
  &:disabled { background: #f3f4f6; color: #9ca3af; }
`;

const KeyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 18px;
  font-weight: 700;
  color: #b91c1c;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 10px;
`;

const SectionTitle = styled.h2`
  margin: 20px 0 10px;
  font-size: 16px;
  font-weight: 700;
  color: #064e3b;
`;

// 5 per row on phones, 10 per row (like the printed key) on wider screens.
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  @media (min-width: 640px) { grid-template-columns: repeat(10, 1fr); }
`;

const Cell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 0;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
`;

const QNo = styled.span`
  font-size: 11px;
  color: #6b7280;
`;

const Ans = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #111827;
`;

const PdfLink = styled.a`
  display: block;
  margin-top: 24px;
  text-align: center;
  color: #15803d;
  font-weight: 600;
  font-size: 15px;
`;
