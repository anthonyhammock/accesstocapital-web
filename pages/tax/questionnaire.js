import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { AvatarLogo } from '../../src/components/LogoComponent'

export default function TaxQuestionnaire() {
  const [user, setUser] = useState(null)
  const [stage, setStage] = useState('basics') // 'basics' | 'questions' | 'results'

  const [questions, setQuestions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})

  const [taxYear, setTaxYear] = useState(() => {
    const now = new Date()
    return now.getFullYear() - (now.getMonth() < 3 ? 1 : 0)
  })
  const [entityType, setEntityType] = useState('SOLE_PROP')
  const [officerWages, setOfficerWages] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tax/questionnaire-questions`)
      const data = await response.json()
      setQuestions(data.questions || [])
    } catch (err) {
      setError('Could not load questions. Please refresh and try again.')
    } finally {
      setLoadingQuestions(false)
    }
  }

  const currentQuestion = questions[currentIndex]
  const currentAnswer = currentQuestion ? answers[currentQuestion.deduction_code] : null

  const handleYes = () => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.deduction_code]: { hasExpense: true, amount: prev[currentQuestion.deduction_code]?.amount || '' }
    }))
  }

  const handleNo = () => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.deduction_code]: { hasExpense: false, amount: '' }
    }))
    advance()
  }

  const handleAmountChange = (value) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.deduction_code]: { hasExpense: true, amount: value }
    }))
  }

  const advance = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      handleSubmit()
    }
  }

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')

    const answerList = Object.entries(answers)
      .filter(([code, a]) => a.hasExpense && parseFloat(a.amount) > 0)
      .map(([code, a]) => ({
        deduction_code: code,
        amount: parseFloat(a.amount)
      }))

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tax/submit-questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          tax_year: taxYear,
          entity_type: entityType,
          answers: answerList,
          officer_wages: entityType !== 'SOLE_PROP' ? parseFloat(officerWages || 0) : 0
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Something went wrong calculating your deductions.')
        setSubmitting(false)
        return
      }

      setResults(data)
      setStage('results')
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const startOver = () => {
    setAnswers({})
    setCurrentIndex(0)
    setResults(null)
    setError('')
    setStage('basics')
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <header className="bg-white border-b border-lightgray">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <AvatarLogo size="sm" />
            <span className="font-garamond text-navy text-base tracking-wide">BlissPoint Access</span>
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('user')
              window.location.href = '/login'
            }}
            className="text-navy hover:text-gold"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-12 w-full">

        {stage === 'basics' && (
          <div className="max-w-xl mx-auto">
            <h1 className="font-garamond text-4xl font-medium text-navy mb-2">A Few Quick Basics First</h1>
            <p className="font-inter text-gray-600 mb-10">This helps us map your deductions to the right tax form.</p>

            <div className="bg-white border border-lightgray p-8 mb-8">
              <div className="mb-6">
                <label className="font-inter text-sm font-medium text-navy block mb-2">Tax Year</label>
                <input
                  type="number"
                  value={taxYear}
                  onChange={(e) => setTaxYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                />
              </div>

              <div className="mb-6">
                <label className="font-inter text-sm font-medium text-navy block mb-2">Business Type</label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                >
                  <option value="SOLE_PROP">Sole Proprietor (Schedule C)</option>
                  <option value="S_CORP">S-Corporation (Form 1120-S)</option>
                  <option value="C_CORP">C-Corporation (Form 1120)</option>
                </select>
              </div>

              {entityType !== 'SOLE_PROP' && (
                <div>
                  <label className="font-inter text-sm font-medium text-navy block mb-2">Officer Wages Paid This Year</label>
                  <input
                    type="number"
                    value={officerWages}
                    onChange={(e) => setOfficerWages(e.target.value)}
                    placeholder="50000"
                    className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={() => setStage('questions')}
              disabled={loadingQuestions || questions.length === 0}
              className="w-full px-8 py-3 bg-navy text-offwhite hover:bg-opacity-90 disabled:opacity-50"
            >
              {loadingQuestions ? 'Loading Questions...' : 'Start Walkthrough'}
            </button>
          </div>
        )}

        {stage === 'questions' && currentQuestion && (
          <div className="max-w-xl mx-auto">
            <p className="font-inter text-sm text-gray-600 mb-2">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <div className="w-full bg-lightgray rounded-full h-2 mb-10">
              <div
                className="bg-gold h-2 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <div className="bg-white border border-lightgray p-8 mb-6">
              <h2 className="font-garamond text-2xl text-navy mb-8">
                {currentQuestion.question}
              </h2>

              <div className="flex gap-4 mb-6">
                <button
                  onClick={handleYes}
                  className={`flex-1 px-6 py-3 font-medium border transition ${
                    currentAnswer?.hasExpense
                      ? 'bg-navy text-offwhite border-navy'
                      : 'border-lightgray text-navy hover:bg-offwhite'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={handleNo}
                  className="flex-1 px-6 py-3 font-medium border border-lightgray text-navy hover:bg-offwhite transition"
                >
                  No
                </button>
              </div>

              {currentAnswer?.hasExpense && (
                <div>
                  <label className="font-inter text-sm font-medium text-navy block mb-2">
                    How much did you spend{currentQuestion.meals_50_percent ? ' (total, before any limits)' : ''}?
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentAnswer.amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              {currentIndex > 0 && (
                <button
                  onClick={goBack}
                  className="px-6 py-3 border border-lightgray text-navy font-medium hover:bg-offwhite"
                >
                  Back
                </button>
              )}
              {currentAnswer?.hasExpense && (
                <button
                  onClick={advance}
                  disabled={!parseFloat(currentAnswer.amount) || submitting}
                  className="flex-1 px-8 py-3 bg-navy text-offwhite hover:bg-opacity-90 disabled:opacity-50"
                >
                  {submitting
                    ? 'Calculating...'
                    : currentIndex === questions.length - 1
                    ? 'Calculate My Deductions'
                    : 'Next'}
                </button>
              )}
            </div>
          </div>
        )}

        {stage === 'results' && results && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-white border border-gold p-8">
              <h2 className="font-garamond text-3xl text-navy font-bold mb-4">
                Total Deductions: <span className="text-gold">${results.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </h2>
              <p className="font-inter text-gray-600">
                {taxYear} — {entityType === 'SOLE_PROP' ? 'Sole Proprietor' : entityType === 'S_CORP' ? 'S-Corporation' : 'C-Corporation'}
              </p>
            </div>

            <div className="bg-white border border-lightgray p-8">
              <h3 className="font-garamond text-2xl text-navy font-medium mb-6">Form Line Breakdown</h3>
              <div className="space-y-4">
                {Object.entries(results.lines).map(([formLine, data]) => (
                  <div key={formLine} className="border-l-4 border-gold pl-6 py-4 hover:bg-offwhite">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-garamond text-lg text-navy font-bold">{formLine}</p>
                      <p className="font-inter text-lg font-bold text-gold">
                        ${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <p className="font-inter text-xs text-gray-500">{data.count} item(s)</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={startOver}
                className="flex-1 px-8 py-3 border border-lightgray text-navy font-medium hover:bg-offwhite"
              >
                Start Over
              </button>
              <Link href="/dashboard" className="flex-1">
                <button className="w-full px-8 py-3 bg-navy text-offwhite hover:bg-opacity-90">
                  Back to Dashboard
                </button>
              </Link>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
