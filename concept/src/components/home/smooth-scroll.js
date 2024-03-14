import React, { useRef, useState, useEffect } from "react"
import styled, { keyframes } from "styled-components"
import v1 from "../../images/v1.mp4"
import s1 from"../../images/s1.webp"
import s2 from"../../images/s2.webp"
import s3 from"../../images/s3.webp"
import s4 from"../../images/s4.webp"
import s5 from"../../images/s5.webp"
import s6 from"../../images/s6.webp"
import { Waypoint } from 'react-waypoint';
import ReactPlayer from 'react-player'
import { useVideoAutoPlayback } from "./hook"
// import { Section, HeaderButtons } from "../../../components/global-v1a"
// import line from "../../../images/product/designs/zig-zag-line.svg"

// import { useInView } from "react-intersection-observer"
// import AOS from "aos"
// import "aos/dist/aos.css"
// import mobileImage from "../../../images/product-v2/home-solution-mobile-final.webp"
// import problemImage from "../../../images/product-v2/home-problem-image.webp"
// import smpwebm from "../../../images/product-v2/home-problem-final.webm"

const ScrollSmooth = (props) => {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  // const videoRef = useRef(null);
  const iframeRef = useRef(null);
  let [shouldPlay, updatePlayState] = useState(false);

  let handleEnterViewport = function() {
    updatePlayState(true);
  }
  let handleExitViewport = function() {
    updatePlayState(false);
  }
  const handleMute = () => {
    setMuted(false);
  }
 
  // const handleVideoPress = () => {
  //   if (videoRef.current) {
  //     if (playing) {
  //       videoRef.current.pause();
  //       setPlaying(false);
  //     } else {
  //       videoRef.current.play();
  //       setPlaying(true);
  //     }
  //   }
  // };
  const [isElementVisible, setIsElementVisible] = useState(false)
  const elementRef = useRef(null)


  useEffect(() => {
    const handleScroll = () => {
      const element = elementRef.current
      const elementTop = element.getBoundingClientRect().top
      const elementBottom = element.getBoundingClientRect().bottom

      if (elementTop < window.innerHeight && elementBottom >= 0) {
        setIsElementVisible(true)
        setMuted(true)
      } else {
        setIsElementVisible(false)
        setMuted(false)
      }
    }
   
   
    window.addEventListener("scroll", handleScroll)
  


    return () => {
      window.removeEventListener("scroll", handleScroll)
      

    }
  },[])

 

  return (
    <div>
      <FlexBox ref={elementRef} className={isElementVisible ? "active" : ""}>
        <Container style={{marginTop:'-150px'}} >
          <TwoGrid>
            <TextDiv>
              <TextBox>
                <Text >
                  <div style={{ position: "relative" }}>
                    {/* <h4 data-aos="fade-up" data-aos-duration="800">
                  visibility and control
                  </h4> */}
                  </div>
                  <h2 >
                    {/* <h2 > */}
                    {/* 1999 से बीकानेर में IIT NEET के लिए एक ही नाम:   */}
                    1999 से बीकानेर में IIT / NEET में एक ही नाम:  

{" "}
<AnimateText className={isElementVisible ? "active" : ""}>
                        
                          Concept Classes
                         
                        
                      </AnimateText>
                      <br/>
                    <span >
                      {isElementVisible?"":"Kota"}
                    {/* Kota */}
                     
                      
                    </span>{" "}
                    {/* mein hi banta hai */}
                  </h2>

                  <p>
                  {/* Shadow IT and SaaS sprawl have created a state of chaos */}
                  </p>
                </Text>

              </TextBox>
              {/* <Tab>
                  <Tabindividual className={isElementVisible? '': 'active'}/>
                  <Tabindividual className={isElementVisible? 'active': ''}/>
                </Tab> */}
            </TextDiv>
            {/* <ImageDiv > */}
              {/* <img className="active" src={scroll1} /> */}
              
            {/* <video autoplay muted loop playsinline  >
                  <source src={v1} type="video/mp4" />
           
                </video> */}
  {/* <Waypoint 
      onEnter={handleVideoPress}
      onLeave={handleVideoPress}

    >
       <video
        onClick={handleVideoPress}
        className="video__player"
        loop
        playsInline
        autoPlay
        controls
        muted
        ref={videoRef}
        src={v1}
      ></video>
    

    </Waypoint> */}


              {/* <img style={{scale:"1.1"}} className={isElementVisible? 'active': ''} src={scroll2} /> */}
            {/* </ImageDiv> */}
            {/* <Tab>
                  <Tabindividual className={isElementVisible? '': 'active'}/>
                  <Tabindividual className={isElementVisible? 'active': ''}/>
                </Tab> */}
          </TwoGrid>
        </Container>
      </FlexBox>
      <div style={{height:"0", position: "relative", bottom:"100px"}} ref={elementRef} />
      <FlexBoxSolution >
        <Container style={{padding:"0 15px"}}>
          <FlowDivFinal>
            <h3>
              How future of <span>Conceptian</span> Looks like 
            </h3>
           
            <div style={{padding:'15px'}}>
            <Grid>
              <Flex>
                <Profile bg={s2}>
                </Profile>
                <ProfileText>
                  <h5>Rakshit Dhalla</h5>
                  <p>BizOps @Amazon Web Services</p>
                </ProfileText>
                </Flex>
                <Flex>
                <Profile bg={s5}>
               
                </Profile>
                <ProfileText>
                  <h5>Arihant Sethia</h5>
                  <p>Senior Tech. @Microsoft</p>
                </ProfileText>
                </Flex>
                <Flex>
                <Profile bg={s1}></Profile>
                <ProfileText>
                  <h5>Yash Gaur</h5>
                  <p>Associate @Goldman Sachs, Texas</p>
                </ProfileText>
                </Flex>
            </Grid>
            <Grid className="second">
            <Flex>
            <Profile bg={s6}></Profile>
            <ProfileText>
            <h5>Atma Godara</h5>
               <p>Business partner @Netflix</p>
            </ProfileText>
            </Flex>
              <Flex>
            <Profile bg={s3}></Profile>
            <ProfileText>
            <h5>Ritesh Kumar</h5>
               <p>Senior Software Eng. @Google</p>
            </ProfileText>
            </Flex>
            {/* <div>
            <Profile bg={s4}></Profile>
            <ProfileText>
            <h5>Pushpendra rathore</h5>
               <p>Software Eng. @Uber</p>
            </ProfileText>
            </div> */}
            </Grid>
            </div>
            <MobileDiv>
              {/* <img src={mobileImage} alt="Zluri sourcing" /> */}
            </MobileDiv>
          </FlowDivFinal>
        </Container>
      </FlexBoxSolution>

      <TriggerBox></TriggerBox>
    </div>
    //     <div>
    //       <Tempbg>
    // <Animate data-aos="fade-up">

    // </Animate>
    //       </Tempbg>
    //     </div>
  )
}

export default ScrollSmooth

const Container = styled.div`
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 0px 40px;
  @media (max-width: ${(props) => props.theme.screen.lg}) {
    max-width: 1200px;
  }
  @media (max-width: ${(props) => props.theme.screen.md}) {
    max-width: 960px;
  }
  @media (max-width: ${(props) => props.theme.screen.sm}) {
    max-width: 720px;
  }
  @media (max-width: ${(props) => props.theme.screen.xs}) {
    max-width: 540px;
  }

  ${(props) =>
    props.fluid &&
    `
    max-width: 1200px !important;
  `};
`


const FlexBox = styled.div`
  display: flex;
  flex-direction: column;
  justify-content:center;
  gap: 10px;
  background-color: #005B38;
//   background-image: radial-gradient(700px at 20% 120%, #FF575766, transparent);
  background-repeat: no-repeat;
  background-position: left bottom;
  height: 100vh;
  max-height:700px;
  text-align: center;
  justify-content: center;
  position: sticky;
  top: 10vh;
  margin-bottom: 15vh;
  transition: background-color 0.4s ease-in-out;
 

  // @media (max-width: ${(props) => props.theme.screen.md}) {
  //   max-height: 540px;
  // }
  // @media (max-width: ${(props) => props.theme.screen.sm}) {
  //   max-height: 650px;
  // }
  // @media (max-width: ${(props) => props.theme.screen.xs}) {
  //   max-height: 540px;
  // }
`
const TriggerBox = styled.div`
  height: 25vh;
`
const TextDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: center;
`
const TextBox = styled.div``
const Text = styled.div`
position:relative;
  h2 {
    margin:0px auto;
    margin-bottom: 24px;
    color: #fff;
    line-height:200%;
    span {
      color: #a7a7a7;
      position: relative;
    
      // background-repeat: repeat-x;
      // background-position: center;
      
    }
    &.active {
      span{
        display:none;
      }
    }
  }
  h4 {
    font-size:48px !important;
    position: absolute;
    top: -80px;
    left: 27%;
    color: #fe5757;
    text-align: center;
    font-family: Lexend Semibold;
    font-size: 36px;
    font-style: normal;
    font-weight: 400;
    
  }
  p {
    color: #a7a7a7;
  }
  &.active {
    // transform: translateY(0);
    opacity: 1;
    transition: all 0.4s ease-in-out;
    
  }
    
  }

  &.top {
    display: none;
    // transform: translateY(-150px);
    opacity: 0;
    transition: all 0.4s ease-in-out;
  }

  &.bottom {
    display: none;
    // transform: translateY(150px);
    opacity: 0;
    transition: all 0.4s ease-in-out;
  }
  @media (max-width: ${(props) => props.theme.screen.xs}) {
  h4{
    font-size:32px;
    top:-172px;
  }
  }
`
const Tab = styled.div`
  height: 60px;
  width: 24px;
  background: #69696b;
  border-radius: 24px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  @media (max-width: ${(props) => props.theme.screen.xs}) {
    margin-top: 40px;
  }
`
const Tabindividual = styled.div`
  height: 8px;
  width: 8px;
  background: #d9d9d9;
  border-radius: 12px;
  transition: height 0.4s ease-in-out;
  &.active {
    height: 32px;
    transition: height 0.4s ease-in-out;
  }
`
const ImageDiv = styled.div`
  height: 400px;
  align-self: center;
  display: flex;
  justify-content: center;
  video {
    max-width: 100%;
        height: 70%;
    // margin-top: -50px;

    opacity: 1;
    align-self: center;
    transition: opacity 0.4s ease-in-out;
    position: absolute;
  }
  // @media (max-width: ${(props) => props.theme.screen.md}) {
  //   img {
  //     max-width: 400px;
  //   }
  // }

  // @media (max-width: 840px) {
  //   img {
  //     max-width: 350px;
  //   }
  // }
  // @media (max-width: ${(props) => props.theme.screen.sm}) {
  //   height: 300px;
  //   img {
  //   }
  // }
  // @media (max-width: ${(props) => props.theme.screen.xs}) {
  //   height: 0px;
  //   img {
  //     display: none;
  //   }
  // }
`
const TwoGrid = styled.div`
  margin: 50px 0;
  // display:grid;
  // grid-gap: 20px;
  // grid-template-columns: 1fr 1fr;
  // @media (max-width: ${(props) => props.theme.screen.sm}) {
  //     grid-template-columns: 1fr;
  //   }
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const FlexBoxSolution = styled.div`
position:relative;
z-index:100;
  // display: flex;
  // flex-direction: column;
  // gap: 10px;
  // width: 90vw;
  // border-radius: 20px;
  // background-color: #f9f9f9;
  // background-repeat: no-repeat;
  // background-position: left bottom;
  // height: 70vh;
  // text-align: center;
  // justify-content: center;
  // position: sticky;
  // top: 10vh;
  // margin: 30vh auto;
  // margin-bottom: 15vh;
  // top: 18vh;
  // transition: background-color 0.4s ease-in-out;
  // div {
  //   color: white;
  // }

  // @media (max-width: ${(props) => props.theme.screen.md}) {
  //   max-height: 540px;
  // }
  // @media (max-width: ${(props) => props.theme.screen.sm}) {
  //   max-height: 650px;
  // }
  // @media (max-width: ${(props) => props.theme.screen.xs}) {
  //   max-height: 540px;
  // }
`

const Animate = styled.div`
  // position:
  height: 70vh;
  width: 90vw;
  margin: 0px auto;
  background-color: white;
  border-radius: 20px;
`
const fadeIn = keyframes`
  from {
    width: 100px;
  }
  to {
    width: 100%;
  }
  @media (max-width: ${(props) => props.theme.screen.sm}) {
    from {
      width: 100px;
    }
    to {
      width: 180px;
    }
  }
`
const fadeInMobile = keyframes`
    from {
      width: 100px;
    }
    to {
      width: 180px;
    }
`
const SVGAnimate = styled.div`
  position: absolute;
  top: 40%;
  left: 0%;
  svg {
    display: none;
  }
  &.active {
    svg {
      display: block;
      animation: ${fadeIn} 0.8s ease-in-out;
      width:100%;
  
    // @media (max-width: ${(props) => props.theme.screen.sm}) {
    //   width:190px;
    //   animation: ${fadeInMobile} 0.8s ease-in-out;
    // }
    }
  }
`
const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
`

const AnimateText = styled.div`
  display: none;
  // top: -60px;
  left: 50%;
  transform: translateX(-50%);
  position: absolute;
  font-size:48px !important;
   
    color: #fe5757 !important;
    text-align: center;
    font-family: Lexend Semibold;
    font-size: 36px;
    font-style: normal;
    font-weight: 400;
  h4 {
    width: max-content;
  }
  &.active {
    display: block;
   
      animation: ${fadeUp} 0.8s ease-in-out;
    

    @media (max-width: ${(props) => props.theme.screen.sm}) {
      left: 50%;
      transform: translateX(-50%);
      font-size:32px !important;
      line-height:normal;
    }
    
  }
  
`

const FlowDivFinal = styled.div`
  border-radius: 20px;
  background: #fff;
  padding: 24px 0 0;
//  height:85vh;
height:-webkit-fill-available;
 display:flex;
 flex-direction:column;
 justify-content:center;
  h1 {
    color: #000;
  }

h3{
  text-align:center;
max-width:700px;
margin:0px auto;
margin-bottom:8px;
padding:0 20px;
span{
    color:#fe5757;
}
}
h5{
  text-align:center;
  width: max-content;
    margin: 0 auto 40px;
    font-family: "Lexend Medium";
    font-weight:500;
  span{
    color:#FE5757;
  }
}
  p{
    text-align:center;
    max-width:750px;
    margin: 24px auto;
    padding:0 10px;
    font-family: "Lexend Regular";
    font-weight:400;
padding:0 20px;
  }
@media (max-width: ${(props) => props.theme.screen.xs}) {
padding: 60px 16px;
}
`

const MobileDiv = styled.div`
display:none;
// background:#F9F9F9;
border-radius: 0 0 20px 20px;

// padding:24px;
img{
  width:100%;
  scale:0.6;
  margin:-35% auto;
}

@media (max-width: ${(props) => props.theme.screen.sm}) {
  display:block;
}

@media (max-width: ${(props) => props.theme.screen.xs}) {
  img{
  scale:0.9;
  margin:-5% auto;
  }
}
`
// const Flex = styled.div`

// `
const Grid = styled.div`
display:flex;
// display:grid;
// grid-template-columns:repeat(3,1fr);
justify-content:center;
gap:40px;
text-align:center;
margin-bottom:24px;
align-items:center;

@media (max-width: ${(props) => props.theme.screen.sm}) {
  gap:30px;
  }
@media (max-width: ${(props) => props.theme.screen.xs}) {
gap:15px;
}
`
const Profile = styled.div`
border-radius:50%;
border:8px solid #005B38;
background-image: url(${props => props.bg});
background-size:contain;
background-position:center;
background-repeat:no-repeat;
background-color:#fff;
width:200px;
// min-height:250px;
aspect-ratio:1;
@media (max-width: ${(props) => props.theme.screen.lg}) {
width:180px;

}
@media (max-width: ${(props) => props.theme.screen.md}) {
width:150px;

}
@media (max-width: ${(props) => props.theme.screen.sm}) {
width:120px;

}
@media (max-width: ${(props) => props.theme.screen.xs}) {
  width:100px;
  border:4px solid #005B38;
}
@media (max-width: 517px) {
  width:100px;

}
// width:100%;
`
const Flex = styled.div`
display:flex;
flex-direction:column;
text-align:center;
justify-content:center;
align-items:center;
`
const ProfileText = styled.div`
h5{
  font-size:18px;
  margin:0px auto;
// margin-bottom:16px;
color:#000;
}
p{
  font-size:16px;
  color:#000;
  margin:0px auto;
  padding:0px
}
@media (max-width: ${(props) => props.theme.screen.sm}) {
  h5{
    font-size:17px;
  }
  p{
    font-size:14px;
  }
}
@media (max-width: ${(props) => props.theme.screen.xs}) {
  h5{
    font-size:14px;
  }
  p{
    font-size:10px;
  }
}
`
const ScalingDiv = styled.div`
display: flex;
flex-direction: row;
justify-content: center;

@media (max-width: ${(props) => props.theme.screen.lg}) {
  scale:0.8;
}
@media (max-width: ${(props) => props.theme.screen.md}) {
  scale:0.6;
}
@media (max-width: ${(props) => props.theme.screen.sm}) {
  scale:0.4;
}
`
const Right = styled.div`
z-index: 5;
`
const Left = styled.div`
z-index: 5;
`
const Circle2 = styled.div`
  width:52px;
  height:52px;
  background:#FFF;
  border-radius:50%;
`
const OutputDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
  width: max-content;
  // @media (max-width: ${(props) => props.theme.screen.md}) {
  //   margin-top:20px;
  // }
`

const OutputItem = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  border-radius: 7.436px;
  padding: 8px;
  background: var(--White, #fff);
  box-shadow: 0px 2.974px 55.026px 0px rgba(0, 0, 0, 0.05);
      width: fit-content;
  h6{
    align-self: center;

    font-family: "Lexend Medium";
    font-weight:500;
}
`
const InputDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 36px;
  position: relative;
  bottom: 10px;
}
// @media (max-width: ${(props) => props.theme.screen.md}) {
//   margin-top:60px;
// }
`

const InputItem = styled.div`
  display: flex;
  flex-direction: row;
  gap: 32px;
  justify-content:end;
  position:relative;
  img{
  width:52px;
  height:52px;
  background:#FFF;
  border-radius:50%;
  }
`

const SVGBG = styled.div`
  height: 30px;
  width: 30px;
  padding: 3px;
  border-radius: 4px;
  svg {
    width: 24px;
  }
`

const FlexDiv = styled.div`
  text-align: center;
  position: relative;
  top: 91px;
  margin:0 -110px 0 -310px;
  svg {
    height:300px;
    // margin:auto;
  }
  

// @media (max-width: ${(props) => props.theme.screen.lg}) {
//   top:100px;
// }
`

const BlackSVGF = styled.svg`
  // width: 100%;
  position: absolute;
  z-index: 3;
`
const SVGText = styled.div`
  // width: 100%;
  position: absolute;
  z-index: 4;
  display:flex;
  flex-direction:column;
      gap: 225px;
    left: 56.2%;
    bottom: 22.5%;
    h5{
      margin:0 auto;
    }
`
const BlackSVGFinal = styled.svg`
  // width: 100%;
`
const ColorSVGFinal = styled.svg`
  // width: 100%;
  position: absolute;
  // animation: fill 5s linear infinite;
  z-index: 2;
  @keyframes fill {
    0% {
      width: 0%;
    }

    100% {
      width: 100%;
    }
  }
`