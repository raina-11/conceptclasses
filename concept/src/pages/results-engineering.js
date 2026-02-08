import React from 'react';
import styled from "styled-components"
import { Container, Section } from '../components/style';
import Layout from '../components/common/layout/layout';
import Navigation from '../components/common/navigation/navigation';
import Form from '../components/common/contact-form';
import Footer from '../components/common/footer';
import { useResults } from '../hooks/useFirestore';
import SEO from '../components/common/SEO';
import seoConfig from '../seo/seoConfig';
import { createBreadcrumbSchema } from '../seo/schemas';

const ResultsEngineering= () =>  {
  const { results, loading } = useResults('engineering');

  return (
    <Layout>
      <SEO {...seoConfig.resultsEngineering} schemaMarkup={createBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Results', path: '/results/engineering' }, { name: 'IIT-JEE Results', path: '/results/engineering' }])} />
      <Navigation/>
    <main>
    <Section style={{overflow:'unset',  background:'darkseagreen'}}>
      <Container>
        <Stick>
        <h1 style={{textAlign:'center'}}>IIT-JEE Results - Concept Roars!</h1>
        </Stick>

        {loading && <p style={{textAlign:'center', padding:'40px', color:'#fff'}}>Loading results...</p>}

        {results.map((result) => (
          <ImgDiv key={result.id}>
            <img src={result.imageUrl} alt={result.title || 'Student results at Concept Classes'} />
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

export default ResultsEngineering;
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
