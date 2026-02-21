import React from "react"
import PropTypes from "prop-types"
import styled, { ThemeProvider } from "styled-components"

import theme from "../../../styles-v2/theme"
import GlobalStyles from "../../../styles-v2/GlobalStyles"
import "../../../static/fonts/fonts.css"

const SkipLink = styled.a`
  position: absolute;
  top: -40px;
  left: 0;
  background: #005B38;
  color: #fff;
  padding: 8px 16px;
  z-index: 10000;
  font-family: 'Lexend Medium', sans-serif;
  text-decoration: none;
  &:focus {
    top: 0;
  }
`

const Layout = ({ children }) => (
  <ThemeProvider theme={theme}>
    <>
      <GlobalStyles />
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      {children}
    </>
  </ThemeProvider>
)

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
