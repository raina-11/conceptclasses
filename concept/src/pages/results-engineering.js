import React from 'react';
import styled from "styled-components"
import { Container, Section } from '../components/style';
import r1 from "../images/r1.webp"
import r4 from "../images/r4.webp"
import r5 from "../images/r5.webp"
import r8 from "../images/r8.webp"
import r11 from "../images/r11.webp"
import r12 from "../images/r12.webp"
import r13 from "../images/r13.webp"
import r16 from "../images/r16.jpg"
import Layout from '../components/common/layout/layout';
import Navigation from '../components/common/navigation/navigation';
import Form from '../components/common/contact-form';
import Footer from '../components/common/footer';

const ResultsEngineering= () =>  {
  return (
    <Layout>
      <Navigation/>
    <Section style={{overflow:'unset',  background:'darkseagreen'}}>
      <Container>
        <Stick>
        <h2 style={{textAlign:'center'}}>Concept Roars, and rule like a King!</h2>
        </Stick>
        <ImgDiv>
        <img src={r16} alt="concept" />
        </ImgDiv>
        <ImgDiv>
        <img src={r1} alt="concept" />
        </ImgDiv>
        <ImgDiv>
        <img src={r4} alt="concept" />
        </ImgDiv>
        <ImgDiv>
        <img src={r5} alt="concept" />
        </ImgDiv>
        <ImgDiv>
        <img src={r8} alt="concept" />
        </ImgDiv>
        <ImgDiv>
        <img src={r11} alt="concept" />
        </ImgDiv>
        <ImgDiv>
        <img src={r12} alt="concept" />
        </ImgDiv>
        <ImgDiv>
        <img src={r13} alt="concept" />
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