import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Navigation from '../components/common/navigation/navigation';
import Layout from '../components/common/layout/layout';
import Footer from '../components/common/footer';
import SEO from '../components/common/SEO';
import seoConfig from '../seo/seoConfig';
import { createBreadcrumbSchema } from '../seo/schemas';

// Results are never shipped to the browser in bulk. The portal API sends a
// WhatsApp code to the phone the student registered with, and returns ONE
// result for a correct code. See concept-portal apps/api/src/modules/results.
const API_BASE = process.env.REACT_APP_PORTAL_API_URL || '';
const EVENT_CODE = process.env.REACT_APP_RESULTS_EVENT_CODE || process.env.REACT_APP_REGISTRATION_EXAM_CODE || '';
const TURNSTILE_SITE_KEY = process.env.REACT_APP_TURNSTILE_SITE_KEY || '';
const OFFICE_PHONE = '9928111865';

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = json?.error?.message || 'Something went wrong. Please try again.';
    // Dead ends the parent cannot fix online (unknown roll, no number on
    // record) point at the office. The API leaves the phone number to us.
    const deadEnd = json?.error?.code === 'not_found' || json?.error?.fields?.rollNo === 'no_phone';
    const err = new Error(deadEnd ? `${message} Call ${OFFICE_PHONE}.` : message);
    err.retryAfterMs = json?.error?.retryAfterMs;
    throw err;
  }
  return json;
}

/** Cloudflare Turnstile, rendered explicitly so the token can be reset after
 *  every send — a token is good for one verification only. */
function useTurnstile(containerRef) {
  const [token, setToken] = useState('');
  const widgetId = useRef(null);
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return undefined;
    const render = () => {
      if (!containerRef.current || widgetId.current !== null) return;
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: setToken,
        'expired-callback': () => setToken(''),
      });
    };
    if (window.turnstile) render();
    else {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = render;
      document.head.appendChild(s);
    }
    return () => {
      if (widgetId.current !== null && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [containerRef]);
  const reset = () => {
    setToken('');
    if (widgetId.current !== null && window.turnstile) window.turnstile.reset(widgetId.current);
  };
  return [token, reset];
}

// A verified result survives a refresh, but only in this tab (sessionStorage is
// dropped when the tab closes) and only for 30 minutes — a shared family phone
// should not keep showing a child's marks.
const SAVED_KEY = 'sc2027-result';
const SAVED_FOR_MS = 30 * 60 * 1000;

function savedResult() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SAVED_KEY));
    return saved && Date.now() - saved.at < SAVED_FOR_MS ? saved.result : null;
  } catch {
    return null;
  }
}

function saveResult(result) {
  try {
    sessionStorage.setItem(SAVED_KEY, JSON.stringify({ result, at: Date.now() }));
  } catch {
    // Private mode or storage blocked: the result still shows, it just will
    // not survive a refresh.
  }
}

export default function ScienceChampResult2027() {
  const [rollNo, setRollNo] = useState('');
  // Masked numbers the code would go to, shown before the parent asks for one.
  const [phones, setPhones] = useState(null);
  const [otp, setOtp] = useState(null); // { otpId, sentTo, resendAfterSeconds }
  const [code, setCode] = useState('');
  const [result, setResult] = useState(savedResult);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const turnstileRef = useRef(null);
  const [turnstileToken, resetTurnstile] = useTurnstile(turnstileRef);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const lookup = async () => {
    setError('');
    setBusy(true);
    try {
      const found = await post('/v1/public/results/lookup', { eventCode: EVENT_CODE, rollNo: rollNo.trim(), turnstileToken });
      setPhones(found.phones);
    } catch (err) {
      setError(err.message);
    } finally {
      resetTurnstile();
      setBusy(false);
    }
  };

  // One form, two steps: first show the number, then send the code to it.
  const submitRoll = (e) => {
    e.preventDefault();
    if (phones) sendCode();
    else lookup();
  };

  const sendCode = async (e) => {
    e?.preventDefault();
    setError('');
    setBusy(true);
    try {
      const sent = await post('/v1/public/results/otp', { eventCode: EVENT_CODE, rollNo: rollNo.trim(), turnstileToken });
      setOtp(sent);
      setCode('');
      setWait(sent.resendAfterSeconds);
    } catch (err) {
      setError(err.message);
      if (err.retryAfterMs) setWait(Math.ceil(err.retryAfterMs / 1000));
    } finally {
      resetTurnstile();
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const verified = await post('/v1/public/results/verify', { otpId: otp.otpId, code: code.trim() });
      saveResult(verified);
      setResult(verified);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const startOver = () => {
    // The resend cooldown belongs to the previous roll number (the server keeps
    // its own per-roll count), so a new roll starts with no wait.
    setPhones(null); setOtp(null); setResult(null); setCode(''); setError(''); setRollNo(''); setWait(0);
    // The widget does not solve while hidden behind a result, so ask for a
    // fresh token now that the roll-number form is back.
    resetTurnstile();
  };

  const unavailable = !API_BASE || !EVENT_CODE || !TURNSTILE_SITE_KEY;
  const r = result?.result;

  return (
    <Layout>
      <SEO {...seoConfig.result2027} schemaMarkup={createBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Science Champ Result 2027', path: '/science-champ-result-2027' }])} />
      <Navigation />
      <Page id="main-content">
        {!result && (
          <Card>
            <Title>Science Champ 2027 Result</Title>

            {unavailable && <ErrorBox>Results are not available online right now. Please call {OFFICE_PHONE}.</ErrorBox>}

            {!unavailable && !otp && (
              <form onSubmit={submitRoll}>
                <Label htmlFor="res-roll">Roll number</Label>
                <Input
                  id="res-roll" value={rollNo}
                  onChange={(e) => { setRollNo(e.target.value); setPhones(null); setError(''); }}
                  inputMode="numeric" autoComplete="off" maxLength={12} placeholder="e.g. 49722" required
                />
                {phones ? (
                  <Note>OTP will be sent on WhatsApp to <b>{phones.join(', ')}</b>.</Note>
                ) : (
                  <Note>We will send a 6-digit code on WhatsApp to the mobile number given at registration.</Note>
                )}
                <Button type="submit" disabled={busy || !rollNo.trim() || !turnstileToken || (phones && wait > 0)}>
                  {phones
                    ? (busy ? 'Sending…' : wait > 0 ? `Try again in ${wait}s` : 'Send OTP')
                    : (busy ? 'Checking…' : 'Continue')}
                </Button>
              </form>
            )}

            {!unavailable && otp && (
              <form onSubmit={verify}>
                <Note>Code sent on WhatsApp to <b>{otp.sentTo.join(', ')}</b>. It is valid for 5 minutes.</Note>
                <Label htmlFor="res-code">Enter the 6-digit code</Label>
                <Input
                  id="res-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" required autoFocus
                />
                <Button type="submit" disabled={busy || code.length !== 6}>{busy ? 'Checking…' : 'View result'}</Button>
                <LinkButton type="button" disabled={busy || wait > 0 || !turnstileToken} onClick={() => sendCode()}>
                  {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
                </LinkButton>
                <LinkButton type="button" onClick={startOver}>Use a different roll number</LinkButton>
              </form>
            )}

            {error && <ErrorBox role="alert">{error}</ErrorBox>}
            <Help>Facing an issue? Call <a href={`tel:${OFFICE_PHONE}`}>{OFFICE_PHONE}</a></Help>
          </Card>
        )}

        {/* One widget for every step, mounted for the life of the page: it is
            rendered once, so unmounting it (e.g. while a result is shown)
            would leave the next send with no token, ever. */}
        {!unavailable && <Turnstile ref={turnstileRef} hidden={Boolean(result)} />}

        {result && (
          <Card>
            <ResultHeader>
              <div>
                <Name>{result.studentName}</Name>
                <Meta>Roll No. {result.rollNo} · Class {result.classLabel}</Meta>
                {r.school && <Meta>{r.school}</Meta>}
              </div>
            </ResultHeader>
            <Table>
              <thead><tr><th>Subject</th><th>Marks</th></tr></thead>
              <tbody>
                {r.subjects.map((s) => (
                  <tr key={s.name}><td>{s.name}</td><td>{s.marks ?? '—'} / {s.max}</td></tr>
                ))}
                <tr className="total"><td>Total</td><td>{r.total.marks ?? '—'} / {r.total.max}</td></tr>
                {r.percent !== null && r.percent !== undefined && <tr><td>Percentage</td><td>{r.percent}%</td></tr>}
              </tbody>
            </Table>
            {r.centre && <Meta>Exam centre: {r.centre}</Meta>}
            <Actions>
              {r.omrUrl && <a href={r.omrUrl} target="_blank" rel="noopener noreferrer">View OMR sheet</a>}
              <button type="button" onClick={() => window.print()}>Print</button>
            </Actions>
          </Card>
        )}
      </Page>
      <Footer />
    </Layout>
  );
}

const Page = styled.main`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0fdf4 0%, #fefce8 100%);
  padding: 96px 16px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 560px;
  box-sizing: border-box;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  @media (max-width: 480px) { padding: 16px; }
`;

const Title = styled.h1`
  margin: 0 0 4px;
  font-size: 28px;
  font-weight: 700;
  color: #064e3b;
  @media (max-width: 480px) { font-size: 22px; }
`;

const Label = styled.label`
  display: block;
  margin: 20px 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  min-height: 48px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1.5px solid #d1d5db;
  font-size: 18px; /* 16px+ stops iOS zooming in on focus */
  letter-spacing: 1px;
  &:focus { outline: none; border-color: #15803d; box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.15); }
`;

const Note = styled.p`
  margin: 12px 0;
  font-size: 14px;
  color: #374151;
`;

// The widget runs in Invisible mode (set on the Cloudflare side), so this is
// only a mount point: it draws nothing and takes no space.
const Turnstile = styled.div``;

const Button = styled.button`
  width: 100%;
  min-height: 48px;
  margin-top: 8px;
  border: 0;
  border-radius: 10px;
  background: #15803d;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  &:disabled { background: #9ca3af; cursor: not-allowed; }
`;

const LinkButton = styled.button`
  display: block;
  margin: 12px auto 0;
  border: 0;
  background: none;
  color: #15803d;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:disabled { color: #9ca3af; cursor: not-allowed; }
`;

const ErrorBox = styled.p`
  margin: 16px 0 0;
  padding: 12px;
  border-radius: 10px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 14px;
`;

const Help = styled.p`
  margin: 20px 0 0;
  font-size: 13px;
  color: #6b7280;
  text-align: center;
  a { color: #15803d; font-weight: 600; }
`;

const ResultHeader = styled.div`
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 12px;
  margin-bottom: 12px;
`;

const Name = styled.h1`
  margin: 0;
  font-size: 22px;
  color: #064e3b;
`;

const Meta = styled.p`
  margin: 4px 0 0;
  font-size: 14px;
  color: #6b7280;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0 12px;
  font-size: 16px;
  th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
  th { font-size: 13px; color: #6b7280; font-weight: 600; }
  td:last-child, th:last-child { text-align: right; }
  tr.total td { font-weight: 700; color: #064e3b; }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
  a, button {
    flex: 1 1 140px;
    min-height: 44px;
    border-radius: 10px;
    border: 1.5px solid #15803d;
    background: #fff;
    color: #15803d;
    font-size: 15px;
    font-weight: 600;
    text-align: center;
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  @media print { display: none; }
`;
