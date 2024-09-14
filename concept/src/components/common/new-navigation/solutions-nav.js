import React from "react"
import styled from "styled-components"
import {
  Dropdown,
  DropdownButton,
  DropdownItem
} from "./style"
import { HashLink } from 'react-router-hash-link';

const Solutions = () => {


  return (
    <DropdownContainer>
    <Dropdown>
      <DropdownButton id="solutions">
       Courses
       <DropdownIcon>
       <svg xmlns="http://www.w3.org/2000/svg" width="13" height="8" viewBox="0 0 13 8" fill="none">
  <path d="M0.664751 0.675735C0.884419 0.441422 1.24058 0.441422 1.46025 0.675735L6.50001 6.05146L11.5398 0.675735C11.7595 0.441422 12.1156 0.441422 12.3352 0.675735C12.5549 0.910047 12.5549 1.28995 12.3352 1.52426L6.89773 7.32426C6.67806 7.55858 6.32196 7.55858 6.10228 7.32426L0.664751 1.52426C0.445083 1.28995 0.445083 0.910047 0.664751 0.675735Z" fill="#1C1C1F"/>
</svg>
       </DropdownIcon>
      </DropdownButton>
      <PositionDiv >
        <DropdownContent id="dropdown">
          <DropdownWidth>
            <StyledContainer>
              {/* <h2>Use Cases</h2> */}
              <Flex>
                <FlexContainer>
                <h2>Courses</h2>
              <DropdownRowSolutions id="lineBottom">
                <DropdownColumnPlatform1>
                 <a href="/engineering">
                  <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                    <div>
                    <svg fill="#005B38" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
	 width="40px" height="40px" viewBox="0 0 31.653 31.653"
	 xmlSpace="preserve">
<g>
	<path d="M27.614,0c-1.146,0-2.076,0.93-2.076,2.076v3.011h-8.603v-1.46c0-0.479-0.389-0.868-0.868-0.868h-2.051
		c-0.479,0-0.868,0.389-0.868,0.868v1.46H11.85v-1.46c0-0.479-0.389-0.868-0.868-0.868H8.93c-0.48,0-0.868,0.389-0.868,0.868v1.46
		H6.167V2.076C6.167,0.929,5.238,0,4.091,0H3.594C2.206,0,1.082,1.125,1.082,2.512v27.065c0,1.146,0.929,2.076,2.076,2.076h0.934
		c1.146,0,2.076-0.931,2.076-2.076v-2.522h14.123v1.404c0,0.479,0.389,0.868,0.868,0.868h2.051c0.479,0,0.868-0.39,0.868-0.868
		v-1.404h1.46v2.522c0,1.146,0.929,2.076,2.076,2.076h0.881c1.146,0,2.076-0.931,2.076-2.076V2.076C30.571,0.929,29.643,0,28.495,0
		H27.614z M8.061,7.574v1.46c0,0.479,0.389,0.868,0.868,0.868h2.052c0.479,0,0.868-0.389,0.868-0.868v-1.46h1.299v1.46
		c0,0.479,0.389,0.868,0.868,0.868h2.051c0.479,0,0.868-0.389,0.868-0.868v-1.46h8.604v7.251h-1.461v-1.674
		c0-0.479-0.389-0.868-0.868-0.868h-2.052c-0.479,0-0.868,0.389-0.868,0.868v1.674h-1.298v-1.674c0-0.479-0.389-0.868-0.868-0.868
		h-2.051c-0.479,0-0.868,0.389-0.868,0.868v1.674h-1.84v-1.674c0-0.479-0.389-0.868-0.868-0.868h-2.051
		c-0.479,0-0.868,0.389-0.868,0.868v1.674H6.167V7.574H8.061z M24.077,24.512v-1.402c0-0.479-0.39-0.868-0.868-0.868h-2.052
		c-0.479,0-0.868,0.39-0.868,0.868v1.402H6.166v-7.197h3.41v1.188c0,0.479,0.389,0.868,0.868,0.868h2.051
		c0.48,0,0.868-0.389,0.868-0.868v-1.188h1.84v1.188c0,0.479,0.389,0.868,0.868,0.868h2.051c0.479,0,0.868-0.389,0.868-0.868v-1.188
		h1.298v1.188c0,0.479,0.39,0.868,0.868,0.868h2.052c0.479,0,0.868-0.389,0.868-0.868v-1.188h1.461v7.197H24.077L24.077,24.512z"/>
</g>
</svg>
                    </div>
                    <h5>IIT JEE</h5>
                  </div>
                  </a>
                  <a href="/engineering/" style={{ textDecoration: "none" }} rel="noopener" target="_blank">
                    <DropdownItem>
                    {/* <DropdownItemImg id="defaultImage">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="24" height="24" rx="12" fill="#F3F3F3"/>
<path d="M10.5 15C11.5625 15 12.539 14.6318 13.3089 14.016L17.1464 17.8536C17.3417 18.0488 17.6583 18.0488 17.8536 17.8536C18.0488 17.6583 18.0488 17.3417 17.8536 17.1464L14.016 13.3088C14.6318 12.539 15 11.5625 15 10.5C15 8.01473 12.9853 6 10.5 6C8.01472 6 6 8.01473 6 10.5C6 12.9853 8.01472 15 10.5 15ZM10.5 7C12.433 7 14 8.56701 14 10.5C14 12.433 12.433 14 10.5 14C8.567 14 7 12.433 7 10.5C7 8.56701 8.567 7 10.5 7Z" fill="#242424"/>
</svg>

                    </DropdownItemImg>
                    <DropdownItemImgHover id="hoverImage">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="24" height="24" rx="12" fill="#1C1C1F"/>
<path d="M10.5 15C11.5625 15 12.539 14.6318 13.3089 14.016L17.1464 17.8536C17.3417 18.0488 17.6583 18.0488 17.8536 17.8536C18.0488 17.6583 18.0488 17.3417 17.8536 17.1464L14.016 13.3088C14.6318 12.539 15 11.5625 15 10.5C15 8.01473 12.9853 6 10.5 6C8.01472 6 6 8.01473 6 10.5C6 12.9853 8.01472 15 10.5 15ZM10.5 7C12.433 7 14 8.56701 14 10.5C14 12.433 12.433 14 10.5 14C8.567 14 7 12.433 7 10.5C7 8.56701 8.567 7 10.5 7Z" fill="white"/>
</svg>

                    </DropdownItemImgHover> */}
                    <DropdownItemText>
                      <h4 >11th + IIT Mains & Advanced (Early Lead)</h4>
                    </DropdownItemText>
                  </DropdownItem></a>
                 
                  <a href="/engineering/" style={{ textDecoration: "none" }} rel="noopener" target="_blank"><DropdownItem>
                   
                    <DropdownItemText>
                      <h4>12th + IIT Mains & Advanced (Flight)</h4>
                    </DropdownItemText>
                  </DropdownItem></a>
                  <a href="/engineering/" style={{ textDecoration: "none" }} rel="noopener" target="_blank"><DropdownItem>
                   
                    <DropdownItemText>
                      <h4>Target IIT Mains & Advanced (Eagle's Eye)</h4>
                    </DropdownItemText>
                  </DropdownItem></a>
                
                  <a href="/engineering/" style={{ textDecoration: "none" }} rel="noopener" target="_blank">
                    <DropdownItem>
                   
                    <DropdownItemText>
                      <h4 >12th + NCERT (Success Elevator)</h4>
                    </DropdownItemText>
                  </DropdownItem></a>

                </DropdownColumnPlatform1>
                <DropdownColumnPlatform1>
                  <a href='/medical'>
                <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                    <div >
                    <svg width="40px" height="40px" viewBox="0 0 1024 1024" class="icon"  version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M500.8 766.4c8 4.8 11.2 14.4 6.4 22.4s-14.4 11.2-22.4 6.4l-176-96c-8-4.8-11.2-14.4-6.4-22.4 4.8-8 14.4-11.2 22.4-6.4l176 96z" fill="#050D42" /><path d="M652.8 460.8v-32c57.6 0 86.4 89.6 64 188.8-22.4 96-134.4 179.2-224 179.2v-32c75.2 0 174.4-73.6 192-155.2 19.2-81.6-3.2-148.8-32-148.8zM316.8 908.8h352c9.6 0 16 6.4 16 16s-6.4 16-16 16h-352c-9.6 0-16-6.4-16-16s6.4-16 16-16z" fill="#050D42" /><path d="M652.8 94.4c46.4 27.2 62.4 84.8 35.2 131.2L528 502.4l-166.4-96 160-276.8c25.6-46.4 84.8-60.8 131.2-35.2z" fill="#005B38" /><path d="M336 428.8c-9.6-6.4-14.4-17.6-11.2-24s16-9.6 27.2-3.2l184 107.2c9.6 6.4 14.4 17.6 11.2 24-4.8 8-16 9.6-27.2 3.2L336 428.8z" fill="#050D42" /><path d="M358.4 443.2l139.2 80-24 41.6c-4.8 8-14.4 9.6-22.4 6.4l-110.4-64c-8-4.8-9.6-14.4-6.4-22.4l24-41.6z" fill="#005B38" /><path d="M652.8 444.8m-48 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0Z" fill="#005B38" /><path d="M476.8 828.8v96h32v-96z" fill="#050D42" /><path d="M492.8 780.8m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z" fill="#005B38" /></svg>
                    </div>
                    <h5>NEET / Aiims</h5>
                  </div>
                  </a>
                  <a href="/medical/" style={{ textDecoration: "none" }} rel="noopener" target="_blank"><DropdownItem>
                  
                    <DropdownItemText>
                      <h4>11th + NEET (Genesis)</h4>
                    </DropdownItemText>
                  </DropdownItem></a>
                  <a href="/medical/" style={{ textDecoration: "none" }} rel="noopener" target="_blank"><DropdownItem>
                   
                    <DropdownItemText>
                      <h4>12th + NEET (Orchid)</h4>
                    </DropdownItemText>
                  </DropdownItem></a>
                  <a href="/medical/" style={{ textDecoration: "none" }} rel="noopener" target="_blank"><DropdownItem>
                   
                    <DropdownItemText>
                      <h4>Target NEET/AIIMS (Synapse)</h4>
                    </DropdownItemText>
                  </DropdownItem></a>

                  <a href="/medical/" style={{ textDecoration: "none" }} rel="noopener" target="_blank">
                    <DropdownItem>
                    
                    <DropdownItemText>
                      <h4 >12th + NCERT (Success Elevator)</h4>
                    </DropdownItemText>
                  </DropdownItem></a>

                  <a href="/medical/" style={{ textDecoration: "none" }} rel="noopener" target="_blank">
                    <DropdownItem>
                    
                    <DropdownItemText>
                      <h4 >Crash Course NEET</h4>
                    </DropdownItemText>
                  </DropdownItem></a>
               
                 
                </DropdownColumnPlatform1>
                <DropdownColumnPlatform1>
                 <a href="/pre-foundation">
                  <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                    <div>
                    <svg fill="#005B38" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" 
	 width="40px" height="40px" viewBox="0 0 46.001 46.002"
	 xmlSpace="preserve">
<g>
	<path d="M23.006,0h-0.004C10.813,0,0.896,9.918,0.896,22.107c0,7.743,3.95,14.745,10.445,18.761l-1.097,1.967
		c-0.368,0.659-0.359,1.464,0.023,2.115c0.382,0.649,1.08,1.052,1.836,1.052h17.52c0.771,0,1.482-0.418,1.859-1.092l1.823-3.27
		c2.21-1.168,4.202-2.705,5.932-4.572c0.364-0.394,0.565-0.908,0.565-1.444v-6.623h2.591c0.981,0,1.835-0.67,2.067-1.623
		c0.431-1.751,0.646-3.522,0.646-5.271C45.108,9.918,35.193,0,23.006,0z M32.314,21.301h-2.936
		c-0.353,1.915-1.336,3.643-2.808,4.903v0.709c0,1.112-0.587,2.085-1.464,2.639v3.005c0,0.861-0.7,1.562-1.563,1.562h-5.083
		c-0.864,0-1.564-0.7-1.564-1.562v-3.005c-0.876-0.555-1.462-1.524-1.462-2.639v-0.709c-1.473-1.263-2.456-2.988-2.809-4.903H9.692
		c-0.864,0-1.564-0.7-1.564-1.564c0-0.863,0.7-1.563,1.564-1.563h2.934c0.223-1.188,0.689-2.29,1.351-3.25L11.9,12.848
		c-0.611-0.611-0.611-1.602,0-2.213c0.61-0.61,1.601-0.609,2.212,0l2.078,2.078c0.961-0.658,2.063-1.123,3.25-1.344V8.428
		c0-0.863,0.7-1.562,1.563-1.562s1.563,0.699,1.563,1.562v2.941c1.188,0.221,2.29,0.686,3.25,1.346l2.077-2.079
		c0.61-0.61,1.603-0.61,2.213-0.001c0.61,0.611,0.61,1.602,0,2.213l-2.077,2.078c0.66,0.959,1.127,2.061,1.35,3.248h2.936
		c0.863,0,1.562,0.7,1.562,1.563C33.876,20.601,33.177,21.301,32.314,21.301z M26.402,19.746c0,2.104-1.205,3.921-2.959,4.812v2.354
		h-4.881v-2.354c-1.755-0.894-2.959-2.709-2.959-4.812c0-2.982,2.417-5.399,5.4-5.399C23.984,14.347,26.402,16.764,26.402,19.746z"
		/>
</g>
</svg>
                    </div>
                    <h5>Pre foundation</h5>
                  </div>
                  </a>
             
                  <HashLink smooth to="/pre-foundation">
                    
                    <DropdownItem>
                  
                    <DropdownItemText>
                      <h4 >9th (Focus)</h4>
                    </DropdownItemText>
                  </DropdownItem>
                  {/* </Link> */}
                  </HashLink>
                  {/* </a> */}
                  <a href="/pre-foundation">

                    <DropdownItem>
                  
                    <DropdownItemText>
                      <h4 >10th (Laser)</h4>
                    </DropdownItemText>
                  </DropdownItem>
                  </a>             
               </DropdownColumnPlatform1>
              </DropdownRowSolutions>
              </FlexContainer>

             
              </Flex>
            </StyledContainer>
          </DropdownWidth>
        </DropdownContent>
      </PositionDiv>
    </Dropdown>
    </DropdownContainer>
  )
}

export default Solutions

const DropdownContent = styled.div`

display: none;
position: absolute;
// width:90vw;
z-index: 998;
transition: all 0.3s ease-in-out 0s;
padding-top: 44px;
box-shadow: 0 25px 30px -25px #343434;
`

const PositionDiv = styled.div`
position: absolute;
    left: 0px;
    top:52px;
`
const DropdownWidth = styled.div`
margin: auto;
padding: 20px 0px 10px;
border-radius: 26px;
border: 1px solid #ABABB0;
background: #fff;
width:max-content;
backdrop-filter: blur(30px);

h2{
  font-family: 'Lexend Semibold';
font-style: normal;
font-weight: 600;
font-size: 24px;
line-height: 40px;
color: #2B303C; 
margin-bottom:12px;
  }
  @media (max-width: 1111px) {
width:950px;
  }
`
const DropdownColumnPlatform1 = styled.div`
padding:0 10px;
display: flex;
gap:8px;
flex-direction: column;
transition: 0.3s ease-in-out 0s;

h5{
  color: #A2231F;
  font-family: Lexend Semibold;
  font-size: 19px;
  font-style: normal;
  font-weight: 600;
  line-height: 120%; /* 16.8px */
  text-transform: uppercase;
margin:0px;
}
  a {
    float: none;
    border-radius: 7px;
    color: black;
    padding: 12px 14px ;
    padding-right:0px;
    margin-left: -10px;
    text-decoration: none;
    display: block;
    text-align: left;
    transition: 0.3s ease-in-out 0s;
    &:hover #defaultImage{
      display: none;
      transition: 0.3s ease-in-out 0s;
    }
    &:hover #hoverImage{
      display: block;
      transition: 0.3s ease-in-out 0s;
    }
    &:hover #textColor{
      color:#000;
    }
  }

  a:hover {
      // color:#297FFD;
      background:#F8F8F8;
  }
  &.last {
    width:20vw;
  }
`
const DropdownRowSolutions = styled.div`
  display: grid;
   grid-template-columns: 1.3fr 1fr 0.8fr;
  grid-gap: 0px;
  margin-top:20px;
  margin-left:-10px;
  margin-bottom:35px;
  padding-bottom:15px;
  width: -webkit-fill-available;
  `

const DropdownItemText = styled.div`
 display: flex;
 align-self: center;
    flex-direction: column;
    margin: 0 10px;
 h4 {
  color: #2B303C;
font-family: Lexend Medium;
font-size: 18px;
font-style: normal;
font-weight: 500;
line-height: 160%; /* 28.8px */
   margin:0px;
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
const DropdownContainer = styled.div`
  float: left;
  &:hover ${DropdownContent} {
    transition: opacity 0.3s ease-in 0s; /* Added ease-in transition */
    opacity: 1;
  }
`;
const DropdownIcon = styled.div`

`
const Flex= styled.div`
display: flex;
flex-direction:row;
gap:40px;
`
const StyledContainer= styled.div`
max-width: 1300px;
width: 100%;
margin: 0 auto;
padding: 0 40px 0 40px;

@media (max-width:1199px) {
  max-width: 1100px;
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
const FlexContainer=styled.div`
display: flex;
flex-direction:column;
`
