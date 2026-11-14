/**
 * Twice web app — a four-step state machine in plain React state.
 *
 *   landing → input → quiz (only if analysis.needs) → results
 *   overlays on top: statement drawer · switch kit · paywall · privacy
 *
 * DECISION(no-router): the URL hash mirrors the step (#input, #quiz, #results) so Back
 * works and a refresh lands somewhere sensible, but there is no router — AGENTS.md rule 6.
 * DECISION(analyze-in-render): analysis = useMemo(analyze(transactions, profile)). The
 * engine is pure and fast, so every statement edit or quiz answer simply recomputes;
 * there is no cached result anywhere that could drift from the rows on screen.
 */
import { analyze } from '@twice/engine';
import type { Finding, Persona, Profile, Question, Transaction } from '@twice/engine';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Footer } from './components/Footer';
import { Header, type Step } from './components/Header';
import { KitSheet } from './components/KitSheet';
import { Paywall } from './components/Paywall';
import { PrivacyPanel } from './components/PrivacyPanel';
import { StatementDrawer } from './components/StatementDrawer';
import { firstName, loadPersona, parseFiles, pickHeroSample, samplePersonas, type Loaded } from './lib/samples';
import { clearSaved, STORAGE_KEYS, usePersistentState } from './lib/storage';
import { readCsvFiles } from './lib/upload';
import { InputScreen } from './screens/InputScreen';
import { Landing } from './screens/Landing';
import { QuizScreen } from './screens/QuizScreen';
import { ResultsScreen } from './screens/ResultsScreen';

type Overlay =
  | { kind: 'statement' }
  | { kind: 'kit'; findingId: string }
  | { kind: 'paywall'; pendingFindingId: string }
  | { kind: 'privacy' };

const STEPS: Step[] = ['landing', 'input', 'quiz', 'results'];
const TITLES: Record<Step, string> = {
  landing: 'Twice — see what you pay for twice',
  input: 'Choose a statement — Twice',
  quiz: 'A few questions — Twice',
  results: 'Your results — Twice',
};

function stepFromHash(): Step {
  const h = window.location.hash.slice(1);
  return (STEPS as string[]).includes(h) ? (h as Step) : 'landing';
}

let manualRowCounter = 0;

export default function App() {
  // Deep links only make sense for steps that need no data.
  const [step, setStep] = useState<Step>(() => (stepFromHash() === 'input' ? 'input' : 'landing'));
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<Profile>({});
  const [answers, setAnswers] = useState<Profile>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [overlay, setOverlay] = useState<Overlay | null>(null);

  const [kits, setKits] = usePersistentState<Record<string, string[]>>(STORAGE_KEYS.kits, {});
  const [freeKitId, setFreeKitId] = usePersistentState<string | null>(STORAGE_KEYS.freeKit, null);
  const [plus, setPlus] = usePersistentState<boolean>(STORAGE_KEYS.plus, false);

  const hero = useMemo(() => pickHeroSample(), []);
  const analysis = useMemo(() => analyze(transactions, profile), [transactions, profile]);
  const quizEstimate = useMemo(
    () => (step === 'quiz' ? analyze(transactions, answers).totals : null),
    [step, transactions, answers],
  );
  const txById = useMemo(() => new Map(transactions.map((t) => [t.id, t])), [transactions]);
  const findingById = useMemo(() => new Map(analysis.findings.map((f) => [f.id, f])), [analysis.findings]);

  // ── navigation ────────────────────────────────────────────────────────────
  const reachable = useCallback(
    (s: Step) => {
      if (s === 'landing' || s === 'input') return true;
      if (!loaded || transactions.length === 0) return false;
      return s === 'quiz' ? questions.length > 0 : true;
    },
    [loaded, transactions.length, questions.length],
  );

  const go = useCallback((next: Step) => {
    setStep(next);
    const hash = next === 'landing' ? '' : `#${next}`;
    if (window.location.hash !== hash) {
      window.history.pushState(null, '', hash || window.location.pathname + window.location.search);
    }
  }, []);

  const reachableRef = useRef(reachable);
  reachableRef.current = reachable;
  useEffect(() => {
    const onPop = () => {
      const s = stepFromHash();
      setOverlay(null);
      setStep(reachableRef.current(s) ? s : 'landing');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    // A reload on #quiz/#results lands on the landing page (nothing survives a reload, by
    // design), so drop the stale hash once — otherwise the URL disagrees with the screen.
    if (stepFromHash() !== 'input' && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    document.title = TITLES[step];
  }, [step]);

  // ── loading statements ────────────────────────────────────────────────────
  const adoptStatement = (next: Loaded, prefill: Profile) => {
    setLoaded(next);
    setTransactions(next.transactions);
    setProfile({});
    setAnswers(prefill);
    setQuestions([]);
  };

  const pickPersona = (persona: Persona) => {
    const next = loadPersona(persona);
    if (!next) {
      setUploadErrors([`The sample file ${persona.file} is missing from this build.`]);
      return;
    }
    setUploadErrors([]);
    adoptStatement(next, persona.profile);
  };

  const handleFiles = async (list: FileList) => {
    setBusy(true);
    setUploadErrors([]);
    if (step !== 'input') go('input');
    try {
      const { files, rejected } = await readCsvFiles(list);
      const errors = [...rejected];
      if (files.length > 0) {
        const parsed = parseFiles(files);
        const good = parsed.files.filter((f) => f.result.transactions.length > 0);
        for (const f of parsed.files) {
          if (f.result.transactions.length > 0) continue;
          const why = f.result.warnings[0];
          // The engine's first warning already says what's missing; only fall back to our own line without one.
          errors.push(
            why
              ? `“${f.name}”: ${why}`
              : `No transactions found in “${f.name}”. Twice needs a date, a description and an amount column.`,
          );
        }
        if (good.length > 0) adoptStatement({ ...parsed, files: good }, {});
      }
      setUploadErrors(errors);
    } finally {
      setBusy(false);
    }
  };

  const continueFromInput = () => {
    const needs = analyze(transactions, {}).needs;
    setQuestions(needs);
    if (needs.length > 0) go('quiz');
    else {
      setProfile(answers);
      go('results');
    }
  };

  const openHeroResults = () => {
    if (!hero) return go('input');
    adoptStatement(hero.loaded, hero.persona.profile);
    setQuestions(analyze(hero.loaded.transactions, {}).needs);
    setProfile(hero.persona.profile);
    go('results');
  };

  const startOver = () => {
    setLoaded(null);
    setTransactions([]);
    setQuestions([]);
    setUploadErrors([]);
    go('input');
  };

  // ── statement edits (stable callbacks: rows are memoized) ────────────────
  const updateTx = useCallback((id: string, patch: Partial<Transaction>) => {
    setTransactions((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);
  const deleteTx = useCallback((id: string) => {
    setTransactions((ts) => ts.filter((t) => t.id !== id));
  }, []);
  const addTx = useCallback(() => {
    manualRowCounter += 1;
    const id = `manual:${manualRowCounter}`;
    setTransactions((ts) => {
      // Default to the statement's latest date so a new subscription row lands "now" in its timeline.
      const latest = ts.reduce((d, t) => (t.date > d ? t.date : d), '') || new Date().toISOString().slice(0, 10);
      return [{ id, date: latest, description: '', amount: 0, format: 'generic' }, ...ts];
    });
    return id;
  }, []);

  // ── kits, paywall ─────────────────────────────────────────────────────────
  const doneFor = useCallback(
    (id: string) => {
      const f = findingById.get(id);
      const done = kits[id] ?? [];
      return f ? f.kit.filter((s) => done.includes(s.title)).length : 0;
    },
    [findingById, kits],
  );

  // DECISION(free-kit): the first kit a user opens becomes their free one (persisted);
  // any other kit opens the paywall. Re-opening the free kit never does.
  const openKit = (f: Finding) => {
    if (plus || freeKitId === null || freeKitId === f.id) {
      if (!plus && freeKitId === null) setFreeKitId(f.id);
      setOverlay({ kind: 'kit', findingId: f.id });
    } else {
      setOverlay({ kind: 'paywall', pendingFindingId: f.id });
    }
  };

  const toggleStep = (findingId: string, title: string) => {
    setKits((all) => {
      const cur = all[findingId] ?? [];
      return { ...all, [findingId]: cur.includes(title) ? cur.filter((t) => t !== title) : [...cur, title] };
    });
  };

  const closeOverlay = useCallback(() => setOverlay(null), []);
  const kitFinding = overlay?.kind === 'kit' ? findingById.get(overlay.findingId) : undefined;
  const personaName = loaded?.source.kind === 'persona' ? firstName(loaded.source.persona) : null;

  return (
    // DECISION(reduced-motion): MotionConfig "user" turns transform/layout animations into
    // instant changes for prefers-reduced-motion, keeping opacity fades. Components also
    // read useReducedMotion() where they pick travel distances.
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-svh flex-col">
        <Header step={step} reachable={reachable} onNavigate={go} onPrivacy={() => setOverlay({ kind: 'privacy' })} />
        <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo({ top: 0 })}>
          <motion.main
            key={step}
            className="flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
          >
            {step === 'landing' && (
              <Landing hero={hero} onTrySample={() => go('input')} onFiles={handleFiles} onOpenHero={openHeroResults} />
            )}
            {step === 'input' && (
              <InputScreen
                personas={samplePersonas}
                loaded={loaded}
                recurringCount={analysis.recurring.length}
                errors={uploadErrors}
                busy={busy}
                onPickPersona={pickPersona}
                onFiles={handleFiles}
                onContinue={continueFromInput}
              />
            )}
            {step === 'quiz' && quizEstimate && (
              <QuizScreen
                questions={questions}
                answers={answers}
                onChange={setAnswers}
                estimate={{ low: quizEstimate.annualLow, high: quizEstimate.annualHigh }}
                prefilledFrom={personaName}
                onSubmit={() => {
                  setProfile(answers);
                  go('results');
                }}
                onSkip={() => {
                  setAnswers({});
                  setProfile({});
                  go('results');
                }}
                onBack={() => go('input')}
              />
            )}
            {step === 'results' && loaded && (
              <ResultsScreen
                analysis={analysis}
                loaded={loaded}
                txById={txById}
                rowCount={transactions.length}
                doneFor={doneFor}
                plus={plus}
                freeKitId={freeKitId}
                onOpenKit={openKit}
                onOpenStatement={() => setOverlay({ kind: 'statement' })}
                onEditAnswers={questions.length > 0 ? () => go('quiz') : null}
                onStartOver={startOver}
              />
            )}
          </motion.main>
        </AnimatePresence>
        <Footer onPrivacy={() => setOverlay({ kind: 'privacy' })} />
      </div>

      <AnimatePresence>
        {overlay?.kind === 'statement' && loaded && (
          <StatementDrawer
            key="statement"
            transactions={transactions}
            analysis={analysis}
            edited={transactions !== loaded.transactions}
            onUpdate={updateTx}
            onDelete={deleteTx}
            onAdd={addTx}
            onReset={() => setTransactions(loaded.transactions)}
            onClose={closeOverlay}
          />
        )}
        {overlay?.kind === 'kit' && kitFinding && (
          <KitSheet
            key={`kit:${kitFinding.id}`}
            finding={kitFinding}
            done={kits[kitFinding.id] ?? []}
            onToggle={(title) => toggleStep(kitFinding.id, title)}
            onClose={closeOverlay}
          />
        )}
        {overlay?.kind === 'paywall' && (
          <Paywall
            key="paywall"
            onUnlock={() => {
              setPlus(true);
              setOverlay({ kind: 'kit', findingId: overlay.pendingFindingId });
            }}
            onClose={closeOverlay}
          />
        )}
        {overlay?.kind === 'privacy' && (
          <PrivacyPanel
            key="privacy"
            onClear={() => {
              clearSaved();
              setKits({});
              setFreeKitId(null);
              setPlus(false);
            }}
            onClose={closeOverlay}
          />
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
