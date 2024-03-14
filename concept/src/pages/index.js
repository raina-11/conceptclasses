import React, { useState } from 'react';
import styled from "styled-components"
import Navbar from '../components/Navbar';
// import { Carousel } from 'antd';
import { Container, Section } from '../components/style';
import logo from "../images/concept-logo.png"
import bg from "../images/home-temp.png"
import b1 from "../images/b1.webp"
import b2 from "../images/b2.webp"
import b3 from "../images/b3.webp"
import b4 from "../images/b4.webp"
import b5 from "../images/b5.webp"
import Navigation from '../components/common/navigation/navigation';
import Layout from '../components/common/layout/layout';
import ScrollSmooth from '../components/home/smooth-scroll';
import StackCards from '../components/home/legacy';
import DirectorQuote from '../components/home/director-quote';
import Footer from '../components/common/footer';
import Form from '../components/common/contact-form';
import Carousel from "react-caroussel";
import "react-caroussel/dist/index.css";
const contentStyle = {
  height: '100vh',
  width:'100vw',
  color: '#fff',
  lineHeight: '160px',
  textAlign: 'center',
  background:'pink',
  // backgroundImage: logo,
};
const Home= () =>  {
 
  return (
    <Layout>
    <Navigation bgwhite={true}/>

  
   {/* <Section> */}
    {/* <Container> */}
    <StyledDiv>
    <Carousel 
    infinite={true}
    autoplay={true}
    speed={4} 
    display={{
      dots: true,
      arrows: false
    }}
    >
    {/* <div >
    <div style={contentStyle}></div>
    </div> */}
    
    <SDiv>
    <StyledImage src={b3} ></StyledImage> 
    </SDiv>

    <SDiv>
    <StyledImage src={b4} ></StyledImage> 
    </SDiv>
    <SDiv>
    <StyledImage src={b1} ></StyledImage> 
    </SDiv>
    <SDiv>
    <StyledImage src={b2} ></StyledImage> 
    </SDiv>
    <SDiv>
    <StyledImage src={b5} ></StyledImage> 
    </SDiv>
    {/* <div>
    <StyledImage src={bg} ></StyledImage>
     
    </div>
    <div>
    <StyledImage src={b1} ></StyledImage>
     
    </div>
    <div>
    <StyledImage src={bg} ></StyledImage>
     
    </div> */}
  </Carousel>
  </StyledDiv>
    {/* </Container> */}
   {/* </Section> */}
   <StackCards/>
   <ScrollSmooth/>
 
   <DirectorQuote/>
   
<div id="contactus">
   <Form/>
   </div>
   <Footer/>
   </Layout>
   
  );
}

export default Home;

const StyledImage = styled.img`
width: 100%;
    // height: 100vh;
    // object-fit: cover;
// @media(max-width:990px){
//   min-height:100vh;
  
// }
`
const StyledDiv = styled.div`
padding-bottom: 60px;
overflow: hidden;
padding-top:100px;
@media (max-width: 500px) {
padding-bottom:40px;
padding-top:70px;
}
.caroussel-dots>* {
  background-color:#A2231F;
}
.caroussel {
// z-index:-1;
}
`
const SDiv = styled.div`
width:100vw;
// height:65vh;
// background-image:url(${b1});
// background-repeat:no-repeat;
// background-size:contain;
// background-position
`

