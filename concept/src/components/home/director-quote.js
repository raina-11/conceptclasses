import React, { useState } from "react"
import styled from "styled-components"
import { Container, SecondaryButton, Section } from "../style";
import ModalVideo from 'react-modal-video'
import bm from "../../images/thumbnail.webp"
import "./modal-video.css"
import v1 from "../../images/concept-demo.webm"
import AnchorLink from 'react-anchor-link-smooth-scroll'

const DirectorQuote = (props) => {
    const [isOpenSMP, setOpenSMP] = useState(false);
return(
    <SSection>
        <ModalVideo channel='custom' autoplay isOpen={isOpenSMP} url={v1} width="100%" style={{ width: "100%" }} onClose={() => setOpenSMP(false)} />

          
        <Container style={{position:'relative'}}>
        <Grid>
<Quote>
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
  <g clip-path="url(#clip0_2268_2280)">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M26 14L30 26H26V36H36V26L32 14H26Z" fill="white"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M10 14L14 26H10V36H20V26L16 14H10Z" fill="white"/>
  </g>
  <defs>
    <clipPath id="clip0_2268_2280">
      <rect width="48" height="48" fill="white" transform="matrix(-1 0 0 1 48 0)"/>
    </clipPath>
  </defs>
</svg>
</Quote>

<FullImage>

                                <img src={bm} alt="Er. Bhupendra Middha, Director of Concept Classes"  />
                                <PlayButton onClick={() => setOpenSMP(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 152 152" fill="none">
  <g >
    <g >
      <circle cx="76" cy="73" r="54" fill="#005B38"/>
    </g>
    <path d="M91.1074 71.23C92.1611 71.8423 92.1611 73.3641 91.1074 73.9764L66.4744 88.2902C65.4156 88.9054 64.0882 88.1415 64.0882 86.9169L64.0882 58.2895C64.0882 57.0649 65.4156 56.301 66.4744 56.9162L91.1074 71.23Z" fill="white"/>
  </g>
  <defs>
    <filter id="filter0_d_1990_16138" x="15" y="12" width="130" height="130" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dx="4" dy="4"/>
      <feGaussianBlur stdDeviation="5.5"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.14 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1990_16138"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1990_16138" result="shape"/>
    </filter>
    <filter id="filter1_d_1990_16138" x="0.4" y="0.524999" width="151.2" height="151.2" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dy="3.125"/>
      <feGaussianBlur stdDeviation="10.8"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.33 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1990_16138"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1990_16138" result="shape"/>
    </filter>
  </defs>
</svg>
        </PlayButton>


</FullImage>
<Text>
  <div>
<h3>
“हर बच्चा खास होता है, और उसका <span>Best Version</span> सिर्फ <span>Concept</span> में बनता है”
</h3>
<p>
Bhupendra Middha<br/>
Managing Director, Concept Classes
</p>
<LogoDiv className="monday">
</LogoDiv>
</div>
<AnchorLink offset='80' href='#contactus'>
<SecondaryButton>
Contact us
</SecondaryButton>
</AnchorLink>
</Text>


</Grid>
</Container>
    </SSection>

)
}
export default DirectorQuote
const SSection = styled(Section)`
padding-top:0px;
video:-webkit-full-page-media {
  margin:auto;
  width:100vw;
  object-fit:cover;
}
.modal-video {
  padding:0px;
}
@media(max-width:850px){
  .modal-video-movie-wrap iframe {
    width: 97vw;
    height: 55vw;
  }
}
@media (max-width: 500px) {
padding-bottom:0px;
}
`
const Grid = styled.div`
display:grid;
position:relative;
grid-template-columns:1fr 1.4fr;
column-gap: 40px;
border-radius: 20px;
padding:8px;
height:100%;
// margin:0px 10px;
background: #1C1C1F;
@media (max-width:${props => props.theme.screen.sm}){
    gap:20px;
   grid-template-columns:1fr;
}
@media (max-width:${props => props.theme.screen.xs}){
  display-flex;
  flex-direction: column;
}
`

const Text = styled.div`
display: flex;
flex-direction: column;
gap:24px;
position relative;
padding-top:24px;
padding-right: 0px;
padding-bottom: 24px;
padding-left: 20px;
justify-content: space-between;
h3{
  margin-top:0px;
    color:#fff;
    margin-bottom:16px;
    max-width: 500px;
    span{
      color:#FF5757;
    }
}
p{
  color: #CDCDCD;
  font-weight:500;
  font-family: Lexend Medium;
  margin-bottom:16px;
}
@media (max-width: ${props => props.theme.screen.lg}){
  h3{
    max-width:450px;
  }
}
@media (max-width: ${props => props.theme.screen.md}){
h3{
  max-width:300px;
  margin-bottom:8px;
  font-size:24px;
}
}
@media (max-width: ${props => props.theme.screen.sm}) {
// min-height:380px;
h3{
  max-width: none;
}
p{
  // font-size:19px;
}
}
@media (max-width: ${props => props.theme.screen.xs}) {
  // min-height:320px;
    gap:16px;

  h3{
    max-width: none;
  font-size:22px;
  }
  p{
    // font-size:14px;
  }
  }
`
const Quote = styled.div`
border-radius: 0px 20px;
border-top-right-radius: 20px;
background:  #005B38;
position: absolute;
z-index: 10;
padding: 16px;
top: 0;
right: 0;
@media (max-width: ${props => props.theme.screen.sm}) {
display:none;
}
`

const FullImage = styled.div`
width:100%;
align-self: center;
position: relative;
img{
 width:100%;
 border-radius:20px;
}
video{
}
@media (max-width: ${props => props.theme.screen.sm}) {
    order:-1;
  }
`
const PlayButton = styled.div`
position: absolute;
top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
cursor: pointer;
@media (max-width: ${props => props.theme.screen.xs}) {
svg{
width:60px;
}
}
`

const LogoDiv = styled.div`
width:100%;
img{
  width:25%;
}
&.monday {
  img{
    width:36%;
  }
}
`