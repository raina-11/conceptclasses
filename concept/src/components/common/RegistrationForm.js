import React, { useState } from 'react';

const App = () => {
  const [formData, setFormData] = useState({
    schoolName: '',
    studentName: '',
    fatherName: '',
    dateOfBirth: '',
    currentClass: '',
    pcbOrPcm: '',
    medium: '',
    presentBoard: '',
    address: '',
    mobileNo: '',
    whatsappNo: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbyspQv1q6_SU9cKmzzpvcbA3npkU4-BzHpH7FS-gqqA94BcCSObfPGh1SOAyPIueFkA1Q/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const result = await response.text();
      alert(result);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} placeholder="School/Coaching/Tutor Name" />
      <input type="text" name="studentName" value={formData.studentName} onChange={handleChange} placeholder="Student's Name" />
      <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} placeholder="Father's Name" />
      <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
      <input type="text" name="currentClass" value={formData.currentClass} onChange={handleChange} placeholder="Current Class" />
      <select name="pcbOrPcm" value={formData.pcbOrPcm} onChange={handleChange}>
        <option value="">Select PCB or PCM</option>
        <option value="PCB">PCB</option>
        <option value="PCM">PCM</option>
      </select>
      <select name="medium" value={formData.medium} onChange={handleChange}>
        <option value="">Select Medium</option>
        <option value="English">English</option>
        <option value="Hindi">Hindi</option>
      </select>
      <select name="presentBoard" value={formData.presentBoard} onChange={handleChange}>
        <option value="">Select Present Board</option>
        <option value="CBSE">CBSE</option>
        <option value="RBSE">RBSE</option>
        <option value="Other">Other</option>
      </select>
      <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Address"></textarea>
      <input type="text" name="mobileNo" value={formData.mobileNo} onChange={handleChange} placeholder="Mobile No" />
      <input type="text" name="whatsappNo" value={formData.whatsappNo} onChange={handleChange} placeholder="WhatsApp No" />
      <button type="submit">Submit</button>
    </form>
  );
};

export default App;
