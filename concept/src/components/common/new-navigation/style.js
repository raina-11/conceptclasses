import styled from "styled-components"
import Popup from 'reactjs-popup';
import { Container } from "../../style";

export const StyledPopup = styled(Popup)`
  &-overlay {
    background: rgba(0,0,0,.5);
  }
  &-content {
  border-radius: 8px;
  background: #fff;
  padding: 20px;
  }
`

export const Subscribe = styled.div`
display: flex;
margin: auto;
justify-content: center;
@media (max-width: ${props => props.theme.screen.sm}) {
  flex-wrap: wrap; 
}
` 
export const Player = styled.div`
margin: 16px 12px;
`
export const Banner = styled.div`
font-family: Lexend Regular;
font-size: 13px;
color: #fff;
padding-left: 8px;
  display: ${props => (props.scrolled ? `none` : `block`)};
  text-align: center;
  margin-top: -24px;
  margin-bottom: 24px;
  background-color: #5EBBFE;
  padding: 11px 80px;
  @media (max-width: ${props => props.theme.screen.sm}) {
    padding: 11px 30px;
  }
  span{
    color: white;
    text-align: center;
    font-size: 13px;
  }
  a {
    text-decoration: underline dotted;
    font-family: Lexend Medium;
    font-size: 13px;
    color: #fff;
    padding-left: 8px;
  }
`
export const BannerBright = styled.div`
  display: ${props => (props.scrolled ? `none` : `block`)};
  text-align: center;
  margin-top: -24px;
  margin-bottom: 24px;
  background: linear-gradient(0.44deg, #5ABAFF -109.02%, #2266E2 99.54%);
  padding: 11px 80px;
  @media (max-width: ${props => props.theme.screen.sm}) {
    padding: 11px 30px;
  }
  span{
    color: white;
    text-align: center;
    font-size: 15px;
  }
  a {
    text-decoration: underline dotted;
    font-family: Lexend Medium;
    font-size: 15px;
    color: #fff;
    padding-left: 8px;
  }
`
export const Nav = styled.nav`
  padding: ${props => (props.scrolled ? `16px 0 12px` : `24px 0 20px`)};
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
  background: ${props => (props.scrolled ? `white` : null)};
  transition: 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  @media (max-width: ${props => props.theme.screen.md}) {
    padding: ${(props) => (props.scrolled ? `16px 0 15px` : `24px 0 15px`)};
  }
  &:hover{
    background: #ffffff;
    transition:0.3s ease-in-out 0s;
  }
`

export const StyledContainer = styled(Container)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media (max-width: ${props => props.theme.screen.lg}) {
    max-width: 1200px;
  }
  @media (max-width: ${props => props.theme.screen.md}) {
    max-width: 720px;
  }
  @media (max-width: ${props => props.theme.screen.sm}) {
    max-width: 540px;
  }
`

export const NavListWrapper = styled.div`
  display: flex;
  @media (max-width: ${props => props.theme.screen.lg})  {
    column-gap: 10px;
  }
  ul {
    align-self: center;
    list-style: none;
    margin: 0;
    display: flex;
    flex-direction: row;
    padding:0;
    column-gap:5px;
    li {
border-radius: 23.5px;
transition: 0.3s ease-in-out 0s;
      &:hover {
        font-family: 'Lexend Medium';
font-style: normal;
font-weight: 500;
      color: #2D2828;
        // background: #F9DD74;
        transition: 0.3s ease-in-out 0s;
      }
    }

    ${({ mobile }) =>
      mobile &&
      `
        flex-direction: column;
        margin-top: 1em;

        > ${NavItem} {
          margin: 0;
          margin-top: 0.75em;
        }
      `};
  }
`
export const NavListWrapperMobile = styled.div`
  display: flex;
  column-gap: 45px;
  justify-content: center;
  ul {
    align-self: center;
    list-style: none;
    margin: 0;
    padding: 0 20px;
    display: flex;
    flex-direction: row;
    

    ${({ mobile }) =>
      mobile &&
      `
        flex-direction: column;
        margin-top: 1em;

        > ${NavItem} {
          margin: 0;
          margin-top: 0.75em;
        }
      `};
  }
`

export const NavItem = styled.li`
font-family: 'Lexend Medium';
font-style: normal;
font-weight: 500;
font-size: 16px;
line-height: 160%;
height: 41px;
text-align: center;
color: #000000;
margin: 0 -3.5px;
padding: 8px 14px;
  
border-radius: 23.5px;

  a {
    text-decoration: none;
    color: #000000;
  }

  &.active {
    a {
      opacity: 1;
      text-decoration: none;
    }
  }

  span {
    margin: 0 0 1px 6px;
  }
`
export const NavItemMobile = styled.li`
  margin: 0 0.75em;
  padding: 15px 0;
  font-family: ${props => props.theme.font.medium};
  ${props => props.theme.font_size.xsmall};

  font-size: 20px;
  line-height: 24px;
  
  a {
    text-decoration: none;
    opacity: 0.9;
    color: ${props => props.theme.color.black.regular};
  }

  &.active {
    a {
      opacity: 1;
      text-decoration: none;
    }
  }

  span {
    margin: 0 0 1px 6px;
  }
  @media (max-width: ${props => props.theme.screen.md}) {
    width:650px;
  }
  @media (max-width: ${props => props.theme.screen.sm}) {
    width:460px;
  }
  @media (max-width: ${props => props.theme.screen.xs}) {
    width:300px;
  }
`

export const MobileMenu = styled.div`
  width: 100%;
  height: 100vh;
  z-index: 1000;
  background: white;
  padding-top: 20px;
  backdrop-filter: blur(5px);
  opacity: 0.98;
  height: 600px;
  width: 100%;
  overflow-y: scroll;
`
export const MultiBrand = styled.div`
text-decoration: none;
letter-spacing: 1px;
margin: 0;
a {
  color: ${props => props.theme.color.black.regular};
  text-decoration: none;
}
div{
  @media (max-width: ${props => props.theme.screen.sm}) {
    display: none;
  }
}
span{
  display:none;
  @media (max-width: ${props => props.theme.screen.sm}) {
    display: block;
  }
}
`
export const Brand = styled.div`
  font-family: ${props => props.theme.font.extrabold};
  ${props => props.theme.font_size.regular};
  color: ${props => props.theme.color.black.regular};
  text-decoration: none;
  letter-spacing: 1px;
  margin: 0;
  margin-top: -6px;
  padding-bottom: 0px;
  @media (max-width: ${props => props.theme.screen.md}) {
    padding-bottom: 0;
    align-self: end;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;

    a {
      color: ${props => props.theme.color.black.regular};
      text-decoration: none;
    }
  }
`
export const RightDiv = styled.div`
height: 150px;
float:right;
justify-self: center;

a{
  height: 170px;
  float:right;
  text-decoration: none;
}
a:hover {
  background-color: none;
  color: #2266E2;
  display:block;
  border-radius: 6px;
  text-decoration: none;
}

`
export const ActionsContainer = styled.div`
padding: 5px 0 5px 12px;
  @media (max-width: ${props => props.theme.screen.md}) {
    display: none;
  }

  button {
    font-family: 'Lexend Medium';
font-style: normal;
font-weight: 500;
font-size: 16px;
line-height: 160%;
text-align: center;
color: #FFFFFF;
    background: #2266E2;
    border: 2px solid #2266E2;
    border-radius: 47px;
    padding: 2px 22px;
    box-shadow: inset 0 0 0 0 #fff;
    -webkit-transition: ease-out 0.4s;
    -moz-transition: ease-out 0.4s;
    transition: ease-out 0.4s;
    &:hover {
      box-shadow: inset 200px 0 0 0 #fff;
      color: #2266E2;
  }
  }
`
export const ActionsContainerLogin = styled.div`
padding: 5px 0 5px 12px;
  @media (max-width: ${props => props.theme.screen.md}) {
    display: none;
  }

  button {
    font-family: 'Lexend Medium';
font-style: normal;
font-weight: 500;
font-size: 16px;
line-height: 160%;
text-align: center;
    background: linear-gradient(to left, transparent 50%, #2266E2 50%) right;
    background-size: 200% 100%;
    border: 2px solid #2266E2;
    border-radius: 47px;
    padding: 2px 22px;
      color: #2266E2;
    -webkit-transition: ease-out 0.2s;
    -moz-transition: ease-out 0.2s;
    transition: ease-out 0.2s;
    // box-shadow: inset 0 0 0 0 #fff;
    &:hover {
      // background: #2266e2;
      background-position: left;
      // box-shadow: inset 200px 0 0 0 #2266E2;
      color: #FFFFFF;
    // padding: 3px 23px;
    // border-width: 0;
  }
  }
`
export const ActionsContainerMobile = styled.div`
text-align: center;
margin: 20px auto 60px;

  button {
    font-weight: 500;
    font-size: 20px;
    color: white;
    background: #2266E2;
    border: 2px solid #2266E2;
    border-radius: 4px;
    padding: 10px 16px;
    width:75%;
    
    &:hover {
  }
  }
`

export const Mobile = styled.div`
  display: none;

  @media (max-width: ${props => props.theme.screen.md}) {
    display: block;
  }

  ${props =>
    props.hide &&
    `
    display: block;

    @media (max-width: ${props.theme.screen.md}) {
      display: none;
    }
  `}
`

export const Dropdown = styled.div`
margin: 0 -2px;
float: left;
  
font-family: ${props => props.theme.font.medium};
${props => props.theme.font_size.xsmall};

border-radius: 23.5px;
transition: all 0.3s ease-in-out;
&:hover {
  button{
    font-family: 'Lexend Medium';
    font-style: normal;
    font-weight: 500;
// color: #2D2828;
transition: 0.3s ease-in-out 0s;
  }
  // background: #F9DD74;
border-radius: 23.5px;
  transition: 0.3s ease-in-out 0s;
}
&.active {
  p{
    button{
      font-family: 'Lexend Medium';
    font-style: normal;
    font-weight: 500;
    // color: #2D2828;
    transition: 0.3s ease-in-out 0s;
      }
    // background: #F9DD74;
  border-radius: 23.5px;
    transition: 0.3s ease-in-out 0s;
  }
}
&:focus-visible {
  button{
    font-family: 'Lexend Medium';
font-style: normal;
font-weight: 500;
  // color: #2D2828;
  transition: 0.3s ease-in-out 0s;
    }
  // background: #F9DD74;
border-radius: 23.5px;
  transition: 0.3s ease-in-out 0s;
}
&:hover #dropdown{
    display: block;
    transition:all 0.3s ease-in-out;
    opacity:1;
  }
  
`

export const DropdownContentLarge = styled.div`
  display: none;
  border-radius: 10px;
  padding: 24px;
  position: absolute;
  background-color: #f9f9f9;
  min-width: 160px;
  border: 0.5px solid #EBEBEB;
  box-shadow: 0px 5px 30px rgba(0, 0, 0, 0.05), 0px 4px 11px rgba(0, 0, 0, 0.08);
  z-index: 998;
  left: -250%;
`

export const DropdownContent = styled.div`
border-top: 1px solid #EBEBEB;
display: none;
position: absolute;
width: 100%;
left: 0;
padding: 30px 50px;
background: #FFFFFF;
box-shadow: 0px 8px 12px rgba(0, 0, 0, 0.13);
z-index: 998;
transition:display 0.3s ease-in-out 0s;
@media (max-width: ${(props) => props.theme.screen.lg}) {
  padding-left:20px;
}
`

export const DropdownGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 670px;

  a {
    float: none;
    color: black;
    padding: 12px 16px 14px 16px;
    text-decoration: none;
    display: block;
    text-align: left;
  }

  a:hover {
    background-color: #EBEBEB;
    color: #2266E2;
    display:block;
    border-radius: 6px;
  }
`
export const DropdownRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  margin: -10px;

  a {
    float: none;
    color: black;
    padding: 8px 10px 8px 10px;
    text-decoration: none;
    display: block;
    text-align: left;
  }

  a:hover {
    background-color: #EBEBEB;
    color: #2266E2;
    display:block;
    border-radius: 6px;
  }
`

export const DropdownRowSolutions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  
`

export const DropdownRowResources = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  max-width: 1400px;
  margin: auto;

  a {
    float: none;
    color: black;
    padding: 8px 10px 8px 10px;
    text-decoration: none;
    display: block;
    text-align: left;
  }

  a:hover {
    color: #2266E2;
    display:block;
    border-radius: 6px;
  }
`
export const DropdownRowCompany = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  max-width: 1400px;
  margin: auto;

  a {
    float: none;
    color: black;
    padding: 8px 10px 8px 10px;
    text-decoration: none;
    display: block;
    text-align: left;
  }

  a:hover {
    color: #2266E2;
    display:block;
    border-radius: 6px;
  }
`
export const DropdownRow1 = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  margin: -10px;

  a {
    float: none;
    color: black;
    padding: 8px 10px 8px 10px;
    text-decoration: none;
    display: block;
    text-align: left;
  }

  a:hover {
    background-color: #EBEBEB;
    color: #2266E2;
    display:block;
    border-radius: 6px;
  }
`
export const DropdownColumnCompany = styled.div`
display: grid;
grid-template-columns: 1fr 1fr;
float:left;
  a {
    float: none;
    color: black;
    padding: 8px 10px 8px 0px;
    text-decoration: none;
    display: block;
    text-align: left;
    
  }

  a:hover {
    background-color: #EBEBEB;
    color: #2266E2;
    display:block;
    border-radius: 6px;
  }
`
export const DropdownColumnCompany1 = styled.div`
display: grid;
  float: left;
  padding: 10px;
  border-right: 1px solid #EBEBEB;
  a {
    float: none;
    color: black;
    padding: 8px 10px 8px 0px;
    text-decoration: none;
    display: block;
    text-align: left;
    margin-left: -20px;
    margin-right: 20px;
    width: 185px;
  }

  a:hover {
    background-color: #EBEBEB;
    color: #2266E2;
    display:block;
    border-radius: 6px;
  }
`
export const DropdownColumnCompanyZluri = styled.div`
display: grid;
  float: left;
  padding: 10px;
  border-right: 1px solid #EBEBEB;
  margin-left: 20px;
  a {
    float: none;
    color: black;
    padding: 8px 10px 8px 0px;
    text-decoration: none;
    display: block;
    text-align: left;
    margin-left: -20px;
    margin-right: 20px;
  }

  a:hover {
    background-color: #EBEBEB;
    color: #2266E2;
    display:block;
    border-radius: 6px;
  }
`
export const DropdownColumn = styled.div`
  display: grid;
  float: left;
  padding: 10px;
  h5{
    font-family: 'Lexend Regular';
      font-style: normal;
      font-weight: 400;
      font-size: 16px;
      line-height: 160%;
      color: #8D8D8D;
  }

  a {
    float: none;
    color: black;
    padding: 8px 10px 8px 0px;
    text-decoration: none;
    display: block;
    text-align: left;
    margin-left: -20px;
  }

  a:hover {
    background-color: #EBEBEB;
    color: #2266E2;
    display:block;
    border-radius: 6px;
  }
`
export const DropdownColumn1 = styled.div`
  float: left;
  padding: 10px 0;
  margin-left:-20px;
  display: grid;
  grid-template-columns: 1fr 1fr;

  a {
    float: none;
    color: black;
    padding: 8px 10px 8px 0px;
    text-decoration: none;
    display: block;
    text-align: left;
  }

  a:hover {
    background-color: #EBEBEB;
    color: #2266E2;
    display:block;
    border-radius: 6px;
  }
`
export const DropdownItem = styled.div`
 display: flex;
 flex-direction:row;
 `
 export const DropdownItemSolution = styled.div`
 display: flex;
 flex-direction: row;
 float: none;
 white-space: nowrap;
 padding-left: 15px;
 margin-left: 15px;
 `
 export const DropdownItemZluri = styled.div`
 display: flex;
 float: none;
 white-space: nowrap;
 padding-left: 15px;
 `
 export const DropdownItemZluri1 = styled.div`
 display: flex;
 float: none;
 white-space: nowrap;
 padding-left: 20px;
 `

 export const GovernanceDiv = styled.div`
 padding: 100px 30px 30px;
height: 200px;
width: 400px;
background-color:#C4C4C430
 `
 export const ContactFlex = styled.div`
 display: flex;
 flex-direction: row;
 justify-content: space-between;
 `
 export const ContactText = styled.h4`
 font-weight: 600;
 font-size: 20px;
 line-height: 140%;
 letter-spacing: -0.045em;
 color: #FFFFFF;
 `
 export const ContactImage = styled.div`

 `

export const CategoryTitle = styled.h4`
font-weight: 600;
font-size: 20px;
line-height: 110%;
letter-spacing: -0.045em;
color: #27272E;
@media (max-width: ${props => props.theme.screen.md})  {
  padding: 20px 0 5px;
  font-size: 14px;
}
 `

export const DropdownItemText = styled.div`
 display: flex;
 align-self: center;
    flex-direction: column;
    margin: 0 10px;
    color: #2B303C;
    &:hover{
       color:#297FFD;
    }
 h4 {
  font-family: 'Lexend Medium';
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 160%;
   margin: 0 0 4px ;
   span{
  background-repeat: no-repeat;
  background-position: bottom;
  font-family: 'Lexend Semibold';
font-style: normal;
font-weight: 600;
font-size: 10px;
line-height: 12px;
color: #2266E2;
  }
 }

 span {
  font-family: 'Lexend Regular';
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
  color: #BBBBBB;
 }

`
export const DropdownItemTextMobile = styled.div`
 display: flex;
 align-self: center;
    flex-direction: column;
    margin-left:10px;
 h4 {
   font-family: Lexend Regular;
   font-weight: 400;
   font-size: 16px;
line-height: 20px;
   margin: 0 0 10px ;
 }

 span {
   font-family: Lexend Light;
   font-weight: 300;
   font-size: 13px;
   color: #999FAE;
   margin: 0 0 10px;
   line-height: 18px;
 }

`
export const DropdownItemTextCompany = styled.div`
 display: flex;
 align-self: center;
    flex-direction: column;
    margin: 0 10px;
 h4 {
   font-family: Lexend Regular;
   font-weight: 400;
   font-size: 16px;
line-height: 20px;
   margin: 0 ;
 }

 span {
   font-family: Lexend Light;
   font-weight: 300;
   font-size: 13px;
   color: #999FAE;
   margin: 0 0 10px;
   line-height: 18px;
 }

`
export const DropdownItemImg = styled.div`
display:block;
width: 48px;
height: 48px;
margin-right: 4px; 
text-align: center;
line-height: 48px;
align-self: center;
@media (max-width: ${props => props.theme.screen.md}) {
}
`
export const DropdownItemImgHover = styled.div`
display:none;
width: 48px;
height: 48px;
margin-right: 4px;
text-align: center;
line-height: 48px;
align-self: center;
`

export const DropdownButton = styled.button`
border: none;
outline: none;
display: flex;
gap:8px;
background-color: inherit;
color: var(--Black, #1C1C1F);
font-family: Lexend Medium;
font-size: 16px;
font-style: normal;
font-weight: 500;
line-height: 24px;
// margin: 0 0 2px 0; 
border-radius: 23.5px;
transition: all 0.3s ease-in-out;
&:hover {
  font-family: 'Lexend Medium';
font-style: normal;
font-weight: 500;
color: #2D2828;
 transition:all 0.3s ease-in-out;
}
&.active {
  p{
    font-family: 'Lexend Medium';
font-style: normal;
font-weight: 500;
  color: #2D2828;
  }
}
&:focus-visible {
  font-family: 'Lexend Medium';
font-style: normal;
font-weight: 500;
color: #2D2828;
}
`

// Background blur info
// background-color: ${props => props.scrolled && `rgba(245, 245, 250, .8`};
// box-shadow:  ${props =>
//   props.scrolled &&
//   `0 0 0 1px rgba(0,0,50,.02) inset, 0 1px 1px rgba(0,0,50,.05) inset, 0 2px 4px rgba(0,0,50,.04) inset`};
//   backdrop-filter: ${props => props.scrolled && `blur(15px)`};