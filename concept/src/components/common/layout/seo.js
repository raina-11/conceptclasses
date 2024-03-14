// import React from "react"
// import PropTypes from "prop-types"
// import Helmet from "react-helmet"
// import { useLocation } from '@reach/router';
// import FontUrl1 from "../../../static/fonts/lexend-v5-latin-regular.woff2"
// import FontUrl2 from "../../../static/fonts/lexend-v5-latin-500.woff2"
// import FontUrl3 from "../../../static/fonts/lexend-v5-latin-600.woff2"

// const SEO = ({ description, lang, meta, title, url }) => {
 
//   const location = useLocation();
//   const metaDescription = description || site.siteMetadata.description
//   const metaUrl = url || site.siteMetadata.siteUrl
//   const metaImage = site.siteMetadata.image
//   return (
//     <Helmet
//       htmlAttributes={{
//         lang,
//       }}
//       title={title}
//       titleTemplate={`${title} | ${site.siteMetadata.title}`}
//       meta={[
//         {
//           name: `description`,
//           content: metaDescription,
//         },
//         {
//           property: `og:title`,
//           content: title,
//         },
//         {
//           property: `og:description`,
//           content: metaDescription,
//         },
//         {
//           property: `og:image`,
//           content: metaImage,
//         },
//         {
//           property: `og:url`,
//           content: `${site.siteMetadata.siteUrl}${location.pathname}`,
//         },
//         {
//           property: `og:type`,
//           content: `website`,
//         },
//         {
//           name: `twitter:card`,
//           content: `summary`,
//         },
//         {
//           name: `twitter:creator`,
//           content: site.siteMetadata.author,
//         },
//         {
//           name: `twitter:title`,
//           content: title,
//         },
//         {
//           name: `twitter:description`,
//           content: metaDescription,
//         },
//         {
//           name: `referrer`,
//           content: `${location.pathname=="/get-demo/" ? "strict-origin-when-cross-origin" :"same-origin" }`,
//         },
//       ].concat(meta)}
//     >
//       <link rel="preload"
//             as="font"
//             href={FontUrl1}
//             type="font/woff2"
//             crossOrigin="anonymous" />
//       <link rel="preload"
//             as="font"
//             href={FontUrl2}
//             type="font/woff2"
//             crossOrigin="anonymous" />
//       <link rel="preload"
//             as="font"
//             href={FontUrl3}
//             type="font/woff2"
//             crossOrigin="anonymous" />
//     </Helmet>
//   )
// }

// SEO.defaultProps = {
//   lang: `en`,
//   meta: [],
//   description: ``,
// }

// SEO.propTypes = {
//   description: PropTypes.string,
//   lang: PropTypes.string,
//   meta: PropTypes.arrayOf(PropTypes.object),
//   title: PropTypes.string.isRequired,
// }

// export default SEO
