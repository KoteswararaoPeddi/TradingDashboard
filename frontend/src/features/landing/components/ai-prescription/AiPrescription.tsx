import { BrainCircuit, Check, Clock, FileText, Mic, PencilLine, Sparkles } from "lucide-react"

import { Typography } from "@components/ui/typography"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs"
import { SMART_BENEFITS, VOICE_BENEFITS } from "../../data/ai-prescription.data"
import { AiInfoPanel } from "./AiInfoPanel"
import { AiSmartMock } from "./AiSmartMock"
import { AiVoiceMock } from "./AiVoiceMock"

const SMART_ICONS = [BrainCircuit, FileText, PencilLine, Clock]
const VOICE_ICONS = [Mic, FileText, Check, Clock]

export function AiPrescription() {
  return (
    <section
      id="ai-rx"
      className="relative overflow-hidden px-[5%] py-24"
      style={{
        background:
          "linear-gradient(180deg, #0f0a1e 0%, color-mix(in srgb, var(--color-violet-950) 55%, #000) 55%, var(--color-neutral-900) 100%)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-28 left-1/2 h-[500px] w-[900px] -translate-x-1/2"
        style={{
          background: "radial-gradient(ellipse, color-mix(in srgb, var(--color-violet-600) 18%, transparent) 0%, transparent 65%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-6xl">
        <Tabs defaultValue="smart">
          <div className="mb-14 flex flex-col items-center justify-between gap-8 lg:flex-row lg:items-end">
            <div className="text-center lg:text-left">
              <Typography
                as="span"
                variant="body-sm"
                weight="bold"
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-600/30 bg-violet-600/15 px-4 py-2 uppercase tracking-widest text-violet-300"
              >
                <BrainCircuit className="size-4" /> AI-powered innovation
              </Typography>
              <Typography
                as="h2"
                variant="display-lg"
                weight="extrabold"
                className="mb-4 leading-tight tracking-tight text-primary-fg lg:text-display-xl"
              >
                Prescription,
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, var(--color-violet-400), var(--color-blue-400))",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  reimagined by AI
                </span>
              </Typography>
              <Typography variant="body-lg" className="mx-auto max-w-xl leading-relaxed text-primary-fg/70 lg:mx-0">
                Eliminate manual writing fatigue. Let AI draft complete prescriptions in seconds, or
                simply speak, and watch words become clinical records.
              </Typography>
            </div>

            <TabsList className="group-data-horizontal/tabs:h-auto w-full shrink-0 gap-2 rounded-2xl border border-surface/10 bg-surface/5 p-1.5 lg:w-fit">
              <TabsTrigger
                value="smart"
                className="h-auto flex-1 gap-2 rounded-xl px-2.5 py-3 text-body-sm font-semibold text-primary-fg/45 hover:text-primary-fg/75 data-active:bg-transparent data-active:bg-linear-to-br data-active:from-violet-600 data-active:to-violet-700 data-active:text-primary-fg data-active:shadow-lg data-active:shadow-violet-600/40 lg:flex-none lg:gap-3.5 lg:px-7 lg:py-3.5 lg:text-body-base"
              >
                <Sparkles className="size-4" /> Smart Prescription
              </TabsTrigger>
              <TabsTrigger
                value="voice"
                className="h-auto flex-1 gap-2 rounded-xl px-2.5 py-3 text-body-sm font-semibold text-primary-fg/45 hover:text-primary-fg/75 data-active:bg-transparent data-active:bg-linear-to-br data-active:from-blue-500 data-active:to-blue-600 data-active:text-primary-fg data-active:shadow-lg data-active:shadow-blue-500/40 lg:flex-none lg:gap-3.5 lg:px-7 lg:py-3.5 lg:text-body-base"
              >
                <Mic className="size-4" /> Voice Prescription
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="smart" className="grid items-start gap-10 lg:grid-cols-2">
            <AiInfoPanel
              label="Smart prescription"
              heading={
                <>
                  AI drafts prescriptions.
                  <br />
                  Doctors just review.
                </>
              }
              body="MediNex+ analyses patient history, vitals, and diagnosis in real time to auto-generate accurate prescriptions, reducing the doctor's writing load by up to 80% while maintaining clinical precision."
              benefits={SMART_BENEFITS}
              icons={SMART_ICONS}
              accent="text-violet-400"
              iconWell="bg-violet-600/20 text-violet-300"
            />
            <AiSmartMock />
          </TabsContent>

          <TabsContent value="voice" className="grid items-start gap-10 lg:grid-cols-2">
            <AiInfoPanel
              label="Voice prescription"
              heading={
                <>
                  Just speak.
                  <br />
                  We do the writing.
                </>
              }
              body="Dictate naturally while you examine the patient. MediNex+ transcribes speech and structures it into an accurate prescription in real time, ready for a one-tap confirm."
              benefits={VOICE_BENEFITS}
              icons={VOICE_ICONS}
              accent="text-blue-400"
              iconWell="bg-blue-500/20 text-blue-300"
            />
            <AiVoiceMock />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
