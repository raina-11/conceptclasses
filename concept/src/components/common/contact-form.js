import React,{useRef, useState} from "react"
import styled from "styled-components"
import { Container, Section } from "../style"
import emailjs from '@emailjs/browser';
import rocket from "../../images/rocket.svg"
import "./form.css"
const Form = () => {
    const form = useRef();
    const [formSubmitted, setFormSubmitted] = useState(false);
  
    const sendEmail = (e) => {
      e.preventDefault();
  
      const phoneInput = form.current.querySelector('input[name="phone"]');
      const phoneNumber = phoneInput.value.trim();
      if (!/^\d{10}$/.test(phoneNumber)) {
        alert('Please enter a 10-digit numeric phone number.');
        return; // Exit the function without submitting the form
      }
      emailjs.sendForm('service_0g4tl74', 'template_2wlqzie', form.current, 'dqwWONHaCR01qcthz')
        .then((result) => {
            console.log(result.text);
        }, (error) => {
            console.log(error.text);
        });
        setFormSubmitted(true);
    };
  
    const handleSubmit = () => {
      // setFormSubmitted(true);
    };
  
   
      return (
        <>
    
       <Section style={{background:'transparent'}}>
        <Container style={{position:'relative'}}>

       <Text>
<h2 >Get in touch <img src={rocket} alt="grow"/> </h2>
       </Text>
        <StyledForm isHidden={formSubmitted} ref={form} onSubmit={sendEmail}>
        <label>Student's Name</label>
        <input type="text" name="from_name" />
        <label>Class</label>
        <input type="text" name="class" />
        <label>Phone no.</label>
        <input type="tel" pattern="[0-9]{10}" name="phone" />
        <label>Location</label>
    <select name="location" id="product" >
        <option value="Bikaner" >Bikaner</option>
  <option value="Hanumangarh">Hanumangarh</option>
  <option value="Nagaur">Nagaur</option>
  <option value="Suratgarh">Suratgarh</option>
  </select>
        <label>Message</label>
        <input name="message" />
        <Submit type="submit" value="Send" onClick={handleSubmit} />
      </StyledForm>
      
      {formSubmitted && <Animation class="canvas"><div class="notepad">
      <div class="cover">
      </div>
      <div class="page one">
        <p>Thank<br />you!</p>
      </div>
      <div class="page two"></div>
      <div class="page three"></div>
      <div class="page four"></div>
    </div>
    <div class="pencil">
      <div class="edge"></div>
    </div></Animation>}
  
          {/* </Form> */}
        </Container>
       </Section>
       </>
      );
}
export default Form
const StyledForm = styled.form`
display:flex;
flex-direction:column;
gap:16px;
max-width:400px;
margin:0px auto;
padding:32px 40px;
background:#005B38;
border-radius:24px;
border:2px solid #005B38;
// display: ${(props) => (props.isHidden ? 'none' : 'flex')};
opacity: ${(props) => (props.isHidden ? 0 : 1)};
label{
  margin-bottom:-8px;
  margin-left: 6px;
  color:#fff;
  font-family:Lexend Medium;

}
input, textarea{
  border-radius: 16px;
    min-height: 40px;
    border:1.5px solid black;
    padding: 0px 16px;
}
`
const Submit = styled.input`
padding:16px !important;
width:fit-content;
cursor:pointer;
margin:0px auto;
margin-top:20px;
border-radius:100px;
background:black;
min-width:150px;
color:#fff;
`
const Animation = styled.div`
// display: ${(props) => (props.isHidden ? 'block' : 'none')};
position:absolute;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    padding-bottom: 40px;
    top:50%;
`
const Text = styled.div`
text-align:center;
h2{
  font-weight: 400;
  position:relative;
margin-top:0px;
  span{

   background-image: url("data:image/svg+xml,%3Csvg width='357' height='8' viewBox='0 0 357 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath opacity='0.9' d='M354.954 1.86291C354.828 1.71048 353.969 1.63144 353.047 1.68225C339.276 2.49654 325.223 2.91291 311.125 2.92431C309.427 2.92431 307.75 2.88479 306.136 2.83962C305.318 2.83962 304.501 2.8001 303.704 2.76623L302.531 2.72106L301.587 2.6759C301.134 2.66448 300.678 2.66448 300.225 2.6759L294.712 2.63638L289.262 2.55734C282.094 2.46701 274.925 2.30892 267.694 2.12826C253.23 1.76129 238.348 1.28705 223.298 1.19672C215.696 1.15186 208.091 1.21405 200.514 1.38302L197.684 1.45642H196.971C196.803 1.45642 196.971 1.45642 196.971 1.45642H196.007L190.473 1.40561L179.427 1.33221C120.464 0.982178 61.7309 1.58063 3.3545 1.41125C2.41126 1.41125 1.61474 1.52417 1.57282 1.67096L0.168432 5.34068C0.162848 5.3859 0.207819 5.43053 0.297517 5.46878C0.387215 5.50703 0.517503 5.53715 0.671496 5.55522C1.10672 5.62007 1.59992 5.65132 2.09684 5.64555C24.0849 5.58345 48.211 5.40843 73.993 5.19954C99.775 4.99065 127.59 4.75917 157.208 4.69707C164.607 4.69707 172.09 4.69707 179.699 4.69707L191.186 4.73094H197.202L203.322 4.59545C219.17 4.26812 235.096 4.32859 250.904 4.77611C259.12 4.95677 267.505 5.16566 276.057 5.34068C280.333 5.41972 284.63 5.47994 288.948 5.52134L295.467 5.56651H298.758H300.162L301.566 5.62297C310.567 5.88197 319.649 5.85544 328.627 5.54393C337.648 5.26742 346.61 4.86604 355.478 4.34139C355.915 4.32114 356.321 4.26833 356.652 4.18895C356.78 4.1634 356.879 4.12874 356.939 4.08886C356.998 4.04898 357.015 4.00544 356.987 3.96312L354.954 1.86291Z' fill='%23FF5757'/%3E%3Cpath opacity='0.72' d='M354.07 0.1691C354.07 0.0844137 353.734 0.0279564 353.294 0.00537347C352.802 -0.0105101 352.303 0.00896829 351.848 0.0618308C345.186 0.767428 338.254 1.27295 331.18 1.56924C324.154 1.88757 317.008 1.971 309.905 1.81765C308.144 1.77813 306.447 1.71038 304.749 1.63134L303.47 1.5636L301.646 1.45068C301.245 1.41961 300.826 1.40813 300.41 1.41681H299.257H297.853C294.08 1.45068 290.307 1.47326 286.555 1.4902C279.009 1.4902 271.484 1.4902 263.959 1.4902C248.909 1.42245 233.859 1.27566 218.871 1.24179C211.388 1.24179 203.863 1.24179 196.464 1.30954L174.308 1.38858C144.816 1.45068 115.618 1.38858 86.964 1.60312C58.7735 1.71961 30.6287 2.25678 2.65888 3.21215C1.5689 3.25167 0.793347 3.39846 0.898152 3.55089C1.00296 3.70333 1.92524 3.79366 2.99425 3.76543C30.3213 3.12292 57.7579 2.88168 85.1823 3.04278C112.683 3.13311 140.226 3.44927 167.831 3.68639L188.646 3.84447C192.062 3.84447 195.647 3.88964 199.126 3.89528C202.606 3.90093 205.897 3.89528 209.292 3.94609C222.833 4.06465 236.542 4.31871 250.208 4.54454C263.875 4.77037 277.751 4.98491 291.648 5.04701H296.867H299.571L300.053 5.08653C303.764 5.33849 307.541 5.51215 311.351 5.60594C318.652 5.78566 326.003 5.75159 333.277 5.50431C340.492 5.26978 347.608 4.85202 354.531 4.25661C355.621 4.16063 356.417 3.96868 356.334 3.82189C355.789 2.58547 354.992 1.36599 354.07 0.1691Z' fill='%23FF5757'/%3E%3Cpath opacity='0.62' d='M2.61803 5.71867C2.837 5.78311 3.11455 5.83106 3.42332 5.85779C3.73209 5.88452 4.06139 5.88911 4.37875 5.8711C37.8332 5.09169 71.4305 4.85038 104.992 5.14845C134.882 5.3517 160.853 5.71302 182.212 5.96708L231.68 6.50343C243.041 6.62199 249.078 6.70667 249.078 6.7349C249.078 6.76313 243.544 6.7349 232.854 6.65021C222.164 6.56553 206.233 6.4752 185.503 6.26631C164.772 6.05741 139.158 5.7469 109.205 5.56059C74.9787 5.26977 40.7188 5.5186 6.60062 6.30583C6.09182 6.31663 5.60821 6.36991 5.21719 6.45826C5.07143 6.4876 4.97285 6.53085 4.94168 6.57913C4.9105 6.62742 4.94908 6.67709 5.04951 6.71796L5.72026 6.9946C5.94489 7.05862 6.22626 7.10619 6.53794 7.13286C6.84961 7.15953 7.18134 7.1644 7.50194 7.14704C37.3499 6.36775 67.3348 6.03226 97.3199 6.1421C126.917 6.18726 156.011 6.48649 184.79 6.70667C213.57 6.92686 241.72 7.01154 269.179 7.27125C276.054 7.33335 282.888 7.40674 289.658 7.50272L299.489 7.65516H299.74L300.285 7.68903C300.767 7.7229 301.271 7.75113 301.753 7.77372C302.717 7.81888 303.66 7.85276 304.582 7.88098C306.427 7.94309 308.23 7.97132 310.011 7.98825C316.947 8.03376 323.886 7.95644 330.784 7.75678C337.606 7.57742 344.377 7.27755 351.053 6.85911C351.379 6.84442 351.688 6.80914 351.954 6.75615C352.22 6.70316 352.435 6.63397 352.583 6.55424C353.582 5.5862 354.138 4.58893 354.239 3.58458C354.233 3.53859 354.179 3.494 354.082 3.45601C353.986 3.41803 353.851 3.38821 353.694 3.37005C353.295 3.33027 352.856 3.33027 352.457 3.37005C349.29 3.63944 346.063 3.85441 342.794 4.01366C339.378 4.18868 335.877 4.32982 332.314 4.44273C325.362 4.67962 318.359 4.78902 311.353 4.77019C309.655 4.77019 307.978 4.73631 306.406 4.69679L304.142 4.61775C303.283 4.58388 303.346 4.56129 301.145 4.44838L289.553 4.27336C282.154 4.17739 274.755 4.10399 267.356 4.04189C237.738 3.8217 208.371 3.77654 178.921 3.52813C120.105 3.0934 60.6591 2.47237 1.65382 4.29595C1.14502 4.30675 0.661413 4.36003 0.270395 4.44838C0.134042 4.47829 0.0421052 4.52039 0.0113271 4.56702C-0.0194509 4.61365 0.0129775 4.66171 0.102707 4.70244L2.61803 5.71867Z' fill='%23FF5757'/%3E%3C/svg%3E%0A");
    background-repeat:no-repeat;
    background-position:bottom;
  }
}
img{
  position:absolute;
}
@media (max-width: ${(props) => props.theme.screen.sm}) {
img{
  width:40px;
}
}
@media (max-width: ${(props) => props.theme.screen.xs}) {
h2{
  font-size:24px;
}
}
`