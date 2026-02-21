import styled from "styled-components"

export const Container = styled.div`
max-width: 1300px;
width: 100%;
margin: 0 auto;
padding: 0 40px 0 40px;

@media (min-width:1199px) {
  max-width: 1300px;
}
@media (max-width: 991px) {
  max-width: 960px;
}
@media (max-width: 767px) {
  max-width: 720px;
  padding:0px 20px;
}

${props =>
  props.fluid &&
  `
  max-width: 1200px !important;
`};
`
export const Section = styled.section`
padding: 60px 0;
overflow: hidden;
background-color: white;
@media (max-width: 500px) {
padding-bottom:40px;
}
`
export const PrimaryButton = styled.button`
background: #1C1C1F;
border-radius: 100px;
height:56px;
min-width: 164px;
padding:16px 32px;
font-family: 'Lexend Medium';
font-style: normal;
font-size: 15px;
line-height: 22px;
text-align: center;
align-items: center;
color: #FFFFFF;
border: 2px solid #1C1C1F;
  box-shadow: inset 0 0 0 0 #1C1C1F;
    -webkit-transition: ease-out 0.5s;
    -moz-transition: ease-out 0.5s;
    transition: ease-out 0.5s;
    &:hover {
      box-shadow: inset 260px 0 0 0 #fff;
      color: #1C1C1F;
  }
  @media (max-width: 545px){
    padding: 16px 20px;

  }
`
export const SecondaryButton = styled.button`
background: #FFFFFF;
border-radius: 100px;
height:56px;
min-width: 164px;   
padding:16px 32px;
font-family: 'Lexend Semibold';
font-style: normal;
font-weight: 600;
font-size: 16px;
line-height: 22px;
text-align: center;
color: #1C1C1F;
border: 2px solid #1C1C1F;
  box-shadow: inset 0 0 0 0 #FFFFFF;
    -webkit-transition: ease-out 0.6s;
    -moz-transition: ease-out 0.6s;
    transition: ease-out 0.6s;
    &:hover {
      box-shadow: inset 300px 0 0 0 #1C1C1F;
      border: 2px solid #FFFFFF;
      color: #FFFFFF;
  }
`