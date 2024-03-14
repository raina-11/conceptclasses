import React from 'react';
import styled from "styled-components"
import { Container, Section } from '../components/style';
import r6 from "../images/r6.webp"
import r7 from "../images/r7.webp"
import r9 from "../images/r9.webp"
import r10 from "../images/r10.webp"
import Layout from '../components/common/layout/layout';
import Navigation from '../components/common/navigation/navigation';
import Form from '../components/common/contact-form';
import Footer from '../components/common/footer';

const ResultsMedical= () =>  {
  return (
    <Layout>
      <Navigation/>
    <Section style={{overflow:'unset', background:'darkseagreen'}}>
      <Container>
        <Stick>
        <h2 style={{textAlign:'center'}}>Concept Roars, and rule like a King!</h2>
        </Stick>
       
        <ImgDiv>
        <img src={r6} alt="concept" />
        </ImgDiv>
        <ImgDiv>
        <img src={r7} alt="concept" />
        </ImgDiv>
        <ImgDiv>
        <img src={r9} alt="concept" />
        </ImgDiv>
        <ImgDiv>
        <img src={r10} alt="concept" />
        </ImgDiv>
       
      </Container>
    </Section>
    <div id="contactus">
   <Form/>
   </div>
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
h2{
  padding:8px 0px;
  color:#fff;
}
@media (max-width: ${(props) => props.theme.screen.sm}) {
  top:10vh;
  }
@media (max-width: ${(props) => props.theme.screen.xs}) {
  h2{
    font-size:20px;
  }
}
`