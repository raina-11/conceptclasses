import React, { act } from "react"
import { screen } from "@testing-library/react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "styled-components"
import theme from "../../../styles-v2/theme"
import Navigation from "./navigation"
import {
  DEFAULT_STUDENT_PORTAL_URL,
  resolveStudentPortalUrl,
} from "./studentPortalUrl"

jest.mock("../new-navigation/platform-nav", () => () => <div>Results</div>)
jest.mock("../new-navigation/solutions-nav", () => () => <div>Courses</div>)
jest.mock("../schedule-visit", () => () => <div>Schedule form</div>)
jest.mock("../../../hooks/useFirestore", () => ({
  useCourses: () => ({ courses: [] }),
}))

const mountedRoots = []

function renderNavigation() {
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)
  mountedRoots.push({ container, root })

  act(() => {
    root.render(
      <ThemeProvider theme={theme}>
        <Navigation />
      </ThemeProvider>,
    )
  })
}

afterEach(() => {
  while (mountedRoots.length > 0) {
    const { container, root } = mountedRoots.pop()
    act(() => root.unmount())
    container.remove()
  }
})

describe("student portal navigation", () => {
  it("links the desktop Student Login action to the safe default portal", () => {
    renderNavigation()

    expect(screen.getByRole("link", { name: "Student Login" })).toHaveAttribute(
      "href",
      DEFAULT_STUDENT_PORTAL_URL,
    )
  })

  it("adds the same accessible action to the opened mobile menu", () => {
    renderNavigation()

    act(() => screen.getByLabelText("Open menu").click())

    const loginLinks = screen.getAllByRole("link", {
      name: "Student Login",
      hidden: true,
    })
    expect(loginLinks).toHaveLength(2)
    expect(loginLinks[1]).toHaveAttribute("href", DEFAULT_STUDENT_PORTAL_URL)
  })

  it("accepts an HTTPS environment override and rejects unsafe URLs", () => {
    expect(resolveStudentPortalUrl("https://portal.example.org/sign-in")).toBe(
      "https://portal.example.org/sign-in",
    )
    expect(resolveStudentPortalUrl("http://portal.example.org")).toBe(
      DEFAULT_STUDENT_PORTAL_URL,
    )
    expect(resolveStudentPortalUrl("not a url")).toBe(DEFAULT_STUDENT_PORTAL_URL)
  })
})
