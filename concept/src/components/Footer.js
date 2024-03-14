import { MegaMenu } from 'primereact/megamenu';
import React, { useState } from 'react';
import styled from "styled-components"
import { AppstoreOutlined, MailOutlined, SettingOutlined } from '@ant-design/icons';
import { Section } from './style';
import logo from "../images/concept-logo.png"
const Footer= () =>  {
    
  return (
<Section style={{background:'#005B38'}}>
    <Grid>
    <Logo>
        <div>
        <img src={logo}/>
        </div>
        <h5>
        Concept Classes, Polytechnic College Road
Patel Nagar, Bikaner
        </h5>
    </Logo>

    </Grid>
</Section>
  );
}

export default Footer;
const Grid = styled.div`
display:grid;
grid-templaye-columns:1fr 3fr;
padding:40px;
`
const Logo = styled.div`
display:flex;
flex-direction:column;
img{
    
}
`