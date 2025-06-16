// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
      textInput?: string;
      timeSpent: number;
      timestamp: number;
    }>;
  }>({ sessionId: '', startTime: 0, responses: [] });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [graphData, setGraphData] = useState<any>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showNextButton, setShowNextButton] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getButtonStyle = (disabled: boolean, isSelected: boolean = false): React.CSSProperties => ({
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.9rem',
    backgroundColor: disabled ? '#ccc' : isSelected ? 'rgba(111, 0, 255, 0.6)' : '#020202',
    color: disabled ? '#666' : 'white',
    minWidth: 'fit-content',
    textAlign: 'center',
    whiteSpace: 'nowrap'
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
    
    const response = {
      questionIndex: shuffledData[currentQuestionIndex]?.Question || '',
      questionName: shuffledData[currentQuestionIndex]?.Name || '',
      codeVersion: currentCodeVersion,
      subQuestion: currentSubQuestion,
      subQuestionText: "Do you see any problems with this code?",
      answer: currentAnswer,
      textInput: textInput.trim(),
      timeSpent,
      timestamp: currentTime
    };
    
    setUserData(prev => ({
      ...prev,
      responses: [...prev.responses, response]
    }));
    
    console.log(`Question ${currentQuestionIndex + 1}, Sub-question ${currentSubQuestion} (${currentCodeVersion} Version): Button: ${currentAnswer}, Text: ${textInput.trim()} - Time: ${timeSpent}ms`);
    
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

  const summarizeDataByCodeVersionAndAnswer = (submissions: any[]) => {
    const data: {
      [key in 'Clean' | 'Messy']: {
        [key in 'subQuestion1' | 'subQuestion2']: {
          [answer: string]: {
            count: number;
            totalTime: number;
            averageTime: number;
            textInputs: string[];
          }
        }
      }
    } = {
      Clean: { subQuestion1: {}, subQuestion2: {} },
      Messy: { subQuestion1: {}, subQuestion2: {} }
    };
    
    // Process all submissions and their responses
    submissions.forEach(submission => {
      if (submission.responses && Array.isArray(submission.responses)) {
        submission.responses.forEach((response: any) => {
          const codeVersion = response.codeVersion;
          const subQuestion = response.subQuestion;
          let answer = response.answer;
          const timeSpent = response.timeSpent || 0;
          
          // For legacy data where subquestion 2 had combined answer, extract button part
          if (subQuestion === 2 && answer && answer.includes(' - ')) {
            answer = answer.split(' - ')[0]; // Take only the button part (YES, NO, NOT SURE)
          }
          
          if (codeVersion && (codeVersion === 'Clean' || codeVersion === 'Messy') && subQuestion && answer) {
            const subQuestionKey = subQuestion === 1 ? 'subQuestion1' : 'subQuestion2';
            
            if (!data[codeVersion as 'Clean' | 'Messy'][subQuestionKey][answer]) {
              data[codeVersion as 'Clean' | 'Messy'][subQuestionKey][answer] = {
                count: 0,
                totalTime: 0,
                averageTime: 0,
                textInputs: [] // Store text inputs for subquestion 2
              };
            }
            
            data[codeVersion as 'Clean' | 'Messy'][subQuestionKey][answer].count++;
            data[codeVersion as 'Clean' | 'Messy'][subQuestionKey][answer].totalTime += timeSpent;
            data[codeVersion as 'Clean' | 'Messy'][subQuestionKey][answer].averageTime = 
              data[codeVersion as 'Clean' | 'Messy'][subQuestionKey][answer].totalTime / data[codeVersion as 'Clean' | 'Messy'][subQuestionKey][answer].count;
            
            // Store text input for subquestion 2
            if (subQuestion === 2 && response.textInput) {
              data[codeVersion as 'Clean' | 'Messy'][subQuestionKey][answer].textInputs.push(response.textInput);
            }
          }
        });
      }
    });
    
    return data;
  };

  const renderBarGraph = (data: any) => {
    if (!data || (!Object.keys(data.Clean.subQuestion1).length && !Object.keys(data.Clean.subQuestion2).length && 
        !Object.keys(data.Messy.subQuestion1).length && !Object.keys(data.Messy.subQuestion2).length)) {
      return null;
    }
    
    const barWidth = 35;
    const barSpacing = 8;
    const subQuestionSpacing = 40;
    const codeVersionSpacing = 60;
    const graphHeight = isLargeScreen ? 150 : 200;
    
    // Calculate all bars and max value for scaling
    const allBars: any[] = [];
    let maxTime = 0;
    let currentX = 50;
    
    ['Clean', 'Messy'].forEach((codeVersion) => {
      const color = codeVersion === 'Clean' ? '#10b981' : '#f59e0b'; // green for clean, orange for messy
      const codeVersionStartX = currentX;
      
      ['subQuestion1', 'subQuestion2'].forEach((subQuestion) => {
        const answers = data[codeVersion][subQuestion];
        const subQuestionLabel = subQuestion === 'subQuestion1' ? 'Q1: Can tell what code does?' : 'Q2: See problems?';
        const subQuestionStartX = currentX;
        
        Object.entries(answers)
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([answer, stats]: [string, any]) => {
          maxTime = Math.max(maxTime, stats.averageTime);
          allBars.push({
            x: currentX,
            answer,
            averageTime: stats.averageTime,
            count: stats.count,
            color,
            codeVersion,
            subQuestion: subQuestionLabel,
            subQuestionStartX: Object.keys(answers)[0] === answer ? subQuestionStartX : null,
            codeVersionStartX: subQuestion === 'subQuestion1' && Object.keys(answers)[0] === answer ? codeVersionStartX : null
          });
          currentX += barWidth + barSpacing;
        });
        
        if (Object.keys(answers).length > 0) {
          currentX += subQuestionSpacing;
        }
      });
      
      currentX += codeVersionSpacing;
    });
    
    
    // Group bars by code version
    const cleanBars = allBars.filter(bar => bar.codeVersion === 'Clean');
    const messyBars = allBars.filter(bar => bar.codeVersion === 'Messy');
    
    const renderCodeVersionSection = (bars: any[], codeVersion: string) => {
      if (bars.length === 0) return null;
      
      const color = codeVersion === 'Clean' ? '#10b981' : '#f59e0b';
      
      // Group bars by subquestion
      const q1Bars = bars.filter(bar => bar.subQuestion === 'Q1: Can tell what code does?');
      const q2Bars = bars.filter(bar => bar.subQuestion === 'Q2: See problems?');
      
      const renderSubquestionSection = (subBars: any[], questionLabel: string) => {
        if (subBars.length === 0) return null;
        
        const subSectionWidth = isLargeScreen 
          ? Math.max(140, subBars.length * (barWidth + barSpacing) + 30)
          : Math.max(280, subBars.length * (barWidth + barSpacing) + 40);
        
        return (
          <div
            style={{
              border: '1px solid black',
              borderRadius: '4px',
              padding: isLargeScreen ? '6px' : '8px',
              margin: isLargeScreen ? '2px' : '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: isLargeScreen ? `${subSectionWidth}px` : '100%',
              maxWidth: `${subSectionWidth}px`,
              flex: isLargeScreen ? '1' : 'none',
              minWidth: isLargeScreen ? '150px' : 'auto'
            }}
          >
            <h4 style={{
              fontSize: '10px',
              fontWeight: '600',
              color: '#374151',
              margin: '0 0 8px 0',
              textAlign: 'center'
            }}>
              {questionLabel}
            </h4>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <svg width={subSectionWidth} height={graphHeight + 40} style={{ display: 'block' }}>
              {subBars.map((bar, index) => {
                const barHeight = maxTime > 0 ? (bar.averageTime / maxTime) * graphHeight : 0;
                const baselineY = questionLabel.includes('Q1') ? graphHeight + 5 : graphHeight + 15; // Different baseline for Q1 vs Q2
                const y = baselineY - barHeight; // Start from baseline upward
                const totalBarsWidth = subBars.length * barWidth + (subBars.length - 1) * barSpacing;
                const startX = (subSectionWidth - totalBarsWidth) / 2;
                const adjustedX = startX + (index * (barWidth + barSpacing));
                
                return (
                  <g key={`${bar.codeVersion}-${bar.subQuestion}-${bar.answer}-${index}`}>
                    <rect
                      x={adjustedX}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={bar.color}
                      rx={3}
                    />
                    <text
                      x={adjustedX + barWidth / 2}
                      y={y - 3}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#374151"
                      fontWeight="600"
                    >
                      {(bar.averageTime / 1000).toFixed(1)}s
                    </text>
                    <text
                      x={adjustedX + barWidth / 2}
                      y={baselineY + 12}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#374151"
                    >
                      {bar.answer}
                    </text>
                  </g>
                );
              })}
              </svg>
            </div>
          </div>
        );
      };
      
      return (
        <div 
          key={codeVersion}
          style={{ 
            border: '1px solid black', 
            borderRadius: '6px', 
            padding: isLargeScreen ? '8px' : '12px', 
            margin: isLargeScreen ? '3px' : '5px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: isLargeScreen ? 'auto' : '100%',
            maxWidth: isLargeScreen ? '450px' : '600px',
            flex: isLargeScreen ? '1' : 'none',
            minWidth: isLargeScreen ? '300px' : 'auto'
          }}
        >
          <h3 style={{ 
            fontSize: '14px', 
            fontWeight: '700', 
            color: color, 
            margin: '0 0 10px 0',
            textAlign: 'center'
          }}>
            {codeVersion} Code
          </h3>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: isLargeScreen ? 'row' : 'column',
            gap: isLargeScreen ? '12px' : '8px', 
            justifyContent: 'center',
            alignItems: isLargeScreen ? 'stretch' : 'center',
            width: '100%',
            flexWrap: isLargeScreen ? 'nowrap' : 'wrap',
            height: isLargeScreen ? `${graphHeight + 80}px` : 'auto'
          }}>
            {renderSubquestionSection(q1Bars, 'Q1: Can tell what code does?')}
            {renderSubquestionSection(q2Bars, 'Q2: See problems?')}
          </div>
        </div>
      );
    };
    
    return (
      <div style={{ width: '100%', overflowX: 'auto', padding: '5px' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isLargeScreen ? 'row' : 'column',
          gap: isLargeScreen ? '15px' : '10px', 
          justifyContent: 'center',
          alignItems: isLargeScreen ? 'stretch' : 'center',
          flexWrap: isLargeScreen ? 'nowrap' : 'wrap',
          width: '100%'
        }}>
          {renderCodeVersionSection(cleanBars, 'Clean')}
          {renderCodeVersionSection(messyBars, 'Messy')}
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      padding: '10px', 
      maxWidth: '95%', 
      margin: '10px auto'
    }}>
      {!isSubmitted && (
        <div style={{ 
          backgroundColor: '#f3f4f6', 
          border: '1px solid black', 
          borderRadius: '8px', 
          padding: '16px', 
          marginBottom: '20px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '16px', 
            backgroundColor: '#f9fafb', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px'
          }}>
            <h2 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              marginBottom: '16px', 
              textAlign: 'center'
            }}>This activity works best when you complete it in one sitting.  Take a second to make sure you have about 5 uninterrupted minutes to complete, then click the button below to start!</h2>
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
        <div style={{ 
          backgroundColor: '#f3f4f6', 
          border: '1px solid black', 
          borderRadius: '8px', 
          padding: '16px', 
          marginBottom: '20px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' 
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '16px', 
            backgroundColor: '#f9fafb', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px' 
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                fontSize: '1.1rem', 
                fontWeight: '600', 
                marginBottom: '8px', 
                textAlign: 'center' 
              }}>
                {shuffledData[currentQuestionIndex].Name}
              </h3>
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                flexWrap: 'wrap', 
                justifyContent: 'center' 
              }}>
                <div style={{ 
                  width: '95%', 
                  maxWidth: '800px',
                  backgroundColor: '#f8f9fa', 
                  border: '1px solid #dee2e6', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  marginBottom: '16px' 
                }}>
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
                
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  justifyContent: 'center', 
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}>
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
                        style={getButtonStyle(false, currentAnswer === 'NOT SURE')}
                        onClick={() => handleAnswer("NOT SURE")}
                        onMouseEnter={(e) => currentAnswer !== 'NOT SURE' && (e.currentTarget.style.backgroundColor = '#6F00FF')}
                        onMouseLeave={(e) => currentAnswer !== 'NOT SURE' && (e.currentTarget.style.backgroundColor = '#020202')}
                      >
                        NOT SURE
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
                        style={getButtonStyle(false, currentAnswer === 'NOT SURE')}
                        onClick={() => handleAnswer("NOT SURE")}
                        onMouseEnter={(e) => currentAnswer !== 'NOT SURE' && (e.currentTarget.style.backgroundColor = '#6F00FF')}
                        onMouseLeave={(e) => currentAnswer !== 'NOT SURE' && (e.currentTarget.style.backgroundColor = '#020202')}
                      >
                        NOT SURE
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
                  <div style={{ 
                    marginTop: '20px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '16px',
                    width: '100%'
                  }}>
                    <textarea
                      placeholder="What problems do you see with this code?"
                      value={textInput}
                      onChange={handleTextInputChange}
                      style={{
                        width: '90%',
                        maxWidth: '600px',
                        minHeight: '80px',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
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
                      
                      // Summarize data by code version, subquestions and answers
                      const graphData = summarizeDataByCodeVersionAndAnswer(cleanCodeSubmissions);
                      setGraphData(graphData);
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
            
            {graphData ? (
              <div style={{ width: '100%' }}>
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', margin: '0' }}>
                    Average Response Time by Code Version & Answer
                  </h3>
                </div>
                {renderBarGraph(graphData)}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>No data available for graph.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}