import React from 'react';
import styled from "styled-components"
import Layout from '../components/common/layout/layout';
import { Container, Section } from '../components/style';
import Navigation from '../components/common/navigation/navigation';
import bg from "../images/bg-courses.webp"
import courses from "../images/courses.svg"
import cm1 from "../images/cm1.svg"
import cm2 from "../images/cm2.svg"
import cm3 from "../images/cm3.svg"
import cm4 from "../images/cm4.svg"
import cm5 from "../images/cm5.svg"
import Form from '../components/common/contact-form';
import Footer from '../components/common/footer';

const Courses= () =>  {
  return (
    
  <Layout>
    <Navigation bgwhite={true}/>
    <StyledSection >
        <Container>
           
<div style={{textAlign:'center', width:'100%'}}>
<img src={courses} style={{width:'100%'}} alt="concept" />
</div>
<Section style={{background:'transparent'}}>
<Card>
  <ImgDiv>
  <img src={cm1} style={{width:'100%'}} alt="concept" />

  </ImgDiv>
  <div>
    <h2>
        Genesis
    </h2>
    <h4>
        <span>Target</span>: NEET-UG/AIIMS
        </h4>
        <h4>
        <span>Eligibility</span> : For class 10th to 11th moving students
        </h4>
        <h4>
        <span>Medium of Classes</span> : ENGLISH/HINDI
        </h4>
        <h4>
        <span>Syllabus Covered</span> : Complete 11th + NEET-UG/AIIMS syllabus of Biology, Physics and Chemistry.
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
        Orchid
    </h2>
    <h4>
        <span>Target</span>: NEET-UG/AIIMS
        </h4>
        <h4>
        <span>Eligibility</span> : For class 11th to 12th moving students
        </h4>
        <h4>
        <span>Medium of Classes</span> : ENGLISH/HINDI
        </h4>
        <h4>
        <span>Syllabus Covered</span> : Complete 12th + NEET-UG/AIIMS syllabus of Biology, Physics and Chemistry.
    </h4>
    <h4>
      batch starting soon 
      {/* <PrimaryButton>Contact us</PrimaryButton> */}
    </h4>
    </div>
    <ImgDiv>
  <img src={cm2} style={{width:'100%'}} alt="concept" />

  </ImgDiv>
</AlternateCard>
</Section>
<Section style={{background:'transparent'}}>
<Card>
  <ImgDiv>
  <img src={cm3} style={{width:'100%'}} alt="concept" />

  </ImgDiv>
  <div>
    <h2>
        Synapse
    </h2>
    <h4>
        <span>Target</span>: NEET-UG/AIIMS
        </h4>
        <h4>
        <span>Eligibility</span> : For after 12th class droper students
        </h4>
        <h4>
        <span>Medium of Classes</span> : ENGLISH/HINDI
        </h4>
        <h4>
        <span>Syllabus Covered</span> : Complete NEET-UG/AIIMS syllabus of Biology, Physics and Chemistry.
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
        <span>Target</span>: 12th Boards 
        </h4>
        <h4>
        <span>Eligibility</span> : For class 12th appeared students
        </h4>
        <h4>
        <span>Medium of Classes</span> : ENGLISH/HINDI
        </h4>
        <h4>
        <span>Syllabus Covered</span> : Complete 12th Boards syllabus of Biology, Physics and Chemistry.
    </h4>
    <h4>
      batch starting soon 
      {/* <PrimaryButton>Contact us</PrimaryButton> */}
    </h4>
    </div>
    <ImgDiv>
  <img src={cm4} style={{width:'100%'}} alt="concept" />

  </ImgDiv>
</AlternateCard>
</Section>
<Section style={{background:'transparent'}}>
<Card>
  <ImgDiv>
  <img src={cm5} style={{width:'100%'}} alt="concept" />

  </ImgDiv>
  <div>
    <h2>
        Crash Course
    </h2>
    <h4>
        <span>Target</span>: NEET-UG/AIIMS
        </h4>
        <h4>
        <span>Eligibility</span> : For after students appearing for NEET-UG/AIIMS
        </h4>
        <h4>
        <span>Medium of Classes</span> : ENGLISH/HINDI
        </h4>
        <h4>
        <span>Syllabus Covered</span> : Complete NEET-UG/AIIMS syllabus of Biology, Physics and Chemistry.
    </h4>
    <h4>
      batch starting soon 
      {/* <PrimaryButton>Contact us</PrimaryButton> */}
    </h4>
    </div>
</Card>
</Section>
<div id="contactus">
   <Form/>
   </div>
</Container>

</StyledSection>
<Footer/>
  </Layout>
  );
}

export default Courses;
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