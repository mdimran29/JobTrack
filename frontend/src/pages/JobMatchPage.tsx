import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { ProfileSkillsPanel } from '../components/job-match/ProfileSkillsPanel';
import { JobMatchForm } from '../components/job-match/JobMatchForm';
import { MatchScoreGauge } from '../components/job-match/MatchScoreGauge';
import { SkillBadgeList } from '../components/job-match/SkillBadgeList';
import { ExperienceMatchCard } from '../components/job-match/ExperienceMatchCard';
import { ProjectSuggestionsCard } from '../components/job-match/ProjectSuggestionsCard';
import { RecommendationCard } from '../components/job-match/RecommendationCard';
import { useAnalyzeJobMatch } from '../hooks/useJobMatch';
import { getErrorMessage } from '../api/axios';
import { useToast } from '../components/ui/Toast';
import { JobMatchFormValues } from '../lib/schemas';
import { AnalyzeJobPayload } from '../api/job-match.api';
import { AtsResult, resumeToolsApi } from '../api/resume-tools.api';

const ResultSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="mx-auto h-40 w-40 rounded-full bg-border/60" />
    <div className="h-28 rounded-[var(--radius-card)] bg-border/60" />
    <div className="h-28 rounded-[var(--radius-card)] bg-border/60" />
  </div>
);

export const JobMatchPage = () => {
  const { show } = useToast();
  const { mutate, data, isPending, isError, error } = useAnalyzeJobMatch();
  const [lastValues, setLastValues] = useState<AnalyzeJobPayload | null>(null);
  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);
  const [toolLoading, setToolLoading] = useState<string | null>(null);

  const handleSubmit = (values: JobMatchFormValues & { resumeFile?: File }) => {
    setLastValues(values);
    mutate(values);
  };

  const runTool = async (name: string, action: () => Promise<void>) => {
    setToolLoading(name);
    try {
      await action();
    } catch (toolError) {
      show(getErrorMessage(toolError, 'Could not complete this resume tool'), 'error');
    } finally {
      setToolLoading(null);
    }
  };

  return (
    <div>
      <PageHeader title="Job Match" description="See how a job description lines up with your profile." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <ProfileSkillsPanel />

          <Card>
            <CardBody>
              <JobMatchForm onSubmit={handleSubmit} isSubmitting={isPending} />
            </CardBody>
          </Card>
        </div>

        <div>
          {isPending && <ResultSkeleton />}

          {isError && (
            <ErrorState
              message={getErrorMessage(error)}
              onRetry={lastValues ? () => mutate(lastValues) : undefined}
            />
          )}

          {!isPending && !isError && !data && (
            <EmptyState
              title="No analysis yet"
              description="Add a job description and optionally upload your resume to see your match percentage."
            />
          )}

          {data && !isPending && !isError && (
            <div className="space-y-6">
              <Card>
                <CardBody className="flex flex-col items-center gap-4">
                  <MatchScoreGauge score={data.overallScore} />
                  <RecommendationCard recommendation={data.recommendation} overallScore={data.overallScore} />
                </CardBody>
              </Card>

              <Card>
                <CardBody className="space-y-4">
                  <div>
                    <p className="font-display text-[15px] font-semibold text-text-primary">
                      Resume overview
                    </p>
                    <p className="mt-1 text-[13px] text-text-secondary">
                      {data.candidateCurrentRole}
                      {data.candidateExperienceYears !== null &&
                        ` · ${data.candidateExperienceYears} years of experience`}
                    </p>
                  </div>
                  <p className="text-[13px] leading-6 text-text-secondary">
                    {data.relevantExperienceSummary}
                  </p>
                  {data.resumeStrengths.length > 0 && (
                    <SkillBadgeList title="Resume strengths" skills={data.resumeStrengths} variant="matched" />
                  )}
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <p className="font-display text-[15px] font-semibold text-text-primary">
                      Skills found in your resume
                    </p>
                    <span className="text-[12px] text-text-tertiary">
                      {data.candidateSkills.length} detected
                    </span>
                  </div>
                  <SkillBadgeList
                    title="Extracted skills"
                    skills={data.candidateSkills}
                    variant="matched"
                    emptyMessage="No skills were detected in the uploaded resume."
                  />
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <p className="font-display text-[15px] font-semibold text-text-primary">Skills Match</p>
                    <span className="font-display text-lg font-semibold tabular-nums text-text-primary">
                      {data.skillsScore}%
                    </span>
                  </div>
                  <SkillBadgeList title="Matched skills" skills={data.matchedSkills} variant="matched" />
                  <SkillBadgeList
                    title="Missing skills"
                    skills={data.missingSkills}
                    variant="missing"
                    emptyMessage="None — you cover every required skill."
                  />
                </CardBody>
              </Card>

              {(data.preferredSkillsMatched.length > 0 || data.preferredSkillsMissing.length > 0) && (
                <Card>
                  <CardBody className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-[15px] font-semibold text-text-primary">
                        Preferred Skills
                      </p>
                      <span className="font-display text-lg font-semibold tabular-nums text-text-primary">
                        {data.preferredSkillsScore}%
                      </span>
                    </div>
                    <SkillBadgeList
                      title="You have"
                      skills={data.preferredSkillsMatched}
                      variant="matched"
                      emptyMessage="None matched"
                    />
                    <SkillBadgeList
                      title="Nice to have"
                      skills={data.preferredSkillsMissing}
                      variant="missing"
                      emptyMessage="None"
                    />
                  </CardBody>
                </Card>
              )}

              <ExperienceMatchCard score={data.experienceScore} reasoning={data.experienceReasoning} />

              {data.resumeRecommendations.length > 0 && (
                <Card>
                  <CardBody className="space-y-3">
                    <div>
                      <p className="font-display text-[15px] font-semibold text-text-primary">
                        Improve your resume for this role
                      </p>
                      <p className="mt-1 text-[13px] text-text-secondary">
                        Practical changes that can strengthen your match.
                      </p>
                    </div>
                    <ol className="space-y-2">
                      {data.resumeRecommendations.map((recommendation, index) => (
                        <li key={recommendation} className="flex gap-3 text-[13px] text-text-secondary">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-50 text-[11px] font-semibold text-accent-700">
                            {index + 1}
                          </span>
                          <span>{recommendation}</span>
                        </li>
                      ))}
                    </ol>
                  </CardBody>
                </Card>
              )}

              {data.resumeAdditions.length > 0 && (
                <Card>
                  <CardBody className="space-y-3">
                    <div>
                      <p className="font-display text-[15px] font-semibold text-text-primary">
                        What to add to your resume
                      </p>
                      <p className="mt-1 text-[13px] text-text-secondary">
                        Add these details when they accurately reflect your experience.
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {data.resumeAdditions.map((addition) => (
                        <li key={addition} className="flex gap-3 text-[13px] text-text-secondary">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                          <span>{addition}</span>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              )}

              <ProjectSuggestionsCard items={data.suggestedProjectTypes} />

              {lastValues?.resumeFile && (
                <Card>
                  <CardBody className="space-y-4">
                    <div>
                      <p className="font-display text-[15px] font-semibold text-text-primary">Resume tools</p>
                      <p className="mt-1 text-[13px] text-text-secondary">
                        Generate job-specific edits from the same uploaded resume.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        isLoading={toolLoading === 'ats'}
                        onClick={() => runTool('ats', async () => setAtsResult(await resumeToolsApi.ats(lastValues.resumeFile!, lastValues.jobDescription)))}
                      >
                        Check ATS compatibility
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        isLoading={toolLoading === 'summary'}
                        onClick={() => runTool('summary', async () => setGeneratedSummary((await resumeToolsApi.summary(lastValues.resumeFile!, lastValues.companyName, lastValues.jobTitle, lastValues.jobDescription)).summary))}
                      >
                        Generate summary
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        isLoading={toolLoading === 'cover-letter'}
                        onClick={() => runTool('cover-letter', async () => setGeneratedCoverLetter((await resumeToolsApi.coverLetter(lastValues.resumeFile!, lastValues.companyName, lastValues.jobTitle, lastValues.jobDescription)).coverLetter))}
                      >
                        Generate cover letter
                      </Button>
                    </div>
                    {atsResult && (
                      <div className="space-y-2 rounded-[var(--radius-control)] bg-canvas p-3 text-[13px]">
                        <div className="flex items-center justify-between font-semibold">
                          <span>ATS score</span><span>{atsResult.score}%</span>
                        </div>
                        <p className="text-text-secondary">{atsResult.verdict}</p>
                        {atsResult.missingKeywords.length > 0 && <p className="text-text-secondary"><strong>Missing keywords:</strong> {atsResult.missingKeywords.join(', ')}</p>}
                      </div>
                    )}
                    {generatedSummary && <div className="rounded-[var(--radius-control)] bg-canvas p-3 text-[13px] leading-6 text-text-secondary"><strong className="text-text-primary">Suggested summary:</strong> {generatedSummary}</div>}
                    {generatedCoverLetter && <div className="whitespace-pre-line rounded-[var(--radius-control)] bg-canvas p-3 text-[13px] leading-6 text-text-secondary"><strong className="text-text-primary">Cover letter:</strong>{`\n${generatedCoverLetter}`}</div>}
                  </CardBody>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
