// app/page.tsx
'use client';

import React, { useState } from 'react';
import data from '../public/data.json';

export default function Home() {
  const [showContent, setShowContent] = useState(false);
  const [shuffledData, setShuffledData] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSubQuestion, setCurrentSubQuestion] = useState(1);
  const [currentCodeVersion, setCurrentCodeVersion] = useState<'Clean' | 'Messy'>('Clean');

  const getButtonStyle = (disabled: boolean): React.CSSProperties => ({
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '1rem',
    backgroundColor: disabled ? '#ccc' : '#020202',
    color: disabled ? '#666' : 'white',
    width: 'fit-content',
  });

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleStartClick = () => {
    const shuffled = shuffleArray(data);
    setShuffledData(shuffled);
    setCurrentCodeVersion(Math.random() < 0.5 ? 'Clean' : 'Messy');
    setShowContent(true);
  };

  const handleAnswer = (answer: string) => {
    console.log(`Question ${currentQuestionIndex + 1}, Sub-question ${currentSubQuestion} (${currentCodeVersion} Version): ${answer}`);
    
    if (currentSubQuestion === 1) {
      // Move to second sub-question, keep same code version
      setCurrentSubQuestion(2);
    } else {
      // Move to next question and randomly select new code version
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentSubQuestion(1);
      setCurrentCodeVersion(Math.random() < 0.5 ? 'Clean' : 'Messy');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '90%', margin: '20px auto 20px auto' }}>
      <div style={{ backgroundColor: '#f3f4f6', border: '1px solid black', borderRadius: '8px', padding: '24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>This activity works best when you complete it in one sitting.  Take a second to make sure you have about 5 uninterrupted minutes to complete, then click the button below to start!</h2>
          <button 
            style={getButtonStyle(showContent)}
            onClick={handleStartClick}
            disabled={showContent}
            onMouseEnter={(e) => !showContent && (e.currentTarget.style.backgroundColor = '#6F00FF')}
            onMouseLeave={(e) => !showContent && (e.currentTarget.style.backgroundColor = '#020202')}
          >
            START
          </button>
        </div>
      </div>
      
      {showContent && shuffledData.length > 0 && currentQuestionIndex < shuffledData.length && (
        <div style={{ backgroundColor: '#f3f4f6', border: '1px solid black', borderRadius: '8px', padding: '24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
                {shuffledData[currentQuestionIndex].Name}
              </h3>
              <p style={{ fontSize: '1rem', marginBottom: '16px', color: '#666', textAlign: 'center' }}>
                {shuffledData[currentQuestionIndex]["What does this do?"]}
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ width: '80%', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                  <pre style={{ fontSize: '0.875rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: '0', color: '#374151' }}>
                    {shuffledData[currentQuestionIndex][`${currentCodeVersion} Version`]}
                  </pre>
                </div>
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>
                  {currentSubQuestion === 1 
                    ? "Can you tell what this code is meant to do?" 
                    : "Do you see any problems with this code?"}
                </h4>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {currentSubQuestion === 1 ? (
                    <>
                      <button 
                        style={getButtonStyle(false)}
                        onClick={() => handleAnswer('YES')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6F00FF'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#020202'}
                      >
                        YES
                      </button>
                      <button 
                        style={getButtonStyle(false)}
                        onClick={() => handleAnswer("I&apos;M NOT SURE")}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6F00FF'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#020202'}
                      >
                        I&apos;M NOT SURE
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        style={getButtonStyle(false)}
                        onClick={() => handleAnswer('YES')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6F00FF'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#020202'}
                      >
                        YES
                      </button>
                      <button 
                        style={getButtonStyle(false)}
                        onClick={() => handleAnswer("I&apos;M NOT SURE")}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6F00FF'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#020202'}
                      >
                        I&apos;M NOT SURE
                      </button>
                      <button 
                        style={getButtonStyle(false)}
                        onClick={() => handleAnswer('NO')}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6F00FF'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#020202'}
                      >
                        NO
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}