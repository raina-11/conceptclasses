import React, { Component, useState, useEffect } from "react"
// import { a } from "gatsby"
import { Menu, X } from "react-feather"
import styled from "styled-components"
import Platform from "../new-navigation/platform-nav"
import Company from "../new-navigation/company-nav"
import { Link } from 'react-scroll';
import Solutions from "../new-navigation/solutions-nav"
import {
  DropdownItemZluri,
  DropdownItemTextMobile,
  DropdownColumn,
  DropdownItemImg,
  Nav,
  NavItem,
  Brand,
  StyledContainer,
  NavListWrapper,
  MobileMenu,
  Mobile,
  ActionsContainer,
  ActionsContainerMobile,
  ActionsContainerLogin,
  NavItemMobile,
  NavListWrapperMobile,
  Banner,
} from "./style"
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from "react-accessible-accordion"
import "./style.css"
import logo from "../../../images/logo-concept.png"
import call from "../../../images/call.png"
import i1 from "../../../images/icon-results-engineering.svg"
import i2 from  "../../../images/icon-results-medical.svg"
import i3 from  "../../../images/icon-results-pref.svg"
import { PrimaryButton, SecondaryButton } from "../../style"
import { PhoneFilled } from "@ant-design/icons"
import { Modal } from "react-bootstrap";
import Popup from "reactjs-popup"
import 'reactjs-popup/dist/index.css';
import AnchorLink from 'react-anchor-link-smooth-scroll'
import Form from "../contact-form"
import ScheduleForm from "../schedule-visit"
export default class Navigation extends Component {
  
  state = {
    mobileMenuOpen: false,
    hasScrolled: false,
    show: false,
    open: false,
  }
  componentDidMount() {
    window.addEventListener("scroll", this.handleScroll, { passive: true })
  }

  handleScroll = () => {
    const scrollTop = window.pageYOffset

    if (scrollTop > 32) {
      this.setState({ hasScrolled: true })
    } else {
      this.setState({ hasScrolled: false })
    }
  }

  showPopup = () => {
      this.setState({show: true});
      console.log("show", this.state.show)
    }
  
  closePopup = () => {
    this.setState({show: false});
  }

  toggleMobileMenu = () => {
    this.setState((prevState) => ({
      mobileMenuOpen: !prevState.mobileMenuOpen,
    }))
  }

  closeMobileMenu = () => {
    if (this.state.mobileMenuOpen) {
      this.setState({ mobileMenuOpen: false })
    }
  }

  render() {
    const { mobileMenuOpen } = this.state;
    const { banner } = this.props;
    const { bgwhite } = this.props;
  
    return (
     
     <div style={{width:'100vw'}}>
      <Nav {...this.props} scrolled={this.state.hasScrolled}>
      <Banner {...this.props} scrolled={this.state.hasScrolled} banner={banner}>
          {" "}
          [Webinar] Using Zluri + Slack to automate access requests & cut support costs -
          <a href="https://www.zluri.com/events/zero-touch-access-requests/" rel="dofollow, ,noopener" target="_blank">Register Now</a>

        </Banner>
        <StyledContainer {...this.props} scrolled={this.state.hasScrolled} bgwhite={bgwhite}>
          {/* <NavBar> */}
         <a href="/">
          <Brand>
          <img src={logo}/>

          </Brand>
          </a>
          <Mobile>
            <button
              onClick={this.toggleMobileMenu}
              style={{ color: "black", background: "none" }}
            >
              {this.state.mobileMenuOpen ? (
                <X size={24} alt="close menu" />
              ) : (
                <Menu size={24} alt="open menu" />
              )}
            </button>
          </Mobile>

          <Mobile hide>
            <NavListWrapper>
              {/* <ul> */}
                <Solutions />
                <NavItem>
                  <a href="/about/">About Us</a>
                </NavItem>
                <NavItem>
                  <a href="/images/">Gallery</a>
                </NavItem>
                <Platform />

                <NavItem>
                  {/* <Link to="contactus" spy={true} smooth={true}>Contact Us</Link> */}
                {/* <a href="#contactus" style={{ textDecoration: "none", scrollBehavior:'smooth' }} >
                  Contact Us
                  </a> */}
                  <AnchorLink offset='100' href='#contactus'>Contact us</AnchorLink>
                </NavItem>
                {/* <Company /> */}
               
            </NavListWrapper>
          </Mobile>
          <Buttons>
             <StyledLink >
              <a style={{display:'flex', alignItems:'center', textDecoration:'none', color:'#222',position:'relative', fontWeight:'500'}} href="tel:9352169717">
                    {/* <SecondaryButton style={{padding:'16px', minWidth:'93px',background:'transparent'}}> */}
                   <img style={{height:'35px'}} src={call}/>
                  +91-9352169717
                    {/* </SecondaryButton> */}
                    </a>
                  </StyledLink>
                  <StyledLink>
                  {/* <a href="/get-demo/" style={{ textDecoration: "none" }} rel="noopener" target="_blank"> */}
                    <PrimaryButton style={{padding:'16px', minWidth:'100px', background:'#005B38',border: '2px solid #005B38'}} onClick={this.showPopup}>
                        Schedule a visit
                    </PrimaryButton>
                  

                    <Popup
            open={this.state.show}
            position="center"
            modal
            overlayStyle={{ background: "transparent", backdropFilter:"blur(5px)" }}
            contentStyle={{ width:'90%',borderRadius:'20px', maxHeight:"700px", background: 'darkseagreen', padding:"0", zIndex:"-2"}}
            style={{ borderRadius: "22px" }}
            closeOnDocumentClick
            onClose={this.closePopup}
          >
        
<ScheduleForm/>
</Popup>
                    
                  {/* </a> */}
                  </StyledLink>
          </Buttons>
          {/* </NavBar> */}
        </StyledContainer>
        <Mobile>
          {mobileMenuOpen && (
            <MobileMenu>
              <NavListWrapperMobile mobile={true}>
                {/* <ul> */}
                
                  <NavItemMobile>
                    <Accordion allowZeroExpanded>
                      <AccordionItem>
                        <AccordionItemHeading>
                          <AccordionItemButton>Courses </AccordionItemButton>
                        </AccordionItemHeading>
                        <AccordionItemPanel>
                          <DropdownColumn>
                            <DropdownItemTitle >
                              <StyledImage src={i1} />
                              <h5>
                                IIT JEE
                              </h5>
                            </DropdownItemTitle>

                            <a
                              href="/engineering"
                              onClick={this.closeMobileMenu}
                            >
                              <DropdownItemZluri>
                               
                                <DropdownItemTextMobile>
                                  <h4>11th + IIT JEE (Early lead)</h4>
                                </DropdownItemTextMobile>
                              </DropdownItemZluri>
                            </a>
                            <a
                              href="/engineering/"
                              onClick={this.closeMobileMenu}
                            >
                              <DropdownItemZluri>
                            
                                <DropdownItemTextMobile>
                                  <h4>12th + IIT JEE (Flight)</h4>
                                </DropdownItemTextMobile>
                              </DropdownItemZluri>
                            </a>
                            <a
                              href="/engineering/"
                              onClick={this.closeMobileMenu}
                            >
                              <DropdownItemZluri>
                            
                                <DropdownItemTextMobile>
                                  <h4>Target (Eagle's eye)</h4>
                                </DropdownItemTextMobile>
                              </DropdownItemZluri>
                            </a>
                            <a
                              href="/engineering/"
                              onClick={this.closeMobileMenu}
                            >
                              <DropdownItemZluri>
                                
                                <DropdownItemTextMobile>
                                  <h4>12th + NCERT (Success Elevator)</h4>
                                </DropdownItemTextMobile>
                              </DropdownItemZluri>
                            </a>
                            
                            <DropdownItemTitle>
                              <StyledImage src={i2} />
                              <h5>
                                NEET/AIIMS
                              </h5>
                            </DropdownItemTitle>
                            <a
                              href="/medical/"
                              onClick={this.closeMobileMenu}
                            >
                              <DropdownItemZluri>
                                
                                <DropdownItemTextMobile>
                                  <h4>11th + NEET (Genesis)</h4>
                                </DropdownItemTextMobile>
                              </DropdownItemZluri>
                            </a>
                            <a
                              href="/medical/"
                              onClick={this.closeMobileMenu}
                            >
                              <DropdownItemZluri>
                            
                                <DropdownItemTextMobile>
                                <h4>12th + NEET (Orchid)</h4>
                                </DropdownItemTextMobile>
                              </DropdownItemZluri>
                            </a>
                            <a
                              href="/medical/"
                              onClick={this.closeMobileMenu}
                            >
                              <DropdownItemZluri>
                               
                                <DropdownItemTextMobile>
                                  <h4>Target NEET (Synapse)</h4>
                                </DropdownItemTextMobile>
                              </DropdownItemZluri>
                            </a>
                            <a
                              href="/medical/"
                              onClick={this.closeMobileMenu}
                            >
                              <DropdownItemZluri>
                               
                                <DropdownItemTextMobile>
                                  <h4>12th + NCERT (Success Elevator)</h4>
                                </DropdownItemTextMobile>
                              </DropdownItemZluri>
                            </a><a
                              href="/medical/"
                              onClick={this.closeMobileMenu}
                            >
                              <DropdownItemZluri>
                               
                                <DropdownItemTextMobile>
                                  <h4>NEET Crash Course</h4>
                                </DropdownItemTextMobile>
                              </DropdownItemZluri>
                            </a>
                            <DropdownItemTitle>
                              <StyledImage src={i3} />
                              <h5>
                                Pre Foundation
                              </h5>
                            </DropdownItemTitle>

                            <a
                              href="/pre-foundation/"
                              onClick={this.closeMobileMenu}
                            >
                              <DropdownItemZluri>
                                <DropdownItemTextMobile>
                                  <h4>9th (Focus)</h4>
                                </DropdownItemTextMobile>
                              </DropdownItemZluri>
                            </a>
                            <a
                              href="/pre-foundation/"
                              onClick={this.closeMobileMenu}
                            >
                              <DropdownItemZluri>
                               
                                <DropdownItemTextMobile>
                                  <h4>10th (Laser)</h4>
                                </DropdownItemTextMobile>
                              </DropdownItemZluri>
                            </a>
                          </DropdownColumn>
                        </AccordionItemPanel>
                      </AccordionItem>
                    </Accordion>
                  </NavItemMobile>
                  <NavItemMobile>
                    <a href="/about/" onClick={this.closeMobileMenu}>
                      About Us
                    </a>
                  </NavItemMobile>
                  <NavItemMobile>
                    <a href="/images/" onClick={this.closeMobileMenu}>
                      Gallery
                    </a>
                  </NavItemMobile>
                  
                  <NavItemMobile>
                    <Accordion allowZeroExpanded>
                      <AccordionItem>
                        <AccordionItemHeading>
                          <AccordionItemButton>Results </AccordionItemButton>
                        </AccordionItemHeading>
                        <AccordionItemPanel>
                          <DropdownColumn>
                            <a
                              href="/results/engineering/"
                              onClick={this.closeMobileMenu}
                            >
                              <DropdownItemZluri>
                                <DropdownItemImg>
                                  {/* <StyledImage src={smp} /> */}
                                  <img src={i1}/>
                                </DropdownItemImg>
                                <DropdownItemTextMobile>
                                  <h4>Engineering (IIT JEE)</h4>
                                </DropdownItemTextMobile>
                              </DropdownItemZluri>
                            </a>
                            <a
                              href="/results/medical/"
                              onClick={this.closeMobileMenu}
                            >
                              <DropdownItemZluri>
                                <DropdownItemImg>
                                <img src={i2}/>

                                </DropdownItemImg>
                                <DropdownItemTextMobile>
                                  <h4>Medical (NEET)</h4>
                                </DropdownItemTextMobile>
                              </DropdownItemZluri>
                            </a>
                            <a
                              href="/results/pre-foundation"
                              onClick={this.closeMobileMenu}
                            >
                              <DropdownItemZluri>
                                <DropdownItemImg>
                                  <StyledImage src={i3} />
                                </DropdownItemImg>
                                <DropdownItemTextMobile>
                                  <h4>Pre Foundation (9th & 10th)</h4>
                                </DropdownItemTextMobile>
                              </DropdownItemZluri>
                            </a>
                          </DropdownColumn>
                        </AccordionItemPanel>
                      </AccordionItem>
                    </Accordion>
                  </NavItemMobile>
                 
                {/* </ul> */}
              </NavListWrapperMobile>
             
              <ActionsContainerMobile style={{marginBottom:'20px'}}>
                {/* <a href="#contactus" style={{ textDecoration: "none" }} > */}
                <AnchorLink offset={() => 80} href='#contactus'>


                  <StyledButton onClick={this.closeMobileMenu}>
                    Contact us
                  </StyledButton>
                  
                  </AnchorLink>
                
                {/* </a> */}
                {/* </Link> */}
              </ActionsContainerMobile>
              <ActionsContainerMobile>
              <StyledButton onClick={this.closeMobileMenu}>
                    Schedule a visit
                  </StyledButton>
                  <Popup>
                    
                  </Popup>
              </ActionsContainerMobile>
            </MobileMenu>
          )}
        </Mobile>
      </Nav>
      </div>
    )
  }
}

const StyledImage = styled.img`
  width: 25px;
  height:25px;
  align-self:center;
`
const DropdownItemTitle = styled.div`
display:flex;
margin-right: 4px; 
text-align: center;
line-height: 25px;
align-self: center;
gap:20px;
margin-bottom:8px;
align-items:center;
margin-top:24px;
h5{
  color: #656565;
font-family: Lexend Semibold;
font-size: 14px;
font-style: normal;
font-weight: 600;
line-height: 120%; /* 16.8px */
text-transform: uppercase;
  text-align:left;
  margin:0px;
}
@media (max-width: ${props => props.theme.screen.md}) {
}
`

const GartnerDiv = styled.div`
border-radius: 40px;
background: rgb(247, 247, 247);
padding: 10px 16px;
display: grid;
grid-template-columns: 1fr 1fr;
/* gap: 10px; */
max-width: 360px;
margin: 0px auto;

h4{
  color: #000;
font-family: Lexend Regular;
font-size: 16px;
font-style: normal;
font-weight: 400;
line-height: 137.5%;
align-self: center;
}
button{
  padding:0px;
}
a{
  text-decoration:none;
  align-self: center;
}

`
const Buttons = styled.div`
display: flex;
flex-direction: row;
gap:10px;
align-items: center;
@media (max-width: ${props => props.theme.screen.md}){
  display: none;
}
`
const StyledLink = styled.div`
  display: block;
  @media (max-width: ${props => props.theme.screen.md}){
    display: none;
  }
  img{
    position:absolute;
    left: -22px;
    top: -4px;
    transform: rotate(12deg);
  }
`
const StyledButton = styled.button`
background: #1C1C1F;
border-radius: 100px;
height:56px;
min-width: 300px;
padding:16px 32px;
font-family: 'Lexend Medium';
font-style: normal;
font-size: 15px;
line-height: 22px;
text-align: center;
align-items: center;
color: #FFFFFF;
border: 2px solid #1C1C1F;
  outline: 0px;
  box-shadow: inset 0 0 0 0 #1C1C1F;
    -webkit-transition: ease-out 0.5s;
    -moz-transition: ease-out 0.5s;
    transition: ease-out 0.5s;
    &:hover {
      box-shadow: inset 260px 0 0 0 #fff;
      color: #1C1C1F;
  }
  @media (max-width: ${props => props.theme.screen.xs}){
    padding: 16px 20px;

  }
`