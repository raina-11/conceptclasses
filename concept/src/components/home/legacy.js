import React, { useEffect, useRef } from 'react';
import styled from "styled-components"
import "./stack-cards.css"
import { ScrollObserver, valueAtPercentage } from "./aat.js";
import { useInView } from 'react-intersection-observer';
import { Container, PrimaryButton } from '../style.js';
import { useNavigate } from 'react-router-dom';
import i1 from "../../images/building-cover.png"
import i2 from "../../images/sc-2.png"
import i3 from "../../images/sc-3.svg"
import i4 from "../../images/sc-4.svg"
import i5 from "../../images/sc-5.svg"

const StackCards = ({ cardsData, title }) => {
    cardsData=["","","",""]
  console.log('useEffect triggered');
    const cardsContainerRef = useRef(null);
    const [containerRef, containerInView] = useInView({ triggerOnce: false });
    const navigate = useNavigate();

    const handleResultsClick = () => {
      navigate('/science-champ-result-2026/');
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

  return (

    // <Section>
    <Wrap>
    <Container>
      <div style={{backgroundColor:'#076B37', padding:'20px', borderRadius:'20px', marginBottom:'30px', position:'relative', overflow:'visible'}}>
      <ScienceChampBanner style={{width:'100%', display:'flex', justifyContent:'center', alignItems:'center', flexDirection:'column', gap:'15px'}}>
        <NewLabel>NEW</NewLabel>
        <BannerText>
          🎉 Science Champ 2025-2026 Results are OUT!
        </BannerText>
        <PrimaryButton onClick={handleResultsClick} style={{height:'48px', padding:'12px 24px', backgroundColor:'white', color:'#076B37', fontWeight:'600'}}> 
          Check Your Results
        </PrimaryButton>
      </ScienceChampBanner>
      </div>
    <Text>
                <h2>
                25+ years of Legacy
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
const ScienceChampBanner = styled.div`
  text-align: center;
  color: white;
`

const NewLabel = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(45deg, #ff6b6b, #ffd93d);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 25px;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.5);
  animation: pulse 2s infinite, bounce 3s infinite;
  z-index: 10;
  border: 3px solid #fff;
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
  
  &::before {
    content: '✨';
    position: absolute;
    left: -12px;
    top: 50%;
    transform: translateY(-50%);
    animation: sparkle 1.5s infinite;
    font-size: 16px;
  }
  
  &::after {
    content: '✨';
    position: absolute;
    right: -12px;
    top: 50%;
    transform: translateY(-50%);
    animation: sparkle 1.5s infinite 0.5s;
    font-size: 16px;
  }
  
  @keyframes sparkle {
    0%, 100% { opacity: 0; transform: translateY(-50%) scale(0.5); }
    50% { opacity: 1; transform: translateY(-50%) scale(1); }
  }
  
  @media (max-width: ${props => props.theme.screen.sm}) {
    font-size: 10px;
    padding: 6px 12px;
    top: -3px;
    right: -3px;
  }
  
  @media (max-width: ${props => props.theme.screen.xs}) {
    font-size: 9px;
    padding: 4px 8px;
  }
`

const BannerText = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: white;
  font-family: 'Lexend Medium';
  
  @media (max-width: ${props => props.theme.screen.sm}) {
    font-size: 18px;
  }
  
  @media (max-width: ${props => props.theme.screen.xs}) {
    font-size: 16px;
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