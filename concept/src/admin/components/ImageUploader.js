import React, { useRef } from 'react';

export default function ImageUploader({ onSelect, preview, label = "Upload Image" }) {
  const inputRef = useRef();

  function handleClick() {
    inputRef.current?.click();
  }

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      onSelect(file);
    }
  }

  return (
    <div className="image-upload-area" onClick={handleClick}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
      />
      {preview ? (
        <div>
          <img src={preview} alt="Preview" className="image-preview" />
          <p style={{ marginTop: '10px', color: '#666', fontSize: '12px' }}>
            Click to change image
          </p>
        </div>
      ) : (
        <div>
          <p style={{ margin: 0, fontSize: '16px', color: '#333' }}>{label}</p>
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#666' }}>
            Click or drag image here
          </p>
        </div>
      )}
    </div>
  );
}
