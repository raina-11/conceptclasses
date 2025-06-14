import React from 'react';
import styled from "styled-components"
import b1 from "../images/1.webp"
import b2 from "../images/2.webp"
import b3 from "../images/3.webp"
import b4 from "../images/4.webp"
import b5 from "../images/5.webp"
import b6 from "../images/6.webp"
import b7 from "../images/7.webp"
import Navigation from '../components/common/navigation/navigation';
import Layout from '../components/common/layout/layout';
import ScrollSmooth from '../components/home/smooth-scroll';
import StackCards from '../components/home/legacy';
import DirectorQuote from '../components/home/director-quote';
import Footer from '../components/common/footer';
import Form from '../components/common/contact-form';
import Carousel from "react-caroussel";
import "react-caroussel/dist/index.css";
import Popup from 'reactjs-popup';
import { PrimaryButton } from '../components/style';
import { useNavigate } from 'react-router-dom';

const Home= () =>  {

const navigate = useNavigate();

  const handleButtonClick3 = () => {
    navigate('/college-search');
  };

  return (
    <Layout>
    <Navigation bgwhite={true}/>

  
    <Popup
            open={true}
            position="center"
            modal
            overlayStyle={{ background: "transparent", backdropFilter:"blur(5px)" }}
            contentStyle={{ width:'90%',borderRadius:'20px', maxHeight:"700px", background:'#076B37',padding:"0", zIndex:"-2"}}
            style={{ borderRadius: "22px" }}
            closeOnDocumentClick
          >
            <KeyPopup style={{width:'100%', height:'50vh', display:'flex', justifyContent:'center', alignItems:'center'}}>
              <PopupHeading>
                Find the right college for you!
              </PopupHeading>
              <PopupDescription>
                Explore placement statistics and opening and closing of IITs, NITs, IIITs, and GFTIs - all in one place
              </PopupDescription>
              <TempStyledDiv>
              <PrimaryButton onClick={handleButtonClick3} >
                Click here
              </PrimaryButton>
              </TempStyledDiv>
            </KeyPopup>
            </Popup>
  
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

    
    <SDiv>
    <link rel="preload" href={b1} as="image"/>
    <StyledImage src={b1} alt="concept institute bikaner"></StyledImage> 

    </SDiv>
    <SDiv>
    <StyledImage src={b2} alt="concept institute bikaner"></StyledImage> 
    </SDiv>
    <SDiv>
    <StyledImage src={b3} alt="concept institute bikaner"></StyledImage> 
    </SDiv>
    <SDiv>
    <StyledImage src={b4} alt="concept institute bikaner"></StyledImage> 
    </SDiv>
    <SDiv>
    <StyledImage src={b5} alt="concept institute bikaner"></StyledImage> 
    </SDiv>
    <SDiv>
    <StyledImage src={b6} alt="concept institute bikaner"></StyledImage> 
    </SDiv>
    <SDiv>
    <StyledImage src={b7} alt="concept institute bikaner" ></StyledImage> 
    </SDiv>
    {/* <SDiv>
    <StyledImage src={b2} alt="IIT JEE institute bikaner"></StyledImage> 
    </SDiv> */}
    {/* <SDiv>
    <StyledImage src={b5} alt="Best IIT JEE institute bikaner"></StyledImage> 
    </SDiv>
    */}
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

const KeyPopup = styled.div`
font-family:Lexend Medium;
padding:0px 10px;
font-size: 40px;
text-align:center;
flex-direction:column;
color:#fff;
gap:16px;
img{
  width: 80px;
}
@media (max-width: 500px) {
font-size:19px;
}
span{
  color:#EFC800;
  font-family:Lexend Bold;
}
`

const TempStyledDiv = styled.div`
display: flex;
gap:16px;

@media (max-width: 600px) {
flex-direction: column;
gap:8px;
}
`

const PopupHeading = styled.div`
  color: #EFC800;
  font-size: 32px;
  margin-bottom: 20px;
  @media (max-width: 500px) {
    font-size: 24px;
  }
`

const PopupDescription = styled.div`
  color: #B4D9C3;
  font-size: 24px;
  line-height: 1.4;
  @media (max-width: 500px) {
    font-size: 16px;
  }
`