import React, { useState } from "react"
import styled from "styled-components"
import { Container } from "../style"
// import { AnchorLink } from "gatsby-plugin-anchor-links"
import logo from "../../images/logo-concept.png"
import Popup from "reactjs-popup"
import 'reactjs-popup/dist/index.css';
import ScheduleForm from "./schedule-visit"
import HiringForm from "./hiring"
const Footer = () => {
  const [show, setShow] = useState(false);
  const showPopup = () => {
    setShow(true)
  }
  const closePopup = () => {
    setShow(false)
  }
  return (
    <FooterWrapper id="footer">
      <FooterColumnContainer>
        <FooterColumn className="concept">
          <Address>
            <div>
             <img style={{height:'60px'}} src={logo}/>
            </div>
            <AddressSubtitle>
              Patel nagar, near polytechnique college, Bikaner Rajasthan
            </AddressSubtitle>
          </Address>
          <Social>
            <a
              href="https://www.linkedin.com/company/conceptinstitute/"
              target="_blank"
              rel="noreferer, ,noopener"
            >
              <svg
                width="36"
                height="33"
                viewBox="0 0 21 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.4855 0.5H1.51453C0.67804 0.5 0 1.14722 0 1.94569V19.0998C0 19.8982 0.67804 20.5455 1.51453 20.5455H19.4855C20.322 20.5455 21 19.8982 21 19.0998V1.94569C21 1.14722 20.322 0.5 19.4855 0.5V0.5ZM7.44882 15.6515H4.89159V8.30777H7.44882V15.6515ZM6.17029 7.30498H6.15363C5.2955 7.30498 4.74051 6.74111 4.74051 6.03639C4.74051 5.31576 5.31248 4.76749 6.18727 4.76749C7.06206 4.76749 7.60039 5.31576 7.61705 6.03639C7.61705 6.74111 7.06206 7.30498 6.17029 7.30498ZM16.6696 15.6515H14.1127V11.7228C14.1127 10.7355 13.7425 10.0621 12.8172 10.0621C12.1108 10.0621 11.6901 10.5163 11.5052 10.9548C11.4376 11.1117 11.4211 11.331 11.4211 11.5504V15.6515H8.86402C8.86402 15.6515 8.89751 8.99674 8.86402 8.30777H11.4211V9.34758C11.7609 8.84717 12.3689 8.13542 13.7257 8.13542C15.4081 8.13542 16.6696 9.18501 16.6696 11.4406V15.6515Z"
                  fill="white"
                />
              </svg>
            </a>
          
            <a
              href="https://www.facebook.com/ConceptInstitute"
              target="_blank"
              rel="noreferer, ,noopener"
            >
              <svg
                width="36"
                height="33"
                viewBox="0 0 21 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 10.5C21 4.70039 16.2996 0 10.5 0C4.70039 0 0 4.70039 0 10.5C0 16.2996 4.70039 21 10.5 21C10.5615 21 10.623 21 10.6846 20.9959V12.8256H8.42871V10.1965H10.6846V8.26055C10.6846 6.01699 12.0545 4.79473 14.0561 4.79473C15.0158 4.79473 15.8402 4.86445 16.0781 4.89727V7.24336H14.7C13.6131 7.24336 13.3998 7.76016 13.3998 8.51895V10.1924H16.0043L15.6639 12.8215H13.3998V20.5939C17.7885 19.3348 21 15.2947 21 10.5V10.5Z"
                  fill="white"
                />
              </svg>
            </a>
          </Social>
         
        </FooterColumn>
        <FooterColumn>
         
         <HeadingFooter1>Results</HeadingFooter1>
         <ul>
           <li>
             <Anchor href="/results/engineering">Engineering</Anchor>
           </li>
           <li>
             <Anchor href="/results/medical">Medical</Anchor>
           </li>
           <li>
             <Anchor href="/results/pre-foundation/">Pre foundation</Anchor>
           </li>
          
         </ul>
         
          
       </FooterColumn>
        <FooterColumn>
         
          <HeadingFooter1>Courses</HeadingFooter1>
          <ul>
            <li>
              <Anchor href="/engineering">Engineering</Anchor>
            </li>
            <li>
              <Anchor href="/medical">Medical</Anchor>
            </li>
            <li>
              <Anchor href="/pre-foundation/">Pre foundation</Anchor>
            </li>
           
          </ul>
          
           
        </FooterColumn>

        <FooterColumn>
          <HeadingFooter1>Company</HeadingFooter1>
          <ul>
            <li>
              <Anchor href="/about/">Our Story</Anchor>
            </li>
            <li>
              <Anchor onClick={showPopup}>
                Careers<span>We're Hiring</span>
              </Anchor>
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
        
<HiringForm/>
</Popup>
            </li>
           
          </ul>
          
        </FooterColumn>

      
      </FooterColumnContainer>
      {/* <MobileDiv>
        <FooterColumnContainerMobile>
          <FooterColumn>
          <HeadingFooter1>Products</HeadingFooter1>
          <ul>
            <li>
              <Anchor href="/saas-management/">SaaS Management</Anchor>
            </li>
            <li>
              <Anchor href="/access-management/">Access Management</Anchor>
            </li>
            <li>
              <Anchor href="/access-reviews">Access Reviews</Anchor>
            </li>
          </ul>
          <HeadingFooter>Platform</HeadingFooter>
          <ul>
            <li>
              <Anchor href="/features/api/">Open APIs</Anchor>
            </li>
            <li>
              <Anchor href="/integrations/">Integrations</Anchor>
            </li>
            <li>
              <Anchor href="/desktop-agent/">Desktop Agents</Anchor>
            </li>
            <li>
              <Anchor href="/browser-extension/">Browser Extensions</Anchor>
            </li>
          </ul>
         
            
         
          </FooterColumn>
          <FooterColumn>
          <HeadingFooter1>Company</HeadingFooter1>
          <ul>
            <li>
              <Anchor href="/our-story/">Our Story</Anchor>
            </li>
            <li>
              <Anchor href="/careers/">
                Careers<span>We're Hiring</span>
              </Anchor>
            </li>
            <li>
              <Anchor href="/events/">Events</Anchor>
            </li>
            <li>
              <Anchor href="/pricing/">Pricing</Anchor>
            </li>
            <li>
              <Anchor href="/contact/">Contact Us</Anchor>
            </li>
            <li>
              <Anchor href="/partners/">Partner with Zluri</Anchor>
            </li>
            <li>
              <Anchor href="/security/">Security & Compliance</Anchor>
            </li>
            <li>
              <a
                href="https://trust.zluri.com/"
                target="_blank"
                rel="noreferer, ,noopener"
                style={{ fontSize: "14px" }}
              >
                Trust Center
              </a>
            </li>
          </ul>
          <HeadingFooter>Compare</HeadingFooter>
          <HeadingFooterMini>SaaS Management</HeadingFooterMini>
          <ul>
            <li>
              <Anchor href="/zluri-vs-torii/">Zluri vs Torii</Anchor>
            </li>
            <li>
              <Anchor href="/zluri-vs-torii/">
                Zluri vs Zylo
              </Anchor>
            </li>
           
            <li>
              <Anchor href="https://get.zluri.com/lp-zluri-vs-productiv">
                Zluri vs Productiv
              </Anchor>
            </li>
           
          </ul>
         
          </FooterColumn>
        </FooterColumnContainerMobile>
        <FooterColumnContainerMobileOne>
          
          
        </FooterColumnContainerMobileOne>
      </MobileDiv> */}
      <BottomBG>
        <MobileShow>
          <BrandContainerMobile>
            <Logo>
              <img src={logo}/>
            </Logo>
          </BrandContainerMobile>
          <Address>
            {/* <AddressTitle>Zluri Pte. Ltd.</AddressTitle> */}
            <AddressSubtitleMobile>
              <br />
              Patel nagar, near polytechnique college, Bikaner Rajasthan

              <br />
             Nagaur | Hanumangarh | Suratgarh
            </AddressSubtitleMobile>
          </Address>
          <SocialMobile>
            <a
              href="https://www.linkedin.com/company/conceptinstitute/"
              target="_blank"
              rel="noreferer, ,noopener"
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 21 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.4855 0.5H1.51453C0.67804 0.5 0 1.14722 0 1.94569V19.0998C0 19.8982 0.67804 20.5455 1.51453 20.5455H19.4855C20.322 20.5455 21 19.8982 21 19.0998V1.94569C21 1.14722 20.322 0.5 19.4855 0.5V0.5ZM7.44882 15.6515H4.89159V8.30777H7.44882V15.6515ZM6.17029 7.30498H6.15363C5.2955 7.30498 4.74051 6.74111 4.74051 6.03639C4.74051 5.31576 5.31248 4.76749 6.18727 4.76749C7.06206 4.76749 7.60039 5.31576 7.61705 6.03639C7.61705 6.74111 7.06206 7.30498 6.17029 7.30498ZM16.6696 15.6515H14.1127V11.7228C14.1127 10.7355 13.7425 10.0621 12.8172 10.0621C12.1108 10.0621 11.6901 10.5163 11.5052 10.9548C11.4376 11.1117 11.4211 11.331 11.4211 11.5504V15.6515H8.86402C8.86402 15.6515 8.89751 8.99674 8.86402 8.30777H11.4211V9.34758C11.7609 8.84717 12.3689 8.13542 13.7257 8.13542C15.4081 8.13542 16.6696 9.18501 16.6696 11.4406V15.6515Z"
                  fill="white"
                />
              </svg>
            </a>
           
            <a
              href="https://www.facebook.com/ConceptInstitute"
              target="_blank"
              rel="noreferer, ,noopener"
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 21 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 10.5C21 4.70039 16.2996 0 10.5 0C4.70039 0 0 4.70039 0 10.5C0 16.2996 4.70039 21 10.5 21C10.5615 21 10.623 21 10.6846 20.9959V12.8256H8.42871V10.1965H10.6846V8.26055C10.6846 6.01699 12.0545 4.79473 14.0561 4.79473C15.0158 4.79473 15.8402 4.86445 16.0781 4.89727V7.24336H14.7C13.6131 7.24336 13.3998 7.76016 13.3998 8.51895V10.1924H16.0043L15.6639 12.8215H13.3998V20.5939C17.7885 19.3348 21 15.2947 21 10.5V10.5Z"
                  fill="white"
                />
              </svg>
            </a>
          </SocialMobile>
        </MobileShow>
        <Legal>
          <ZluriLogo>
            <BrandContainer>
              <Logo>
                <img style={{height:'40px'}} src={logo}/>
              </Logo>
            </BrandContainer>
            <Copyright>
              © {new Date().getFullYear()} Concept Classes, All Rights Reserved
            </Copyright>
          </ZluriLogo>
          
        </Legal>
      </BottomBG>
    </FooterWrapper>
  )
}

export default Footer


const FooterWrapper = styled.footer`
  background-color: #005B38;
  padding: 0 0;
  position: relative;
  // &::after {

  // content: "";
  // position: absolute;
  // bottom: 0px;
  // left: 0px;
  // width: 100%;
  // height: 250px;
  // background: linear-gradient(0deg, rgb(0, 0, 0) 0%, rgb(0, 0, 0) 27.08%, rgba(0, 0, 0, 0) 100%);
  // pointer-events: none;
  // }
 
`
const Anchor = styled.a`
  text-decoration: none;
  color: #b8b8b8;
  align-self: center;
  font-size: 14px;
`

const Logo = styled.div`
  font-family: ${(props) => props.theme.font.extrabold};
  ${(props) => props.theme.font_size.regular};
  color: white;
  text-decoration: none;
  letter-spacing: 1px;
  margin: 0;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 9;
  text-decoration: none;
  outline: 0px;
  img{
    width:150px;
  }
  @media (max-width: ${(props) => props.theme.screen.md}) {
    margin: auto;
  }
`
const ZluriLogo = styled.div`
  display: flex;
`

const BrandContainer = styled.div`
  margin: 15px 0 20px;
  position: relative;
  padding-left: 0px;
  display: flex;
  @media (max-width: ${(props) => props.theme.screen.md}) {
    display: none;
  }
`
const MobileShow = styled.div`
  display: none;
  @media (max-width: ${(props) => props.theme.screen.md}) {
    display: block;
  }
`
const BrandContainerMobile = styled.div`
  // margin: 40px auto 0px;
    padding-top: 20px;
  position: relative;
  padding-left: 0px;
  display: flex;
`

const Social = styled.div`
  margin-top: 16px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: row;
  a {
    opacity: 0.8;
    margin-right: 16px;
    margin-left: 0;
  }
  a:hover {
    opacity: 1;
    transition:
      0.5s ease-out,
      transform 0.5s ease;
  }
  @media (max-width: ${(props) => props.theme.screen.sm}) {
    text-align: center;
  }
`
const SocialMobile = styled.div`
  justify-content: center;
  margin-top: 16px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: row;
  a {
    opacity: 0.8;
    margin-right: 12px;
    margin-left: 12px;
  }
  a:hover {
    opacity: 1;
    transition:
      0.5s ease-out,
      transform 0.5s ease;
  }
  @media (max-width: ${(props) => props.theme.screen.md}) {
    text-align: center;
  }
`
const Address = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  @media (max-width: ${(props) => props.theme.screen.sm}) {
    text-align: center;
  }
`

const AddressSubtitle = styled.div`
  font-family: Lexend Regular;
  line-height: 18px;
  font-size: 13px;
  font-weight: 400;
  color: white;
  opacity: 0.6;
  b {
    font-family: Lexend Semibold;
    font-size: 14px;
    font-weight: 600;
  }
`
const AddressSubtitleMobile = styled.div`
  font-family: Lexend Regular;
  text-align: center;
  line-height: 18px;
  font-size: 13px;
  font-weight: 400;
  color: white;
  opacity: 0.6;
`

const FooterColumnContainer = styled(Container)`
  padding-top: 80px;
  padding-bottom: 30px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-column-gap: 32px;
  justify-content: start;
  @media (max-width: ${(props) => props.theme.screen.sm}) {
  grid-template-columns: repeat(3, 1fr);
  // display: none;
  }
  @media (max-width: ${(props) => props.theme.screen.xs}) {
  grid-template-columns:  1fr;
  }
  
`

const FooterColumn = styled.div`
  span {
    font-family: "Lexend Semibold";
    font-style: normal;
    font-weight: 600;
    font-size: 7.21519px;
    line-height: 208%;
    color: #ffffff;
  }
  ul {
    list-style: none;
    margin-top: 10px;
    padding: 0;
    color: #bababb;
    li {
      margin-bottom: 4px;
      font-family: "Lexend Medium";
      font-style: normal;
      font-weight: 500;
      font-size: 18px;
      line-height: 25px;
      color: #b8b8b8;
      a {
        color: white;
        text-decoration: none;
        align-self: center;
      }
      a:hover {
        color: white;
        transition:
          0.5s ease-out,
          transform 0.5s ease;
      }
      span {
        margin-left: 6px;
        padding: 2px 4px;
        font-family: Lexend Light;
        font-size: 12px;
        line-height: 19px;
        color: #ffffff;
        position: absolute;
        height: 24px;
        background: #dd3c57;
        border-radius: 2.85px;
      }
    }
  }
&.concept{
  @media (max-width: ${(props) => props.theme.screen.sm}) {
    display:none;
  }
}
`

const HeadingFooter1 = styled.p`
  font-family: "Lexend Semibold";
  font-style: normal;
  font-weight: 600;
  font-size: 18px;
  line-height: 24px;
  color: rgb(255, 255, 255, 0.6);
  text-transform: uppercase;
  margin-bottom: 0px;
`

const Legal = styled(Container)`
  display: flex;
  justify-content: space-between;
  align-content: center;
  grid-template-columns: 1fr 1fr;
  @media (max-width: ${(props) => props.theme.screen.md}) {
    flex-direction: column;
  }
`
const BottomBG = styled.div`
display:none;
  @media (max-width: ${(props) => props.theme.screen.xs}) {
    display:block;
    margin-top: 30px;
    padding: 20px 0 40px;
   
  }
  background: darkseagreen;
`
const Copyright = styled.p`
  font-family: "Lexend Regular";
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 15px;
  color: #4a4a4a;
  align-self: center;
  margin: 0 0 0 20px;
  @media (max-width: ${(props) => props.theme.screen.md}) {
    margin: auto;
    text-align: center;
  }
`

const LegalPages = styled.ul`
  margin: 0;
  justify-content: flex-end;
  list-style: none;
  text-align: center;
  align-self: center;
  li {
    display: inline-block;
    padding-left: 16px;
    font-family: "Lexend Regular";
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 15px;
    color: #4a4a4a;
    align-self: center;
  }
  a:hover {
    color: white;
    transition:
      0.5s ease-out,
      transform 0.5s ease;
  }
  @media (max-width: ${(props) => props.theme.screen.md}) {
    padding-left: 0;
    padding-right: 16px;
    text-align: center;
    color: #4a4a4a;
    align-self: center;
  }
`
