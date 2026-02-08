import React, { useRef, useState, useEffect } from "react"
import styled, { keyframes } from "styled-components"
import { useSuccessStories } from '../../hooks/useFirestore'
// import s1 from"../../images/s1.webp"
// import s2 from"../../images/s2.webp"
// import s3 from"../../images/s3.webp"
// import s5 from"../../images/s5.webp"
// import s6 from"../../images/s6.webp"

const ScrollSmooth = (props) => {

  const [isElementVisible, setIsElementVisible] = useState(false)
  const elementRef = useRef(null)
  const { stories } = useSuccessStories()


  useEffect(() => {
    const handleScroll = () => {
      const element = elementRef.current
      const elementTop = element.getBoundingClientRect().top
      const elementBottom = element.getBoundingClientRect().bottom

      if (elementTop < window.innerHeight && elementBottom >= 0) {
        setIsElementVisible(true)
      } else {
        setIsElementVisible(false)
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
                {/* <Text >
                  <div style={{ position: "relative" }}>
                  
                  </div>
                  <h2 style={{marginBottom:'0px'}}>
                    1999 से बीकानेर में IIT / NEET में एक ही नाम:  

{" "}

                      <br/>
                    <span >
                      {isElementVisible?"Kota":"Kota"}
                     
                    <SVGAnimate
                        ref={elementRef}
                        className={isElementVisible ? "active" : ""}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="311"
                          height="18"
                          viewBox="0 0 311 18"
                          fill="none"
                        >
                          <path
                            d="M246.693 10.7258C250.346 9.62494 253.628 8.61153 256.937 7.65519C260.617 6.61143 264.324 5.58258 268.442 4.98815C271.652 4.52131 274.888 4.11157 277.715 3.18304C278.001 3.07903 278.398 3.04868 278.768 2.98938C287.118 1.77578 295.415 0.462074 304.274 0.220492C305.208 0.192147 306.144 0.121627 307.076 0.163573C308.827 0.230026 309.832 0.668149 310.23 1.55243C310.468 2.09425 310.451 2.65657 310.521 3.15114C307.43 4.38135 304.13 5.0284 300.174 4.95226C298.902 4.92829 297.456 5.0539 296.428 5.37493C291.947 6.74648 286.295 6.60558 281.732 7.89024C280.991 8.0932 279.614 7.79874 278.543 7.66822C276.683 7.44374 275.066 7.60644 274.109 8.39393C272.66 9.5888 270.634 10.1755 267.747 10.258C266.53 10.2919 264.882 10.5663 264.302 11.0273C262.853 12.1941 260.706 12.1439 259.267 12.0305C256.457 13.3114 254.332 14.4016 251.957 15.3296C250.554 15.8927 249.642 15.19 248.728 14.5295C245.562 15.4479 242.946 14.9897 240.414 13.5913C238.244 12.3867 235.758 11.3415 233.819 10.003C232.627 9.17941 230.837 8.52083 229.072 7.96149C228.26 7.69799 226.817 7.7252 225.851 7.87922C225.282 7.97479 225.066 8.58743 224.628 9.03867C223.583 9.00741 222.509 8.97529 221.323 8.9398C220.965 9.53416 220.639 10.045 220.312 10.5699C219.999 10.659 219.682 10.8325 219.4 10.824C217.224 10.773 215.52 11.0035 214.051 11.9023C213.071 12.5062 211.282 12.7763 209.827 13.1971C210.011 13.6388 210.167 14.1078 210.43 14.7629C206.85 15.3313 204.702 17.1666 200.368 17.4169C197.365 16.6657 195.228 15.2932 192.861 14.0545C188.795 11.963 183.889 10.5218 178.984 9.03834C175.653 9.78296 172.465 10.4896 169.332 11.2261C168.848 11.3383 168.306 11.505 168.045 11.7223C165.895 13.6138 161.611 14.0907 158.352 15.2456C155.694 16.1792 152.821 15.8118 150.172 14.5366C147.023 12.9931 144.045 11.3703 140.867 9.8541C138.943 8.93824 137.137 7.87111 134.063 7.56812C133.293 7.78429 132.128 7.96052 131.439 8.33386C129.455 9.41427 127.057 10.1727 124.545 10.9278C122.206 11.6176 120.364 12.6882 118.273 13.5825C117.299 14.0036 116.381 14.4405 115.351 14.8177C112.092 16.0148 108.728 15.9564 105.031 14.7623C103.098 14.1417 101.137 13.5343 99.087 13.0368C92.0687 11.3072 85.5467 9.05781 78.208 7.64229C77.1676 7.44232 76.0694 7.28284 75.0847 7.11268C71.006 8.27113 67.9918 9.77098 66.2591 11.9142C65.6718 12.6424 64.4088 13.2659 63.2053 13.7928C60.4533 15.0331 57.4246 15.1254 53.9176 14.1904C47.8292 12.573 41.6231 11.107 35.4179 9.6128C33.5366 9.16255 31.5381 8.84951 29.7386 8.5002C23.6358 10.2032 18.2346 12.0819 13.8605 14.6104C13.2562 14.9582 12.5684 15.2612 11.8528 15.5494C9.16234 16.6227 6.65021 16.4632 4.71569 14.956C2.53234 13.2585 1.03257 11.3985 0.214698 9.43229C0.107986 9.21803 0.511941 8.94869 0.746809 8.66022C3.98812 9.02451 3.70701 10.8594 6.25549 11.6954C7.02509 11.4933 8.16073 11.3444 8.87803 11C11.7198 9.59347 15.4216 8.74738 17.8209 7.00402C19.7286 5.62586 23.0356 4.7398 25.842 3.57143C27.1358 3.80712 28.3457 4.01216 29.5831 4.24616C31.7203 4.64778 33.858 5.03535 35.9658 5.47831C37.371 5.77361 38.747 6.09619 40.0932 6.47415C44.4403 7.68762 48.7583 8.92836 53.1058 10.1278C53.751 10.3019 54.5135 10.3387 55.4995 10.4667C58.2021 8.98569 60.8765 7.50381 63.5786 6.03685C66.1657 4.63679 68.7811 3.23759 71.2817 1.89123C74.4458 1.99994 76.7434 2.71592 79.0139 3.38887C83.7794 4.79778 88.4567 6.31661 93.3386 7.61643C97.3786 8.69408 101.623 9.55272 105.81 10.4518C107.721 10.8608 109.424 10.6584 111.027 10.0169C117.065 7.62256 123.159 5.27208 129.198 2.8918C132.231 1.70208 134.127 1.64624 137.285 2.90857C140.276 4.09553 143.121 5.39073 145.968 6.67187C147.809 7.50085 149.536 8.39674 151.262 9.29263C153.017 10.2034 154.145 10.3216 156.086 9.70425C159.055 8.77995 161.996 7.82669 164.964 6.91644C167.762 6.05736 170.806 5.43082 173.355 4.35326C175.332 3.51184 177.65 3.53896 180.177 4.16329C185.538 5.50559 190.094 7.30221 194.185 9.52111C196.049 10.5337 197.422 11.8974 200.122 12.4003C200.69 12.3188 201.143 12.3183 201.372 12.2126C206.874 9.7881 213.236 7.93811 218.96 5.67505C221.593 4.62814 224.858 4.19112 227.93 3.62165C229.92 3.25906 232.007 3.43406 233.62 4.36874C234.871 5.09562 236.093 5.82167 237.373 6.53534C239.042 7.45766 240.653 8.42044 242.466 9.27669C243.582 9.78847 244.985 10.14 246.693 10.7258Z"
                            fill="#FE5757"
                          />
                        </svg>
                      </SVGAnimate>
                    </span>{" "}
                  </h2>
                  <AnimateText className={isElementVisible ? "active" : ""}>
                        
                        Concept Classes
                       
                      
                    </AnimateText>
                  <p>
                  </p>
                </Text> */}
<Text >
                  <div style={{ position: "relative" }}>
                  
                  </div>
                  <h2 style={{marginBottom:'0px'}}>
                    1999 से बीकानेर में IIT / NEET में एक ही नाम:  

{" "}

                      <br/>
                    <span >
                      {isElementVisible?"Kota":"Kota"}
                     
                    <SVGAnimate
                        ref={elementRef}
                        className={isElementVisible ? "active" : ""}
                      >
                        {/* <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="311"
                          height="18"
                          viewBox="0 0 311 18"
                          fill="none"
                        >
                          <path
                            d="M246.693 10.7258C250.346 9.62494 253.628 8.61153 256.937 7.65519C260.617 6.61143 264.324 5.58258 268.442 4.98815C271.652 4.52131 274.888 4.11157 277.715 3.18304C278.001 3.07903 278.398 3.04868 278.768 2.98938C287.118 1.77578 295.415 0.462074 304.274 0.220492C305.208 0.192147 306.144 0.121627 307.076 0.163573C308.827 0.230026 309.832 0.668149 310.23 1.55243C310.468 2.09425 310.451 2.65657 310.521 3.15114C307.43 4.38135 304.13 5.0284 300.174 4.95226C298.902 4.92829 297.456 5.0539 296.428 5.37493C291.947 6.74648 286.295 6.60558 281.732 7.89024C280.991 8.0932 279.614 7.79874 278.543 7.66822C276.683 7.44374 275.066 7.60644 274.109 8.39393C272.66 9.5888 270.634 10.1755 267.747 10.258C266.53 10.2919 264.882 10.5663 264.302 11.0273C262.853 12.1941 260.706 12.1439 259.267 12.0305C256.457 13.3114 254.332 14.4016 251.957 15.3296C250.554 15.8927 249.642 15.19 248.728 14.5295C245.562 15.4479 242.946 14.9897 240.414 13.5913C238.244 12.3867 235.758 11.3415 233.819 10.003C232.627 9.17941 230.837 8.52083 229.072 7.96149C228.26 7.69799 226.817 7.7252 225.851 7.87922C225.282 7.97479 225.066 8.58743 224.628 9.03867C223.583 9.00741 222.509 8.97529 221.323 8.9398C220.965 9.53416 220.639 10.045 220.312 10.5699C219.999 10.659 219.682 10.8325 219.4 10.824C217.224 10.773 215.52 11.0035 214.051 11.9023C213.071 12.5062 211.282 12.7763 209.827 13.1971C210.011 13.6388 210.167 14.1078 210.43 14.7629C206.85 15.3313 204.702 17.1666 200.368 17.4169C197.365 16.6657 195.228 15.2932 192.861 14.0545C188.795 11.963 183.889 10.5218 178.984 9.03834C175.653 9.78296 172.465 10.4896 169.332 11.2261C168.848 11.3383 168.306 11.505 168.045 11.7223C165.895 13.6138 161.611 14.0907 158.352 15.2456C155.694 16.1792 152.821 15.8118 150.172 14.5366C147.023 12.9931 144.045 11.3703 140.867 9.8541C138.943 8.93824 137.137 7.87111 134.063 7.56812C133.293 7.78429 132.128 7.96052 131.439 8.33386C129.455 9.41427 127.057 10.1727 124.545 10.9278C122.206 11.6176 120.364 12.6882 118.273 13.5825C117.299 14.0036 116.381 14.4405 115.351 14.8177C112.092 16.0148 108.728 15.9564 105.031 14.7623C103.098 14.1417 101.137 13.5343 99.087 13.0368C92.0687 11.3072 85.5467 9.05781 78.208 7.64229C77.1676 7.44232 76.0694 7.28284 75.0847 7.11268C71.006 8.27113 67.9918 9.77098 66.2591 11.9142C65.6718 12.6424 64.4088 13.2659 63.2053 13.7928C60.4533 15.0331 57.4246 15.1254 53.9176 14.1904C47.8292 12.573 41.6231 11.107 35.4179 9.6128C33.5366 9.16255 31.5381 8.84951 29.7386 8.5002C23.6358 10.2032 18.2346 12.0819 13.8605 14.6104C13.2562 14.9582 12.5684 15.2612 11.8528 15.5494C9.16234 16.6227 6.65021 16.4632 4.71569 14.956C2.53234 13.2585 1.03257 11.3985 0.214698 9.43229C0.107986 9.21803 0.511941 8.94869 0.746809 8.66022C3.98812 9.02451 3.70701 10.8594 6.25549 11.6954C7.02509 11.4933 8.16073 11.3444 8.87803 11C11.7198 9.59347 15.4216 8.74738 17.8209 7.00402C19.7286 5.62586 23.0356 4.7398 25.842 3.57143C27.1358 3.80712 28.3457 4.01216 29.5831 4.24616C31.7203 4.64778 33.858 5.03535 35.9658 5.47831C37.371 5.77361 38.747 6.09619 40.0932 6.47415C44.4403 7.68762 48.7583 8.92836 53.1058 10.1278C53.751 10.3019 54.5135 10.3387 55.4995 10.4667C58.2021 8.98569 60.8765 7.50381 63.5786 6.03685C66.1657 4.63679 68.7811 3.23759 71.2817 1.89123C74.4458 1.99994 76.7434 2.71592 79.0139 3.38887C83.7794 4.79778 88.4567 6.31661 93.3386 7.61643C97.3786 8.69408 101.623 9.55272 105.81 10.4518C107.721 10.8608 109.424 10.6584 111.027 10.0169C117.065 7.62256 123.159 5.27208 129.198 2.8918C132.231 1.70208 134.127 1.64624 137.285 2.90857C140.276 4.09553 143.121 5.39073 145.968 6.67187C147.809 7.50085 149.536 8.39674 151.262 9.29263C153.017 10.2034 154.145 10.3216 156.086 9.70425C159.055 8.77995 161.996 7.82669 164.964 6.91644C167.762 6.05736 170.806 5.43082 173.355 4.35326C175.332 3.51184 177.65 3.53896 180.177 4.16329C185.538 5.50559 190.094 7.30221 194.185 9.52111C196.049 10.5337 197.422 11.8974 200.122 12.4003C200.69 12.3188 201.143 12.3183 201.372 12.2126C206.874 9.7881 213.236 7.93811 218.96 5.67505C221.593 4.62814 224.858 4.19112 227.93 3.62165C229.92 3.25906 232.007 3.43406 233.62 4.36874C234.871 5.09562 236.093 5.82167 237.373 6.53534C239.042 7.45766 240.653 8.42044 242.466 9.27669C243.582 9.78847 244.985 10.14 246.693 10.7258Z"
                            fill="#FE5757"
                          />
                        </svg> */}
                       <svg width="106" height="6" viewBox="0 0 106 6" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 3C8.98965 3 14.9669 3 20.9916 3C31.9211 3 42.7997 3 53.7206 3C70.1538 3 86.5527 3 103 3" stroke="#FE5757" stroke-width="5" stroke-linecap="round"/>
</svg>


                      </SVGAnimate>
                    </span>{" "}
                  </h2>
                  <AnimateText className={isElementVisible ? "active" : ""}>
                        
                        Concept Institute
                       
                      
                    </AnimateText>
                  <p>
                  </p>
                </Text>
              </TextBox>
            </TextDiv>
           
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
            {(() => {
              const rows = {};
              stories.forEach(s => {
                const r = s.row || 1;
                if (!rows[r]) rows[r] = [];
                rows[r].push(s);
              });
              return Object.keys(rows).sort((a, b) => a - b).map(r => (
                <Grid key={r} className={r !== '1' ? 'second' : ''}>
                  {rows[r].sort((a, b) => (a.order || 0) - (b.order || 0)).map(story => (
                    <Flex key={story.id}>
                      <Profile bg={story.photoUrl}></Profile>
                      <ProfileText>
                        <h5>{story.name}</h5>
                        <p>{story.position}</p>
                      </ProfileText>
                    </Flex>
                  ))}
                </Grid>
              ));
            })()}
            {/* Hardcoded profiles (commented out - now using Firestore data)
            <Grid>
              <Flex>
                <Profile bg={s2}></Profile>
                <ProfileText>
                  <h5>Rakshit Dhalla</h5>
                  <p>BizOps @Amazon Web Services</p>
                </ProfileText>
              </Flex>
              <Flex>
                <Profile bg={s5}></Profile>
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
            </Grid>
            */}
            </div>
            <MobileDiv>
            </MobileDiv>
          </FlowDivFinal>
        </Container>
      </FlexBoxSolution>

      <TriggerBox></TriggerBox>
    </div>
  
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
    line-height:150%;
    span {
      color: #a7a7a7;
      position: relative;
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

const TwoGrid = styled.div`
  margin: 50px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const FlexBoxSolution = styled.div`
position:relative;
z-index:100;
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
  left: 50%;
  width:100%;
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

const Grid = styled.div`
display:flex;
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
`
const Flex = styled.div`
display:flex;
flex-direction:column;
text-align:center;
justify-content:center;
align-items:center;
`
const fadeIn = keyframes`
  from {
    width: 0%;
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
  top: 50%;
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
  // @media (max-width: 433px) {
  //     position: relative;
  //   top:0;
  //   left:20%;
  //   width: fit-content;
  //   height: 0;
  //   overflow: visible;
  //   transform: translateY(-58px);
  //   }
  //   @media (max-width: 390px) {
  //     left:17%;
  //   }
  //   @media (max-width: 352px) {
  //     left:14%;
  //   transform: translateY(-92px);
  //   }
`
