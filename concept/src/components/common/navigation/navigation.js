import React, { Component } from "react"
import { Menu, X } from "react-feather"
import styled from "styled-components"
import Platform from "../new-navigation/platform-nav"
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
  ActionsContainerMobile,
  NavItemMobile,
  NavListWrapperMobile,

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
import { PrimaryButton } from "../../style"
import Popup from "reactjs-popup"
import 'reactjs-popup/dist/index.css';
import AnchorLink from 'react-anchor-link-smooth-scroll'
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
  closeAndShowPopup = () => {
    this.closeMobileMenu();
    this.showPopup();
  };
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

    const { bgwhite } = this.props;
  
    return (
     
     <div style={{width:'100vw'}}>
      <Nav {...this.props} scrolled={this.state.hasScrolled}>
     
        <StyledContainer {...this.props} scrolled={this.state.hasScrolled} bgwhite={bgwhite}>
          {/* <NavBar> */}
         <a href="/">
          <Brand>
          <img src={logo} alt="concept"/>

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
                <NavItem>
                <a href="/college-search/">College Search </a><Anchor className="labels">
                <span>New</span>
              </Anchor>
                </NavItem>
                <NavItem>
                <a href="/science-champ-2025-2026/">Science Champ</a>
                </NavItem>

                {/* <Company /> */}
               
            </NavListWrapper>
          </Mobile>
          <Buttons>
             <StyledLink >
              <a style={{display:'flex', alignItems:'center', textDecoration:'none', color:'#222',position:'relative', fontWeight:'500'}} href="tel:9928111865">
                    {/* <SecondaryButton style={{padding:'16px', minWidth:'93px',background:'transparent'}}> */}
                   <img style={{height:'30px'}} src={call} alt="concept"/>
                  9928111865
                    {/* </SecondaryButton> */}
                    </a>
                  </StyledLink>
                  <StyledLink>
               
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
                                  <img src={i1} alt="concept"/>
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
                                <img src={i2} alt="concept"/>

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
                  <NavItemMobile>
                    <a href="/college-search/" onClick={this.closeMobileMenu}>
                      College Search
                    </a>
                  </NavItemMobile>
                  <NavItemMobile>
                    <a href="/science-champ-2025-2026/" onClick={this.closeMobileMenu}>
                      Science Champ
                    </a>
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
              <StyledButton onClick={this.closeAndShowPopup}>
                    Schedule a visit
                  </StyledButton>
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
const Anchor = styled.a`
  text-decoration: none;
  color: #b8b8b8;
  align-self: center;
  font-size: 14px;
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