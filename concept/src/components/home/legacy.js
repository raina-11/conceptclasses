import React, { useEffect, useRef } from 'react';
import styled from "styled-components"
import "./stack-cards.css"
import { ScrollObserver, valueAtPercentage } from "./aat.js";
import { useInView } from 'react-intersection-observer';
import { Container, PrimaryButton } from '../style.js';
import i1 from "../../images/building-cover.png"
import i2 from "../../images/sc-2.png"
import i3 from "../../images/sc-3.svg"
import i4 from "../../images/sc-4.svg"
import i5 from "../../images/sc-5.svg"
import { useNavigate } from 'react-router-dom';

const StackCards = ({ cardsData, title }) => {
    cardsData=["","","",""]
  console.log('useEffect triggered');
    const cardsContainerRef = useRef(null);
    const [containerRef, containerInView] = useInView({ triggerOnce: false });
const navigate = useNavigate();

    const onButtonClick = () => {
      // window.open('https://forms.gle/qrA57xAZgHyaJyxz8', '_blank');
    navigate('/science-champ');

  };
   useEffect(() => {
    if (containerInView){
        const cardsContainer = cardsContainerRef.current;
        const cards = cardsContainer?.querySelectorAll('.feature-card');
    
        if (!cardsContainer || !cards || cards.length === 0) {
          return;
        }
    
        cardsContainer.style.setProperty('--cards-count', cards.length);
        cardsContainer.style.setProperty('--card-height', `${cards[0].clientHeight}px`);
    
        cards.forEach((card, index) => {
          const offsetTop = 20 + index * 20;
          card.style.paddingTop = `${offsetTop}px`;
    
          if (index === cards.length - 1) {
            return;
          }
    
          const toScale = 1 - (cards.length - 1 - index) * 0.1;
          const nextCard = cards[index + 1];
          const cardInner = card.querySelector('.card__inner');
    
          if (!nextCard || !cardInner) {
            return;
          }
    
          ScrollObserver.Element(nextCard, {
            offsetTop,
            offsetBottom: window.innerHeight - card.clientHeight,
          }).onScroll(({ percentageY }) => {
            cardInner.style.transform = `scale(${valueAtPercentage({
              from: 1,
              to: toScale,
              percentage: percentageY,
            })})`;
            cardInner.style.filter = `brightness(${valueAtPercentage({
              from: 1,
              to: 0.8,
              percentage: percentageY,
            })})`;
          });
        });
      }
      },[containerInView]);

      const handleButtonClick = () => {
        const pdfUrl = 'https://drive.google.com/file/d/1_2M7oCD8awnrzMYfzFIrNd3DUbf0wkiX/view?usp=drive_link';
        const link = document.createElement("a");
        link.href = pdfUrl;
        window.open(pdfUrl, '_blank');
      };
      const handleButtonClick1 = () => {
        const pdfUrl = 'https://drive.google.com/file/d/1VBOEGkESBvcuHfd2lzQvStTe3vtv6NsS/view?usp=drive_link';
        const link = document.createElement("a");
        link.href = pdfUrl;
        window.open(pdfUrl, '_blank');
      };
      const handleButtonClick2 = () => {
        const pdfUrl = 'https://drive.google.com/file/d/18S6cp_uwnx-kdkzj3daWA7hy2_7PQH8Z/view?usp=drive_link';
        const link = document.createElement("a");
        link.href = pdfUrl;
        window.open(pdfUrl, '_blank');
      };


  return (

    // <Section>
    <Wrap>
    <Container>
      <div style={{backgroundColor:'#076B37', padding:'20px', borderRadius:'20px'}}>
      <KeyPopup style={{width:'100%', display:'flex', justifyContent:'center', alignItems:'center'}}>
             Concept Science Champ 2025 Answer Key is Out now <span>Seats filling fast!</span> 
             <styledDiv1 style={{display: 'flex', gap:'16px'}}>
            <PrimaryButton onClick={handleButtonClick} >
            Class 7th / 8th / 9th
            </PrimaryButton>
            <PrimaryButton onClick={handleButtonClick1} >
            Class 10th / 11th / 12th Set C1
            </PrimaryButton>
            <PrimaryButton onClick={handleButtonClick2} >
            Class 10th / 11th / 12th Set O1
            </PrimaryButton>
            </styledDiv1>
            Results will be out on 25th October 2024!
            </KeyPopup>
      </div>
    <Text>
                <h2>
                20+ years of Legacy
                </h2>

                </Text>
             
    <div ref={containerRef} >
      <div  className="cards" ref={cardsContainerRef}>
  

       <div  class="feature-card"  data-index="0">
    <div  style={{justifyContent:'space-between'}} class="card__inner">
      <div style={{padding:'0px', position:'relative', background:'darkseagreen'}} class="card__image-container">
         <FullImage className='a' style={{margin:'0px auto'}} >
                  <img  src={i1} alt="concept"/>
        </FullImage>
      </div>
      <div style={{justifyContent:'space-between'}} class="card__content">
        <div>
        <h4 class="card__title">Biggest Infrastructure</h4>
       
        </div>
        <div>
        <h4 class="card__title">Highest No. of facilities</h4>
       
        </div>
        <div>
        <h4 class="card__title">Largest pool of faculties</h4>
        
        </div>
      </div>
    </div>
  </div>
  
  <div  class="feature-card"  data-index="0">
    <div class="card__inner">
      <div style={{backgroundColor:'darkseagreen'}} class="card__image-container">
         <FullImage style={{margin:'0px auto'}} >
          <img src={i2} alt="concept"/>
        </FullImage>
      </div>
      <div class="card__content">
        <h4 class="card__title">Greatest Selection Ratio</h4>
        <p class="card__description">
       in IIT JEE / NEET
        </p>
      </div>
    </div>
  </div>
  <div  class="feature-card"  data-index="0">
    <div class="card__inner">
      <div style={{backgroundColor:'darkseagreen'}} class="card__image-container">
         <FullImage style={{margin:'0px auto'}} >
          <img src={i3} alt="concept"/>
        </FullImage>
      </div>
      <div class="card__content">
        <h4 class="card__title">Parent's Teacher Meetings</h4>
        <p class="card__description">
       Regular meetings are organised to discuss student's progress
        </p>
      </div>
    </div>
  </div>
  <div  class="feature-card"  data-index="0">
    <div class="card__inner">
      <div style={{backgroundColor:'darkseagreen'}} class="card__image-container">
         <FullImage style={{margin:'0px auto'}} >
          <img src={i4} alt="concept"/>
        </FullImage>
      </div>
      <div class="card__content">
        <h4 class="card__title">Motivational Sessions</h4>
        <p class="card__description">
        Motivation sessions keep the moral of the students up and keep them in a stress free state of mind.

        </p>
      </div>
  </div>
  </div>
  <div  class="feature-card"  data-index="0">
    <div class="card__inner">
      <div style={{backgroundColor:'darkseagreen'}} class="card__image-container">
         <FullImage style={{margin:'0px auto'}} >
          <img src={i5} alt="concept"/>
        </FullImage>
      </div>
      <div class="card__content">
        <h4 class="card__title">Concept Library</h4>
        <p class="card__description">
        A peaceful and conducive place to study
        </p>
      </div>
  </div>
  </div>
    </div>
    </div>
    <div class="space"></div>
    </Container>
    </Wrap>
    // </Section>

  );
};

export default StackCards;

const Wrap = styled.div`
background-color: white;
padding-top:40px;
padding-bottom:100px;
.card__image-container {
height:350px;
}
@media (max-width: ${props => props.theme.screen.sm}) {
    .card__image-container {
        height:240px;
        }
}
`
const FullImage = styled.div`
width:100%;
align-self: center;
margin:40px auto 0;
text-align:center;
img{
 width:90%;
 margin:0px auto;
 max-height: 300px;
}
@media (max-width: ${props => props.theme.screen.sm}) {
    width:95%;
  }
  @media (max-width: ${props => props.theme.screen.xs}) {
    img{
      width:90%;
     }
  }
&.a{
  position:absolute;
  bottom:-20px;
  height:100%;
  img{
    height:100%;
        width: auto;
    max-height: none;
  }
}
`
const Text = styled.div`
position:sticky;
top:16vh;
z-index:1;
h2{
    color:#000;
    // font-size:32px;
text-align:center;
font-family:'Lexend Medium';
// max-width:700px;
margin:auto;
span{

  background-repeat: no-repeat;
  background-position: bottom;
}
// max-width:800px;
margin: 40px auto;
margin-bottom:16px;
}
@media (max-width: ${props => props.theme.screen.lg}){
button{
  display:none;
}
}

@media (max-width: ${props => props.theme.screen.xs}){
    order:1;
}
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