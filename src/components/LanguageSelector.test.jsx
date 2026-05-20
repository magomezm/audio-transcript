import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageSelector } from './LanguageSelector'

describe('LanguageSelector', () => {
  it('renders language dropdown and translate toggle', () => {
    render(
      <LanguageSelector
        sourceLanguage="auto"
        translateToEnglish={false}
        onSourceLanguageChange={vi.fn()}
        onTranslateChange={vi.fn()}
        disabled={false}
      />
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('calls onSourceLanguageChange when dropdown changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <LanguageSelector
        sourceLanguage="auto"
        translateToEnglish={false}
        onSourceLanguageChange={onChange}
        onTranslateChange={vi.fn()}
        disabled={false}
      />
    )
    await user.selectOptions(screen.getByRole('combobox'), 'es')
    expect(onChange).toHaveBeenCalledWith('es')
  })

  it('calls onTranslateChange when toggle is clicked', async () => {
    const user = userEvent.setup()
    const onTranslate = vi.fn()
    render(
      <LanguageSelector
        sourceLanguage="auto"
        translateToEnglish={false}
        onSourceLanguageChange={vi.fn()}
        onTranslateChange={onTranslate}
        disabled={false}
      />
    )
    await user.click(screen.getByRole('checkbox'))
    expect(onTranslate).toHaveBeenCalledWith(true)
  })

  it('disables translate toggle when source language is English', () => {
    render(
      <LanguageSelector
        sourceLanguage="en"
        translateToEnglish={false}
        onSourceLanguageChange={vi.fn()}
        onTranslateChange={vi.fn()}
        disabled={false}
      />
    )
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('disables all controls when disabled=true', () => {
    render(
      <LanguageSelector
        sourceLanguage="auto"
        translateToEnglish={false}
        onSourceLanguageChange={vi.fn()}
        onTranslateChange={vi.fn()}
        disabled={true}
      />
    )
    expect(screen.getByRole('combobox')).toBeDisabled()
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })
})
