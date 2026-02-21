import React, { useEffect, useRef } from 'react';
import styled from "styled-components"
import "./stack-cards.css"
import { ScrollObserver, valueAtPercentage } from "./aat.js";
import { useInView } from 'react-intersection-observer';
import { Container, PrimaryButton } from '../style.js';
import { useNavigate } from 'react-router-dom';
import { useAnnouncements, useLegacyCards } from '../../hooks/useFirestore';
import CloudImage from '../common/CloudImage';
// Hardcoded images - commented out, now loaded from admin panel
// import i1 from "../../images/building-cover.png"
// import i2 from "../../images/sc-2.png"
// import i3 from "../../images/sc-3.svg"
// import i4 from "../../images/sc-4.svg"
// import i5 from "../../images/sc-5.svg"

const StackCards = ({ cardsData, title }) => {
    cardsData=["","","",""]
    const cardsContainerRef = useRef(null);
    const [containerRef, containerInView] = useInView({ triggerOnce: false });
    const navigate = useNavigate();
    const { announcements } = useAnnouncements();
    const { cards: legacyCards } = useLegacyCards();

    const bannerAnnouncement = announcements.find(a => a.isBannerEnabled);

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
      {bannerAnnouncement && (
      <div style={{backgroundColor:'#076B37', padding:'20px', borderRadius:'20px', marginBottom:'30px', position:'relative', overflow:'visible'}}>
      <ScienceChampBanner style={{width:'100%', display:'flex', justifyContent:'center', alignItems:'center', flexDirection:'column', gap:'15px'}}>
        <NewLabel>NEW</NewLabel>
        <BannerTitle>
          {bannerAnnouncement.title}
        </BannerTitle>
        {(bannerAnnouncement.subtitle || bannerAnnouncement.description) && (
        <BannerText>
          {bannerAnnouncement.subtitle || bannerAnnouncement.description}
        </BannerText>
        )}
        {bannerAnnouncement.ctaText && (
        <PrimaryButton onClick={() => {
          const link = bannerAnnouncement.ctaLink || '/';
          if (link.startsWith('tel:') || link.startsWith('http')) {
            window.location.href = link;
          } else {
            navigate(link);
          }
        }} style={{height:'48px', padding:'12px 24px', backgroundColor:'white', color:'#076B37', fontWeight:'600'}}>
          {bannerAnnouncement.ctaText}
        </PrimaryButton>
        )}
      </ScienceChampBanner>
      </div>
      )}
    <Text>
                <h2>
                {Math.floor((new Date() - new Date(1999, 11, 1)) / (365.25 * 24 * 60 * 60 * 1000))}+ years of Legacy
                </h2>

                </Text>
             
    <div ref={containerRef} >
      <div  className="cards" ref={cardsContainerRef}>

    {legacyCards.map((card) => (
      <div className="feature-card" data-index="0" key={card.id}>
        <div className="card__inner">
          <div style={{backgroundColor:'darkseagreen'}} className="card__image-container">
            <FullImage style={{margin:'0px auto'}}>
              <CloudImage src={card.imageUrl} alt={card.title} width={800} />
            </FullImage>
          </div>
          <div className="card__content">
            <h4 className="card__title">{card.title}</h4>
            {card.description && (
              <p className="card__description">{card.description}</p>
            )}
          </div>
        </div>
      </div>
    ))}

    {/* COMMENTED OUT - Hardcoded cards, now loaded from admin panel (Legacy Cards)
       <div  className="feature-card"  data-index="0">
    <div  style={{justifyContent:'space-between'}} className="card__inner">
      <div style={{padding:'0px', position:'relative', background:'darkseagreen'}} className="card__image-container">
         <FullImage className='a' style={{margin:'0px auto'}} >
                  <img  src={i1} alt="concept"/>
        </FullImage>
      </div>
      <div style={{justifyContent:'space-between'}} className="card__content">
        <div><h4 className="card__title">Biggest Infrastructure</h4></div>
        <div><h4 className="card__title">Highest No. of facilities</h4></div>
        <div><h4 className="card__title">Largest pool of faculties</h4></div>
      </div>
    </div>
  </div>
  <div className="feature-card" data-index="0">
    <div className="card__inner">
      <div style={{backgroundColor:'darkseagreen'}} className="card__image-container">
         <FullImage style={{margin:'0px auto'}}><img src={i2} alt="concept"/></FullImage>
      </div>
      <div className="card__content">
        <h4 className="card__title">Greatest Selection Ratio</h4>
        <p className="card__description">in IIT JEE / NEET</p>
      </div>
    </div>
  </div>
  <div className="feature-card" data-index="0">
    <div className="card__inner">
      <div style={{backgroundColor:'darkseagreen'}} className="card__image-container">
         <FullImage style={{margin:'0px auto'}}><img src={i3} alt="concept"/></FullImage>
      </div>
      <div className="card__content">
        <h4 className="card__title">Parent's Teacher Meetings</h4>
        <p className="card__description">Regular meetings are organised to discuss student's progress</p>
      </div>
    </div>
  </div>
  <div className="feature-card" data-index="0">
    <div className="card__inner">
      <div style={{backgroundColor:'darkseagreen'}} className="card__image-container">
         <FullImage style={{margin:'0px auto'}}><img src={i4} alt="concept"/></FullImage>
      </div>
      <div className="card__content">
        <h4 className="card__title">Motivational Sessions</h4>
        <p className="card__description">Motivation sessions keep the moral of the students up and keep them in a stress free state of mind.</p>
      </div>
    </div>
  </div>
  <div className="feature-card" data-index="0">
    <div className="card__inner">
      <div style={{backgroundColor:'darkseagreen'}} className="card__image-container">
         <FullImage style={{margin:'0px auto'}}><img src={i5} alt="concept"/></FullImage>
      </div>
      <div className="card__content">
        <h4 className="card__title">Concept Library</h4>
        <p className="card__description">A peaceful and conducive place to study</p>
      </div>
    </div>
  </div>
    END COMMENTED OUT */}

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
overflow:hidden;
}
@media (max-width: ${props => props.theme.screen.sm}) {
    .card__image-container {
        height:240px;
        }
}
`
const FullImage = styled.div`
width:90%;
max-height:300px;
align-self: center;
margin:0px auto;
text-align:center;
img{
 width:100%;
 max-height: 300px;
 object-fit: contain;
}
@media (max-width: ${props => props.theme.screen.sm}) {
    width:95%;
  }
  @media (max-width: ${props => props.theme.screen.xs}) {
    img{
      width:100%;
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

const BannerTitle = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #EFC800;
  font-family: 'Lexend Bold';

  @media (max-width: ${props => props.theme.screen.sm}) {
    font-size: 20px;
  }

  @media (max-width: ${props => props.theme.screen.xs}) {
    font-size: 18px;
  }
`

const BannerText = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: #B4D9C3;
  font-family: 'Lexend Medium';

  @media (max-width: ${props => props.theme.screen.sm}) {
    font-size: 16px;
  }

  @media (max-width: ${props => props.theme.screen.xs}) {
    font-size: 14px;
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