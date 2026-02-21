import React from 'react';
import styled from "styled-components"
import { Container, Section } from '../components/style';
import Layout from '../components/common/layout/layout';
import Navigation from '../components/common/navigation/navigation';
import Form from '../components/common/contact-form';
import Footer from '../components/common/footer';
import { useResults } from '../hooks/useFirestore';
import CloudImage from '../components/common/CloudImage';
import { ResultsSkeleton } from '../components/common/Skeleton';
import SEO from '../components/common/SEO';
import seoConfig from '../seo/seoConfig';
import { createBreadcrumbSchema } from '../seo/schemas';

const ResultsMedical= () =>  {
  const { results, loading } = useResults('medical');

  return (
    <Layout>
      <SEO {...seoConfig.resultsMedical} schemaMarkup={createBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Results', path: '/results/medical' }, { name: 'NEET Results', path: '/results/medical' }])} />
      <Navigation/>
    <main>
    <Section style={{overflow:'unset', background:'darkseagreen'}}>
      <Container>
        <Stick>
        <h1 style={{textAlign:'center'}}>NEET Results - Concept Roars!</h1>
        </Stick>

        {loading && <ResultsSkeleton count={3} />}

        {results.map((result) => (
          <ImgDiv key={result.id}>
            <CloudImage src={result.imageUrl} alt={result.title || 'Student results at Concept Classes'} width={1200} />
          </ImgDiv>
        ))}

      </Container>
    </Section>
    <div id="contactus">
   <Form/>
   </div>
    </main>
    <Footer/>
    </Layout>
  );
}

export default ResultsMedical;
const ImgDiv = styled.div`
width:100%;
text-align:center;
align-self:center;
margin-bottom:40px;
img{
  width:100%;
}
@media (max-width: ${(props) => props.theme.screen.xs}) {
  margin-bottom:24px;

}
`
const Stick = styled.div`
position:sticky;
top:12vh;
background:rgb(0, 91, 56);
h1{
  padding:8px 0px;
  color:#fff;
  font-size: 28px;
}
@media (max-width: ${(props) => props.theme.screen.sm}) {
  top:10vh;
  }
@media (max-width: ${(props) => props.theme.screen.xs}) {
  h1{
    font-size:20px;
  }
}
`
