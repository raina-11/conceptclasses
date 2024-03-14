import React, { useState } from 'react';
import styled from "styled-components"
import { Container, Section } from '../components/style';
import r3 from "../images/r3.webp"
import r14 from "../images/r14.webp"
import r15 from "../images/r15.webp"
import Layout from '../components/common/layout/layout';
import Navigation from '../components/common/navigation/navigation';
import Form from '../components/common/contact-form';
import Footer from '../components/common/footer';

const ResultsPreFoundation= () =>  {
  return (
    <Layout>
      <Navigation/>
    <Section style={{overflow:'unset',  background:'darkseagreen'}}>
      <Container>
        <Stick>
        <h2 style={{textAlign:'center'}}>Concept Roars, and rule like a King!</h2>
        </Stick>
       
        <ImgDiv>
        <img src={r3}/>
        </ImgDiv>
        <ImgDiv>
        <img src={r14}/>
        </ImgDiv>
        <ImgDiv>
        <img src={r15}/>
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

export default ResultsPreFoundation;
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
  color:#ffff;
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