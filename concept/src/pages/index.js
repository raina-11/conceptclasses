import React, { useState, useEffect } from 'react';
import styled from "styled-components"
import Navigation from '../components/common/navigation/navigation';
import Layout from '../components/common/layout/layout';
import ScrollSmooth from '../components/home/smooth-scroll';
import StackCards from '../components/home/legacy';
// import ScienceChampBanner from '../components/home/science-champ-banner';
import DirectorQuote from '../components/home/director-quote';
import FAQ from '../components/home/FAQ';
import Footer from '../components/common/footer';
import Form from '../components/common/contact-form';
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import Popup from 'reactjs-popup';
import { PrimaryButton } from '../components/style';
import { useNavigate } from 'react-router-dom';
import { useBanners, useAnnouncements } from '../hooks/useFirestore';
import SEO from '../components/common/SEO';
import seoConfig from '../seo/seoConfig';
import { createBreadcrumbSchema, createFAQSchema } from '../seo/schemas';
import { faqs } from '../components/home/FAQ';

const Home= () =>  {

const navigate = useNavigate();
const [isPopupOpen, setIsPopupOpen] = useState(true);
const [carouselKey, setCarouselKey] = useState(Date.now());
const { banners, loading: bannersLoading } = useBanners();
const { announcements } = useAnnouncements();

const popupAnnouncement = announcements.find(a => a.isPopupEnabled);

useEffect(() => {
  if (!isPopupOpen || !bannersLoading) {
    setCarouselKey(Date.now());
  }
}, [isPopupOpen, bannersLoading]);

  const handleCtaClick = () => {
    setIsPopupOpen(false);
    if (popupAnnouncement?.ctaLink) {
      if (popupAnnouncement.ctaLink.startsWith('tel:') || popupAnnouncement.ctaLink.startsWith('http')) {
        window.location.href = popupAnnouncement.ctaLink;
      } else {
        navigate(popupAnnouncement.ctaLink);
      }
    }
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  const schemaMarkup = [
    createBreadcrumbSchema([{ name: 'Home', path: '/' }]),
    createFAQSchema(faqs),
  ];

  return (
    <Layout>
    <SEO {...seoConfig.home} schemaMarkup={schemaMarkup} />
    <Navigation bgwhite={true}/>

    <main>
    <H1>Best IIT-JEE & NEET Coaching in Bikaner Since 1999</H1>
    {popupAnnouncement && (
    <Popup
            open={isPopupOpen}
            position="center"
            modal
            overlayStyle={{ background: "transparent", backdropFilter:"blur(5px)" }}
            contentStyle={{ width:'90%',borderRadius:'20px', maxHeight:"700px", background:'#076B37',padding:"0", zIndex:"-2"}}
            style={{ borderRadius: "22px" }}
            closeOnDocumentClick={true}
            onClose={closePopup}
          >
            <KeyPopup style={{width:'100%', height:'50vh', display:'flex', justifyContent:'center', alignItems:'center'}}>
              <CloseButton onClick={closePopup}>×</CloseButton>
              <PopupHeading>
                {popupAnnouncement.title}
              </PopupHeading>
              <PopupDescription>
                {popupAnnouncement.subtitle || popupAnnouncement.description}
              </PopupDescription>
              {popupAnnouncement.ctaText && (
              <TempStyledDiv>
              <PrimaryButton onClick={handleCtaClick}>
                {popupAnnouncement.ctaText}
              </PrimaryButton>
              </TempStyledDiv>
              )}
            </KeyPopup>
            </Popup>
    )}
  
    {banners.length > 0 && (
    <StyledDiv>
    <Carousel
    key={carouselKey}
    infiniteLoop={true}
    autoPlay={true}
    interval={4000}
    showThumbs={false}
    showStatus={false}
    showArrows={false}
    stopOnHover={false}
    >
    {banners.map((banner, index) => (
      <SDiv key={banner.id || index}>
        <StyledImage src={banner.imageUrl} alt={banner.altText || 'concept institute bikaner'} />
      </SDiv>
    ))}
  </Carousel>
  </StyledDiv>
    )}

   {/* <ScienceChampBanner/> */}
   <StackCards/>
   <ScrollSmooth/>
 
   <DirectorQuote/>
   
<FAQ/>
<div id="contactus">
   <Form/>
   </div>
   </main>
   <Footer/>
   </Layout>
   
  );
}

export default Home;

const H1 = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`
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

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`