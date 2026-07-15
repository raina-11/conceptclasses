import conceptLogo from '../../../src/images/logo-concept.png'

type PortalBrandProps = {
  login?: boolean
}

export function PortalBrand({ login = false }: PortalBrandProps) {
  return (
    <a
      className={`brand${login ? ' brand-login' : ''}`}
      href="https://conceptinstitute.co.in/"
      aria-label="Concept Institute home"
    >
      <img
        className="brand-logo"
        src={conceptLogo}
        width="1137"
        height="465"
        alt="Concept Institute"
        decoding="async"
      />
      <small>Student QPT Portal</small>
    </a>
  )
}
