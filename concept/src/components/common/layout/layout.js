import React from "react"
import PropTypes from "prop-types"
import { ThemeProvider } from "styled-components"

import theme from "../../../styles-v2/theme"
import GlobalStyles from "../../../styles-v2/GlobalStyles"
import "../../../static/fonts/fonts.css"

const Layout = ({ children }) => (
  <ThemeProvider theme={theme}>
    <>
 
      <GlobalStyles />
      {children}
    </>
  </ThemeProvider>
)

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
