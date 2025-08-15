// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import data from '../public/data.json';
import CodeBlock from './components/CodeBlock';

export default function Home() {
  const [showContent, setShowContent] = useState(false);
  const [shuffledData, setShuffledData] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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
  const [graphData, setGraphData] = useState<any>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [q1Answer, setQ1Answer] = useState('');
  const [q2Answer, setQ2Answer] = useState('');
  // Removed textInput state - no longer needed
  const [showNextButton, setShowNextButton] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [showReviewSection, setShowReviewSection] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [activeCodeVersion, setActiveCodeVersion] = useState<'Messy' | 'Clean'>('Messy');
  const [rawSubmissions, setRawSubmissions] = useState<any[]>([]);

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

  const handleQ1Answer = (answer: string) => {
    setQ1Answer(answer);
    // Show next button if both questions are answered
    if (answer !== '' && q2Answer !== '') {
      setShowNextButton(true);
    }
  };

  const handleQ2Answer = (answer: string) => {
    setQ2Answer(answer);
    // Show next button if both questions are answered  
    if (q1Answer !== '' && answer !== '') {
      setShowNextButton(true);
    }
  };

  const handleNextExample = async () => {
    const currentTime = Date.now();
    const timeSpent = currentTime - questionStartTime;
    
    // Save both responses
    const q1Response = {
      questionIndex: shuffledData[currentQuestionIndex]?.Question || '',
      questionName: shuffledData[currentQuestionIndex]?.Name || '',
      codeVersion: currentCodeVersion,
      subQuestion: 1,
      subQuestionText: "Can you tell what this code is meant to do?",
      answer: q1Answer,
      timeSpent,
      timestamp: currentTime
    };
    
    const q2Response = {
      questionIndex: shuffledData[currentQuestionIndex]?.Question || '',
      questionName: shuffledData[currentQuestionIndex]?.Name || '',
      codeVersion: currentCodeVersion,
      subQuestion: 2,
      subQuestionText: "Can you identify any bugs in this code?",
      answer: q2Answer,
      timeSpent,
      timestamp: currentTime
    };
    
    const updatedUserData = {
      ...userData,
      responses: [...userData.responses, q1Response, q2Response]
    };
    
    setUserData(updatedUserData);
    
    console.log(`Question ${currentQuestionIndex + 1} (${currentCodeVersion} Version): Q1: ${q1Answer}, Q2: ${q2Answer} - Time: ${timeSpent}ms`);
    
    // Check if this is the last question
    if (currentQuestionIndex >= shuffledData.length - 1) {
      // This is the final question - submit and show results
      console.log('Final question completed, submitting data');
      console.log('Complete user data:', JSON.stringify(updatedUserData, null, 2));
      
      try {
        const response = await fetch('/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedUserData),
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Data saved successfully:', result);
          setIsSubmitted(true);
          setShowReviewSection(true);
          
          // Fetch updated submissions
          const submissionsResponse = await fetch('/api/submissions');
          if (submissionsResponse.ok) {
            const submissionsData = await submissionsResponse.json();
            const cleanCodeSubmissions = submissionsData.cleanCodeSubmissions || [];
            
            // Store raw submissions for question-specific calculations
            setRawSubmissions(cleanCodeSubmissions);
            
            // Summarize data by code version, subquestions and answers
            const graphData = summarizeDataByCodeVersionAndAnswer(cleanCodeSubmissions);
            setGraphData(graphData);
          }
          
          // Scroll to top after successful submission
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        } else {
          console.error('Failed to save data');
        }
      } catch (error) {
        console.error('Error submitting data:', error);
      }
    } else {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentCodeVersion(Math.random() < 0.5 ? 'Clean' : 'Messy');
      setQ1Answer('');
      setQ2Answer('');
      setShowNextButton(false);
      setQuestionStartTime(currentTime);
      
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  // Removed handleTextInputChange - no longer needed

  const summarizeDataByCodeVersionAndAnswer = (submissions: any[]) => {
    const data: {
      [key in 'Clean' | 'Messy']: {
        [key in 'subQuestion1' | 'subQuestion2']: {
          [answer: string]: {
            count: number;
            totalTime: number;
            averageTime: number;
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
                averageTime: 0
              };
            }
            
            data[codeVersion as 'Clean' | 'Messy'][subQuestionKey][answer].count++;
            data[codeVersion as 'Clean' | 'Messy'][subQuestionKey][answer].totalTime += timeSpent;
            data[codeVersion as 'Clean' | 'Messy'][subQuestionKey][answer].averageTime = 
              data[codeVersion as 'Clean' | 'Messy'][subQuestionKey][answer].totalTime / data[codeVersion as 'Clean' | 'Messy'][subQuestionKey][answer].count;
          }
        });
      }
    });
    
    return data;
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
              fontSize: '1.25rem', 
              fontWeight: '600', 
              marginBottom: '16px', 
              textAlign: 'center'
            }}>You are about to be shown six short scripts and will be asked to answer a few questions about them. Some of these scripts were written with specific readability guidelines in mind, while others prioritized shortness.</h2>
            <h2 style={{ 
              fontSize: '1.25rem', 
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
                  maxWidth: '800px'
                }}>
                  <CodeBlock 
                    code={shuffledData[currentQuestionIndex][`${currentCodeVersion} Version`]}
                    backgroundColor='#f8f9fa'
                    borderColor='#dee2e6'
                  />
                </div>
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                {/* Question 1 */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>
                    Can you tell what this code is meant to do?
                  </h4>
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    justifyContent: 'center', 
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    <button 
                      style={getButtonStyle(false, q1Answer === 'YES')}
                      onClick={() => handleQ1Answer('YES')}
                      onMouseEnter={(e) => q1Answer !== 'YES' && (e.currentTarget.style.backgroundColor = '#6F00FF')}
                      onMouseLeave={(e) => q1Answer !== 'YES' && (e.currentTarget.style.backgroundColor = '#020202')}
                    >
                      YES
                    </button>
                    <button 
                      style={getButtonStyle(false, q1Answer === 'NOT SURE')}
                      onClick={() => handleQ1Answer("NOT SURE")}
                      onMouseEnter={(e) => q1Answer !== 'NOT SURE' && (e.currentTarget.style.backgroundColor = '#6F00FF')}
                      onMouseLeave={(e) => q1Answer !== 'NOT SURE' && (e.currentTarget.style.backgroundColor = '#020202')}
                    >
                      NOT SURE
                    </button>
                  </div>
                </div>

                {/* Question 2 */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>
                    Can you identify any bugs in this code?
                  </h4>
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    justifyContent: 'center', 
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    <button 
                      style={getButtonStyle(false, q2Answer === 'YES')}
                      onClick={() => handleQ2Answer('YES')}
                      onMouseEnter={(e) => q2Answer !== 'YES' && (e.currentTarget.style.backgroundColor = '#6F00FF')}
                      onMouseLeave={(e) => q2Answer !== 'YES' && (e.currentTarget.style.backgroundColor = '#020202')}
                    >
                      YES
                    </button>
                    <button 
                      style={getButtonStyle(false, q2Answer === 'NOT SURE')}
                      onClick={() => handleQ2Answer("NOT SURE")}
                      onMouseEnter={(e) => q2Answer !== 'NOT SURE' && (e.currentTarget.style.backgroundColor = '#6F00FF')}
                      onMouseLeave={(e) => q2Answer !== 'NOT SURE' && (e.currentTarget.style.backgroundColor = '#020202')}
                    >
                      NOT SURE
                    </button>
                    <button 
                      style={getButtonStyle(false, q2Answer === 'NO')}
                      onClick={() => handleQ2Answer('NO')}
                      onMouseEnter={(e) => q2Answer !== 'NO' && (e.currentTarget.style.backgroundColor = '#6F00FF')}
                      onMouseLeave={(e) => q2Answer !== 'NO' && (e.currentTarget.style.backgroundColor = '#020202')}
                    >
                      NO
                    </button>
                  </div>
                </div>
                
                {/* Next/Continue Button */}
                {showNextButton && (
                  <div style={{ 
                    marginTop: '20px', 
                    display: 'flex', 
                    justifyContent: 'center'
                  }}>
                    <button 
                      style={getButtonStyle(false)}
                      onClick={handleNextExample}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6F00FF'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#020202'}
                    >
                      {currentQuestionIndex >= shuffledData.length - 1 ? 'CONTINUE' : 'NEXT EXAMPLE'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      
      {isSubmitted && (
        <div style={{ backgroundColor: '#f3f4f6', border: '1px solid black', borderRadius: '8px', padding: '24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px', textAlign: 'center', color: '#1e293b' }}>How did readability affect your interactions with code?</h2>
          
          {/* Graph Section */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
            {graphData ? (
              <div style={{ width: '100%' }}>
                {(() => {
                  if (!graphData) return <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>No data available for graph.</p>;
                  
                  // Calculate average times
                  const calculateAverageTime = (codeVersion: string, subQuestion: string) => {
                    const data = graphData[codeVersion][subQuestion];
                    let totalTime = 0;
                    let totalCount = 0;
                    
                    Object.values(data).forEach((stats: any) => {
                      totalTime += stats.totalTime;
                      totalCount += stats.count;
                    });
                    
                    return totalCount > 0 ? Math.round(totalTime / totalCount / 1000) : 0;
                  };

                  const cleanQ1Time = calculateAverageTime('Clean', 'subQuestion1');
                  const messyQ1Time = calculateAverageTime('Messy', 'subQuestion1');
                  const cleanQ2Time = calculateAverageTime('Clean', 'subQuestion2');
                  const messyQ2Time = calculateAverageTime('Messy', 'subQuestion2');

                  const maxTime = Math.max(cleanQ1Time, messyQ1Time, cleanQ2Time, messyQ2Time);
                  const barHeight = 80;

                  return (
                    <div style={{ 
                      display: 'flex', 
                      gap: '20px', 
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      padding: '20px 0'
                    }}>
                      {/* Can you tell what this code does? */}
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                        textAlign: 'center', 
                        minWidth: '200px',
                        flex: '1',
                        maxWidth: '300px'
                      }}>
                        <h4 style={{ 
                          fontSize: '0.9rem', 
                          fontWeight: '600', 
                          marginBottom: '16px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          Can you tell what this code does?
                        </h4>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'end' }}>
                          {/* Clean bar */}
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              width: '60px',
                              height: maxTime > 0 ? `${(cleanQ1Time / maxTime) * barHeight}px` : '20px',
                              backgroundColor: '#10b981',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              minHeight: '30px'
                            }}>
                              {cleanQ1Time}s
                            </div>
                            <div style={{ 
                              marginTop: '4px', 
                              fontSize: '0.8rem', 
                              fontWeight: '600',
                              color: '#10b981'
                            }}>
                              Clean
                            </div>
                          </div>
                          {/* Messy bar */}
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              width: '60px',
                              height: maxTime > 0 ? `${(messyQ1Time / maxTime) * barHeight}px` : '20px',
                              backgroundColor: '#f59e0b',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              minHeight: '30px'
                            }}>
                              {messyQ1Time}s
                            </div>
                            <div style={{ 
                              marginTop: '4px', 
                              fontSize: '0.8rem', 
                              fontWeight: '600',
                              color: '#f59e0b'
                            }}>
                              Messy
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* How long did it take you to gain an understanding? */}
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                        textAlign: 'center', 
                        minWidth: '200px',
                        flex: '1',
                        maxWidth: '300px'
                      }}>
                        <h4 style={{ 
                          fontSize: '0.9rem', 
                          fontWeight: '600', 
                          marginBottom: '16px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          How long did it take you to gain an understanding?
                        </h4>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'end' }}>
                          {/* Clean bar */}
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              width: '60px',
                              height: maxTime > 0 ? `${(cleanQ1Time / maxTime) * barHeight}px` : '20px',
                              backgroundColor: '#10b981',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              minHeight: '30px'
                            }}>
                              {cleanQ1Time} seconds
                            </div>
                            <div style={{ 
                              marginTop: '4px', 
                              fontSize: '0.8rem', 
                              fontWeight: '600',
                              color: '#10b981'
                            }}>
                              Clean
                            </div>
                          </div>
                          {/* Messy bar */}
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              width: '60px',
                              height: maxTime > 0 ? `${(messyQ1Time / maxTime) * barHeight}px` : '20px',
                              backgroundColor: '#f59e0b',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              minHeight: '30px'
                            }}>
                              {messyQ1Time} seconds
                            </div>
                            <div style={{ 
                              marginTop: '4px', 
                              fontSize: '0.8rem', 
                              fontWeight: '600',
                              color: '#f59e0b'
                            }}>
                              Messy
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* How long did it take you to check correctness? */}
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                        textAlign: 'center', 
                        minWidth: '200px',
                        flex: '1',
                        maxWidth: '300px'
                      }}>
                        <h4 style={{ 
                          fontSize: '0.9rem', 
                          fontWeight: '600', 
                          marginBottom: '16px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          How long did it take you to check correctness?
                        </h4>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'end' }}>
                          {/* Clean bar */}
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              width: '60px',
                              height: maxTime > 0 ? `${(cleanQ2Time / maxTime) * barHeight}px` : '20px',
                              backgroundColor: '#10b981',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              minHeight: '30px'
                            }}>
                              {cleanQ2Time} seconds
                            </div>
                            <div style={{ 
                              marginTop: '4px', 
                              fontSize: '0.8rem', 
                              fontWeight: '600',
                              color: '#10b981'
                            }}>
                              Clean
                            </div>
                          </div>
                          {/* Messy bar */}
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              width: '60px',
                              height: maxTime > 0 ? `${(messyQ2Time / maxTime) * barHeight}px` : '20px',
                              backgroundColor: '#f59e0b',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              minHeight: '30px'
                            }}>
                              {messyQ2Time} seconds
                            </div>
                            <div style={{ 
                              marginTop: '4px', 
                              fontSize: '0.8rem', 
                              fontWeight: '600',
                              color: '#f59e0b'
                            }}>
                              Messy
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>No data available for graph.</p>
            )}
          </div>

          {/* Code Review Section */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '20px' }}>
            {/* Tab Navigation */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
              {shuffledData.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveTabIndex(index);
                    setTimeout(() => {
                      window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                      });
                    }, 100);
                  }}
                  className="button"
                  style={{
                    ...getButtonStyle(false, activeTabIndex === index),
                    padding: '8px 16px',
                    fontSize: '0.875rem',
                    minWidth: 'auto'
                  }}
                >
                  {item.Name}
                </button>
              ))}
            </div>

            {/* Results box - moved to be after tabs */}
            {shuffledData.length > 0 && graphData && (() => {
              const item = shuffledData[activeTabIndex];
              
              // Calculate metrics for current question only
              const calculateMetricsForQuestion = (questionName: string) => {
                // Filter raw submissions for the specific question
                let cleanQ1Responses: any[] = [];
                let messyQ1Responses: any[] = [];
                let cleanQ2Responses: any[] = [];
                let messyQ2Responses: any[] = [];
                
                rawSubmissions.forEach(submission => {
                  if (submission.responses && Array.isArray(submission.responses)) {
                    submission.responses.forEach((response: any) => {
                      if (response.questionName === questionName) {
                        if (response.codeVersion === 'Clean' && response.subQuestion === 1) {
                          cleanQ1Responses.push(response);
                        } else if (response.codeVersion === 'Messy' && response.subQuestion === 1) {
                          messyQ1Responses.push(response);
                        } else if (response.codeVersion === 'Clean' && response.subQuestion === 2) {
                          cleanQ2Responses.push(response);
                        } else if (response.codeVersion === 'Messy' && response.subQuestion === 2) {
                          messyQ2Responses.push(response);
                        }
                      }
                    });
                  }
                });
                
                // Calculate % Users that Understood (answered YES to subQuestion1)
                const cleanUnderstandCount = cleanQ1Responses.filter(r => r.answer === 'YES').length;
                const cleanUnderstandPercent = cleanQ1Responses.length > 0 ? Math.round((cleanUnderstandCount / cleanQ1Responses.length) * 100) : 0;
                
                const messyUnderstandCount = messyQ1Responses.filter(r => r.answer === 'YES').length;
                const messyUnderstandPercent = messyQ1Responses.length > 0 ? Math.round((messyUnderstandCount / messyQ1Responses.length) * 100) : 0;
                
                // Average Time to Understand (subQuestion1 average)
                const cleanTimeQ1 = cleanQ1Responses.length > 0 ? 
                  cleanQ1Responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / cleanQ1Responses.length : 0;
                const messyTimeQ1 = messyQ1Responses.length > 0 ? 
                  messyQ1Responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / messyQ1Responses.length : 0;
                
                // Average Time to Evaluate (subQuestion2 average)
                const cleanTimeQ2 = cleanQ2Responses.length > 0 ? 
                  cleanQ2Responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / cleanQ2Responses.length : 0;
                const messyTimeQ2 = messyQ2Responses.length > 0 ? 
                  messyQ2Responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / messyQ2Responses.length : 0;
                
                return {
                  cleanUnderstandPercent,
                  messyUnderstandPercent,
                  cleanTimeQ1: Math.round(cleanTimeQ1 / 1000),
                  messyTimeQ1: Math.round(messyTimeQ1 / 1000),
                  cleanTimeQ2: Math.round(cleanTimeQ2 / 1000),
                  messyTimeQ2: Math.round(messyTimeQ2 / 1000)
                };
              };
              
              const metrics = calculateMetricsForQuestion(item.Name);
              
              return (
                <div style={{ 
                  width: '80%', 
                  margin: '0 auto 24px auto', 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid black', 
                  borderRadius: '8px', 
                  padding: '20px' 
                }}>                  <h5 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#374151', marginBottom: '16px', textAlign: 'center' }}>{item.Name} - Results</h5>
                  <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb', fontWeight: '600', fontSize: '1rem' }}>Metric</th>
                        <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb', fontWeight: '600', color: '#059669', fontSize: '1rem' }}>Clean Code</th>
                        <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb', fontWeight: '600', color: '#dc2626', fontSize: '1rem' }}>Messy Code</th>
                        <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb', fontWeight: '600', fontSize: '1rem' }}>Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontWeight: '500', fontSize: '0.95rem' }}>% Users that Understood</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.95rem' }}>{metrics.cleanUnderstandPercent}%</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.95rem' }}>{metrics.messyUnderstandPercent}%</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.95rem' }}>{metrics.cleanUnderstandPercent - metrics.messyUnderstandPercent}%</td>
                      </tr>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontWeight: '500', fontSize: '0.95rem' }}>Avg Time to Understand</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.95rem' }}>{metrics.cleanTimeQ1}s</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.95rem' }}>{metrics.messyTimeQ1}s</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.95rem' }}>{metrics.cleanTimeQ1 - metrics.messyTimeQ1}s</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', fontWeight: '500', fontSize: '0.95rem' }}>Avg Time to Evaluate</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.95rem' }}>{metrics.cleanTimeQ2}s</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.95rem' }}>{metrics.messyTimeQ2}s</td>
                        <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', fontSize: '0.95rem' }}>{metrics.cleanTimeQ2 - metrics.messyTimeQ2}s</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* Active Tab Content */}
            {shuffledData.length > 0 && (
              <div>
                {(() => {
                  const item = shuffledData[activeTabIndex];
// Removed questionResponses as we no longer need Your Responses box
                  
                  return (
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px', color: '#1f2937', textAlign: 'center' }}>
                        {item.Name}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '16px', textAlign: 'center' }}>
                        {item["What does this do?"]}
                      </p>
                      
                      {/* Code Version Tabs */}
                      <div style={{ 
                        width: '80%', 
                        margin: '0 auto',
                        marginBottom: '16px' 
                      }}>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                          <button
                            onClick={() => setActiveCodeVersion('Messy')}
                            style={{
                              ...getButtonStyle(false, activeCodeVersion === 'Messy'),
                              padding: '8px 16px',
                              fontSize: '0.9rem',
                              backgroundColor: activeCodeVersion === 'Messy' ? '#fef2f2' : '#f3f4f6',
                              color: activeCodeVersion === 'Messy' ? '#374151' : '#374151',
                              border: '1px solid #d1d5db',
                              fontWeight: activeCodeVersion === 'Messy' ? '600' : '400'
                            }}
                            onMouseEnter={(e) => activeCodeVersion !== 'Messy' && (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                            onMouseLeave={(e) => activeCodeVersion !== 'Messy' && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                          >
                            Messy Version
                          </button>
                          <button
                            onClick={() => setActiveCodeVersion('Clean')}
                            style={{
                              ...getButtonStyle(false, activeCodeVersion === 'Clean'),
                              padding: '8px 16px',
                              fontSize: '0.9rem',
                              backgroundColor: activeCodeVersion === 'Clean' ? '#f0fdf4' : '#f3f4f6',
                              color: activeCodeVersion === 'Clean' ? '#374151' : '#374151',
                              border: '1px solid #d1d5db',
                              fontWeight: activeCodeVersion === 'Clean' ? '600' : '400'
                            }}
                            onMouseEnter={(e) => activeCodeVersion !== 'Clean' && (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                            onMouseLeave={(e) => activeCodeVersion !== 'Clean' && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                          >
                            Clean Version
                          </button>
                        </div>
                        
                        {/* Display selected code version */}
                        <div>
                          <CodeBlock 
                            code={item[`${activeCodeVersion} Version`]}
                            backgroundColor={activeCodeVersion === 'Clean' ? '#f0fdf4' : '#fef2f2'}
                            borderColor={activeCodeVersion === 'Clean' ? '#bbf7d0' : '#fecaca'}
                            style={{ fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}