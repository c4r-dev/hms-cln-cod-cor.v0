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
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [userData, setUserData] = useState<{
    sessionId: string;
    startTime: number;
    responses: Array<{
      questionIndex: string;
      questionName: string;
      codeVersion: 'Clean' | 'Messy';
      subQuestion: number;
      subQuestionText: string;
      answer: string;
      timeSpent: number;
      timestamp: number;
    }>;
  }>({ sessionId: '', startTime: 0, responses: [] });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [summarizedData, setSummarizedData] = useState<any[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showNextButton, setShowNextButton] = useState(false);

  const getButtonStyle = (disabled: boolean, isSelected: boolean = false): React.CSSProperties => ({
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '1rem',
    backgroundColor: disabled ? '#ccc' : isSelected ? 'rgba(111, 0, 255, 0.6)' : '#020202',
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
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const startTime = Date.now();
    
    setShuffledData(shuffled);
    setCurrentCodeVersion(Math.random() < 0.5 ? 'Clean' : 'Messy');
    setUserData({
      sessionId,
      startTime,
      responses: []
    });
    setQuestionStartTime(startTime);
    setShowContent(true);
    // Scroll to bottom when first question appears
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleAnswer = (answer: string) => {
    if (currentSubQuestion === 1) {
      // For first sub-question, proceed immediately
      const currentTime = Date.now();
      const timeSpent = currentTime - questionStartTime;
      
      const response = {
        questionIndex: shuffledData[currentQuestionIndex]?.Question || '',
        questionName: shuffledData[currentQuestionIndex]?.Name || '',
        codeVersion: currentCodeVersion,
        subQuestion: currentSubQuestion,
        subQuestionText: "Can you tell what this code is meant to do?",
        answer,
        timeSpent,
        timestamp: currentTime
      };
      
      setUserData(prev => ({
        ...prev,
        responses: [...prev.responses, response]
      }));
      
      console.log(`Question ${currentQuestionIndex + 1}, Sub-question ${currentSubQuestion} (${currentCodeVersion} Version): ${answer} - Time: ${timeSpent}ms`);
      
      // Move to second sub-question
      setCurrentSubQuestion(2);
      setCurrentAnswer('');
      setTextInput('');
      setShowNextButton(false);
      setQuestionStartTime(currentTime);
      
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } else {
      // For second sub-question, just store the answer and show next button if text is entered
      setCurrentAnswer(answer);
      if (answer !== '' && textInput.trim() !== '') {
        setShowNextButton(true);
      }
    }
  };

  const handleNextExample = () => {
    const currentTime = Date.now();
    const timeSpent = currentTime - questionStartTime;
    
    // Combine button answer and text input
    const combinedAnswer = currentAnswer + (textInput.trim() ? ` - ${textInput.trim()}` : '');
    
    const response = {
      questionIndex: shuffledData[currentQuestionIndex]?.Question || '',
      questionName: shuffledData[currentQuestionIndex]?.Name || '',
      codeVersion: currentCodeVersion,
      subQuestion: currentSubQuestion,
      subQuestionText: "Do you see any problems with this code?",
      answer: combinedAnswer,
      timeSpent,
      timestamp: currentTime
    };
    
    setUserData(prev => ({
      ...prev,
      responses: [...prev.responses, response]
    }));
    
    console.log(`Question ${currentQuestionIndex + 1}, Sub-question ${currentSubQuestion} (${currentCodeVersion} Version): ${combinedAnswer} - Time: ${timeSpent}ms`);
    
    // Move to next question
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setCurrentSubQuestion(1);
    setCurrentCodeVersion(Math.random() < 0.5 ? 'Clean' : 'Messy');
    setCurrentAnswer('');
    setTextInput('');
    setShowNextButton(false);
    setQuestionStartTime(currentTime);
    
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTextInput(value);
    
    // Show next button if both answer is selected and text is entered
    if (currentAnswer !== '' && value.trim() !== '') {
      setShowNextButton(true);
    } else {
      setShowNextButton(false);
    }
  };

  const summarizeDataByQuestionIndex = (submissions: any[]) => {
    const questionMap = new Map();
    
    // Process all submissions and their responses
    submissions.forEach(submission => {
      if (submission.responses && Array.isArray(submission.responses)) {
        submission.responses.forEach((response: any) => {
          const key = response.questionIndex;
          if (!questionMap.has(key)) {
            questionMap.set(key, {
              questionIndex: key,
              questionName: response.questionName,
              totalResponses: 0
            });
          }
          questionMap.get(key).totalResponses++;
        });
      }
    });
    
    return Array.from(questionMap.values()).sort((a, b) => a.questionName.localeCompare(b.questionName));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '90%', margin: '20px auto 20px auto' }}>
      {!isSubmitted && (
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
      )}
      
      {!isSubmitted && showContent && shuffledData.length > 0 && currentQuestionIndex < shuffledData.length && (
        <div style={{ backgroundColor: '#f3f4f6', border: '1px solid black', borderRadius: '8px', padding: '24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
                {shuffledData[currentQuestionIndex].Name}
              </h3>
              {/* <p style={{ fontSize: '1rem', marginBottom: '16px', color: '#666', textAlign: 'center' }}>
                {shuffledData[currentQuestionIndex]["What does this do?"]}
              </p> */}
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
                        style={getButtonStyle(false, currentAnswer === 'YES')}
                        onClick={() => handleAnswer('YES')}
                        onMouseEnter={(e) => currentAnswer !== 'YES' && (e.currentTarget.style.backgroundColor = '#6F00FF')}
                        onMouseLeave={(e) => currentAnswer !== 'YES' && (e.currentTarget.style.backgroundColor = '#020202')}
                      >
                        YES
                      </button>
                      <button 
                        style={getButtonStyle(false, currentAnswer === 'I AM NOT SURE')}
                        onClick={() => handleAnswer("I AM NOT SURE")}
                        onMouseEnter={(e) => currentAnswer !== 'I AM NOT SURE' && (e.currentTarget.style.backgroundColor = '#6F00FF')}
                        onMouseLeave={(e) => currentAnswer !== 'I AM NOT SURE' && (e.currentTarget.style.backgroundColor = '#020202')}
                      >
                        I AM NOT SURE
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        style={getButtonStyle(false, currentAnswer === 'YES')}
                        onClick={() => handleAnswer('YES')}
                        onMouseEnter={(e) => currentAnswer !== 'YES' && (e.currentTarget.style.backgroundColor = '#6F00FF')}
                        onMouseLeave={(e) => currentAnswer !== 'YES' && (e.currentTarget.style.backgroundColor = '#020202')}
                      >
                        YES
                      </button>
                      <button 
                        style={getButtonStyle(false, currentAnswer === 'I AM NOT SURE')}
                        onClick={() => handleAnswer("I AM NOT SURE")}
                        onMouseEnter={(e) => currentAnswer !== 'I AM NOT SURE' && (e.currentTarget.style.backgroundColor = '#6F00FF')}
                        onMouseLeave={(e) => currentAnswer !== 'I AM NOT SURE' && (e.currentTarget.style.backgroundColor = '#020202')}
                      >
                        I AM NOT SURE
                      </button>
                      <button 
                        style={getButtonStyle(false, currentAnswer === 'NO')}
                        onClick={() => handleAnswer('NO')}
                        onMouseEnter={(e) => currentAnswer !== 'NO' && (e.currentTarget.style.backgroundColor = '#6F00FF')}
                        onMouseLeave={(e) => currentAnswer !== 'NO' && (e.currentTarget.style.backgroundColor = '#020202')}
                      >
                        NO
                      </button>
                    </>
                  )}
                </div>
                
                {currentSubQuestion === 2 && (
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <textarea
                      placeholder="What problems do you see with this code?"
                      value={textInput}
                      onChange={handleTextInputChange}
                      style={{
                        width: '80%',
                        minHeight: '100px',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        backgroundColor: '#ffffff'
                      }}
                    />
                    
                    {showNextButton && (
                      <button 
                        style={getButtonStyle(false)}
                        onClick={handleNextExample}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6F00FF'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#020202'}
                      >
                        NEXT EXAMPLE
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!isSubmitted && showContent && shuffledData.length > 0 && currentQuestionIndex >= shuffledData.length && (
        <div style={{ backgroundColor: '#f3f4f6', border: '1px solid black', borderRadius: '8px', padding: '24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', textAlign: 'center' }}>You have completed all questions!</h2>
            <button 
              style={getButtonStyle(false)}
              onClick={async () => {
                console.log('Continue button clicked');
                console.log('Complete user data:', JSON.stringify(userData, null, 2));
                
                try {
                  const response = await fetch('/api/submissions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(userData),
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    console.log('Data saved successfully:', result);
                    setIsSubmitted(true);
                    
                    // Fetch updated submissions
                    const submissionsResponse = await fetch('/api/submissions');
                    if (submissionsResponse.ok) {
                      const submissionsData = await submissionsResponse.json();
                      const cleanCodeSubmissions = submissionsData.cleanCodeSubmissions || [];
                      
                      // Summarize data by questionIndex
                      const summarized = summarizeDataByQuestionIndex(cleanCodeSubmissions);
                      setSummarizedData(summarized);
                    }
                    
                    // Scroll down to new section after successful submission
                    setTimeout(() => {
                      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }, 100);
                  } else {
                    console.error('Failed to save data');
                  }
                } catch (error) {
                  console.error('Error submitting data:', error);
                }
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6F00FF'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#020202'}
            >
              SUBMIT
            </button>
          </div>
        </div>
      )}
      
      {isSubmitted && (
        <div style={{ backgroundColor: '#f3f4f6', border: '1px solid black', borderRadius: '8px', padding: '24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '24px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px', textAlign: 'center' }}>Submitted Data</h2>
            
            {summarizedData.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <tbody>
                    {summarizedData.map((item, index) => (
                      <tr key={item.questionIndex || index} style={{ backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff' }}>
                        <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{item.questionName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>No submissions found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}