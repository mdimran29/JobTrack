import { Card, CardBody, CardHeader, CardTitle } from '../ui/Card';

export const ProjectSuggestionsCard = ({ items }: { items: string[] }) => {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects to Highlight</CardTitle>
      </CardHeader>
      <CardBody>
        <ul className="list-disc space-y-1.5 pl-4 text-[13px] text-text-secondary">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
};
