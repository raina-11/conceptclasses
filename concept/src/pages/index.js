import React from 'react';
import styled from "styled-components"
import b1 from "../images/b1.webp"
import b3 from "../images/b3n.webp"
import b6 from "../images/bn.webp"
import b7 from "../images/bn1.webp"
import b8 from "../images/bn2.webp"
import b9 from "../images/bn3.webp"
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
  const onButtonClick = () => {
    // const pdfUrl = 'https://drive.google.com/file/d/1hnS_ln7eGO0LABL0SuZGGvNZSn7VMhYu/view?usp=sharing';
    // const link = document.createElement("a");
    // link.href = pdfUrl;
    // link.download = "answerkey.pdf"; // specify the filename
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
    // https://drive.google.com/file/d/1vssU-SrVBkE9B2l9bvuLnmpoV9QI3Hez/view?usp=sharing
    window.open('https://forms.gle/qrA57xAZgHyaJyxz8', '_blank');
};
const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate('/science-champ');
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
             Concept Science Champ 2025 is hereeeee <span>Seats filling fast!</span> 
            <PrimaryButton onClick={handleButtonClick} >
            Enroll Now
            </PrimaryButton>
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
    <link rel="preload" href={b3} as="image"/>
    <StyledImage src={b3} alt="concept institute bikaner"></StyledImage> 

    </SDiv>
    <SDiv>
    <StyledImage src={b6} alt="concept institute bikaner"></StyledImage> 
    </SDiv>
    <SDiv>
    <StyledImage src={b7} alt="concept institute bikaner"></StyledImage> 
    </SDiv>
    <SDiv>
    <StyledImage src={b8} alt="concept institute bikaner"></StyledImage> 
    </SDiv>
    <SDiv>
    <StyledImage src={b9} alt="concept institute bikaner"></StyledImage> 
    </SDiv>
    {/* <SDiv>
    <StyledImage src={b4} alt="concept institute bikaner"></StyledImage> 
    </SDiv> */}
    <SDiv>
    <StyledImage src={b1} alt="concept institute bikaner" ></StyledImage> 
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