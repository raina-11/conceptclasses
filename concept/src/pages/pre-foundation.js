import React from 'react';
import styled from "styled-components"
import Layout from '../components/common/layout/layout';
import { Container, Section } from '../components/style';
import Navigation from '../components/common/navigation/navigation';
import bg from "../images/bg-courses.webp"
import courses from "../images/courses.svg"
import cp1 from "../images/cp1.svg"
import cp2 from "../images/cp2.svg"
import p1 from "../images/p1.webp"
import p2 from "../images/p2.webp"
import p3 from "../images/p3.webp"
import p4 from "../images/p4.webp"
import p5 from "../images/p5.webp"
import p6 from "../images/p6.webp"
import p7 from "../images/p7.webp"
import p8 from "../images/p8.webp"
import p9 from "../images/p9.webp"
import p10 from "../images/p10.webp"
import p11 from "../images/p11.webp"
import "./marquee.css"
import Form from '../components/common/contact-form';
import Footer from '../components/common/footer';

const Courses= () =>  {
  return (
    
  <Layout>
    <Navigation bgwhite={true}/>
    <StyledSection >
        <Container>
           
<div style={{textAlign:'center', width:'100%'}}>
<img src={courses} style={{width:'100%'}} alt="concept"/>
</div>
<Section  style={{background:'transparent'}}>
<Card >
  <ImgDiv>
  <img src={cp1} style={{width:'100%'}} alt="concept" />

  </ImgDiv>
  <div>
    <h2>
        Focus
    </h2>
    <h4>
        <span>Target</span>: Succeding in Career
        </h4>
        <h4>
        <span>Eligibility</span> : For class 8th to 9th moving students
        </h4>
        <h4>
        <span>Medium of Classes</span> : ENGLISH/HINDI
        </h4>
        <h4>
        <span>Syllabus Covered</span> : Complete 10th Board syllabus of Maths, Physics, Biology, Chemistry & English.
    </h4>
    <h4 id="ninth">
      batch starting soon 
      {/* <PrimaryButton>Contact us</PrimaryButton> */}
    </h4>
    </div>
</Card>
</Section>

<Section  style={{background:'transparent'}}>
<AlternateCard>
  
  <div>
    <h2>
        Laser
    </h2>
    <h4>
        <span>Target</span>: Succeding in Career
        </h4>
        <h4>
        <span>Eligibility</span> : For class 9th to 10th moving students
        </h4>
        <h4>
        <span>Medium of Classes</span> : ENGLISH/HINDI
        </h4>
        <h4>
        <span>Syllabus Covered</span> : Complete 10th Board syllabus of Maths, Physics, Biology, Chemistry & English.
    </h4>
    <h4 >
      batch starting soon 
      {/* <PrimaryButton>Contact us</PrimaryButton> */}
    </h4>
    </div>
    <ImgDiv>
  <img src={cp2} style={{width:'100%'}} alt="concept" />

  </ImgDiv>
</AlternateCard>
</Section>


</Container>
</StyledSection>
<Section style={{background:'ivory'}}>
        <div className="containerm">
          <h2 style={{ textAlign:'center'}}>
          We focus on Overall development
            
          </h2>
        <div  class="marquee">
  <div class="marquee__group">
    <img src={p1} alt=''/>
    <img src={p2} alt=''/>
    <img src={p3} alt=''/>
    <img src={p4} alt=''/>
    <img src={p5} alt=''/>
  </div>

  <div aria-hidden="true" class="marquee__group">
  <img src={p6} alt=''/>
  <img src={p7} alt=''/>
    <img src={p8} alt=''/>
    <img src={p9} alt=''/>
    <img src={p10} alt=''/>
  </div>
</div>
<div class="marquee marquee--reverse">
  <div class="marquee__group">
    <img src={p7} alt=''/>
    <img src={p8} alt=''/>
    <img src={p9} alt=''/>
    <img src={p10} alt=''/>
    <img src={p11} alt=''/>
  </div>

  <div aria-hidden="true" class="marquee__group">
  <img src={p1} alt=''/>
  <img src={p2} alt=''/>
    <img src={p3} alt=''/>
    <img src={p6} alt=''/>
    <img src={p5} alt=''/>
  </div>
</div>

        </div>
        <div id="contactus">
   <Form/>
   </div>
      </Section>
      
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