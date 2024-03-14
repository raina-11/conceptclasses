import React, { useState } from "react"
import styled from "styled-components"
import { Dropdown, DropdownButton } from "./style"
import { Container, PrimaryButton } from "../../style"
import i1 from "../../../images/icon-results-engineering.svg"
import i2 from  "../../../images/icon-results-medical.svg"
import i3 from  "../../../images/icon-results-pref.svg"
import Popup from "reactjs-popup"
import 'reactjs-popup/dist/index.css';
import ScheduleForm from "../schedule-visit"
const Platform = () => {
  const [show, setShow] = useState(false);
  const showPopup = () => {
    setShow(true)
  }
  const closePopup = () => {
    setShow(false)
  }
  return (
    <DropdownContainer>
      <Dropdown>
        <DropdownButton id="solutions">
          Results
          <DropdownIcon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="8"
              viewBox="0 0 13 8"
              fill="none"
            >
              <path
                d="M0.664751 0.675735C0.884419 0.441422 1.24058 0.441422 1.46025 0.675735L6.50001 6.05146L11.5398 0.675735C11.7595 0.441422 12.1156 0.441422 12.3352 0.675735C12.5549 0.910047 12.5549 1.28995 12.3352 1.52426L6.89773 7.32426C6.67806 7.55858 6.32196 7.55858 6.10228 7.32426L0.664751 1.52426C0.445083 1.28995 0.445083 0.910047 0.664751 0.675735Z"
                fill="#1C1C1F"
              />
            </svg>
          </DropdownIcon>
        </DropdownButton>
        <PositionDiv>
          <DropdownContent id="dropdown">
            <DropdownWidth>
              <StyledContainer>
                {/* <h2>Use Cases</h2> */}
                <Flex>
                  <FlexContainer style={{ width: "-webkit-fill-available" }}>
                    <h2>Results</h2>
                    <DropdownRowSolutions id="lineBottom">
                      <DropdownColumnPlatform1>
                        <a
                          href="/results/engineering"
                          style={{ textDecoration: "none" }}
                          rel="noopener"
                          target="_blank"
                        >
                          <Tab>
                            <div>
                              <img src={i1} alt="concept"/>
                            </div>
                            <div>
                              <h5>IIT JEE Mains & Advanced</h5>
                              {/* <p>
                              Go from SaaS chaos to SaaS control
                              </p> */}
                            </div>
                          </Tab>
                        </a>
                        <a
                          href="/results/medical"
                          style={{ textDecoration: "none" }}
                          rel="noopener"
                          target="_blank"
                        >
                          <Tab>
                            <div>
                            <img src={i2} alt="concept"/>
                            </div>
                            <div>
                              <h5>NEET/AIIMS </h5>
                              {/* <p>
                              Unified access management for the modern enterprise
                              </p> */}
                            </div>
                          </Tab>
                        </a>
                        <a
                          href="/results/pre-foundation"
                          style={{ textDecoration: "none" }}
                          rel="noopener"
                          target="_blank"
                        >
                          <Tab>
                            <div>
                            <img src={i3} alt="concept" />
                            </div>
                            <div>
                              <h5>Pre Foundation</h5>
                              {/* <p>
                              Save time & reduce risk with automated access reviews
                              </p> */}
                            </div>
                          </Tab>
                        </a>
                      </DropdownColumnPlatform1>
                    </DropdownRowSolutions>
                  </FlexContainer>
                  <LineDiv>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="2"
                      height="224"
                      viewBox="0 0 2 224"
                      fill="none"
                    >
                      <path
                        d="M1 1L1 223"
                        stroke="#B9B9B9"
                        stroke-linecap="round"
                      />
                    </svg>
                  </LineDiv>

                 
                  <GartnerGrid>
                    <InnerContainer>
                      <GartnerTitle>
                        <h5>
                        1999 से बीकानेर जोन में उच्चतम रैंक देता Concept Classes
                        </h5>
                      </GartnerTitle>
                     
                        <PrimaryButton
                        // style={{color: 'white'}}
                        onClick={showPopup}
                        >
                          Schedule a visit
                        </PrimaryButton>
                        <Popup
            open={show}
            position="center"
            modal
            overlayStyle={{ background: "transparent", backdropFilter:"blur(5px)" }}
            contentStyle={{ width:'90%',borderRadius:'20px', maxHeight:"700px", background: 'darkseagreen', padding:"0", zIndex:"-2"}}
            style={{ borderRadius: "22px" }}
            closeOnDocumentClick
            onClose={closePopup}
          >
        
<ScheduleForm/>
</Popup>
                    </InnerContainer>
                    <RightContainer>
                    </RightContainer>
                  </GartnerGrid>
                </Flex>
              </StyledContainer>
            </DropdownWidth>
          </DropdownContent>
        </PositionDiv>
      </Dropdown>
    </DropdownContainer>
  )
}

export default Platform

const DropdownContent = styled.div`
  display: none;
  position: absolute;
  // width:65vw;
  z-index: 998;
  transition: display 0.3s ease-in-out 0s;
  padding-top: 44px;
  box-shadow: 0 25px 30px -25px #343434;
`

const PositionDiv = styled.div`
  position: absolute;
  left: 0;
  top: 52px;
`
const GartnerTitle = styled.div`
  h4 {
    font-family: "Lexend Semibold";
    font-style: normal;
    font-weight: 600;
    font-size: 30px;
    line-height: 40px;
    text-align: start;
    color: #1c1c1f;
    span {
      background-repeat: no-repeat;
      background-position: bottom;
    }
  }
  h5 {
    font-family: "Lexend Semibold";
    font-style: normal;
    font-weight: 550;
    font-size: 21px;
    line-height: 40px;
    text-align: start;
    color: #1c1c1f;
    margin-bottom:32px;
  }
  @media (max-width: ${(props) => props.theme.screen.sm}) {
    h3 {
      font-size: 28px;
      line-height: 36px;
    }
  }
`
const GartnerGrid = styled.div`
  display: flex;
  flex-direction: row;
`
const InnerContainer = styled.div`
  margin-left: 0px;
  align-self: center;
  @media (max-width: ${(props) => props.theme.screen.sm}) {
    margin-bottom: 20px;
  }
`

const RightContainer = styled.div`
  text-align: center;
  align-self: center;
`
const DropdownWidth = styled.div`
  margin: auto;
  padding: 20px 0px 10px;
  border-radius: 26px;
  border: 1px solid #ababb0;
  background: #fff;
  opacity: 1;
  width: max-content;
  max-width:80vw;
  backdrop-filter: blur(30px);

  h2 {
    font-family: "Lexend Semibold";
    font-style: normal;
    font-weight: 600;
    font-size: 24px;
    line-height: 40px;
    color: #2b303c;
    margin-bottom: 12px;
  }
`

const DropdownColumnPlatform1 = styled.div`
  padding: 0 10px;
  display: flex;
  gap: 8px;
  flex-direction: column;
  transition: 0.3s ease-in-out 0s;

  a {
    float: none;
    border-radius: 7px;
    color: black;
    padding: 12px 14px;
    padding-right: 0px;
    margin-left: -10px;
    text-decoration: none;
    display: block;
    text-align: left;
    transition: 0.3s ease-in-out 0s;
    &:hover #defaultImage {
      display: none;
      transition: 0.3s ease-in-out 0s;
    }
    &:hover #hoverImage {
      display: block;
      transition: 0.3s ease-in-out 0s;
    }
    &:hover #textColor {
      color: #000;
    }
  }

  a:hover {
    // color:#297FFD;
    background: #f8f8f8;
  }
  &.last {
    width: 20vw;
  }
`
const DropdownRowSolutions = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  margin-left: -10px;
  margin-bottom: 35px;
  padding-bottom: 15px;
  width: -webkit-fill-available;
`

const DropdownContainer = styled.div`
  float: left;
  // margin: 0 -2px;
  // position: relative;
  &:hover ${DropdownContent} {
    display: block;
    transition: all 0.3s ease-in-out;
    opacity: 1;
  }
`
const DropdownIcon = styled.div``
const Flex = styled.div`
  display: flex;
  flex-direction: row;
  gap: 40px;
`
const StyledContainer = styled(Container)`
  margin: 0px;
`
const FlexContainer = styled.div`
  display: flex;
  flex-direction: column;
`

const LineDiv = styled.div`
  display: flex;
  align-items: center;
`
const Tab = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  // padding:12px 14px;
  border-radius: 7px;

  h5 {
    color: #2b303c;
    font-family: Lexend Medium;
    font-size: 18px;
    font-style: normal;
    font-weight: 500;
    line-height: 160%; /* 28.8px */
    margin:0px;
  }
  p {
    color: #888585;
    font-family: Lexend Medium;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    margin:0px;
  }
`