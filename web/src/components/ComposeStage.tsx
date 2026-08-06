import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

import { MAX_LENGTH, WARN_AT } from '../lib/copy';
import { fetchExamples } from '../lib/api';
import type { Example } from '../lib/types';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string) => void;
  reduced: boolean;
}

function Arrow() {
  return (
    <svg className="chip__arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ComposeStage({ value, onChange, onSubmit, reduced }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [examples, setExamples] = useState<Example[]>([]);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void fetchExamples().then(setExamples);
  }, []);

  function submit() {
    if (!value.trim()) {
      setError('Paste a message first, then press Check it.');
      textarea.current?.focus();
      return;
    }
    if (value.length > MAX_LENGTH) {
      setError(
        `That’s a bit too long to check. Paste just the suspicious part — up to ${MAX_LENGTH.toLocaleString()} characters.`
      );
      textarea.current?.focus();
      return;
    }
    setError(null);
    onSubmit(value);
  }

  function useExample(example: Example) {
    onChange(example.text);
    setError(null);
    const node = textarea.current;
    if (!node) return;
    node.focus();
    // Show the message from its first line rather than its end.
    node.setSelectionRange(0, 0);
    node.scrollTop = 0;
  }

  const length = value.length;
  const counterState = length > MAX_LENGTH ? 'over' : length > WARN_AT ? 'warn' : undefined;
  const chars = (n: number) => `${n.toLocaleString()} character${n === 1 ? '' : 's'}`;
  const counterText =
    length === 0
      ? ''
      : counterState === 'over'
        ? `${chars(length - MAX_LENGTH)} too long`
        : counterState === 'warn'
          ? `${chars(MAX_LENGTH - length)} left`
          : chars(length);

  return (
    <section className="stage stage--compose" aria-labelledby="compose-heading">
      <h2 className="sr-only" id="compose-heading">
        Check a message
      </h2>

      <div className="compose__grid">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        noValidate
      >
        <div className="well">
          <label className="well__label" htmlFor="message">
            Paste the message here
          </label>
          <textarea
            id="message"
            name="message"
            ref={textarea}
            rows={7}
            spellCheck={false}
            autoComplete="off"
            placeholder="A text, an email, a message from someone you don’t know…"
            aria-describedby="counter"
            aria-invalid={error ? true : undefined}
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              if (error && event.target.value.trim()) setError(null);
            }}
            onKeyDown={(event) => {
              // Cmd/Ctrl+Enter submits — a small nicety for repeat demoing.
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
          />
          <div className="well__foot">
            <p className="counter" id="counter" data-state={counterState} aria-live="polite">
              {counterText}
            </p>
            {length > 0 && (
              <button
                type="button"
                className="linkbtn"
                onClick={() => {
                  onChange('');
                  setError(null);
                  textarea.current?.focus();
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="cta compose__cta">
          <span>Check it</span>
          <Arrow />
        </button>
      </form>

      {examples.length > 0 && (
        <section className="examples" aria-labelledby="examples-heading">
          <h3 className="examples__heading" id="examples-heading">
            Or try one of these
          </h3>
          <div className="examples__row">
            {examples.map((example, i) => (
              <motion.button
                key={example.label}
                type="button"
                className="chip"
                onClick={() => useExample(example)}
                initial={{ opacity: 0, y: reduced ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0.001 : 0.32, delay: reduced ? 0 : 0.05 * i }}
              >
                <span className="chip__text">
                  <span className="chip__label">{example.label}</span>
                  <span className="chip__hint">{example.hint}</span>
                </span>
                <Arrow />
              </motion.button>
            ))}
          </div>
        </section>
      )}
      </div>
    </section>
  );
}
