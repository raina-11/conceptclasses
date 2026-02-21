import React from 'react';
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

const SkeletonBlock = styled.div`
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 800px 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: ${props => props.$radius || '8px'};
  width: ${props => props.$width || '100%'};
  height: ${props => props.$height || '20px'};
`;

export function Skeleton({ width, height, radius, style, count = 1 }) {
  return Array.from({ length: count }, (_, i) => (
    <SkeletonBlock
      key={i}
      $width={width}
      $height={height}
      $radius={radius}
      style={{ marginBottom: count > 1 ? '12px' : undefined, ...style }}
    />
  ));
}

const ResultSkeletonWrap = styled.div`
  width: 100%;
  text-align: center;
  padding: 20px 0;
`;

export function ResultsSkeleton({ count = 3 }) {
  return (
    <ResultSkeletonWrap>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonBlock
          key={i}
          $width="100%"
          $height="300px"
          $radius="8px"
          style={{ marginBottom: '40px' }}
        />
      ))}
    </ResultSkeletonWrap>
  );
}

const CourseSkeletonWrap = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 24px;
  padding: 40px;
  border-radius: 20px;
  background: #d5e8d4;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export function CourseSkeleton({ count = 2 }) {
  return Array.from({ length: count }, (_, i) => (
    <CourseSkeletonWrap key={i}>
      <SkeletonBlock $width="100%" $height="250px" $radius="8px" />
      <div>
        <SkeletonBlock $width="60%" $height="28px" style={{ marginBottom: '16px' }} />
        <SkeletonBlock $width="90%" $height="20px" style={{ marginBottom: '10px' }} />
        <SkeletonBlock $width="85%" $height="20px" style={{ marginBottom: '10px' }} />
        <SkeletonBlock $width="80%" $height="20px" style={{ marginBottom: '10px' }} />
        <SkeletonBlock $width="70%" $height="20px" />
      </div>
    </CourseSkeletonWrap>
  ));
}
