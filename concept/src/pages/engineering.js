import React, { useState } from 'react';
import styled from "styled-components"
import Layout from '../components/common/layout/layout';
import { Container, PrimaryButton, Section } from '../components/style';
import Navigation from '../components/common/navigation/navigation';
import ReactPlayer from 'react-player'
import bg from "../images/bg-courses.webp"
import courses from "../images/courses.svg"
import ce1 from "../images/ce1.svg"
import ce2 from "../images/ce2.svg"
import ce3 from "../images/ce3.svg"
import ce4 from "../images/ce4.svg"
import Form from '../components/common/contact-form';
import Footer from '../components/common/footer';

const Courses= () =>  {
  return (
    
  <Layout>
    <Navigation bgwhite={true}/>
    <StyledSection >
        <Container>
           
<div style={{textAlign:'center', width:'100%'}}>
<img src={courses} style={{width:'100%'}} />
</div>
<Section style={{background:'transparent'}}>
<Card>
  <ImgDiv>
  <img src={ce1} style={{width:'100%'}} />

  </ImgDiv>
  <div>
    <h2>
        Early Lead
    </h2>
    <h4>
        <span>Target</span>: IIT JEE (Mains & Advanced)
        </h4>
        <h4>
        <span>Eligibility</span> : For class 10th to 11th moving students
        </h4>
        <h4>
        <span>Medium of Classes</span> : ENGLISH/HINDI
        </h4>
        <h4>
        <span>Syllabus Covered</span> : Complete 11th + JEE (Main and Advanced) syllabus of Maths, Physics and Chemistry.
    </h4>
    <h4>
      batch starting soon 
      {/* <PrimaryButton>Contact us</PrimaryButton> */}
    </h4>
    </div>
</Card>
</Section>
<Section style={{background:'transparent'}}>
<AlternateCard>
  
  <div>
    <h2>
        Flight
    </h2>
    <h4>
        <span>Target</span>: IIT JEE (Mains & Advanced)
        </h4>
        <h4>
        <span>Eligibility</span> : For class 11th to 12th moving students
        </h4>
        <h4>
        <span>Medium of Classes</span> : ENGLISH/HINDI
        </h4>
        <h4>
        <span>Syllabus Covered</span> : Complete 12th + JEE (Main and Advanced) syllabus of Maths, Physics and Chemistry.
    </h4>
    <h4>
      batch starting soon 
      {/* <PrimaryButton>Contact us</PrimaryButton> */}
    </h4>
    </div>
    <ImgDiv>
  <img src={ce2} style={{width:'100%'}} />

  </ImgDiv>
</AlternateCard>
</Section>
<Section style={{background:'transparent'}}>
<Card>
  <ImgDiv>
  <img src={ce3} style={{width:'100%'}} />

  </ImgDiv>
  <div>
    <h2>
        Eagle's Eye
    </h2>
    <h4>
        <span>Target</span>: IIT JEE (Mains & Advanced)
        </h4>
        <h4>
        <span>Eligibility</span> : For after 12th class droper students
        </h4>
        <h4>
        <span>Medium of Classes</span> : ENGLISH/HINDI
        </h4>
        <h4>
        <span>Syllabus Covered</span> : Complete JEE (Main and Advanced) syllabus of Maths, Physics and Chemistry.
    </h4>
    <h4>
      batch starting soon 
      {/* <PrimaryButton>Contact us</PrimaryButton> */}
    </h4>
    </div>
</Card>
</Section>
<Section style={{background:'transparent'}}>
<AlternateCard>
  
  <div>
    <h2>
        Sucess Elevator
    </h2>
    <h4>
        <span>Target</span>: 12th Boards + IIT JEE Mains
        </h4>
        <h4>
        <span>Eligibility</span> : For class 12th appeared students
        </h4>
        <h4>
        <span>Medium of Classes</span> : ENGLISH/HINDI
        </h4>
        <h4>
        <span>Syllabus Covered</span> : Complete 12th + JEE Main syllabus of Maths, Physics and Chemistry.
    </h4>
    <h4>
      batch starting soon 
      {/* <PrimaryButton>Contact us</PrimaryButton> */}
    </h4>
    </div>
    <ImgDiv>
  <img src={ce4} style={{width:'100%'}} />

  </ImgDiv>
</AlternateCard>
<div id="contactus">
   <Form/>
   </div>
</Section>

</Container>
</StyledSection>
<Footer/>
  </Layout>
  );
}

export default Courses;
const Button = styled.div`
cursor:pointer;
`
const Video = styled.div`
.react-player__preview{
    background-size: contain !important;
    background-repeat:no-repeat !important;
}

video{
    width:100%;
    object-fill:fit-content;
  }
`
const Card = styled.div`
border-radius:20px;
padding:40px;
// margin-bottom:24px;
// background:antiquewhite;
background:darkseagreen;
display:grid;
grid-template-columns:1fr 1.5fr;
gap:24px;

h4{
    font-family:Lexend Regular;
    margin:10px 0px;
    font-size:21px;
    span{

    }
}
@media (max-width: ${(props) => props.theme.screen.sm}) {
grid-template-columns:1fr ;
h4{
  font-size:19px;
}

}
@media (max-width: ${(props) => props.theme.screen.xs}) {
    padding:24px;
    h2{
      font-size:24px;
      margin-bottom:20px;
    }
    h4{
    font-size:16px;

    }
}
`
const StyledSection = styled(Section)`
// background-image:url(${bg});
// background-repeat:no-repeat;
// background-size:cover;
background-color: ivory;
}
`
const ImgDiv =  styled.div`
width:100%;
align-self:center;
text-align:center;
img{
  max-width:350px;
}
@media (max-width: ${(props) => props.theme.screen.sm}) {
order:-1;
}
@media (max-width: ${(props) => props.theme.screen.xs}) {
img{
  max-width:250px;
}
}
`
const AlternateCard = styled(Card)`
background:aquamarine;
grid-template-columns:1.5fr 1fr;
@media (max-width: ${(props) => props.theme.screen.sm}) {
  grid-template-columns:1fr ;
  
  }
`