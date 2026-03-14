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

const StickyCallButton = styled.a`
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 9999;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #005B38;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 91, 56, 0.4);
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 91, 56, 0.55);
  }
  svg {
    width: 26px;
    height: 26px;
    fill: #fff;
  }
`

const Layout = ({ children }) => (
  <ThemeProvider theme={theme}>
    <>
      <GlobalStyles />
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      {children}
      <StickyCallButton href="tel:9928111865" aria-label="Call us">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V21a1 1 0 01-1 1C10.56 22 2 13.44 2 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z"/>
        </svg>
      </StickyCallButton>
    </>
  </ThemeProvider>
)

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
