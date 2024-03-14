import React from 'react';
import styled from "styled-components"
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

const Home= () =>  {
 
  return (
    <Layout>
    <Navigation bgwhite={true}/>

  
  
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

`

