import { Card, CardBody, CardHeader, CardTitle } from '../ui/Card';

interface ExperienceMatchCardProps {
  score: number;
  reasoning: string;
}

export const ExperienceMatchCard = ({ score, reasoning }: ExperienceMatchCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Experience Match</CardTitle>
      <span className="font-display text-lg font-semibold tabular-nums text-text-primary">{score}%</span>
    </CardHeader>
    <CardBody>
      <p className="text-[13px] text-text-secondary">{reasoning}</p>
    </CardBody>
  </Card>
);
