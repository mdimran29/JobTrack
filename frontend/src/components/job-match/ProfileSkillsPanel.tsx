import { useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Field } from '../ui/Field';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { getErrorMessage } from '../../api/axios';

export const ProfileSkillsPanel = () => {
  const { user, updateProfile } = useAuth();
  const { show } = useToast();
  const [editing, setEditing] = useState(() => (user?.skills.length ?? 0) === 0);
  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [skillInput, setSkillInput] = useState('');
  const [years, setYears] = useState<string>(user?.yearsOfExperience?.toString() ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SKILL_DELIMITER_PATTERN = /[,;\n\t]/;

  // Splits on commas/semicolons/newlines/tabs, but only at bracket depth 0 —
  // "Foundry (unit, fuzz, invariant)" stays one skill instead of shattering
  // on the commas inside the parentheses.
  const splitSkillsText = (raw: string): string[] => {
    const segments: string[] = [];
    let current = '';
    let depth = 0;

    for (const char of raw) {
      if (char === '(' || char === '[') {
        depth += 1;
      } else if (char === ')' || char === ']') {
        depth = Math.max(0, depth - 1);
      }

      if (depth === 0 && SKILL_DELIMITER_PATTERN.test(char)) {
        segments.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    segments.push(current);

    return segments.map((s) => s.trim()).filter(Boolean);
  };

  const addSkillsFromText = (raw: string) => {
    const parsed = splitSkillsText(raw);
    if (parsed.length === 0) return;
    setSkills((prev) => {
      const next = [...prev];
      for (const skill of parsed) {
        if (!next.includes(skill)) next.push(skill);
      }
      return next;
    });
  };

  const removeSkill = (skill: string) => setSkills(skills.filter((s) => s !== skill));

  const startEditing = () => {
    setSkills(user?.skills ?? []);
    setYears(user?.yearsOfExperience?.toString() ?? '');
    setError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setError(null);
    const parsedYears = Number(years);
    if (skills.length === 0) {
      setError('Add at least one skill');
      return;
    }
    if (years.trim() === '' || !Number.isInteger(parsedYears) || parsedYears < 0 || parsedYears > 60) {
      setError('Enter a valid number of years (0-60)');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ skills, yearsOfExperience: parsedYears });
      show('Profile updated');
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (!editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <Button variant="ghost" size="sm" onClick={startEditing}>
            Edit
          </Button>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {(user?.skills ?? []).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-text-secondary"
              >
                {skill}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-text-secondary">
            {user?.yearsOfExperience} years of experience
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <Field
          label="Skills"
          htmlFor="skillInput"
          hint="Press Enter to add a skill, or paste a comma/line-separated list to add several at once"
          required
        >
          {skills.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-text-secondary"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Remove ${skill}`}
                    className="text-text-tertiary hover:text-danger"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <Input
            id="skillInput"
            placeholder="e.g. Node.js, TypeScript, PostgreSQL — press Enter or paste a list"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkillsFromText(skillInput);
                setSkillInput('');
              }
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text');
              if (SKILL_DELIMITER_PATTERN.test(pasted)) {
                e.preventDefault();
                addSkillsFromText(pasted);
                setSkillInput('');
              }
            }}
          />
        </Field>
        <Field label="Years of experience" htmlFor="years" required>
          <Input
            id="years"
            type="number"
            min={0}
            max={60}
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </Field>
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} isLoading={isSaving}>
            Save
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
