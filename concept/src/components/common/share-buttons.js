// import React from 'react'
// import styled from "styled-components"
// import {
//   FacebookShareButton,
//   FacebookIcon,
//   InstapaperShareButton,
//   InstapaperIcon,
//   LinkedinShareButton,
//   LinkedinIcon,
//   TwitterShareButton,
//   TwitterIcon,
// } from 'react-share'
// import twitterIconNew from "../../images/product/twitter-share-icon-grey.png"

// const ShareButtonsV2 = ({title, url, twitterHandle}) => {

//     return(
//         <Social>
//         <SocialWrap>
//           <FacebookShareButton url={url} >
//                 <FacebookIcon  size={40} round={true} bgStyle={{fill:"#F4F4F4"}} iconFillColor='#000000' />
//          </FacebookShareButton>

//           <TwitterShareButton url={url} title={title} via={twitterHandle} >
//                 {/* <TwitterIcon  size={40} round={true} bgStyle="none" iconFillColor='#000000' /> */}
//                 <Icon src = {twitterIconNew} alt = "twitter" />
//           </TwitterShareButton>
//           <a href={"https://www.linkedin.com/sharing/share-offsite/?url="+url} rel= "noreferer, ,noopener" target="_blank">
//             <LinkedinIcon  size={40} round={true} bgStyle={{fill:"#F4F4F4"}} iconFillColor='#000000'/>
//           </a>
          

//         </SocialWrap>
//         </Social>
//       )
// }
// export default ShareButtonsV2

// const Social = styled.div`
// align-self: center;
// `
// const SocialTitle = styled.h5`
// text-align: center;
// `
// const SocialWrap = styled.div`
// display: flex;
// gap:12px;
// justify-content: left;
// margin: auto;
// position: relative;

// `
// const Icon = styled.img`
// width:40px !important;
// height:40px !important;
// border-radius:50%
// `