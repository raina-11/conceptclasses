import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navigation from '../components/common/navigation/navigation';
import Layout from '../components/common/layout/layout';
import Footer from '../components/common/footer';
import '../components/common/reg.css';
import styled, { keyframes } from 'styled-components';

// The Concept portal's API. Registrations are written straight into the portal's
// database (`event_registrations`) so the front office sees a website submission
// in the same list as a scanned paper form, minutes after it arrives.
//
// This replaces the Google Apps Script this page used to POST to. That flow was
// fire-and-forget with `mode: 'no-cors'`, which means the browser could not read
// the response — a submission that failed looked exactly like one that worked,
// and the student found out on exam day.
const API_BASE = process.env.REACT_APP_PORTAL_API_URL || '';

// Which exam to register for, when the URL does not name one. A query parameter
// (`/register?exam=cscst-2027`) wins, so a campaign can link straight to one
// contest; otherwise the first exam the portal says is open.
const DEFAULT_EXAM_CODE = process.env.REACT_APP_REGISTRATION_EXAM_CODE || '';

const INITIAL_FORM = {
  studentName: '',
  fatherName: '',
  dob: '',
  currentClass: '',
  stream: '',
  schoolName: '',
  boardName: '',
  medium: '',
  cityOrVillageName: '',
  address: '',
  contactNumber: '',
  whatsappNumber: '',
  // Honeypot. Hidden from a person, filled in by a bot that submits every input
  // it finds. The API answers 202 and writes nothing.
  website: '',
};

// The classes that split into PCM/PCB. XI and XII because the paper form has
// those checkboxes on those rows; Post-12th for the same reason — a dropper
// repeating for NEET or JEE is one or the other, and the test paper they sit
// depends on which.
const SENIOR_CLASSES = ['XI', 'XII', 'Post-12th'];

// `Post-12th` is the dropper/repeater year. It is last because it is the only
// entry that is not a school class, and a student who has finished school looks
// for it at the end of the list rather than among VII to XII.
const CLASSES = ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'Post-12th'];

export default function ScholarshipRegister() {
  const [params] = useSearchParams();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [events, setEvents] = useState([]);
  const [eventCode, setEventCode] = useState(params.get('exam') || DEFAULT_EXAM_CODE);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  // Distinct from "no exam is open". A failed fetch told students registrations
  // were closed, which was a lie whenever the API was merely rate-limiting or
  // briefly down — and a student turned away from an open exam does not come
  // back. Retrying is the right advice; "call the office" is not.
  const [eventsFailed, setEventsFailed] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const isSenior = SENIOR_CLASSES.includes(formData.currentClass);
  const event = events.find((e) => e.code === eventCode) || null;

  // The open exams, their dates and their centres, read from the portal rather
  // than hardcoded here. An exam date that lives in two places is an exam date
  // that is wrong in one of them.
  useEffect(() => {
    if (!API_BASE) { setLoadingEvents(false); return; }
    let cancelled = false;
    fetch(`${API_BASE}/v1/public/registrations/events`, { headers: { accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then((open) => {
        if (cancelled) return;
        const list = Array.isArray(open) ? open : [];
        setEvents(list);
        setEventCode((current) => current || (list[0] ? list[0].code : ''));
      })
      .catch(() => { if (!cancelled) setEventsFailed(true); })
      .finally(() => { if (!cancelled) setLoadingEvents(false); });
    return () => { cancelled = true; };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Moving off XI/XII clears the stream rather than carrying PCM onto a
      // class that has no streams.
      ...(name === 'currentClass' && !SENIOR_CLASSES.includes(value) ? { stream: '' } : {}),
    }));
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }, []);

  /** The four mandatory fields, and the one conditional. Checked here so a
   *  parent gets the message next to the field rather than a 400 from the API. */
  function validate() {
    const problems = {};
    if (!formData.studentName.trim()) problems.studentName = 'Enter the student’s name.';
    if (!formData.schoolName.trim()) problems.schoolName = 'Enter the school or coaching name.';
    if (!formData.currentClass) problems.currentClass = 'Choose the current class.';
    if (isSenior && !formData.stream) problems.stream = 'Choose PCM or PCB.';
    if (!/^\d{10}$/.test(formData.contactNumber.replace(/\D/g, ''))) {
      problems.contactNumber = 'Enter a 10-digit mobile number.';
    }
    if (formData.whatsappNumber && !/^\d{10}$/.test(formData.whatsappNumber.replace(/\D/g, ''))) {
      problems.whatsappNumber = 'Enter a 10-digit WhatsApp number, or leave it blank.';
    }
    return problems;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const problems = validate();
    setFieldErrors(problems);
    if (Object.keys(problems).length) return;

    if (!API_BASE || !eventCode) {
      setError('Registrations are not open right now. Please call the institute on 0151-2240651.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/v1/public/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          eventCode,
          studentName: formData.studentName.trim(),
          schoolName: formData.schoolName.trim(),
          classLabel: isSenior ? `${formData.currentClass} (${formData.stream})` : formData.currentClass,
          contact: formData.contactNumber,
          fatherName: formData.fatherName.trim() || undefined,
          dob: formData.dob || undefined,
          stream: formData.stream || undefined,
          medium: formData.medium || undefined,
          board: formData.boardName || undefined,
          city: formData.cityOrVillageName.trim() || undefined,
          address: formData.address.trim() || undefined,
          whatsapp: formData.whatsappNumber || undefined,
          website: formData.website || undefined,
        }),
      });

      // The response IS read, unlike the old Apps Script flow. A failure has to
      // reach the person filling in the form — that is the whole point.
      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        if (problem && problem.error && problem.error.fields) {
          setFieldErrors(problem.error.fields);
          setError('Please check the highlighted fields.');
        } else if (response.status === 429) {
          setError('Too many attempts from this connection. Please wait a minute and try again.');
        } else if (response.status === 404) {
          setError('Registration for this exam has closed.');
        } else {
          setError((problem && problem.error && problem.error.message) || 'Something went wrong. Please try again.');
        }
        return;
      }

      setReceipt(await response.json());
      setFormData(INITIAL_FORM);
    } catch (err) {
      setError('We could not reach the institute’s server. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const unreachable = !loadingEvents && (eventsFailed || !API_BASE);
  const closed = !loadingEvents && !unreachable && events.length === 0;

  return (
    <Layout>
      <Navigation />
      <PageWrapper>
        {receipt ? (
          <SuccessCard>
            <CheckCircle>
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="26" cy="26" r="25" stroke="#22c55e" strokeWidth="2" fill="none" />
                <path d="M14 27l9 9 16-16" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </CheckCircle>
            {/* A repeat submission is NOT a fresh success. A student told
                "Registered" a second time reasonably concludes they now have two
                seats, and turns up expecting one. It is not an error either —
                they are registered, which is what they came to find out — so the
                card shows the same number with a heading that says so. */}
            <SuccessTitle>
              {receipt.alreadyRegistered ? 'You have already registered' : 'Registered'}
            </SuccessTitle>
            {/* The number is the whole point of this card. A student who leaves
                the page with nothing to quote has to phone the office to find
                out whether the form went through. */}
            <RegNo>
              <span>Registration number</span>
              <strong>{receipt.registrationNo}</strong>
            </RegNo>
            <SuccessText>
              {receipt.alreadyRegistered ? (
                <>
                  {receipt.studentName} is already registered for {receipt.eventName} on this
                  number. This is your existing registration number — no second form is needed.
                </>
              ) : (
                <>
                  {receipt.studentName} is registered for {receipt.eventName}.
                </>
              )}
            </SuccessText>
            <Details>
              {receipt.heldOn ? (<><dt>Test date</dt><dd>{formatDate(receipt.heldOn)}</dd></>) : null}
              {receipt.reportingTime ? (<><dt>Reporting time</dt><dd>{receipt.reportingTime}</dd></>) : null}
              {receipt.examTime ? (<><dt>Test time</dt><dd>{receipt.examTime}</dd></>) : null}
              {/* The institute allocates the centre; a student does not choose
                  one. Saying so beats an absent row, which reads as information
                  that was lost rather than information still to come. */}
              <dt>Centre</dt>
              <dd>{receipt.examCentre ?? 'Will be allocated — we will inform you on WhatsApp'}</dd>
            </Details>
            <ButtonRow>
              <PrintButton type="button" onClick={() => window.print()}>Print this</PrintButton>
            </ButtonRow>
          </SuccessCard>
        ) : (
          <FormCard>
            <BadgeRow>
              <Badge>{event ? event.name : 'Science Champ'}</Badge>
            </BadgeRow>
            <FormTitle>Register Now</FormTitle>
            {unreachable ? (
              <FormSubtitle>We could not load the test details.</FormSubtitle>
            ) : closed ? (
              <FormSubtitle>Registrations are not open at the moment.</FormSubtitle>
            ) : null}

            {unreachable ? (
              <>
                <ErrorText>
                  Something went wrong at our end, not yours. Please reload the page and try again in
                  a moment — if it keeps happening, call 0151-2240651.
                </ErrorText>
                <SubmitButton type="button" onClick={() => window.location.reload()}>
                  Reload
                </SubmitButton>
              </>
            ) : closed ? (
              <ErrorText>
                No test is open for registration right now. Call 0151-2240651 or visit Concept Heights,
                E-4 K.K. Colony, Bikaner.
              </ErrorText>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <FieldGrid>
                  {/* Which test, when the institute has more than one open. A
                      single open test needs no question asked. */}
                  {events.length > 1 ? (
                    <Field $fullWidth>
                      <Label>Test <Required>*</Required></Label>
                      <Select name="exam" value={eventCode} onChange={(e) => setEventCode(e.target.value)}>
                        {events.map((e) => (
                          <option key={e.code} value={e.code}>{e.name}</option>
                        ))}
                      </Select>
                    </Field>
                  ) : null}

                  <Field>
                    <Label>Student Name <Required>*</Required></Label>
                    <Input
                      type="text" name="studentName" value={formData.studentName}
                      onChange={handleChange} placeholder="Full name" autoComplete="name"
                    />
                    {fieldErrors.studentName ? <FieldError>{fieldErrors.studentName}</FieldError> : null}
                  </Field>

                  <Field>
                    <Label>Father’s Name</Label>
                    <Input
                      type="text" name="fatherName" value={formData.fatherName}
                      onChange={handleChange} placeholder="Father’s name"
                    />
                  </Field>

                  <Field>
                    <Label>Current Class <Required>*</Required></Label>
                    <Select name="currentClass" value={formData.currentClass} onChange={handleChange}>
                      <option value="">Select class</option>
                      {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                    {fieldErrors.currentClass ? <FieldError>{fieldErrors.currentClass}</FieldError> : null}
                  </Field>

                  {/* Only rendered for XI and XII, because only those rows on the
                      paper form have the PCM/PCB boxes. */}
                  {isSenior ? (
                    <Field>
                      <Label>Stream <Required>*</Required></Label>
                      <Select name="stream" value={formData.stream} onChange={handleChange}>
                        <option value="">Select stream</option>
                        <option value="PCM">PCM</option>
                        <option value="PCB">PCB</option>
                      </Select>
                      {fieldErrors.stream ? <FieldError>{fieldErrors.stream}</FieldError> : null}
                    </Field>
                  ) : null}

                  <Field>
                    <Label>School / Coaching Name <Required>*</Required></Label>
                    <Input
                      type="text" name="schoolName" value={formData.schoolName}
                      onChange={handleChange} placeholder="Your school name"
                    />
                    {fieldErrors.schoolName ? <FieldError>{fieldErrors.schoolName}</FieldError> : null}
                  </Field>

                  <Field>
                    <Label>Date of Birth</Label>
                    <Input type="date" name="dob" value={formData.dob} onChange={handleChange} />
                  </Field>

                  <Field>
                    <Label>Board</Label>
                    <Select name="boardName" value={formData.boardName} onChange={handleChange}>
                      <option value="">Select board</option>
                      <option value="CBSE">CBSE</option>
                      <option value="RBSE">RBSE</option>
                      <option value="Other">Other</option>
                    </Select>
                  </Field>

                  <Field>
                    <Label>Medium</Label>
                    <Select name="medium" value={formData.medium} onChange={handleChange}>
                      <option value="">Select medium</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                    </Select>
                  </Field>

                  <Field>
                    <Label>Contact Number <Required>*</Required></Label>
                    <Input
                      type="tel" name="contactNumber" value={formData.contactNumber}
                      onChange={handleChange} placeholder="10-digit mobile number"
                      maxLength={10} inputMode="numeric" autoComplete="tel"
                    />
                    {fieldErrors.contactNumber ? <FieldError>{fieldErrors.contactNumber}</FieldError> : null}
                  </Field>

                  <Field>
                    <Label>WhatsApp Number <HintText>(same as above if blank)</HintText></Label>
                    <Input
                      type="tel" name="whatsappNumber" value={formData.whatsappNumber}
                      onChange={handleChange} placeholder="10-digit WhatsApp number"
                      maxLength={10} inputMode="numeric"
                    />
                    {fieldErrors.whatsappNumber ? <FieldError>{fieldErrors.whatsappNumber}</FieldError> : null}
                  </Field>

                  <Field>
                    <Label>City / Village</Label>
                    <Input
                      type="text" name="cityOrVillageName" value={formData.cityOrVillageName}
                      onChange={handleChange} placeholder="City or village name"
                    />
                  </Field>

                  <Field $fullWidth>
                    <Label>Address</Label>
                    <Input
                      type="text" name="address" value={formData.address}
                      onChange={handleChange} placeholder="House, street, area"
                    />
                  </Field>
                </FieldGrid>

                {/* Off-screen rather than display:none — some bots skip hidden
                    inputs but fill anything they can focus. aria-hidden and
                    tabIndex keep it away from a screen reader and the keyboard. */}
                <Honeypot aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website" name="website" type="text" tabIndex={-1} autoComplete="off"
                    value={formData.website} onChange={handleChange}
                  />
                </Honeypot>

                {error && <ErrorText>{error}</ErrorText>}

                <SubmitButton type="submit" disabled={isLoading || loadingEvents}>
                  {isLoading ? 'Submitting…' : 'Submit Registration'}
                </SubmitButton>
              </form>
            )}
          </FormCard>
        )}
      </PageWrapper>
      <Footer />
    </Layout>
  );
}

/** `2026-09-27` as `27 Sep 2026`. Built from the parts rather than through a
 *  Date, which would shift the day in a negative-offset timezone. */
function formatDate(isoDay) {
  const [year, month, day] = isoDay.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[Number(month) - 1]} ${year}`;
}

/* ─── Styled Components ─────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const PageWrapper = styled.main`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0fdf4 0%, #fefce8 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 100px 16px 60px;
`;

const FormCard = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 32px rgba(0, 91, 56, 0.12);
  padding: 40px 36px;
  width: 100%;
  max-width: 640px;
  animation: ${fadeIn} 0.4s ease;

  @media (max-width: 480px) {
    padding: 28px 20px;
  }
`;

const BadgeRow = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
`;

const Badge = styled.span`
  background: #dcfce7;
  color: #15803d;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 14px;
  border-radius: 999px;
`;

const FormTitle = styled.h1`
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: #064e3b;
  margin: 0 0 6px;

  @media (max-width: 480px) {
    font-size: 22px;
  }
`;

const FormSubtitle = styled.p`
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 28px;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  grid-column: ${(props) => (props.$fullWidth ? '1 / -1' : 'auto')};
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
`;

const Required = styled.span`
  color: #ef4444;
  margin-left: 2px;
`;

const HintText = styled.span`
  color: #9ca3af;
  font-weight: 400;
  font-size: 12px;
  margin-left: 4px;
`;

const inputStyles = `
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  color: #111827;
  background: #f9fafb;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
  -webkit-appearance: none;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
    background: #fff;
  }

  &::placeholder {
    color: #9ca3af;
    font-size: 14px;
  }
`;

const Input = styled.input`${inputStyles}`;
const Select = styled.select`
  ${inputStyles}
  cursor: pointer;
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: 13px;
  margin: 12px 0 0;
  text-align: center;
`;

const SubmitButton = styled.button`
  display: block;
  width: 100%;
  margin-top: 24px;
  padding: 14px;
  background: #15803d;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;

  &:hover:not(:disabled) {
    background: #166534;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

/* ─── Success Screen ─────────────────────────────────────── */

const popIn = keyframes`
  from { transform: scale(0.7); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
`;

const SuccessCard = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 32px rgba(0, 91, 56, 0.12);
  padding: 56px 36px;
  width: 100%;
  max-width: 480px;
  text-align: center;
  animation: ${fadeIn} 0.4s ease;
`;

const CheckCircle = styled.div`
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  animation: ${popIn} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

  svg {
    width: 100%;
    height: 100%;
  }
`;

const SuccessTitle = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: #064e3b;
  margin: 0 0 12px;
`;

const SuccessText = styled.p`
  color: #6b7280;
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 28px;
`;


/* ─── Added for the portal-backed form ──────────────────── */

/* A per-field message, next to the field it is about. The single ErrorText at
   the bottom of the form made a parent hunt for which of fourteen inputs was
   wrong. */
const FieldError = styled.span`
  display: block;
  color: #b91c1c;
  font-size: 12px;
  margin-top: 4px;
`;

/* Off-screen, not display:none — see the note at the call site. */
const Honeypot = styled.div`
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
`;

const RegNo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin: 8px 0 18px;
  padding: 14px 20px;
  background: #f0fdf4;
  border: 1.5px dashed #16a34a;
  border-radius: 12px;

  span {
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #15803d;
  }

  strong {
    font-size: 30px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #064e3b;
    font-variant-numeric: tabular-nums;
  }
`;

const Details = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 16px;
  margin: 4px 0 22px;
  text-align: left;
  font-size: 14px;

  dt { color: #6b7280; }
  dd { margin: 0; color: #111827; font-weight: 600; }
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
`;

const PrintButton = styled.button`
  padding: 11px 22px;
  border-radius: 8px;
  border: 1.5px solid #16a34a;
  background: #fff;
  color: #15803d;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover { background: #f0fdf4; }
`;
