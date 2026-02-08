import React, { useEffect, useRef, useState } from "react";

import TimelineObserver from "react-timeline-animation";
import { fireConfetti } from "./confetti";
import styled from "styled-components"
import "./about.css";
import { Container, Section } from "../components/style";
import bg from "../images/bg-courses.webp"
import bga from "../images/bg-about.png"
import bm from "../images/bm-about.png"
import building from "../images/new-building.webp"
import Layout from "../components/common/layout/layout";
import Navigation from "../components/common/navigation/navigation";
import Form from '../components/common/contact-form';
import Footer from "../components/common/footer";
import SEO from '../components/common/SEO';
import seoConfig from '../seo/seoConfig';
import { createBreadcrumbSchema } from '../seo/schemas';

const Timeline = ({ setObserver, callback }) => {
  const [message1, setMessage1] = useState("");
  const [message2, setMessage2] = useState("");
  const [message3, setMessage3] = useState("");

  const timeline1 = useRef(null);
  const timeline2 = useRef(null);
  const timeline3 = useRef(null);
  const circle1 = useRef(null);
  const circle2 = useRef(null);
  const circle3 = useRef(null);

  const someCallback = () => {
    setMessage1("जिद हो अगर IITian / Doctor बनने की");
    callback();
  };

  const someCallback2 = () => {
    setMessage2("जुनून हो अगर मंजिल पाने का");
  };

  const someCallback3 = () => {
    setMessage3("तो जीत है सुनिशचित");
    fireConfetti();
  };

  useEffect(() => {
    setObserver(timeline1.current);
    setObserver(timeline2.current);
    setObserver(timeline3.current);
    setObserver(circle1.current, someCallback);
    setObserver(circle2.current, someCallback2);
    setObserver(circle3.current, someCallback3);
  });

  return (
    <>
<div className="wrapper">
      <div id="timeline1" ref={timeline1} className="timeline" />
      <div className="circleWrapper">
        <div id="circle1" ref={circle1} className="circle">
          1
        </div>
        <div className="message">{message1}</div>
      </div>
      <div id="timeline2" ref={timeline2} className="timeline" />
      <div className="circleWrapper">
        <div id="circle2" ref={circle2} className="circle">
          2
        </div>
        <div className="message">{message2}</div>
      </div>
      <div id="timeline3" ref={timeline3} className="timeline" />
      <div className="circleWrapper">
        <div id="circle3" ref={circle3} className="circle">
          3
        </div>
        <div className="message">{message3}</div>
      </div>
    </div>
</>
  );
};

export default function About() {

  const onCallback = () => {
    console.log("awesome");
  };

  return (
    <Layout>
      <SEO {...seoConfig.about} schemaMarkup={createBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }])} />
      <Navigation/>
    <main>
    <StyledSection >
      <h1 style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>About Concept Classes</h1>
      <Header className="stub1"> We believe: </Header>
      <SContainer>
      <TimelineObserver
        initialColor="#e5e5e5"
        fillColor="#005B38"
        handleObserve={(setObserver) => (
          <Timeline
            callback={onCallback}
            className="timeline"
            setObserver={setObserver}
          />
        )}
      />
      <div className="stub2"></div>
      </SContainer>

    </StyledSection>
    <Section>
      <Container>
        <h2 style={{textAlign:'center', marginTop:'0px',marginBottom:'62px'}}> See What our Director has to say!</h2>
        <Grid>
<Director>
  <div style={{textAlign:'center'}}>
  <img src={bm} alt="Er. Bhupendra Middha, Managing Director of Concept Classes">
  </img>
  </div>

  <h4>Er. Bhupendra Middha</h4>
  <p>Mathematics | 24 yrs Experience</p>
  <p style={{marginTop:'4px'}}>Managing Director</p>
</Director>
<Text>
<p>"In the present competitive world, merely working hard towards a dream will not suffice. One has to understand the latest trends and strategies to achieve success. Modern technology has brought revolutionary changes to our old methods of teaching, helping us train our students with effective examination strategies essential for success in competitive examinations. The competencies, dedication, and long experience of the faculty at institute, coupled with the introduction of a modern approach dedicated to equip students with ideal guidance, will enable Conceptians to continue scaling new heights and make a prominent mark in the educational circles of the country. Best wishes!"</p>
</Text>
        </Grid>
      </Container>
    </Section>
    <Section>
    <h2 style={{textAlign:'center', marginTop:'0px',marginBottom:'40px'}}> Our Story</h2>
<Container>
<Company>
<div style={{borderRadius:'20px', background:'#fff', padding:'16px'}}>
<p>
Concept was founded in 1999 in Bikaner with a dream to fulfilled of the students aspiring to be doctors and engineers. It was a modest beginning by a team of doctors, engineers and highly learned faculties to enable balanced preparation of competitive and board exams under one roof.

Today Concept has become synonymous with 'Success', a name students can count upon to get through different competitive exams.

Over the years, Concept continued scaling heights, enabling more and more students to achieve success at various National Level Competitive Exams like IIT-JEE (Main/Advanced), BITS, NEET, KVPY etc. Concept has been continuously maintaining a magnificent growing graph of success, no. of selections and top ranks every year with its most advanced education system and its extremely efficient and experienced faculty members having absolute command over all the subjects. With every passing year the number of successful students went up and today Concept has become a leading coaching institution of western Rajasthan and the first choice of the medical and engineering aspirants.
</p>

</div>
<ImgDiv>
<img src={building} alt="Concept Classes building in Bikaner"/>
</ImgDiv>
      </Company>
</Container>
      
    </Section>
    <div id="contactus">
   <Form/>
   </div>
   </main>
   <Footer/>
    </Layout>
  );
}

const Header = styled.div`
background-image:url(${bg});
background-size:cover;
background-position:center;
background-repeat:no-repeat;
position:sticky;
top:15vh;
z-index:1;
@media (max-width: ${(props) => props.theme.screen.sm}) {
top:11vh;
}
`
const SContainer = styled(Container)`

`
const StyledSection = styled(Section)`
padding-top:10px;
background-image:url(${bga});
background-size:cover;
background-position:center;
background-repeat:no-repeat;
overflow:unset;
padding-bottom:120px;
`
const Grid = styled.div`
border-radius:16px;

display:grid;
grid-template-columns: 1fr 1.5fr;
background:#005B38;
padding:24px;
@media (max-width: ${(props) => props.theme.screen.sm}) {
grid-template-columns: 1fr;

}
`
const Text = styled.div`
border-radius:16px;
background:#fff;
padding:16px;
font-family:Lexend Regular;
// font-size:19px;
p{
  color:#000;

}
line-height:normal;
`
const Director = styled.div`
padding:16px;
background:#005B38;
color:#fff;
position:relative;
img{
  width: 200px;
    margin-top: -100px;
    margin-right:15px;
}
h4{
  font-size:20px;
color:#fff;
margin:8px 0px;
}
p{
  color:#fff;
margin:0px;
}
@media (max-width: ${(props) => props.theme.screen.xs}) {
  margin-right:0px;
}
`
const Company = styled.div`
display: grid;
grid-template-columns: 2fr 1.1fr;
// background:rgb(0,91,56,0.5);
background:#A2231F;
border-radius:20px;
gap:16px;
padding:16px;
p{
  color:#000;
  // font-size:20px;
}
@media (max-width: ${(props) => props.theme.screen.md}) {
  grid-template-columns: 2fr 1.5fr;

}
@media (max-width: ${(props) => props.theme.screen.sm}) {
  grid-template-columns: 1fr;

}
`
const ImgDiv = styled.div`
width:100%;
align-self: center;
text-align:center;
img{
  width:100%;
  border-radius:20px;
}
@media (max-width: ${(props) => props.theme.screen.sm}) {
  order:-1;
img{
max-width:340px;
}
}
`