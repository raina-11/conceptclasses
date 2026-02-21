import React, { useState } from 'react';

function buildCloudinaryUrl(src, width) {
  if (!src || !src.includes('res.cloudinary.com')) return src;
  const transforms = `w_${width},q_auto,f_auto`;
  return src.replace('/upload/', `/upload/${transforms}/`);
}

function buildTinyUrl(src) {
  if (!src || !src.includes('res.cloudinary.com')) return '';
  return src.replace('/upload/', '/upload/w_40,q_10,f_auto,e_blur:800/');
}

export default function CloudImage({
  src,
  alt,
  width,
  aspectRatio,
  loading = 'lazy',
  style,
  className,
}) {
  const [loaded, setLoaded] = useState(false);
  const optimizedSrc = buildCloudinaryUrl(src, width);
  const tinySrc = buildTinyUrl(src);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: aspectRatio || undefined,
        width: '100%',
        ...style,
      }}
    >
      {tinySrc && (
        <img
          src={tinySrc}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
            opacity: loaded ? 0 : 1,
            transition: 'opacity 0.4s ease',
          }}
        />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        style={{
          display: 'block',
          width: '100%',
          height: aspectRatio ? '100%' : undefined,
          objectFit: aspectRatio ? 'cover' : undefined,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />
    </div>
  );
}
