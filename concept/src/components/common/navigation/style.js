import styled from "styled-components"
import Popup from 'reactjs-popup';
// import line from "../../../images/product/designs/new-underline.png"
import { Container } from "../../style";
// import { Container } from "../../global-v2";


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
display:${props => (props.banner ? `block` : `none`)};
font-family: Lexend Medium;
font-size: 16px;
color: #fff;
  // display: ${props => (props.scrolled ? `none` : `block`)};
  height: ${props => (props.scrolled ? `0` : `inherit`)};
  padding: ${props => (props.scrolled ? `0` : `16px 32px`)};

  overflow:hidden;

  transition: all 0.3s, border 0.3s;
  text-align: center;
  margin: ${props => (props.scrolled ? `-12px -20px 12px` : `-24px -20px 12px`)};
  background-color: #1C1C1F;
  
  // @media (max-width: ${props => props.theme.screen.sm}) {
  //   padding: 11px 30px;
  // }
  span{
    font-family:Lexend Regular;
    font-weight:400;
  }
  a {
    text-decoration: underline;
    // font-family: Lexend Medium;
    // font-size: 19px;
    color: #fff;
    padding-left: 8px;
  }
  @media (max-width: ${props => props.theme.screen.xs}) {
margin: 0px;
font-size:14px;
span{
  font-size:13px;
}
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
  padding: 8px;
  // position: ${props => (props.scrolled ? 'fixed' :'sticky')};
  position: fixed;
  // position:sticky;
  width: 100%;
  top: 0;
  z-index: 999;

  transition:position 0.3s ease-in-out 0s;
  &:hover{
    background: transparent;
    // transition:0.3s ease-in-out 0s;
  transition:all 0.3s ease-in-out 0s;

  }
  @media (max-width: ${props => props.theme.screen.xs}){
padding:12px 0px;
  }
`
export const StyledContainer = styled(Container)`
  display: flex;
  // filter: ${props => (props.scrolled ? 'drop-shadow(0 3px 70px #00000026)' : '')};
  filter:drop-shadow(0 3px 70px #00000026);
   border: 1px solid transparent;
  justify-content: space-between;
  align-items: center;
  border-radius: 100px;
  border:  1px solid #ABABB0 ;
padding:12px;
padding-left:32px;
background: ${(props) =>props.bgwhite?'rgba(255, 255, 255, 0.80)': 'rgba(255, 255, 255, 0.80)'};
  transition: background 0.3s, border 0.3s;
backdrop-filter: blur(20px);
@media (max-width: ${props => props.theme.screen.md})  {
  padding:8px 16px;
}
&:hover{
  border: 1px solid #ABABB0;
  background: rgba(255, 255, 255, 0.80);
  transition:0.3s ease-in-out 0s;
}
`

export const NavListWrapper = styled.div`
  display: flex;
  gap:28px;
  align-items: center;
  @media (max-width: ${props => props.theme.screen.lg})  {
    // gap: 18px;
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
  flex-direction: column;
  align-items:center;
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

export const NavItem = styled.div`
font-family: 'Lexend Medium';
font-style: normal;
font-weight: 500;
font-size: 16px;
line-height: 160%;
// height: 41px;
text-align: center;
color: #000000;
margin: 0 -3.5px;
// padding: 8px 14px;
 text-decoration:none; 
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
export const NavItemMobile = styled.div`
  margin: 0 0.75em;
  padding: 15px 0;
  font-family: ${props => props.theme.font.medium};
  ${props => props.theme.font_size.xsmall};
  color:#000;
  font-size: 20px;
  line-height: 24px;
  
  a {
    text-decoration: none;
    opacity: 0.9;
    color:#000;
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
    width: 90%;
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
  height: 90vh;
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
  img{
    height:65px;
  }
  @media (max-width: ${props => props.theme.screen.md}) {
    padding-bottom: 0;
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
  @media (max-width: ${props => props.theme.screen.sm}) {
    img{
      height:40px;
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
@media (max-width: ${props => props.theme.screen.lg}) {
  padding-left:0;
}
  @media (max-width: 1024px) {
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
transition: all 0.3s ease-in-out 0s;
&:hover {
  button{
    font-family: 'Lexend Medium';
    font-style: normal;
    font-weight: 500;
color: #2D2828;
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
    color: #2D2828;
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
  color: #2D2828;
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
// top:80px;
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
    // margin-left: -20px;
    // margin-right: 20px;
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
  

  a {
    float: none;
    color: black;
    padding: 8px 10px 8px 0px;
    text-decoration: none;
    display: block;
    text-align: left;
    // margin-left: -20px;
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
 h4 {
  font-family: 'Lexend Regular';
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 160%;
  color: #2B303C;
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
   margin:0;
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
display:flex;
width: 25px;
height: 25px;
margin-right: 4px; 
text-align: center;
line-height: 25px;
align-self: center;
svg{
  width:25px;
  height:25px;
}
@media (max-width: ${props => props.theme.screen.md}) {
}
`
export const DropdownItemImgHover = styled.div`
display:none;
width: 48px;
height: 48px;
margin-right: 4px;
border-radius: 50%;
background-color: #297FFD;    
text-align: center;
line-height: 48px;
align-self: center;
`

export const DropdownButton = styled.button`
border: none;
outline: none;
background-color: inherit;
font-family: 'Lexend Medium';
font-style: normal;
font-weight: 500;
font-size: 16px;
line-height: 160%;
color: #000000; 
// padding:8px 14px ;
// margin: 0px !important; 
border-radius: 23.5px;

&:hover {
  font-family: 'Lexend Medium';
font-style: normal;
font-weight: 500;
color: #2D2828;
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